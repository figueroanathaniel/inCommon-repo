/*! i18n/en.js
 * English locale catalog for inCommon forecast system
 */

const EN = {
  locale: 'en',
  strings: {
    'transit-conjunction': [
      '{planet1} and {planet2} meet at {time}. Same frequency. Watch for {theme}.',
      'Merger alert: {planet1} {planet2} {time}. Two energies speaking the same language today.',
      '{planet1} conjunct {planet2} {time}. They\'re not arguing. They\'re aligned.'
    ],
    'transit-trine': [
      'A gift lands {time}: {planet1} trine {planet2}. {theme} flows. Don\'t waste it on autopilot.',
      '{time}, {planet1} and {planet2} are in conversation. The air is clear for {theme}.',
      'Rare ease: {planet1} trine {planet2}, {time}. This is what favor looks like.'
    ],
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
    'locale-name-en': 'English'
  },
  metadata: { allowPartial: false, missingKeys: [], violations: [] }
};

module.exports = EN;
