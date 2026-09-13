/*! forecast/news/lint.js: dash and reader-possessive validation (UMD)
 * Three dash encodings checked: literal, escape, entity forms, per the
 * project's zero-em-dash rule.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.NewsLint = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EM_DASH_LITERAL = '—';
  var EN_DASH_LITERAL = '–';
  var EM_DASH_ESCAPE = '\\u2014';
  var EN_DASH_ESCAPE = '\\u2013';
  var EM_DASH_ENTITY = '&mdash;';
  var EN_DASH_ENTITY = '&ndash;';
  var EM_DASH_NUMERIC = '&#8212;';
  var EN_DASH_NUMERIC = '&#8211;';
  var EM_DASH_HEX = '&#x2014;';
  var EN_DASH_HEX = '&#x2013;';

  // Reader-possessive phrases forbidden in public Sky Wire
  var PUBLIC_FORBIDDEN = [
    'your chart', 'your sky', 'your birth', 'your natal', 'in your ',
    'what it means for you', 'how this affects you', 'your personal',
    'for you today', 'your reading', 'your journey', 'your destiny'
  ];

  function hasDash(text) {
    if (!text) return false;
    if (text.indexOf(EM_DASH_LITERAL) !== -1 || text.indexOf(EN_DASH_LITERAL) !== -1) return true;
    if (text.indexOf(EM_DASH_ENTITY) !== -1 || text.indexOf(EN_DASH_ENTITY) !== -1 ||
        text.indexOf(EM_DASH_NUMERIC) !== -1 || text.indexOf(EN_DASH_NUMERIC) !== -1 ||
        text.indexOf(EM_DASH_HEX) !== -1 || text.indexOf(EN_DASH_HEX) !== -1) return true;
    return false;
  }

  function hasEscapedDash(source) {
    return source.indexOf(EM_DASH_ESCAPE) !== -1 || source.indexOf(EN_DASH_ESCAPE) !== -1;
  }

  function lintHeadline(headline) {
    var errors = [];
    if (hasDash(headline)) errors.push('Headline contains em or en dash');
    if (headline.length > 90) errors.push('Headline exceeds 90 chars (' + headline.length + ')');
    if (headline.trim() !== headline) errors.push('Headline has leading/trailing whitespace');
    return { valid: errors.length === 0, errors: errors };
  }

  function lintBody(body) {
    var errors = [];
    if (hasDash(body)) errors.push('Body contains em or en dash');
    if (body.trim() !== body) errors.push('Body has leading/trailing whitespace');
    return { valid: errors.length === 0, errors: errors };
  }

  /**
   * Lint share text for sensitive data leakage. Should contain only:
   * first names, headline, date.
   */
  function lintShareText(shareText, confidentialData) {
    var errors = [];
    confidentialData = confidentialData || {};

    if (hasDash(shareText)) errors.push('Share text contains em or en dash');

    if (/\d+\.\d+[°´]?/.test(shareText)) {
      errors.push('Share text contains degree notation (likely longitude)');
    }

    if (confidentialData.orb !== undefined) {
      var orbStr = confidentialData.orb.toFixed(2);
      if (shareText.indexOf(orbStr) !== -1) errors.push('Share text contains orb value (' + orbStr + ')');
    }

    if (confidentialData.birthDate) {
      if (shareText.indexOf(confidentialData.birthDate) !== -1) errors.push('Share text contains birth date');
      var year = confidentialData.birthDate.split('-')[0];
      if (shareText.indexOf(year) !== -1 && year !== String(new Date().getFullYear())) {
        errors.push('Share text contains potential birth year (' + year + ')');
      }
    }

    return { valid: errors.length === 0, errors: errors };
  }

  /**
   * Lint multiple news items (each: { headline, body, shareText? }).
   */
  function lintBatch(items) {
    var issues = new Map();
    var itemsValid = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var itemErrors = [];

      var headlineResult = lintHeadline(item.headline);
      if (!headlineResult.valid) itemErrors.push('Headline: ' + headlineResult.errors.join('; '));

      var bodyResult = lintBody(item.body);
      if (!bodyResult.valid) itemErrors.push('Body: ' + bodyResult.errors.join('; '));

      if (item.shareText) {
        var shareResult = lintShareText(item.shareText);
        if (!shareResult.valid) itemErrors.push('ShareText: ' + shareResult.errors.join('; '));
      }

      if (itemErrors.length > 0) issues.set('item_' + i, itemErrors);
      else itemsValid++;
    }

    return { itemsChecked: items.length, itemsValid: itemsValid, itemsInvalid: items.length - itemsValid, issues: issues };
  }

  /**
   * Scan source text for literal and entity dash forms. Used in the build
   * process to catch dashes that sneak into templates.
   */
  function scanSourceForDashes(source) {
    var count = 0;
    var locations = [];

    for (var i = 0; i < source.length; i++) {
      if (source[i] === EM_DASH_LITERAL || source[i] === EN_DASH_LITERAL) {
        count++;
        locations.push(i);
      }
    }

    var entityMatches = source.match(/&mdash;|&ndash;|&#8212;|&#8211;|&#x2014;|&#x2013;/g) || [];
    count += entityMatches.length;

    return { hasDashes: count > 0, count: count, locations: locations };
  }

  function validateTemplateLiteral(literal) {
    if (hasEscapedDash(literal)) {
      return { valid: false, message: 'Template contains escaped em or en dash (\\u2014 or \\u2013)' };
    }
    if (hasDash(literal)) {
      return { valid: false, message: 'Template contains literal em or en dash character' };
    }
    return { valid: true, message: 'Template is clean' };
  }

  /**
   * Lint a Sky Wire feed for reader-possessive language. Fails the build
   * if any PUBLIC_FORBIDDEN phrase appears in rendered strings.
   */
  function publicLintFeed(items) {
    var violations = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var lowerHeadline = (item.headline || '').toLowerCase();
      var lowerBody = (item.body || '').toLowerCase();

      for (var j = 0; j < PUBLIC_FORBIDDEN.length; j++) {
        var forbidden = PUBLIC_FORBIDDEN[j];
        if (lowerHeadline.indexOf(forbidden) !== -1) {
          violations.push({ item: 'item[' + i + ']', field: 'headline', violatingPhrase: forbidden, context: (item.headline || '').substring(0, 100) });
        }
        if (lowerBody.indexOf(forbidden) !== -1) {
          violations.push({ item: 'item[' + i + ']', field: 'body', violatingPhrase: forbidden, context: (item.body || '').substring(0, 100) });
        }
      }
    }

    return { valid: violations.length === 0, violations: violations };
  }

  /**
   * Replace text with a safe fallback if any reader-possessive phrase is found.
   */
  function sanitizeForPublic(text, safeFallback) {
    var lowerText = text.toLowerCase();
    for (var i = 0; i < PUBLIC_FORBIDDEN.length; i++) {
      if (lowerText.indexOf(PUBLIC_FORBIDDEN[i]) !== -1) return safeFallback;
    }
    return text;
  }

  return {
    PUBLIC_FORBIDDEN: PUBLIC_FORBIDDEN,
    hasDash: hasDash,
    hasEscapedDash: hasEscapedDash,
    lintHeadline: lintHeadline,
    lintBody: lintBody,
    lintShareText: lintShareText,
    lintBatch: lintBatch,
    scanSourceForDashes: scanSourceForDashes,
    validateTemplateLiteral: validateTemplateLiteral,
    publicLintFeed: publicLintFeed,
    sanitizeForPublic: sanitizeForPublic
  };
}));
