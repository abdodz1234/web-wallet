import * as extensionizer from 'extensionizer';
import { Environment, ConnectRequest } from '@core/types';

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

let rpcBackgroundPort: chrome.runtime.Port | null = null;
let inpagePort: MessagePort | null = null;
let isConnectedToWallet = false;
let connectInFlight: Promise<boolean> | null = null;

const extensionPort = extensionizer.runtime.connect({ name: Environment.CONTENT_REQ });

function ensureConnected(appname?: string) {
  if (isConnectedToWallet) return Promise.resolve(true);
  if (connectInFlight) return connectInFlight;

  const reqData: ConnectRequest = {
    type: 'create_beam_api',
    apiver: 'current',
    apivermin: '',
    appname: appname || document.title || 'Unknown dApp',
    is_reconnect: false,
  };

  connectInFlight = new Promise<boolean>((resolve) => {
    const onMsg = (msg: any) => {
      if (msg && typeof msg.result === 'boolean') {
        extensionPort.onMessage.removeListener(onMsg);
        connectInFlight = null;
        isConnectedToWallet = !!msg.result;
        if (msg.result) {
          window.postMessage('apiInjected', window.origin);
        }
        resolve(!!msg.result);
      }
    };

    extensionPort.onMessage.addListener(onMsg);
    extensionPort.postMessage(reqData);
  });

  return connectInFlight;
}

function ensureRpcBackgroundPort() {
  if (rpcBackgroundPort) return rpcBackgroundPort;
  rpcBackgroundPort = extensionizer.runtime.connect({ name: Environment.CONTENT });

  rpcBackgroundPort.onMessage.addListener((msg: BeamRpcPushMessage | BeamRpcErrorMessage) => {
    if (inpagePort) {
      inpagePort.postMessage(msg);
    }
  });

  rpcBackgroundPort.onDisconnect.addListener(() => {
    rpcBackgroundPort = null;
  });

  return rpcBackgroundPort;
}

function setupInpageChannel() {
  if (inpagePort) return inpagePort;

  const channel = new MessageChannel();
  inpagePort = channel.port1;
  inpagePort.onmessage = (event: MessageEvent<BeamRpcRequestMessage>) => {
    const msg = event.data;
    if (!msg || msg.type !== 'BEAM_WALLET_RPC_REQUEST' || msg.version !== 1) return;
    const { appname } = msg.payload || {};
    ensureConnected(appname)
      .then((ok) => {
        if (!ok) {
          inpagePort?.postMessage({
            type: 'BEAM_WALLET_RPC_ERROR',
            version: 1,
            payload: {
              id: msg.payload?.id,
              error: { code: -3, message: 'Connection rejected' },
            },
          } as BeamRpcErrorMessage);
          return;
        }
        ensureRpcBackgroundPort().postMessage(msg);
      })
      .catch((e: any) => {
        inpagePort?.postMessage({
          type: 'BEAM_WALLET_RPC_ERROR',
          version: 1,
          payload: {
            id: msg.payload?.id,
            error: { code: -32001, message: e?.message || 'Failed to connect', data: e },
          },
        } as BeamRpcErrorMessage);
      });
  };

  window.postMessage({ type: 'BEAM_WALLET_INIT', version: 1 }, window.origin, [channel.port2]);

  return inpagePort;
}

function injectScript() {
  try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('async', 'false');
    scriptTag.setAttribute('src', chrome.runtime.getURL('inpage.js'));
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Beam web wallet injection failed.', error);
  }
}

function doctypeCheck() {
  const { doctype } = window.document;
  if (doctype) {
    return doctype.name === 'html';
  }
  return true;
}

function suffixCheck() {
  const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
  const currentUrl = window.location.pathname;
  for (let i = 0; i < prohibitedTypes.length; i += 1) {
    if (prohibitedTypes[i].test(currentUrl)) {
      return false;
    }
  }
  return true;
}

function documentElementCheck() {
  const documentElement = document.documentElement.nodeName;
  if (documentElement) {
    return documentElement.toLowerCase() === 'html';
  }
  return true;
}

function shouldInjectProvider() {
  return doctypeCheck() && suffixCheck() && documentElementCheck();
}

if (shouldInjectProvider()) {
  injectScript();
}

window.addEventListener('message', (event) => {
  if (event.source !== window) {
    return;
  }

  if (event.data && event.data.type === 'BEAM_WALLET_INPAGE_READY' && event.data.version === 1) {
    setupInpageChannel();
    ensureRpcBackgroundPort();
    return;
  }

  const reqData: ConnectRequest = {
    type: event.data.type,
    apiver: event.data.apiver,
    apivermin: event.data.apivermin,
    appname: event.data.appname,
    is_reconnect: event.data.is_reconnect,
  };

  if (event.data.type === 'create_beam_api') {
    if (event.data.is_reconnect) {
      extensionPort.postMessage(reqData);
    } else {
      extensionPort.postMessage(reqData);
      extensionPort.onMessage.addListener((msg) => {
        if (msg.result) {
          isConnectedToWallet = true;
          window.postMessage('apiInjected', window.origin);
        } else if (!msg.result) {
          window.postMessage('rejected', window.origin);
        }
      });
    }
  }
});
