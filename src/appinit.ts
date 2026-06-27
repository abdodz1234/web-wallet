import * as extensionizer from 'extensionizer';

const WALLET_PAGE = 'page.html';

function openWalletTab(active: boolean): void {
  chrome.tabs.create({ url: WALLET_PAGE, active }, (tab) => {
    extensionizer.storage.local.set({ beamTabId: tab.id.toString() });
  });
}

// Uses chrome.tabs.get() directly so a still-loading tab is not missed.
function ensureWalletTabOpen(active: boolean): void {
  extensionizer.storage.local.get('beamTabId', ({ beamTabId }) => {
    if (!beamTabId) {
      openWalletTab(active);
      return;
    }
    chrome.tabs.get(parseInt(beamTabId, 10), (tab) => {
      if (chrome.runtime.lastError || !tab) {
        openWalletTab(active);
      } else if (active) {
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
    });
  });
}

// Handle extension icon click: focus the existing wallet tab or open a new one.
chrome.action.onClicked.addListener(() => {
  ensureWalletTabOpen(true);
});

// When a dApp content script connects, ensure the wallet tab is open so that
// page.html's initRemoteConnection() handler can serve future port connections.
// This service-worker handler does not process messages itself.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'content_req' || port.name === 'content') {
    ensureWalletTabOpen(false);
  }
});
