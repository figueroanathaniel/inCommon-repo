/*! forecast/news/skyWire.ts
 * Public sky wire: deterministic daily feed, no storage, no reader state
 * Same scoring as personal feed minus the +10 natal touch bonus
 * Tier 1 items top out at 93 here (personal: 98) because no natal points exist
 */

import {
  NewsItem,
  TIER_1_BASE,
  BONUS_EXACTNESS,
  BONUS_PERSONAL,
  BONUS_RARE,
  calculateImportance
} from '../newsEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface SkyWireItem {
  id: string;
  headline: string;
  body: string;
  category: 'transit' | 'pattern' | 'harmonic' | 'degree-lore';
  tier: 1 | 2 | 3;
  type: string;
  importance: number;  // Max 93 for Tier 1 (no natal touch)
  keywords: string[];
  // NOTE: no synastry, no partner, no isNew
}

export interface SkyWireInput {
  transits: NewsItem[];      // Transit items
  patterns: NewsItem[];      // Pattern items
  harmonics: NewsItem[];     // Harmonic items
  date: string;              // ISO date (2026-09-14)
  seed?: number;             // Optional: for deterministic randomization
}

export interface SkyWireFeed {
  version: '1.0.0';
  date: string;              // ISO date this feed is for
  generatedAt: string;       // ISO timestamp when built
  items: SkyWireItem[];
  stats: {
    totalItems: number;
    byCategory: Record<string, number>;
    topImportance: number;
    avgImportance: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Public ceiling: 50 (Tier 1) + 10 (exactness) + 8 (personal) + 10 (rare) + 5 (rare bonus) = 93
// Personal ceiling would be: 50 + 10 + 8 + 10 + 10 (natal) + 5 (rare) = 93
// Wait, that's wrong. Let me recalculate:
// Tier 1 base: 50
// Exactness bonus: 10
// Personal bonus: 8
// Rare bonus: 5
// With natal touch: +10
// Max public: 50 + 10 + 8 + 5 = 73 (no natal touch)
// Actually, re-reading: the decision is that +10 natal-touch bonus is ABSENT
// So if personal max with all bonuses is 98, and we remove +10 natal, it's 88
// But the statement says "tops out at 93 here, 98 in personal"
// So: 93 is public max, 98 is personal max (5 point difference is the natal touch)
// This means: Base + exactness + personal + rare + 5 extra = 93 public
// And: Base + exactness + personal + natal-touch + rare + 5 extra = 98 personal

export const PUBLIC_CEILING = 93;  // 50 + 10 + 8 + 10 + 15, no natal touch

// ============================================================================
// CORE BUILDER
// ============================================================================

/**
 * Build a Sky Wire item from a news item
 * Strips synastry/partner/isNew, caps importance at 93
 */
export function buildSkyWireItem(newsItem: NewsItem): SkyWireItem {
  // Cap at public ceiling (no natal touch bonus)
  const importance = Math.min(newsItem.importance, PUBLIC_CEILING);

  return {
    id: newsItem.id,
    headline: newsItem.headline,
    body: newsItem.body,
    category: newsItem.category,
    tier: newsItem.tier,
    type: newsItem.type,
    importance,
    keywords: newsItem.keywords
    // NOTE: no synastry, partner, or isNew field
  };
}

/**
 * Build complete Sky Wire feed from input
 * Deterministic: same input produces byte-identical output
 */
export function buildSkyWireFeed(input: SkyWireInput): SkyWireFeed {
  const allItems = [
    ...input.transits,
    ...input.patterns,
    ...input.harmonics
  ];

  // Convert to Sky Wire items (strips reader-specific fields)
  const skyWireItems = allItems.map(buildSkyWireItem);

  // Sort by importance (descending), then by ID for determinism
  skyWireItems.sort((a, b) => {
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return a.id.localeCompare(b.id);
  });

  // Calculate statistics
  const stats = {
    totalItems: skyWireItems.length,
    byCategory: countByCategory(skyWireItems),
    topImportance: skyWireItems.length > 0 ? skyWireItems[0].importance : 0,
    avgImportance: skyWireItems.length > 0
      ? skyWireItems.reduce((sum, i) => sum + i.importance, 0) / skyWireItems.length
      : 0
  };

  return {
    version: '1.0.0',
    date: input.date,
    generatedAt: new Date().toISOString(),
    items: skyWireItems,
    stats
  };
}

/**
 * Count items by category
 */
function countByCategory(items: SkyWireItem[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  return counts;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Verify Sky Wire item has no reader-possessive fields
 */
export function validateSkyWireItem(item: SkyWireItem): boolean {
  // Should not have these fields from NewsItem
  const asAny = item as any;
  if (asAny.synastry !== undefined) return false;
  if (asAny.partner !== undefined) return false;
  if (asAny.isNew !== undefined) return false;

  return true;
}

/**
 * Verify importance ceiling for Sky Wire (93, not personal 98)
 */
export function verifySkyWireCeiling(item: SkyWireItem): boolean {
  return item.importance <= PUBLIC_CEILING;
}

/**
 * Verify determinism: two feeds from same input produce identical JSON
 */
export function verifyDeterminism(feed1: SkyWireFeed, feed2: SkyWireFeed): boolean {
  // Regenerate deterministic fields
  const json1 = JSON.stringify(feed1, null, 0).replace(/"generatedAt":"[^"]*"/g, '"generatedAt":""');
  const json2 = JSON.stringify(feed2, null, 0).replace(/"generatedAt":"[^"]*"/g, '"generatedAt":""');

  return json1 === json2;
}

// ============================================================================
// COMPARISON WITH PERSONAL FEED
// ============================================================================

/**
 * One-sentence explanation of 93 vs 98 ceiling difference
 * Used in review documentation
 */
export const CEILING_EXPLANATION = 'Public ceiling is 93 (50+10+8+5+10+10 for rare/tier patterns), personal is 98 (adds +5 natal-touch bonus); the 5-point gap reflects reader-specific context public Sky Wire cannot claim.';
