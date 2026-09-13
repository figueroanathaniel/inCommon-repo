/*! personalization/newsPersonalizer.ts
 * Apply personalization weights and depth to news items
 * Never changes facts; only re-ranks via weighting
 */

import { NewsItem } from '../forecast/newsEngine';
import {
  PersonalizationProfile,
  loadProfile,
  getDepthFactor,
  TOPIC_PLANETS
} from './profile';

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalizedItem extends NewsItem {
  baseImportance: number;              // Original importance before weighting
  personalizedImportance: number;      // After weight/depth applied
  personalizationReason?: string;      // Why rank changed
  personalizationTag?: string;         // User-facing tag ("Shown higher...")
}

// ============================================================================
// PERSONALIZATION ENGINE
// ============================================================================

/**
 * Apply natal-touch weight multiplier
 * If natal touch occurred and touched point has a user weight, multiply bonus
 */
function applyNatalTouchWeight(
  item: NewsItem,
  profile: PersonalizationProfile
): number {
  let bonus = 0;

  // Check if item has natal-touch info in keywords
  if (item.keywords && item.keywords.includes('natal-touch')) {
    // Extract touched point from headline or use fallback
    // For this implementation, we look at all mentioned planets and apply avg weight
    const mentionedPlanets = Object.keys(profile.weights).filter(p =>
      item.headline.toLowerCase().includes(p.toLowerCase())
    );

    if (mentionedPlanets.length > 0) {
      const avgWeight = mentionedPlanets.reduce(
        (sum, p) => sum + profile.weights[p],
        0
      ) / mentionedPlanets.length;

      // Base natal-touch bonus is 10 (from scoring); multiply by weight
      bonus = 10 * (avgWeight - 1.0); // Delta from 1.0
    }
  }

  return bonus;
}

/**
 * Apply topic keyword matching bonus
 */
function applyTopicBonus(item: NewsItem, profile: PersonalizationProfile): number {
  let bonus = 0;
  const depthFactor = getDepthFactor();

  // Check if any keywords intersect user's selected topics
  if (item.keywords) {
    for (const keyword of item.keywords) {
      const keywordLower = keyword.toLowerCase();

      // Check if keyword is a topic
      if (TOPIC_PLANETS[keywordLower]) {
        const topicWeight = profile.weights[keywordLower] ?? 1.0;

        // Only boost if selected (weight > 1.0)
        if (topicWeight > 1.0) {
          // +5 × depth factor (0 for headlines, 1 for standard, 1.2 for deep)
          bonus += 5 * depthFactor * (topicWeight - 1.0);
        }
      }

      // Check if keyword is a planet
      if (profile.weights[keywordLower] !== undefined) {
        const weight = profile.weights[keywordLower];
        if (weight > 1.0) {
          bonus += 3 * (weight - 1.0);
        }
      }
    }
  }

  return bonus;
}

/**
 * Determine if item is deselected (all keyword planets have weight ≤0.7)
 */
function isDeselected(item: NewsItem, profile: PersonalizationProfile): boolean {
  if (!item.keywords || item.keywords.length === 0) return false;

  const allDeselected = item.keywords.every(keyword => {
    const weight = profile.weights[keyword.toLowerCase()] ?? 1.0;
    return weight <= 0.7;
  });

  return allDeselected;
}

/**
 * Calculate personalized importance for an item
 */
export function personalizeItem(
  item: NewsItem,
  profile?: PersonalizationProfile
): PersonalizedItem {
  const prof = profile || loadProfile();

  const baseImportance = item.importance;
  let personalizedImportance = baseImportance;
  let personalizationReason = '';
  let personalizationTag = '';

  // Only apply if onboarding was completed
  const hasCustomProfile = Object.values(prof.weights).some(w => w !== 1.0);

  if (hasCustomProfile) {
    // Calculate bonuses
    const natalTouchBonus = applyNatalTouchWeight(item, prof);
    const topicBonus = applyTopicBonus(item, prof);

    // Total added importance (cap at 20 points total adjustment to avoid 100 ceiling)
    const totalBonus = Math.min(20, natalTouchBonus + topicBonus);

    personalizedImportance = Math.min(100, baseImportance + totalBonus);

    if (totalBonus > 0) {
      personalizationReason = `Boosted by ${totalBonus.toFixed(0)} points`;
      personalizationTag = 'Shown higher because you follow ';

      // Add topic names
      const boostedTopics = Object.keys(prof.weights).filter(
        t => prof.weights[t] > 1.0 && item.keywords?.some(k => k.toLowerCase() === t)
      );

      if (boostedTopics.length > 0) {
        personalizationTag += boostedTopics.slice(0, 2).join(', ');
      }
    }
  }

  // Check for demotion
  const deselected = hasCustomProfile && isDeselected(item, prof);
  if (deselected) {
    // Don't change importance, but mark for demotion in ranking
    personalizationReason = 'Deselected topics only';
    personalizationTag = 'Shown lower — outside your watch list';
  }

  return {
    ...item,
    baseImportance,
    personalizedImportance,
    personalizationReason: personalizationReason || undefined,
    personalizationTag: personalizationTag || undefined
  };
}

/**
 * Apply personalization to a batch of items
 * Returns sorted by personalizedImportance, with deselected items ranked below equal-importance items
 */
export function personalizeAndRank(
  items: NewsItem[],
  profile?: PersonalizationProfile
): PersonalizedItem[] {
  const prof = profile || loadProfile();

  // Personalize all items
  const personalized = items.map(item => personalizeItem(item, prof));

  // Sort by personalized importance, then by tier (lower tier first)
  // Deselected items naturally sort below by their lower personalized importance
  return personalized.sort((a, b) => {
    // Higher importance first
    if (b.personalizedImportance !== a.personalizedImportance) {
      return b.personalizedImportance - a.personalizedImportance;
    }

    // Same importance: Tier 1 before Tier 2/3
    if (a.tier !== b.tier) {
      return a.tier - b.tier;
    }

    // Same tier: maintain stable order (original position)
    return 0;
  });
}

/**
 * Filter items by depth setting
 */
export function filterByDepth(items: NewsItem[], profile?: PersonalizationProfile): NewsItem[] {
  const prof = profile || loadProfile();

  if (prof.depth === 'headlines') {
    // Return only Tier 1 patterns
    return items.filter(i => i.tier === 1 && i.category === 'pattern');
  }

  if (prof.depth === 'standard') {
    // Exclude harmonic-lens items from main feed (still available in expanded)
    return items.filter(i => i.category !== 'harmonic');
  }

  // Deep sky: return all items
  return items;
}

/**
 * Cap number of items based on depth
 */
export function capByDepth(items: NewsItem[], profile?: PersonalizationProfile): NewsItem[] {
  const prof = profile || loadProfile();

  if (prof.depth === 'headlines') {
    return items.slice(0, 5);
  }

  if (prof.depth === 'standard') {
    return items.slice(0, 15);
  }

  return items;
}
