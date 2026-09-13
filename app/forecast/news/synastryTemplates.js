/*! synastryTemplates.js: synastry aspect headline templates
 * Three variants per aspect, placeholder-only substitution
 */

const TEMPLATES = {
  'conjunction': [
    '{planet1} and their {planet2} meet today. Same frequency between you.',
    'A merger: your {planet1} conjunct their {planet2}, {name}. Two energies aligned.',
    'Your {planet1} finds their {planet2} today. You\'re speaking the same language.'
  ],
  'sextile': [
    'Ease between you: your {planet1} sextile their {planet2}, {name}. A green light.',
    'Your {planet1} and their {planet2} are friends. This is the hour to start something.',
    '{planet1} sextil a {planet2}, {name}: diplomacy gets the nod.'
  ],
  'trine': [
    'A gift between you: your {planet1} trine their {planet2}, {name}. It flows.',
    'Your {planet1} and their {planet2} are in conversation. The air is clear.',
    'Rare ease between you today: your {planet1} trine their {planet2}. Use it.'
  ],
  'square': [
    'Your {planet1} square their {planet2}, {name}. Friction between you. Channel it.',
    'A hard angle: your {planet1} and their {planet2} want different things today.',
    'Your {planet1} meets resistance in their {planet2}. That\'s the work of the day.'
  ],
  'opposite': [
    'Your {planet1} opposite their {planet2}, {name}. Tension, but also clarity.',
    'Mirror time: two poles, one wants to lead, the other to reflect. Balance is today\'s work.',
    'Who else\'s perspective are you avoiding?'
  ]
};

function synastryTemplatesFor(type) {
  return TEMPLATES[type] || [];
}

function pickSynastryTemplate(type, index) {
  const templates = TEMPLATES[type] || [];
  return templates[Math.max(0, Math.min(index, templates.length - 1))];
}

function fillSynastryTemplate(template, planet1, planet2, name) {
  if (!template) return '';
  let result = template;
  result = result.replace(/{planet1}/g, planet1 || 'Unknown');
  result = result.replace(/{planet2}/g, planet2 || 'Unknown');
  result = result.replace(/{name}/g, name || 'You');
  return result;
}

module.exports = {
  TEMPLATES,
  synastryTemplatesFor,
  pickSynastryTemplate,
  fillSynastryTemplate
};
