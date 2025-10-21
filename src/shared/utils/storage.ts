/**
 * Chrome Storage Utilities
 *
 * Type-safe wrapper around Chrome storage API for managing extension state.
 */

import { STORAGE_KEYS, STORAGE_DEFAULTS } from '../constants.ts';
import type { UnderlineStyle } from '../types.ts';

export interface StorageData {
  [STORAGE_KEYS.MODEL_DOWNLOADED]: boolean;
  [STORAGE_KEYS.MODEL_AVAILABILITY]: Availability;
  [STORAGE_KEYS.PROOFREADER_READY]: boolean;
  [STORAGE_KEYS.AUTO_CORRECT]: boolean;
  [STORAGE_KEYS.UNDERLINE_STYLE]: UnderlineStyle;
}

/**
 * Get a value from Chrome storage
 */
export async function getStorageValue<K extends keyof StorageData>(
  key: K
): Promise<StorageData[K]> {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? STORAGE_DEFAULTS[key];
}

/**
 * Get multiple values from Chrome storage
 */
export async function getStorageValues<K extends keyof StorageData>(
  keys: K[]
): Promise<Pick<StorageData, K>> {
  const result = await chrome.storage.local.get(keys);
  const data = {} as Pick<StorageData, K>;

  for (const key of keys) {
    data[key] = result[key] ?? STORAGE_DEFAULTS[key];
  }

  return data;
}

/**
 * Set a value in Chrome storage
 */
export async function setStorageValue<K extends keyof StorageData>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/**
 * Set multiple values in Chrome storage
 */
export async function setStorageValues(
  data: Partial<StorageData>
): Promise<void> {
  await chrome.storage.local.set(data);
}

/**
 * Check if the proofreader model is ready
 */
export async function isModelReady(): Promise<boolean> {
  const { proofreaderReady, modelDownloaded } = await getStorageValues([
    STORAGE_KEYS.PROOFREADER_READY,
    STORAGE_KEYS.MODEL_DOWNLOADED,
  ]);

  return proofreaderReady && modelDownloaded;
}

/**
 * Listen for storage changes
 */
export function onStorageChange<K extends keyof StorageData>(
  key: K,
  callback: (newValue: StorageData[K], oldValue: StorageData[K]) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[key]) {
      callback(changes[key].newValue, changes[key].oldValue);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Initialize storage with default values if not set
 */
export async function initializeStorage(): Promise<void> {
  const currentValues = await chrome.storage.local.get(Object.keys(STORAGE_DEFAULTS));

  const updates: Partial<StorageData> = {};

  for (const [key, defaultValue] of Object.entries(STORAGE_DEFAULTS)) {
    if (!(key in currentValues)) {
      updates[key as keyof StorageData] = defaultValue as never;
    }
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}
