/*! forecast/feedBuilder.ts
 * Build complete news feed by merging transit/pattern items with synastry items
 * Single source of truth for feed composition and sorting
 */

import { NewsItem, sortByImportance } from './newsEngine';
import { buildSynastryItems, PartnerChart } from './news/multiChart';
import { headlinesFor, pickHeadline, fillHeadline } from './content/headlines';
import { synastryTemplatesFor, pickSynastryTemplate, fillSynastryTemplate } from './news/synastryTemplates';

// ============================================================================
// TYPES
// ============================================================================

export interface NewsInput {
  baseItems: NewsItem[];          // Transit, pattern, harmonic, degree-lore items
  partners?: PartnerChart[];      // Optional: partner charts for synastry
  personalPointIds?: string[];    // Which points count as "personal" for bonuses
  options?: {
    maxSynastryItems?: number;    // Limit synastry items per feed (default: unlimited)
    minImportance?: number;       // Filter items below this threshold
  };
}

export interface FeedBuilderResult {
  items: NewsItem[];              // Final merged and sorted items
  stats: {
    baseItems: number;
    synastryItems: number;
    totalItems: number;
    itemsByCategory: Record<string, number>;
    itemsByPartner: Record<string, number>;  // Count by partner id
  };
}

// ============================================================================
// FEED BUILDING
// ============================================================================

/**
 * Build complete feed merging base items with synastry items
 * All items sorted by importance (highest first)
 */
export function buildFeed(input: NewsInput): FeedBuilderResult {
  const allItems: NewsItem[] = [];

  // Start with base items
  allItems.push(...input.baseItems);

  // Add synastry items if partners provided
  if (input.partners && input.partners.length > 0) {
    for (const partner of input.partners) {
      // In a real implementation, this would compute synastry contacts
      // For now, it demonstrates the structure
      const synastryItems = buildSynastryItems([], partner, {
        personalPointIds: input.personalPointIds
      });

      allItems.push(...synastryItems);
    }
  }

  // Filter by minimum importance if threshold provided
  const filtered = input.options?.minImportance !== undefined
    ? allItems.filter(i => i.importance >= input.options!.minImportance!)
    : allItems;

  // Sort by importance (highest first)
  const sorted = sortByImportance(filtered);

  // Cap synastry items if max provided
  let final = sorted;
  if (input.options?.maxSynastryItems !== undefined) {
    const baseNonSynastry = sorted.filter(i => !i.synastry);
    const synastryLimited = sorted.filter(i => i.synastry).slice(0, input.options.maxSynastryItems);
    final = sortByImportance([...baseNonSynastry, ...synastryLimited]);
  }

  // Calculate statistics
  const stats = {
    baseItems: input.baseItems.length,
    synastryItems: final.filter(i => i.synastry).length,
    totalItems: final.length,
    itemsByCategory: countByCategory(final),
    itemsByPartner: countByPartner(final)
  };

  return { items: final, stats };
}

/**
 * Count items by category
 */
function countByCategory(items: NewsItem[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const key = item.synastry ? `${item.category}:synastry` : item.category;
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

/**
 * Count synastry items by partner
 */
function countByPartner(items: NewsItem[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    if (item.synastry && item.partner) {
      counts[item.partner.id] = (counts[item.partner.id] || 0) + 1;
    }
  }

  return counts;
}

// ============================================================================
// FILTERING AND CAPPING
// ============================================================================

/**
 * Filter feed by depth setting (headlines, standard, deep)
 */
export function filterByDepth(items: NewsItem[], depth: 'headlines' | 'standard' | 'deep' = 'standard'): NewsItem[] {
  if (depth === 'headlines') {
    // Only Tier 1 patterns (non-synastry)
    return items.filter(i => !i.synastry && i.tier === 1 && i.category === 'pattern');
  }

  if (depth === 'standard') {
    // Exclude harmonic items and degree-lore
    return items.filter(i => i.category !== 'harmonic' && i.category !== 'degree-lore');
  }

  // Deep: return all items
  return items;
}

/**
 * Cap number of items by feed type
 */
export function capByFeedType(
  items: NewsItem[],
  feedType: 'today-forecast' | 'important-today' | 'full' = 'today-forecast'
): NewsItem[] {
  switch (feedType) {
    case 'today-forecast':
      // Show top 5 for forecast card
      return items.slice(0, 5);
    case 'important-today':
      // Show top 10 for important today section
      return items.slice(0, 10);
    case 'full':
      // Show all
      return items;
  }
}

// ============================================================================
// PARTNER DATA
// ============================================================================

/**
 * Load partners from saved-people store
 * Respects 12-person cap and consent story
 */
export function loadPartnersFromStore(): PartnerChart[] {
  // This would read from the saved-people store in a real implementation
  // For now, returns empty array (to be integrated with people-library.js)
  return [];
}

/**
 * Validate partner chart has required data
 */
export function validatePartnerChart(partner: PartnerChart): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!partner.id) errors.push('Partner missing id');
  if (!partner.name) errors.push('Partner missing name');
  if (!partner.birthDate) errors.push('Partner missing birthDate');
  if (!partner.planets || Object.keys(partner.planets).length === 0) {
    errors.push('Partner missing computed planets');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// RENDERING HELPERS
// ============================================================================

/**
 * Get display name for a news item
 * For synastry items, includes partner name chip
 */
export function displayName(item: NewsItem): string {
  if (item.synastry && item.partner) {
    return `${item.headline} (${item.partner.name})`;
  }

  return item.headline;
}

/**
 * Get visual distinction marker for synastry items
 * Returns CSS class or glyph for rendering
 */
export function visualMarker(item: NewsItem): { marker: string; type: 'glyph' | 'chip' } {
  if (item.synastry && item.partner) {
    return {
      marker: item.partner.name.substring(0, 1).toUpperCase(),
      type: 'chip'
    };
  }

  return { marker: '', type: 'glyph' };
}

/**
 * Get explainer text for synastry context
 * Part of three-part structure: calculated line, explainer, weather sentence
 */
export function synastryExplainer(item: NewsItem): string | null {
  if (!item.synastry || !item.partner) return null;

  return `A contact between two charts is weather over the pair, never a verdict on it.`;
}
