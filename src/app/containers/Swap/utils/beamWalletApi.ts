import {
  postMessage, invokeContract, createInternalAppAPI, getInternalAppAPI,
} from '@app/core/api';
import { RPCMethod } from '@app/core/types';
import { BEAM_ADDRESS_LENGTH } from '../constants';

/**
 * Direct Beam wallet API calls (without utils.js since we're already in the wallet)
 */

export interface BeamBridgeAddress {
  address: string;
  networkIndicator: string;
}

export interface SendToParams {
  amount: number;
  address: string; // Beam address (66 hex chars) without network indicator
  fee: number;
  decimals: number;
  cid: string; // Contract ID
}

// Contract IDs by network (from bridge-app)
export const CID_BY_NETWORK: Record<string, string> = {
  1: 'e63bd26ca5b226558686dd191122a8e5d6861a97597db9f40bda48aef6dbe835', // Ethereum
  42161: 'd2505213880d87a4747d23036a02d8919be211d26266cd6f3e591536e44f27fe', // Arbitrum
};

const SWAP_APP_URL = 'beam-swap-internal';
const SWAP_APP_NAME = 'BEAM Swap';

let wasmBytes: Uint8Array | null = null;

/**
 * Load pipe_app.wasm and create app API for contract invocation
 */
/**
 * Format Beam bridge address (remove network indicator)
 */
export function formatBeamAddress(address: string): string {
  // Remove network indicators like "eth" or "arb" from the end
  const indicators = ['eth', 'arb', 'arbsep', 'sep'];
  const foundPrefix = indicators.find((indicator) => address.startsWith(indicator));
  if (foundPrefix) {
    return address.slice(foundPrefix.length);
  }

  const found = indicators.find((indicator) => address.endsWith(indicator));
  if (found) {
    return address.slice(0, -found.length);
  }
  return address;
}

/**
 * Build a Beam bridge address with a network indicator prefix.
 */
export function buildBeamBridgeAddress(beamAddress: string, indicator: string): string {
  const trimmed = beamAddress.trim();
  if (!trimmed || !indicator) {
    return trimmed;
  }
  return `${indicator}${trimmed}`;
}

async function getSwapAppAPI(): Promise<{ wasmBytes: Uint8Array }> {
  // Return cached if available
  if (wasmBytes) {
    return { wasmBytes };
  }

  // Load pipe_app.wasm from assets
  // The WASM file is in the extension's assets folder (copied by webpack)
  try {
    const wasmUrl = typeof chrome !== 'undefined' && chrome.runtime
      ? chrome.runtime.getURL('assets/pipe_app.wasm')
      : '/assets/pipe_app.wasm';

    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch pipe_app.wasm: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    wasmBytes = new Uint8Array(buffer);
    return { wasmBytes };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load pipe_app.wasm:', error);
    throw error;
  }
}

/**
 * Load public key for a contract using pipe_app.wasm
 */
export async function loadPublicKey(cid: string): Promise<string> {
  try {
    // Ensure app API is created before invoking contract
    await createInternalAppAPI(SWAP_APP_URL, SWAP_APP_NAME);

    const { wasmBytes: bytes } = await getSwapAppAPI();

    if (!bytes) {
      throw new Error('Failed to load pipe_app.wasm');
    }

    // Invoke contract to get public key using @core/api
    const contractInvoke = `role=user,action=get_pk,cid=${cid}`;

    const result = await invokeContract({
      args: contractInvoke,
      contract: Array.from(bytes),
      create_tx: false,
      appurl: SWAP_APP_URL,
      appname: SWAP_APP_NAME,
    });

    // Parse the result
    if (result && result.output) {
      try {
        const shaderAnswer = JSON.parse(result.output);
        if (shaderAnswer.error) {
          throw new Error(shaderAnswer.error);
        }
        if (shaderAnswer.pubkey) {
          return shaderAnswer.pubkey;
        }
        throw new Error('No pubkey in result');
      } catch (parseError: any) {
        throw new Error(`Failed to parse contract result: ${parseError.message || parseError}`);
      }
    }
    throw new Error('No output in result');
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to load public key:', error);
    throw error;
  }
}

/**
 * Send funds via bridge contract
 */
export async function sendTo(params: SendToParams): Promise<any> {
  const {
    amount, address, fee, decimals, cid,
  } = params;
  // Match bridge-app approach: calculate 10^decimals and multiply
  // Use string-based calculation to avoid precision issues with large numbers
  const decimalsNum = typeof decimals === 'number' ? decimals : parseInt(String(decimals), 10);

  // Calculate 10^decimals as a number (match bridge-app BigNumber.exponentiatedBy approach)
  // Use a loop to avoid Math.pow transpilation issues
  let expBy = 1;
  for (let i = 0; i < decimalsNum; i += 1) {
    expBy *= 10;
  }

  // Convert to numbers like bridge-app does (using BigNumber.times().toNumber() approach)
  // Multiply amount and fee by 10^decimals
  const finalAmount = Math.floor(amount * expBy);
  const relayerFee = Math.floor(fee * expBy);

  try {
    // Ensure app API is created before invoking contract
    await createInternalAppAPI(SWAP_APP_URL, SWAP_APP_NAME);

    const { wasmBytes: bytes } = await getSwapAppAPI();

    if (!bytes) {
      throw new Error('Failed to load pipe_app.wasm');
    }

    // Invoke contract to send funds using @core/api
    // Match bridge-app format: use numbers directly in the string
    const contractInvoke = [
      'role=user',
      'action=send',
      `cid=${cid}`,
      `amount=${finalAmount}`,
      `receiver=${address}`,
      `relayerFee=${relayerFee}`,
    ].join(',');

    const result = await invokeContract({
      args: contractInvoke,
      contract: Array.from(bytes),
      create_tx: false, // Don't create tx yet - we'll process it manually like bridge-app
      appurl: SWAP_APP_URL,
      appname: SWAP_APP_NAME,
    });

    // Match bridge-app's onMakeTx: process the raw_data to create the transaction
    // bridge-app calls: Utils.callApi('process_invoke_data', {data: full.result.raw_data})
    if (result && result.raw_data) {
      // Get the app API from internalAppAPIs (it's already created by invokeContract)
      const appApi = getInternalAppAPI(SWAP_APP_URL);
      if (appApi) {
        // Call process_invoke_data via app API (same as bridge-app's onMakeTx)
        const processRequest = {
          jsonrpc: '2.0',
          id: `process-${Date.now()}`,
          method: 'process_invoke_data',
          params: {
            data: result.raw_data,
          },
        };

        // Call via app API (same pattern as bridge-app's Utils.callApi)
        appApi.callWalletApi(JSON.stringify(processRequest));
      } else {
        // eslint-disable-next-line no-console
        console.warn('App API not found for processing transaction data');
      }
    }

    return result;
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Failed to send via bridge contract:', error);
    throw error;
  }
}

/**
 * Load incoming transactions
 */
export async function loadIncoming(): Promise<any[]> {
  // Contract invocation to view incoming transactions
  return [];
}

/**
 * Get wallet address (public key) from bridge contract
 * Uses pipe_app.wasm to get the public key from the contract
 */
export async function getWalletAddress(networkId: string = '42161'): Promise<string> {
  try {
    const cid = CID_BY_NETWORK[networkId];
    if (!cid) {
      throw new Error(`Unknown network ID: ${networkId}`);
    }

    // Get public key from contract using pipe_app.wasm
    const pubkey = await loadPublicKey(cid);

    if (!pubkey) {
      throw new Error('Failed to get public key from contract');
    }

    // Format address to remove network indicator if present
    return formatBeamAddress(pubkey);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get wallet address from contract:', error);
    // Fallback to regular address list if contract fails
    try {
      const addresses = await postMessage(RPCMethod.GetAddressList, {});
      if (addresses && addresses.length > 0) {
        return formatBeamAddress(addresses[0].address);
      }
    } catch (fallbackError) {
      // eslint-disable-next-line no-console
      console.error('Fallback address fetch also failed:', fallbackError);
    }
    return '';
  }
}

/**
 * Parse bridge address to extract Beam address and network indicator
 */
export function parseBridgeAddress(fullAddress: string): BeamBridgeAddress | null {
  const indicators = ['eth', 'arb', 'arbsep', 'sep'];
  const trimmed = fullAddress.trim();

  if (!trimmed) {
    return null;
  }

  // Prefer prefix-style indicators (eth + beam address)
  const prefix = indicators.find((indicator) => trimmed.startsWith(indicator));
  if (prefix) {
    const address = trimmed.slice(prefix.length);
    if (address.length === BEAM_ADDRESS_LENGTH && /^[0-9a-fA-F]+$/.test(address)) {
      return { address, networkIndicator: prefix };
    }
  }

  // Fallback to suffix-style indicators for backward compatibility
  const suffix = indicators.find((indicator) => trimmed.endsWith(indicator));
  if (suffix) {
    const address = trimmed.slice(0, -suffix.length);
    if (address.length === BEAM_ADDRESS_LENGTH && /^[0-9a-fA-F]+$/.test(address)) {
      return { address, networkIndicator: suffix };
    }
  }

  // If no indicator, assume it's just the Beam address
  if (trimmed.length === BEAM_ADDRESS_LENGTH && /^[0-9a-fA-F]+$/.test(trimmed)) {
    return {
      address: trimmed,
      networkIndicator: '',
    };
  }

  return null;
}
