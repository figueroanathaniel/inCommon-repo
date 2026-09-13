/*! i18n/en.js: English locale catalog (UMD)
 * DERIVED from the template tables in app/forecast/content/*.ts and
 * app/forecast/news/synastryTemplates.js; hand-editing this file is an
 * error, add templates to the source table instead.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.I18nEN = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    locale: 'en',
    strings: {
      // ---- TRANSIT: Aspects (Headlines) ----

      'transit-conjunction': [
        '{planet1} and {planet2} meet at {time}. Same frequency. Watch for {theme}.',
        'Merger alert: {planet1} {planet2} {time}. Two energies speaking the same language today.',
        '{planet1} conjunct {planet2} {time}. They\'re not arguing. They\'re aligned.'
      ],

      'transit-sextile': [
        '{planet1} sextile {planet2}, {time}: diplomacy gets a green light. Use it before your inbox ruins your mood.',
        'A sextile is luck showing up. {planet1} to {planet2}, {time}. {theme} is easy today if you ask for it.',
        '{time}: {planet1} and {planet2} are friends. This is the hour to start {theme}.'
      ],

      'transit-square': [
        '{planet1} square {planet2} {time}. Translation: friction. The kind that sharpens or stalls. Which depends on you.',
        'Two planets at odds: {planet1} {planet2} {time}. Expect the resistance. It\'s trying to teach you something.',
        'Hard aspect alert, {time}: {planet1} and {planet2} want different things. Channel it into {theme}.'
      ],

      'transit-trine': [
        'A gift lands {time}: {planet1} trine {planet2}. {theme} flows. Don\'t waste it on autopilot.',
        '{time}, {planet1} and {planet2} are in conversation. The air is clear for {theme}.',
        'Rare ease: {planet1} trine {planet2}, {time}. This is what favor of the planets looks like.'
      ],

      'transit-opposite': [
        '{planet1} opposite {planet2}, {time}. Tension, but also clarity. You\'re seeing both sides.',
        'Two poles {time}: {planet1} {planet2}. One wants to lead, the other to reflect. Balance is today\'s work.',
        'Mirror time {time}: {planet1} opposite {planet2}. Who else\'s perspective are you avoiding?'
      ],

      // ---- SYNASTRY: Aspects (Headlines) ----

      'synastry-conjunction': [
        '{planet1} and their {planet2} meet today. Same frequency between you.',
        'A merger: your {planet1} conjunct their {planet2}, {name}. Two energies aligned.',
        'Your {planet1} finds their {planet2} today. You\'re speaking the same language.'
      ],

      'synastry-trine': [
        'A gift between you: your {planet1} trine their {planet2}, {name}. It flows.',
        'Your {planet1} and their {planet2} are in conversation. The air is clear.',
        'Rare ease between you today: your {planet1} trine their {planet2}. Use it.'
      ],

      'synastry-square': [
        'Your {planet1} square their {planet2}, {name}. Friction between you. Channel it.',
        'A hard angle: your {planet1} and their {planet2} want different things today.',
        'Your {planet1} meets resistance in their {planet2}. That\'s the work of the day.'
      ],

      // ---- EXPLAINERS: Aspects ----

      'explainer-conjunction': 'A conjunction is when two planets occupy the same degree. They\'re "merged." Whatever energies these planets represent are speaking in unison today, amplified, urgent, singular in focus. Conjunctions are powerful but undifferentiated; context matters enormously.',

      'explainer-sextile': 'A sextile (60°) is one of astrology\'s "easy" aspects. Two planets at this angle support each other. It\'s like a green light: opportunity presenting itself. Sextiles don\'t force action, but they make forward motion possible. Look for doors opening.',

      'explainer-trine': 'A trine (120°) is harmony. Two planets at this angle flow together naturally. Trines don\'t demand effort; they reward what\'s already in motion. The risk: taking them for granted. A trine is a gift, not a free pass. Use it or lose it.',

      'explainer-opposite': 'An opposition (180°) is two planets facing each other across the sky. It\'s not conflict, it\'s awareness of two viewpoints simultaneously. Oppositions demand balance, not victory. You\'re seeing both sides, which is clarifying if uncomfortable. Integration is the goal.',

      // ---- PRACTICAL: Action hooks ----

      'practical-conjunction': [
        'Journal: These two energies are speaking as one today. Which takes the lead? Which follows? Write the conversation between {planet1} and {planet2}.',
        'Action: Start a project that combines both {planet1} and {planet2} themes. One meeting, one decision, one commitment that honors both.',
        'Conversation: Ask someone close: "What do I do when these two parts of me want the same thing?" Listen for clarity.'
      ],

      'practical-trine': [
        'Action: Do the thing you\'ve been delaying. {planet1} and {planet2} are holding the door open. Walk through.',
        'Journal: What does "easy" feel like to you today? Write about it without analyzing.',
        'Conversation: Tell someone you trust: "I need your help with {theme}." The moment you ask, the door opens wider.'
      ],

      // ---- SKY WIRE: Strings (public feed) ----

      'skywire-header': 'Sky Wire: What the planets say today',
      'skywire-footer': 'A view of the planetary movements at a glance. No birth data needed.',

      // ---- UTILITY STRINGS ----

      'locale-name-en': 'English',
      'locale-name-es': 'Español'
    },
    metadata: {
      allowPartial: false,
      missingKeys: [],
      violations: []
    }
  };
}));
