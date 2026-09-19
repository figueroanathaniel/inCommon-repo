/*! forecast/news/multiChart.ts
 * Build synastry news items from partner charts
 * A synastry item IS a transit item with category='transit', synastry=true, partner={id,name}
 * Importance ceiling: 68 (hard-capped so never triggers push notifications)
 */

import {
  NewsItem,
  TIER_1_BASE,
  BONUS_EXACTNESS,
  BONUS_PERSONAL,
  BONUS_NATAL_TOUCH,
  BONUS_RARE,
  BONUS_COUPLE_LINK,
  calculateImportance,
  generateNewsId
} from '../newsEngine';
import { synastryTemplatesFor, pickSynastryTemplate, fillSynastryTemplate } from './synastryTemplates';

// ============================================================================
// TYPES
// ============================================================================

export interface PartnerChart {
  id: string;
  name: string;
  birthDate: Date;
  birthTime?: string;
  birthPlace?: string;
  bodies: Record<string, number>;  // astral body name => longitude
  points: Record<string, number>;   // ASC, MC, etc.
}

export interface SynastryContact {
  movingBody: string;        // Your astral body
  aspect: string;              // conjunction, sextile, square, trine, opposite
  partnerBody: string;       // Their astral body
  orb: number;                 // Degrees of separation
  isExact: boolean;            // orb < 0.5
  yourLongitude: number;
  theirLongitude: number;
  partnerLng?: number;         // Optional: longitude for couple-link check
  isCoupleLink?: boolean;      // true if moving body also contacts your point
}

export interface SynastryItemInput {
  contact: SynastryContact;
  partner: { id: string; name: string };
  isPersonalTouch: boolean;    // Your astral body or point touched
  hasNatalTouch?: boolean;     // Touches their natal point
  isRare?: boolean;
  date: Date;
}

// ============================================================================
// CORE BUILDER
// ============================================================================

/**
 * Build a synastry news item from a contact
 */
export function buildSynastryItem(input: SynastryItemInput): NewsItem {
  const { contact, partner, isPersonalTouch, hasNatalTouch, isRare, date } = input;

  // Determine tier (synastry items are transits with synastry flag)
  const tier: 1 | 2 | 3 = 1;  // Synastry items are typically Tier 1
  const base = TIER_1_BASE;

  // Calculate importance with bonuses
  const importance = calculateImportance(
    base,
    {
      exactness: contact.isExact,
      personalTouch: isPersonalTouch,
      natalTouch: hasNatalTouch,
      rare: isRare,
      coupleLink: contact.isCoupleLink
    },
    true  // isSynastry flag caps at 68
  );

  // Generate headline from template
  const templates = synastryTemplatesFor(contact.aspect);
  const template = pickSynastryTemplate(templates);
  const headline = fillSynastryTemplate(
    template,
    contact.movingBody,
    contact.partnerBody,
    partner.name,
    contact.aspect
  );

  // Build body (explainer follows three-part shape)
  const body = buildSynastryBody(contact, partner.name);

  // Generate stable ID
  const id = generateNewsId(
    `synastry-${contact.aspect}`,
    [contact.movingBody, contact.partnerBody],
    date
  );

  // Keywords for personalization
  const keywords = [
    contact.movingBody.toLowerCase(),
    contact.partnerBody.toLowerCase(),
    contact.aspect,
    'synastry',
    partner.id
  ];

  return {
    id,
    headline,
    body,
    category: 'transit',  // Synastry items ARE transit items
    tier,
    type: contact.aspect,
    importance,
    isNew: true,
    keywords,
    synastry: true,
    partner: {
      id: partner.id,
      name: partner.name
    },
    bodies: [contact.movingBody, contact.partnerBody]
  };
}

/**
 * Build synastry item body (three-part structure)
 * Part 1: Calculated line (always visible)
 * Part 2: Explainer (behind tap to expand)
 * Part 3: Sentence about weather, not verdict
 */
function buildSynastryBody(contact: SynastryContact, partnerName: string): string {
  const { movingBody, partnerBody, aspect, orb } = contact;

  const calculatedLine = `${movingBody} is ${aspect.toLowerCase()} their ${partnerBody} within ${orb.toFixed(2)}°.`;

  const explainer = getAspectExplainer(aspect);

  const weatherLine = 'A contact between two charts is weather over the pair, never a verdict on it.';

  return `${calculatedLine}\n\n${explainer}\n\n${weatherLine}`;
}

/**
 * Get explainer text for an aspect (why this matters)
 * Phrased as "what this offers between you"
 */
function getAspectExplainer(aspect: string): string {
  const explainers: Record<string, string> = {
    conjunction: 'A conjunction is when two astral bodies occupy the same degree. Between you, it means your energies are merged, speaking as one. Whatever these astral bodies represent are amplified when together, for better and for worse.',
    sextile: 'A sextile (60°) is one of astrology\'s easy aspects. Between you two, it\'s an opening. Conversation flows. This is an area where mutual support comes naturally.',
    square: 'A square (90°) is tension in geometric form. Between you, these astral bodies want different things, creating productive friction. It\'s the friction that keeps things interesting and sharp.',
    trine: 'A trine (120°) is harmony. Between you, it\'s where things flow. This is where the two of you understand each other without asking. A rare gift that deepens with use.',
    opposite: 'An opposition (180°) is two astral bodies facing each other. Between you, it\'s mutual reflection. One wants to lead, the other to balance. Integration is the goal, not dominance.'
  };

  return explainers[aspect] || 'A contact between your charts.';
}

// ============================================================================
// BATCH BUILDER
// ============================================================================

/**
 * Build synastry items from a list of contacts
 * Returns NewsItems sorted by importance
 */
export function buildSynastryItems(
  contacts: SynastryContact[],
  partner: PartnerChart,
  options?: {
    filterByImportance?: number;  // Min importance to include
    personalPointIds?: string[];  // Which of YOUR points count as "personal"
  }
): NewsItem[] {
  const items: NewsItem[] = [];

  for (const contact of contacts) {
    // Skip if below importance threshold
    const isPersonal = options?.personalPointIds?.includes(contact.movingBody) ?? false;

    // Build the item
    const item = buildSynastryItem({
      contact,
      partner: { id: partner.id, name: partner.name },
      isPersonalTouch: isPersonal,
      hasNatalTouch: false,  // Would be determined by actual chart data
      isRare: false,         // Would be determined by pattern analysis
      date: new Date()
    });

    // Filter by importance if threshold provided
    if (options?.filterByImportance !== undefined) {
      if (item.importance >= options.filterByImportance) {
        items.push(item);
      }
    } else {
      items.push(item);
    }
  }

  // Sort by importance (highest first)
  return items.sort((a, b) => b.importance - a.importance);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that a synastry item respects the importance ceiling
 * Used in tests to ensure ceiling is enforced
 */
export function validateSynastryCeiling(item: NewsItem): boolean {
  if (!item.synastry) return true;  // Non-synastry items not capped
  return item.importance <= 68;
}

/**
 * Validate share text contains no sensitive data
 * Used in gate: ensure no longitudes, orbs, or birth data leak into share text
 */
export function validateShareText(shareText: string, contact: SynastryContact): boolean {
  const hasLongitude = /\d+\.\d+[°]?/g.test(shareText);
  const hasOrb = shareText.includes(contact.orb.toFixed(2));
  const hasBirthData = /\d{4}/.test(shareText) && shareText.match(/\d{4}/)?.[0] !== new Date().getFullYear().toString();

  return !hasLongitude && !hasOrb && !hasBirthData;
}

/**
 * Verify couple-link bonus is awarded correctly
 * Test: moving body contacts reader point within 1° => +10 bonus
 */
export function verifyCoupleLink(
  movingLng: number,
  readerPointLng: number,
  threshold: number = 1.0
): boolean {
  const diff = Math.abs(movingLng - readerPointLng);
  return diff <= threshold || Math.abs(diff - 360) <= threshold;
}
