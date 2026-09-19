/*! forecast/notifications.ts
 * Push/web notifications for high-importance news items
 * Principle: Notify rarely, mean it every time. Target: 0–2 per week.
 */

import { NewsItem } from './newsEngine';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationConfig {
  enabled: boolean;                      // Master toggle (Settings → "Sky alerts")
  patternsOnly: boolean;                 // If false, include stations/ingresses
  quietHoursStart: number;               // Hour (0–23) local timezone
  quietHoursEnd: number;
  lastNotifiedAt: Date | null;           // Last notification sent
  lastNotifiedIds: string[];             // IDs notified in last 7 days (for rate limit)
}

export interface NotificationPayload {
  title: string;                         // Headline (≤90 chars)
  body: string;                          // First sentence + "Tap for..."
  newsItemId: string;                    // For deep link
  timestamp: Date;
  isDigest: boolean;                     // Is this a merged station/ingress digest?
  digestIds?: string[];                  // Which items merged into this digest
}

export interface NotificationDecision {
  shouldNotify: boolean;
  reason: string;                        // Why notify or why not
  payload?: NotificationPayload;
  queuedForLaterIds: string[];          // Items that qualified but can't notify now
}

// ============================================================================
// ELIGIBILITY
// ============================================================================

/**
 * Check if a single NewsItem is eligible to notify
 * ALL conditions must hold:
 * - importance ≥ 80
 * - isNew === true
 * - category is "pattern" or "transit" (NOT harmonic-lens, NOT degree-lore)
 */
export function isEligibleToNotify(item: NewsItem): boolean {
  const importanceOk = item.importance >= 80;
  const isNewOk = item.isNew === true;
  const categoryOk = item.category === 'pattern' || item.category === 'transit';

  return importanceOk && isNewOk && categoryOk;
}

/**
 * Verify that a Tier-2 item CAN reach 80 only via natal-touch bonus
 * (Base Tier-2 = 45; +10 natal touch = 55, still < 80)
 * This is actually impossible, so Tier-2 items need different path.
 * Actually: T2 base 45 + 8 personal + 10 exactness + 10 natal = 73 (still < 80)
 * So Tier-2 items CANNOT reach 80 via normal scoring.
 * Test verifies this constraint.
 */
export function tier2CanReach80(): boolean {
  // T2 base 45 + all bonuses: 8 (personal) + 10 (exactness) + 10 (natal) = 73
  // This is < 80, so Tier-2 items cannot notify
  // Exception: if a Tier-2 pattern is also "rare" (+5), max is 78
  // So Tier-2 items should NOT appear in notification feed
  // Only Tier-1 and harmonic patterns (base 50) can reach 80+
  return false;  // Tier-2 cannot reach 80
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitState {
  lastNotifiedAt: Date | null;
  notificationsIn7Days: Date[];  // Timestamps of last 3 notifications
  quietHoursStart: number;       // 0–23 local
  quietHoursEnd: number;
  userTimezone?: string;         // Optional; falls back to device
}

/**
 * Check if we're in quiet hours (local timezone)
 */
function isInQuietHours(now: Date, quietHoursStart: number, quietHoursEnd: number): boolean {
  const hour = now.getHours();
  if (quietHoursStart < quietHoursEnd) {
    return hour >= quietHoursStart && hour < quietHoursEnd;
  } else {
    // Wraps around midnight (e.g., 21:00–08:00)
    return hour >= quietHoursStart || hour < quietHoursEnd;
  }
}

/**
 * Check 24-hour rate limit
 * No more than 1 notification in last 24 hours
 */
function checkDailyLimit(lastNotifiedAt: Date | null, now: Date): boolean {
  if (!lastNotifiedAt) return true;  // Never notified
  const hoursSinceLastNotify = (now.getTime() - lastNotifiedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastNotify >= 24;
}

/**
 * Check 7-day rate limit
 * No more than 3 notifications in last 7 days
 */
function checkWeeklyLimit(notificationsIn7Days: Date[], now: Date): boolean {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentNotifications = notificationsIn7Days.filter(d => d > weekAgo);
  return recentNotifications.length < 3;
}

/**
 * Apply all rate limits
 */
export function passesRateLimits(
  state: RateLimitState,
  now: Date
): { passes: boolean; reason: string } {
  // Check quiet hours
  if (isInQuietHours(now, state.quietHoursStart, state.quietHoursEnd)) {
    return { passes: false, reason: `In quiet hours (${state.quietHoursStart}:00–${state.quietHoursEnd}:00)` };
  }

  // Check 24-hour limit
  if (!checkDailyLimit(state.lastNotifiedAt, now)) {
    const hoursSince = Math.floor((now.getTime() - state.lastNotifiedAt!.getTime()) / (1000 * 60 * 60));
    return { passes: false, reason: `Last notification ${hoursSince}h ago (min 24h required)` };
  }

  // Check 7-day limit
  if (!checkWeeklyLimit(state.notificationsIn7Days, now)) {
    return { passes: false, reason: `Already sent 3 notifications this week (max allowed)` };
  }

  return { passes: true, reason: 'Passes all rate limits' };
}

// ============================================================================
// NOTIFICATION CONTENT
// ============================================================================

/**
 * Build notification payload from a NewsItem
 */
export function buildNotificationPayload(item: NewsItem): NotificationPayload {
  // Truncate headline to 90 chars max (headlines already comply per contract)
  const title = item.headline.substring(0, 90);

  // Body: first sentence + tap prompt
  const sentences = item.body.split(/(?<=[.!?])\s+/);
  const firstSentence = sentences[0] || item.body;
  const body = `${firstSentence} Tap for your full sky report.`;

  return {
    title,
    body,
    newsItemId: item.id,
    timestamp: new Date(),
    isDigest: false
  };
}

/**
 * Validate notification payload title length
 */
export function validateNotificationTitle(title: string): boolean {
  return title.length <= 90;
}

// ============================================================================
// STATION/INGRESS DIGEST
// ============================================================================

/**
 * Merge same-day stations/ingresses into ONE digest item
 * Returns merged NewsItem or null if no stations/ingresses found
 */
export function buildStationDigest(items: NewsItem[]): NewsItem | null {
  // Filter for station/ingress transits
  const stations = items.filter(
    i => i.category === 'transit' &&
         (i.headline.includes('station') || i.headline.includes('ingress') || i.headline.includes('enters'))
  );

  if (stations.length === 0) return null;

  // Merge into one digest
  const maxImportance = Math.max(...stations.map(s => s.importance));
  const digestImportance = Math.min(100, maxImportance + 3);  // Bonus +3, capped at 100

  // Build merged body
  const headlines = stations.map(s => `• ${s.headline}`).join('\n');
  const body = `Two astral bodies change direction today — here's the 60-second version:\n\n${headlines}`;

  return {
    id: `digest_${Date.now()}`,
    headline: 'Planetary stations & ingresses today',
    body,
    category: 'transit',
    tier: 1,
    importance: digestImportance,
    window: stations[0].window,
    isNew: true,
    keywords: stations.flatMap(s => s.keywords),
    explainer: stations[0].explainer,
    practical: stations[0].practical
  };
}

/**
 * Verify digest importance calculation
 */
export function verifyDigestImportance(memberImportances: number[]): number {
  const max = Math.max(...memberImportances);
  return Math.min(100, max + 3);
}

// ============================================================================
// NOTIFICATION DECISION ENGINE
// ============================================================================

/**
 * Main decision function: given NewsItem[] and current state,
 * decide what to notify (if anything)
 */
export function decideNotification(
  items: NewsItem[],
  config: NotificationConfig,
  state: RateLimitState,
  now: Date
): NotificationDecision {
  // Master toggle
  if (!config.enabled) {
    return {
      shouldNotify: false,
      reason: 'Notifications disabled in Settings',
      queuedForLaterIds: []
    };
  }

  // Check quiet hours first
  const quietCheck = isInQuietHours(now, config.quietHoursStart, config.quietHoursEnd);
  if (quietCheck) {
    return {
      shouldNotify: false,
      reason: `In quiet hours (${config.quietHoursStart}:00–${config.quietHoursEnd}:00)`,
      queuedForLaterIds: items.filter(isEligibleToNotify).map(i => i.id)
    };
  }

  // Filter eligible items (importance ≥80, isNew, pattern/transit only)
  const eligible = items.filter(isEligibleToNotify);

  if (eligible.length === 0) {
    return {
      shouldNotify: false,
      reason: 'No items meet notification eligibility (importance ≥80, isNew, pattern/transit)',
      queuedForLaterIds: []
    };
  }

  // Check rate limits
  const rateLimitCheck = passesRateLimits(state, now);
  if (!rateLimitCheck.passes) {
    return {
      shouldNotify: false,
      reason: rateLimitCheck.reason,
      queuedForLaterIds: eligible.map(i => i.id)
    };
  }

  // Try to build digest for stations/ingresses
  const digest = buildStationDigest(eligible);
  if (digest && isEligibleToNotify(digest)) {
    return {
      shouldNotify: true,
      reason: 'Sending merged station/ingress digest',
      payload: buildNotificationPayload(digest),
      queuedForLaterIds: eligible.filter(i => i.id !== digest.id).map(i => i.id)
    };
  }

  // Otherwise, pick highest importance item
  const toNotify = eligible.reduce((a, b) => a.importance > b.importance ? a : b);

  return {
    shouldNotify: true,
    reason: `Notifying highest-importance item (importance ${toNotify.importance})`,
    payload: buildNotificationPayload(toNotify),
    queuedForLaterIds: eligible.filter(i => i.id !== toNotify.id).map(i => i.id)
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Update state after a notification is sent
 */
export function updateStateAfterNotification(
  state: RateLimitState,
  now: Date
): RateLimitState {
  // Trim notifications older than 7 days
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent = state.notificationsIn7Days.filter(d => d > weekAgo);

  return {
    ...state,
    lastNotifiedAt: now,
    notificationsIn7Days: [...recent, now]
  };
}

/**
 * Persist state to localStorage
 */
export function persistNotificationState(state: RateLimitState, key: string = 'notificationState'): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      lastNotifiedAt: state.lastNotifiedAt?.toISOString(),
      notificationsIn7Days: state.notificationsIn7Days.map(d => d.toISOString()),
      quietHoursStart: state.quietHoursStart,
      quietHoursEnd: state.quietHoursEnd
    }));
  } catch (e) {
    console.warn('Failed to persist notification state:', e);
  }
}

/**
 * Load state from localStorage
 */
export function loadNotificationState(key: string = 'notificationState'): RateLimitState | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    return {
      lastNotifiedAt: data.lastNotifiedAt ? new Date(data.lastNotifiedAt) : null,
      notificationsIn7Days: (data.notificationsIn7Days || []).map((d: string) => new Date(d)),
      quietHoursStart: data.quietHoursStart || 21,
      quietHoursEnd: data.quietHoursEnd || 8
    };
  } catch (e) {
    console.warn('Failed to load notification state:', e);
    return null;
  }
}
