/*! forecast/longterm.ts
 * Monthly and yearly retrospectives: durable aggregation beyond the 26-week archive cap
 * WeekSummaries persist indefinitely; item cache (LRU) enables re-render of old headlines
 */

import { NewsItem, DayBucket } from './newsEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface WeekSummary {
  weekStart: string;              // ISO date of Monday
  topItemIds: string[];           // Top 3 item IDs (importance-ranked)
  rareEventIds: string[];         // Items with importance ≥85 or tier-1 patterns
  dominantCategory: 'pattern' | 'transit' | 'mixed';
  avgImportance: number;
  patternCount: number;
  transitCount: number;
  busiestDay: string;             // ISO date
  itemCount: number;
}

export interface MonthView {
  monthOf: string;                // ISO date of month start (1st)
  weeks: WeekSummary[];           // 4–5 weeks in month
  theme: 'pattern' | 'transit' | 'mixed';
  stationItems: NewsItem[];        // Retrograde/station/ingress items for month
  rareEvents: NewsItem[];          // Top rare events (with resolved headlines)
  avgImportance: number;
  topItem?: NewsItem;              // Month headline
  dataBegins?: string;             // If archive predates this feature
}

export interface MonthCell {
  month: string;                  // "2026-10" format
  itemCount: number;
  dominantCategory: 'pattern' | 'transit' | 'mixed';
  hasData: boolean;
}

export interface RetrogradePeriod {
  body: string;
  startDate: string;
  endDate: string;
  isRetrograde: boolean;
}

export interface YearView {
  year: number;
  months: MonthCell[];            // 12 cells
  retrogradeTimeline: RetrogradePeriod[];
  topFiveRare: NewsItem[];
  yearHeadline?: NewsItem;
  skyMood: string;                // Generated narrative (≤140 chars)
  dataBegins?: string;
}

export interface CachedItem {
  id: string;
  headline: string;
  importance: number;
  category: 'pattern' | 'transit' | 'harmonic' | 'degree-lore';
  tier: 1 | 2 | 3;
  lastAccessed: number;           // Timestamp for LRU
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LONGTERM_KEY = 'skyLongterm.v1';
const ITEM_CACHE_KEY = 'skyItems.v1';
const MAX_CACHED_ITEMS = 500;

// ============================================================================
// ITEM CACHE (LRU)
// ============================================================================

/**
 * Load item cache from localStorage
 */
function loadItemCache(): Map<string, CachedItem> {
  try {
    const stored = localStorage.getItem(ITEM_CACHE_KEY);
    if (!stored) return new Map();

    const data = JSON.parse(stored);
    return new Map(Object.entries(data) as [string, CachedItem][]);
  } catch (e) {
    console.warn('Failed to load item cache:', e);
    return new Map();
  }
}

/**
 * Save item cache to localStorage, evicting oldest if over cap
 */
function saveItemCache(cache: Map<string, CachedItem>): void {
  try {
    if (cache.size > MAX_CACHED_ITEMS) {
      // Sort by lastAccessed, evict oldest
      const sorted = Array.from(cache.values()).sort(
        (a, b) => a.lastAccessed - b.lastAccessed
      );
      const toEvict = sorted.length - MAX_CACHED_ITEMS;
      for (let i = 0; i < toEvict; i++) {
        cache.delete(sorted[i].id);
      }
    }

    const data: Record<string, CachedItem> = {};
    cache.forEach((item, id) => {
      data[id] = item;
    });

    localStorage.setItem(ITEM_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save item cache:', e);
  }
}

/**
 * Add item to cache, updating access time
 */
export function cacheItem(item: NewsItem): void {
  const cache = loadItemCache();

  cache.set(item.id, {
    id: item.id,
    headline: item.headline,
    importance: item.importance,
    category: item.category,
    tier: item.tier,
    lastAccessed: Date.now()
  });

  saveItemCache(cache);
}

/**
 * Resolve item from cache (or null if not cached)
 */
function getCachedItem(id: string): CachedItem | null {
  const cache = loadItemCache();
  const item = cache.get(id);

  if (item) {
    // Update access time
    item.lastAccessed = Date.now();
    cache.set(id, item);
    saveItemCache(cache);
  }

  return item || null;
}

// ============================================================================
// WEEK SUMMARY PERSISTENCE
// ============================================================================

/**
 * Load all week summaries
 */
function loadWeekSummaries(): WeekSummary[] {
  try {
    const stored = localStorage.getItem(LONGTERM_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    return data.weeks || [];
  } catch (e) {
    console.warn('Failed to load week summaries:', e);
    return [];
  }
}

/**
 * Save week summaries
 */
function saveWeekSummaries(weeks: WeekSummary[]): void {
  try {
    localStorage.setItem(LONGTERM_KEY, JSON.stringify({
      version: '1.0.0',
      weeks,
      lastUpdated: new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Failed to save week summaries:', e);
  }
}

/**
 * Create a WeekSummary from weekly stats and cache all items
 */
export function recordWeekSummary(
  weekStart: string,
  items: NewsItem[],
  topItems: NewsItem[]
): void {
  // Cache all items
  items.forEach(item => cacheItem(item));

  // Find busiest day (scan items for a date field or assume from context)
  const busiestDay = weekStart; // Placeholder; real impl would scan DayBucket

  const summary: WeekSummary = {
    weekStart,
    topItemIds: topItems.slice(0, 3).map(i => i.id),
    rareEventIds: items
      .filter(i => i.importance >= 85 || (i.category === 'pattern' && i.tier === 1))
      .map(i => i.id),
    dominantCategory: items.filter(i => i.category === 'pattern').length > items.filter(i => i.category === 'transit').length ? 'pattern' : 'transit',
    avgImportance: items.length > 0
      ? items.reduce((sum, i) => sum + i.importance, 0) / items.length
      : 0,
    patternCount: items.filter(i => i.category === 'pattern').length,
    transitCount: items.filter(i => i.category === 'transit').length,
    busiestDay,
    itemCount: items.length
  };

  const existing = loadWeekSummaries();
  // Remove if already exists (idempotent)
  const filtered = existing.filter(w => w.weekStart !== weekStart);
  filtered.push(summary);

  saveWeekSummaries(filtered);
}

/**
 * Get all weeks in a month
 */
function getWeeksInMonth(month: Date): WeekSummary[] {
  const year = month.getFullYear();
  const monthNum = month.getMonth();

  const allWeeks = loadWeekSummaries();

  return allWeeks.filter(week => {
    const weekDate = new Date(week.weekStart);
    return (
      weekDate.getFullYear() === year &&
      weekDate.getMonth() === monthNum
    );
  });
}

/**
 * Get all weeks in a year
 */
function getWeeksInYear(year: number): WeekSummary[] {
  const allWeeks = loadWeekSummaries();
  return allWeeks.filter(week => {
    const weekDate = new Date(week.weekStart);
    return weekDate.getFullYear() === year;
  });
}

// ============================================================================
// AGGREGATION: MONTH VIEW
// ============================================================================

/**
 * Aggregate weeks into a month view
 */
export function aggregateMonth(month: Date): MonthView {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const weeks = getWeeksInMonth(month);

  // Resolve all rare event headlines from cache
  const allRareIds = new Set<string>();
  weeks.forEach(w => {
    w.rareEventIds.forEach(id => allRareIds.add(id));
  });

  const rareEvents = Array.from(allRareIds)
    .map(id => getCachedItem(id))
    .filter((item): item is CachedItem => item !== null)
    .map(item => ({
      id: item.id,
      headline: item.headline,
      importance: item.importance,
      category: item.category,
      tier: item.tier
    } as unknown as NewsItem))
    .sort((a, b) => b.importance - a.importance);

  // Determine month theme
  const patternCount = weeks.reduce((sum, w) => sum + w.patternCount, 0);
  const transitCount = weeks.reduce((sum, w) => sum + w.transitCount, 0);
  const theme = patternCount > transitCount ? 'pattern' : transitCount > patternCount ? 'transit' : 'mixed';

  // Average importance
  const totalImportance = weeks.reduce((sum, w) => sum + w.avgImportance * w.itemCount, 0);
  const totalItems = weeks.reduce((sum, w) => sum + w.itemCount, 0);
  const avgImportance = totalItems > 0 ? totalImportance / totalItems : 0;

  // Top item for month headline
  const topItem = rareEvents[0];

  return {
    monthOf: monthStart,
    weeks,
    theme,
    stationItems: [], // Placeholder; would scan archive for stations
    rareEvents,
    avgImportance,
    topItem
  };
}

// ============================================================================
// AGGREGATION: YEAR VIEW
// ============================================================================

/**
 * Build retrograde timeline from station items in year
 */
function buildRetrogadeTimeline(year: number): RetrogradePeriod[] {
  // Placeholder: would scan archive for transit items with "station" or "retrograde" keywords
  // For now, return empty (data depends on what was archived)
  return [];
}

/**
 * Aggregate months into a year view
 */
export function aggregateYear(year: number): YearView {
  const weeks = getWeeksInYear(year);

  // Build month cells
  const months: MonthCell[] = [];
  for (let m = 0; m < 12; m++) {
    const monthWeeks = weeks.filter(w => {
      const weekDate = new Date(w.weekStart);
      return weekDate.getMonth() === m;
    });

    const hasData = monthWeeks.length > 0;
    const itemCount = monthWeeks.reduce((sum, w) => sum + w.itemCount, 0);
    const patternCount = monthWeeks.reduce((sum, w) => sum + w.patternCount, 0);
    const transitCount = monthWeeks.reduce((sum, w) => sum + w.transitCount, 0);

    months.push({
      month: `${year}-${String(m + 1).padStart(2, '0')}`,
      itemCount,
      dominantCategory: patternCount > transitCount ? 'pattern' : transitCount > patternCount ? 'transit' : 'mixed',
      hasData
    });
  }

  // Collect all rare events across year
  const allRareIds = new Set<string>();
  weeks.forEach(w => {
    w.rareEventIds.forEach(id => allRareIds.add(id));
  });

  const allRare = Array.from(allRareIds)
    .map(id => getCachedItem(id))
    .filter((item): item is CachedItem => item !== null)
    .map(item => ({
      id: item.id,
      headline: item.headline,
      importance: item.importance,
      category: item.category,
      tier: item.tier
    } as unknown as NewsItem))
    .sort((a, b) => b.importance - a.importance);

  const topFiveRare = allRare.slice(0, 5);
  const yearHeadline = topFiveRare[0];

  // Retrograde timeline
  const retrogradeTimeline = buildRetrogadeTimeline(year);

  return {
    year,
    months,
    retrogradeTimeline,
    topFiveRare,
    yearHeadline,
    skyMood: '' // Will be filled by retrospectiveCopy.ts
  };
}

/**
 * Check if data begins after a certain date (for "data begins" note)
 */
export function dataBeginDate(): string | null {
  const weeks = loadWeekSummaries();
  if (weeks.length === 0) return null;

  const earliest = weeks.reduce((min, w) => {
    const weekDate = new Date(w.weekStart);
    return weekDate < new Date(min.weekStart) ? w : min;
  });

  return earliest.weekStart;
}
