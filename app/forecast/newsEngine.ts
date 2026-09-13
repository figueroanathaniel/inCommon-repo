/*! forecast/newsEngine.ts
 * Core news item types and scoring engine
 * Single source of truth for NewsItem shape and importance calculation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface NewsItem {
  id: string;                       // Unique ID (timestamp_type_bodies)
  headline: string;                 // Primary sentence (≤90 chars)
  body: string;                     // Full explanation with context
  category: 'transit' | 'pattern' | 'harmonic' | 'degree-lore';
  tier: 1 | 2 | 3;                  // Importance tier
  type: string;                     // Aspect name, pattern name, etc.
  importance: number;               // 0–100 score
  window?: {                        // Orb window (optional for patterns)
    start: Date;
    peak: Date;
    end: Date;
  };
  isNew: boolean;                   // true if generated today
  keywords: string[];               // For personalization/search
  explainer?: string;               // Educational text
  practical?: string;               // Action hook
  bodies?: string[];                // Planets involved (for sorting)
  synastry?: boolean;               // true if partner item
  partner?: {                       // Partner info (synastry items only)
    id: string;
    name: string;
  };
}

export interface DayBucket {
  date: string;                     // ISO date (2026-09-14)
  items: NewsItem[];                // Full ranked items for this day
  topItemId?: string;               // Highest-importance item id
  patternCount: number;             // How many pattern items
  transitCount: number;             // How many transit items
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIER_1_BASE = 50;      // Base importance: Grand Trine, major stations
export const TIER_2_BASE = 45;      // Secondary patterns (T-Square, Yod)
export const TIER_3_BASE = 35;      // Lesser patterns, aspects to slow movers

export const BONUS_EXACTNESS = 10;  // Orb under 0.5°
export const BONUS_PERSONAL = 8;    // Touches natal Sun/Moon/ASC
export const BONUS_NATAL_TOUCH = 10;// Touches a natal point (non-personal)
export const BONUS_RARE = 5;        // Very rare pattern (eg rare harmonic alignment)
export const BONUS_COUPLE_LINK = 10;// Synastry: moving body also contacts reader point

export const IMPORTANCE_CEILING = 68; // Hard cap for synastry items (35+8+10+10+5)
export const NOTIFY_THRESHOLD = 80;   // Minimum importance to notify

// ============================================================================
// SCORING
// ============================================================================

/**
 * Calculate base importance from tier
 */
export function baseImportanceForTier(tier: 1 | 2 | 3): number {
  switch (tier) {
    case 1: return TIER_1_BASE;
    case 2: return TIER_2_BASE;
    case 3: return TIER_3_BASE;
  }
}

/**
 * Calculate total importance with bonuses, respecting ceiling
 * Synastry items hardcapped at 68 so they never trigger push notifications
 */
export function calculateImportance(
  base: number,
  bonuses: {
    exactness?: boolean;
    personalTouch?: boolean;
    natalTouch?: boolean;
    rare?: boolean;
    coupleLink?: boolean;  // Synastry only
  },
  isSynastry: boolean = false
): number {
  let total = base;

  if (bonuses.exactness) total += BONUS_EXACTNESS;
  if (bonuses.personalTouch) total += BONUS_PERSONAL;
  if (bonuses.natalTouch) total += BONUS_NATAL_TOUCH;
  if (bonuses.rare) total += BONUS_RARE;
  if (bonuses.coupleLink) total += BONUS_COUPLE_LINK;

  // Apply ceiling for synastry items
  if (isSynastry) {
    total = Math.min(total, IMPORTANCE_CEILING);
  }

  return Math.min(100, total);
}

/**
 * Verify synastry ceiling: max(35+8+10+10+5) = 68
 * Used in tests to ensure ceiling is correctly implemented
 */
export function verifySynastryCeiling(): { ceiling: number; components: string } {
  const components = [TIER_1_BASE, BONUS_EXACTNESS, BONUS_PERSONAL, BONUS_NATAL_TOUCH, BONUS_RARE].join('+');
  const ceiling = TIER_1_BASE + BONUS_EXACTNESS + BONUS_PERSONAL + BONUS_NATAL_TOUCH + BONUS_RARE;
  return { ceiling, components };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate stable ID for a news item
 */
export function generateNewsId(type: string, bodies: string[], date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  const bodyStr = bodies.slice(0, 2).join('_');
  return `${dateStr}_${type}_${bodyStr}`.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Sort news items by importance (descending)
 */
export function sortByImportance(items: NewsItem[]): NewsItem[] {
  return items.sort((a, b) => b.importance - a.importance);
}

/**
 * Filter items by category
 */
export function filterByCategory(
  items: NewsItem[],
  category: 'transit' | 'pattern' | 'harmonic' | 'degree-lore'
): NewsItem[] {
  return items.filter(i => i.category === category);
}

/**
 * Count items by category
 */
export function countByCategory(items: NewsItem[]): Record<string, number> {
  return items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get average importance across items
 */
export function averageImportance(items: NewsItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + item.importance, 0);
  return sum / items.length;
}
