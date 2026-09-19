/*! aspects/harmonicPatterns.ts
 * Harmonic pattern detection
 * Run patterns engine on recast array with harmonic-specific naming and tagging
 */

import type { PointData } from '../ephemeris/engine.ts';
import type { HarmonicPointData } from '../ephemeris/harmonic.ts';
import { recastHarmonicMemoized } from '../ephemeris/harmonic.ts';
import { detectPatterns } from './patterns.ts';
import type { ChartPattern, PatternConfig } from './patterns.ts';

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
      harmonicOf: p.bodies,
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
    const originalIds = p.bodies.map(id => {
      const hPoint = harmonicPoints.find(hp => hp.id === id);
      return hPoint ? radixPoints.find(rp => rp.id === hPoint.id)?.id || id : id;
    });

    return {
      ...p,
      name: `${harmonicN}H: ${p.name}`,
      bodies: originalIds,
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
 * Verify a radix pattern appears in expected harmonics. Generic lookup:
 * finds a harmonic-N pattern claiming the exact same astral body set as a given
 * radix pattern.
 */
export function patternAppearanceInHarmonic(
  radixPattern: ChartPattern,
  targetHarmonic: number,
  allHarmonicPatterns: HarmonicPattern[]
): HarmonicPattern | undefined {
  return allHarmonicPatterns.find(p => {
    const samePoints = p.harmonicOf.sort().join(',') === radixPattern.bodies.sort().join(',');
    return p.harmonicN === targetHarmonic && samePoints;
  });
}

/**
 * Test case helper: verify that a radix Golden Yod (patterns.ts's
 * detectGoldenYod: a quintile [72°] between two astral bodies, both biquintile
 * [144°] from a third) collapses to a genuine conjunction at the 5th
 * harmonic.
 *
 * PREVIOUSLY checked for a "5H: Grand Trine" instead, and filtered radix
 * patterns by name containing "Yod" - which only ever matched the
 * classical (quincunx/sextile) Yod from detectYod(), never an actual
 * Golden Yod, because no detector for one existed anywhere in this
 * codebase (detectGoldenYod() above is the missing piece). Even with a
 * real Golden Yod, "becomes a Grand Trine at H5" was never achievable: a
 * quintile (72°) times 5 is exactly 360° (0°) and a biquintile (144°)
 * times 5 is 720° (also 0° mod 360°), so a genuine Golden Yod's three
 * points land on the SAME longitude at H5, not 120° apart. That is the
 * real fifth-harmonic signature this fifth-harmonic-family pattern leaves
 * (confirmed against fifth-harmonic literature and against this file's own
 * recast arithmetic), so this checks for the conjunction directly rather
 * than asking detectPatterns() to name a pattern that three exactly
 * conjunct points can never produce (Grand Trine needs 120° separation;
 * Stellium needs 4+ points).
 */
export function isGoldenYodIn5thHarmonic(radixPoints: PointData[]): boolean {
  const radixPatterns = detectPatterns(radixPoints);
  const goldenYods = radixPatterns.filter(p => p.name === 'Golden Yod');

  if (goldenYods.length === 0) return false;

  return goldenYods.some(yod => {
    const members = radixPoints.filter(p => yod.bodies.includes(p.id) && p.status === 'ok');
    if (members.length < 2) return false;

    const h5 = recastHarmonicMemoized(members, 5);
    for (let i = 0; i < h5.length; i++) {
      for (let j = i + 1; j < h5.length; j++) {
        let d = Math.abs(h5[i].lon - h5[j].lon);
        if (d > 180) d = 360 - d;
        if (d > 6) return false; // not conjunct: not the fifth-harmonic collapse
      }
    }
    return true;
  });
}

/**
 * Test case helper: verify whether a radix grand trine ALSO registers as a
 * 5H Grand Trine.
 *
 * NAME KEPT for API stability, but the premise in its old doc comment
 * ("should NOT appear... because it's already a trine pattern in the
 * radix, not a quintile family pattern") is backwards. An exact Grand
 * Trine's three points are 120° apart; multiplying by any harmonic n makes
 * the spacing (120*n) mod 360, which is 120 or 240 (whose short arc is
 * also 120) for every n NOT divisible by 3, and only collapses to 0
 * (conjunction) when 3 | n. 5 is not divisible by 3, so an exact radix
 * Grand Trine DOES reappear as "5H: Grand Trine" - confirmed empirically,
 * not assumed. This function's own logic was already correct (it asks
 * detectPatterns() and reports what it finds); only the comment describing
 * what "should" happen was wrong, and callers should not expect `true`
 * here for an exact Grand Trine tested against harmonic 5.
 */
export function radixGrandTrineNotIn5th(
  radixPatterns: ChartPattern[],
  allHarmonicPatterns: HarmonicPattern[]
): boolean {
  const grandTrines = radixPatterns.filter(p => p.name.includes('Grand Trine'));

  if (grandTrines.length === 0) return true; // No grand trine to check

  return grandTrines.every(gt => {
    const in5H = patternAppearanceInHarmonic(gt, 5, allHarmonicPatterns);
    return !in5H; // Should NOT find a 5H: Grand Trine for the same astral bodies
  });
}
