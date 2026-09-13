/*! i18n/index.js: localization runtime (UMD)
 * Locale switching, catalog loading, placeholder replacement. Never
 * concatenates fragments; only fills placeholders in complete sentences.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./en'), require('./es'));
  } else {
    root.I18n = factory(root.I18nEN, root.I18nES);
  }
}(typeof self !== 'undefined' ? self : this, function (EN, ES) {
  'use strict';

  var activeLocale = 'en';
  var activeCatalog = EN;

  // Every real template list in this catalog carries at most three flavor
  // variants; a key with more is treated as a maintenance runaway.
  var MAX_VARIANTS = 3;

  /**
   * Set the active locale and load its catalog. Throws if the locale isn't
   * available.
   */
  function setLocale(locale) {
    var catalogs = { en: EN, es: ES };
    if (!catalogs[locale]) throw new Error('Unknown locale: ' + locale);
    activeLocale = locale;
    activeCatalog = catalogs[locale];
  }

  function getLocale() {
    return activeLocale;
  }

  function getCatalog() {
    return activeCatalog;
  }

  /**
   * Fill placeholders in a template string.
   * Example: fillPlaceholders('Mercury sextile {planet2} at {time}', { planet2: 'Venus', time: '2pm' })
   */
  function fillPlaceholders(template, placeholders) {
    if (!placeholders || Object.keys(placeholders).length === 0) return template;
    var result = template;
    Object.keys(placeholders).forEach(function (key) {
      result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), String(placeholders[key]));
    });
    return result;
  }

  /**
   * Translate a key with placeholder substitution. Falls back to the key
   * name when the entry is missing, so a missing translation is visible
   * rather than blank.
   */
  function t(key, placeholders) {
    var entry = activeCatalog.strings[key];

    if (!entry) {
      console.warn('Missing translation key: ' + key);
      return key;
    }

    if (typeof entry === 'string') return fillPlaceholders(entry, placeholders);
    if (Array.isArray(entry)) return fillPlaceholders(entry[0], placeholders);
    return key;
  }

  /**
   * Pick a specific variant and translate it.
   */
  function pickVariant(key, variantIndex, placeholders) {
    var entry = activeCatalog.strings[key];

    if (!entry) {
      console.warn('Missing translation key: ' + key);
      return key;
    }

    if (typeof entry === 'string') return fillPlaceholders(entry, placeholders);

    if (Array.isArray(entry)) {
      if (variantIndex >= entry.length) {
        console.warn('Variant index ' + variantIndex + ' out of bounds for ' + key);
        return fillPlaceholders(entry[0], placeholders);
      }
      return fillPlaceholders(entry[variantIndex], placeholders);
    }

    return key;
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    var ok = true;
    a.forEach(function (item) { if (!b.has(item)) ok = false; });
    return ok;
  }

  /**
   * Check tone violations in a translated string: dashes (all three
   * encodings) and, for Spanish, reader-possessive phrases.
   */
  function checkTone(text, locale) {
    var EM_DASH = String.fromCharCode(0x2014);
    var EN_DASH = String.fromCharCode(0x2013);

    if (text.indexOf(EM_DASH) !== -1 || text.indexOf(EN_DASH) !== -1) return 'Contains em or en dash';

    if (text.indexOf('&mdash;') !== -1 || text.indexOf('&ndash;') !== -1 ||
        text.indexOf('&#8212;') !== -1 || text.indexOf('&#8211;') !== -1 ||
        text.indexOf('&#x2014;') !== -1 || text.indexOf('&#x2013;') !== -1) {
      return 'Contains dash entity';
    }

    if (locale === 'es') {
      var forbidden = ['tu gráfico', 'tu cielo', 'en tu ', 'lo que significa para ti', 'tu natal', 'tu lectura'];
      for (var i = 0; i < forbidden.length; i++) {
        if (text.toLowerCase().indexOf(forbidden[i]) !== -1) return 'Contains reader-possessive phrase: "' + forbidden[i] + '"';
      }
    }

    return null;
  }

  /**
   * Validate a locale catalog against expected placeholders.
   * expectedPlaceholders: key -> [expected placeholder names]
   * Checks: placeholder parity, variant counts, tone (dashes, forbidden words).
   */
  function validateCatalog(catalog, expectedPlaceholders) {
    var result = {
      valid: true,
      placeholderMismatches: [],
      unknownKeys: [],
      variantOverflow: [],
      toneFaults: []
    };

    Object.keys(catalog.strings).forEach(function (key) {
      var entry = catalog.strings[key];

      if (!expectedPlaceholders[key]) {
        result.unknownKeys.push(key);
        result.valid = false;
        return;
      }

      var expectedPlaceholderSet = new Set(expectedPlaceholders[key]);
      var variants = Array.isArray(entry) ? entry : [entry];

      variants.forEach(function (variant, i) {
        var placeholderMatch = variant.match(/\{([^}]+)\}/g) || [];
        var actualPlaceholders = placeholderMatch.map(function (p) { return p.replace(/[{}]/g, ''); });
        var actualSet = new Set(actualPlaceholders);

        if (!setsEqual(expectedPlaceholderSet, actualSet)) {
          result.placeholderMismatches.push({
            key: key, variant: i,
            expected: Array.from(expectedPlaceholderSet),
            actual: actualPlaceholders
          });
          result.valid = false;
        }

        var toneFault = checkTone(variant, catalog.locale);
        if (toneFault) {
          result.toneFaults.push(key + '[' + i + ']: ' + toneFault);
          result.valid = false;
        }
      });
    });

    /* Overflow is capped at a fixed ceiling rather than at
       expectedPlaceholders[key].length: that array names placeholder
       VARIABLES ('planet', 'day', ...), a count with no relationship to
       how many flavor-text variants a key may carry. Tying the two
       together flagged every real three-variant template (a placeholder
       list of one name reads as "at most one variant") as overflowing. */
    Object.keys(catalog.strings).forEach(function (key) {
      var entry = catalog.strings[key];
      if (Array.isArray(entry) && entry.length > MAX_VARIANTS) {
        result.variantOverflow.push(key + ': has ' + entry.length + ', expected <=' + MAX_VARIANTS);
        result.valid = false;
      }
    });

    if (!catalog.metadata.allowPartial) {
      if (result.placeholderMismatches.length > 0 || result.unknownKeys.length > 0 ||
          result.variantOverflow.length > 0 || result.toneFaults.length > 0) {
        result.valid = false;
      }
    } else {
      // Partial locales only fail on critical violations, not missing keys.
      if (result.placeholderMismatches.length > 0 || result.variantOverflow.length > 0 ||
          result.toneFaults.length > 0) {
        result.valid = false;
      }
    }

    return result;
  }

  /**
   * Register a locale catalog at startup. Validates against expected
   * placeholders and returns missing keys as a work queue.
   */
  function registerLocale(catalog, expectedPlaceholders) {
    var validation = validateCatalog(catalog, expectedPlaceholders);

    if (!validation.valid && !catalog.metadata.allowPartial) {
      var errors = [];
      if (validation.placeholderMismatches.length > 0) errors.push('Placeholder mismatches: ' + validation.placeholderMismatches.length);
      if (validation.unknownKeys.length > 0) errors.push('Unknown keys: ' + validation.unknownKeys.join(', '));
      if (validation.variantOverflow.length > 0) errors.push('Variant overflow: ' + validation.variantOverflow.join(', '));
      if (validation.toneFaults.length > 0) errors.push('Tone violations: ' + validation.toneFaults.join(', '));
      throw new Error('Locale registration failed: ' + errors.join('; '));
    }

    catalog.metadata.violations = validation.toneFaults;

    var missingKeys = [];
    Object.keys(expectedPlaceholders).forEach(function (key) {
      if (!catalog.strings[key]) missingKeys.push(key);
    });
    catalog.metadata.missingKeys = missingKeys;

    return missingKeys;
  }

  function availableLocales() {
    return ['en', 'es'];
  }

  return {
    setLocale: setLocale,
    getLocale: getLocale,
    getCatalog: getCatalog,
    t: t,
    pickVariant: pickVariant,
    fillPlaceholders: fillPlaceholders,
    validateCatalog: validateCatalog,
    registerLocale: registerLocale,
    availableLocales: availableLocales
  };
}));
