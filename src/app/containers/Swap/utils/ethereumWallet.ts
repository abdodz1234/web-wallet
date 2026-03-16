/**
 * Ethereum wallet connection utilities
 * Uses metamask-extension-provider for extension-to-extension communication
 */

import createMetaMaskProvider from 'metamask-extension-provider';
import { ethers } from 'ethers';

export interface EthereumWallet {
  address: string;
  chainId: number;
  isConnected: boolean;
}

let metaMaskProvider: any = null;

/**
 * Reset the MetaMask provider (used when connection is lost)
 */
function resetMetaMaskProvider() {
  if (metaMaskProvider) {
    try {
      // Remove all listeners before resetting
      metaMaskProvider.removeAllListeners();
    } catch (e) {
      // Ignore errors when removing listeners
    }
    metaMaskProvider = null;
  }
}

/**
 * Check if an error is a disconnection error
 */
function isDisconnectionError(error: any): boolean {
  if (!error) return false;
  const message = error?.message || error?.toString() || '';
  const errorMessage = message.toLowerCase();
  return (
    errorMessage.includes('disconnected')
    || errorMessage.includes('lost connection')
    || errorMessage.includes('portduplexstream')
    || errorMessage.includes('port stream')
    || error?.code === 4900 // Provider disconnected
    || error?.code === 4901 // User rejected
  );
}

/**
 * Get or create MetaMask provider instance
 */
export function getMetaMaskProvider() {
  if (!metaMaskProvider) {
    try {
      metaMaskProvider = createMetaMaskProvider();

      // Handle connection errors and disconnections
      metaMaskProvider.on('error', (error: any) => {
        if (isDisconnectionError(error)) {
          // Silently handle disconnection errors - they're expected
          resetMetaMaskProvider();
        } else {
          // eslint-disable-next-line no-console
          console.warn('MetaMask provider error:', error);
        }
      });

      // Handle disconnect events
      metaMaskProvider.on('disconnect', () => {
        // Silently handle disconnections - they're expected
        resetMetaMaskProvider();
      });

      // Handle close events (if available)
      if (typeof metaMaskProvider.on === 'function') {
        metaMaskProvider.on('close', () => {
          resetMetaMaskProvider();
        });
      }

      // Suppress unhandled errors from the provider's internal stream
      const originalEmit = metaMaskProvider.emit;
      if (originalEmit) {
        metaMaskProvider.emit = function emitWrapper(event: string, ...args: any[]) {
          if (event === 'error' && args[0] && isDisconnectionError(args[0])) {
            // Suppress disconnection errors from being emitted
            resetMetaMaskProvider();
            return false;
          }
          return originalEmit.apply(this, [event, ...args]);
        };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create MetaMask provider:', error);
      return null;
    }
  }
  return metaMaskProvider;
}

/**
 * Get ethers.js provider for MetaMask
 */
export function getEthersProvider(): ethers.providers.Web3Provider | null {
  const provider = getMetaMaskProvider();
  if (!provider) {
    return null;
  }
  return new ethers.providers.Web3Provider(provider, 'any');
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  const provider = getMetaMaskProvider();
  return provider !== null;
}

/**
 * Safe wrapper for provider requests that handles disconnection errors
 */
async function safeProviderRequest(provider: any, method: string, params?: any[]): Promise<any> {
  try {
    const result = await provider.request({ method, params });
    return result;
  } catch (error: any) {
    if (isDisconnectionError(error)) {
      resetMetaMaskProvider();
      throw new Error('MetaMask connection lost. Please try again.');
    }
    throw error;
  }
}

/**
 * Internal function to switch MetaMask to Arbitrum network (42161)
 */
export async function switchToNetwork(targetChainId: number): Promise<void> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error('MetaMask is not installed or not available');
  }

  const chainIdHex = `0x${targetChainId.toString(16)}`;
  const currentChainId = await safeProviderRequest(provider, 'eth_chainId');

  if (currentChainId === chainIdHex) {
    return;
  }

  try {
    await safeProviderRequest(provider, 'wallet_switchEthereumChain', [{ chainId: chainIdHex }]);
  } catch (switchError: any) {
    if (switchError?.code === 4902 && targetChainId === 42161) {
      try {
        await safeProviderRequest(provider, 'wallet_addEthereumChain', [
          {
            chainId: chainIdHex,
            chainName: 'Arbitrum One',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://arb1.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://arbiscan.io'],
          },
        ]);
      } catch (addError) {
        // eslint-disable-next-line no-console
        console.error('Failed to add Arbitrum network:', addError);
        throw new Error('Failed to add Arbitrum network to MetaMask');
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Switch MetaMask to Arbitrum network (42161)
 */
export async function switchToArbitrumNetwork(): Promise<void> {
  return switchToNetwork(42161);
}

/**
 * Connect to MetaMask wallet
 */
export async function connectMetaMask(preferredChainId?: number): Promise<EthereumWallet | null> {
  // Reset provider if it exists to ensure fresh connection
  resetMetaMaskProvider();

  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error('MetaMask is not installed or not available');
  }

  try {
    // Request account access
    const accounts = await safeProviderRequest(provider, 'eth_requestAccounts');

    if (!accounts || accounts.length === 0) {
      return null;
    }

    if (preferredChainId) {
      try {
        await switchToNetwork(preferredChainId);
      } catch (switchError: any) {
        // Log but don't fail the connection if network switch fails
        // eslint-disable-next-line no-console
        console.warn('Failed to switch network:', switchError);
      }
    }

    const chainId = await safeProviderRequest(provider, 'eth_chainId');

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isConnected: true,
    };
  } catch (error: any) {
    // Only log non-disconnection errors
    if (!isDisconnectionError(error)) {
      // eslint-disable-next-line no-console
      console.error('Failed to connect to MetaMask:', error);
    }

    // Reset provider on connection failure
    if (isDisconnectionError(error)) {
      resetMetaMaskProvider();
    }

    throw error;
  }
}

/**
 * Get current MetaMask account
 */
export async function getMetaMaskAccount(): Promise<EthereumWallet | null> {
  let provider = getMetaMaskProvider();
  if (!provider) {
    return null;
  }

  try {
    const accounts = await safeProviderRequest(provider, 'eth_accounts');
    if (!accounts || accounts.length === 0) {
      return null;
    }

    const chainId = await safeProviderRequest(provider, 'eth_chainId');

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isConnected: true,
    };
  } catch (error: any) {
    // Only log non-disconnection errors
    if (!isDisconnectionError(error)) {
      // eslint-disable-next-line no-console
      console.warn('Failed to get MetaMask account:', error);
    }

    // Reset provider on connection errors and try to recreate
    if (isDisconnectionError(error)) {
      resetMetaMaskProvider();
      // Try once more with a fresh provider
      provider = getMetaMaskProvider();
      if (provider) {
        try {
          const accounts = await safeProviderRequest(provider, 'eth_accounts');
          if (accounts && accounts.length > 0) {
            const chainId = await safeProviderRequest(provider, 'eth_chainId');
            return {
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              isConnected: true,
            };
          }
        } catch (retryError) {
          // Only log non-disconnection errors
          if (!isDisconnectionError(retryError)) {
            // eslint-disable-next-line no-console
            console.error('Retry failed:', retryError);
          }
        }
      }
    }

    return null;
  }
}

/**
 * Format Ethereum address (remove network indicator if present)
 */
export function formatEthereumAddress(address: string): string {
  // Remove network indicators like "eth" or "arb" from the end
  const indicators = ['eth', 'arb', 'arbsep', 'sep'];
  const found = indicators.find((indicator) => address.toLowerCase().endsWith(indicator));
  if (found) {
    return address.slice(0, -found.length);
  }
  return address;
}

/**
 * Listen to account changes
 */
export function onAccountsChanged(callback: (accounts: string[]) => void): () => void {
  const provider = getMetaMaskProvider();
  if (!provider) {
    return () => {};
  }

  provider.on('accountsChanged', callback);

  return () => {
    provider.removeListener('accountsChanged', callback);
  };
}

/**
 * Listen to chain changes
 */
export function onChainChanged(callback: (chainId: string) => void): () => void {
  const provider = getMetaMaskProvider();
  if (!provider) {
    return () => {};
  }

  provider.on('chainChanged', callback);

  return () => {
    provider.removeListener('chainChanged', callback);
  };
}
