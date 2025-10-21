import type { UnderlineStyle } from './types.ts';
import { ALL_CORRECTION_TYPES } from './utils/correction-colors.ts';

/**
 * Storage keys for Chrome storage API
 */
export const STORAGE_KEYS = {
  MODEL_DOWNLOADED: 'modelDownloaded',
  MODEL_AVAILABILITY: 'modelAvailability',
  PROOFREADER_READY: 'proofreaderReady',
  AUTO_CORRECT: 'autoCorrect',
  UNDERLINE_STYLE: 'underlineStyle',
  ENABLED_CORRECTION_TYPES: 'enabledCorrectionTypes',
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
  [STORAGE_KEYS.ENABLED_CORRECTION_TYPES]: ALL_CORRECTION_TYPES,
} as const;
