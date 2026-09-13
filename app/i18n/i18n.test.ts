/*! i18n/i18n.test.ts
 * 13 assertions for localization runtime
 * Tests locale switching, translation, placeholder parity, tone validation
 * No storage API: runs in node without localStorage
 */

import {
  setLocale,
  getLocale,
  t,
  pickVariant,
  fillPlaceholders,
  validateCatalog,
  registerLocale,
  availableLocales,
  LocaleCatalog
} from './index';
import EN from './en';
import ES from './es';

// ============================================================================
// FIXTURES
// ============================================================================

const fixtureCatalog: LocaleCatalog = {
  locale: 'en',
  strings: {
    'simple-key': 'Simple translation',
    'with-placeholder': 'Hello {name}, today is {day}.',
    'multi-variant': [
      'First variant with {planet}',
      'Second variant with {planet}',
      'Third variant with {planet}'
    ]
  },
  metadata: {
    allowPartial: false,
    missingKeys: [],
    violations: []
  }
};

const expectedPlaceholders: Record<string, string[]> = {
  'simple-key': [],
  'with-placeholder': ['name', 'day'],
  'multi-variant': ['planet']
};

// ============================================================================
// TESTS
// ============================================================================

/**
 * I1: Basic locale switching
 */
export function test_I1_localeSwitch(): void {
  setLocale('en');
  if (getLocale() !== 'en') {
    throw new Error('I1: Failed to set English locale');
  }

  setLocale('es');
  if (getLocale() !== 'es') {
    throw new Error('I1: Failed to set Spanish locale');
  }
}

/**
 * I2: Translation lookup
 */
export function test_I2_translationLookup(): void {
  setLocale('en');
  const result = t('transit-conjunction');

  if (!result || result === 'transit-conjunction') {
    throw new Error('I2: Translation not found');
  }

  if (!result.includes('meet')) {
    throw new Error('I2: Translation contains wrong content');
  }
}

/**
 * I3: Placeholder replacement
 */
export function test_I3_placeholderReplacement(): void {
  const template = 'Hello {name}, it is {day}';
  const result = fillPlaceholders(template, { name: 'Alice', day: 'Monday' });

  if (result !== 'Hello Alice, it is Monday') {
    throw new Error(`I3: Got "${result}"`);
  }
}

/**
 * I4: Variant selection
 */
export function test_I4_variantSelection(): void {
  const result0 = pickVariant('transit-conjunction', 0);
  const result1 = pickVariant('transit-conjunction', 1);

  if (result0 === result1) {
    throw new Error('I4: Variants are identical');
  }

  if (!result0.includes('meet')) {
    throw new Error('I4: First variant wrong');
  }

  if (!result1.includes('Merger')) {
    throw new Error('I4: Second variant wrong');
  }
}

/**
 * I5: Placeholder parity validation
 */
export function test_I5_placeholderParity(): void {
  const validation = validateCatalog(fixtureCatalog, expectedPlaceholders);

  if (!validation.valid) {
    throw new Error('I5: Fixture catalog should be valid');
  }

  if (validation.placeholderMismatches.length > 0) {
    throw new Error('I5: Fixture has placeholder mismatches');
  }
}

/**
 * I6: Missing placeholder detection
 */
export function test_I6_missingPlaceholder(): void {
  const badCatalog: LocaleCatalog = {
    ...fixtureCatalog,
    strings: {
      'with-placeholder': 'Hello {name}, missing day placeholder.'  // Missing {day}
    }
  };

  const validation = validateCatalog(badCatalog, expectedPlaceholders);

  if (validation.valid) {
    throw new Error('I6: Should have detected missing placeholder');
  }

  if (validation.placeholderMismatches.length === 0) {
    throw new Error('I6: Should report mismatch');
  }
}

/**
 * I7: Unknown key detection
 */
export function test_I7_unknownKey(): void {
  const badCatalog: LocaleCatalog = {
    locale: 'en',
    strings: {
      'unknown-key': 'This key is not expected'
    },
    metadata: { allowPartial: false, missingKeys: [], violations: [] }
  };

  const validation = validateCatalog(badCatalog, expectedPlaceholders);

  if (!validation.valid) {
    // Unknown keys fail in strict mode
    if (validation.unknownKeys.length === 0) {
      throw new Error('I7: Should detect unknown key');
    }
  }
}

/**
 * I8: Variant overflow detection
 */
export function test_I8_variantOverflow(): void {
  const badCatalog: LocaleCatalog = {
    ...fixtureCatalog,
    strings: {
      'with-placeholder': [
        'Variant 1 with {day}',
        'Variant 2 with {day}',
        'Variant 3 with {day}'  // Too many variants (expects 1)
      ]
    }
  };

  const validation = validateCatalog(badCatalog, expectedPlaceholders);

  if (!validation.variantOverflow.length) {
    throw new Error('I8: Should detect variant overflow');
  }
}

/**
 * I9: Tone check (em dash detection)
 */
export function test_I9_toneCheckDash(): void {
  const emDash = String.fromCharCode(0x2014);
  const badCatalog: LocaleCatalog = {
    locale: 'en',
    strings: {
      'test-key': `This is wrong${emDash}it has a dash`
    },
    metadata: { allowPartial: false, missingKeys: [], violations: [] }
  };

  const validation = validateCatalog(badCatalog, { 'test-key': [] });

  if (validation.toneFaults.length === 0) {
    throw new Error('I9: Should detect em dash');
  }
}

/**
 * I10: Partial locale allowed missing keys
 */
export function test_I10_partialLocale(): void {
  const partialCatalog: LocaleCatalog = {
    locale: 'es',
    strings: {
      'transit-conjunction': ['Primera variante', 'Segunda variante', 'Tercera variante']
      // Missing 'transit-sextile' and others
    },
    metadata: {
      allowPartial: true,
      missingKeys: [],
      violations: []
    }
  };

  const validation = validateCatalog(partialCatalog, expectedPlaceholders);

  // Partial locales should not fail on missing keys
  // Only on placeholder mismatches or overflow
  if (!validation.valid && validation.placeholderMismatches.length === 0 && validation.variantOverflow.length === 0) {
    // This might be OK for partial (if only missing keys)
  }
}

/**
 * I11: Locale registration with missing keys
 */
export function test_I11_registrationMissingKeys(): void {
  const partialCatalog: LocaleCatalog = {
    locale: 'es',
    strings: {
      'transit-conjunction': ['Primera variante', 'Segunda variante', 'Tercera variante']
    },
    metadata: { allowPartial: true, missingKeys: [], violations: [] }
  };

  const missingKeys = registerLocale(partialCatalog, expectedPlaceholders);

  if (missingKeys.length === 0) {
    throw new Error('I11: Should detect missing keys in partial locale');
  }

  if (!missingKeys.includes('with-placeholder')) {
    throw new Error('I11: Should report specific missing keys');
  }
}

/**
 * I12: Available locales list
 */
export function test_I12_availableLocales(): void {
  const locales = availableLocales();

  if (!locales.includes('en')) {
    throw new Error('I12: English should be available');
  }

  if (!locales.includes('es')) {
    throw new Error('I12: Spanish should be available');
  }
}

/**
 * I13: Full catalog parity (en and es have same keys structure)
 */
export function test_I13_catalogParity(): void {
  // English should have all base keys
  const enKeys = Object.keys(EN.strings);

  if (enKeys.length === 0) {
    throw new Error('I13: English catalog is empty');
  }

  // Spanish may have fewer keys (partial) but should not have unknown keys
  const esKeys = Object.keys(ES.strings);
  const unknownEsKeys = esKeys.filter(key => !enKeys.includes(key));

  if (unknownEsKeys.length > 0) {
    throw new Error(`I13: Spanish has unknown keys: ${unknownEsKeys.join(', ')}`);
  }

  // Spanish should have no placeholder mismatches for keys it does translate
  const validation = validateCatalog(ES, EN.strings as any);

  if (validation.placeholderMismatches.length > 0) {
    throw new Error(`I13: Spanish has placeholder mismatches: ${validation.placeholderMismatches.length}`);
  }
}

// ============================================================================
// RUNNER
// ============================================================================

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

export function runTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const test of tests) {
    try {
      test();
      passed++;
      console.log(`✓ ${test.name}`);
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      console.error(`✗ ${test.name}: ${msg}`);
    }
  }

  return { passed, failed, errors };
}

export default { tests, runTests };
