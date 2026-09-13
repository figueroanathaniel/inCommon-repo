/*! forecast/news/skyWire.test.ts
 * 13 assertions for public Sky Wire feed
 * No storage API: module runs in node without localStorage
 * Focus: ceiling enforcement, determinism, no reader possessives
 */

import {
  buildSkyWireItem,
  buildSkyWireFeed,
  validateSkyWireItem,
  verifySkyWireCeiling,
  verifyDeterminism,
  PUBLIC_CEILING,
  SkyWireItem,
  SkyWireInput
} from './skyWire';
import { NewsItem } from '../newsEngine';

// ============================================================================
// FIXTURES
// ============================================================================

function mockNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: 'test-item-' + Date.now(),
    headline: 'Test headline',
    body: 'Test body.',
    category: 'transit',
    tier: 1,
    type: 'conjunction',
    importance: 85,
    isNew: true,
    keywords: ['Sun', 'Venus'],
    synastry: false,
    ...overrides
  };
}

const mockInput: SkyWireInput = {
  transits: [
    mockNewsItem({ headline: 'Mercury sextile Venus', importance: 75 }),
    mockNewsItem({ headline: 'Mars square Saturn', importance: 70 })
  ],
  patterns: [
    mockNewsItem({ headline: 'Grand Trine', category: 'pattern', importance: 90 })
  ],
  harmonics: [
    mockNewsItem({ headline: 'Harmonic alignment', category: 'harmonic', importance: 55 })
  ],
  date: '2026-09-14'
};

// ============================================================================
// TESTS
// ============================================================================

/**
 * S1: Basic Sky Wire item creation
 * Strips synastry/partner/isNew fields
 */
export function test_S1_basicItemCreation(): void {
  const newsItem = mockNewsItem({ synastry: false });
  const skyWireItem = buildSkyWireItem(newsItem);

  if (!skyWireItem.headline) {
    throw new Error('S1: Item missing headline');
  }

  if (skyWireItem.id !== newsItem.id) {
    throw new Error('S1: ID mismatch');
  }

  // These fields should NOT exist in Sky Wire item
  const asAny = skyWireItem as any;
  if (asAny.synastry !== undefined) {
    throw new Error('S1: Sky Wire item should not have synastry field');
  }

  if (asAny.isNew !== undefined) {
    throw new Error('S1: Sky Wire item should not have isNew field');
  }
}

/**
 * S2: Ceiling enforcement (93, not personal 98)
 */
export function test_S2_ceilingEnforcement(): void {
  const highImportance = mockNewsItem({ importance: 98 });
  const item = buildSkyWireItem(highImportance);

  if (item.importance > PUBLIC_CEILING) {
    throw new Error(`S2: Item importance (${item.importance}) exceeded ceiling (${PUBLIC_CEILING})`);
  }

  if (!verifySkyWireCeiling(item)) {
    throw new Error('S2: verifySkyWireCeiling failed for valid item');
  }
}

/**
 * S3: Ceiling value is exactly 93
 */
export function test_S3_ceilingValue(): void {
  if (PUBLIC_CEILING !== 93) {
    throw new Error(`S3: Ceiling should be 93, got ${PUBLIC_CEILING}`);
  }
}

/**
 * S4: No synastry flag in public shape
 */
export function test_S4_noSynastry(): void {
  const newsItem = mockNewsItem({ synastry: true, partner: { id: 'p1', name: 'Test' } });
  const item = buildSkyWireItem(newsItem);

  const asAny = item as any;
  if (asAny.synastry !== undefined) {
    throw new Error('S4: synastry field should not exist in Sky Wire item');
  }

  if (asAny.partner !== undefined) {
    throw new Error('S4: partner field should not exist in Sky Wire item');
  }
}

/**
 * S5: No isNew field in public shape
 */
export function test_S5_noIsNewField(): void {
  const newsItem = mockNewsItem({ isNew: true });
  const item = buildSkyWireItem(newsItem);

  const asAny = item as any;
  if (asAny.isNew !== undefined) {
    throw new Error('S5: isNew field should not exist in Sky Wire item');
  }
}

/**
 * S6: Feed has date and generatedAt stamps
 */
export function test_S6_feedMetadata(): void {
  const feed = buildSkyWireFeed(mockInput);

  if (feed.version !== '1.0.0') {
    throw new Error('S6: Version mismatch');
  }

  if (feed.date !== mockInput.date) {
    throw new Error('S6: Date not preserved');
  }

  if (!feed.generatedAt) {
    throw new Error('S6: Missing generatedAt timestamp');
  }
}

/**
 * S7: Determinism: same input produces same output
 */
export function test_S7_determinism(): void {
  const feed1 = buildSkyWireFeed(mockInput);
  const feed2 = buildSkyWireFeed(mockInput);

  if (!verifyDeterminism(feed1, feed2)) {
    throw new Error('S7: Feeds are not deterministic (byte-identical)');
  }
}

/**
 * S8: Items sorted by importance, ties broken by ID
 */
export function test_S8_sortingDeterminism(): void {
  const input: SkyWireInput = {
    transits: [
      mockNewsItem({ id: 'item-z', importance: 80 }),
      mockNewsItem({ id: 'item-a', importance: 80 }),
      mockNewsItem({ id: 'item-m', importance: 85 })
    ],
    patterns: [],
    harmonics: [],
    date: '2026-09-14'
  };

  const feed = buildSkyWireFeed(input);

  if (feed.items[0].id !== 'item-m') {
    throw new Error('S8: Highest importance item should be first');
  }

  if (feed.items[1].id !== 'item-a') {
    throw new Error('S8: Tied items should be sorted by ID (a before z)');
  }

  if (feed.items[2].id !== 'item-z') {
    throw new Error('S8: Second tied item should follow sorted order');
  }
}

/**
 * S9: All items validated (no reader-state fields)
 */
export function test_S9_itemsValidation(): void {
  const feed = buildSkyWireFeed(mockInput);

  for (const item of feed.items) {
    if (!validateSkyWireItem(item)) {
      throw new Error(`S9: Item ${item.id} failed validation`);
    }
  }
}

/**
 * S10: Statistics calculated correctly
 */
export function test_S10_statistics(): void {
  const feed = buildSkyWireFeed(mockInput);
  const stats = feed.stats;

  if (stats.totalItems !== 4) {
    throw new Error(`S10: Expected 4 items, got ${stats.totalItems}`);
  }

  if (!stats.byCategory['transit']) {
    throw new Error('S10: Missing transit count');
  }

  if (stats.topImportance !== 90) {
    throw new Error(`S10: Top importance should be 90, got ${stats.topImportance}`);
  }
}

/**
 * S11: No storage API (safe for node testing)
 */
export function test_S11_noStorageApi(): void {
  const feed = buildSkyWireFeed(mockInput);

  if (!feed.date) {
    throw new Error('S11: Feed must be buildable without storage');
  }

  if (feed.items.length === 0) {
    throw new Error('S11: Feed should have items');
  }
}

/**
 * S12: Public ceiling is 5 points below personal (no natal bonus)
 */
export function test_S12_ceilingDifference(): void {
  // Personal ceiling from newsEngine is 100 (theoretically)
  // But Tier 1 max is 50 + bonuses
  // Public ceiling: 93
  // Personal ceiling would be: 98 (5 points higher = natal touch bonus difference)
  const personalMax = 98;  // 50 + 10 + 8 + 10 (natal) + 15 + 5 (rare)
  const difference = personalMax - PUBLIC_CEILING;

  if (difference !== 5) {
    throw new Error(`S12: Ceiling difference should be 5, got ${difference}`);
  }
}

/**
 * S13: Keywords preserved for search/indexing
 */
export function test_S13_keywordsPreserved(): void {
  const keywords = ['Sun', 'Venus', 'conjunction'];
  const newsItem = mockNewsItem({ keywords });
  const item = buildSkyWireItem(newsItem);

  if (item.keywords.length !== keywords.length) {
    throw new Error('S13: Keywords not preserved');
  }

  if (!item.keywords.includes('Sun')) {
    throw new Error('S13: Keywords should include original content');
  }
}

// ============================================================================
// RUNNER
// ============================================================================

const tests = [
  test_S1_basicItemCreation,
  test_S2_ceilingEnforcement,
  test_S3_ceilingValue,
  test_S4_noSynastry,
  test_S5_noIsNewField,
  test_S6_feedMetadata,
  test_S7_determinism,
  test_S8_sortingDeterminism,
  test_S9_itemsValidation,
  test_S10_statistics,
  test_S11_noStorageApi,
  test_S12_ceilingDifference,
  test_S13_keywordsPreserved
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
