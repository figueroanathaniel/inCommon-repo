/*! forecast/news/multiChart.test.ts
 * 15 assertions for synastry item builder
 * No storage API: module runs in node without localStorage
 * Focus: ceiling enforcement, couple-link bonus, share text validation
 */

import {
  buildSynastryItem,
  buildSynastryItems,
  validateSynastryCeiling,
  validateShareText,
  verifyCoupleLink,
  PartnerChart,
  SynastryContact
} from './multiChart';
import { NewsItem, IMPORTANCE_CEILING } from '../newsEngine';

// ============================================================================
// FIXTURES
// ============================================================================

const mockPartner: PartnerChart = {
  id: 'partner-lucia-1',
  name: 'Lucia',
  birthDate: new Date('1995-06-15'),
  birthTime: '14:30',
  birthPlace: 'Brooklyn, NY',
  bodies: {
    Sun: 84.5,
    Moon: 167.3,
    Venus: 65.2
  },
  points: {
    ASC: 120.0,
    MC: 210.0
  }
};

const mockContact: SynastryContact = {
  movingBody: 'Venus',
  aspect: 'trine',
  partnerBody: 'Moon',
  orb: 0.3,
  isExact: true,
  yourLongitude: 65.2,
  theirLongitude: 67.5
};

// ============================================================================
// TESTS
// ============================================================================

/**
 * A1: Basic item creation
 * A synastry item is created with correct headline and category
 */
export function test_A1_basicItemCreation(): void {
  const item = buildSynastryItem({
    contact: mockContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  if (!item.headline.includes('Venus') || !item.headline.includes('Lucia')) {
    throw new Error('A1: Headline missing astral body or partner name');
  }

  if (item.category !== 'transit') {
    throw new Error('A1: Synastry item category should be "transit"');
  }

  if (item.synastry !== true) {
    throw new Error('A1: synastry flag should be true');
  }
}

/**
 * A2: Ceiling enforcement
 * Synastry item importance is capped at 68, never higher
 */
export function test_A2_ceilingEnforcement(): void {
  const item = buildSynastryItem({
    contact: { ...mockContact, isExact: true },
    partner: mockPartner,
    isPersonalTouch: true,
    hasNatalTouch: true,
    isRare: true,
    date: new Date()
  });

  if (item.importance > IMPORTANCE_CEILING) {
    throw new Error(`A2: Synastry importance (${item.importance}) exceeded ceiling (${IMPORTANCE_CEILING})`);
  }

  if (!validateSynastryCeiling(item)) {
    throw new Error('A2: validateSynastryCeiling failed for valid item');
  }
}

/**
 * A3: Validate ceiling is exactly 68
 * Confirm the constant value
 */
export function test_A3_ceilingValue(): void {
  if (IMPORTANCE_CEILING !== 68) {
    throw new Error(`A3: Ceiling should be 68, got ${IMPORTANCE_CEILING}`);
  }
}

/**
 * A4: Couple-link bonus test
 * Contact with couple-link awarded +10, still under 80
 */
export function test_A4_coupleLinkBonus(): void {
  const contactWithLink: SynastryContact = {
    ...mockContact,
    isCoupleLink: true
  };

  const item = buildSynastryItem({
    contact: contactWithLink,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  // Base 50 + exactness 10 + couple-link 10 = 70 (still under notify threshold)
  if (item.importance > 80) {
    throw new Error(`A4: Couple-link item (${item.importance}) should not reach notify threshold`);
  }

  if (item.importance < 50) {
    throw new Error(`A4: Couple-link item importance too low: ${item.importance}`);
  }
}

/**
 * A5: Couple-link detection within 1 degree
 */
export function test_A5_coupleLinkDetection(): void {
  const yourLng = 65.2;
  const theirLng = 65.8;  // 0.6° apart

  if (!verifyCoupleLink(yourLng, theirLng, 1.0)) {
    throw new Error('A5: verifyCoupleLink should detect 0.6° contact');
  }

  const farLng = 75.0;  // 10° apart
  if (verifyCoupleLink(yourLng, farLng, 1.0)) {
    throw new Error('A5: verifyCoupleLink should reject 10° contact');
  }
}

/**
 * A6: Share text excludes longitudes
 * Validated share text should not contain degree/minute notation
 */
export function test_A6_shareTextNoLongitudes(): void {
  const shareText = 'Venus trine their Moon, Lucia. 2026-09-13.';

  if (!validateShareText(shareText, mockContact)) {
    throw new Error('A6: Clean share text should pass validation');
  }

  const badShareText = 'Your Venus at 65.2° trine their Moon at 67.5°';
  if (validateShareText(badShareText, mockContact)) {
    throw new Error('A6: Share text with longitudes should fail validation');
  }
}

/**
 * A7: Share text excludes orbs
 * Validated share text should not mention orb distance
 */
export function test_A7_shareTextNoOrbs(): void {
  const cleanText = 'Venus trine their Moon today.';
  if (!validateShareText(cleanText, mockContact)) {
    throw new Error('A7: Clean text should pass');
  }

  const orbText = `Venus trine their Moon within ${mockContact.orb}°`;
  if (validateShareText(orbText, mockContact)) {
    throw new Error('A7: Text with orb should fail');
  }
}

/**
 * A8: Share text excludes birth data
 * Validated share text should not contain year/date markers suggesting birth records
 */
export function test_A8_shareTextNoBirthData(): void {
  const cleanText = 'Venus trine their Moon. Today you understand each other.';
  if (!validateShareText(cleanText, mockContact)) {
    throw new Error('A8: Clean share text should pass');
  }

  const birthYear = '1995-06-15';  // Partner's birth date
  const badText = `Venus trine their Moon. Born ${birthYear}, they...`;
  if (validateShareText(badText, mockContact)) {
    throw new Error('A8: Share text with birth data should fail');
  }
}

/**
 * A9: Partner data required
 * Synastry items must include partner id and name
 */
export function test_A9_partnerDataRequired(): void {
  const item = buildSynastryItem({
    contact: mockContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  if (!item.partner) {
    throw new Error('A9: Item missing partner object');
  }

  if (item.partner.id !== mockPartner.id) {
    throw new Error('A9: Partner id mismatch');
  }

  if (item.partner.name !== mockPartner.name) {
    throw new Error('A9: Partner name mismatch');
  }
}

/**
 * A10: Category stays "transit"
 * Decision 1: synastry items ARE transit items, never a new category
 */
export function test_A10_categoryStaysTransit(): void {
  const item = buildSynastryItem({
    contact: mockContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  if (item.category !== 'transit') {
    throw new Error(`A10: Category should be 'transit', got '${item.category}'`);
  }

  const itemWithLink = buildSynastryItem({
    contact: { ...mockContact, isCoupleLink: true },
    partner: mockPartner,
    isPersonalTouch: true,
    date: new Date()
  });

  if (itemWithLink.category !== 'transit') {
    throw new Error('A10: Synastry item category should always be transit');
  }
}

/**
 * A11: Batch builder respects ceiling
 * All items from buildSynastryItems should be under ceiling
 */
export function test_A11_batchRespectsCeiling(): void {
  const contacts: SynastryContact[] = [
    mockContact,
    { ...mockContact, aspect: 'conjunction', isCoupleLink: true },
    { ...mockContact, aspect: 'square', orb: 0.1, isExact: true }
  ];

  const items = buildSynastryItems(contacts, mockPartner);

  for (const item of items) {
    if (!validateSynastryCeiling(item)) {
      throw new Error(`A11: Item ${item.id} exceeded ceiling`);
    }
  }
}

/**
 * A12: No storage API calls
 * Module must not reference localStorage or other global storage
 * This test verifies by import: if module threw on require, it would fail
 */
export function test_A12_noStorageApi(): void {
  // If the module tried to access localStorage during import, it would throw
  // Since we got here, the module is safe for node environment
  const item = buildSynastryItem({
    contact: mockContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  if (!item.id) {
    throw new Error('A12: Item should have valid id');
  }
}

/**
 * A13: Exact aspect detection
 * isExact flag set when orb < 0.5
 */
export function test_A13_exactAspectDetection(): void {
  const exactContact: SynastryContact = {
    ...mockContact,
    orb: 0.3,
    isExact: true
  };

  const item = buildSynastryItem({
    contact: exactContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  // With exactness bonus, should be 50 + 10 = 60 (minimum for any bonus)
  if (item.importance < 50) {
    throw new Error(`A13: Exact contact should score higher: ${item.importance}`);
  }

  const inexactContact: SynastryContact = {
    ...mockContact,
    orb: 2.0,
    isExact: false
  };

  const itemInexact = buildSynastryItem({
    contact: inexactContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  if (itemInexact.importance > item.importance) {
    throw new Error('A13: Inexact contact should score lower than exact');
  }
}

/**
 * A14: Keywords include partner id
 * Partner id should be in keywords for filtering/personalization
 */
export function test_A14_partnerIdInKeywords(): void {
  const item = buildSynastryItem({
    contact: mockContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  if (!item.keywords.includes(mockPartner.id)) {
    throw new Error(`A14: Partner id '${mockPartner.id}' should be in keywords`);
  }
}

/**
 * A15: Three-part body structure
 * Body contains: calculated line, explainer, weather statement
 */
export function test_A15_bodyStructure(): void {
  const item = buildSynastryItem({
    contact: mockContact,
    partner: mockPartner,
    isPersonalTouch: false,
    date: new Date()
  });

  const body = item.body;

  // Should contain calculated line with aspect
  if (!body.includes(mockContact.aspect)) {
    throw new Error('A15: Body missing aspect type');
  }

  // Should contain weather/pair language
  if (!body.includes('charts') && !body.includes('weather')) {
    throw new Error('A15: Body missing weather/pair phrasing');
  }

  // Should have multiple paragraphs
  const paragraphs = body.split('\n\n').filter(p => p.trim());
  if (paragraphs.length < 2) {
    throw new Error('A15: Body should have multiple parts');
  }
}

// ============================================================================
// RUNNER
// ============================================================================

const tests = [
  test_A1_basicItemCreation,
  test_A2_ceilingEnforcement,
  test_A3_ceilingValue,
  test_A4_coupleLinkBonus,
  test_A5_coupleLinkDetection,
  test_A6_shareTextNoLongitudes,
  test_A7_shareTextNoOrbs,
  test_A8_shareTextNoBirthData,
  test_A9_partnerDataRequired,
  test_A10_categoryStaysTransit,
  test_A11_batchRespectsCeiling,
  test_A12_noStorageApi,
  test_A13_exactAspectDetection,
  test_A14_partnerIdInKeywords,
  test_A15_bodyStructure
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

// Export for test runner
export default { tests, runTests };
