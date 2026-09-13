/*! multiChart.js: synastry contact detection and item building
 * Builds NewsItems from partner chart contacts with importance ceiling 68
 */

const SYNASTRY_CEILING = 68;
const COUPLE_LINK_BONUS = 10;

function verifyCoupleLink(movingPlanet, readerPoint, orb) {
  return Math.abs(orb) <= 1.0;
}

function buildSynastryItem(contact, partner, importance) {
  const capped = Math.min(importance, SYNASTRY_CEILING);
  return {
    id: generateNewsId(contact),
    category: 'transit',
    synastry: true,
    partner: partner,
    importance: capped,
    body: contact.movingPlanet,
    aspect: contact.aspect,
    orb: contact.orb,
    isExact: contact.isExact,
    isCoupleLink: verifyCoupleLink(contact.movingPlanet, contact.aspect, contact.orb)
  };
}

function buildSynastryBody(contact, partner, headlineFilled) {
  const lineText = contact.movingPlanet + ' is ' + contact.aspect + ' their ' + contact.aspect + ' within ' +
                   Math.abs(contact.orb).toFixed(2) + '°.';
  const explainer = 'A ' + contact.aspect + ' is ' + getExplainerFor(contact.aspect) + '.';
  const weather = 'A contact between two charts is weather over the pair, never a verdict on it.';
  return [lineText, explainer, weather].join(' ');
}

function getExplainerFor(aspect) {
  const explanations = {
    'conjunction': 'when two planets occupy the same degree',
    'sextile': '60° angle of support',
    'trine': '120° angle of harmony',
    'square': '90° angle of friction',
    'opposite': '180° angle of polarity'
  };
  return explanations[aspect] || 'an aspect';
}

function generateNewsId(contact) {
  return 'synastry-' + (contact.movingPlanet || 'unknown').replace(/\s+/g, '-').toLowerCase() +
         '-' + (contact.aspect || 'contact').replace(/\s+/g, '-').toLowerCase();
}

function validateSynastryCeiling(items) {
  return items.every(item => !item.synastry || item.importance <= SYNASTRY_CEILING);
}

function validateShareText(text) {
  if (!text) return true;
  const forbidden = /longitude|orb|birth|date|time|coordinate|degree/i;
  return !forbidden.test(text);
}

module.exports = {
  SYNASTRY_CEILING,
  COUPLE_LINK_BONUS,
  verifyCoupleLink,
  buildSynastryItem,
  buildSynastryBody,
  generateNewsId,
  validateSynastryCeiling,
  validateShareText
};
