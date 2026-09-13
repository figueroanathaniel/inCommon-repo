/*! forecast/content/explainer.ts
 * Educational sidebars explaining patterns, transits, and harmonics
 * Target: curious beginner. Max 90 words. Plain language.
 */

export interface Explainer {
  id: string;
  category: 'transit' | 'pattern' | 'harmonic' | 'degree-lore';
  type: string;
  text: string;
}

export const EXPLAINERS: Explainer[] = [
  // ============================================================================
  // TRANSITS: Aspects
  // ============================================================================

  {
    id: 'explainer-conjunction',
    category: 'transit',
    type: 'conjunction',
    text: 'A conjunction is when two planets occupy the same degree. They're "merged." Whatever energies these planets represent are speaking in unison today—amplified, urgent, singular in focus. Conjunctions are powerful but undifferentiated; context matters enormously.'
  },

  {
    id: 'explainer-sextile',
    category: 'transit',
    type: 'sextile',
    text: 'A sextile (60°) is one of astrology\'s "easy" aspects. Two planets at this angle support each other. It\'s like a green light—opportunity presenting itself. Sextiles don\'t force action, but they make forward motion possible. Look for doors opening.'
  },

  {
    id: 'explainer-square',
    category: 'transit',
    type: 'square',
    text: 'A square (90°) is tension in geometric form. Two planets at this angle want different things, creating friction. Squares aren\'t "bad"—they\'re motivating. They push you to act, choose, or adjust. Pressure sharpens or stalls depending on how you respond.'
  },

  {
    id: 'explainer-trine',
    category: 'transit',
    type: 'trine',
    text: 'A trine (120°) is harmony. Two planets at this angle flow together naturally. Trines don\'t demand effort; they reward what\'s already in motion. The risk: taking them for granted. A trine is a gift, not a free pass. Use it or lose it.'
  },

  {
    id: 'explainer-opposite',
    category: 'transit',
    type: 'opposite',
    text: 'An opposition (180°) is two planets facing each other across the sky. It\'s not conflict—it\'s awareness of two viewpoints simultaneously. Oppositions demand balance, not victory. You\'re seeing both sides, which is clarifying if uncomfortable. Integration is the goal.'
  },

  {
    id: 'explainer-quincunx',
    category: 'transit',
    type: 'quincunx',
    text: 'A quincunx (150°) is awkward geometry—two planets at an angle that refuses to resolve. There\'s no natural harmony, no easy tension release. Quincunxes ask for adjustment, finesse, patience. They\'re the universe saying "more steps needed."'
  },

  // ============================================================================
  // TRANSITS: Retrograde & Ingress
  // ============================================================================

  {
    id: 'explainer-retrograde',
    category: 'transit',
    type: 'retrograde',
    text: 'Retrograde means a planet appears to move backward from Earth\'s perspective. It\'s an optical illusion, but symbolically powerful. Retrograde planets turn inward—reviewing, revising, re-examining. Forward motion pauses. This is review time, not paralysis time. Editing is still progress.'
  },

  {
    id: 'explainer-ingress',
    category: 'transit',
    type: 'ingress',
    text: 'An ingress is when a planet crosses into a new zodiac sign. Imagine a train switching tracks. The energy changes flavor. Mercury in Virgo thinks differently than Mercury in Libra. Ingresses mark shifts in themes, priorities, and how we approach that planet\'s domain.'
  },

  // ============================================================================
  // PATTERNS: Tier 1 (Classics)
  // ============================================================================

  {
    id: 'explainer-grand-trine',
    category: 'pattern',
    type: 'Grand Trine',
    text: 'Three planets equally spaced (120° apart) form a Grand Trine. It\'s pure harmony—rare and powerful. The risk is passivity; gifts this easy can be underused. A Grand Trine says "you have talent here." It doesn\'t say "you must use it." That\'s your choice.'
  },

  {
    id: 'explainer-t-square',
    category: 'pattern',
    type: 'T-Square',
    text: 'Two planets oppose each other; a third squares both. It\'s tension architecture. The two opposing planets pull in opposite directions while a third feels the pressure from both sides. The empty point (opposite the apex planet) is where release lives. Finding that outlet is the day\'s work.'
  },

  {
    id: 'explainer-yod',
    category: 'pattern',
    type: 'Yod',
    text: '"Finger of God": two planets both 150° from a third. The shape points like an arrow. Yods feel fated or demanding. They ask for attention, adjustment, precision. You can\'t ignore a Yod. But you can channel it into mastery. It\'s an invitation to craft.'
  },

  {
    id: 'explainer-grand-cross',
    category: 'pattern',
    type: 'Grand Cross',
    text: 'Four planets in square and opposition. Tension on all sides. No easy escape. A Grand Cross is hard work made structural. It\'s demanding and exhausting—but also activating. People with Grand Crosses don\'t coast. They can\'t. That drive is their gift.'
  },

  {
    id: 'explainer-kite',
    category: 'pattern',
    type: 'Kite',
    text: 'A Grand Trine with a fourth planet pointing the way—its "tail." The three in harmony have a direction. The tail (apex) is where that diffuse talent gets focused and deployed. A Kite says "here\'s your gift, here\'s where it belongs."'
  },

  {
    id: 'explainer-boomerang',
    category: 'pattern',
    type: 'Boomerang',
    text: 'A T-Square with a fourth planet offering resolution. The tension looks for an outlet and finds one—the "handle" of the boomerang. It\'s pressure with a release valve. Today that valve is active. Finding and using it transforms tension into action.'
  },

  {
    id: 'explainer-stellium',
    category: 'pattern',
    type: 'Stellium',
    text: 'Four or more planets in one sign. Concentrated power in one theme. Stelliums are obsessive by nature—deep focus, intensity, single-mindedness. This isn\'t scattered energy. It\'s laser energy. The question is always where you point it.'
  },

  {
    id: 'explainer-cradle',
    category: 'pattern',
    type: 'Cradle',
    text: 'Four planets in alternating sextiles and trines. It\'s a holding pattern—supportive, balanced. Cradles offer comfort and stability. They\'re protective by nature. A Cradle says "you\'re held." The work is maintaining that safety while also moving.'
  },

  {
    id: 'explainer-talent-triangle',
    category: 'pattern',
    type: 'Talent Triangle',
    text: 'Three planets in sextiles and a trine. Talent in flow. Two "easy" aspects supporting one harmonious one. A Talent Triangle says "this works." Your job is noticing it\'s working and letting it work. Don\'t overthink. Trust the flow.'
  },

  // ============================================================================
  // PATTERNS: Tier 2 (Minor-Aspect, Unorthodox)
  // ============================================================================

  {
    id: 'explainer-thors-hammer',
    category: 'pattern',
    type: 'Thor\'s Hammer',
    text: 'Two planets squeezing a third (semisquares and sesquisquares). Minor aspects, big pressure. It\'s like a vise—tightening until the middle planet releases something. Thor\'s Hammer isn\'t as "classic" as a T-Square, but it\'s just as real. Pressure, focus, breakthrough.'
  },

  {
    id: 'explainer-hard-rectangle',
    category: 'pattern',
    type: 'Hard Rectangle',
    text: 'Four planets in hard aspects (squares and oppositions). Like a Grand Cross but with different geometry. The pressure is real. The difference is subtle, but this pattern asks for strategy, not just endurance. Plan your moves; don\'t just react.'
  },

  // ============================================================================
  // HARMONICS: What is a Harmonic?
  // ============================================================================

  {
    id: 'explainer-harmonic-intro',
    category: 'harmonic',
    type: 'what-is-harmonic',
    text: 'Harmonics are "lenses" on your chart. Multiply all your planet positions by a number and you reveal hidden patterns. A golden yod (hidden in your radix) becomes a grand trine in the 5th harmonic. Harmonics make invisible patterns visible. It\'s symbolic technology, not magic.'
  },

  {
    id: 'explainer-harmonic-2',
    category: 'harmonic',
    type: '2H: Opposition',
    text: 'The 2nd harmonic reveals all oppositions as conjunctions. Polarity made visible. What\'s normally "opposing" is shown as unified. This view clarifies duality: the two forces aren\'t fighting; they\'re two sides of one coin. Integration, not victory.'
  },

  {
    id: 'explainer-harmonic-3',
    category: 'harmonic',
    type: '3H: Trine',
    text: 'The 3rd harmonic reveals all trines as conjunctions. Pure flow made obvious. This lens shows where your chart is naturally harmonious. It\'s the "gift view." See it, honor it, use it. Don\'t assume it\'s automatic.'
  },

  {
    id: 'explainer-harmonic-4',
    category: 'harmonic',
    type: '4H: Square',
    text: 'The 4th harmonic reveals all squares as conjunctions. Hard aspects bloom. This lens shows where your chart is under pressure. But pressure teaches. This view highlights where discipline and craft can transform friction into mastery.'
  },

  {
    id: 'explainer-harmonic-5',
    category: 'harmonic',
    type: '5H: Quintile',
    text: 'The 5th harmonic reveals all quintiles (72° family) as conjunctions. Creative skill and mental edge made visible. Hidden talent appears. Golden yods become grand trines here. This is the "creative genius" view—where your chart\'s artistic and intellectual peak lives.'
  },

  {
    id: 'explainer-harmonic-7',
    category: 'harmonic',
    type: '7H: Septile',
    text: 'The 7th harmonic reveals the septile family (51.43° increments). Fated work, compulsion, the irrational. This view shows what\'s driven deeper than logic. Destiny patterns. Surrender points. The universe pointing. Listen, not necessarily obey.'
  },

  {
    id: 'explainer-harmonic-9',
    category: 'harmonic',
    type: '9H: Novile',
    text: 'The 9th harmonic reveals the novile family (40° increments). Spiritual completion, illumination, grace. This view shows where your chart touches the transcendent. The moments when everything clicks into place. Rare, powerful, meaningful when they arrive.'
  },

  // ============================================================================
  // DEGREE LORE: Tier 3 (Traditional)
  // ============================================================================

  {
    id: 'explainer-anaretic',
    category: 'degree-lore',
    type: 'anaretic 29°',
    text: 'The 29th degree is the final degree of a sign. "Anaretic" means "ending." A planet here is urgent, intense, squeezed. Something wants completion. Anaretic planets feel pressure to finish, resolve, or transform. It\'s not always comfortable, but it\'s never dull.'
  },

  {
    id: 'explainer-critical-15',
    category: 'degree-lore',
    type: '15°',
    text: 'The 15th degree is the midpoint of a sign. Maximum sign intensity. Full flavor. A planet at 15° is expressing its sign\'s pure essence. It\'s unfiltered, undiluted. This is the sign at its most potent. Honor the intensity.'
  },

  {
    id: 'explainer-fixed-22',
    category: 'degree-lore',
    type: '22°',
    text: 'In the fixed signs (Taurus, Leo, Scorpio, Aquarius), 22° is traditionally potent. A marker of depth, stubbornness, and power. A planet at 22° in a fixed sign is digging in. Not moving lightly. This degree knows what it wants and holds firm.'
  },
];

/**
 * Get explainer for a pattern/transit type
 */
export function explainerFor(category: string, type: string): string | undefined {
  const explainer = EXPLAINERS.find(e => e.category === category && e.type === type);
  return explainer?.text;
}

/**
 * Validate all explainers ≤ 90 words
 */
export function validateExplainerLengths(): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  EXPLAINERS.forEach(e => {
    const words = e.text.trim().split(/\s+/).length;
    if (words > 90) {
      violations.push(`${e.id}: ${words} words (max 90)`);
    }
  });

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Count explainers by category
 */
export function explainerStats(): Record<string, number> {
  const counts: Record<string, number> = {};
  EXPLAINERS.forEach(e => {
    counts[e.category] = (counts[e.category] || 0) + 1;
  });
  return counts;
}
