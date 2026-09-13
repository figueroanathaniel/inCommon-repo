/*! forecast/content/practical.ts
 * Practical action hooks per pattern/transit
 * 2 variants each: journal prompt, conversation to have, thing to start/stop
 * Rotated per instance for variety
 */

export interface PracticalHook {
  id: string;
  category: 'transit' | 'pattern' | 'harmonic' | 'degree-lore';
  type: string;
  variants: string[];  // 2–3 actionable hooks
}

export const PRACTICAL_HOOKS: PracticalHook[] = [
  // ============================================================================
  // TRANSITS: Aspects
  // ============================================================================

  {
    id: 'practical-conjunction',
    category: 'transit',
    type: 'conjunction',
    variants: [
      'Journal: These two energies are speaking as one today. Which takes the lead? Which follows? Write the conversation between {planet1} and {planet2}.',
      'Action: Start a project that combines both {planet1} and {planet2} themes. One meeting, one decision, one commitment that honors both.',
      'Conversation: Ask someone close: "What do I do when these two parts of me want the same thing?" Listen for clarity.'
    ]
  },

  {
    id: 'practical-sextile',
    category: 'transit',
    type: 'sextile',
    variants: [
      'Action: Do the thing you\'ve been delaying. {planet1} and {planet2} are holding the door open. Walk through.',
      'Journal: What does "easy" feel like to you today? Write about it without analyzing.',
      'Conversation: Tell someone you trust: "I need your help with {theme}." The moment you ask, the door opens wider.'
    ]
  },

  {
    id: 'practical-square',
    category: 'transit',
    type: 'square',
    variants: [
      'Journal: What are these two planets pushing me to choose? Write both sides. Then write which one you\'re leaning toward and why.',
      'Action: Stop avoiding the friction. Have the conversation, make the decision, adjust the plan. Pressure breaks when you push back.',
      'Conversation: Ask a mentor or trusted friend: "What\'s one pressure point in my life right now?" Their perspective might clarify your path.'
    ]
  },

  {
    id: 'practical-trine',
    category: 'transit',
    type: 'trine',
    variants: [
      'Action: Don\'t wait for tomorrow. Do the easiest version of what you\'ve been planning today. Momentum counts.',
      'Journal: What gifts do {planet1} and {planet2} bring you? Write three specific ways you could use them this week.',
      'Conversation: Tell someone you admire: "I\'ve noticed you do {theme} well. Can you show me how?" Ask for the model.'
    ]
  },

  {
    id: 'practical-opposite',
    category: 'transit',
    type: 'opposite',
    variants: [
      'Journal: Write from both sides. "This situation wants..." (one planet). Then: "...but this situation also needs..." (other planet). What\'s the integration?',
      'Action: Seek out someone who thinks the opposite way from you on this issue. Genuinely listen. You\'re not trying to win.',
      'Conversation: Ask yourself in the mirror: "What am I not seeing?" Then listen like you\'re talking to someone else.'
    ]
  },

  // ============================================================================
  // TRANSITS: Retrograde & Ingress
  // ============================================================================

  {
    id: 'practical-retrograde',
    category: 'transit',
    type: 'retrograde',
    variants: [
      'Journal: What in your {theme} needs reviewing? What did you miss the first time? Write it down. Revising it is the work now.',
      'Action: Go back to something you thought was done. Read it, think about it, improve it. Retrograde is edit season.',
      'Conversation: Call someone from your past about an unresolved thing. Reopen the conversation gently. Revision might be possible.'
    ]
  },

  {
    id: 'practical-ingress',
    category: 'transit',
    type: 'ingress',
    variants: [
      'Journal: {planet} just shifted into {sign}. How does your approach to {theme} need to change? Write the "new season" version.',
      'Action: Start fresh with one thing in the {theme} domain. New method, new tone, new energy. Let {sign} show you how.',
      'Conversation: Tell someone close: "{theme} is entering a new chapter for me. Here\'s what I\'m noticing change..." Let them reflect it back.'
    ]
  },

  // ============================================================================
  // PATTERNS: Tier 1 (Classics)
  // ============================================================================

  {
    id: 'practical-grand-trine',
    category: 'pattern',
    type: 'Grand Trine',
    variants: [
      'Action: Choose one gift from this Grand Trine and use it today. Publicly if possible. Don\'t let ease go to waste.',
      'Journal: "This gift I have is..." (finish three times). Pick the one that excites you most. That\'s where to go.',
      'Conversation: Ask someone who\'s seen you in action: "What do I make look easy?" Their answer is your clue.'
    ]
  },

  {
    id: 'practical-t-square',
    category: 'pattern',
    type: 'T-Square',
    variants: [
      'Action: Identify the empty leg of this T-Square (opposite the apex). That\'s your release valve. Point your effort there.',
      'Journal: Write the conversation between the two planets pulling you. Let them argue on paper. The resolution is in {theme}.',
      'Conversation: Find someone who handles similar tension well. Ask: "How do you turn this kind of pressure into motion?"'
    ]
  },

  {
    id: 'practical-yod',
    category: 'pattern',
    type: 'Yod',
    variants: [
      'Action: The Yod is pointing at something. What detail needs precision today? Give it obsessive attention.',
      'Journal: "This pattern is asking me to master..." (finish). Write the micro-steps to mastery.',
      'Conversation: Tell a teacher or mentor: "I\'m feeling fated pressure around {theme}. Help me understand what\'s being asked."'
    ]
  },

  {
    id: 'practical-grand-cross',
    category: 'pattern',
    type: 'Grand Cross',
    variants: [
      'Action: Channel the pressure into one thing. Not everything. One decision, one project, one commitment gets the intensity.',
      'Journal: "The pressure is teaching me..." Write what you\'re learning from the resistance.',
      'Conversation: Find someone navigating similar intensity. Share the burden. Alone, it\'s overwhelming. Together, it\'s work.'
    ]
  },

  {
    id: 'practical-kite',
    category: 'pattern',
    type: 'Kite',
    variants: [
      'Action: The tail points the way. Use it. Aim the Grand Trine\'s talent toward what the apex (tail) suggests.',
      'Journal: "My talent wants to go toward..." Finish the sentence. Then write the first step.',
      'Conversation: Ask someone close: "Where do you see this gift of mine belonging?" Trust their outside view.'
    ]
  },

  {
    id: 'practical-boomerang',
    category: 'pattern',
    type: 'Boomerang',
    variants: [
      'Action: The handle of the boomerang is your outlet. What does it suggest? Do that today.',
      'Journal: "This tension wants to move toward..." Finish. Then write how you\'d feel if it landed there.',
      'Conversation: Ask a friend: "What do you think I\'m stuck on? Where should this energy go?"'
    ]
  },

  {
    id: 'practical-stellium',
    category: 'pattern',
    type: 'Stellium',
    variants: [
      'Action: Lean hard into the Stellium\'s theme. One day of obsessive focus. See what emerges.',
      'Journal: "This intensity in {sign} is really about..." Free-write for five minutes. Read it back.',
      'Conversation: Tell someone: "I\'m deep in {theme} right now. I might be hard to reach. Here\'s why..." Set the boundary gently.'
    ]
  },

  // ============================================================================
  // PATTERNS: Tier 2 (Minor-Aspect, Unorthodox)
  // ============================================================================

  {
    id: 'practical-thors-hammer',
    category: 'pattern',
    type: 'Thor\'s Hammer',
    variants: [
      'Action: Stop resisting the squeeze. Let the pressure build. Where it releases is where the breakthrough is.',
      'Journal: "This pressure is squeezing me toward..." Write it. Then write what you\'d become if you broke through.',
      'Conversation: Ask someone you trust: "What do you see me being forced to confront right now?"'
    ]
  },

  // ============================================================================
  // HARMONICS: Action Hooks per Harmonic
  // ============================================================================

  {
    id: 'practical-harmonic-5',
    category: 'harmonic',
    type: '5H: Creative',
    variants: [
      'Action: Make something today, even if it\'s small. The 5th harmonic opens the creative door. Walk through it.',
      'Journal: "My hidden talent wants to..." Finish. Then write what would happen if you trained it for one month.',
      'Conversation: Tell someone: "I\'ve been thinking about {theme}. What if I actually pursued it?" Listen to their response without defending.'
    ]
  },

  {
    id: 'practical-harmonic-7',
    category: 'harmonic',
    type: '7H: Fated',
    variants: [
      'Action: Don\'t fight the pull today. If something feels driven, follow it. Trust the irrational.',
      'Journal: "This drive feels like..." Describe it without analyzing. What does your gut say?',
      'Conversation: Ask someone who knows you well: "What do you think is my true North right now?"'
    ]
  },

  {
    id: 'practical-harmonic-9',
    category: 'harmonic',
    type: '9H: Spiritual',
    variants: [
      'Action: Create space for grace today. Meditate, walk, sit quiet. Let illumination find you.',
      'Journal: "The light I\'m reaching for is..." Write it. Then write what would change if you saw it clearly.',
      'Conversation: Share something spiritual or meaningful with someone. Don\'t explain it. Let it be felt.'
    ]
  },

  // ============================================================================
  // DEGREE LORE: Tier 3 (Traditional)
  // ============================================================================

  {
    id: 'practical-anaretic',
    category: 'degree-lore',
    type: 'anaretic 29°',
    variants: [
      'Action: What\'s this planet asking you to finish? One thing gets closure today. Do it.',
      'Journal: "This urgency is about..." Finish. Then write what comes after the ending.',
      'Conversation: Ask someone: "What do you think I\'m running out of time to do?" The answer might surprise you.'
    ]
  },

  {
    id: 'practical-critical-15',
    category: 'degree-lore',
    type: '15°',
    variants: [
      'Action: Express this sign\'s full flavor today. Don\'t soften it. Let it be entirely itself.',
      'Journal: "The pure essence of this sign in me is..." Write it. Unapologetic.',
      'Conversation: Show someone who knows you the fullness of this quality. Don\'t hedge. Let them see it all.'
    ]
  },

  {
    id: 'practical-fixed-22',
    category: 'degree-lore',
    type: '22°',
    variants: [
      'Action: Stand firm on something today. This degree knows what it wants. You do too. Say it out loud.',
      'Journal: "What am I holding onto that\'s real?" Write it. Then write why it\'s worth holding.',
      'Conversation: Make a commitment you\'ve been hesitating on. The depth is real. Trust it.'
    ]
  },
];

/**
 * Get practical hooks for a pattern/transit type
 */
export function practicalFor(category: string, type: string): string[] | undefined {
  const hook = PRACTICAL_HOOKS.find(p => p.category === category && p.type === type);
  return hook?.variants;
}

/**
 * Pick a practical hook variant (rotate for variety)
 */
export function pickPractical(variants: string[], seed: number = 0): string {
  const index = seed % variants.length;
  return variants[index];
}

/**
 * Fill a practical hook with values
 */
export function fillPractical(hook: string, values: Record<string, string>): string {
  let result = hook;
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return result;
}

/**
 * Count practical hooks by category
 */
export function practicalStats(): Record<string, number> {
  const counts: Record<string, number> = {};
  PRACTICAL_HOOKS.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
}

/**
 * Validate all practical hooks have at least 2 variants
 */
export function validatePracticalVariants(): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  PRACTICAL_HOOKS.forEach(p => {
    if (p.variants.length < 2) {
      violations.push(`${p.id}: only ${p.variants.length} variant(s) (min 2)`);
    }
  });

  return {
    valid: violations.length === 0,
    violations
  };
}
