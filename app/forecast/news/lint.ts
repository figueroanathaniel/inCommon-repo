/*! forecast/news/lint.ts
 * Validation for news items: no em dashes, no sensitive data in share text
 * Three encodings checked: literal, escape, entity forms
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// Reader-possessive phrases forbidden in public Sky Wire
export const PUBLIC_FORBIDDEN = [
  'your chart',
  'your sky',
  'your birth',
  'your natal',
  'in your ',
  'what it means for you',
  'how this affects you',
  'your personal',
  'for you today',
  'your reading',
  'your journey',
  'your destiny'
];

// Em dash (U+2014) and en dash (U+2013) in three forms
const EM_DASH_LITERAL = '—';
const EN_DASH_LITERAL = '–';

// Escape sequence forms (as they appear in source code)
const EM_DASH_ESCAPE = '\\u2014';
const EN_DASH_ESCAPE = '\\u2013';

// HTML entity forms
const EM_DASH_ENTITY = '&mdash;';
const EN_DASH_ENTITY = '&ndash;';
const EM_DASH_NUMERIC = '&#8212;';
const EN_DASH_NUMERIC = '&#8211;';
const EM_DASH_HEX = '&#x2014;';
const EN_DASH_HEX = '&#x2013;';

// ============================================================================
// DASH DETECTION
// ============================================================================

/**
 * Detect em or en dashes in text (all three encoding forms)
 */
export function hasDash(text: string): boolean {
  // Literal forms
  if (text.includes(EM_DASH_LITERAL) || text.includes(EN_DASH_LITERAL)) {
    return true;
  }

  // Entity forms
  if (
    text.includes(EM_DASH_ENTITY) ||
    text.includes(EN_DASH_ENTITY) ||
    text.includes(EM_DASH_NUMERIC) ||
    text.includes(EN_DASH_NUMERIC) ||
    text.includes(EM_DASH_HEX) ||
    text.includes(EN_DASH_HEX)
  ) {
    return true;
  }

  return false;
}

/**
 * Detect escape sequence forms in raw source
 * Used in build process to catch these in string literals
 */
export function hasEscapedDash(source: string): boolean {
  return source.includes(EM_DASH_ESCAPE) || source.includes(EN_DASH_ESCAPE);
}

// ============================================================================
// NEWS ITEM VALIDATION
// ============================================================================

export interface LintResult {
  valid: boolean;
  errors: string[];
}

/**
 * Lint a headline for dashes and other violations
 */
export function lintHeadline(headline: string): LintResult {
  const errors: string[] = [];

  if (hasDash(headline)) {
    errors.push('Headline contains em or en dash');
  }

  if (headline.length > 90) {
    errors.push(`Headline exceeds 90 chars (${headline.length})`);
  }

  if (headline.trim() !== headline) {
    errors.push('Headline has leading/trailing whitespace');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Lint a body text for dashes
 */
export function lintBody(body: string): LintResult {
  const errors: string[] = [];

  if (hasDash(body)) {
    errors.push('Body contains em or en dash');
  }

  if (body.trim() !== body) {
    errors.push('Body has leading/trailing whitespace');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Lint share text for sensitive data leakage
 * Should contain only: first names, headline, date
 */
export function lintShareText(shareText: string, confidentialData?: { longitude?: number; orb?: number; birthDate?: string }): LintResult {
  const errors: string[] = [];

  if (hasDash(shareText)) {
    errors.push('Share text contains em or en dash');
  }

  // Check for degree notation (longitude)
  if (/\d+\.\d+[°´]?/.test(shareText)) {
    errors.push('Share text contains degree notation (likely longitude)');
  }

  // Check for orb if provided
  if (confidentialData?.orb !== undefined) {
    const orbStr = confidentialData.orb.toFixed(2);
    if (shareText.includes(orbStr)) {
      errors.push(`Share text contains orb value (${orbStr})`);
    }
  }

  // Check for birth date if provided
  if (confidentialData?.birthDate) {
    if (shareText.includes(confidentialData.birthDate)) {
      errors.push('Share text contains birth date');
    }

    // Also check for year alone
    const year = confidentialData.birthDate.split('-')[0];
    if (shareText.includes(year) && year !== new Date().getFullYear().toString()) {
      errors.push(`Share text contains potential birth year (${year})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

export interface NewsItemForLint {
  headline: string;
  body: string;
  shareText?: string;
}

export interface BatchLintResult {
  itemsChecked: number;
  itemsValid: number;
  itemsInvalid: number;
  issues: Map<string, string[]>;
}

/**
 * Lint multiple news items
 */
export function lintBatch(items: NewsItemForLint[]): BatchLintResult {
  const issues = new Map<string, string[]>();
  let itemsValid = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemErrors: string[] = [];

    // Check headline
    const headlineResult = lintHeadline(item.headline);
    if (!headlineResult.valid) {
      itemErrors.push(`Headline: ${headlineResult.errors.join('; ')}`);
    }

    // Check body
    const bodyResult = lintBody(item.body);
    if (!bodyResult.valid) {
      itemErrors.push(`Body: ${bodyResult.errors.join('; ')}`);
    }

    // Check share text if present
    if (item.shareText) {
      const shareResult = lintShareText(item.shareText);
      if (!shareResult.valid) {
        itemErrors.push(`ShareText: ${shareResult.errors.join('; ')}`);
      }
    }

    if (itemErrors.length > 0) {
      issues.set(`item_${i}`, itemErrors);
    } else {
      itemsValid++;
    }
  }

  return {
    itemsChecked: items.length,
    itemsValid,
    itemsInvalid: items.length - itemsValid,
    issues
  };
}

// ============================================================================
// SOURCE CODE VALIDATION
// ============================================================================

/**
 * Scan source file for dashes (both literal and escaped forms)
 * Used in build process to catch dashes that sneak into templates
 */
export function scanSourceForDashes(source: string): { hasDashes: boolean; count: number; locations: number[] } {
  let count = 0;
  const locations: number[] = [];

  // Scan for literal forms
  const dash1 = EM_DASH_LITERAL;
  const dash2 = EN_DASH_LITERAL;

  for (let i = 0; i < source.length; i++) {
    if (source[i] === dash1 || source[i] === dash2) {
      count++;
      locations.push(i);
    }
  }

  // Also count entity forms
  const entityCount = (source.match(/&mdash;|&ndash;|&#8212;|&#8211;|&#x2014;|&#x2013;/g) || []).length;
  count += entityCount;

  return {
    hasDashes: count > 0,
    count,
    locations
  };
}

/**
 * Validate a string literal doesn't contain escaped dashes
 * Call this on template strings in source
 */
export function validateTemplateLiteral(literal: string): { valid: boolean; message: string } {
  if (hasEscapedDash(literal)) {
    return {
      valid: false,
      message: 'Template contains escaped em or en dash (\\u2014 or \\u2013)'
    };
  }

  if (hasDash(literal)) {
    return {
      valid: false,
      message: 'Template contains literal em or en dash character'
    };
  }

  return {
    valid: true,
    message: 'Template is clean'
  };
}

// ============================================================================
// PUBLIC SKY WIRE VALIDATION
// ============================================================================

export interface PublicLintResult {
  valid: boolean;
  violations: Array<{
    item: string;
    field: string;
    violatingPhrase: string;
    context: string;
  }>;
}

/**
 * Lint Sky Wire feed for reader-possessive language
 * Fails the build if any PUBLIC_FORBIDDEN phrase appears in rendered strings
 */
export function publicLintFeed(items: Array<{ headline: string; body: string }>): PublicLintResult {
  const violations: PublicLintResult['violations'] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Check headline
    for (const forbidden of PUBLIC_FORBIDDEN) {
      const lowerHeadline = item.headline.toLowerCase();
      if (lowerHeadline.includes(forbidden.toLowerCase())) {
        violations.push({
          item: `item[${i}]`,
          field: 'headline',
          violatingPhrase: forbidden,
          context: item.headline.substring(0, 100)
        });
      }
    }

    // Check body
    for (const forbidden of PUBLIC_FORBIDDEN) {
      const lowerBody = item.body.toLowerCase();
      if (lowerBody.includes(forbidden.toLowerCase())) {
        violations.push({
          item: `item[${i}]`,
          field: 'body',
          violatingPhrase: forbidden,
          context: item.body.substring(0, 100)
        });
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Sanitize a string by removing reader-possessives if found
 * Returns the safe line if violation detected
 */
export function sanitizeForPublic(text: string, safeFallback: string): string {
  const lowerText = text.toLowerCase();

  for (const forbidden of PUBLIC_FORBIDDEN) {
    if (lowerText.includes(forbidden.toLowerCase())) {
      return safeFallback;
    }
  }

  return text;
}
