export const CORRECTION_TYPES = {
  spelling: {
    color: '#dc2626',
    background: '#fef2f2',
    border: '#fecaca',
    label: 'Spelling',
    description: 'Fixes misspelled words so text stays readable.',
    example: 'Example: "teh" -> "the"',
  },
  grammar: {
    color: '#2563eb',
    background: '#eff6ff',
    border: '#bfdbfe',
    label: 'Grammar',
    description: 'Improves sentence structure and subject-verb agreement.',
    example: 'Example: "She go" -> "She goes"',
  },
  punctuation: {
    color: '#7c3aed',
    background: '#f5f3ff',
    border: '#ddd6fe',
    label: 'Punctuation',
    description: 'Adds or fixes commas, periods, and other punctuation marks.',
    example: 'Example: "Lets eat grandma" -> "Let\'s eat, grandma"',
  },
  capitalization: {
    color: '#ea580c',
    background: '#fff7ed',
    border: '#fed7aa',
    label: 'Capitalization',
    description: 'Corrects uppercase and lowercase usage in text.',
    example: 'Example: "i love Proofly" -> "I love Proofly"',
  },
  preposition: {
    color: '#0891b2',
    background: '#ecfeff',
    border: '#a5f3fc',
    label: 'Preposition',
    description: 'Suggests more natural prepositions in phrases.',
    example: 'Example: "on the bus" -> "in the bus"',
  },
  'missing-words': {
    color: '#16a34a',
    background: '#f0fdf4',
    border: '#bbf7d0',
    label: 'Missing Words',
    description: 'Identifies spots where a word should be added.',
    example: 'Example: "I going store" -> "I am going to the store"',
  },
} as const;

export type CorrectionTypeKey = keyof typeof CORRECTION_TYPES;

export const ALL_CORRECTION_TYPES = Object.keys(CORRECTION_TYPES) as CorrectionTypeKey[];

export function getCorrectionTypeColor(type?: CorrectionType) {
  if (!type) return CORRECTION_TYPES.spelling;
  return CORRECTION_TYPES[type] || CORRECTION_TYPES.spelling;
}
