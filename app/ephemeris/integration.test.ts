/*! ephemeris/integration.test.ts: registry + engine integration tests.
 *
 * Plain Node, not Jest: ported from a Jest-shaped file this app could
 * never run, to the tests-array/runTests() shape every other test file
 * here already uses. See engine.test.ts for the reference shape.
 *
 * WHAT CHANGED FROM THE ORIGINAL, beyond the Jest-to-plain-Node shape:
 *
 *  - initEngine() does not exist (there is no Swiss Ephemeris binding to
 *    initialize - see engine.ts's own file header); the beforeAll() block
 *    that awaited it is dropped entirely.
 *
 *  - computeVertex()'s signature is (jd, latDeg, geoLonDeg) - no mcLon
 *    parameter. The old test's expected value (~313 degrees) has no
 *    verifiable source and is dropped along with the extra argument, in
 *    favour of the same internal-consistency check engine.test.ts already
 *    established for Vertex (see that file's header for why: no external
 *    reference vector was obtainable).
 *
 *  - computeComet() keys are lowercase registry ids ('halley', not
 *    'Halley'). The old test's ~239 degree expectation is the same
 *    debunked figure engine.test.ts's header explains (that longitude
 *    describes Halley roughly a month AFTER its 1986 perihelion, once it
 *    had cleared solar conjunction - not at perihelion itself, when NASA's
 *    own account has it "behind the Sun"). Reused here is the same
 *    near-solar-conjunction check, independently checkable without
 *    trusting the comet solver's own output.
 *
 *  - computeAll()'s signature is (jd, lat, lon, angles, houseCusps?, opts?)
 *    - angles is a required {asc, mc} object, not derived internally (the
 *      previous engine.ts derived it internally and hardcoded it to 0; see
 *      engine.ts's file header). Every call below computes real angles via
 *      computeAscendant()/computeMidheaven() first.
 *
 *  - EXPANDED_REGISTRY has exactly 80 points, not "81+": the registry was
 *    corrected to a precise, verified count in the pointRegistry.ts pass
 *    that preceded this one (see check-point-registry.js).
 *
 *  - SYMBOLISM entries are shaped { symbolism, reference }, not
 *    { archetype, practical } (renamed when SYMBOLISM was rebuilt as a
 *    derived map in the same pass).
 *
 *  - The UI Smoke Tests describe block is dropped. It read
 *    document.getElementById() for #expand-chart-button, #expand-points-table-body,
 *    etc: `document` does not exist in plain Node, and every element it
 *    named belonged to app/ExpandChartOverlay.dc.html and friends, which
 *    were deleted as superseded dead weight in an earlier pass (the
 *    expand-chart feature was rebuilt directly into
 *    inCommonApp v2.dc.html's own DC-runtime shell). Nothing survives to
 *    smoke-test at those ids any more; a DOM-based UI test belongs beside
 *    a real DOM (a browser harness), not in this module's plain-Node unit
 *    tests.
 *
 *  - "Memoization reduces repeat calls" asserted a cached call is >=50%
 *    faster, but computeAll() has no caching at all - a deliberate,
 *    documented decision (see computeAll()'s own comment: "Round-key
 *    caching... belongs at the CALL SITE once this module is actually
 *    wired into the app... adding a cache inside a function nobody calls
 *    yet would be a guess"). Replaced with what is actually true and
 *    worth guarding: calling computeAll() twice with identical inputs
 *    produces identical output (no hidden mutable state between calls).
 *
 *  - "No crash on missing asteroid ephemeris" asserted
 *    `result === null || typeof result === 'object'`, which is true no
 *    matter what sweAsteroid() returns (typeof null is itself 'object' in
 *    JavaScript, so the clause is a tautology). Tightened to the actual,
 *    documented behaviour: sweAsteroid() returns null, never throws, for
 *    any body with no sourced elements (confirmed against the live code).
 *
 * All numeric values below (Sun's J2000 longitude, the asteroid/comet/
 * node/vertex outputs, the registry counts) were run against the live
 * modules before being written into this file, not carried over from the
 * original's unverified numbers.
 */

import {
  BASIC_REGISTRY,
  EXPANDED_REGISTRY,
  SYMBOLISM,
  byCategory,
  validateRegistry
} from './pointRegistry.ts';

import {
  sweBody,
  sweAsteroid,
  lunarNode,
  computeSelena,
  computeAriesPoint,
  computeAntivertex,
  computePartOfFortune,
  computeSunMoonMidpoint,
  computeVertex,
  computeAscendant,
  computeMidheaven,
  computeComet,
  assignHouse,
  computeAll
} from './engine.ts';

function approx(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

const tests: Array<() => void> = [];
function test(name: string, fn: () => void) { tests.push(Object.assign(fn, { testName: name })); }

// ============================================================================
// REGISTRY INTEGRITY
// ============================================================================

test('Registry validation passes', () => {
  const result = validateRegistry();
  if (result.valid !== true) throw new Error('validateRegistry() reported invalid: ' + JSON.stringify(result.errors));
  if (result.errors.length !== 0) throw new Error('expected 0 errors, got ' + result.errors.length);
});

test('BASIC_REGISTRY has exactly 17 points', () => {
  if (BASIC_REGISTRY.length !== 17) throw new Error('got ' + BASIC_REGISTRY.length);
});

test('EXPANDED_REGISTRY has exactly 80 points', () => {
  // Was asserted ">=81" in the original; the registry's own corrected,
  // verified count (see check-point-registry.js) is exactly 80.
  if (EXPANDED_REGISTRY.length !== 80) throw new Error('got ' + EXPANDED_REGISTRY.length);
});

test('All 97 points have unique IDs', () => {
  // Renamed from "All 98 points": 17 + 80 = 97, not 98.
  const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
  const ids = allPoints.map(p => p.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== allPoints.length) throw new Error('expected ' + allPoints.length + ' unique ids, got ' + uniqueIds.size);
});

test('All points have valid categories', () => {
  const validCategories = ['basic', 'angle', 'body', 'node', 'asteroid', 'centaur', 'tno', 'comet', 'hypothetical', 'derived'];
  const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
  allPoints.forEach(p => {
    if (!validCategories.includes(p.category)) throw new Error(p.id + ': category "' + p.category + '" not in the declared union');
  });
});

test('All tooltips are 120 characters or fewer', () => {
  const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
  allPoints.forEach(p => {
    if (p.tooltip.length > 120) throw new Error(p.id + ': tooltip is ' + p.tooltip.length + ' characters');
  });
});

test('All references are 120 characters or fewer', () => {
  const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
  allPoints.forEach(p => {
    if (p.reference.length > 120) throw new Error(p.id + ': reference is ' + p.reference.length + ' characters');
  });
});

test('SYMBOLISM has a { symbolism, reference } entry for every point', () => {
  // Renamed fields from the original's { archetype, practical }: SYMBOLISM
  // was rebuilt as a derived map with { symbolism, reference } in the
  // pointRegistry.ts pass that preceded this one.
  const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
  allPoints.forEach(p => {
    const entry = (SYMBOLISM as Record<string, { symbolism: string; reference: string }>)[p.id];
    if (!entry) throw new Error('SYMBOLISM missing entry for ' + p.id);
    if (!entry.symbolism) throw new Error('SYMBOLISM.' + p.id + ': empty symbolism');
    if (!entry.reference) throw new Error('SYMBOLISM.' + p.id + ': empty reference');
  });
});

test('Category groupings are correct', () => {
  if (!(byCategory('asteroid').length > 20)) throw new Error('asteroid count = ' + byCategory('asteroid').length);
  if (byCategory('body').length !== 10) throw new Error('body count = ' + byCategory('body').length + ', expected 10 (Sun-Pluto)');
  if (byCategory('angle').length !== 4) throw new Error('angle count = ' + byCategory('angle').length + ', expected 4 (ASC/MC/IC/DC)');
});

// ============================================================================
// ENGINE SANITY
// ============================================================================

test('Sun at J2000.0 is 280.4 +/- 0.1 degrees', () => {
  const JD2000 = 2451545.0;
  const sun = sweBody(0, JD2000);
  if (!approx(sun.lon, 280.4, 0.1)) throw new Error('got ' + sun.lon.toFixed(4));
});

test('Asteroids compute or return null gracefully', () => {
  const jd = 2459800.5;
  const bodies: Array<[number, string]> = [[1, 'Ceres'], [2060, 'Chiron'], [136199, 'Eris'], [90377, 'Sedna']];
  bodies.forEach(([mpc, name]) => {
    const result = sweAsteroid(mpc, jd);
    if (result !== null) {
      if (typeof result.lon !== 'number') throw new Error(name + ': lon is not a number');
      if (!(result.lon >= 0 && result.lon < 360)) throw new Error(name + ': lon out of range: ' + result.lon);
    }
  });
});

test('Vertex computation: NYC 1990-04-19, internal consistency', () => {
  // The original asserted an external value (~313 degrees +/- 10) with no
  // traceable source, and called computeVertex() with an extra mcLon
  // argument the real 3-argument signature does not take. Reused here is
  // engine.test.ts's own established approach for this exact case: no
  // verified external test vector was available, so Vertex is checked for
  // internal consistency (in range, exactly opposite its Antivertex, and
  // genuinely different from the Ascendant) rather than against an
  // unverifiable number.
  const lat = 40.7128, lon = -74.0060;
  const jd = 2448000.0 + 109 + 18.034 / 24;

  const vertex = computeVertex(jd, lat, lon);
  const antivertex = computeAntivertex(vertex);
  const asc = computeAscendant(jd, lat, lon);

  if (!(vertex >= 0 && vertex < 360)) throw new Error('vertex out of range: ' + vertex);
  if (!approx((antivertex - vertex + 360) % 360, 180, 1e-6)) throw new Error('antivertex not opposite vertex: ' + vertex + ' / ' + antivertex);
  if (approx(vertex, asc, 0.5)) throw new Error('vertex should not equal ascendant: both ' + vertex.toFixed(2));
});

test('Halley at its 1986-02-09 perihelion is near solar conjunction', () => {
  // The original asserted ~239 degrees +/- 0.5 (a Jest toBeCloseTo() call
  // that in any case misused its second argument as a tolerance rather
  // than a decimal-digit count). engine.test.ts's header explains why that
  // figure is wrong: it describes Halley about a month AFTER perihelion.
  // Reused here is the same independently-checkable fact instead: at
  // perihelion Halley was "behind the Sun" (NASA's own account of the
  // 1986 apparition), meaning angularly close to the Sun's own longitude.
  const jdPerihelion = 2446470.12;
  const halley = computeComet('halley', jdPerihelion);
  if (!halley) throw new Error('computeComet("halley") returned null');

  const sun = sweBody(0, jdPerihelion);
  let sep = Math.abs(halley.lon - sun.lon);
  if (sep > 180) sep = 360 - sep;
  if (sep > 20) throw new Error('Halley (' + halley.lon.toFixed(2) + ') is ' + sep.toFixed(1) + ' degrees from the Sun; expected under 20');
});

test('South Node = Mean Node + 180 degrees exactly', () => {
  const jd = 2459800.5;
  const nodes = lunarNode(jd);
  const expected = (nodes.northNode + 180) % 360;
  if (!approx(nodes.southNode, expected, 1e-5)) throw new Error('south=' + nodes.southNode + ', expected ' + expected);
});

test('Part of Fortune: day formula', () => {
  const asc = 15, moon = 195, sun = 75;
  const pof = computePartOfFortune(asc, moon, sun, false, 'reverse');
  const expected = (asc + moon - sun + 360) % 360;
  if (!approx(pof, expected, 1e-5)) throw new Error('got ' + pof + ', expected ' + expected);
});

test('Selena = Lilith (Mean) + 180 degrees', () => {
  const lilithMean = 100;
  const selena = computeSelena(lilithMean);
  const expected = (lilithMean + 180) % 360;
  if (selena !== expected) throw new Error('got ' + selena + ', expected ' + expected);
});

test('Aries Point is always 0 degrees', () => {
  if (computeAriesPoint() !== 0) throw new Error('got ' + computeAriesPoint());
});

test('Antivertex = Vertex + 180 degrees', () => {
  const vertex = 45;
  const antivertex = computeAntivertex(vertex);
  const expected = (vertex + 180) % 360;
  if (antivertex !== expected) throw new Error('got ' + antivertex + ', expected ' + expected);
});

test('Sun/Moon midpoint takes the shorter arc', () => {
  const mid = computeSunMoonMidpoint(10, 50);
  if (Math.abs(mid - 30) >= 1) throw new Error('got ' + mid + ', expected close to 30');
});

// ============================================================================
// FULL CHART INTEGRATION
// ============================================================================

test('computeAll: 1990-06-15 12:00 UTC, NYC, produces all 97 registry points', () => {
  const jd = 2448000.0 + 165.5;
  const lat = 40.7128, lon = -74.0060;
  const houseCusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const angles = { asc: computeAscendant(jd, lat, lon), mc: computeMidheaven(jd, lon) };

  const chart = computeAll(jd, lat, lon, angles, houseCusps);

  if (chart.length !== 97) throw new Error('expected 97 points, got ' + chart.length);

  chart.forEach(p => {
    if (!p.id || !p.name) throw new Error('point missing id/name');
    if (typeof p.lon !== 'number') throw new Error(p.id + ': lon is not a number');
    if (!['ok', 'unavailable', 'fixed'].includes(p.status)) throw new Error(p.id + ': bad status ' + p.status);
    if (!(p.lon >= 0 && p.lon < 360)) throw new Error(p.id + ': lon out of range ' + p.lon);
  });

  const northNode = chart.find(p => p.name === 'North Node');
  const southNode = chart.find(p => p.name === 'South Node');
  if (!northNode || !southNode) throw new Error('missing North/South Node');
  const expectedSouth = (northNode.lon + 180) % 360;
  if (Math.abs(southNode.lon - expectedSouth) >= 0.01) throw new Error('South Node mismatch');

  const lilith = chart.find(p => p.name === 'Lilith (Mean)');
  const selena = chart.find(p => p.name === 'Selena');
  if (!lilith || !selena) throw new Error('missing Lilith/Selena');
  const expectedSelena = (lilith.lon + 180) % 360;
  if (Math.abs(selena.lon - expectedSelena) >= 0.01) throw new Error('Selena mismatch');

  const ariesPoint = chart.find(p => p.name === 'Aries Point');
  if (ariesPoint?.lon !== 0) throw new Error('Aries Point = ' + ariesPoint?.lon);

  const asc = chart.find(p => p.name === 'Ascendant');
  const dc = chart.find(p => p.name === 'Descendant');
  const mc = chart.find(p => p.name === 'Midheaven');
  const ic = chart.find(p => p.name === 'Nadir');
  if (asc && dc) {
    const expectedDC = (asc.lon + 180) % 360;
    if (Math.abs(dc.lon - expectedDC) >= 0.01) throw new Error('Descendant not opposite Ascendant');
  }
  if (mc && ic) {
    const expectedIC = (mc.lon + 180) % 360;
    if (Math.abs(ic.lon - expectedIC) >= 0.01) throw new Error('Nadir not opposite Midheaven');
  }
});

test('computeAll: minor bodies (Chiron, Ceres) are present and plausible', () => {
  const jd = 2459800.5, lat = 40.7, lon = -74.0;
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const angles = { asc: computeAscendant(jd, lat, lon), mc: computeMidheaven(jd, lon) };
  const chart = computeAll(jd, lat, lon, angles, cusps);

  const chiron = chart.find(p => p.name === 'Chiron');
  if (!chiron) throw new Error('Chiron missing from chart');
  if (chiron.status === 'ok') {
    if (!(chiron.lon >= 0 && chiron.lon < 360)) throw new Error('Chiron lon out of range: ' + chiron.lon);
  }

  const ceres = chart.find(p => p.name === 'Ceres');
  if (!ceres) throw new Error('Ceres missing from chart');
});

// ============================================================================
// PERFORMANCE
// ============================================================================

test('computeAll completes in 150ms or less for the full 97-point registry', () => {
  const jd = 2459800.5, lat = 40.7, lon = -74.0;
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const angles = { asc: computeAscendant(jd, lat, lon), mc: computeMidheaven(jd, lon) };

  const start = performance.now();
  const chart = computeAll(jd, lat, lon, angles, cusps);
  const elapsed = performance.now() - start;

  if (!(elapsed < 150)) throw new Error('took ' + elapsed.toFixed(1) + 'ms for ' + chart.length + ' points');
});

test('computeAll is deterministic across repeated calls (no hidden caching or mutable state)', () => {
  // Replaces the original's "memoization reduces repeat calls" claim:
  // computeAll() has no cache at all, by deliberate documented design (see
  // its own file header), so there is nothing to time. What is actually
  // worth guarding is that two calls with identical inputs produce
  // identical output.
  const jd = 2459800.5, lat = 40.7, lon = -74.0;
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const angles = { asc: computeAscendant(jd, lat, lon), mc: computeMidheaven(jd, lon) };

  const chart1 = computeAll(jd, lat, lon, angles, cusps);
  const chart2 = computeAll(jd, lat, lon, angles, cusps);

  if (chart1.length !== chart2.length) throw new Error('length differs between calls');
  chart1.forEach((p, i) => {
    if (p.id !== chart2[i].id || p.lon !== chart2[i].lon || p.status !== chart2[i].status) {
      throw new Error('point ' + p.id + ' differs between identical calls');
    }
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

test('sweAsteroid returns null (not a crash) for an id with no sourced elements', () => {
  // The original asserted `result === null || typeof result === 'object'`,
  // which is trivially true regardless of what is returned (typeof null
  // IS 'object' in JavaScript). Tightened to the real, documented
  // behaviour: null, never a thrown error.
  const result = sweAsteroid(999999, 2459800.5);
  if (result !== null) throw new Error('expected null, got ' + JSON.stringify(result));
});

test('House assignment wraps around at 0/360 degrees', () => {
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const house1 = assignHouse(359, cusps);
  if (![12, 1].includes(house1 as number)) throw new Error('359 degrees assigned to house ' + house1);
  const house2 = assignHouse(15, cusps);
  if (house2 !== 1) throw new Error('15 degrees assigned to house ' + house2 + ', expected 1');
});

test('South Node is exactly 180 degrees from North Node (boundary check)', () => {
  const jd = 2459800.5;
  const nodes = lunarNode(jd);
  const diff = Math.abs(nodes.southNode - (nodes.northNode + 180) % 360);
  if (!(diff < 0.01)) throw new Error('diff = ' + diff);
});

// ============================================================================
// RUNNER
// ============================================================================

export function runTests(): { passed: number; failed: number; errors: string[]; results: Array<{ id: string; name: string; pass: boolean; error?: string }> } {
  let passed = 0, failed = 0;
  const errors: string[] = [], results: Array<{ id: string; name: string; pass: boolean; error?: string }> = [];

  tests.forEach((fn, i) => {
    const id = 'REG' + (i + 1);
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
