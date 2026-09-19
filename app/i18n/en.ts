/*! i18n/en.ts
 * English locale catalog
 * DERIVED from template tables: headlines.ts, explainer.ts, practical.ts, synastryTemplates.ts
 * Hand-editing this file is an error; add templates to the source table instead
 * Build generates this catalog on the next run
 */

import { LocaleCatalog } from './index';

const EN: LocaleCatalog = {
  locale: 'en',
  strings: {
    // ============================================================================
    // TRANSIT: Aspects (Headlines)
    // ============================================================================

    'transit-conjunction': [
      '{body1} and {body2} meet at {time}. Same frequency. Watch for {theme}.',
      'Merger alert: {body1} {body2} {time}. Two energies speaking the same language today.',
      '{body1} conjunct {body2} {time}. They\'re not arguing. They\'re aligned.'
    ],

    'transit-sextile': [
      '{body1} sextile {body2}, {time}: diplomacy gets a green light. Use it before your inbox ruins your mood.',
      'A sextile is luck showing up. {body1} to {body2}, {time}. {theme} is easy today if you ask for it.',
      '{time}: {body1} and {body2} are friends. This is the hour to start {theme}.'
    ],

    'transit-square': [
      '{body1} square {body2} {time}. Translation: friction. The kind that sharpens or stalls. Which depends on you.',
      'Two astral bodies at odds: {body1} {body2} {time}. Expect the resistance. It\'s trying to teach you something.',
      'Hard aspect alert, {time}: {body1} and {body2} want different things. Channel it into {theme}.'
    ],

    'transit-trine': [
      'A gift lands {time}: {body1} trine {body2}. {theme} flows. Don\'t waste it on autopilot.',
      '{time}, {body1} and {body2} are in conversation. The air is clear for {theme}.',
      'Rare ease: {body1} trine {body2}, {time}. This is what "favor of the astral bodies" looks like.'
    ],

    'transit-opposite': [
      '{body1} opposite {body2}, {time}. Tension, but also clarity. You\'re seeing both sides.',
      'Two poles {time}: {body1} {body2}. One wants to lead, the other to reflect. Balance is today\'s work.',
      'Mirror time {time}: {body1} opposite {body2}. Who else\'s perspective are you avoiding?'
    ],

    // ============================================================================
    // SYNASTRY: Aspects (Headlines)
    // ============================================================================

    'synastry-conjunction': [
      '{body1} and their {body2} meet today. Same frequency between you.',
      'A merger: your {body1} conjunct their {body2}, {name}. Two energies aligned.',
      'Your {body1} finds their {body2} today. You\'re speaking the same language.'
    ],

    'synastry-trine': [
      'A gift between you: your {body1} trine their {body2}, {name}. It flows.',
      'Your {body1} and their {body2} are in conversation. The air is clear.',
      'Rare ease between you today: your {body1} trine their {body2}. Use it.'
    ],

    'synastry-square': [
      'Your {body1} square their {body2}, {name}. Friction between you. Channel it.',
      'A hard angle: your {body1} and their {body2} want different things today.',
      'Your {body1} meets resistance in their {body2}. That\'s the work of the day.'
    ],

    // ============================================================================
    // EXPLAINERS: Aspects
    // ============================================================================

    'explainer-conjunction': 'A conjunction is when two astral bodies occupy the same degree. They\'re "merged." Whatever energies these astral bodies represent are speaking in unison today, amplified, urgent, singular in focus. Conjunctions are powerful but undifferentiated; context matters enormously.',

    'explainer-sextile': 'A sextile (60°) is one of astrology\'s "easy" aspects. Two astral bodies at this angle support each other. It\'s like a green light: opportunity presenting itself. Sextiles don\'t force action, but they make forward motion possible. Look for doors opening.',

    'explainer-trine': 'A trine (120°) is harmony. Two astral bodies at this angle flow together naturally. Trines don\'t demand effort; they reward what\'s already in motion. The risk: taking them for granted. A trine is a gift, not a free pass. Use it or lose it.',

    'explainer-opposite': 'An opposition (180°) is two astral bodies facing each other across the sky. It\'s not conflict, it\'s awareness of two viewpoints simultaneously. Oppositions demand balance, not victory. You\'re seeing both sides, which is clarifying if uncomfortable. Integration is the goal.',

    // ============================================================================
    // PRACTICAL: Action hooks
    // ============================================================================

    'practical-conjunction': [
      'Journal: These two energies are speaking as one today. Which takes the lead? Which follows? Write the conversation between {body1} and {body2}.',
      'Action: Start a project that combines both {body1} and {body2} themes. One meeting, one decision, one commitment that honors both.',
      'Conversation: Ask someone close: "What do I do when these two parts of me want the same thing?" Listen for clarity.'
    ],

    'practical-trine': [
      'Action: Do the thing you\'ve been delaying. {body1} and {body2} are holding the door open. Walk through.',
      'Journal: What does "easy" feel like to you today? Write about it without analyzing.',
      'Conversation: Tell someone you trust: "I need your help with {theme}." The moment you ask, the door opens wider.'
    ],

    // ============================================================================
    // SKY WIRE: Strings (public feed)
    // ============================================================================

    'skywire-header': 'Sky Wire: What the astral bodies say today',
    'skywire-footer': 'A view of the planetary movements at a glance. No birth data needed.',

    // ============================================================================
    // UTILITY STRINGS
    // ============================================================================

    'locale-name-en': 'English',
    'locale-name-es': 'Español'
  },
  metadata: {
    allowPartial: false,
    missingKeys: [],
    violations: []
  }
};

export default EN;
