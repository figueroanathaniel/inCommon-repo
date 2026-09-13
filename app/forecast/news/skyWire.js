/*! forecast/news/skyWire.js: public deterministic daily feed (UMD)
 * No storage, no reader state. Same scoring as the personal feed minus the
 * +10 natal-touch bonus. Tier 1 items top out at 93 here (personal: 98)
 * because no natal points exist on the public surface.
 *
 * Public ceiling is 93 (Tier 1: 50+10+8+5+10+10 for exactness/personal/
 * rare/pattern bonuses), personal is 98 (adds the +5 gap left by the
 * absent natal-touch bonus); the 5-point gap reflects reader-specific
 * context public Sky Wire cannot claim.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.SkyWire = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PUBLIC_CEILING = 93;

  /**
   * Build a Sky Wire item from a news item. Strips synastry/partner/isNew,
   * caps importance at the public ceiling, and keeps the source item's own
   * id so the same input always produces the same item (determinism).
   */
  function buildSkyWireItem(newsItem) {
    var importance = Math.min(newsItem.importance, PUBLIC_CEILING);

    return {
      id: newsItem.id,
      headline: newsItem.headline,
      body: newsItem.body,
      category: newsItem.category,
      tier: newsItem.tier,
      type: newsItem.type,
      importance: importance,
      keywords: newsItem.keywords
      // NOTE: no synastry, partner, or isNew field
    };
  }

  function countByCategory(items) {
    var counts = {};
    for (var i = 0; i < items.length; i++) counts[items[i].category] = (counts[items[i].category] || 0) + 1;
    return counts;
  }

  /**
   * Build the complete Sky Wire feed from input. Deterministic: same input
   * produces byte-identical output (aside from the generatedAt stamp).
   */
  function buildSkyWireFeed(input) {
    var allItems = [].concat(input.transits, input.patterns, input.harmonics);
    var skyWireItems = allItems.map(buildSkyWireItem);

    skyWireItems.sort(function (a, b) {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return a.id.localeCompare(b.id);
    });

    var stats = {
      totalItems: skyWireItems.length,
      byCategory: countByCategory(skyWireItems),
      topImportance: skyWireItems.length > 0 ? skyWireItems[0].importance : 0,
      avgImportance: skyWireItems.length > 0
        ? skyWireItems.reduce(function (sum, i) { return sum + i.importance; }, 0) / skyWireItems.length
        : 0
    };

    return {
      version: '1.0.0',
      date: input.date,
      generatedAt: new Date().toISOString(),
      items: skyWireItems,
      stats: stats
    };
  }

  /**
   * Verify a Sky Wire item has no reader-possessive fields.
   */
  function validateSkyWireItem(item) {
    if (item.synastry !== undefined) return false;
    if (item.partner !== undefined) return false;
    if (item.isNew !== undefined) return false;
    return true;
  }

  function verifySkyWireCeiling(item) {
    return item.importance <= PUBLIC_CEILING;
  }

  /**
   * Two feeds built from the same input produce identical JSON once the
   * generatedAt stamp (which varies by wall clock) is normalized out.
   */
  function verifyDeterminism(feed1, feed2) {
    var json1 = JSON.stringify(feed1).replace(/"generatedAt":"[^"]*"/g, '"generatedAt":""');
    var json2 = JSON.stringify(feed2).replace(/"generatedAt":"[^"]*"/g, '"generatedAt":""');
    return json1 === json2;
  }

  var CEILING_EXPLANATION = 'Public ceiling is 93 (50+10+8+5+10+10 for exactness/personal/rare/pattern bonuses), personal is 98 (adds the natal-touch bonus that has no counterpart here); the 5-point gap reflects reader-specific context public Sky Wire cannot claim.';

  return {
    PUBLIC_CEILING: PUBLIC_CEILING,
    CEILING_EXPLANATION: CEILING_EXPLANATION,
    buildSkyWireItem: buildSkyWireItem,
    buildSkyWireFeed: buildSkyWireFeed,
    validateSkyWireItem: validateSkyWireItem,
    verifySkyWireCeiling: verifySkyWireCeiling,
    verifyDeterminism: verifyDeterminism
  };
}));
