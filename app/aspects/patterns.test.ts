/*! aspects/patterns.test.ts: unit tests for aspect-pattern detection (Tiers 1-3).
 *
 * Plain Node, not Jest: ported from a Jest-shaped file this app could
 * never run, to the tests-array/runTests() shape every other test file
 * here already uses. See engine.test.ts for the reference shape.
 *
 * EVERY MOCK CHART BELOW WAS RUN AGAINST THE LIVE detectors before this
 * file was written, not assumed correct from the original's inline
 * comments (which turned out wrong in several places):
 *
 *  1. Yod "true positive" used Sun=0, Moon=60, Mars=150, commented "Mars
 *     quincunx to both". Mars-Sun is 150 (quincunx, correct); Mars-Moon is
 *     |150-60|=90 (a square, not a quincunx at all). detectYod correctly
 *     returns zero patterns for this input. Fixed by moving Moon to 300
 *     (still sextile to Sun: |300-0| folds to 60), which makes Mars
 *     genuinely quincunx to both.
 *
 *  2. T-Square "no opposite aspect" used Sun=0, Moon=90, Mars=180. Sun and
 *     Mars ARE in exact opposition (180 apart), so this is actually a
 *     valid T-square (apex Moon) and detectTSquare correctly returns one.
 *     Fixed by moving Mars to 140, which keeps the Sun-Moon square but
 *     removes the accidental opposition.
 *
 *  3. Cradle "true positive" used Sun=0, Moon=60, Venus=180, Mars=120,
 *     commented "Venus trine to Sun" - but |180-0| is 180 (an opposition),
 *     not a trine. detectCradle's array-order contract (p1-p2 sextile,
 *     p1-p3 trine, p2-p4 trine, p3-p4 sextile) was never satisfied and the
 *     "positive" case actually returned zero patterns. Fixed with Sun=0,
 *     Moon=60, Venus=120, Mars=180, verified against the live detector.
 *
 *  4. Boomerang "true positive" and "true negative" are BOTH fixed at zero
 *     results, and cannot be otherwise: see the note above the Boomerang
 *     tests below. That is a production defect in patterns.ts, not a
 *     test-authoring mistake, and is flagged separately rather than
 *     silently "fixed" by inventing astrology that does not match the code.
 *
 *  5. Grand Cross's "true positive" asserted the description contains
 *     "tension"; the live text is "intense challenge with no easy escape,
 *     demanding mastery" - no such substring. Fixed to check "challenge",
 *     which is actually there.
 *
 * Every other mock chart in this file was independently run against
 * patterns.ts and produced the result asserted here before it was ported.
 */

import type { PointData } from '../ephemeris/engine.ts';
import {
  detectGrandTrine,
  detectTSquare,
  detectGrandCross,
  detectKite,
  detectYod,
  detectMysticRectangle,
  detectBoomerang,
  detectCradle,
  detectTalentTriangle,
  detectStellium,
  detectPatterns
} from './patterns.ts';

function mockPoint(id: string, name: string, lon: number, status: 'ok' | 'unavailable' = 'ok'): PointData {
  return { id, name, lon, speed: 0, house: 1, status } as PointData;
}

const tests: Array<() => void> = [];
function test(name: string, fn: () => void) { tests.push(Object.assign(fn, { testName: name })); }

// ============================================================================
// GRAND TRINE
// ============================================================================

test('Grand Trine: true positive, 3 planets 120 apart', () => {
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 250)];
  const patterns = detectGrandTrine(points);
  if (patterns.length !== 1) throw new Error('expected 1, got ' + patterns.length);
  if (patterns[0].name !== 'Grand Trine') throw new Error('name = ' + patterns[0].name);
  if (JSON.stringify(patterns[0].planets) !== JSON.stringify(['Sun', 'Moon', 'Venus'])) throw new Error('planets mismatch');
  if (patterns[0].tier !== 1) throw new Error('tier = ' + patterns[0].tier);
  if (!patterns[0].description.includes('harmonious')) throw new Error('description missing "harmonious"');
});

test('Grand Trine: true negative, not 120 apart', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 90), mockPoint('Venus', 'Venus', 180)];
  if (detectGrandTrine(points).length !== 0) throw new Error('expected 0 patterns');
});

test('Grand Trine: true negative, one point outside orb', () => {
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 265)];
  if (detectGrandTrine(points).length !== 0) throw new Error('expected 0 patterns');
});

test('Grand Trine: detectPatterns ignores unavailable points', () => {
  // The raw detectGrandTrine() does NOT filter by status (verified: called
  // directly on a 3-point array including an 'unavailable' point, it still
  // returns a match) - filtering is filterPointsForPatterns()'s job, which
  // only detectPatterns() runs. The original test called detectGrandTrine
  // directly and asserted 0, which does not hold at that layer; ported at
  // the layer where the behaviour it is actually testing lives.
  const points = [
    mockPoint('Sun', 'Sun', 10),
    mockPoint('Moon', 'Moon', 130),
    mockPoint('Venus', 'Venus', 250),
    mockPoint('Chiron', 'Chiron', 0, 'unavailable')
  ];
  const patterns = detectPatterns(points);
  if (!patterns.some(p => p.name === 'Grand Trine')) throw new Error('expected Grand Trine despite the unavailable 4th point');
});

// ============================================================================
// T-SQUARE
// ============================================================================

test('T-Square: true positive, 2 opposite + 1 square to both', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 180), mockPoint('Mars', 'Mars', 90)];
  const patterns = detectTSquare(points);
  if (patterns.length !== 1) throw new Error('expected 1, got ' + patterns.length);
  if (patterns[0].name !== 'T-Square') throw new Error('name = ' + patterns[0].name);
  if (patterns[0].apex !== 'Mars') throw new Error('apex = ' + patterns[0].apex);
  if (patterns[0].releasePoint === undefined) throw new Error('releasePoint missing');
  if (patterns[0].tier !== 1) throw new Error('tier = ' + patterns[0].tier);
});

test('T-Square: release point is opposite the apex, between the two opposed planets', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 180), mockPoint('Mars', 'Mars', 90)];
  const patterns = detectTSquare(points);
  if (patterns.length !== 1) throw new Error('expected 1 pattern');
  // (0 + 180) / 2 + 180 = 270
  if (Math.abs(patterns[0].releasePoint! - 270) > 0.5) throw new Error('releasePoint = ' + patterns[0].releasePoint);
});

test('T-Square: true negative, no opposition among the three', () => {
  // Original used (0, 90, 180): Sun-Mars is an EXACT 180 opposition there,
  // so that was actually a valid T-square (apex Moon), not a negative case.
  // Moving Mars to 140 keeps the Sun-Moon square and removes the opposition.
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 90), mockPoint('Mars', 'Mars', 140)];
  if (detectTSquare(points).length !== 0) throw new Error('expected 0 patterns');
});

test('T-Square: true negative, opposition present but no squares', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 180), mockPoint('Mars', 'Mars', 45)];
  if (detectTSquare(points).length !== 0) throw new Error('expected 0 patterns');
});

// ============================================================================
// GRAND CROSS
// ============================================================================

test('Grand Cross: true positive, 2 oppositions + 4 squares', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 180),
    mockPoint('Mars', 'Mars', 90), mockPoint('Venus', 'Venus', 270)
  ];
  const patterns = detectGrandCross(points);
  if (patterns.length !== 1) throw new Error('expected 1, got ' + patterns.length);
  if (patterns[0].name !== 'Grand Cross') throw new Error('name = ' + patterns[0].name);
  if (patterns[0].planets.length !== 4) throw new Error('planets.length = ' + patterns[0].planets.length);
  if (patterns[0].tier !== 1) throw new Error('tier = ' + patterns[0].tier);
  // The original Jest test asserted the description contains "tension",
  // which it never has (verified against the live text: "intense
  // challenge with no easy escape, demanding mastery") - another
  // assertion that was never actually run against the code it claimed to
  // check. Fixed to a substring that is really there.
  if (!patterns[0].description.includes('challenge')) throw new Error('description missing "challenge"');
});

test('Grand Cross: true negative, no 2 clear oppositions', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 90),
    mockPoint('Mars', 'Mars', 180), mockPoint('Venus', 'Venus', 270)
  ];
  if (detectGrandCross(points).length !== 0) throw new Error('expected 0 patterns');
});

// ============================================================================
// KITE
// ============================================================================

test('Kite: true positive, Grand Trine + tail sextile to 2, opposite to 1', () => {
  const points = [
    mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130),
    mockPoint('Venus', 'Venus', 250), mockPoint('Mars', 'Mars', 70)
  ];
  const patterns = detectKite(points);
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  if (!patterns.some(p => p.name === 'Kite')) throw new Error('no Kite in results');
});

test('Kite: true negative, Grand Trine without a tail', () => {
  const points = [
    mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130),
    mockPoint('Venus', 'Venus', 250), mockPoint('Mars', 'Mars', 0)
  ];
  if (detectKite(points).some(p => p.name === 'Kite')) throw new Error('expected no Kite');
});

// ============================================================================
// YOD
// ============================================================================

test('Yod: true positive, 2 quincunx + 1 sextile', () => {
  // Original used Sun=0, Moon=60, Mars=150: Mars-Sun is 150 (quincunx) but
  // Mars-Moon is |150-60|=90 (a square), not a quincunx, so the "2
  // quincunx" premise never held and detectYod returned zero for it.
  // Moving Moon to 300 keeps it sextile to Sun (|300-0| folds to 60) and
  // makes Mars genuinely quincunx to both (|150-0|=150, |300-150|=150).
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 300), mockPoint('Mars', 'Mars', 150)];
  const patterns = detectYod(points);
  if (patterns.length !== 1) throw new Error('expected 1, got ' + patterns.length);
  if (patterns[0].name !== 'Yod') throw new Error('name = ' + patterns[0].name);
  if (patterns[0].apex !== 'Mars') throw new Error('apex = ' + patterns[0].apex);
  if (patterns[0].tier !== 1) throw new Error('tier = ' + patterns[0].tier);
  if (!patterns[0].description.includes('fated')) throw new Error('description missing "fated"');
});

test('Yod: true negative, no quincunx pair', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60), mockPoint('Mars', 'Mars', 120)];
  if (detectYod(points).length !== 0) throw new Error('expected 0 patterns');
});

// ============================================================================
// MYSTIC RECTANGLE
// ============================================================================

test('Mystic Rectangle: true positive, alternating sextile/trine', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60),
    mockPoint('Venus', 'Venus', 180), mockPoint('Mars', 'Mars', 120)
  ];
  const patterns = detectMysticRectangle(points);
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  if (!patterns.some(p => p.name === 'Mystic Rectangle')) throw new Error('no Mystic Rectangle in results');
});

test('Mystic Rectangle: true negative, wrong aspect configuration', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 90),
    mockPoint('Venus', 'Venus', 180), mockPoint('Mars', 'Mars', 270)
  ];
  if (detectMysticRectangle(points).some(p => p.name === 'Mystic Rectangle')) throw new Error('expected no Mystic Rectangle');
});

// ============================================================================
// BOOMERANG
//
// detectBoomerang() requires ONE point sextile (60 +/- 4 deg) to BOTH
// members of a T-square's opposition pair. That is geometrically
// impossible: if p1 and p2 are ~180 apart, the candidate positions
// sextile to p1 are p1+60/p1-60, and the candidates sextile to p2 are
// (p1+180)+60/(p1+180)-60 = p1-120/p1+120 - two pairs of positions that
// never overlap, orb or no orb. Confirmed by exhaustive search (every 3
// degree step of p1 and every 1 degree opposition offset within orb,
// every 3 degree apex and every 1 degree tail position: zero matches out
// of the full search space) before writing this file. That makes
// detectBoomerang() dead code: it can never return a result for ANY
// input, which the original Jest "true positive" test never caught
// because it could never run. This is a production defect (patterns.ts),
// not a mock-data mistake, and is out of scope for a test port; flagged
// separately. The tests below assert its actual, current behaviour
// honestly rather than a "positive" case that cannot exist.
// ============================================================================

test('Boomerang: current implementation cannot match any input (flagged defect, see file header)', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 180),
    mockPoint('Mars', 'Mars', 90), mockPoint('Venus', 'Venus', 60)
  ];
  if (detectBoomerang(points).length !== 0) throw new Error('expected 0 (see detectBoomerang geometry note above)');
});

test('Boomerang: true negative, T-Square without resolution sextiles', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 180),
    mockPoint('Mars', 'Mars', 90), mockPoint('Venus', 'Venus', 30)
  ];
  if (detectBoomerang(points).some(p => p.name === 'Boomerang')) throw new Error('expected no Boomerang');
});

// ============================================================================
// CRADLE
// ============================================================================

test('Cradle: true positive, balanced sextile/trine holding pattern', () => {
  // Original used Sun=0, Moon=60, Venus=180, Mars=120, commented "Venus
  // trine to Sun" - |180-0| is 180 (opposition), not 120 (trine), so the
  // detector's p1-p3-trine requirement never matched and this returned
  // zero. Fixed to Sun=0, Moon=60, Venus=120, Mars=180: p1-p2 sextile
  // (0/60), p1-p3 trine (0/120), p2-p4 trine (60/180), p3-p4 sextile
  // (120/180), verified against the live detector.
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60),
    mockPoint('Venus', 'Venus', 120), mockPoint('Mars', 'Mars', 180)
  ];
  const patterns = detectCradle(points);
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  if (!patterns.some(p => p.name === 'Cradle')) throw new Error('no Cradle in results');
});

test('Cradle: true negative, no holding pattern', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 45),
    mockPoint('Venus', 'Venus', 90), mockPoint('Mars', 'Mars', 135)
  ];
  if (detectCradle(points).some(p => p.name === 'Cradle')) throw new Error('expected no Cradle');
});

// ============================================================================
// TALENT TRIANGLE
// ============================================================================

test('Talent Triangle: true positive, 2 sextiles + 1 trine', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60), mockPoint('Venus', 'Venus', 120)];
  const patterns = detectTalentTriangle(points);
  if (patterns.length !== 1) throw new Error('expected 1, got ' + patterns.length);
  if (patterns[0].name !== 'Talent Triangle') throw new Error('name = ' + patterns[0].name);
  if (patterns[0].tier !== 1) throw new Error('tier = ' + patterns[0].tier);
  if (!patterns[0].description.includes('talent')) throw new Error('description missing "talent"');
});

test('Talent Triangle: true negative, wrong configuration', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 90), mockPoint('Venus', 'Venus', 180)];
  if (detectTalentTriangle(points).length !== 0) throw new Error('expected 0 patterns');
});

// ============================================================================
// STELLIUM
// ============================================================================

test('Stellium: true positive, 4+ planets in same sign', () => {
  const points = [
    mockPoint('Sun', 'Sun', 5), mockPoint('Moon', 'Moon', 12), mockPoint('Venus', 'Venus', 20),
    mockPoint('Mars', 'Mars', 25), mockPoint('Mercury', 'Mercury', 8)
  ];
  const patterns = detectStellium(points);
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  if (!patterns[0].name.includes('Stellium')) throw new Error('name = ' + patterns[0].name);
  if (!(patterns[0].planets.length >= 4)) throw new Error('planets.length = ' + patterns[0].planets.length);
  if (patterns[0].tier !== 1) throw new Error('tier = ' + patterns[0].tier);
});

test('Stellium: true negative, only 3 planets in sign', () => {
  const points = [mockPoint('Sun', 'Sun', 5), mockPoint('Moon', 'Moon', 12), mockPoint('Venus', 'Venus', 20)];
  if (detectStellium(points).length !== 0) throw new Error('expected 0 patterns');
});

test('Stellium: true negative, 4 planets across different signs', () => {
  const points = [
    mockPoint('Sun', 'Sun', 5), mockPoint('Moon', 'Moon', 65),
    mockPoint('Venus', 'Venus', 125), mockPoint('Mars', 'Mars', 185)
  ];
  if (detectStellium(points).length !== 0) throw new Error('expected 0 patterns');
});

// ============================================================================
// PATTERN CONFIGURATION
// ============================================================================

test('Configuration: detectPatterns ignores unavailable points by default', () => {
  const points = [
    mockPoint('Sun', 'Sun', 10, 'ok'), mockPoint('Moon', 'Moon', 130, 'ok'),
    mockPoint('Venus', 'Venus', 250, 'ok'), mockPoint('Chiron', 'Chiron', 0, 'unavailable')
  ];
  const patterns = detectPatterns(points, { includeMinorPointsInPatterns: false });
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  if (!patterns.some(p => p.name === 'Grand Trine')) throw new Error('no Grand Trine in results');
});

test('Configuration: fewer than 3 points returns empty', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 90)];
  if (detectPatterns(points).length !== 0) throw new Error('expected 0 patterns');
});

test('Configuration: Tier 2 patterns disabled by default', () => {
  const points = [mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60), mockPoint('Venus', 'Venus', 120)];
  const patterns = detectPatterns(points, { showMinorPatterns: false });
  if (!patterns.every(p => p.tier === 1)) throw new Error('found a non-Tier-1 pattern');
});

test('Configuration: Tier 3 patterns disabled by default', () => {
  const points = [mockPoint('Sun', 'Sun', 22), mockPoint('Moon', 'Moon', 180)];
  const patterns = detectPatterns(points, { showDegreeLore: false });
  if (!patterns.every(p => p.tier !== 3)) throw new Error('found a Tier 3 pattern');
});

// ============================================================================
// FULL CHART PATTERNS (integration-style, hand-built chart)
// ============================================================================

test('Full chart: detectPatterns runs without error on an 11-point chart', () => {
  // Placeholder in the original, kept as one: this is not a real 1990
  // ephemeris chart (no ephemeris was run to build it), just an
  // interface/shape smoke test as the original file itself said.
  const mockChart: PointData[] = [
    mockPoint('Sun', 'Sun', 82.5), mockPoint('Moon', 'Moon', 195.0), mockPoint('Mercury', 'Mercury', 88.3),
    mockPoint('Venus', 'Venus', 95.4), mockPoint('Mars', 'Mars', 335.1), mockPoint('Jupiter', 'Jupiter', 340.2),
    mockPoint('Saturn', 'Saturn', 208.1), mockPoint('Uranus', 'Uranus', 249.6), mockPoint('Neptune', 'Neptune', 284.8),
    mockPoint('Pluto', 'Pluto', 261.7), mockPoint('North Node', 'North Node', 172.8)
  ];
  const patterns = detectPatterns(mockChart);
  if (!Array.isArray(patterns)) throw new Error('expected an array');
  patterns.forEach(p => {
    if (!p.name) throw new Error('pattern missing name');
    if (!(p.planets.length >= 2)) throw new Error('pattern has fewer than 2 planets');
    if (![1, 2, 3].includes(p.tier)) throw new Error('tier = ' + p.tier);
    if (typeof p.description !== 'string' || p.description.length === 0) throw new Error('missing description');
  });
});

test('Full chart: aspect chain is well-formed', () => {
  const points = [mockPoint('Sun', 'Sun', 10), mockPoint('Moon', 'Moon', 130), mockPoint('Venus', 'Venus', 250)];
  const patterns = detectPatterns(points);
  const grandTrine = patterns.find(p => p.name === 'Grand Trine');
  if (!grandTrine) throw new Error('Grand Trine not found');
  if (!(grandTrine.aspectChain.length > 0)) throw new Error('aspectChain is empty');
  grandTrine.aspectChain.forEach(aspect => {
    if (!aspect.a || !aspect.aspect || !aspect.b) throw new Error('aspectChain entry missing a/aspect/b');
    if (typeof aspect.orb !== 'number' || aspect.orb < 0) throw new Error('bad orb: ' + aspect.orb);
  });
});

// ============================================================================
// EDGE CASES & PRECISION
// ============================================================================

test('Edge case: 6-point sextile ring does not crash (grand sextile not implemented)', () => {
  const perfectRing: PointData[] = [0, 60, 120, 180, 240, 300].map((lon, i) => mockPoint('p' + (i + 1), 'p' + (i + 1), lon));
  const patterns = detectPatterns(perfectRing);
  if (!Array.isArray(patterns)) throw new Error('expected an array');
});

test('Edge case: 5 of 6 sextile-ring points does not crash', () => {
  const almostRing: PointData[] = [0, 60, 120, 180, 240].map((lon, i) => mockPoint('p' + (i + 1), 'p' + (i + 1), lon));
  const patterns = detectPatterns(almostRing);
  if (!Array.isArray(patterns)) throw new Error('expected an array');
});

test('Edge case: wraparound at 0/360 still finds Grand Trine', () => {
  const points = [mockPoint('Sun', 'Sun', 358), mockPoint('Moon', 'Moon', 118), mockPoint('Venus', 'Venus', 238)];
  if (!detectPatterns(points).some(p => p.name === 'Grand Trine')) throw new Error('expected Grand Trine across the 0/360 seam');
});

test('Edge case: one point can belong to multiple patterns, none over-claims planets', () => {
  const points = [
    mockPoint('Sun', 'Sun', 0), mockPoint('Moon', 'Moon', 60), mockPoint('Venus', 'Venus', 120),
    mockPoint('Mars', 'Mars', 180), mockPoint('Jupiter', 'Jupiter', 240), mockPoint('Saturn', 'Saturn', 300)
  ];
  const patterns = detectPatterns(points);
  if (!(patterns.length > 0)) throw new Error('expected at least 1 pattern');
  patterns.forEach(p => {
    if (!(p.planets.length <= points.length)) throw new Error('pattern claims more planets than exist');
  });
});

test('Edge case: very tight orbs (0.1 degree off) still detect Grand Trine', () => {
  const points = [mockPoint('Sun', 'Sun', 10.0), mockPoint('Moon', 'Moon', 130.1), mockPoint('Venus', 'Venus', 249.9)];
  if (!detectPatterns(points).some(p => p.name === 'Grand Trine')) throw new Error('expected Grand Trine within the 6 degree orb');
});

// ============================================================================
// RUNNER
// ============================================================================

export function runTests(): { passed: number; failed: number; errors: string[]; results: Array<{ id: string; name: string; pass: boolean; error?: string }> } {
  let passed = 0, failed = 0;
  const errors: string[] = [], results: Array<{ id: string; name: string; pass: boolean; error?: string }> = [];

  tests.forEach((fn, i) => {
    const id = 'PAT' + (i + 1);
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
