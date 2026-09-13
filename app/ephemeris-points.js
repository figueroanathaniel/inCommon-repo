/*! ephemeris-points.js: Centralized point registry. V1.0.0 (UMD)
 *
 * SINGLE SOURCE OF TRUTH for every point the app can render. Each entry holds:
 * - Identification (id, name, glyph, unicode symbol)
 * - Classification (category, sweId for Swiss Ephemeris)
 * - Metadata (tooltip, reference, accuracy notes)
 * - Compute hints (which backend, accuracy tier)
 *
 * CATEGORIES:
 * - basic: Primary 13 points (Sun through South Node). Always in basic chart.
 * - asteroid: Ceres, Pallas, Juno, Vesta. Expanded chart only.
 * - centaur: Chiron. Expanded chart only.
 * - angle: ASC, MC, IC, DC. Only if birth time known.
 * - derived: Earth (opposite Sun), computed not fetched.
 * - hypothetical: Hypothetical points (future).
 * - node: Lunar nodes (North, South). Basic chart.
 *
 * LAYERING RULE:
 * Basic chart renders: category=basic + all nodes + angles (if time known).
 * Expanded adds: asteroids, centaur, hypothetical.
 * Expanded-only items (asteroids, centaur) link back to basic duplicates.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EphemerisPoints = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  /* Swiss Ephemeris body IDs (se_body parameter for swe_calc) */
  var SE = {
    SUN: 0, MOON: 1, MERCURY: 2, VENUS: 3, MARS: 4, JUPITER: 5, SATURN: 6,
    URANUS: 7, NEPTUNE: 8, PLUTO: 9, MEAN_NODE: 10, MEAN_APOG: 11,
    CHIRON: 15, CERES: 10001, PALLAS: 10002, JUNO: 10003, VESTA: 10004
  };

  var REGISTRY = {
    /* BASIC: Always rendered */
    sun: {
      id: 'sun', name: 'Sun', glyph: '☉', category: 'basic',
      sweId: SE.SUN, backends: { current: true, swiss: true },
      accuracy: { current: 'analytical', swiss: 'JPL DE441' },
      tooltip: 'Core essence, ego, identity, conscious will',
      reference: 'Your central reference. The Sun is you.'
    },
    moon: {
      id: 'moon', name: 'Moon', glyph: '☽', category: 'basic',
      sweId: SE.MOON, backends: { current: true, swiss: true },
      accuracy: { current: 'analytical', swiss: 'JPL DE441' },
      tooltip: 'Emotions, instinct, unconscious patterns, security',
      reference: 'How you feel and react. What you need to feel safe.'
    },
    mercury: {
      id: 'mercury', name: 'Mercury', glyph: '☿', category: 'basic',
      sweId: SE.MERCURY, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Communication, thinking, travel, trade, adaptability',
      reference: 'How you think and speak. What you notice.'
    },
    venus: {
      id: 'venus', name: 'Venus', glyph: '♀', category: 'basic',
      sweId: SE.VENUS, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Love, beauty, value, magnetism, pleasure',
      reference: 'What you attract and cherish. How you relate.'
    },
    mars: {
      id: 'mars', name: 'Mars', glyph: '♂', category: 'basic',
      sweId: SE.MARS, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Drive, aggression, passion, action, courage',
      reference: 'Your ambition and appetite. What you fight for.'
    },
    jupiter: {
      id: 'jupiter', name: 'Jupiter', glyph: '♃', category: 'basic',
      sweId: SE.JUPITER, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Expansion, luck, wisdom, growth, excess',
      reference: 'Where you naturally expand. Your luck and generosity.'
    },
    saturn: {
      id: 'saturn', name: 'Saturn', glyph: '♄', category: 'basic',
      sweId: SE.SATURN, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Structure, discipline, limitation, maturity, time',
      reference: 'What you work to master. Where you build.'
    },
    uranus: {
      id: 'uranus', name: 'Uranus', glyph: '♅', category: 'basic',
      sweId: SE.URANUS, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Rebellion, innovation, freedom, shock, awakening',
      reference: 'Where you disrupt. What makes you free.'
    },
    neptune: {
      id: 'neptune', name: 'Neptune', glyph: '♆', category: 'basic',
      sweId: SE.NEPTUNE, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Dreams, illusion, spirituality, dissolution, oneness',
      reference: 'Where you dissolve boundaries. What you imagine.'
    },
    pluto: {
      id: 'pluto', name: 'Pluto', glyph: '♇', category: 'basic',
      sweId: SE.PLUTO, backends: { current: true, swiss: true },
      accuracy: { current: '~0.5° RMS', swiss: 'JPL DE441' },
      tooltip: 'Transformation, power, death/rebirth, obsession',
      reference: 'Where you transform. What you need to release.'
    },

    /* NODES: Basic chart */
    northNode: {
      id: 'northNode', name: 'North Node', glyph: '☊', category: 'node',
      sweId: SE.MEAN_NODE, backends: { current: true, swiss: true },
      accuracy: { current: '~0.02°', swiss: 'JPL DE441' },
      tooltip: 'Soul direction, growth, destiny, what pulls you forward',
      reference: 'Your evolutionary path. Where you\'re meant to grow.'
    },
    southNode: {
      id: 'southNode', name: 'South Node', glyph: '☋', category: 'node',
      computed: 'opposite_of_northNode', backends: { current: true, swiss: true },
      tooltip: 'Soul past, talent, comfort, what you release',
      reference: 'What comes naturally but holds you back. Release it.'
    },

    /* DERIVED: Computed from other points */
    earth: {
      id: 'earth', name: 'Earth', glyph: '⊕', category: 'derived',
      computed: 'opposite_of_sun', backends: { current: true, swiss: true },
      tooltip: 'Grounding point, opposite the Sun in the wheel',
      reference: 'Where you are anchored. The physical plane.'
    },

    /* ASTEROIDS: Expanded chart only */
    chiron: {
      id: 'chiron', name: 'Chiron', glyph: '⚷', category: 'centaur',
      sweId: SE.CHIRON, backends: { current: true, swiss: true },
      accuracy: {
        current: '0.93° worst (fitted to JPL Horizons 1900-2060)',
        swiss: 'JPL DE441',
        notes: 'Current: safe for sign/aspect/gate, not Sabian degree'
      },
      tooltip: 'Wounded healer, bridge, transformation through pain',
      reference: 'Your deepest wound and greatest gift.'
    },
    ceres: {
      id: 'ceres', name: 'Ceres', glyph: '⚳', category: 'asteroid',
      sweId: SE.CERES, backends: { current: true, swiss: true },
      accuracy: { current: '~0.3° (provisional)', swiss: 'JPL DE441' },
      tooltip: 'Nurture, harvest, mothering, care, nourishment',
      reference: 'How you feed. What you harvest.'
    },
    pallas: {
      id: 'pallas', name: 'Pallas', glyph: '⚴', category: 'asteroid',
      sweId: SE.PALLAS, backends: { current: true, swiss: true },
      accuracy: { current: '~0.3° (provisional, i=34.8°)', swiss: 'JPL DE441' },
      tooltip: 'Wisdom, strategy, healing, creative intelligence, pattern',
      reference: 'Your strategic mind. What you see and heal.'
    },
    juno: {
      id: 'juno', name: 'Juno', glyph: '⚵', category: 'asteroid',
      sweId: SE.JUNO, backends: { current: true, swiss: true },
      accuracy: { current: '~0.3° (provisional)', swiss: 'JPL DE441' },
      tooltip: 'Partnership, commitment, fidelity, equality in union',
      reference: 'What you seek in partnership. Your loyalty.'
    },
    vesta: {
      id: 'vesta', name: 'Vesta', glyph: '⚶', category: 'asteroid',
      sweId: SE.VESTA, backends: { current: true, swiss: true },
      accuracy: { current: '~0.3° (provisional)', swiss: 'JPL DE441' },
      tooltip: 'Devotion, focus, sacred flame, inner temple, service',
      reference: 'What you tend. Where you burn bright.'
    }
  };

  /* Ordered list for renderers (matches original hd-transit.js BODIES order) */
  var ORDER = ['sun', 'earth', 'moon', 'mercury', 'venus', 'mars', 'jupiter',
    'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'southNode',
    'chiron', 'ceres', 'pallas', 'juno', 'vesta'];

  function byId(id) { return REGISTRY[id] || null; }
  function all() { return Object.keys(REGISTRY).map(function (k) { return REGISTRY[k]; }); }
  function byCategory(cat) {
    return all().filter(function (p) { return p.category === cat; });
  }
  function ordered() { return ORDER.map(byId).filter(Boolean); }

  return {
    VERSION: VERSION, SE: SE, REGISTRY: REGISTRY, ORDER: ORDER,
    byId: byId, all: all, byCategory: byCategory, ordered: ordered
  };
}));
