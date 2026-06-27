import * as extensionizer from 'extensionizer';
import { NotificationType } from '@core/types';
import ExtensionPlatform from './Extension';

// Lazily resolved at call time to avoid a circular dependency:
// WasmWallet → NotificationManager → rootStore → store → saga → auth/saga → WasmWallet
// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const getStore = (): any => require('@app/store/rootStore').default;

const NOTIFICATION_HEIGHT = 600;
const NOTIFICATION_WIDTH = 900;

let contentPort;

export default class NotificationManager {
  platform = null;

  openBeamTabsIDs = {};

  notificationIsOpen = false;

  notification = null;

  appname = '';

  private static instance: NotificationManager;

  private uiIsTriggering = false;

  private popupId = null;

  // notification.html → page.html channel (NOTIFICATION port, set by shared saga).
  private reqPort: chrome.runtime.Port | null = null;

  // page.html → content script auth responses; keyed by origin to avoid multi-tab misrouting.
  private contentReqPorts = new Map<string, chrome.runtime.Port>();

  static getInstance() {
    if (this.instance != null) {
      return this.instance;
    }
    this.instance = new NotificationManager();
    return this.instance;
  }

  static setPort(port) {
    contentPort = port;
  }

  static getPort() {
    return contentPort;
  }

  constructor() {
    this.platform = new ExtensionPlatform();
  }

  // Called by shared saga in notification.html context to wire up the NOTIFICATION port.
  setReqPort(port: chrome.runtime.Port) {
    this.reqPort = port;
  }

  // Send an action message from notification.html → page.html via the NOTIFICATION port.
  postMessage(message: any) {
    this.reqPort?.postMessage(message);
  }

  // Called by api.ts in page.html context to register each dApp's CONTENT_REQ port.
  setContentReqPort(port: chrome.runtime.Port, origin: string) {
    this.contentReqPorts.set(origin, port);
    port.onDisconnect.addListener(() => {
      if (this.contentReqPorts.get(origin) === port) {
        this.contentReqPorts.delete(origin);
      }
    });
  }

  // Send an auth response from page.html → content script for the given origin.
  sendAuthResponse(message: any, origin: string) {
    this.contentReqPorts.get(origin)?.postMessage(message);
  }

  openConnectNotification(msg, appurl) {
    this.notification = {
      type: NotificationType.CONNECT,
      params: {
        appurl,
        appname: msg.appname,
        apiver: msg.apiver,
        apivermin: msg.apivermin,
      },
    };
    this.appname = msg.appname;
    this.notificationIsOpen = true;
    this.openPopup();
  }

  openAuthNotification(msg, appurl) {
    this.notification = {
      type: NotificationType.AUTH,
      params: {
        appurl,
        appname: msg.appname,
        apiver: msg.apiver,
        apivermin: msg.apivermin,
        is_reconnect: msg.is_reconnect,
      },
    };
    this.notificationIsOpen = true;
    this.openPopup();
  }

  openSendNotification(req, info) {
    this.notification = {
      type: NotificationType.APPROVE_TX,
      params: {
        req,
        info,
        appname: this.appname,
        assets: getStore().getState().wallet.assets,
      },
    };
    this.notificationIsOpen = true;
    this.openPopup();
  }

  openContractNotification(req, info, amounts) {
    this.notification = {
      type: NotificationType.APPROVE_INVOKE,
      params: {
        req,
        info,
        amounts,
        appname: this.appname,
        assets: getStore().getState().wallet.assets,
      },
    };
    this.notificationIsOpen = true;
    this.openPopup();
  }

  checkForError = () => {
    const { lastError } = extensionizer.runtime;
    if (!lastError) {
      return undefined;
    }
    if (lastError.stack && lastError.message) {
      return lastError;
    }
    return new Error(lastError.message);
  };

  getActiveTabs = () => new Promise<any[]>((resolve, reject) => {
    extensionizer.tabs.query({ active: true }, (tabs) => {
      const error = this.checkForError();
      if (error) {
        return reject(error);
      }
      return resolve(tabs);
    });
  });

  async triggerUi() {
    const tabs = await this.getActiveTabs();

    await Promise.all(
      tabs.map(async (item) => {
        if (this.openBeamTabsIDs[item.id] !== undefined) {
          await this.closeTab(item.id);
          delete this.openBeamTabsIDs[item.id];
        }
      }),
    );

    const currentlyActiveBeamTab = Boolean(tabs.find((tab) => this.openBeamTabsIDs[tab.id]));
    if (!this.uiIsTriggering && !currentlyActiveBeamTab) {
      this.uiIsTriggering = true;
      try {
        await this.showPopup();
      } finally {
        this.uiIsTriggering = false;
      }
    }
  }

  async openPopup() {
    await this.triggerUi();
    await new Promise<void>((resolve) => {
      let interval: ReturnType<typeof setInterval>;
      const timeoutId = setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 60_000);

      interval = setInterval(() => {
        if (!this.notificationIsOpen) {
          clearInterval(interval);
          clearTimeout(timeoutId);
          resolve();
        }
      }, 1000);
    });
  }

  async showPopup() {
    const popup = await this.getPopup();

    if (popup) {
      await this.platform.focusWindow(popup.id);
    } else {
      const left = window.screen.width / 2 - NOTIFICATION_WIDTH / 2; // Calculate the horizontal position
      const top = window.screen.height / 2 - NOTIFICATION_HEIGHT / 2;

      const popupWindow = await this.platform.openWindow({
        url: 'notification.html',
        type: 'popup',
        width: NOTIFICATION_WIDTH,
        height: NOTIFICATION_HEIGHT,
        left,
        top,
      });

      if (popupWindow.left !== left && popupWindow.state !== 'fullscreen') {
        await this.platform.updateWindowPosition(popupWindow.id, left, top);
      }
      this.popupId = popupWindow.id;
    }
  }

  async closeTab(tabId) {
    return this.platform.closeTab(tabId);
  }

  private async getPopup() {
    const windows = await this.platform.getAllWindows();
    return this.getPopupIn(windows);
  }

  private getPopupIn(windows) {
    return windows ? windows.find((win) => win && win.type === 'popup' && win.id === this.popupId) : null;
  }
}
