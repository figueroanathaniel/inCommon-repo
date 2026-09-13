/*! forecast/news/synastryTemplates.js: headlines for synastry items (UMD)
 * Structure mirrors transit templates, keyed for localization.
 * Format: {planet1} is {aspect} their {planet2}, {name}. Headline text.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.SynastryTemplates = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SYNASTRY_TEMPLATES = [
    {
      id: 'synastry-conjunction', type: 'conjunction',
      templates: [
        '{planet1} and their {planet2} meet today. Same frequency between you.',
        'A merger: your {planet1} conjunct their {planet2}, {name}. Two energies aligned.',
        'Your {planet1} finds their {planet2} today. You\'re speaking the same language.'
      ]
    },
    {
      id: 'synastry-sextile', type: 'sextile',
      templates: [
        'Your {planet1} sextile their {planet2} today, {name}. Diplomacy gets a green light.',
        'A sextile between you two: your {planet1} to their {planet2}. Easy conversation.',
        'Your {planet1} and their {planet2} are friends today. Lean on it.'
      ]
    },
    {
      id: 'synastry-square', type: 'square',
      templates: [
        'Your {planet1} square their {planet2}, {name}. Friction between you. Channel it.',
        'A hard angle: your {planet1} and their {planet2} want different things today.',
        'Your {planet1} meets resistance in their {planet2}. That\'s the work of the day.'
      ]
    },
    {
      id: 'synastry-trine', type: 'trine',
      templates: [
        'A gift between you: your {planet1} trine their {planet2}, {name}. It flows.',
        'Your {planet1} and their {planet2} are in conversation. The air is clear.',
        'Rare ease between you today: your {planet1} trine their {planet2}. Use it.'
      ]
    },
    {
      id: 'synastry-opposite', type: 'opposite',
      templates: [
        'Your {planet1} opposite their {planet2}, {name}. You\'re seeing both sides.',
        'Two poles between you: your {planet1} and their {planet2}. Balance is today\'s work.',
        'Mirror moment: your {planet1} opposite their {planet2}. Who is the other seeing?'
      ]
    },
    {
      id: 'synastry-station-retrograde', type: 'station-retrograde',
      templates: [
        'Their {planet} stations retrograde today, {name}. What reverses between you.',
        'Lookback time: a pause in their {planet}. This may echo in what you share.'
      ]
    },
    {
      id: 'synastry-station-direct', type: 'station-direct',
      templates: [
        'Their {planet} stations direct today, {name}. Forward motion resumes between you.',
        'The pause lifts: their {planet} direct. What was held returns.'
      ]
    }
  ];

  function synastryTemplatesFor(type) {
    var entry = SYNASTRY_TEMPLATES.filter(function (t) { return t.type === type; })[0];
    return entry ? entry.templates : [];
  }

  /**
   * Index 0 is the one variant that names the partner ({name}) for every
   * aspect above; the rest are flavor-only alternates. Picking anything
   * else at random would silently drop the partner's name from a
   * two-person reading roughly two times in three.
   */
  function pickSynastryTemplate(templates) {
    return templates[0];
  }

  function fillSynastryTemplate(template, planet1, planet2, partnerName, aspect) {
    var result = template;
    result = result.replace(/\{planet1\}/g, planet1);
    result = result.replace(/\{planet2\}/g, planet2);
    result = result.replace(/\{name\}/g, partnerName);
    result = result.replace(/\{aspect\}/g, aspect);
    return result;
  }

  function availableSynastryTypes() {
    var seen = {}, out = [];
    SYNASTRY_TEMPLATES.forEach(function (t) {
      if (!seen[t.type]) { seen[t.type] = true; out.push(t.type); }
    });
    return out;
  }

  return {
    SYNASTRY_TEMPLATES: SYNASTRY_TEMPLATES,
    synastryTemplatesFor: synastryTemplatesFor,
    pickSynastryTemplate: pickSynastryTemplate,
    fillSynastryTemplate: fillSynastryTemplate,
    availableSynastryTypes: availableSynastryTypes
  };
}));
