/*! forecast/content/shareRecap.ts
 * Share-ready text recaps of weekly sky
 * Tone: warm newsletter, never pushy. Max 600 chars.
 */

import { WeekStats } from '../archive';
import { NewsItem } from '../newsEngine';

/**
 * Build share text for a week
 * Format: "My week in the sky: [headline]. [stats]. [rare]. –[date]"
 */
export function buildShareText(
  headlineItem: NewsItem | undefined,
  stats: WeekStats,
  weekOf: string
): string {
  if (!headlineItem) {
    return `My week in the sky (${weekOf}): quiet week in the stars. ${stats.totalItems} items to browse. –inCommon`;
  }

  // Headline
  const headline = `My week in the sky: ${headlineItem.headline.substring(0, 50)}…`;

  // Stats summary
  const statsPart = `${stats.busiestDay.date.split('-').slice(1).join('/')}: the sky was busy (${stats.busiestDay.items.length} events).`;

  // Rare events mention
  let rarePart = '';
  if (stats.rareEvents.length > 0) {
    rarePart = ` ${stats.rareEvents.length} rare moment${stats.rareEvents.length > 1 ? 's' : ''} worth noting.`;
  }

  // Closing
  const closing = `–${weekOf} | inCommon`;

  const full = `${headline} ${statsPart}${rarePart} ${closing}`;

  // Enforce 600 char cap
  if (full.length > 600) {
    return full.substring(0, 597) + '…';
  }

  return full;
}

/**
 * Template library for different week types
 */
export const SHARE_TEMPLATES = {
  busy_week: (busyDay: string, count: number, headline: string) =>
    `My week in the sky: ${headline}. ${busyDay} was extraordinary (${count} events). –inCommon`,

  rare_week: (rareCount: number, theme: string) =>
    `My week in the sky: ${rareCount} rare moments. The theme? ${theme}. Worth the read. –inCommon`,

  quiet_week: (quietDay: string) =>
    `My week in the sky: contemplative. ${quietDay} offered profound stillness. –inCommon`,

  balanced_week: (stats: string) =>
    `My week in the sky: balance in motion. ${stats}. –inCommon`
};

/**
 * Lint share text: no forbidden words, no trailing junk
 */
export function lintShareText(text: string): { valid: boolean; violations: string[] } {
  const forbidden = ['will happen', 'destined to', 'warning', 'danger', 'curse', 'guaranteed'];
  const violations: string[] = [];

  forbidden.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      violations.push(`Contains forbidden word: "${word}"`);
    }
  });

  if (text.length > 600) {
    violations.push(`Length ${text.length} exceeds 600 chars`);
  }

  if (!text.endsWith('–inCommon') && !text.includes('inCommon')) {
    violations.push('Missing inCommon attribution');
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
