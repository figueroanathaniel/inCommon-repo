/*! i18n/index.ts
 * Localization runtime: locale switching, catalog loading, placeholder replacement
 * Never concatenates fragments; only fills placeholders in complete sentences
 */

import EN from './en';
import ES from './es';

// ============================================================================
// TYPES
// ============================================================================

export type Locale = 'en' | 'es';

export interface LocaleEntry {
  [key: string]: string | string[];  // string for singular, string[] for variants
}

export interface LocaleCatalog {
  locale: Locale;
  strings: LocaleEntry;
  metadata: {
    allowPartial: boolean;
    missingKeys: string[];
    violations: string[];
  };
}

export interface PlaceholderMap {
  [placeholder: string]: string | number;
}

// ============================================================================
// RUNTIME STATE
// ============================================================================

let activeLocale: Locale = 'en';
let activeCatalog: LocaleCatalog = EN;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Set active locale and load its catalog
 * Throws if locale not available
 */
export function setLocale(locale: Locale): void {
  const catalogs: Record<Locale, LocaleCatalog> = { en: EN, es: ES };

  if (!catalogs[locale]) {
    throw new Error(`Unknown locale: ${locale}`);
  }

  activeLocale = locale;
  activeCatalog = catalogs[locale];
}

/**
 * Get active locale
 */
export function getLocale(): Locale {
  return activeLocale;
}

/**
 * Get active catalog
 */
export function getCatalog(): LocaleCatalog {
  return activeCatalog;
}

/**
 * Translate a key with placeholder substitution
 * Example: t('transit-conjunction', { body1: 'Sun', body2: 'Moon', time: '3pm' })
 */
export function t(key: string, placeholders?: PlaceholderMap): string {
  const entry = activeCatalog.strings[key];

  if (!entry) {
    console.warn(`Missing translation key: ${key}`);
    return key;  // Fallback to key name
  }

  // Handle singular string
  if (typeof entry === 'string') {
    return fillPlaceholders(entry, placeholders);
  }

  // Handle variants (shouldn't happen with key lookup, but handle it)
  if (Array.isArray(entry)) {
    return fillPlaceholders(entry[0], placeholders);
  }

  return key;
}

/**
 * Pick a variant and translate
 * Example: pickVariant('transit-conjunction', 0, { body1: 'Sun', ... })
 * Returns the variant at the given index with placeholders filled
 */
export function pickVariant(
  key: string,
  variantIndex: number,
  placeholders?: PlaceholderMap
): string {
  const entry = activeCatalog.strings[key];

  if (!entry) {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }

  if (typeof entry === 'string') {
    return fillPlaceholders(entry, placeholders);
  }

  if (Array.isArray(entry)) {
    if (variantIndex >= entry.length) {
      console.warn(`Variant index ${variantIndex} out of bounds for ${key}`);
      return fillPlaceholders(entry[0], placeholders);
    }

    return fillPlaceholders(entry[variantIndex], placeholders);
  }

  return key;
}

/**
 * Fill placeholders in a template string
 * Example: "Mercury sextile {body2} at {time}" with { body2: 'Venus', time: '2pm' }
 */
export function fillPlaceholders(template: string, placeholders?: PlaceholderMap): string {
  if (!placeholders || Object.keys(placeholders).length === 0) {
    return template;
  }

  let result = template;

  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }

  return result;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface CatalogValidationResult {
  valid: boolean;
  placeholderMismatches: Array<{ key: string; variant: number; expected: string[]; actual: string[] }>;
  unknownKeys: string[];
  variantOverflow: string[];
  toneFaults: string[];
}

/**
 * Validate a locale catalog against expected placeholders
 * Checks: placeholder parity, variant counts, tone (dashes, forbidden words)
 */
export function validateCatalog(
  catalog: LocaleCatalog,
  expectedPlaceholders: Record<string, string[]>  // key -> [expected placeholders]
): CatalogValidationResult {
  const result: CatalogValidationResult = {
    valid: true,
    placeholderMismatches: [],
    unknownKeys: [],
    variantOverflow: [],
    toneFaults: []
  };

  // Check each key in catalog
  for (const [key, entry] of Object.entries(catalog.strings)) {
    // Check if key is known
    if (!expectedPlaceholders[key]) {
      result.unknownKeys.push(key);
      result.valid = false;
      continue;
    }

    const expectedPlaceholderSet = new Set(expectedPlaceholders[key]);
    const variants = Array.isArray(entry) ? entry : [entry];

    // Check each variant
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      // Extract actual placeholders
      const placeholderMatch = variant.match(/\{([^}]+)\}/g) || [];
      const actualPlaceholders = placeholderMatch.map(p => p.replace(/[{}]/g, ''));
      const actualSet = new Set(actualPlaceholders);

      // Check parity
      if (!setsEqual(expectedPlaceholderSet, actualSet)) {
        result.placeholderMismatches.push({
          key,
          variant: i,
          expected: Array.from(expectedPlaceholderSet),
          actual: actualPlaceholders
        });
        result.valid = false;
      }

      // Check tone (dashes, forbidden words per locale)
      const toneFault = checkTone(variant, catalog.locale);
      if (toneFault) {
        result.toneFaults.push(`${key}[${i}]: ${toneFault}`);
        result.valid = false;
      }
    }
  }

  // Check variant overflow (no variants should exceed expected)
  for (const [key, entry] of Object.entries(catalog.strings)) {
    const expectedVariants = expectedPlaceholders[key]?.length || 1;
    if (Array.isArray(entry) && entry.length > expectedVariants) {
      result.variantOverflow.push(`${key}: has ${entry.length}, expected ≤${expectedVariants}`);
      result.valid = false;
    }
  }

  // Only fail on critical violations if strict registration
  if (!catalog.metadata.allowPartial) {
    if (result.placeholderMismatches.length > 0 ||
        result.unknownKeys.length > 0 ||
        result.variantOverflow.length > 0 ||
        result.toneFaults.length > 0) {
      result.valid = false;
    }
  } else {
    // For partial locales, only fail on critical violations (not missing keys)
    if (result.placeholderMismatches.length > 0 ||
        result.variantOverflow.length > 0 ||
        result.toneFaults.length > 0) {
      result.valid = false;
    }
  }

  return result;
}

/**
 * Check tone violations in a translated string
 * Returns error message or null if clean
 */
function checkTone(text: string, locale: Locale): string | null {
  // Check for dashes (all three encodings)
  const EM_DASH = String.fromCharCode(0x2014);
  const EN_DASH = String.fromCharCode(0x2013);

  if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
    return 'Contains em or en dash';
  }

  if (text.includes('&mdash;') || text.includes('&ndash;') ||
      text.includes('&#8212;') || text.includes('&#8211;') ||
      text.includes('&#x2014;') || text.includes('&#x2013;')) {
    return 'Contains dash entity';
  }

  // Locale-specific tone checks
  if (locale === 'es') {
    // Check for Spanish forbidden phrases (same pattern as English PUBLIC_FORBIDDEN)
    const forbidden = [
      'tu gráfico',
      'tu cielo',
      'en tu ',
      'lo que significa para ti',
      'tu natal',
      'tu lectura'
    ];

    for (const phrase of forbidden) {
      if (text.toLowerCase().includes(phrase)) {
        return `Contains reader-possessive phrase: "${phrase}"`;
      }
    }
  }

  return null;
}

/**
 * Helper: check if two sets are equal
 */
function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register a locale catalog at startup
 * Validates against expected placeholders
 * Returns missing keys (work queue)
 */
export function registerLocale(
  catalog: LocaleCatalog,
  expectedPlaceholders: Record<string, string[]>
): string[] {
  const validation = validateCatalog(catalog, expectedPlaceholders);

  if (!validation.valid && !catalog.metadata.allowPartial) {
    const errors = [];
    if (validation.placeholderMismatches.length > 0) {
      errors.push(`Placeholder mismatches: ${validation.placeholderMismatches.length}`);
    }
    if (validation.unknownKeys.length > 0) {
      errors.push(`Unknown keys: ${validation.unknownKeys.join(', ')}`);
    }
    if (validation.variantOverflow.length > 0) {
      errors.push(`Variant overflow: ${validation.variantOverflow.join(', ')}`);
    }
    if (validation.toneFaults.length > 0) {
      errors.push(`Tone violations: ${validation.toneFaults.join(', ')}`);
    }

    throw new Error(`Locale registration failed: ${errors.join('; ')}`);
  }

  // Store validation results
  catalog.metadata.violations = validation.toneFaults;

  // For partial locales, find missing keys
  const missingKeys: string[] = [];
  for (const key of Object.keys(expectedPlaceholders)) {
    if (!catalog.strings[key]) {
      missingKeys.push(key);
    }
  }

  catalog.metadata.missingKeys = missingKeys;

  return missingKeys;
}

// ============================================================================
// LIST AVAILABLE LOCALES
// ============================================================================

export function availableLocales(): Locale[] {
  return ['en', 'es'];
}
