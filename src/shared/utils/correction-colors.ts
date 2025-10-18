export const CORRECTION_TYPE_COLORS = {
  spelling: {
    color: '#dc2626',
    background: '#fef2f2',
    border: '#fecaca',
    label: 'Spelling',
  },
  grammar: {
    color: '#2563eb',
    background: '#eff6ff',
    border: '#bfdbfe',
    label: 'Grammar',
  },
  punctuation: {
    color: '#7c3aed',
    background: '#f5f3ff',
    border: '#ddd6fe',
    label: 'Punctuation',
  },
  capitalization: {
    color: '#ea580c',
    background: '#fff7ed',
    border: '#fed7aa',
    label: 'Capitalization',
  },
  preposition: {
    color: '#0891b2',
    background: '#ecfeff',
    border: '#a5f3fc',
    label: 'Preposition',
  },
  'missing-words': {
    color: '#16a34a',
    background: '#f0fdf4',
    border: '#bbf7d0',
    label: 'Missing Words',
  },
} as const;

export type CorrectionTypeKey = keyof typeof CORRECTION_TYPE_COLORS;

export function getCorrectionTypeColor(type?: CorrectionType) {
  if (!type) return CORRECTION_TYPE_COLORS.spelling;
  return CORRECTION_TYPE_COLORS[type] || CORRECTION_TYPE_COLORS.spelling;
}
