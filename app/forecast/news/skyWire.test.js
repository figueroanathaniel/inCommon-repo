/*! forecast/news/skyWire.test.js
 * 13 assertions for the public Sky Wire feed. No storage API: this module
 * runs in node without localStorage. Focus: ceiling enforcement,
 * determinism, no reader possessives.
 */

const {
  buildSkyWireItem,
  buildSkyWireFeed,
  validateSkyWireItem,
  verifySkyWireCeiling,
  verifyDeterminism,
  PUBLIC_CEILING
} = require('./skyWire');

function mockNewsItem(overrides) {
  return Object.assign({
    id: 'test-item-fixed-id',
    headline: 'Test headline',
    body: 'Test body.',
    category: 'transit',
    tier: 1,
    type: 'conjunction',
    importance: 85,
    isNew: true,
    keywords: ['Sun', 'Venus'],
    synastry: false
  }, overrides || {});
}

const mockInput = {
  transits: [
    mockNewsItem({ id: 'item-mercury', headline: 'Mercury sextile Venus', importance: 75 }),
    mockNewsItem({ id: 'item-mars', headline: 'Mars square Saturn', importance: 70 })
  ],
  patterns: [
    mockNewsItem({ id: 'item-grandtrine', headline: 'Grand Trine', category: 'pattern', importance: 90 })
  ],
  harmonics: [
    mockNewsItem({ id: 'item-harmonic', headline: 'Harmonic alignment', category: 'harmonic', importance: 55 })
  ],
  date: '2026-09-14'
};

function test_S1_basicItemCreation() {
  const newsItem = mockNewsItem({ synastry: false });
  const skyWireItem = buildSkyWireItem(newsItem);
  if (!skyWireItem.headline) throw new Error('S1: Item missing headline');
  if (skyWireItem.id !== newsItem.id) throw new Error('S1: ID mismatch');
  if (skyWireItem.synastry !== undefined) throw new Error('S1: Sky Wire item should not have synastry field');
  if (skyWireItem.isNew !== undefined) throw new Error('S1: Sky Wire item should not have isNew field');
}

function test_S2_ceilingEnforcement() {
  const highImportance = mockNewsItem({ importance: 98 });
  const item = buildSkyWireItem(highImportance);
  if (item.importance > PUBLIC_CEILING) throw new Error('S2: Item importance (' + item.importance + ') exceeded ceiling (' + PUBLIC_CEILING + ')');
  if (!verifySkyWireCeiling(item)) throw new Error('S2: verifySkyWireCeiling failed for valid item');
}

function test_S3_ceilingValue() {
  if (PUBLIC_CEILING !== 93) throw new Error('S3: Ceiling should be 93, got ' + PUBLIC_CEILING);
}

function test_S4_noSynastry() {
  const newsItem = mockNewsItem({ synastry: true, partner: { id: 'p1', name: 'Test' } });
  const item = buildSkyWireItem(newsItem);
  if (item.synastry !== undefined) throw new Error('S4: synastry field should not exist in Sky Wire item');
  if (item.partner !== undefined) throw new Error('S4: partner field should not exist in Sky Wire item');
}

function test_S5_noIsNewField() {
  const newsItem = mockNewsItem({ isNew: true });
  const item = buildSkyWireItem(newsItem);
  if (item.isNew !== undefined) throw new Error('S5: isNew field should not exist in Sky Wire item');
}

function test_S6_feedMetadata() {
  const feed = buildSkyWireFeed(mockInput);
  if (feed.version !== '1.0.0') throw new Error('S6: Version mismatch');
  if (feed.date !== mockInput.date) throw new Error('S6: Date not preserved');
  if (!feed.generatedAt) throw new Error('S6: Missing generatedAt timestamp');
}

function test_S7_determinism() {
  const feed1 = buildSkyWireFeed(mockInput);
  const feed2 = buildSkyWireFeed(mockInput);
  if (!verifyDeterminism(feed1, feed2)) throw new Error('S7: Feeds are not deterministic (byte-identical)');
}

function test_S8_sortingDeterminism() {
  const input = {
    transits: [
      mockNewsItem({ id: 'item-z', importance: 80 }),
      mockNewsItem({ id: 'item-a', importance: 80 }),
      mockNewsItem({ id: 'item-m', importance: 85 })
    ],
    patterns: [], harmonics: [], date: '2026-09-14'
  };
  const feed = buildSkyWireFeed(input);
  if (feed.items[0].id !== 'item-m') throw new Error('S8: Highest importance item should be first');
  if (feed.items[1].id !== 'item-a') throw new Error('S8: Tied items should be sorted by ID (a before z)');
  if (feed.items[2].id !== 'item-z') throw new Error('S8: Second tied item should follow sorted order');
}

function test_S9_itemsValidation() {
  const feed = buildSkyWireFeed(mockInput);
  for (const item of feed.items) {
    if (!validateSkyWireItem(item)) throw new Error('S9: Item ' + item.id + ' failed validation');
  }
}

function test_S10_statistics() {
  const feed = buildSkyWireFeed(mockInput);
  const stats = feed.stats;
  if (stats.totalItems !== 4) throw new Error('S10: Expected 4 items, got ' + stats.totalItems);
  if (!stats.byCategory['transit']) throw new Error('S10: Missing transit count');
  if (stats.topImportance !== 90) throw new Error('S10: Top importance should be 90, got ' + stats.topImportance);
}

function test_S11_noStorageApi() {
  const feed = buildSkyWireFeed(mockInput);
  if (!feed.date) throw new Error('S11: Feed must be buildable without storage');
  if (feed.items.length === 0) throw new Error('S11: Feed should have items');
}

function test_S12_ceilingDifference() {
  const personalMax = 98; // 50 + 10 + 8 + 10 (natal) + 15 + 5 (rare)
  const difference = personalMax - PUBLIC_CEILING;
  if (difference !== 5) throw new Error('S12: Ceiling difference should be 5, got ' + difference);
}

function test_S13_keywordsPreserved() {
  const keywords = ['Sun', 'Venus', 'conjunction'];
  const newsItem = mockNewsItem({ keywords });
  const item = buildSkyWireItem(newsItem);
  if (item.keywords.length !== keywords.length) throw new Error('S13: Keywords not preserved');
  if (!item.keywords.includes('Sun')) throw new Error('S13: Keywords should include original content');
}

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

function runTests() {
  let passed = 0, failed = 0;
  const errors = [], results = [];

  tests.forEach((test, i) => {
    const id = 'S' + (i + 1);
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
