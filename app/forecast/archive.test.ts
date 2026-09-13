/*! forecast/archive.test.ts
 * Weekly archive: comprehensive test suite
 * Idempotency, eviction, stats, share text, import/export, migration
 */

import {
  appendDailySnapshot,
  getWeek,
  getStats,
  exportArchive,
  importArchive,
  clearArchive,
  hasDaySnapshot,
  DayBucket,
  WeekStats
} from './archive';
import { buildShareText, lintShareText } from './content/shareRecap';
import { NewsItem } from './newsEngine';

describe('Archive: idempotency', () => {
  beforeEach(() => clearArchive());

  test('Appending same date twice: only latest stored', () => {
    const date = '2026-09-14';
    const items1 = [
      {
        id: 'item1',
        headline: 'First headline',
        body: 'First body',
        category: 'pattern' as const,
        tier: 1,
        importance: 85,
        window: {},
        isNew: true,
        keywords: ['pattern'],
        explainer: 'Explainer 1',
        practical: 'Practical 1'
      }
    ];

    const items2 = [
      {
        id: 'item2',
        headline: 'Second headline',
        body: 'Second body',
        category: 'transit' as const,
        tier: 1,
        importance: 78,
        window: {},
        isNew: true,
        keywords: ['transit'],
        explainer: 'Explainer 2',
        practical: 'Practical 2'
      }
    ];

    appendDailySnapshot(items1, date);
    appendDailySnapshot(items2, date);

    const week = getWeek(new Date(date));
    const dayBucket = week[0];

    // Should contain only second snapshot's items
    expect(dayBucket.items.length).toBe(1);
    expect(dayBucket.items[0].id).toBe('item2');
  });

  test('hasDaySnapshot returns true only after append', () => {
    const date = '2026-09-14';

    expect(hasDaySnapshot(date)).toBe(false);

    const items = [
      {
        id: 'item1',
        headline: 'Headline',
        body: 'Body',
        category: 'pattern' as const,
        tier: 1,
        importance: 80,
        window: {},
        isNew: true,
        keywords: ['pattern'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items, date);

    expect(hasDaySnapshot(date)).toBe(true);
  });
});

describe('Archive: eviction', () => {
  beforeEach(() => clearArchive());

  test('26 week cap: oldest day evicted after 182 days', () => {
    const MAX_DAYS = 182;

    // Append 182 days
    for (let i = 0; i < MAX_DAYS; i++) {
      const date = new Date(2026, 0, 1 + i);
      const dateStr = date.toISOString().split('T')[0];
      appendDailySnapshot(
        [
          {
            id: `item-day${i}`,
            headline: `Day ${i}`,
            body: 'Body',
            category: 'pattern' as const,
            tier: 1,
            importance: 50 + i % 50,
            window: {},
            isNew: true,
            keywords: ['pattern'],
            explainer: 'Explainer',
            practical: 'Practical'
          }
        ],
        dateStr
      );
    }

    // Verify all 182 are present
    const week = getWeek(new Date(2026, 0, 1));
    expect(hasDaySnapshot('2026-01-01')).toBe(true);
    expect(hasDaySnapshot('2026-06-30')).toBe(true);

    // Add day 183 (should evict day 1)
    const day183 = new Date(2026, 0, 1 + MAX_DAYS);
    const day183Str = day183.toISOString().split('T')[0];

    appendDailySnapshot(
      [
        {
          id: 'item-day183',
          headline: 'Day 183',
          body: 'Body',
          category: 'pattern' as const,
          tier: 1,
          importance: 85,
          window: {},
          isNew: true,
          keywords: ['pattern'],
          explainer: 'Explainer',
          practical: 'Practical'
        }
      ],
      day183Str
    );

    // Day 1 should be gone, day 2 should remain, day 183 should exist
    expect(hasDaySnapshot('2026-01-01')).toBe(false);
    expect(hasDaySnapshot('2026-01-02')).toBe(true);
    expect(hasDaySnapshot(day183Str)).toBe(true);
  });
});

describe('Archive: getStats', () => {
  beforeEach(() => clearArchive());

  test('Busiest day identified correctly', () => {
    const monday = new Date(2026, 8, 14); // Sep 14 (Monday)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const count = i === 2 ? 8 : 3; // Wednesday has 8 items
      const items: NewsItem[] = [];
      for (let j = 0; j < count; j++) {
        items.push({
          id: `item-${i}-${j}`,
          headline: `Item ${i}-${j}`,
          body: 'Body',
          category: i % 2 === 0 ? 'pattern' : 'transit',
          tier: 1,
          importance: 50 + (j % 30),
          window: {},
          isNew: true,
          keywords: ['test'],
          explainer: 'Explainer',
          practical: 'Practical'
        });
      }
      appendDailySnapshot(items, dateStr);
    }

    const week = getWeek(monday);
    const stats = getStats(week);

    expect(stats.busiestDay.items.length).toBe(8);
    expect(stats.busiestDay.date).toMatch(/2026-09-16/); // Wednesday
  });

  test('Dominant category determined by volume', () => {
    const monday = new Date(2026, 8, 14);
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const items: NewsItem[] = [];
      // Monday-Friday: patterns; Saturday-Sunday: transits
      const isPattern = i < 5;
      for (let j = 0; j < 4; j++) {
        items.push({
          id: `item-${i}-${j}`,
          headline: `Item ${i}-${j}`,
          body: 'Body',
          category: isPattern ? 'pattern' : 'transit',
          tier: 1,
          importance: 50,
          window: {},
          isNew: true,
          keywords: ['test'],
          explainer: 'Explainer',
          practical: 'Practical'
        });
      }
      appendDailySnapshot(items, dateStr);
    }

    const week = getWeek(monday);
    const stats = getStats(week);

    expect(stats.dominantCategory).toBe('pattern');
  });

  test('Rare events filtered: importance >= 85 or tier-1 patterns', () => {
    const monday = new Date(2026, 8, 14);
    const dateStr = monday.toISOString().split('T')[0];

    const items: NewsItem[] = [
      {
        id: 'rare1',
        headline: 'High importance',
        body: 'Body',
        category: 'transit',
        tier: 2,
        importance: 90,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'rare2',
        headline: 'Tier-1 pattern',
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 75,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'normal1',
        headline: 'Normal importance',
        body: 'Body',
        category: 'transit',
        tier: 2,
        importance: 60,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items, dateStr);

    const week = getWeek(monday);
    const stats = getStats(week);

    // Should include rare1 (importance 90) and rare2 (tier-1 pattern)
    expect(stats.rareEvents.length).toBe(2);
    expect(stats.rareEvents.map(r => r.id).sort()).toEqual(['rare1', 'rare2']);
  });

  test('Average importance calculated correctly', () => {
    const monday = new Date(2026, 8, 14);
    const dateStr = monday.toISOString().split('T')[0];

    const items: NewsItem[] = [
      {
        id: 'item1',
        headline: 'Item 1',
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 80,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'item2',
        headline: 'Item 2',
        body: 'Body',
        category: 'transit',
        tier: 1,
        importance: 60,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'item3',
        headline: 'Item 3',
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 70,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items, dateStr);

    const week = getWeek(monday);
    const stats = getStats(week);

    // (80 + 60 + 70) / 3 = 70
    expect(stats.avgImportance).toBe(70);
  });
});

describe('Archive: share text generation', () => {
  beforeEach(() => clearArchive());

  test('Share text respects 600 char limit', () => {
    const monday = new Date(2026, 8, 14);
    const dateStr = monday.toISOString().split('T')[0];

    const items: NewsItem[] = [
      {
        id: 'headline-item',
        headline: 'A very important and long headline that might exceed char limits if not handled properly',
        body: 'Long body text that continues on and on...',
        category: 'pattern',
        tier: 1,
        importance: 95,
        window: {},
        isNew: true,
        keywords: ['pattern'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items, dateStr);

    const week = getWeek(monday);
    const stats = getStats(week);

    const shareText = buildShareText(items[0], stats, '2026-09-14');

    expect(shareText.length).toBeLessThanOrEqual(600);
  });

  test('Share text includes inCommon attribution', () => {
    const monday = new Date(2026, 8, 14);
    const dateStr = monday.toISOString().split('T')[0];

    const items: NewsItem[] = [
      {
        id: 'item1',
        headline: 'Headline',
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 85,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items, dateStr);

    const week = getWeek(monday);
    const stats = getStats(week);

    const shareText = buildShareText(items[0], stats, '2026-09-14');

    expect(shareText).toContain('inCommon');
  });

  test('Share text tone lints: no forbidden words', () => {
    const shareText = 'My week in the sky: cautious. This will happen and is guaranteed. –inCommon';

    const lint = lintShareText(shareText);

    expect(lint.valid).toBe(false);
    expect(lint.violations.length).toBeGreaterThan(0);
    expect(lint.violations.some(v => v.includes('guaranteed'))).toBe(true);
  });

  test('Share text tone passes clean', () => {
    const shareText = 'My week in the sky: balanced energy. Saturday: quiet. 2 rare moments. –inCommon';

    const lint = lintShareText(shareText);

    expect(lint.valid).toBe(true);
    expect(lint.violations.length).toBe(0);
  });
});

describe('Archive: export and import', () => {
  beforeEach(() => clearArchive());

  test('Export produces valid JSON', () => {
    const monday = new Date(2026, 8, 14);
    const dateStr = monday.toISOString().split('T')[0];

    const items: NewsItem[] = [
      {
        id: 'item1',
        headline: 'Headline',
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 85,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items, dateStr);

    const exported = exportArchive();

    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe('1.0.0');
    expect(Array.isArray(parsed.entries)).toBe(true);
  });

  test('Import rejects malformed JSON', () => {
    const result = importArchive('{ invalid json');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Import failed');
  });

  test('Import rejects missing schema', () => {
    const badJson = JSON.stringify({ notVersion: '1.0.0' });

    const result = importArchive(badJson);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid schema');
  });

  test('Import merges entries by id (later wins)', () => {
    clearArchive();

    // Add initial entry
    const monday = new Date(2026, 8, 14);
    const dateStr = monday.toISOString().split('T')[0];

    const items1: NewsItem[] = [
      {
        id: 'shared-id',
        headline: 'First',
        body: 'First body',
        category: 'pattern',
        tier: 1,
        importance: 85,
        window: {},
        isNew: true,
        keywords: ['test'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    appendDailySnapshot(items1, dateStr);

    // Create an import with a newer version of the same item
    const importJson = JSON.stringify({
      version: '1.0.0',
      entries: [
        {
          date: dateStr,
          items: [
            {
              id: 'shared-id',
              headline: 'Updated',
              body: 'Updated body',
              category: 'transit',
              tier: 1,
              importance: 90,
              window: {},
              isNew: true,
              keywords: ['test'],
              explainer: 'Explainer',
              practical: 'Practical'
            }
          ]
        }
      ],
      lastUpdated: new Date().toISOString()
    });

    const result = importArchive(importJson);

    expect(result.success).toBe(true);

    // Verify the imported version won
    const week = getWeek(monday);
    const dayBucket = week[0];
    expect(dayBucket.items[0].headline).toBe('Updated');
  });

  test('Import handles version mismatch gracefully', () => {
    const importJson = JSON.stringify({
      version: '2.0.0',
      entries: [],
      lastUpdated: new Date().toISOString()
    });

    // Should not throw, version warning logged
    const result = importArchive(importJson);

    expect(result.success).toBe(true);
  });
});

describe('Archive: schema migration', () => {
  test('Version mismatch loads empty archive', () => {
    clearArchive();

    // Manually set up old schema
    const oldSchema = {
      version: '0.5.0',
      entries: [
        {
          date: '2026-09-14',
          items: [{ id: 'old-item' }]
        }
      ]
    };

    localStorage.setItem('skyArchive.v1', JSON.stringify(oldSchema));

    // Load should migrate
    const week = getWeek(new Date(2026, 8, 14));

    // Old data should be gone
    expect(hasDaySnapshot('2026-09-14')).toBe(false);

    // New empty archive available
    const exported = exportArchive();
    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe('1.0.0');
  });

  test('Corrupt localStorage handled gracefully', () => {
    clearArchive();

    // Set garbage
    localStorage.setItem('skyArchive.v1', 'not valid json at all');

    // Should return empty archive
    const week = getWeek(new Date(2026, 8, 14));

    expect(week.length).toBe(7);
    week.forEach(day => {
      expect(day.items.length).toBe(0);
    });
  });
});
