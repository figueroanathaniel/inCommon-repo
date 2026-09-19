/*! aspects/harmonicPatterns.test.ts: unit tests for harmonic pattern detection.
 *
 * Plain Node, not Jest: ported from a Jest-shaped file this app could
 * never run, to the tests-array/runTests() shape every other test file
 * here already uses. See engine.test.ts for the reference shape.
 *
 * WHAT WAS WRONG IN THE ORIGINAL, none of it ever caught because the file
 * could not run - and what was actually fixed rather than just documented:
 *
 *  1. (0, 144, 288) is a genuine GOLDEN YOD, not "not a Yod at all" as an
 *     earlier pass of this file claimed. Checked against fifth-harmonic
 *     literature: a Golden Yod is a quintile (72deg) between two astral bodies
 *     with a third biquintile (144deg) from each - Sun-Venus is |288-0|
 *     folding to 72, and Moon is 144 from both. It is a DIFFERENT pattern
 *     from the classical (quincunx/sextile) Yod, not a variant of it, and
 *     no detector for it existed anywhere in this codebase: ASPECT_ORBS in
 *     patterns.ts already carried 'quintile'/'biquintile' entries with
 *     nothing using either. detectGoldenYod() is the fix, added to
 *     patterns.ts's Tier 1 set.
 *
 *  2. Even with a real Golden Yod, "becomes a Grand Trine at H5" was never
 *     achievable and still is not: a quintile (72deg) times 5 is exactly
 *     360deg (0deg), and a biquintile (144deg) times 5 is 720deg (also
 *     0deg mod 360deg), so a genuine Golden Yod's three points land on the
 *     SAME longitude at H5 - a conjunction, not 120deg apart. That is the
 *     real fifth-harmonic signature (confirmed against fifth-harmonic
 *     literature and this file's own recast arithmetic), so
 *     isGoldenYodIn5thHarmonic() was rewritten to check for that
 *     conjunction directly (it now takes the radix points and recasts the
 *     Golden Yod's own three members to H5 itself) rather than ask
 *     detectPatterns() to name a pattern three exactly-conjunct points can
 *     never produce (Grand Trine needs 120deg separation; Stellium needs
 *     4+ points).
 *
 *  3. A classical (quincunx/sextile) Yod's two 150deg legs become
 *     (150*5) mod 360 = 30deg at H5, not 120deg, for any rotation of the
 *     shape - arithmetic, not a search failure. isGoldenYodIn5thHarmonic()
 *     correctly returns false for a real classical Yod (it is filtered out
 *     by name: only 'Golden Yod' counts), which is asserted below rather
 *     than left untested.
 *
 *  4. "Radix grand trine does NOT appear as 5H: Grand Trine" is
 *     mathematically backwards. An exact Grand Trine's three points are
 *     120deg apart; multiplying by any harmonic n makes the spacing (120*n)
 *     mod 360, which is 120 or 240 (whose short arc is also 120) for every
 *     n not divisible by 3, and 0 (conjunction) only when 3 | n. 5 is not
 *     divisible by 3, so the SAME grand trine DOES reappear as "5H: Grand
 *     Trine" - confirmed empirically with the exact mock points from the
 *     original test. radixGrandTrineNotIn5th()'s own logic was already
 *     correct; only its doc comment's premise (and the original test's
 *     expected value) was wrong, and both are fixed.
 *
 * Everything not touched by this note (the n=1 pass-through, the harmonic
 * range/filter/group helpers, the HARMONIC_MEANINGS coverage, the edge
 * cases) was run against the live modules before being ported and matched
 * the original assertion.
 */

import type { PointData } from '../ephemeris/engine.ts';
import {
  detectHarmonicPatterns,
  detectHarmonicRangePatterns,
  harmonicPatternsByTier,
  harmonicPatternsByN,
  groupHarmonicPatternsByN,
  isGoldenYodIn5thHarmonic,
  radixGrandTrineNotIn5th
} from './harmonicPatterns.ts';
import { detectPatterns } from './patterns.ts';
import { HARMONIC_MEANINGS } from '../forecast/harmonicMeanings.ts';

function mockPoint(id: string, name: string, lon: number, status: 'ok' | 'unavailable' = 'ok'): PointData {
  return { id, name, lon, speed: 1.0, house: 1, status } as PointData;
}

const tests: Array<() => void> = [];
function test(name: string, fn: () => void) { tests.push(Object.assign(fn, { testName: name })); }

// ============================================================================
// HARMONIC PATTERN DETECTION
// ============================================================================

test('Radix (n=1) uses standard pattern detection', () => {
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 250)];
  const patterns = detectHarmonicPatterns(points, 1);
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  const grandTrine = patterns.find(p => p.name.includes('Grand Trine'));
  if (!grandTrine) throw new Error('Grand Trine not found');
  if (grandTrine.harmonicN !== 1) throw new Error('harmonicN = ' + grandTrine.harmonicN);
  if (JSON.stringify(grandTrine.harmonicOf) !== JSON.stringify(['Sun', 'Moon', 'Venus'])) throw new Error('harmonicOf mismatch');
});

test('Harmonic patterns are prefixed with "NH:"', () => {
  // Original used (0, 120, 240): already an exact radix Grand Trine, whose
  // pairwise spacing (120*3) mod 360 = 0 - a conjunction, not a trine, so
  // this recast produces ZERO patterns and the test's forEach never ran
  // its own assertion (a vacuous pass). Fixed to (0, 40, 80): *3 folds to
  // (0, 120, 240), a genuine 3H trine, verified against the live detector.
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 40), mockPoint('Venus', 'Venus', 80)];
  const patterns = detectHarmonicPatterns(points, 3);
  if (patterns.length === 0) throw new Error('expected at least 1 pattern to actually check the prefix on');
  patterns.forEach(p => {
    if (!/^3H:/.test(p.name)) throw new Error('name "' + p.name + '" does not start with "3H:"');
    if (p.harmonicN !== 3) throw new Error('harmonicN = ' + p.harmonicN);
  });
});

test('A Golden Yod (0, 144, 288) folds to conjunction, not a Grand Trine, at 5H', () => {
  // See file header items 1 and 2. This mock chart IS a real Golden Yod
  // (quintile/biquintile), not a classical (quincunx/sextile) one, and has
  // no radix Grand Trine either. Multiplying by 5 sends all three points
  // to the same longitude (a conjunction), which none of the Tier-1
  // detectors report as a pattern on their own (Grand Trine needs 120deg
  // separation, Stellium needs 4+ points).
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 144), mockPoint('Venus', 'Venus', 288)];

  const radixPatterns = detectPatterns(points);
  if (!radixPatterns.some(p => p.name === 'Golden Yod')) throw new Error('expected a radix Golden Yod for this configuration');
  if (radixPatterns.some(p => p.name.includes('Grand Trine'))) throw new Error('did not expect a radix Grand Trine');

  const harmonic5Patterns = detectHarmonicPatterns(points, 5);
  if (harmonic5Patterns.length !== 0) throw new Error('expected no Tier-1 pattern for 3 conjunct points, got ' + JSON.stringify(harmonic5Patterns.map(p => p.name)));
});

test('An exact Grand Trine DOES reappear as "5H: Grand Trine" (5 is not divisible by 3)', () => {
  // See file header item 3. Renamed from "does NOT appear": for an exact
  // 120deg-spaced triangle, the pairwise spacing after multiplying by n is
  // (120*n) mod 360, which stays a trine (120 or its 240 short-arc
  // complement) for any n not a multiple of 3, and only collapses to a
  // conjunction when 3 | n. n=5 is not a multiple of 3, so the same three
  // astral bodies that form a radix Grand Trine also form one at H5 - verified
  // against the live detector, not assumed from harmonic-family folklore.
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 250)];

  const radixPatterns = detectPatterns(points);
  if (!radixPatterns.some(p => p.name === 'Grand Trine')) throw new Error('expected a radix Grand Trine');

  const harmonic5Patterns = detectHarmonicPatterns(points, 5);
  const h5Trines = harmonic5Patterns.filter(p =>
    p.name.includes('Grand Trine') && p.harmonicOf.slice().sort().join(',') === ['Sun', 'Moon', 'Venus'].sort().join(',')
  );
  if (h5Trines.length === 0) throw new Error('expected the same three astral bodies to also register as "5H: Grand Trine"');
});

test('Tier 2 patterns OFF by default in harmonics', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 40), mockPoint('Venus', 'Venus', 80)];
  const patterns = detectHarmonicPatterns(points, 3);
  if (patterns.length === 0) throw new Error('expected at least 1 pattern');
  if (!patterns.every(p => p.tier === 1)) throw new Error('found a non-Tier-1 pattern');
});

test('Harmonic range detection covers multiple harmonics without going outside the requested range', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 40), mockPoint('Venus', 'Venus', 80)];
  const patterns = detectHarmonicRangePatterns(points, 2, 5);
  if (patterns.length === 0) throw new Error('expected at least 1 pattern in the 2-5 range');
  patterns.forEach(p => {
    if (!(p.harmonicN >= 2 && p.harmonicN <= 5)) throw new Error('harmonicN ' + p.harmonicN + ' outside requested range');
  });
});

test('harmonicPatternsByTier filters correctly', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 40), mockPoint('Venus', 'Venus', 80)];
  const allPatterns = detectHarmonicPatterns(points, 3);
  const tier1 = harmonicPatternsByTier(allPatterns, 1);
  if (tier1.length === 0) throw new Error('expected at least 1 Tier-1 pattern');
  if (!tier1.every(p => p.tier === 1)) throw new Error('found a non-Tier-1 pattern in the filtered list');
});

test('harmonicPatternsByN filters by harmonic', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 40), mockPoint('Venus', 'Venus', 80)];
  const patterns = detectHarmonicRangePatterns(points, 2, 5);
  const h3Only = harmonicPatternsByN(patterns, 3);
  if (h3Only.length === 0) throw new Error('expected at least 1 pattern at harmonic 3');
  if (!h3Only.every(p => p.harmonicN === 3)) throw new Error('found a non-3H pattern in the filtered list');
});

test('groupHarmonicPatternsByN organizes by harmonic', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 40), mockPoint('Venus', 'Venus', 80)];
  const patterns = detectHarmonicRangePatterns(points, 2, 5);
  const grouped = groupHarmonicPatternsByN(patterns);
  if (Object.keys(grouped).length === 0) throw new Error('expected at least one harmonic group');
  Object.entries(grouped).forEach(([nStr, pats]) => {
    const n = parseInt(nStr, 10);
    if (!pats.every(p => p.harmonicN === n)) throw new Error('group ' + nStr + ' contains a mismatched harmonicN');
  });
});

// ============================================================================
// HARMONIC VALIDATION HELPERS
// ============================================================================

test('isGoldenYodIn5thHarmonic: true for a real Golden Yod (its 3 points collapse to conjunction at H5)', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 144), mockPoint('Venus', 'Venus', 288)];
  if (!isGoldenYodIn5thHarmonic(points)) throw new Error('expected true');
});

test('isGoldenYodIn5thHarmonic: false for a classical (quincunx/sextile) Yod', () => {
  // A genuine classical Yod, confirmed against detectYod(): Sun=0, Moon=60
  // (sextile), Mars=210 (quincunx to both). This is a DIFFERENT pattern
  // from a Golden Yod (see file header item 1), and even on its own
  // arithmetic terms cannot collapse to conjunction at H5: its two 150deg
  // legs become (150*5) mod 360 = 30deg, not 0deg, for any rotation of the
  // shape.
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60), mockPoint('Mars', 'Mars', 210)];
  const radixPatterns = detectPatterns(points);
  if (!radixPatterns.some(p => p.name === 'Yod')) throw new Error('expected a real classical radix Yod for this configuration');
  if (isGoldenYodIn5thHarmonic(points)) throw new Error('expected false: a classical Yod is not a Golden Yod');
});

test('isGoldenYodIn5thHarmonic returns false when there is no yod at all', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60), mockPoint('Venus', 'Venus', 120)];
  if (isGoldenYodIn5thHarmonic(points)) throw new Error('expected false');
});

test('radixGrandTrineNotIn5th returns true when there is no radix grand trine', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 144), mockPoint('Venus', 'Venus', 288)];
  const radixPatterns = detectPatterns(points);
  const harmonic5Patterns = detectHarmonicPatterns(points, 5);
  if (!radixGrandTrineNotIn5th(radixPatterns, harmonic5Patterns)) throw new Error('expected true (vacuously: no radix grand trine to check)');
});

test('radixGrandTrineNotIn5th returns false when the grand trine DOES reappear at 5H (see file header item 3)', () => {
  // Renamed and inverted from "returns true when grand trine not in 5H":
  // the original premise was mathematically backwards (item 3 above). The
  // function itself is correct; the original test's expected value was not.
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 250)];
  const radixPatterns = detectPatterns(points);
  const harmonic5Patterns = detectHarmonicPatterns(points, 5);
  if (radixGrandTrineNotIn5th(radixPatterns, harmonic5Patterns)) {
    throw new Error('expected false: this exact grand trine DOES reappear as 5H: Grand Trine');
  }
});

// ============================================================================
// HARMONIC MEANINGS TABLE
// ============================================================================

test('Each harmonic 2-13 has a defined meaning', () => {
  // Imported statically at the top of this file rather than via a
  // runtime require() inside the test body: a bare require() call
  // executed from inside an ESM-syntax .ts file loaded through Node's
  // CJS/ESM interop resolved relative to the OUTER caller's location, not
  // this file's own directory (confirmed empirically - it looked for
  // ../forecast/harmonicMeanings.ts next to whatever script required this
  // test file, not next to aspects/). A static import does not have that
  // problem.
  for (let n = 2; n <= 13; n++) {
    const meaning = HARMONIC_MEANINGS.find((h: any) => h.n === n);
    if (!meaning) throw new Error('no meaning defined for harmonic ' + n);
    if (!meaning.name) throw new Error('harmonic ' + n + ' missing name');
    if (!meaning.family) throw new Error('harmonic ' + n + ' missing family');
    if (!meaning.oneLineMeaning) throw new Error('harmonic ' + n + ' missing oneLineMeaning');
  }
});

test('Experimental flag is set on harmonics 10-13 and not on 2-9', () => {
  [10, 11, 12, 13].forEach(n => {
    const meaning = HARMONIC_MEANINGS.find((h: any) => h.n === n);
    if (meaning.experimental !== true) throw new Error('harmonic ' + n + ' should be experimental');
  });
  [2, 3, 4, 5, 6, 7, 8, 9].forEach(n => {
    const meaning = HARMONIC_MEANINGS.find((h: any) => h.n === n);
    if (meaning.experimental === true) throw new Error('harmonic ' + n + ' should not be experimental');
  });
});

// ============================================================================
// EDGE CASES & PERFORMANCE
// ============================================================================

test('Empty points array returns empty patterns', () => {
  const points: PointData[] = [];
  if (detectHarmonicPatterns(points, 5).length !== 0) throw new Error('expected 0 patterns');
});

test('Single point returns no patterns', () => {
  const points = [mockPoint('Sun', 'Sun', 82.5)];
  if (detectHarmonicPatterns(points, 5).length !== 0) throw new Error('expected 0 patterns');
});

test('Unavailable points are filtered out before pattern detection', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0, 'unavailable'),
    mockPoint('Moon', 'Moon', 120),
    mockPoint('Venus', 'Venus', 240)
  ];
  // Only 2 available points remain (Moon, Venus); filterPointsForPatterns()
  // (inside detectPatterns(), which detectHarmonicPatterns() calls for its
  // Tier-1 pass) needs at least 3 to report anything.
  if (detectHarmonicPatterns(points, 3).length !== 0) throw new Error('expected 0 patterns with only 2 available points');
});

test('Performance: 90 points in 5H completes quickly', () => {
  const points: PointData[] = [];
  for (let i = 0; i < 90; i++) points.push(mockPoint('p' + i, 'Point' + i, (i * 4) % 360));
  const start = performance.now();
  detectHarmonicPatterns(points, 5);
  const elapsed = performance.now() - start;
  if (!(elapsed < 100)) throw new Error('took ' + elapsed.toFixed(1) + 'ms, expected under 100ms');
});

// ============================================================================
// RUNNER
// ============================================================================

export function runTests(): { passed: number; failed: number; errors: string[]; results: Array<{ id: string; name: string; pass: boolean; error?: string }> } {
  let passed = 0, failed = 0;
  const errors: string[] = [], results: Array<{ id: string; name: string; pass: boolean; error?: string }> = [];

  tests.forEach((fn, i) => {
    const id = 'HPT' + (i + 1);
    const name = (fn as any).testName || fn.name || id;
    try {
      fn();
      passed++;
      results.push({ id, name, pass: true });
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(name + ': ' + msg);
      results.push({ id, name, pass: false, error: msg });
    }
  });

  return { passed, failed, errors, results };
}
