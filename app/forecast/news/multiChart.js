/*! forecast/news/multiChart.js: synastry news items from partner charts (UMD)
 * A synastry item IS a transit item with category='transit', synastry=true,
 * partner={id,name}. Importance ceiling: 68 (hard-capped so it never
 * triggers a push notification).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../newsEngine'), require('./synastryTemplates'));
  } else {
    root.MultiChart = factory(root.NewsEngine, root.SynastryTemplates);
  }
}(typeof self !== 'undefined' ? self : this, function (NE, ST) {
  'use strict';

  /**
   * Build a synastry news item from a contact.
   * input: { contact, partner: {id,name}, isPersonalTouch, hasNatalTouch?, isRare?, date }
   */
  function buildSynastryItem(input) {
    var contact = input.contact;
    var partner = input.partner;
    var isPersonalTouch = input.isPersonalTouch;
    var hasNatalTouch = input.hasNatalTouch;
    var isRare = input.isRare;
    var date = input.date;

    var tier = 1; // Synastry items are typically Tier 1
    var base = NE.TIER_1_BASE;

    var importance = NE.calculateImportance(
      base,
      {
        exactness: contact.isExact,
        personalTouch: isPersonalTouch,
        natalTouch: hasNatalTouch,
        rare: isRare,
        coupleLink: contact.isCoupleLink
      },
      true // isSynastry caps at IMPORTANCE_CEILING
    );

    var templates = ST.synastryTemplatesFor(contact.aspect);
    var template = ST.pickSynastryTemplate(templates);
    var headline = ST.fillSynastryTemplate(
      template, contact.movingBody, contact.partnerBody, partner.name, contact.aspect
    );

    var body = buildSynastryBody(contact);

    var id = NE.generateNewsId(
      'synastry-' + contact.aspect, [contact.movingBody, contact.partnerBody], date
    );

    var keywords = [
      contact.movingBody.toLowerCase(),
      contact.partnerBody.toLowerCase(),
      contact.aspect,
      'synastry',
      partner.id
    ];

    return {
      id: id,
      headline: headline,
      body: body,
      category: 'transit', // Synastry items ARE transit items
      tier: tier,
      type: contact.aspect,
      importance: importance,
      isNew: true,
      keywords: keywords,
      synastry: true,
      partner: { id: partner.id, name: partner.name },
      bodies: [contact.movingBody, contact.partnerBody]
    };
  }

  /**
   * Body is three parts: the calculated line (always visible), the
   * explainer (behind tap to expand), and a sentence about weather, not verdict.
   */
  function buildSynastryBody(contact) {
    var movingBody = contact.movingBody, partnerBody = contact.partnerBody,
        aspect = contact.aspect, orb = contact.orb;

    var calculatedLine = movingBody + ' is ' + aspect.toLowerCase() + ' their ' + partnerBody + ' within ' + orb.toFixed(2) + '°.';
    var explainer = getAspectExplainer(aspect);
    var weatherLine = 'A contact between two charts is weather over the pair, never a verdict on it.';

    return calculatedLine + '\n\n' + explainer + '\n\n' + weatherLine;
  }

  function getAspectExplainer(aspect) {
    var explainers = {
      conjunction: 'A conjunction is when two astral bodies occupy the same degree. Between you, it means your energies are merged, speaking as one. Whatever these astral bodies represent are amplified when together, for better and for worse.',
      sextile: 'A sextile (60 degrees) is one of astrology\'s easy aspects. Between you two, it\'s an opening. Conversation flows. This is an area where mutual support comes naturally.',
      square: 'A square (90 degrees) is tension in geometric form. Between you, these astral bodies want different things, creating productive friction. It\'s the friction that keeps things interesting and sharp.',
      trine: 'A trine (120 degrees) is harmony. Between you, it\'s where things flow. This is where the two of you understand each other without asking. A rare gift that deepens with use.',
      opposite: 'An opposition (180 degrees) is two astral bodies facing each other. Between you, it\'s mutual reflection. One wants to lead, the other to balance. Integration is the goal, not dominance.'
    };
    return explainers[aspect] || 'A contact between your charts.';
  }

  /**
   * Build synastry items from a list of contacts, sorted by importance
   * (highest first).
   */
  function buildSynastryItems(contacts, partner, options) {
    options = options || {};
    var items = [];

    for (var i = 0; i < contacts.length; i++) {
      var contact = contacts[i];
      var isPersonal = !!(options.personalPointIds && options.personalPointIds.indexOf(contact.movingBody) !== -1);

      var item = buildSynastryItem({
        contact: contact,
        partner: { id: partner.id, name: partner.name },
        isPersonalTouch: isPersonal,
        hasNatalTouch: false, // Would be determined by actual chart data
        isRare: false,        // Would be determined by pattern analysis
        date: new Date()
      });

      if (options.filterByImportance !== undefined) {
        if (item.importance >= options.filterByImportance) items.push(item);
      } else {
        items.push(item);
      }
    }

    return items.sort(function (a, b) { return b.importance - a.importance; });
  }

  /**
   * Non-synastry items are not capped; used in tests to ensure the ceiling
   * is enforced on the items that need it.
   */
  function validateSynastryCeiling(item) {
    if (!item.synastry) return true;
    return item.importance <= NE.IMPORTANCE_CEILING;
  }

  /**
   * Ensure no longitudes, orbs, or birth data leak into share text.
   */
  function validateShareText(shareText, contact) {
    var hasLongitude = /\d+\.\d+[°]?/g.test(shareText);
    var hasOrb = shareText.indexOf(contact.orb.toFixed(2)) !== -1;
    var yearMatch = shareText.match(/\d{4}/);
    var hasBirthData = /\d{4}/.test(shareText) && yearMatch && yearMatch[0] !== String(new Date().getFullYear());

    return !hasLongitude && !hasOrb && !hasBirthData;
  }

  /**
   * Couple-link bonus: moving body contacts the reader's own point within
   * the given threshold (default 1 degree), wrapping across the 0/360 seam.
   */
  function verifyCoupleLink(movingLng, readerPointLng, threshold) {
    threshold = threshold === undefined ? 1.0 : threshold;
    var diff = Math.abs(movingLng - readerPointLng);
    return diff <= threshold || Math.abs(diff - 360) <= threshold;
  }

  return {
    buildSynastryItem: buildSynastryItem,
    buildSynastryItems: buildSynastryItems,
    validateSynastryCeiling: validateSynastryCeiling,
    validateShareText: validateShareText,
    verifyCoupleLink: verifyCoupleLink
  };
}));
