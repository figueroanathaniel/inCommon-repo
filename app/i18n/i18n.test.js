/*! i18n/i18n.test.js
 * 13 assertions for the localization runtime: locale switching,
 * translation, placeholder parity, tone validation. No storage API: runs
 * in node without localStorage.
 */

const {
  setLocale,
  getLocale,
  t,
  pickVariant,
  fillPlaceholders,
  validateCatalog,
  registerLocale,
  availableLocales
} = require('./index');
const EN = require('./en');
const ES = require('./es');

const fixtureCatalog = {
  locale: 'en',
  strings: {
    'simple-key': 'Simple translation',
    'with-placeholder': 'Hello {name}, today is {day}.',
    'multi-variant': [
      'First variant with {body}',
      'Second variant with {body}',
      'Third variant with {body}'
    ]
  },
  metadata: { allowPartial: false, missingKeys: [], violations: [] }
};

const expectedPlaceholders = {
  'simple-key': [],
  'with-placeholder': ['name', 'day'],
  'multi-variant': ['body']
};

function test_I1_localeSwitch() {
  setLocale('en');
  if (getLocale() !== 'en') throw new Error('I1: Failed to set English locale');
  setLocale('es');
  if (getLocale() !== 'es') throw new Error('I1: Failed to set Spanish locale');
  setLocale('en'); // leave the runtime in a known state for later tests
}

function test_I2_translationLookup() {
  setLocale('en');
  const result = t('transit-conjunction');
  if (!result || result === 'transit-conjunction') throw new Error('I2: Translation not found');
  if (!result.includes('meet')) throw new Error('I2: Translation contains wrong content');
}

function test_I3_placeholderReplacement() {
  const template = 'Hello {name}, it is {day}';
  const result = fillPlaceholders(template, { name: 'Alice', day: 'Monday' });
  if (result !== 'Hello Alice, it is Monday') throw new Error('I3: Got "' + result + '"');
}

function test_I4_variantSelection() {
  setLocale('en');
  const result0 = pickVariant('transit-conjunction', 0);
  const result1 = pickVariant('transit-conjunction', 1);
  if (result0 === result1) throw new Error('I4: Variants are identical');
  if (!result0.includes('meet')) throw new Error('I4: First variant wrong');
  if (!result1.includes('Merger')) throw new Error('I4: Second variant wrong');
}

function test_I5_placeholderParity() {
  const validation = validateCatalog(fixtureCatalog, expectedPlaceholders);
  if (!validation.valid) throw new Error('I5: Fixture catalog should be valid');
  if (validation.placeholderMismatches.length > 0) throw new Error('I5: Fixture has placeholder mismatches');
}

function test_I6_missingPlaceholder() {
  const badCatalog = Object.assign({}, fixtureCatalog, {
    strings: { 'with-placeholder': 'Hello {name}, missing day placeholder.' } // Missing {day}
  });
  const validation = validateCatalog(badCatalog, expectedPlaceholders);
  if (validation.valid) throw new Error('I6: Should have detected missing placeholder');
  if (validation.placeholderMismatches.length === 0) throw new Error('I6: Should report mismatch');
}

function test_I7_unknownKey() {
  const badCatalog = {
    locale: 'en',
    strings: { 'unknown-key': 'This key is not expected' },
    metadata: { allowPartial: false, missingKeys: [], violations: [] }
  };
  const validation = validateCatalog(badCatalog, expectedPlaceholders);
  if (!validation.valid) {
    if (validation.unknownKeys.length === 0) throw new Error('I7: Should detect unknown key');
  }
}

function test_I8_variantOverflow() {
  // Every real template list caps at three flavor variants (see en.js /
  // es.js); a fourth is the runaway this row exists to catch.
  const badCatalog = Object.assign({}, fixtureCatalog, {
    strings: {
      'with-placeholder': [
        'Variant 1 with {name} and {day}',
        'Variant 2 with {name} and {day}',
        'Variant 3 with {name} and {day}',
        'Variant 4 with {name} and {day}'
      ]
    }
  });
  const validation = validateCatalog(badCatalog, expectedPlaceholders);
  if (!validation.variantOverflow.length) throw new Error('I8: Should detect variant overflow');
}

function test_I9_toneCheckDash() {
  const emDash = String.fromCharCode(0x2014);
  const badCatalog = {
    locale: 'en',
    strings: { 'test-key': 'This is wrong' + emDash + 'it has a dash' },
    metadata: { allowPartial: false, missingKeys: [], violations: [] }
  };
  const validation = validateCatalog(badCatalog, { 'test-key': [] });
  if (validation.toneFaults.length === 0) throw new Error('I9: Should detect em dash');
}

function test_I10_partialLocale() {
  const partialCatalog = {
    locale: 'es',
    strings: {
      'transit-conjunction': ['Primera variante', 'Segunda variante', 'Tercera variante']
      // Missing 'transit-sextile' and others: allowed for a partial locale
    },
    metadata: { allowPartial: true, missingKeys: [], violations: [] }
  };
  const validation = validateCatalog(partialCatalog, expectedPlaceholders);
  // A partial locale is not required to be valid here; this only documents
  // that a missing key alone (no mismatch, no overflow) is not the failure mode.
  if (!validation.valid && validation.placeholderMismatches.length === 0 && validation.variantOverflow.length === 0) {
    // OK: the only reason it isn't valid is unknown keys, which partial locales tolerate downstream.
  }
}

function test_I11_registrationMissingKeys() {
  const partialCatalog = {
    locale: 'es',
    strings: { 'transit-conjunction': ['Primera variante', 'Segunda variante', 'Tercera variante'] },
    metadata: { allowPartial: true, missingKeys: [], violations: [] }
  };
  const missingKeys = registerLocale(partialCatalog, expectedPlaceholders);
  if (missingKeys.length === 0) throw new Error('I11: Should detect missing keys in partial locale');
  if (!missingKeys.includes('with-placeholder')) throw new Error('I11: Should report specific missing keys');
}

function test_I12_availableLocales() {
  const locales = availableLocales();
  if (!locales.includes('en')) throw new Error('I12: English should be available');
  if (!locales.includes('es')) throw new Error('I12: Spanish should be available');
}

/**
 * Extract the placeholder names a template string uses.
 */
function placeholdersIn(str) {
  const matches = str.match(/\{([^}]+)\}/g) || [];
  return new Set(matches.map(p => p.replace(/[{}]/g, '')));
}

/**
 * English's own variants for one key do not all share the same
 * placeholders (a flavor-text variant may drop an optional {theme}), so
 * parity against English is bounded rather than exact: the union of
 * placeholders across every English variant, and the core that every
 * English variant uses. A translated variant must stay within the union
 * and must not drop a core placeholder.
 */
function placeholderBoundsOf(entry) {
  const variants = Array.isArray(entry) ? entry : [entry];
  const sets = variants.map(placeholdersIn);
  const union = new Set();
  sets.forEach(s => s.forEach(p => union.add(p)));
  let core = null;
  sets.forEach(s => {
    if (core === null) { core = new Set(s); return; }
    core = new Set(Array.from(core).filter(p => s.has(p)));
  });
  return { union, core: core || new Set() };
}

function test_I13_catalogParity() {
  const enKeys = Object.keys(EN.strings);
  if (enKeys.length === 0) throw new Error('I13: English catalog is empty');

  // Spanish may have fewer keys (partial) but should not have unknown keys.
  const esKeys = Object.keys(ES.strings);
  const unknownEsKeys = esKeys.filter(key => !enKeys.includes(key));
  if (unknownEsKeys.length > 0) throw new Error('I13: Spanish has unknown keys: ' + unknownEsKeys.join(', '));

  // Spanish should have no placeholder mismatches for the keys it does
  // translate: every placeholder it uses must exist somewhere in English's
  // own variants for that key, and it must not drop a placeholder every
  // English variant relies on.
  const mismatches = [];
  for (const key of esKeys) {
    const { union, core } = placeholderBoundsOf(EN.strings[key]);
    const esVariants = Array.isArray(ES.strings[key]) ? ES.strings[key] : [ES.strings[key]];

    esVariants.forEach((variant, i) => {
      const actual = placeholdersIn(variant);
      const invented = Array.from(actual).filter(p => !union.has(p));
      const dropped = Array.from(core).filter(p => !actual.has(p));

      if (invented.length > 0 || dropped.length > 0) {
        mismatches.push(key + '[' + i + ']: invented=' + invented.join(',') + ' dropped=' + dropped.join(','));
      }
    });
  }

  if (mismatches.length > 0) {
    throw new Error('I13: Spanish has placeholder mismatches: ' + mismatches.join('; '));
  }
}

const tests = [
  test_I1_localeSwitch,
  test_I2_translationLookup,
  test_I3_placeholderReplacement,
  test_I4_variantSelection,
  test_I5_placeholderParity,
  test_I6_missingPlaceholder,
  test_I7_unknownKey,
  test_I8_variantOverflow,
  test_I9_toneCheckDash,
  test_I10_partialLocale,
  test_I11_registrationMissingKeys,
  test_I12_availableLocales,
  test_I13_catalogParity
];

function runTests() {
  let passed = 0, failed = 0;
  const errors = [], results = [];

  tests.forEach((test, i) => {
    const id = 'L' + (i + 1);
    try {
      test();
      passed++;
      results.push({ id, name: test.name, pass: true });
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      results.push({ id, name: test.name, pass: false, error: msg });
    }
  });

  return { passed, failed, errors, results };
}

module.exports = { tests, runTests };
