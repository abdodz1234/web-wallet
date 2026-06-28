import * as extensionizer from 'extensionizer';

const WALLET_PAGE = 'page.html';

// Mutex: set synchronously before any async operation to prevent concurrent opens.
let openInProgress = false;

function openWalletTab(active: boolean): void {
  chrome.tabs.create({ url: WALLET_PAGE, active }, (tab) => {
    openInProgress = false;
    if (tab) {
      extensionizer.storage.local.set({ beamTabId: tab.id.toString() });
    }
  });
}

function ensureWalletTabOpen(active: boolean): void {
  // Guard must be checked and set synchronously before any async call so
  // concurrent invocations (e.g. multiple iframes connecting) are collapsed.
  if (openInProgress) return;
  openInProgress = true;

  extensionizer.storage.local.get('beamTabId', ({ beamTabId }) => {
    if (!beamTabId) {
      openWalletTab(active);
      return;
    }
    chrome.tabs.get(parseInt(beamTabId, 10), (tab) => {
      if (chrome.runtime.lastError || !tab) {
        openWalletTab(active);
      } else {
        openInProgress = false;
        if (active) {
          chrome.tabs.update(tab.id, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
        }
      }
    });
  });
}

// Handle extension icon click: focus the existing wallet tab or open a new one.
chrome.action.onClicked.addListener(() => {
  ensureWalletTabOpen(true);
});

// When a dApp content script requests auth, ensure the wallet tab is open so
// that page.html's initRemoteConnection() handler can serve the connection.
// Only respond to content_req (auth handshake), not content (RPC relay) —
// the RPC relay port doesn't need to force-open the wallet.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'content_req') {
    ensureWalletTabOpen(false);
  }
});
