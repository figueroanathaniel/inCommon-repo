/*! aspects/harmonicPatterns.ts
 * Harmonic pattern detection
 * Run patterns engine on recast array with harmonic-specific naming and tagging
 */

import { PointData } from '../ephemeris/engine';
import { HarmonicPointData, recastHarmonicMemoized } from '../ephemeris/harmonic';
import { detectPatterns, ChartPattern, PatternConfig } from './patterns';

// ============================================================================
// TYPES
// ============================================================================

export interface HarmonicPattern extends ChartPattern {
  harmonicOf: string[];    // Original point IDs this pattern was detected in
  harmonicN: number;       // Which harmonic (2–13)
}

// ============================================================================
// HARMONIC PATTERN DETECTION
// ============================================================================

/**
 * Detect patterns in a harmonic view
 * Returns patterns with names prefixed "NH:" (e.g., "5H: Grand Trine")
 * and harmonicOf field tracking original point IDs
 */
export function detectHarmonicPatterns(
  radixPoints: PointData[],
  harmonicN: number,
  config: Partial<PatternConfig> = {}
): HarmonicPattern[] {
  if (harmonicN === 1) {
    // Radix view; use standard detection
    return detectPatterns(radixPoints, config).map(p => ({
      ...p,
      harmonicOf: p.planets,
      harmonicN: 1
    }));
  }

  // Recast to harmonic
  const harmonicPoints = recastHarmonicMemoized(radixPoints, harmonicN, {
    harmonicIncludeAngles: false
  });

  // Turn OFF Tier 2 minor-aspect patterns in harmonic views
  // (they're already exposed via the harmonic family structure)
  const harmonicConfig: PatternConfig = {
    showMinorPatterns: false,  // Force off
    showDegreeLore: false,      // Force off
    includeMinorPointsInPatterns: config.includeMinorPointsInPatterns ?? false,
    maxOrbScaling: config.maxOrbScaling ?? 1.0
  };

  // Detect patterns in recast array
  const patterns = detectPatterns(harmonicPoints, harmonicConfig);

  // Map back to original point IDs and prefix names
  return patterns.map(p => {
    // Find which original points these harmonicPoints correspond to
    const originalIds = p.planets.map(id => {
      const hPoint = harmonicPoints.find(hp => hp.id === id);
      return hPoint ? radixPoints.find(rp => rp.id === hPoint.id)?.id || id : id;
    });

    return {
      ...p,
      name: `${harmonicN}H: ${p.name}`,
      planets: originalIds,
      harmonicOf: originalIds,
      harmonicN
    };
  });
}

/**
 * Detect patterns across a range of harmonics
 * Returns all patterns found in harmonics minH to maxH
 */
export function detectHarmonicRangePatterns(
  radixPoints: PointData[],
  minH: number,
  maxH: number,
  config: Partial<PatternConfig> = {}
): HarmonicPattern[] {
  const allPatterns: HarmonicPattern[] = [];

  for (let n = minH; n <= maxH; n++) {
    const patterns = detectHarmonicPatterns(radixPoints, n, config);
    allPatterns.push(...patterns);
  }

  return allPatterns;
}

/**
 * Filter harmonic patterns by tier (1, 2, or 3)
 * Note: Tier 2 is OFF by default in harmonics, so this usually returns only Tier 1
 */
export function harmonicPatternsByTier(
  patterns: HarmonicPattern[],
  tier: 1 | 2 | 3
): HarmonicPattern[] {
  return patterns.filter(p => p.tier === tier);
}

/**
 * Filter harmonic patterns by which harmonic they appeared in
 */
export function harmonicPatternsByN(
  patterns: HarmonicPattern[],
  n: number
): HarmonicPattern[] {
  return patterns.filter(p => p.harmonicN === n);
}

/**
 * Group patterns by harmonic (for UI rendering)
 */
export function groupHarmonicPatternsByN(
  patterns: HarmonicPattern[]
): Record<number, HarmonicPattern[]> {
  const groups: Record<number, HarmonicPattern[]> = {};

  patterns.forEach(p => {
    if (!groups[p.harmonicN]) {
      groups[p.harmonicN] = [];
    }
    groups[p.harmonicN].push(p);
  });

  return groups;
}

// ============================================================================
// VALIDATION: HARMONIC ASPECT EXPECTATIONS
// ============================================================================

/**
 * Verify a radix pattern appears in expected harmonics
 * For example, a radix golden yod (planets at 0°, 144°, 288°) should appear
 * as a 5H: Grand Trine (quintile family).
 */
export function patternAppearanceInHarmonic(
  radixPattern: ChartPattern,
  targetHarmonic: number,
  allHarmonicPatterns: HarmonicPattern[]
): HarmonicPattern | undefined {
  return allHarmonicPatterns.find(p => {
    const samePoints = p.harmonicOf.sort().join(',') === radixPattern.planets.sort().join(',');
    return p.harmonicN === targetHarmonic && samePoints;
  });
}

/**
 * Test case helper: verify that a radix golden yod (quintile pattern)
 * appears as a grand trine in the 5th harmonic
 */
export function isGoldenYodIn5thHarmonic(
  radixPatterns: ChartPattern[],
  allHarmonicPatterns: HarmonicPattern[]
): boolean {
  const goldenYods = radixPatterns.filter(p => p.name.includes('Yod'));

  if (goldenYods.length === 0) return false;

  return goldenYods.some(yod => {
    const in5H = patternAppearanceInHarmonic(yod, 5, allHarmonicPatterns);
    return in5H && in5H.name.includes('Grand Trine');
  });
}

/**
 * Test case helper: verify that a radix grand trine does NOT appear as
 * a 5H: Grand Trine (because it's already a trine pattern in the radix,
 * not a quintile family pattern).
 */
export function radixGrandTrineNotIn5th(
  radixPatterns: ChartPattern[],
  allHarmonicPatterns: HarmonicPattern[]
): boolean {
  const grandTrines = radixPatterns.filter(p => p.name.includes('Grand Trine'));

  if (grandTrines.length === 0) return true; // No grand trine to check

  return grandTrines.every(gt => {
    const in5H = patternAppearanceInHarmonic(gt, 5, allHarmonicPatterns);
    return !in5H; // Should NOT find a 5H: Grand Trine for the same planets
  });
}
