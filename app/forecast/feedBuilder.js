/*! forecast/feedBuilder.js: feed orchestration and filtering (UMD)
 * Merges base items with synastry items, sorts by importance. Single
 * source of truth for feed composition.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./newsEngine'), require('./news/multiChart'));
  } else {
    root.FeedBuilder = factory(root.NewsEngine, root.MultiChart);
  }
}(typeof self !== 'undefined' ? self : this, function (NE, MC) {
  'use strict';

  /**
   * Build the complete feed, merging base items with synastry items.
   * input: { baseItems, partners?, personalPointIds?, options?: { maxSynastryItems?, minImportance? } }
   */
  function buildFeed(input) {
    var allItems = [].concat(input.baseItems);

    if (input.partners && input.partners.length > 0) {
      for (var p = 0; p < input.partners.length; p++) {
        // In a real implementation this would compute synastry contacts;
        // an empty contact list demonstrates the structure without one.
        var synastryItems = MC.buildSynastryItems([], input.partners[p], {
          personalPointIds: input.personalPointIds
        });
        allItems = allItems.concat(synastryItems);
      }
    }

    var options = input.options || {};
    var filtered = options.minImportance !== undefined
      ? allItems.filter(function (i) { return i.importance >= options.minImportance; })
      : allItems;

    var final = NE.sortByImportance(filtered);

    if (options.maxSynastryItems !== undefined) {
      var baseNonSynastry = final.filter(function (i) { return !i.synastry; });
      var synastryLimited = final.filter(function (i) { return i.synastry; }).slice(0, options.maxSynastryItems);
      final = NE.sortByImportance(baseNonSynastry.concat(synastryLimited));
    }

    var stats = {
      baseItems: input.baseItems.length,
      synastryItems: final.filter(function (i) { return i.synastry; }).length,
      totalItems: final.length,
      itemsByCategory: countByCategory(final),
      itemsByPartner: countByPartner(final)
    };

    return { items: final, stats: stats };
  }

  function countByCategory(items) {
    var counts = {};
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var key = item.synastry ? item.category + ':synastry' : item.category;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  function countByPartner(items) {
    var counts = {};
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.synastry && item.partner) counts[item.partner.id] = (counts[item.partner.id] || 0) + 1;
    }
    return counts;
  }

  /**
   * Filter feed by depth setting (headlines, standard, deep).
   */
  function filterByDepth(items, depth) {
    depth = depth || 'standard';

    if (depth === 'headlines') {
      return items.filter(function (i) { return !i.synastry && i.tier === 1 && i.category === 'pattern'; });
    }
    if (depth === 'standard') {
      return items.filter(function (i) { return i.category !== 'harmonic' && i.category !== 'degree-lore'; });
    }
    return items; // deep: everything
  }

  /**
   * Cap the number of items shown, by feed surface.
   */
  function capByFeedType(items, feedType) {
    feedType = feedType || 'today-forecast';

    if (feedType === 'today-forecast') return items.slice(0, 5);
    if (feedType === 'important-today') return items.slice(0, 10);
    if (feedType === 'full') return items;
    return items.slice(0, 5);
  }

  /**
   * Load partners from the saved-people store. Respects the 12-person cap
   * and the consent story; not yet wired to people-library.js.
   */
  function loadPartnersFromStore() {
    return [];
  }

  function validatePartnerChart(partner) {
    var errors = [];
    if (!partner.id) errors.push('Partner missing id');
    if (!partner.name) errors.push('Partner missing name');
    if (!partner.birthDate) errors.push('Partner missing birthDate');
    if (!partner.planets || Object.keys(partner.planets).length === 0) errors.push('Partner missing computed planets');
    return { valid: errors.length === 0, errors: errors };
  }

  /**
   * Display name for a news item. Synastry items carry a partner name chip.
   */
  function displayName(item) {
    if (item.synastry && item.partner) return item.headline + ' (' + item.partner.name + ')';
    return item.headline;
  }

  /**
   * Visual distinction marker for synastry items.
   */
  function visualMarker(item) {
    if (item.synastry && item.partner) {
      return { marker: item.partner.name.substring(0, 1).toUpperCase(), type: 'chip' };
    }
    return { marker: '', type: 'glyph' };
  }

  /**
   * Explainer text for synastry context: the third part of the three-part
   * structure (calculated line, explainer, weather sentence).
   */
  function synastryExplainer(item) {
    if (!item.synastry || !item.partner) return null;
    return 'A contact between two charts is weather over the pair, never a verdict on it.';
  }

  return {
    buildFeed: buildFeed,
    filterByDepth: filterByDepth,
    capByFeedType: capByFeedType,
    loadPartnersFromStore: loadPartnersFromStore,
    validatePartnerChart: validatePartnerChart,
    displayName: displayName,
    visualMarker: visualMarker,
    synastryExplainer: synastryExplainer
  };
}));
