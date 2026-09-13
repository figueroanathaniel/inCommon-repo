/*! forecast/archive.ts
 * Weekly archive: persistence layer for past sky recaps
 * Local-first, capped at 26 weeks, idempotent daily snapshots
 */

import { NewsItem } from './newsEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface DayBucket {
  date: string;                    // ISO date (2026-09-14)
  items: NewsItem[];               // Full ranked items for this day
  topItemId?: string;              // Highest-importance item id
  patternCount: number;            // How many pattern items
  transitCount: number;            // How many transit items
}

export interface WeekStats {
  busiestDay: DayBucket;
  quietestDay: DayBucket;
  dominantCategory: 'pattern' | 'transit' | 'mixed';
  avgImportance: number;
  rareEvents: NewsItem[];          // importance ≥ 85 or tier-1 patterns
  totalItems: number;
  weekOf: string;                  // Start date (Monday)
}

interface ArchiveEntry {
  date: string;
  items: NewsItem[];
}

interface ArchiveStore {
  version: string;
  entries: ArchiveEntry[];
  lastUpdated: string;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

const ARCHIVE_KEY = 'skyArchive.v1';
const MAX_WEEKS = 26;
const DAYS_PER_WEEK = 7;
const MAX_DAYS = MAX_WEEKS * DAYS_PER_WEEK;

/**
 * Load archive from localStorage
 */
function loadArchive(): ArchiveStore {
  try {
    const stored = localStorage.getItem(ARCHIVE_KEY);
    if (!stored) {
      return {
        version: '1.0.0',
        entries: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const parsed = JSON.parse(stored);
    // Version migration: if shape differs, log and migrate or drop
    if (parsed.version !== '1.0.0') {
      console.warn(`Archive version mismatch: expected 1.0.0, got ${parsed.version}. Dropping old data.`);
      return {
        version: '1.0.0',
        entries: [],
        lastUpdated: new Date().toISOString()
      };
    }

    return parsed;
  } catch (e) {
    console.warn('Failed to load archive:', e);
    return {
      version: '1.0.0',
      entries: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Save archive to localStorage
 */
function saveArchive(archive: ArchiveStore): void {
  try {
    // Enforce 26-week cap
    if (archive.entries.length > MAX_DAYS) {
      archive.entries = archive.entries.slice(-MAX_DAYS);
    }

    archive.lastUpdated = new Date().toISOString();
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  } catch (e) {
    console.warn('Failed to save archive:', e);
  }
}

/**
 * Append a day's snapshot to the archive
 * Idempotent: same date overwrites previous entry
 */
export function appendDailySnapshot(
  newsItems: NewsItem[],
  date: string = new Date().toISOString().split('T')[0]
): void {
  const archive = loadArchive();

  // Find and remove existing entry for this date (idempotent)
  archive.entries = archive.entries.filter(e => e.date !== date);

  // Append new entry
  archive.entries.push({ date, items: newsItems });

  // Trim to 26 weeks (newest kept)
  if (archive.entries.length > MAX_DAYS) {
    archive.entries = archive.entries.slice(-MAX_DAYS);
  }

  saveArchive(archive);
}

/**
 * Get a week's worth of day buckets (Monday–Sunday)
 */
export function getWeek(startMonday: Date): DayBucket[] {
  const archive = loadArchive();
  const dayBuckets: DayBucket[] = [];

  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    const date = new Date(startMonday);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const entry = archive.entries.find(e => e.date === dateStr);
    const items = entry?.items || [];

    const patternCount = items.filter(i => i.category === 'pattern').length;
    const transitCount = items.filter(i => i.category === 'transit').length;
    const topItem = items.length > 0 ? items[0] : undefined;

    dayBuckets.push({
      date: dateStr,
      items,
      topItemId: topItem?.id,
      patternCount,
      transitCount
    });
  }

  return dayBuckets;
}

/**
 * Get statistics for a week
 */
export function getStats(week: DayBucket[]): WeekStats {
  const allItems = week.flatMap(day => day.items);

  const busiestDay = week.reduce((a, b) => a.items.length > b.items.length ? a : b);
  const quietestDay = week.reduce((a, b) => a.items.length < b.items.length ? a : b);

  const patternItems = allItems.filter(i => i.category === 'pattern').length;
  const transitItems = allItems.filter(i => i.category === 'transit').length;
  const dominantCategory = patternItems > transitItems ? 'pattern' : transitItems > patternItems ? 'transit' : 'mixed';

  const avgImportance = allItems.length > 0
    ? allItems.reduce((sum, i) => sum + i.importance, 0) / allItems.length
    : 0;

  const rareEvents = allItems.filter(i =>
    i.importance >= 85 || (i.category === 'pattern' && i.tier === 1)
  );

  return {
    busiestDay,
    quietestDay,
    dominantCategory,
    avgImportance,
    rareEvents,
    totalItems: allItems.length,
    weekOf: week[0]?.date || new Date().toISOString().split('T')[0]
  };
}

/**
 * Export archive as JSON
 */
export function exportArchive(): string {
  const archive = loadArchive();
  return JSON.stringify(archive, null, 2);
}

/**
 * Import archive from JSON
 * Validates schema; merges by id (later duplicates win)
 */
export function importArchive(jsonStr: string): { success: boolean; message: string } {
  try {
    const imported = JSON.parse(jsonStr);

    // Validate schema
    if (!imported.version || !Array.isArray(imported.entries)) {
      return { success: false, message: 'Invalid schema: missing version or entries' };
    }

    if (imported.version !== '1.0.0') {
      console.warn(`Importing version ${imported.version} into 1.0.0. Unknown fields will be ignored.`);
    }

    const archive = loadArchive();

    // Merge by id: later entries win
    const idToEntry = new Map<string, ArchiveEntry>();

    // Load existing
    archive.entries.forEach(e => {
      e.items.forEach(item => {
        idToEntry.set(item.id, e);
      });
    });

    // Load imported (overwrites duplicates)
    imported.entries.forEach((e: ArchiveEntry) => {
      e.items.forEach((item: NewsItem) => {
        idToEntry.set(item.id, e);
      });
    });

    // Rebuild entries from merged map
    const mergedEntries: ArchiveEntry[] = [];
    idToEntry.forEach(entry => {
      const existing = mergedEntries.find(e => e.date === entry.date);
      if (existing) {
        existing.items = [...existing.items, ...entry.items];
      } else {
        mergedEntries.push({ ...entry });
      }
    });

    // Save merged archive
    archive.entries = mergedEntries;
    saveArchive(archive);

    return { success: true, message: 'Archive imported and merged successfully' };
  } catch (e) {
    return { success: false, message: `Import failed: ${e instanceof Error ? e.message : 'unknown error'}` };
  }
}

/**
 * Clear entire archive (destructive, use carefully)
 */
export function clearArchive(): void {
  try {
    localStorage.removeItem(ARCHIVE_KEY);
  } catch (e) {
    console.warn('Failed to clear archive:', e);
  }
}

/**
 * Check if a day has been snapshotted
 */
export function hasDaySnapshot(date: string): boolean {
  const archive = loadArchive();
  return archive.entries.some(e => e.date === date);
}
