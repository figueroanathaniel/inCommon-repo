/*! forecast/notifications.test.ts
 * Tests for push/web notifications
 * All tests use fake timers for deterministic rate-limit checks
 */

import {
  isEligibleToNotify,
  tier2CanReach80,
  checkDailyLimit,
  checkWeeklyLimit,
  passesRateLimits,
  buildNotificationPayload,
  validateNotificationTitle,
  buildStationDigest,
  decideNotification,
  updateStateAfterNotification,
  NotificationConfig,
  RateLimitState
} from './notifications';

import { NewsItem } from './newsEngine';

// ============================================================================
// HELPERS
// ============================================================================

function mockNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: 'test-item-' + Date.now(),
    headline: 'Test headline',
    body: 'Test body sentence one. Test body sentence two.',
    category: 'pattern',
    tier: 1,
    importance: 80,
    window: { start: new Date(), end: new Date() },
    isNew: true,
    keywords: ['Sun', 'Venus'],
    ...overrides
  };
}

function mockState(overrides: Partial<RateLimitState> = {}): RateLimitState {
  return {
    lastNotifiedAt: null,
    notificationsIn7Days: [],
    quietHoursStart: 21,
    quietHoursEnd: 8,
    ...overrides
  };
}

function mockConfig(overrides: Partial<NotificationConfig> = {}): NotificationConfig {
  return {
    enabled: true,
    patternsOnly: false,
    quietHoursStart: 21,
    quietHoursEnd: 8,
    lastNotifiedAt: null,
    lastNotifiedIds: [],
    ...overrides
  };
}

// ============================================================================
// ELIGIBILITY TESTS
// ============================================================================

describe('Notification Eligibility', () => {
  test('Item with importance 79 is NOT eligible', () => {
    const item = mockNewsItem({ importance: 79 });
    expect(isEligibleToNotify(item)).toBe(false);
  });

  test('Item with importance 80 IS eligible', () => {
    const item = mockNewsItem({ importance: 80 });
    expect(isEligibleToNotify(item)).toBe(true);
  });

  test('Item with importance 85 IS eligible', () => {
    const item = mockNewsItem({ importance: 85 });
    expect(isEligibleToNotify(item)).toBe(true);
  });

  test('Item with isNew=false is NOT eligible', () => {
    const item = mockNewsItem({ importance: 85, isNew: false });
    expect(isEligibleToNotify(item)).toBe(false);
  });

  test('Item with category=harmonic-lens is NOT eligible', () => {
    const item = mockNewsItem({ importance: 85, category: 'harmonic' });
    expect(isEligibleToNotify(item)).toBe(false);
  });

  test('Item with category=degree-lore is NOT eligible', () => {
    const item = mockNewsItem({ importance: 85, category: 'degree-lore' });
    expect(isEligibleToNotify(item)).toBe(false);
  });

  test('Pattern category IS eligible', () => {
    const item = mockNewsItem({ category: 'pattern' });
    expect(isEligibleToNotify(item)).toBe(true);
  });

  test('Transit category IS eligible', () => {
    const item = mockNewsItem({ category: 'transit' });
    expect(isEligibleToNotify(item)).toBe(true);
  });

  test('Tier-2 items cannot reach importance 80', () => {
    expect(tier2CanReach80()).toBe(false);
  });
});

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-14T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Quiet hours: 21:00–08:00 blocks notifications', () => {
    const state = mockState({ quietHoursStart: 21, quietHoursEnd: 8 });

    // 22:00 (in quiet hours)
    jest.setSystemTime(new Date('2026-09-14T22:00:00Z'));
    const check22 = passesRateLimits(state, new Date());
    expect(check22.passes).toBe(false);

    // 12:00 (outside quiet hours)
    jest.setSystemTime(new Date('2026-09-14T12:00:00Z'));
    const check12 = passesRateLimits(state, new Date());
    expect(check12.passes).toBe(true);
  });

  test('24-hour limit: no notification if last was <24h ago', () => {
    const now = new Date('2026-09-14T12:00:00Z');
    const lastNotified = new Date('2026-09-13T13:00:00Z');  // 23h ago

    const state = mockState({ lastNotifiedAt: lastNotified });
    const result = passesRateLimits(state, now);

    expect(result.passes).toBe(false);
    expect(result.reason).toContain('24h');
  });

  test('24-hour limit: notification OK if last was ≥24h ago', () => {
    const now = new Date('2026-09-14T12:00:00Z');
    const lastNotified = new Date('2026-09-13T12:00:00Z');  // Exactly 24h ago

    const state = mockState({ lastNotifiedAt: lastNotified });
    const result = passesRateLimits(state, now);

    expect(result.passes).toBe(true);
  });

  test('7-day limit: max 3 notifications per week', () => {
    const now = new Date('2026-09-14T12:00:00Z');

    const state = mockState({
      notificationsIn7Days: [
        new Date('2026-09-10T10:00:00Z'),
        new Date('2026-09-11T11:00:00Z'),
        new Date('2026-09-12T12:00:00Z')
      ]
    });

    const result = passesRateLimits(state, now);
    expect(result.passes).toBe(false);
    expect(result.reason).toContain('3 notifications');
  });

  test('7-day limit: 2 notifications allows next', () => {
    const now = new Date('2026-09-14T12:00:00Z');
    const state = mockState({
      lastNotifiedAt: new Date('2026-09-13T12:00:00Z'),
      notificationsIn7Days: [
        new Date('2026-09-10T10:00:00Z'),
        new Date('2026-09-11T11:00:00Z')
      ]
    });

    const result = passesRateLimits(state, now);
    expect(result.passes).toBe(true);
  });

  test('Old notifications (>7 days) do not count', () => {
    const now = new Date('2026-09-14T12:00:00Z');
    const state = mockState({
      notificationsIn7Days: [
        new Date('2026-09-06T10:00:00Z'),  // 8 days ago
        new Date('2026-09-10T11:00:00Z'),
        new Date('2026-09-11T12:00:00Z')
      ]
    });

    const result = passesRateLimits(state, now);
    expect(result.passes).toBe(false);  // Still 3 in 7 days (old one doesn't count)
  });
});

// ============================================================================
// NOTIFICATION CONTENT TESTS
// ============================================================================

describe('Notification Content', () => {
  test('Payload title is headline, truncated to 90 chars', () => {
    const item = mockNewsItem({
      headline: 'A'.repeat(100)  // 100 chars
    });

    const payload = buildNotificationPayload(item);
    expect(payload.title.length).toBeLessThanOrEqual(90);
    expect(payload.title).toBe('A'.repeat(90));
  });

  test('Payload body is first sentence + tap prompt', () => {
    const item = mockNewsItem({
      body: 'First sentence. Second sentence. Third sentence.'
    });

    const payload = buildNotificationPayload(item);
    expect(payload.body).toContain('First sentence');
    expect(payload.body).toContain('Tap for your full sky report');
    expect(payload.body).not.toContain('Second sentence');
  });

  test('Validate title length', () => {
    expect(validateNotificationTitle('A'.repeat(90))).toBe(true);
    expect(validateNotificationTitle('A'.repeat(91))).toBe(false);
  });

  test('Deep link includes newsItemId', () => {
    const item = mockNewsItem({ id: 'unique-item-id' });
    const payload = buildNotificationPayload(item);
    expect(payload.newsItemId).toBe('unique-item-id');
  });
});

// ============================================================================
// STATION/INGRESS DIGEST TESTS
// ============================================================================

describe('Station/Ingress Digest', () => {
  test('Digest merges same-day stations into one item', () => {
    const items = [
      mockNewsItem({
        id: 'station1',
        headline: 'Mercury station retrograde',
        category: 'transit',
        importance: 60
      }),
      mockNewsItem({
        id: 'station2',
        headline: 'Jupiter enters Scorpio',
        category: 'transit',
        importance: 55
      })
    ];

    const digest = buildStationDigest(items);
    expect(digest).not.toBeNull();
    expect(digest!.headline).toContain('Planetary stations');
    expect(digest!.importance).toBe(Math.min(100, 60 + 3));  // max + 3
  });

  test('Digest body contains all member headlines', () => {
    const items = [
      mockNewsItem({ headline: 'Mercury stations retrograde' }),
      mockNewsItem({ headline: 'Jupiter enters Scorpio' })
    ];

    const digest = buildStationDigest(items);
    expect(digest!.body).toContain('Mercury stations retrograde');
    expect(digest!.body).toContain('Jupiter enters Scorpio');
  });

  test('No digest if no stations/ingresses', () => {
    const items = [
      mockNewsItem({ headline: 'Grand Trine detected', category: 'pattern' })
    ];

    const digest = buildStationDigest(items);
    expect(digest).toBeNull();
  });

  test('Digest importance capped at 100', () => {
    const items = [
      mockNewsItem({ importance: 99, headline: 'Station retrograde' })
    ];

    const digest = buildStationDigest(items);
    expect(digest!.importance).toBe(100);  // 99 + 3 = 102, capped at 100
  });
});

// ============================================================================
// DECISION ENGINE TESTS
// ============================================================================

describe('Notification Decision Engine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-14T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('No items eligible → shouldNotify=false', () => {
    const items = [
      mockNewsItem({ importance: 75 }),  // Too low
      mockNewsItem({ isNew: false })     // Not new
    ];
    const config = mockConfig({ enabled: true });
    const state = mockState();

    const decision = decideNotification(items, config, state, new Date());
    expect(decision.shouldNotify).toBe(false);
    expect(decision.reason).toContain('eligibility');
  });

  test('Notifications disabled → shouldNotify=false', () => {
    const items = [mockNewsItem({ importance: 85 })];
    const config = mockConfig({ enabled: false });
    const state = mockState();

    const decision = decideNotification(items, config, state, new Date());
    expect(decision.shouldNotify).toBe(false);
    expect(decision.reason).toContain('disabled');
  });

  test('In quiet hours → shouldNotify=false, items queued', () => {
    const items = [mockNewsItem({ importance: 85 })];
    const config = mockConfig();
    const state = mockState();

    jest.setSystemTime(new Date('2026-09-14T22:00:00Z'));  // 22:00 (quiet)
    const decision = decideNotification(items, config, state, new Date());

    expect(decision.shouldNotify).toBe(false);
    expect(decision.queuedForLaterIds).toContain(items[0].id);
  });

  test('Rate limit exceeded → shouldNotify=false, items queued', () => {
    const items = [mockNewsItem({ importance: 85 })];
    const config = mockConfig();
    const state = mockState({
      notificationsIn7Days: [
        new Date('2026-09-10T10:00:00Z'),
        new Date('2026-09-11T11:00:00Z'),
        new Date('2026-09-12T12:00:00Z')
      ]
    });

    const decision = decideNotification(items, config, state, new Date());
    expect(decision.shouldNotify).toBe(false);
    expect(decision.queuedForLaterIds.length).toBeGreaterThan(0);
  });

  test('Single eligible item → notifies with correct payload', () => {
    const items = [mockNewsItem({ importance: 85, headline: 'Test headline' })];
    const config = mockConfig();
    const state = mockState();

    const decision = decideNotification(items, config, state, new Date());
    expect(decision.shouldNotify).toBe(true);
    expect(decision.payload).toBeDefined();
    expect(decision.payload!.title).toContain('Test headline');
  });

  test('Multiple eligible items → notifies highest importance', () => {
    const items = [
      mockNewsItem({ importance: 80 }),
      mockNewsItem({ importance: 95 }),
      mockNewsItem({ importance: 82 })
    ];
    const config = mockConfig();
    const state = mockState();

    const decision = decideNotification(items, config, state, new Date());
    expect(decision.shouldNotify).toBe(true);
    expect(decision.payload!.newsItemId).toBe(items[1].id);  // 95 importance
  });

  test('Digest created if stations/ingresses present', () => {
    const items = [
      mockNewsItem({
        importance: 85,
        headline: 'Mercury station retrograde',
        category: 'transit'
      }),
      mockNewsItem({
        importance: 80,
        headline: 'Grand Trine detected',
        category: 'pattern'
      })
    ];
    const config = mockConfig();
    const state = mockState();

    const decision = decideNotification(items, config, state, new Date());
    expect(decision.shouldNotify).toBe(true);
    expect(decision.payload!.headline).toContain('Planetary stations');
  });
});

// ============================================================================
// STATE MANAGEMENT TESTS
// ============================================================================

describe('State Management', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-14T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Update state after notification', () => {
    const state = mockState({
      notificationsIn7Days: [new Date('2026-09-10T10:00:00Z')]
    });
    const now = new Date('2026-09-14T12:00:00Z');

    const updated = updateStateAfterNotification(state, now);
    expect(updated.lastNotifiedAt).toBe(now);
    expect(updated.notificationsIn7Days.length).toBe(2);
  });

  test('Old notifications trimmed on update', () => {
    const now = new Date('2026-09-14T12:00:00Z');
    const state = mockState({
      notificationsIn7Days: [
        new Date('2026-09-06T10:00:00Z'),  // >7 days old
        new Date('2026-09-10T11:00:00Z')
      ]
    });

    const updated = updateStateAfterNotification(state, now);
    expect(updated.notificationsIn7Days.length).toBe(2);
    expect(updated.notificationsIn7Days[0]).toEqual(new Date('2026-09-10T11:00:00Z'));
  });
});

// ============================================================================
// INTEGRATION: SIMULATED WEEK
// ============================================================================

describe('Simulated Week (2026-09-14 → 2026-09-20)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Rate limits prevent >3 notifications in 7 days', () => {
    const config = mockConfig();
    let state = mockState();
    const notifications: Array<{ date: Date; itemId: string }> = [];

    // Day 1 (Sept 14, 12:00): Notify
    jest.setSystemTime(new Date('2026-09-14T12:00:00Z'));
    const items1 = [mockNewsItem({ importance: 85, id: 'item1' })];
    const decision1 = decideNotification(items1, config, state, new Date());
    if (decision1.shouldNotify) {
      notifications.push({ date: new Date(), itemId: 'item1' });
      state = updateStateAfterNotification(state, new Date());
    }

    // Day 2 (Sept 15, 12:00): Can't notify (24h rule)
    jest.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    const items2 = [mockNewsItem({ importance: 90, id: 'item2' })];
    const decision2 = decideNotification(items2, config, state, new Date());
    expect(decision2.shouldNotify).toBe(false);

    // Day 3 (Sept 16, 12:00): Can notify
    jest.setSystemTime(new Date('2026-09-16T12:00:00Z'));
    const items3 = [mockNewsItem({ importance: 88, id: 'item3' })];
    const decision3 = decideNotification(items3, config, state, new Date());
    if (decision3.shouldNotify) {
      notifications.push({ date: new Date(), itemId: 'item3' });
      state = updateStateAfterNotification(state, new Date());
    }

    // Day 5 (Sept 18, 12:00): Can notify
    jest.setSystemTime(new Date('2026-09-18T12:00:00Z'));
    const items5 = [mockNewsItem({ importance: 92, id: 'item5' })];
    const decision5 = decideNotification(items5, config, state, new Date());
    if (decision5.shouldNotify) {
      notifications.push({ date: new Date(), itemId: 'item5' });
      state = updateStateAfterNotification(state, new Date());
    }

    // Day 7 (Sept 20, 12:00): Can't notify (3 already sent)
    jest.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    const items7 = [mockNewsItem({ importance: 95, id: 'item7' })];
    const decision7 = decideNotification(items7, config, state, new Date());
    expect(decision7.shouldNotify).toBe(false);

    expect(notifications.length).toBe(3);  // Exactly 3 notifications sent
  });
});
