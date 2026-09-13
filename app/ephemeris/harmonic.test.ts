/*! ephemeris/harmonic.test.ts: unit tests for harmonic chart recasting.
 *
 * Plain Node, not Jest: ported from a Jest-shaped file this app could
 * never run (no package.json, no node_modules, no Jest anywhere), to the
 * tests-array/runTests() shape every other test file here already uses.
 * See engine.test.ts for the reference shape and multiChart.test.js for
 * the .js-file precedent.
 *
 * THREE THINGS WERE WRONG IN THE ORIGINAL, none of them ever caught
 * because the file could not run:
 *
 *  1. "Angles included if configured" asserted 82.5 * 5 = 412.5 -> 72.5.
 *     412.5 mod 360 is 52.5, not 72.5; the test's own inline comment even
 *     says "412.5 -> 52.5" one line above the wrong assertion. Verified
 *     against the live recastHarmonic() output before fixing: 52.5.
 *
 *  2. "Retrograde flag can flip in high harmonics" multiplies speed by a
 *     positive harmonic (1-13; recastHarmonic throws outside that range),
 *     so a negative speed can never become positive: there is no flip to
 *     test. The numeric assertion (-0.45) is correct; the name and premise
 *     were not. Renamed to describe what is actually true: sign survives
 *     scaling by a positive multiplier.
 *
 *  3. "Cache hits on repeated calls" measured wall-clock time and then
 *     asserted only toEqual (deep equality), which passes even with no
 *     caching at all: recomputing the same input twice is also deeply
 *     equal to itself. recastHarmonicMemoized() returns the exact cached
 *     object on a hit (see harmonic.ts), so the real test of caching is
 *     reference equality, confirmed empirically below before writing it.
 */

import type { PointData } from './engine.ts';
import {
  recastHarmonic,
  recastHarmonicMemoized,
  clearHarmonicCache,
  expectedAspectInHarmonic,
  harmonicAspectFamily
} from './harmonic.ts';

function approx(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function mockPoint(id: string, name: string, lon: number, status: 'ok' | 'unavailable' = 'ok'): PointData {
  return { id, name, lon, speed: 1.0, house: 1, status } as PointData;
}

/** Shortest arc between two longitudes. */
function arcDist(lon1: number, lon2: number): number {
  const d = Math.abs(lon1 - lon2);
  return d > 180 ? 360 - d : d;
}

const tests: Array<() => void> = [];
function test(name: string, fn: () => void) { tests.push(Object.assign(fn, { testName: name })); }

// ============================================================================
// BASIC RECASTING
// ============================================================================

test('n=1 (identity): returns input unchanged, tagged harmonic 1', () => {
  clearHarmonicCache();
  const points = [
    mockPoint('Sun', 'Sun', 82.5),
    mockPoint('Moon', 'Moon', 195.0),
    mockPoint('Venus', 'Venus', 95.4)
  ];
  const harmonic = recastHarmonic(points, 1);
  if (harmonic.length !== 3) throw new Error('expected 3 points, got ' + harmonic.length);
  harmonic.forEach((h, i) => {
    if (!approx(h.lon, points[i].lon, 1e-5)) throw new Error('lon[' + i + '] = ' + h.lon);
    if (h.origLon !== points[i].lon) throw new Error('origLon[' + i + '] mismatch');
    if (h.harmonic !== 1) throw new Error('harmonic[' + i + '] = ' + h.harmonic);
  });
});

test('n=5: multiply by 5 and fold mod 360', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0),
    mockPoint('Moon', 'Moon', 72),    // 72 * 5 = 360 -> 0
    mockPoint('Venus', 'Venus', 144)  // 144 * 5 = 720 -> 0
  ];
  const harmonic = recastHarmonic(points, 5);
  [0, 0, 0].forEach((exp, i) => {
    if (!approx(harmonic[i].lon, exp, 0.01)) throw new Error('lon[' + i + '] = ' + harmonic[i].lon);
  });
});

test('n=3: trine family appears as conjunctions', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0),
    mockPoint('Moon', 'Moon', 120),
    mockPoint('Venus', 'Venus', 240)
  ];
  const harmonic = recastHarmonic(points, 3);
  harmonic.forEach((h, i) => {
    if (!approx(h.lon, 0, 0.01)) throw new Error('lon[' + i + '] = ' + h.lon);
  });
});

test('n=4: square family (including the opposition inside it) appears as conjunctions', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0),
    mockPoint('Moon', 'Moon', 90),
    mockPoint('Mars', 'Mars', 180),
    mockPoint('Venus', 'Venus', 270)
  ];
  const harmonic = recastHarmonic(points, 4);
  harmonic.forEach((h, i) => {
    if (!approx(h.lon, 0, 0.01)) throw new Error('lon[' + i + '] = ' + h.lon);
  });
});

test('Speed is multiplied by N', () => {
  const points = [mockPoint('Sun', 'Sun', 0)];
  points[0].speed = 1.02;
  const harmonic = recastHarmonic(points, 5);
  if (!approx(harmonic[0].speed as number, 5.1, 0.1)) throw new Error('speed = ' + harmonic[0].speed);
});

test('A retrograde speed stays retrograde when scaled by a positive harmonic', () => {
  // Renamed from "Retrograde flag can flip in high harmonics": n is always
  // 1-13 (recastHarmonic throws outside that range), so multiplying a
  // negative speed by a positive number can never flip its sign. What is
  // true, and worth keeping a row for, is that the sign survives the scale.
  const points = [mockPoint('Saturn', 'Saturn', 210)];
  points[0].speed = -0.05;
  const harmonic = recastHarmonic(points, 9);
  if (!(harmonic[0].speed! < 0)) throw new Error('expected negative speed, got ' + harmonic[0].speed);
  if (!approx(harmonic[0].speed as number, -0.45, 0.1)) throw new Error('speed = ' + harmonic[0].speed);
});

test('House data is null in harmonic view', () => {
  const points = [mockPoint('Sun', 'Sun', 82.5)];
  points[0].house = 5;
  const harmonic = recastHarmonic(points, 5);
  if (harmonic[0].house !== null) throw new Error('house = ' + harmonic[0].house);
});

test('Angles skipped by default unless configured', () => {
  const points = [
    mockPoint('Ascendant', 'Ascendant', 15),
    mockPoint('Midheaven', 'Midheaven', 280),
    mockPoint('Sun', 'Sun', 82.5)
  ];
  const harmonic = recastHarmonic(points, 5, { harmonicIncludeAngles: false });
  if (harmonic[0].status !== 'harmonic-skipped') throw new Error('Ascendant status = ' + harmonic[0].status);
  if (harmonic[0].lon !== 15) throw new Error('Ascendant lon changed: ' + harmonic[0].lon);
  if (harmonic[1].status !== 'harmonic-skipped') throw new Error('Midheaven status = ' + harmonic[1].status);
  if (harmonic[1].lon !== 280) throw new Error('Midheaven lon changed: ' + harmonic[1].lon);
  if (harmonic[2].harmonic !== 5) throw new Error('Sun not recast normally');
});

test('Angles included if configured', () => {
  const points = [
    mockPoint('Ascendant', 'Ascendant', 15),
    mockPoint('Sun', 'Sun', 82.5)
  ];
  const harmonic = recastHarmonic(points, 5, { harmonicIncludeAngles: true });
  if (!approx(harmonic[0].lon, 75, 0.01)) throw new Error('Ascendant lon = ' + harmonic[0].lon + ', expected 75 (15*5)');
  // 82.5 * 5 = 412.5, mod 360 = 52.5 (the original test asserted 72.5, which
  // matches neither the arithmetic nor its own inline comment).
  if (!approx(harmonic[1].lon, 52.5, 0.01)) throw new Error('Sun lon = ' + harmonic[1].lon + ', expected 52.5 (412.5 mod 360)');
});

test('Lunar nodes skipped by default', () => {
  const points = [
    mockPoint('North Node', 'North Node', 172.8),
    mockPoint('South Node', 'South Node', 352.8),
    mockPoint('Sun', 'Sun', 82.5)
  ];
  const harmonic = recastHarmonic(points, 5);
  if (harmonic[0].status !== 'harmonic-skipped') throw new Error('North Node status = ' + harmonic[0].status);
  if (harmonic[1].status !== 'harmonic-skipped') throw new Error('South Node status = ' + harmonic[1].status);
  if (harmonic[2].harmonic !== 5) throw new Error('Sun not recast normally');
});

test('Asteroids/minor bodies marked harmonic-approx', () => {
  const points = [
    mockPoint('Chiron', 'Chiron', 120),
    mockPoint('Ceres', 'Ceres', 45),
    mockPoint('Sun', 'Sun', 82.5)
  ];
  const harmonic = recastHarmonic(points, 5);
  if (harmonic[0].status !== 'harmonic-approx') throw new Error('Chiron status = ' + harmonic[0].status);
  if (harmonic[1].status !== 'harmonic-approx') throw new Error('Ceres status = ' + harmonic[1].status);
  if (harmonic[2].status !== 'ok') throw new Error('Sun status = ' + harmonic[2].status);
});

test('origLon field preserves original longitude', () => {
  const points = [mockPoint('Sun', 'Sun', 82.5), mockPoint('Moon', 'Moon', 195.0)];
  const harmonic = recastHarmonic(points, 5);
  if (harmonic[0].origLon !== 82.5) throw new Error('origLon[0] = ' + harmonic[0].origLon);
  if (harmonic[1].origLon !== 195.0) throw new Error('origLon[1] = ' + harmonic[1].origLon);
});

test('Rejects invalid harmonics', () => {
  const points = [mockPoint('Sun', 'Sun', 82.5)];
  [0, 14, -1].forEach(n => {
    let threw = false;
    try { recastHarmonic(points, n); } catch { threw = true; }
    if (!threw) throw new Error('recastHarmonic(points, ' + n + ') did not throw');
  });
});

// ============================================================================
// MEMOIZATION
// ============================================================================

test('Memoized call returns same result as non-memoized', () => {
  clearHarmonicCache();
  const points = [
    mockPoint('Sun', 'Sun', 82.5),
    mockPoint('Moon', 'Moon', 195.0),
    mockPoint('Venus', 'Venus', 95.4)
  ];
  const result1 = recastHarmonic(points, 5);
  const result2 = recastHarmonicMemoized(points, 5);
  if (result2.length !== result1.length) throw new Error('length mismatch');
  result2.forEach((h, i) => {
    if (!approx(h.lon, result1[i].lon, 1e-5)) throw new Error('lon[' + i + '] mismatch');
    if (h.harmonic !== result1[i].harmonic) throw new Error('harmonic[' + i + '] mismatch');
  });
});

test('Cache hits on repeated calls return the SAME object, not just an equal one', () => {
  // The original test only checked toEqual (deep equality), which a
  // no-cache recompute would also satisfy; it never proved caching
  // happened. recastHarmonicMemoized() returns the cached array by
  // reference on a hit (see harmonic.ts), so reference equality is the
  // real assertion, confirmed empirically before writing it this way.
  clearHarmonicCache();
  const points = [mockPoint('Sun', 'Sun', 82.5), mockPoint('Moon', 'Moon', 195.0)];
  const result1 = recastHarmonicMemoized(points, 5);
  const result2 = recastHarmonicMemoized(points, 5);
  if (result2 !== result1) throw new Error('expected the identical cached array back, got a new one');
});

test('Different N values produce different results', () => {
  clearHarmonicCache();
  const points = [mockPoint('Sun', 'Sun', 72)];
  const h3 = recastHarmonicMemoized(points, 3);
  const h5 = recastHarmonicMemoized(points, 5);
  const h7 = recastHarmonicMemoized(points, 7);
  if (!approx(h3[0].lon, 216, 0.01)) throw new Error('h3 = ' + h3[0].lon);
  if (!approx(h5[0].lon, 0, 0.01)) throw new Error('h5 = ' + h5[0].lon);
  if (!approx(h7[0].lon, 144, 0.01)) throw new Error('h7 = ' + h7[0].lon);
});

test('Clear cache works', () => {
  const points = [mockPoint('Sun', 'Sun', 82.5)];
  recastHarmonicMemoized(points, 5);
  clearHarmonicCache();
  const result = recastHarmonicMemoized(points, 5);
  if (result.length !== 1) throw new Error('length = ' + result.length);
});

// ============================================================================
// HARMONIC ASPECT FAMILIES
// ============================================================================

test('Aspect family arc per harmonic', () => {
  const cases: Array<[number, number]> = [[2, 180], [3, 120], [4, 90], [5, 72], [6, 60]];
  cases.forEach(([n, expected]) => {
    if (!approx(harmonicAspectFamily(n), expected, 0.5)) {
      throw new Error('harmonicAspectFamily(' + n + ') = ' + harmonicAspectFamily(n));
    }
  });
  if (!approx(harmonicAspectFamily(7), 51.43, 0.1)) throw new Error('harmonicAspectFamily(7) = ' + harmonicAspectFamily(7));
});

test('Expected aspect detection', () => {
  if (!approx(expectedAspectInHarmonic(72, 5), 0, 0.5)) throw new Error('72 in 5H should be 0');
  if (!approx(expectedAspectInHarmonic(120, 3), 0, 0.5)) throw new Error('120 in 3H should be 0');
  if (!approx(expectedAspectInHarmonic(90, 4), 0, 0.5)) throw new Error('90 in 4H should be 0');
  if (!(expectedAspectInHarmonic(102, 5) > 0)) throw new Error('102 in 5H (30 off) should be > 0');
});

// ============================================================================
// GOLDEN YOD IN 5TH HARMONIC
// ============================================================================

test('Golden yod (0, 144, 288) conjunct in 5th harmonic', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 144), mockPoint('Venus', 'Venus', 288)];
  const harmonic5 = recastHarmonic(points, 5);
  harmonic5.forEach((h, i) => {
    if (!approx(h.lon, 0, 0.01)) throw new Error('lon[' + i + '] = ' + h.lon);
  });
});

test('Radix grand trine NOT conjunct in 5th harmonic', () => {
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 250)];
  const harmonic5 = recastHarmonic(points, 5);
  const lons = harmonic5.map(h => h.lon);
  const diffs = [arcDist(lons[0], lons[1]), arcDist(lons[1], lons[2]), arcDist(lons[2], lons[0])];
  if (!diffs.some(d => d > 6)) throw new Error('expected at least one diff > 6, got ' + JSON.stringify(diffs));
});

// ============================================================================
// WRAPAROUND & PRECISION
// ============================================================================

test('Large angles wrap correctly', () => {
  const points = [mockPoint('p1', 'p1', 350)];
  const h5 = recastHarmonic(points, 5);
  if (!approx(h5[0].lon, 310, 0.01)) throw new Error('lon = ' + h5[0].lon + ', expected 310 (1750 mod 360)');
});

test('Sign/degree recomputation at 2H and 3H', () => {
  const points = [mockPoint('Sun', 'Sun', 82.5)];
  const h2 = recastHarmonic(points, 2);
  if (!approx(h2[0].lon, 165, 0.01)) throw new Error('2H lon = ' + h2[0].lon);
  const h3 = recastHarmonic(points, 3);
  if (!approx(h3[0].lon, 247.5, 0.01)) throw new Error('3H lon = ' + h3[0].lon);
});

test('Retrograde flag survives high harmonics', () => {
  const points = [mockPoint('Saturn', 'Saturn', 210)];
  points[0].speed = -0.02;
  const h9 = recastHarmonic(points, 9);
  if (!(h9[0].speed! < 0)) throw new Error('expected negative speed, got ' + h9[0].speed);
});

// ============================================================================
// RUNNER
// ============================================================================

export function runTests(): { passed: number; failed: number; errors: string[]; results: Array<{ id: string; name: string; pass: boolean; error?: string }> } {
  let passed = 0, failed = 0;
  const errors: string[] = [], results: Array<{ id: string; name: string; pass: boolean; error?: string }> = [];

  tests.forEach((fn, i) => {
    const id = 'HAR' + (i + 1);
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
