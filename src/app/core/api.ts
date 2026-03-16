import * as extensionizer from 'extensionizer';
import NotificationManager from '@core/NotificationManager';
import WasmWallet from '@core/WasmWallet';
import { Asset, ExternalAppMethod } from '@core/types';
import { RemoteRequest } from '@app/core/types';
import {
  AddressData,
  ChangeData,
  RPCMethod,
  RemoteResponse,
  WalletStatus,
  Environment,
  CreateWalletParams,
  CreateAddressParams,
  SendTransactionParams,
  TransactionDetail,
  ExternalAppConnection,
} from './types';

const wallet = WasmWallet.getInstance();
const notificationManager = NotificationManager.getInstance();

let port;

let contentPort = null;
let notificationPort = null;
let connected = false;
let activeTab = null;

type BeamRpcRequestMessage = {
  type: 'BEAM_WALLET_RPC_REQUEST';
  version: 1;
  payload: {
    id: string;
    method: string;
    params?: any;
    appname?: string;
  };
};

type BeamRpcPushMessage = {
  type: 'BEAM_WALLET_RPC_PUSH';
  version: 1;
  payload: { json: string };
};

type BeamRpcErrorMessage = {
  type: 'BEAM_WALLET_RPC_ERROR';
  version: 1;
  payload: {
    id?: string;
    error: { code: number; message: string; data?: any };
  };
};

// Multiple tabs from the same origin should not overwrite each other (dnode did).
const externalRpcPortsByOrigin: Record<string, Set<chrome.runtime.Port>> = {};

function getSenderOrigin(sender: any): string | null {
  if (!sender) return null;
  if (typeof sender.origin === 'string' && sender.origin.length) return sender.origin;
  if (typeof sender.url === 'string' && sender.url.length) {
    try {
      return new URL(sender.url).origin;
    } catch {
      return null;
    }
  }
  return null;
}

function addExternalRpcPort(origin: string, p: chrome.runtime.Port) {
  if (!externalRpcPortsByOrigin[origin]) {
    externalRpcPortsByOrigin[origin] = new Set();
  }
  externalRpcPortsByOrigin[origin].add(p);
}

function removeExternalRpcPort(origin: string, p: chrome.runtime.Port) {
  externalRpcPortsByOrigin[origin]?.delete(p);
  if (externalRpcPortsByOrigin[origin]?.size === 0) {
    delete externalRpcPortsByOrigin[origin];
  }
}

function broadcastToOrigin(origin: string, msg: BeamRpcPushMessage | BeamRpcErrorMessage) {
  externalRpcPortsByOrigin[origin]?.forEach((p) => {
    try {
      p.postMessage(msg);
    } catch {
      // ignore dead port
    }
  });
}

// Forward async wallet callbacks to every tab for that origin
wallet.setExternalAppMessageHandler((appurl: string, json: string) => {
  const msg: BeamRpcPushMessage = {
    type: 'BEAM_WALLET_RPC_PUSH',
    version: 1,
    payload: { json },
  };
  broadcastToOrigin(appurl, msg);
});

export function getEnvironment(href = window.location.href) {
  const url = new URL(href);
  switch (url.pathname) {
    case '/popup.html':
      return Environment.POPUP;
    case '/page.html':
      return Environment.FULLSCREEN;
    case '/notification.html':
      return Environment.NOTIFICATION;
    default:
      return Environment.BACKGROUND;
  }
}

export function approveContractInfoRequest(req) {
  return wallet.notificationApproveInfo({ req });
}

export function rejectConnection() {
  return wallet.notificationAuthenticaticated({
    result: false,
  });
}

export function rejectContractInfoRequest(req) {
  return wallet.notificationRejectInfo({ req });
}

export function approveSendRequest(req) {
  return wallet.notificationApproveSend({ req });
}

export function rejectSendRequest(req) {
  return wallet.notificationRejectSend({ req });
}

export function approveConnection({
  apiver, apivermin, appname, appurl,
}) {
  return wallet.approveConnection({
    result: true,
    apiver,
    apivermin,
    appname,
    appurl,
  });
}

function handleConnect(remote) {
  port = remote;
  connected = true;
  // eslint-disable-next-line no-console
  console.log(`remote connected to "${port.name}"`);

  port.onDisconnect.addListener(() => {
    connected = false;
    return connected;
  });

  port.onMessage.addListener(({ params, action }: RemoteRequest) => {
    if (action !== undefined) {
      switch (action) {
        case 'connect':
          approveConnection(params);
          break;
        case 'connect_rejected':
          rejectConnection();
          break;
        case 'rejectSendRequest':
          rejectSendRequest(params);
          break;
        case 'approveSendRequest':
          approveSendRequest(params);
          break;
        case 'rejectContractInfoRequest':
          rejectContractInfoRequest(params);
          break;
        case 'approveContractInfoRequest':
          approveContractInfoRequest(params);
          break;
        default:
          break;
      }
    }
  });

  switch (port.name) {
    case Environment.NOTIFICATION: {
      const tabId = remote.sender.tab.id;
      notificationManager.openBeamTabsIDs[tabId] = true;
      activeTab = remote.sender.tab.id;
      notificationPort = remote;
      notificationPort.onDisconnect.addListener(() => {
        if (activeTab) {
          // notificationManager.closeTab(activeTab);
          activeTab = null;
          notificationManager.appname = ''; // TODO: check with reconnect
          notificationManager.openBeamTabsIDs = {};
        }
      });
      notificationPort.postMessage({ isRunning: wallet.isRunning(), notification: notificationManager.notification });
      break;
    }

    case Environment.CONTENT:
      NotificationManager.setPort(remote);
      {
        const origin = getSenderOrigin(remote.sender);
        if (!origin) break;
        addExternalRpcPort(origin, remote);

        remote.onDisconnect.addListener(() => {
          removeExternalRpcPort(origin, remote);
        });

        remote.onMessage.addListener((msg: BeamRpcRequestMessage) => {
          if (!msg || msg.type !== 'BEAM_WALLET_RPC_REQUEST' || msg.version !== 1) return;
          const {
            id, method, params, appname,
          } = msg.payload || {};
          if (!id || !method) return;

          // keep UI labeling consistent with previous behavior
          if (appname) {
            notificationManager.appname = appname;
          }

          try {
            const ok = wallet.callExternalWalletApi(origin, { id, method, params });
            if (!ok) {
              broadcastToOrigin(origin, {
                type: 'BEAM_WALLET_RPC_ERROR',
                version: 1,
                payload: {
                  id,
                  error: { code: -32000, message: 'BeamApi not connected for this site' },
                },
              });
            }
          } catch (e: any) {
            broadcastToOrigin(origin, {
              type: 'BEAM_WALLET_RPC_ERROR',
              version: 1,
              payload: {
                id,
                error: { code: -32001, message: e?.message || 'BeamApi call failed', data: e },
              },
            });
          }
        });
      }
      break;

    case Environment.CONTENT_REQ: {
      notificationManager.setReqPort(remote);
      contentPort = remote;
      contentPort.onMessage.addListener((msg) => {
        const origin = getSenderOrigin(remote.sender);
        if (!origin) return;

        if (wallet.isRunning() && !localStorage.getItem('locked')) {
          if (wallet.isConnectedSite({ appName: msg.appname, appUrl: origin })) {
            msg.appurl = origin;
            wallet.connectExternal(msg);
          } else if (msg.type === ExternalAppMethod.CreateBeamApi) {
            if (msg.is_reconnect && notificationManager.appname === msg.appname) {
              // eslint-disable-next-line
              notificationManager.openPopup();
            } else {
              notificationManager.openConnectNotification(msg, origin);
            }
          }
        } else {
          notificationManager.openAuthNotification(msg, origin);
        }
      });

      contentPort.onDisconnect.addListener((e) => {
        const origin = getSenderOrigin(e.sender);
        if (origin) {
          wallet.disconnectAppApi(origin);
        }
      });
      break;
    }
    default:
      break;
  }
}

export function initRemoteConnection() {
  extensionizer.runtime.onConnect.addListener(handleConnect);

  wallet.initContractInfoHandler((req, info, amounts, cb) => {
    wallet.initcontractInfoHandlerCallback(cb);
    notificationManager.openContractNotification(req, info, amounts);
  });

  wallet.initSendHandler((req, info, cb) => {
    wallet.initSendHandlerCallback(cb);
    notificationManager.openSendNotification(req, info);
  });
}

export function postMessage<T = any, P = unknown>(method: RPCMethod, params?: P): Promise<T> {
  return new Promise((resolve, reject) => {
    const target = wallet.send(method, params);
    const handler = (data: RemoteResponse) => {
      if (data.id === target) {
        if (data.error) {
          return reject(data.error);
        }
        return resolve(data.result);
      }
      return data;
    };
    wallet.setRemoteEventHandler(handler);
  });
}

export function convertTokenToJson(token: string) {
  return WasmWallet.convertTokenToJson(token);
}

export function startWallet(pass: string) {
  return wallet.start(pass);
}

export function deleteWallet(pass: string) {
  return wallet.deleteWallet(pass);
}

export function stopWallet() {
  return wallet.stop();
}

export function walletLocked() {
  return wallet.lockWallet();
}

export function createWallet(params: CreateWalletParams) {
  return wallet.create(params);
}

export function isAllowedWord(value: string) {
  return WasmWallet.isAllowedWord(value);
}

export function isAllowedSeed(value: string[]) {
  return WasmWallet.isAllowedSeed(value);
}

export function generateSeed() {
  return WasmWallet.generateSeed();
}

export function loadBackgroundLogs() {
  return WasmWallet.loadLogs();
}

export function loadConnectedSites() {
  return wallet.loadConnectedSites();
}

export function disconnectAllowedSite(params: ExternalAppConnection) {
  return wallet.removeConnectedSite(params);
}

export async function validateAddress(address: string): Promise<AddressData> {
  const result = await postMessage<AddressData>(RPCMethod.ValidateAddress, { address });
  const json = await convertTokenToJson(address);

  if (!json) {
    return result;
  }

  return {
    ...result,
    ...json,
  };
}

export function finishNotificationAuth(apiver: string, apivermin: string, appname: string, appurl: string) {
  return wallet.notificationAuthenticaticated({
    result: true,
    apiver,
    apivermin,
    appname,
    appurl,
  });
}

export interface CalculateChangeParams {
  amount: number;
  asset_id: number;
  is_push_transaction: boolean;
}

export function getWalletStatus() {
  return postMessage<WalletStatus>(RPCMethod.GetWalletStatus);
}

export function createAddress(params: CreateAddressParams) {
  return postMessage<string>(RPCMethod.CreateAddress, params);
}

export function getVersion() {
  return postMessage(RPCMethod.GetVersion);
}

export function calculateChange(params: CalculateChangeParams) {
  return postMessage<ChangeData>(RPCMethod.CalculateChange, params);
}

export function sendTransaction(params: SendTransactionParams) {
  return postMessage(RPCMethod.SendTransaction, params);
}

export function getTransactionStatus(txId: string) {
  return postMessage<TransactionDetail>(RPCMethod.TxStatus, { txId, rates: true });
}

export function exportPaymentProof(txId: string) {
  return postMessage(RPCMethod.ExportPaymentProof, { txId });
}

export function verifyPaymentProof(payment_proof: string) {
  return postMessage(RPCMethod.VerifyPaymentProof, { payment_proof });
}

export async function getAssetsInfo(asset_ids: number[]) {
  return Promise.all(asset_ids.map((asset_id) => postMessage<Asset>(RPCMethod.GetAssetInfo, { asset_id })));
}
export function getAssetList({ refresh }: { refresh: boolean }) {
  return postMessage<Asset[]>(RPCMethod.AssetsList, { refresh });
}

export interface InvokeContractParams {
  args: string;
  contract: number[];
  create_tx?: boolean;
  appurl?: string;
  appname?: string;
}

// Store pending contract calls by call ID
const pendingContractCalls: Map<
string,
{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}
> = new Map();

let internalCallId = 0;

// Store internal app APIs by appurl
const internalAppAPIs: Map<string, any> = new Map();

/**
 * Create an internal app API connection for contract invocations
 * This is required before calling invokeContract
 * Uses the same flow as external dApps via SDK
 */
export async function createInternalAppAPI(
  appurl: string,
  appname: string,
  apiver: string = '6.2',
  apivermin: string = '6.2',
): Promise<void> {
  // Check if already created
  if (internalAppAPIs.has(appurl)) {
    return;
  }

  // Create the app API connection with a handler for internal responses
  // Same pattern as SDK: createAppAPI -> setHandler -> callWalletApi
  const appApi = await (wallet as any).createAppAPI(apiver, apivermin, appurl, appname, (json: string) => {
    // Handler for API responses - same as SDK flow
    try {
      const response = JSON.parse(json);
      if (response.id && pendingContractCalls.has(String(response.id))) {
        const { resolve, reject } = pendingContractCalls.get(String(response.id))!;
        pendingContractCalls.delete(String(response.id));
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse API response:', e, json);
    }
  });

  // Store the app API for internal use
  internalAppAPIs.set(appurl, appApi);
}

/**
 * Get internal app API by appurl
 */
export function getInternalAppAPI(appurl: string): any {
  return internalAppAPIs.get(appurl);
}

/**
 * Invoke contract using app API (same flow as SDK)
 * This matches the skeleton-dapp flow: create app API -> callWalletApi -> handle response
 */
export async function invokeContract(params: InvokeContractParams) {
  const { appurl, appname, ...invokeParams } = params;

  if (!appurl || !appname) {
    throw new Error('appurl and appname are required for contract invocations');
  }

  // Ensure the app API is created (same as SDK's client initialization)
  await createInternalAppAPI(appurl, appname);

  // Get the app API (same as callExternalWalletApi does)
  const appApi = internalAppAPIs.get(appurl);
  if (!appApi) {
    throw new Error(`App API not found for ${appurl}`);
  }

  // Create JSON-RPC request (same format as SDK)
  const callId = `internal-${internalCallId}`;
  internalCallId += 1;

  const request = {
    jsonrpc: '2.0',
    id: callId,
    method: 'invoke_contract',
    params: {
      args: invokeParams.args,
      contract: invokeParams.contract,
      create_tx: invokeParams.create_tx ?? false,
    },
  };

  // Call via app API's callWalletApi (same as SDK flow)
  return new Promise<any>((resolve, reject) => {
    // Store the promise resolvers
    pendingContractCalls.set(callId, { resolve, reject });

    // Call the app API (same as callExternalWalletApi does)
    appApi.callWalletApi(JSON.stringify(request));

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingContractCalls.has(callId)) {
        pendingContractCalls.delete(callId);
        reject(new Error('Contract invocation timeout'));
      }
    }, 30000);
  });
}
