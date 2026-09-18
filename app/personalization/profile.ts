/*! personalization/profile.ts
 * User personalization profile: weights, depth, onboarding state
 * Stored in localStorage; editable in Settings
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PersonalizationProfile {
  version: 1;
  weights: Record<string, number>;       // 1.0 default; 1.3 selected; 0.7 deselected
  depth: 'headlines' | 'standard' | 'deep';
  unknownTime: boolean;
  completedAt: string | null;            // ISO date or null if skipped
}

export const DEFAULT_PROFILE: PersonalizationProfile = {
  version: 1,
  weights: {
    sun: 1.0,
    moon: 1.0,
    mercury: 1.0,
    venus: 1.0,
    mars: 1.0,
    jupiter: 1.0,
    saturn: 1.0,
    uranus: 1.0,
    pluto: 1.0,
    chiron: 1.0,
    love: 1.0,
    work: 1.0,
    growth: 1.0,
    home: 1.0,
    voice: 1.0,
    money: 1.0,
    edge: 1.0,
    craft: 1.0
  },
  depth: 'standard',
  unknownTime: false,
  completedAt: null
};

export const TOPIC_PLANETS: Record<string, string[]> = {
  love: ['venus', 'mars', '7th'],
  work: ['mc', '6th', '10th', 'saturn'],
  growth: ['jupiter', '9th', 'sagittarius'],
  home: ['moon', '4th', 'cancer'],
  voice: ['mercury', '3rd'],
  money: ['2nd', 'taurus', 'part-of-fortune'],
  edge: ['uranus', 'pluto', '8th', '12th'],
  craft: ['virgo', '6th', 'vesta']
};

// ============================================================================
// PERSISTENCE
// ============================================================================

const PROFILE_KEY = 'skyProfile.v1';

/**
 * Load user's personalization profile
 */
export function loadProfile(): PersonalizationProfile {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return { ...DEFAULT_PROFILE };

    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      version: 1
    };
  } catch (e) {
    console.warn('Failed to load profile:', e);
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Save user's personalization profile
 */
export function saveProfile(profile: PersonalizationProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save profile:', e);
  }
}

/**
 * Update weights for selected interests
 */
export function setSelectedInterests(interests: string[]): void {
  const profile = loadProfile();

  // Reset all to default
  Object.keys(profile.weights).forEach(key => {
    profile.weights[key] = 1.0;
  });

  // Selected: 1.3, not selected: 0.7
  Object.keys(profile.weights).forEach(key => {
    if (interests.includes(key)) {
      profile.weights[key] = 1.3;
    } else {
      profile.weights[key] = 0.7;
    }
  });

  profile.completedAt = new Date().toISOString();
  saveProfile(profile);
}

/**
 * Set depth preference
 */
export function setDepth(depth: 'headlines' | 'standard' | 'deep'): void {
  const profile = loadProfile();
  profile.depth = depth;
  saveProfile(profile);
}

/**
 * Mark onboarding completed
 */
export function completeOnboarding(
  selectedInterests: string[],
  depth: 'headlines' | 'standard' | 'deep',
  unknownTime: boolean
): void {
  const profile = loadProfile();

  setSelectedInterests(selectedInterests);

  profile.depth = depth;
  profile.unknownTime = unknownTime;
  profile.completedAt = new Date().toISOString();

  saveProfile(profile);
}

/**
 * Skip onboarding: use defaults
 */
export function skipOnboarding(): void {
  const profile = { ...DEFAULT_PROFILE };
  profile.completedAt = new Date().toISOString(); // Mark as skipped but completed
  saveProfile(profile);
}

/**
 * Check if onboarding was completed (not skipped)
 */
export function onboardingCompleted(): boolean {
  const profile = loadProfile();
  return profile.completedAt !== null && profile.depth !== 'standard';
}

/**
 * Get weight for an astral body or topic
 */
export function getWeight(bodyOrTopic: string): number {
  const profile = loadProfile();
  return profile.weights[bodyOrTopic.toLowerCase()] ?? 1.0;
}

/**
 * Get depth factor for topic boost
 */
export function getDepthFactor(): 0 | 1 | 1.2 {
  const profile = loadProfile();
  switch (profile.depth) {
    case 'headlines':
      return 0;
    case 'standard':
      return 1;
    case 'deep':
      return 1.2;
    default:
      return 1;
  }
}

/**
 * Check if house phrasing should be suppressed
 */
export function shouldSuppressHouses(): boolean {
  const profile = loadProfile();
  return profile.unknownTime;
}

/**
 * Clear profile (for testing or onboarding reset)
 */
export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}
