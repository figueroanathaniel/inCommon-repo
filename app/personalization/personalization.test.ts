/*! personalization/personalization.test.ts
 * Personalization: weight math, demotion, unknownTime, skip path, transparency
 */

import {
  loadProfile,
  saveProfile,
  setSelectedInterests,
  skipOnboarding,
  clearProfile,
  getWeight,
  getDepthFactor,
  DEFAULT_PROFILE
} from './profile';
import {
  personalizeItem,
  personalizeAndRank,
  filterByDepth,
  capByDepth
} from './newsPersonalizer';
import { NewsItem } from '../forecast/newsEngine';

describe('Personalization: profile management', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('loadProfile returns default when none stored', () => {
    const profile = loadProfile();
    expect(profile.depth).toBe('standard');
    expect(profile.weights.venus).toBe(1.0);
  });

  test('setSelectedInterests: selected 1.3, not selected 0.7', () => {
    setSelectedInterests(['venus', 'mars']);

    const profile = loadProfile();
    expect(profile.weights.venus).toBe(1.3);
    expect(profile.weights.mars).toBe(1.3);
    expect(profile.weights.mercury).toBe(0.7);
    expect(profile.weights.sun).toBe(0.7);
  });

  test('skipOnboarding: marks completed but keeps defaults', () => {
    skipOnboarding();

    const profile = loadProfile();
    expect(profile.completedAt).not.toBeNull();
    expect(profile.depth).toBe('standard');
    expect(profile.weights.venus).toBe(1.0);
  });
});

describe('Personalization: weight math', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('Same item, Venus selected vs not: correct delta', () => {
    const item: NewsItem = {
      id: 'venus-item',
      headline: 'Venus trine natal Venus',
      body: 'Body',
      category: 'transit',
      tier: 1,
      importance: 70,
      window: {},
      isNew: true,
      keywords: ['venus', 'natal-touch'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    // Scenario 1: Venus NOT selected
    setSelectedInterests(['mercury', 'mars']);
    const personalized1 = personalizeItem(item);

    // Scenario 2: Venus selected
    setSelectedInterests(['venus', 'mars']);
    const personalized2 = personalizeItem(item);

    // Venus selected should have higher personalized importance
    expect(personalized2.personalizedImportance).toBeGreaterThan(
      personalized1.personalizedImportance
    );

    // Neither should exceed 100
    expect(personalized1.personalizedImportance).toBeLessThanOrEqual(100);
    expect(personalized2.personalizedImportance).toBeLessThanOrEqual(100);
  });

  test('Weight cap: personalized importance never exceeds 100', () => {
    setSelectedInterests(['venus', 'mars', 'jupiter']);

    const item: NewsItem = {
      id: 'high-item',
      headline: 'Venus Mars Jupiter conjunction natal Venus Mars',
      body: 'Body',
      category: 'pattern',
      tier: 1,
      importance: 95,
      window: {},
      isNew: true,
      keywords: ['venus', 'mars', 'jupiter', 'natal-touch'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    const personalized = personalizeItem(item);
    expect(personalized.personalizedImportance).toBeLessThanOrEqual(100);
  });

  test('Tier never changes from personalization', () => {
    setSelectedInterests(['venus']);

    const tier1Item: NewsItem = {
      id: 'tier1',
      headline: 'Tier 1 pattern',
      body: 'Body',
      category: 'pattern',
      tier: 1,
      importance: 50,
      window: {},
      isNew: true,
      keywords: ['venus'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    const personalized = personalizeItem(tier1Item);
    expect(personalized.tier).toBe(1);
  });
});

describe('Personalization: demotion', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('Deselected items ranked below equal-importance standard items', () => {
    setSelectedInterests(['venus', 'mars']);

    const venusFocused: NewsItem = {
      id: 'venus-item',
      headline: 'Venus aspect',
      body: 'Body',
      category: 'transit',
      tier: 1,
      importance: 70,
      window: {},
      isNew: true,
      keywords: ['venus'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    const saturnOnly: NewsItem = {
      id: 'saturn-item',
      headline: 'Saturn aspect',
      body: 'Body',
      category: 'transit',
      tier: 1,
      importance: 70,
      window: {},
      isNew: true,
      keywords: ['saturn'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    const ranked = personalizeAndRank([saturnOnly, venusFocused]);

    // Venus-focused should come first (selected topic)
    expect(ranked[0].id).toBe('venus-item');
    expect(ranked[1].id).toBe('saturn-item');
  });

  test('Coverage: deselected items present but demoted', () => {
    setSelectedInterests(['venus']);

    const items = [
      {
        id: 'saturn1',
        headline: 'Saturn only',
        body: 'Body',
        category: 'transit',
        tier: 1,
        importance: 75,
        window: {},
        isNew: true,
        keywords: ['saturn'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'venus1',
        headline: 'Venus only',
        body: 'Body',
        category: 'transit',
        tier: 1,
        importance: 60,
        window: {},
        isNew: true,
        keywords: ['venus'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    const ranked = personalizeAndRank(items);

    // Both items present
    expect(ranked.length).toBe(2);

    // Venus-focused beats Saturn despite lower base importance
    expect(ranked[0].id).toBe('venus1');
    expect(ranked[1].id).toBe('saturn1');
  });
});

describe('Personalization: unknownTime handling', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('shouldSuppressHouses reflects unknownTime setting', () => {
    let profile = loadProfile();
    expect(profile.unknownTime).toBe(false);

    profile.unknownTime = true;
    saveProfile(profile);

    profile = loadProfile();
    expect(profile.unknownTime).toBe(true);
  });
});

describe('Personalization: depth filtering', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('Headlines depth: only Tier 1 patterns', () => {
    let profile = loadProfile();
    profile.depth = 'headlines';
    saveProfile(profile);

    const items: NewsItem[] = [
      {
        id: 'tier1-pattern',
        headline: 'T1 pattern',
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 80,
        window: {},
        isNew: true,
        keywords: ['pattern'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'tier2-pattern',
        headline: 'T2 pattern',
        body: 'Body',
        category: 'pattern',
        tier: 2,
        importance: 60,
        window: {},
        isNew: true,
        keywords: ['pattern'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'transit',
        headline: 'Transit',
        body: 'Body',
        category: 'transit',
        tier: 1,
        importance: 70,
        window: {},
        isNew: true,
        keywords: ['transit'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    const filtered = filterByDepth(items);

    // Only the Tier 1 pattern
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('tier1-pattern');
  });

  test('Standard depth: excludes harmonic-lens', () => {
    let profile = loadProfile();
    profile.depth = 'standard';
    saveProfile(profile);

    const items: NewsItem[] = [
      {
        id: 'transit',
        headline: 'Transit',
        body: 'Body',
        category: 'transit',
        tier: 1,
        importance: 70,
        window: {},
        isNew: true,
        keywords: ['transit'],
        explainer: 'Explainer',
        practical: 'Practical'
      },
      {
        id: 'harmonic',
        headline: 'Harmonic lens',
        body: 'Body',
        category: 'harmonic',
        tier: 2,
        importance: 55,
        window: {},
        isNew: true,
        keywords: ['harmonic'],
        explainer: 'Explainer',
        practical: 'Practical'
      }
    ];

    const filtered = filterByDepth(items);

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('transit');
  });

  test('Depth capping: headlines returns max 5', () => {
    let profile = loadProfile();
    profile.depth = 'headlines';
    saveProfile(profile);

    const items: NewsItem[] = [];
    for (let i = 0; i < 10; i++) {
      items.push({
        id: `item${i}`,
        headline: `Item ${i}`,
        body: 'Body',
        category: 'pattern',
        tier: 1,
        importance: 80 - i,
        window: {},
        isNew: true,
        keywords: ['pattern'],
        explainer: 'Explainer',
        practical: 'Practical'
      });
    }

    const capped = capByDepth(items);
    expect(capped.length).toBe(5);
  });
});

describe('Personalization: skip path regression', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('Skip onboarding: engine output identical to default (no weights)', () => {
    const item: NewsItem = {
      id: 'test-item',
      headline: 'Test item',
      body: 'Body',
      category: 'transit',
      tier: 1,
      importance: 70,
      window: {},
      isNew: true,
      keywords: ['venus'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    // Default: no personalization
    clearProfile();
    const default1 = personalizeItem(item);

    // After skip
    skipOnboarding();
    const default2 = personalizeItem(item);

    // Same personalized importance
    expect(default1.personalizedImportance).toBe(default2.personalizedImportance);
  });
});

describe('Personalization: transparency tags', () => {
  beforeEach(() => {
    clearProfile();
  });

  test('Boosted item carries personalization tag', () => {
    setSelectedInterests(['venus']);

    const item: NewsItem = {
      id: 'venus-item',
      headline: 'Venus trine natal Venus',
      body: 'Body',
      category: 'transit',
      tier: 1,
      importance: 70,
      window: {},
      isNew: true,
      keywords: ['venus', 'natal-touch'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    const personalized = personalizeItem(item);

    expect(personalized.personalizationTag).toBeDefined();
    expect(personalized.personalizationTag).toContain('Shown higher');
  });

  test('Deselected item carries demotion tag', () => {
    setSelectedInterests(['venus']);

    const item: NewsItem = {
      id: 'saturn-item',
      headline: 'Saturn aspect',
      body: 'Body',
      category: 'transit',
      tier: 1,
      importance: 70,
      window: {},
      isNew: true,
      keywords: ['saturn'],
      explainer: 'Explainer',
      practical: 'Practical'
    };

    const personalized = personalizeItem(item);

    expect(personalized.personalizationTag).toBeDefined();
    expect(personalized.personalizationTag).toContain('Shown lower');
  });
});
