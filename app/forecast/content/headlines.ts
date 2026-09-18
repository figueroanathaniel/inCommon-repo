/*! forecast/content/headlines.ts
 * Headline templates for transits, patterns, and harmonics
 * Voice: broadcast-news cadence, dry wit, no fluff. {placeholders} for dynamic content.
 */

export interface HeadlineTemplate {
  id: string;
  category: 'transit' | 'pattern' | 'harmonic' | 'degree-lore';
  type: string;  // aspect name, pattern name, harmonic name, or degree marker
  templates: string[];
}

export const HEADLINE_TEMPLATES: HeadlineTemplate[] = [
  // ============================================================================
  // TRANSITS: Major Aspects
  // ============================================================================

  {
    id: 'transit-conjunction',
    category: 'transit',
    type: 'conjunction',
    templates: [
      '{body1} and {body2} meet at {time}. Same frequency. Watch for {theme}.',
      'Merger alert: {body1} {body2} {time}. Two energies speaking the same language today.',
      '{body1} conjunct {body2} {time}. They\'re not arguing. They\'re aligned.',
    ]
  },

  {
    id: 'transit-sextile',
    category: 'transit',
    type: 'sextile',
    templates: [
      '{body1} sextile {body2}, {time}: diplomacy gets a green light — use it before your inbox ruins your mood.',
      'A sextile is luck showing up. {body1} to {body2}, {time}. {theme} is easy today if you ask for it.',
      '{time}: {body1} and {body2} are friends. This is the hour to start {theme}.',
    ]
  },

  {
    id: 'transit-square',
    category: 'transit',
    type: 'square',
    templates: [
      '{body1} square {body2} {time}. Translation: friction. The kind that sharpens or stalls. Which depends on you.',
      'Two astral bodies at odds: {body1} {body2} {time}. Expect the resistance. It\'s trying to teach you something.',
      'Hard aspect alert, {time}: {body1} and {body2} want different things. Channel it into {theme}.',
    ]
  },

  {
    id: 'transit-trine',
    category: 'transit',
    type: 'trine',
    templates: [
      'A gift lands {time}: {body1} trine {body2}. {theme} flows. Don\'t waste it on autopilot.',
      '{time}, {body1} and {body2} are in conversation. The air is clear for {theme}.',
      'Rare ease: {body1} trine {body2}, {time}. This is what "favor of the astral bodies" looks like.',
    ]
  },

  {
    id: 'transit-opposite',
    category: 'transit',
    type: 'opposite',
    templates: [
      '{body1} opposite {body2}, {time}. Tension, but also clarity. You\'re seeing both sides.',
      'Two poles {time}: {body1} {body2}. One wants to lead, the other to reflect. Balance is today\'s work.',
      'Mirror time {time}: {body1} opposite {body2}. Who else\'s perspective are you avoiding?',
    ]
  },

  // ============================================================================
  // TRANSITS: Station & Ingress Events
  // ============================================================================

  {
    id: 'transit-station-retrograde',
    category: 'transit',
    type: 'station-retrograde',
    templates: [
      '{body} stations retrograde today. The reversal begins. {theme} pauses to ask for a re-think.',
      'Lookback time: {body} turns retrograde {time}. Expect echoes from the past to ask for an edit.',
      '{time}: {body} backtracks. This is not erasure. It\'s revision.',
    ]
  },

  {
    id: 'transit-station-direct',
    category: 'transit',
    type: 'station-direct',
    templates: [
      '{body} stations direct {time}. Forward motion resumes. Whatever paused can move again.',
      'The pause lifts {time}: {body} direct. Clear skies ahead for {theme}.',
      '{time}: {body} turns forward. The loop has made its point. What did you learn?',
    ]
  },

  {
    id: 'transit-ingress',
    category: 'transit',
    type: 'ingress',
    templates: [
      '{body} enters {sign} {time}. New chapter for {theme}. The air changes color.',
      'A shift happens {time}: {body} into {sign}. Different questions. Different answers.',
      '{time}: {body} moves house. {theme} shifts gears.',
    ]
  },

  // ============================================================================
  // PATTERNS: Tier 1 (Classics)
  // ============================================================================

  {
    id: 'pattern-grand-trine',
    category: 'pattern',
    type: 'Grand Trine',
    templates: [
      'A Grand Trine is live today {bodies}. Three astral bodies in harmony. Talent made visible.',
      'Rare symmetry: Grand Trine {bodies}. The gifts are real. The work is yours.',
      '{bodies} form a Grand Trine. Luck showed up. Use it before tomorrow.',
    ]
  },

  {
    id: 'pattern-t-square',
    category: 'pattern',
    type: 'T-Square',
    templates: [
      'A T-Square is live {bodies}. Two astral bodies pulling opposite ways. A third caught between. Resolution is the day\'s theme.',
      'Tension architecture: T-Square {bodies}. The empty leg (opposite the apex) is where release lives. Find it.',
      '{bodies} form a T-Square. Friction. Growth. Same thing today.',
    ]
  },

  {
    id: 'pattern-yod',
    category: 'pattern',
    type: 'Yod',
    templates: [
      'A Yod is active {bodies}. Call it a "Finger of God" or a spiritual assignment. Either way: attention required.',
      'Yod alert {bodies}. The universe is pointing. What is it pointing at?',
      '{bodies}: Yod configuration. An unusual demand for precision. This is your craft hour.',
    ]
  },

  {
    id: 'pattern-grand-cross',
    category: 'pattern',
    type: 'Grand Cross',
    templates: [
      'A Grand Cross: {bodies}. Four astral bodies in tension on all sides. No easy exit. That\'s the point.',
      'Heavy day: Grand Cross {bodies}. All the pressures at once. Channel it into mastery.',
      '{bodies} form a Grand Cross. This is what "no way out but through" looks like in the sky.',
    ]
  },

  {
    id: 'pattern-kite',
    category: 'pattern',
    type: 'Kite',
    templates: [
      'A Kite pattern lives today {bodies}. Three in harmony, one pointing the way. Direction matters.',
      'Kite {bodies}: Grand Trine with a tail. The tail (apex) is where the talent gets directed today.',
      '{bodies} fly a Kite configuration. Talent meets purpose. Which wins?',
    ]
  },

  {
    id: 'pattern-boomerang',
    category: 'pattern',
    type: 'Boomerang',
    templates: [
      'A Boomerang pattern: {bodies}. Tension wants out. A resolution astral body says "throw me". Do it.',
      'Boomerang {bodies}: a Yod with an escape route. The escape route is {apex}.',
      '{bodies} form a Boomerang. The tension reflects back to its solution. Pay attention.',
    ]
  },

  {
    id: 'pattern-stellium',
    category: 'pattern',
    type: 'Stellium',
    templates: [
      'A Stellium in {sign}: {bodies}. Concentrated power. Laser focus. Obsession territory.',
      'Four+ astral bodies in {sign}. That\'s a Stellium. Today\'s intensity is not an accident.',
      '{bodies} cluster in {sign}. Stellium energy. One theme dominates. Lean into it.',
    ]
  },

  // ============================================================================
  // PATTERNS: Tier 2 (Minor-Aspect, Unorthodox)
  // ============================================================================

  {
    id: 'pattern-thors-hammer',
    category: 'pattern',
    type: 'Thor\'s Hammer',
    templates: [
      'A Thor\'s Hammer is live {bodies}. Two astral bodies squeezing a third. Pressure breeds precision.',
      'Hard rectangle energy: {bodies}. Squeeze and release. Today you choose what gets released.',
      '{bodies}: Thor\'s Hammer configuration. Minor aspects, real tension. Unorthodox but active.',
    ]
  },

  // ============================================================================
  // HARMONICS: Tier 1 Patterns in Higher Families
  // ============================================================================

  {
    id: 'harmonic-5h-grand-trine',
    category: 'harmonic',
    type: '5H: Grand Trine',
    templates: [
      '5H lens bonus: {bodies} form a Grand Trine in the quintile family. Yesterday\'s hidden golden yod is today\'s loud talent.',
      'The 5th harmonic reveals a Grand Trine {bodies}. Skill was always there. Today it files for permits.',
      '5H view: {bodies} in perfect trine. The creative family is speaking. Listen.',
    ]
  },

  {
    id: 'harmonic-7h-stellium',
    category: 'harmonic',
    type: '7H: Stellium',
    templates: [
      '7th harmonic view: {bodies} are tightly grouped. Septile family energy. Fated work. Compulsion made visible.',
      '5H lens: {bodies} cluster in the septile family. Destiny is pointing. Follow or resist — both have consequences.',
      'The 7th harmonic reveals a Stellium {bodies}. Fate\'s concentration. Pay attention.',
    ]
  },

  // ============================================================================
  // DEGREE LORE: Tier 3 (Traditional, Subtle)
  // ============================================================================

  {
    id: 'degree-lore-anaretic',
    category: 'degree-lore',
    type: 'anaretic 29°',
    templates: [
      '{body} sits at 29°. The final degree. The end is pressing. Something wants completion.',
      'Anaretic heat: {body} at 29°. Emergency energy. Not all emergencies are crises.',
      '{body} in the 29th degree. The pressure cooker is on. What\'s ready to transform?',
    ]
  },

  {
    id: 'degree-lore-15',
    category: 'degree-lore',
    type: '15°',
    templates: [
      '{body} at 15°. The midpoint of the sign. Maximum sign intensity. Full flavor.',
      '15° marking: {body} at full expression. The sign\'s core is showing.',
      '{body} at the 15° critical degree. Potency is peaked.',
    ]
  },

  {
    id: 'degree-lore-22',
    category: 'degree-lore',
    type: '22°',
    templates: [
      '{body} at 22° in a fixed sign. Traditional marker for intensity. Deep work lives here.',
      '22° in {sign}. Fixed-sign pressure point. A boundary that knows itself.',
      '{body} at 22°. The Sabian symbol holds a secret. Which one?',
    ]
  },
];

/**
 * Get headline templates for a specific type
 */
export function headlinesFor(category: string, type: string): string[] {
  const template = HEADLINE_TEMPLATES.find(t => t.category === category && t.type === type);
  return template?.templates || [];
}

/**
 * Pick a random headline from a template set
 */
export function pickHeadline(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Fill a headline template with values
 * Example: "{body1} sextile {body2}, {time}: diplomacy gets a green light"
 *          → "Mercury sextile Venus, 2:14 PM: diplomacy gets a green light"
 */
export function fillHeadline(template: string, values: Record<string, string>): string {
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return result;
}

/**
 * List all available pattern/transit types for templates
 */
export function availableTemplateTypes(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  HEADLINE_TEMPLATES.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = [];
    if (!grouped[t.category].includes(t.type)) {
      grouped[t.category].push(t.type);
    }
  });

  return grouped;
}
