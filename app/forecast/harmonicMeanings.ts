/*! forecast/harmonicMeanings.ts
 * Harmonic meanings table (John Addey)
 * Each harmonic reveals a different aspect family as conjunctions
 */

export interface HarmonicMeaning {
  n: number;                    // Harmonic number (2–13)
  name: string;                 // Human-readable name
  family: string;               // Aspect family (opposition, trine, square, quintile, etc.)
  oneLineMeaning: string;       // One-sentence symbolism
  description?: string;         // Extended meaning
  experimental?: boolean;       // 10+ marked experimental
}

export const HARMONIC_MEANINGS: HarmonicMeaning[] = [
  {
    n: 1,
    name: 'Radix',
    family: 'identity',
    oneLineMeaning: 'The birth chart itself; the native landscape.',
    description: 'The radix or natal chart is the foundation. All harmonics are permutations of this one moment.'
  },

  {
    n: 2,
    name: 'Opposition Harmonic',
    family: 'opposition',
    oneLineMeaning: 'Polarization made visible; the dance between opposing forces.',
    description: 'The 2nd harmonic reveals opposition patterns (180° in the radix become 0° conjunctions). Polarities, dualities, the tension between what is and what pulls against it.'
  },

  {
    n: 3,
    name: 'Trine Harmonic',
    family: 'trine',
    oneLineMeaning: 'Trine structures bloom; flow and natural talent made explicit.',
    description: 'The 3rd harmonic gathers all trine relationships (120° in radix → 0° in 3H). Ease, harmony, gifts that work without forcing.'
  },

  {
    n: 4,
    name: 'Square Harmonic',
    family: 'square',
    oneLineMeaning: 'The hard aspects bloom; pressure points and points of power.',
    description: 'The 4th harmonic makes square relationships visible (90° in radix → 0° in 4H). Friction, tension, and the craft that friction teaches. Where resistance becomes resource.'
  },

  {
    n: 5,
    name: 'Quintile Harmonic',
    family: 'quintile',
    oneLineMeaning: 'Skill and creation revealed; the mind at its edge.',
    description: 'The 5th harmonic exposes quintile patterns (72° in radix → 0° in 5H). Talent, artistic sense, mastery, and the edge where ability meets the unknown. Golden yods and kites in the radix appear as grand trines here.'
  },

  {
    n: 6,
    name: 'Sextile Harmonic',
    family: 'sextile',
    oneLineMeaning: 'Opportunity webs woven visible; connection and ease made concrete.',
    description: 'The 6th harmonic gathers sextile relationships (60° in radix → 0° in 6H). Support, luck, the way things align almost by themselves.'
  },

  {
    n: 7,
    name: 'Septile Harmonic',
    family: 'septile',
    oneLineMeaning: 'Fate and compulsion; the irrational made structural.',
    description: 'The 7th harmonic reveals septile patterns (51.43° in radix → 0° in 7H). Destiny, compulsion, the hand of something beyond reason. Where surrender becomes instruction.'
  },

  {
    n: 8,
    name: 'Semisquare Harmonic',
    family: 'semisquare',
    oneLineMeaning: 'Friction and craft; the sharp work of refinement.',
    description: 'The 8th harmonic makes semisquare relationships visible (45° in radix → 0° in 8H). Irritation and itch that drives improvement, sharpening, the small cuts that teach.'
  },

  {
    n: 9,
    name: 'Novile Harmonic',
    family: 'novile',
    oneLineMeaning: 'Spiritual completion and illumination; the light finding its own.',
    description: 'The 9th harmonic gathers novile relationships (40° in radix → 0° in 9H). Completion, grace, the sudden understanding. Spiritual alignment and the moment of seeing.'
  },

  {
    n: 10,
    name: 'Decile Harmonic',
    family: 'decile',
    oneLineMeaning: 'Realized talent; craft meeting gift in practical form.',
    description: 'The 10th harmonic reveals decile patterns (36° in radix → 0° in 10H). Achievement, mastery put to work, the gift that gets done. Experimental; see with caution.',
    experimental: true
  },

  {
    n: 11,
    name: 'Undecile Harmonic',
    family: 'undecile',
    oneLineMeaning: 'Hidden service and subtle genius; what works without being seen.',
    description: 'The 11th harmonic makes undecile relationships visible (32.73° in radix → 0° in 11H). Quiet mastery, behind-the-scenes gift, the invisible hand. Experimental; emerging.',
    experimental: true
  },

  {
    n: 12,
    name: 'Semisextile Harmonic',
    family: 'semisextile',
    oneLineMeaning: 'Adjacent-sign work; integration across small distances.',
    description: 'The 12th harmonic gathers semisextile relationships (30° in radix → 0° in 12H). The step between signs, small frictions that ask for patience, neighbouring territories learning to talk. Experimental.',
    experimental: true
  },

  {
    n: 13,
    name: 'Tridecile Harmonic',
    family: 'tridecile',
    oneLineMeaning: 'Intense karmic refinement; the fine edge of becoming.',
    description: 'The 13th harmonic reveals tridecile patterns (27.69° in radix → 0° in 13H). Deep transformation, the sharp precision of karma, the exact angle that changes everything. Highly experimental; for advanced work.',
    experimental: true
  }
];

/**
 * Look up harmonic meaning by N
 */
export function harmonicMeaningFor(n: number): HarmonicMeaning | undefined {
  return HARMONIC_MEANINGS.find(h => h.n === n);
}

/**
 * Get all harmonics up to a limit (for UI pill generation)
 */
export function harmonicsUpTo(max: number): HarmonicMeaning[] {
  return HARMONIC_MEANINGS.filter(h => h.n > 1 && h.n <= max);
}

/**
 * Get non-experimental harmonics (for default UI)
 */
export function harmonicsNonExperimental(): HarmonicMeaning[] {
  return HARMONIC_MEANINGS.filter(h => h.n > 1 && h.n <= 9 && !h.experimental);
}

/**
 * Get experimental harmonics (for advanced menu)
 */
export function harmonicsExperimental(): HarmonicMeaning[] {
  return HARMONIC_MEANINGS.filter(h => h.experimental);
}
