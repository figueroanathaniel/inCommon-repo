/*! hd-topology.js: the wiring itself, as facts. V1.0.0 (UMD)
 *
 * WHY THIS IS ITS OWN MODULE. hd-atlas.js held two different things under
 * one roof: which gates pair into which channel and which centre each gate
 * belongs to, which are facts about a system nobody owns, and the names,
 * themes and meanings written against them, which are inCommon's. Mechanics
 * needed the first and had to reach into an interpretation module to get it,
 * so hd-composite.js and hd-circle.js each carried a declared boundary
 * crossing. This file is the first half, on the mechanics side, and those
 * crossings are gone.
 *
 * THERE IS NOTHING TO INTERPRET IN HERE AND THERE MUST NOT BE. No channel
 * name, no theme, no meaning, no gate name. A gate is a number and a centre
 * is a place in the body graph. Anything that reads as writing belongs in
 * hd-atlas.js, which is allowed to read this file because interpretation may
 * depend on mechanics and not the other way round.
 *
 * GENERATED ONCE from the tables that were in hd-atlas.js, rather than
 * retyped, because sixty four gate to centre mappings copied by hand is
 * sixty four chances to put a gate in the wrong centre and produce a chart
 * that is wrong and looks right. hd-atlas keeps its descriptor tables keyed
 * by the same channel strings, and a test asserts the two key sets are
 * identical, which is the same discipline that already holds the app's own
 * channel table to the atlas.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDTopology = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  /* The nine centres, in the order a bodygraph is read down the page. */
  var CENTERS = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Spleen', 'Sacral', 'Solar Plexus', 'Root'];

  /* The thirty six channels, written low-high, which is the order
     channelKey() produces. */
  var PAIRS = [
    '1-8', '2-14', '3-60', '4-63', '5-15', '6-59',
    '7-31', '9-52', '10-20', '10-34', '10-57', '11-56',
    '12-22', '13-33', '16-48', '17-62', '18-58', '19-49',
    '20-34', '20-57', '21-45', '23-43', '24-61', '25-51',
    '26-44', '27-50', '28-38', '29-46', '30-41', '32-54',
    '34-57', '35-36', '37-40', '39-55', '42-53', '47-64'
  ];

  /* Which centre each of the sixty four gates belongs to. */
  var CENTER_OF = {
    1: 'G', 2: 'G', 3: 'Sacral', 4: 'Ajna',
    5: 'Sacral', 6: 'Solar Plexus', 7: 'G', 8: 'Throat',
    9: 'Sacral', 10: 'G', 11: 'Ajna', 12: 'Throat',
    13: 'G', 14: 'Sacral', 15: 'G', 16: 'Throat',
    17: 'Ajna', 18: 'Spleen', 19: 'Root', 20: 'Throat',
    21: 'Heart', 22: 'Solar Plexus', 23: 'Throat', 24: 'Ajna',
    25: 'G', 26: 'Heart', 27: 'Sacral', 28: 'Spleen',
    29: 'Sacral', 30: 'Solar Plexus', 31: 'Throat', 32: 'Spleen',
    33: 'Throat', 34: 'Sacral', 35: 'Throat', 36: 'Solar Plexus',
    37: 'Solar Plexus', 38: 'Root', 39: 'Root', 40: 'Heart',
    41: 'Root', 42: 'Sacral', 43: 'Ajna', 44: 'Spleen',
    45: 'Throat', 46: 'G', 47: 'Ajna', 48: 'Spleen',
    49: 'Solar Plexus', 50: 'Spleen', 51: 'Heart', 52: 'Root',
    53: 'Root', 54: 'Root', 55: 'Solar Plexus', 56: 'Throat',
    57: 'Spleen', 58: 'Root', 59: 'Sacral', 60: 'Root',
    61: 'Head', 62: 'Throat', 63: 'Head', 64: 'Head'
  };

  function channelKey(a, b) { return Math.min(a, b) + '-' + Math.max(a, b); }
  function centerOf(gate) { return CENTER_OF[gate] || null; }
  /* The pairs as numbers, which is the shape every caller actually wanted
     and rebuilt for itself out of the keys. */
  function pairs() {
    return PAIRS.map(function (k) {
      var p = k.split('-');
      return { key: k, a: +p[0], b: +p[1] };
    });
  }
  function channelsFor(gate) {
    return pairs().filter(function (c) { return c.a === gate || c.b === gate; });
  }

  return { VERSION: VERSION, CENTERS: CENTERS, PAIRS: PAIRS, CENTER_OF: CENTER_OF,
    channelKey: channelKey, centerOf: centerOf, pairs: pairs, channelsFor: channelsFor };
}));
