import * as extensionizer from 'extensionizer';

const SESSION_PASSWORD_KEY = 'beam_wallet_saved_password_v1';

let inMemoryPassword: string | null = null;

type ChromeSessionStorage = {
  get: (keys: string[] | string, cb: (items: Record<string, any>) => void) => void;
  set: (items: Record<string, any>, cb?: () => void) => void;
  remove: (keys: string[] | string, cb?: () => void) => void;
};

function getChromeSessionStorage(): ChromeSessionStorage | null {
  // MV3: chrome.storage.session exists in Chromium-based browsers.
  // In other environments (tests / non-Chromium), fall back to in-memory only.
  const chromeAny = (globalThis as any).chrome;
  return chromeAny?.storage?.session ?? null;
}

export async function getSavedPassword(): Promise<string | null> {
  const session = getChromeSessionStorage();
  if (!session) return inMemoryPassword;

  return new Promise((resolve) => {
    session.get([SESSION_PASSWORD_KEY], (items) => {
      resolve(items?.[SESSION_PASSWORD_KEY] ?? null);
    });
  });
}

export async function savePassword(pass: string): Promise<void> {
  const session = getChromeSessionStorage();
  if (!session) {
    inMemoryPassword = pass;
    return;
  }

  await new Promise<void>((resolve) => {
    session.set({ [SESSION_PASSWORD_KEY]: pass }, () => resolve());
  });
}

export async function clearSavedPassword(): Promise<void> {
  inMemoryPassword = null;
  const session = getChromeSessionStorage();
  if (!session) return;

  await new Promise<void>((resolve) => {
    session.remove([SESSION_PASSWORD_KEY], () => resolve());
  });
}

export async function getSavePasswordSetting(): Promise<boolean> {
  return new Promise((resolve) => {
    extensionizer.storage.local.get('settings', ({ settings }) => {
      resolve(!!settings?.savePasswordSetting);
    });
  });
}

export async function setSavePasswordSetting(value: boolean): Promise<void> {
  return new Promise((resolve) => {
    extensionizer.storage.local.get('settings', ({ settings }) => {
      const next = { ...(settings || {}), savePasswordSetting: value };
      extensionizer.storage.local.set({ settings: next }, () => resolve());
    });
  });
}
