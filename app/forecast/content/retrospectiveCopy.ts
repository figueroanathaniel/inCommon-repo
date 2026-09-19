/*! forecast/content/retrospectiveCopy.ts
 * Generated narratives for monthly and yearly retrospectives
 * Sky mood summaries: one line per dominant-category combination
 * Max 140 chars, same tone as news engine (warm, symbolic, never deterministic)
 */

/**
 * Monthly sky mood lines, keyed by dominant category
 */
export const MONTH_MOODS = {
  pattern: [
    'A month of structures — the sky kept handing you shapes to grow into.',
    'The month favored patterns. What kept repeating? What were you learning?',
    'Patterns dominated. The sky was teaching through geometry and connection.'
  ],

  transit: [
    'A month of motion. The astral bodies were busy moving you from place to place.',
    'Transits led the month. Change, not rest, was the theme.',
    'The sky was in transit. A month of passage and gradual turning.'
  ],

  mixed: [
    'A balanced month. Patterns and transits held equal weight.',
    'The sky offered both structures and shifts. A month of growth.',
    'Mixed energies. The month held both geometry and momentum.'
  ]
};

/**
 * Yearly sky mood lines
 */
export const YEAR_MOODS = {
  pattern: [
    'A year of structures. What you built in the sky, you also built in life.',
    'The year favored patterns. Shapes, cycles, returning moments.',
    'A geometric year. The sky spoke in connections and sacred angles.'
  ],

  transit: [
    'A year in motion. The sky carried you through several passages.',
    'The year was transits. Change, passage, the momentum of becoming.',
    'In motion. A year of gradual turning and planetary travel.'
  ],

  mixed: [
    'A year of balance. Structures and motion held space equally.',
    'Both patterns and passages marked the year. Growth in both directions.',
    'A full year. The sky held both stillness and change for you.'
  ]
};

/**
 * Pick a sky mood line for a month based on dominant category
 */
export function getMonthlySkyMood(category: 'pattern' | 'transit' | 'mixed'): string {
  const options = MONTH_MOODS[category] || MONTH_MOODS.mixed;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Pick a sky mood line for a year
 */
export function getYearlySkyMood(category: 'pattern' | 'transit' | 'mixed'): string {
  const options = YEAR_MOODS[category] || YEAR_MOODS.mixed;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Lint retrospective text: no forbidden words, max length
 */
export function lintRetrospectiveText(text: string): { valid: boolean; violations: string[] } {
  const forbidden = [
    'will happen', 'destined to', 'warning', 'danger', 'curse', 'guaranteed',
    'inevitable', 'forced', 'must happen', 'has to be'
  ];
  const violations: string[] = [];

  forbidden.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      violations.push(`Contains forbidden phrase: "${word}"`);
    }
  });

  if (text.length > 140) {
    violations.push(`Length ${text.length} exceeds 140 chars`);
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Generate a year-in-review summary (≤1000 chars)
 */
export function buildYearReviewText(
  year: number,
  skyMood: string,
  monthCount: number,
  rareEventCount: number
): string {
  const opening = `My year in the sky: ${year}`;
  const moodLine = `${skyMood}`;
  const stats = `${monthCount} months tracked. ${rareEventCount} rare moments.`;
  const closing = `–${year} | inCommon`;

  const full = `${opening}. ${moodLine} ${stats} ${closing}`;

  if (full.length > 1000) {
    return full.substring(0, 997) + '…';
  }

  return full;
}

/**
 * Lint year review text
 */
export function lintYearReviewText(text: string): { valid: boolean; violations: string[] } {
  const forbidden = [
    'will happen', 'destined to', 'warning', 'curse', 'guaranteed',
    'inevitable', 'must happen'
  ];
  const violations: string[] = [];

  forbidden.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      violations.push(`Contains forbidden phrase: "${word}"`);
    }
  });

  if (text.length > 1000) {
    violations.push(`Length ${text.length} exceeds 1000 chars`);
  }

  if (!text.includes('inCommon')) {
    violations.push('Missing inCommon attribution');
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
