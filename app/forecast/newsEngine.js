/*! forecast/newsEngine.js: core news item shape and importance scoring (UMD)
 * Single source of truth: every other forecast module reads its constants
 * from here rather than carrying its own copy.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.NewsEngine = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TIER_1_BASE = 50;      // Base importance: Grand Trine, major stations
  var TIER_2_BASE = 45;      // Secondary patterns (T-Square, Yod)
  var TIER_3_BASE = 35;      // Lesser patterns, aspects to slow movers

  var BONUS_EXACTNESS = 10;  // Orb under 0.5 degrees
  var BONUS_PERSONAL = 8;    // Touches natal Sun/Moon/ASC
  var BONUS_NATAL_TOUCH = 10;// Touches a natal point (non-personal)
  var BONUS_RARE = 5;        // Very rare pattern (eg rare harmonic alignment)
  var BONUS_COUPLE_LINK = 10;// Synastry: moving body also contacts reader point

  var IMPORTANCE_CEILING = 68; // Hard cap for synastry items
  var NOTIFY_THRESHOLD = 80;   // Minimum importance to notify

  function baseImportanceForTier(tier) {
    if (tier === 1) return TIER_1_BASE;
    if (tier === 2) return TIER_2_BASE;
    if (tier === 3) return TIER_3_BASE;
    return TIER_3_BASE;
  }

  /**
   * Total importance with bonuses, respecting the synastry ceiling.
   * Synastry items are hard-capped at IMPORTANCE_CEILING so they never
   * reach NOTIFY_THRESHOLD and cannot trigger a push notification.
   */
  function calculateImportance(base, bonuses, isSynastry) {
    bonuses = bonuses || {};
    var total = base;

    if (bonuses.exactness) total += BONUS_EXACTNESS;
    if (bonuses.personalTouch) total += BONUS_PERSONAL;
    if (bonuses.natalTouch) total += BONUS_NATAL_TOUCH;
    if (bonuses.rare) total += BONUS_RARE;
    if (bonuses.coupleLink) total += BONUS_COUPLE_LINK;

    if (isSynastry) total = Math.min(total, IMPORTANCE_CEILING);

    return Math.min(100, total);
  }

  /**
   * Ceiling components spelled out, for tests and review docs to quote
   * rather than restate the arithmetic by hand.
   */
  function verifySynastryCeiling() {
    var parts = [TIER_1_BASE, BONUS_EXACTNESS, BONUS_PERSONAL, BONUS_NATAL_TOUCH, BONUS_RARE];
    var ceiling = parts.reduce(function (a, b) { return a + b; }, 0);
    return { ceiling: ceiling, components: parts.join('+') };
  }

  /**
   * Stable ID for a news item: date + type + first two bodies.
   * Deterministic for a given (date, type, bodies) triple.
   */
  function generateNewsId(type, bodies, date) {
    var dateStr = date.toISOString().split('T')[0];
    var bodyStr = (bodies || []).slice(0, 2).join('_');
    return (dateStr + '_' + type + '_' + bodyStr).replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  }

  function sortByImportance(items) {
    return items.slice().sort(function (a, b) { return b.importance - a.importance; });
  }

  function filterByCategory(items, category) {
    return items.filter(function (i) { return i.category === category; });
  }

  function countByCategory(items) {
    return items.reduce(function (acc, item) {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
  }

  function averageImportance(items) {
    if (items.length === 0) return 0;
    return items.reduce(function (acc, item) { return acc + item.importance; }, 0) / items.length;
  }

  return {
    TIER_1_BASE: TIER_1_BASE, TIER_2_BASE: TIER_2_BASE, TIER_3_BASE: TIER_3_BASE,
    BONUS_EXACTNESS: BONUS_EXACTNESS, BONUS_PERSONAL: BONUS_PERSONAL,
    BONUS_NATAL_TOUCH: BONUS_NATAL_TOUCH, BONUS_RARE: BONUS_RARE, BONUS_COUPLE_LINK: BONUS_COUPLE_LINK,
    IMPORTANCE_CEILING: IMPORTANCE_CEILING, NOTIFY_THRESHOLD: NOTIFY_THRESHOLD,
    baseImportanceForTier: baseImportanceForTier, calculateImportance: calculateImportance,
    verifySynastryCeiling: verifySynastryCeiling, generateNewsId: generateNewsId,
    sortByImportance: sortByImportance, filterByCategory: filterByCategory,
    countByCategory: countByCategory, averageImportance: averageImportance
  };
}));
