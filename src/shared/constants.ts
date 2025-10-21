import type { UnderlineStyle } from './types.ts';

/**
 * Storage keys for Chrome storage API
 */
export const STORAGE_KEYS = {
  MODEL_DOWNLOADED: 'modelDownloaded',
  MODEL_AVAILABILITY: 'modelAvailability',
  PROOFREADER_READY: 'proofreaderReady',
  AUTO_CORRECT: 'autoCorrect',
  UNDERLINE_STYLE: 'underlineStyle',
} as const;

/**
 * Default storage values
 */
export const STORAGE_DEFAULTS = {
  [STORAGE_KEYS.MODEL_DOWNLOADED]: false,
  [STORAGE_KEYS.MODEL_AVAILABILITY]: 'unavailable' as Availability,
  [STORAGE_KEYS.PROOFREADER_READY]: false,
  [STORAGE_KEYS.AUTO_CORRECT]: true,
  [STORAGE_KEYS.UNDERLINE_STYLE]: 'solid' as UnderlineStyle,
} as const;
