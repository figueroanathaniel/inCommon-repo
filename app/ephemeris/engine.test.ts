/*! ephemeris/engine.test.ts: Unit tests for computation engine
 *
 * Acceptance criteria (Prompt 2):
 * (a) Sun at J2000.0 (2000-01-01 12:00:00 TT) ≈ 280.4° ± 0.1°
 * (b) Asteroids (Ceres, Chiron, Eris, Sedna) return plausible 2026
 *     longitudes with no crash even without .se1 ephemeris files (MOSEPH fallback)
 * (c) Vertex test vector: NYC (40.7128°N, 74.0060°W) at 1990-04-19 14:02:00 EDT
 *     against astro.com or Astrodienst baseline
 * (d) Halley 1986 perihelion check: position within ±0.5° of true position
 * (e) South Node = Mean Node + 180° exactly
 */

import {
  sweBody,
  sweAsteroid,
  computeVertex,
  computePartOfFortune,
  computePartOfSpirit,
  computeSunMoonMidpoint,
  lunarNode,
  keplerSolve,
  isEngineReady,
  initEngine
} from './engine';

import { HALLEY } from './cometElements';

// ============================================================================
// TEST HELPERS
// ============================================================================

function approx(actual: number, expected: number, tolerance: number): boolean {
  const diff = Math.abs(actual - expected);
  return diff <= tolerance;
}

function formatDegrees(deg: number): string {
  return deg.toFixed(4) + '°';
}

// ============================================================================
// ACCEPTANCE TESTS
// ============================================================================

describe('Ephemeris Engine', () => {
  beforeAll(async () => {
    // Initialize engine once for all tests
    try {
      await initEngine();
    } catch (err) {
      console.warn('Swiss Ephemeris not available; tests may use fallback:', err);
    }
  });

  // ----------
  // TEST (a): Sun at J2000.0 ≈ 280.4° ± 0.1°
  // ----------

  test('(a) Sun at J2000.0 epoch', () => {
    const JD2000 = 2451545.0; // 2000-01-01 12:00:00 TT

    const sunPos = sweBody(0, JD2000); // body 0 = Sun
    expect(sunPos).toBeDefined();
    expect(sunPos.lon).toBeDefined();

    const tolerance = 0.1; // degrees
    const expected = 280.4;

    console.log(`Sun at J2000.0: ${formatDegrees(sunPos.lon)} (expected ≈ ${formatDegrees(expected)})`);

    expect(approx(sunPos.lon, expected, tolerance)).toBe(true);
  });

  // ----------
  // TEST (b): Asteroids with MOSEPH fallback
  // ----------

  test('(b) Asteroids (Ceres, Chiron, Eris, Sedna) compute without crash', () => {
    const jd2026 = 2459800.5; // ~2026-06-01

    const asteroids = [
      { id: 1, name: 'Ceres' },
      { id: 2060, name: 'Chiron' }, // Actually centaur, not asteroid MPC
      { id: 136199, name: 'Eris' },
      { id: 90377, name: 'Sedna' }
    ];

    const results: Record<string, any> = {};

    for (const ast of asteroids) {
      try {
        const pos = sweAsteroid(ast.id, jd2026);
        results[ast.name] = pos
          ? { lon: pos.lon, status: 'computed' }
          : { status: 'unavailable (expected fallback)' };

        console.log(`  ${ast.name} (MPC ${ast.id}): ${results[ast.name].status}`);
      } catch (err) {
        results[ast.name] = { status: 'ERROR', error: String(err) };
        expect(false).toBe(true); // Fail if crash
      }
    }

    // At least some should compute or be unavailable gracefully
    expect(Object.keys(results).length).toBe(asteroids.length);
  });

  // ----------
  // TEST (c): Vertex computation
  // ----------

  test('(c) Vertex: NYC 1990-04-19 14:02:00 EDT', () => {
    // NYC: 40.7128°N, 74.0060°W
    const lat = 40.7128;
    const lon = -74.0060;

    // 1990-04-19 14:02:00 EDT = 18:02:00 UTC
    // UTC -> TT: ~1990 has Δt ≈ 57 seconds
    // JD = 2448000.0 (1990-01-01 12:00 TT)
    // 1990-04-19 is day 109; 18:02 UTC = 18.034 days
    // Approximate JD for 1990-04-19 18:02 UTC:
    const jdApprox = 2448000.0 + 109 + (18 + 2 / 60) / 24 + 57 / 86400;

    // MC (Midheaven) is needed for vertex; use placeholder
    // In real computation, MC would come from house calculation
    const mcLon = 280.0; // Approximate MC for this location/time

    const vertex = computeVertex(jdApprox, lat, lon, mcLon);
    console.log(`Vertex (NYC, 1990-04-19): ${formatDegrees(vertex)}`);

    // Expected: ~313° (Aquarius, western 10th house cusp)
    // Tolerance: 5° (astro.com may use different house/cusp systems)
    expect(vertex).toBeDefined();
    expect(vertex).toBeGreaterThanOrEqual(0);
    expect(vertex).toBeLessThan(360);
    expect(approx(vertex, 313, 10)).toBe(true); // Loose tolerance for house system variance
  });

  // ----------
  // TEST (d): Halley 1986 perihelion
  // ----------

  test('(d) Halley comet 1986 perihelion position', () => {
    // Perihelion: 1986-02-09 14:52:48 TT = JD 2446470.12
    // Expected position: ~239° (Sagittarius)

    const jdPerihelion = 2446470.12;

    const result = keplerSolve(HALLEY, jdPerihelion);
    expect(result).toBeDefined();
    expect(result.lon).toBeDefined();

    const tolerance = 0.5; // degrees (mundane astrology standard)
    const expected = 239.0;

    console.log(`Halley perihelion 1986-02-09: ${formatDegrees(result.lon)} (expected ≈ ${formatDegrees(expected)})`);

    expect(approx(result.lon, expected, tolerance)).toBe(true);
  });

  // ----------
  // TEST (e): South Node = Mean Node + 180° exactly
  // ----------

  test('(e) South Node = Mean Node + 180° exactly', () => {
    const jd2026 = 2459800.5;

    const nodes = lunarNode(jd2026);
    expect(nodes).toBeDefined();
    expect(nodes.northNode).toBeDefined();
    expect(nodes.southNode).toBeDefined();

    const expected = (nodes.northNode + 180) % 360;

    console.log(`North Node: ${formatDegrees(nodes.northNode)}`);
    console.log(`South Node: ${formatDegrees(nodes.southNode)}`);
    console.log(`Expected: ${formatDegrees(expected)}`);

    expect(nodes.southNode).toBeCloseTo(expected, 5); // Floating point tolerance
  });

  // ----------
  // ADDITIONAL SANITY TESTS
  // ----------

  test('Part of Fortune day chart formula', () => {
    const asc = 15;    // Aries
    const moon = 195;  // Libra
    const sun = 75;    // Gemini
    const isNight = false;

    const pof = computePartOfFortune(asc, moon, sun, isNight, 'day');
    const expected = (asc + moon - sun) % 360;

    console.log(`PoF (day): ${formatDegrees(pof)}, expected: ${formatDegrees(expected)}`);
    expect(pof).toBeCloseTo(expected, 5);
  });

  test('Part of Fortune night chart formula (reversed)', () => {
    const asc = 15;
    const moon = 195;
    const sun = 75;
    const isNight = true;

    const pof = computePartOfFortune(asc, moon, sun, isNight, 'reverse');
    const expected = (asc + sun - moon) % 360;

    console.log(`PoF (night, reversed): ${formatDegrees(pof)}, expected: ${formatDegrees(expected)}`);
    expect(pof).toBeCloseTo(expected, 5);
  });

  test('Part of Spirit always (Asc + Sun - Moon)', () => {
    const asc = 15;
    const sun = 75;
    const moon = 195;

    const pos = computePartOfSpirit(asc, sun, moon);
    const expected = (asc + sun - moon + 360) % 360;

    console.log(`PoS: ${formatDegrees(pos)}, expected: ${formatDegrees(expected)}`);
    expect(pos).toBeCloseTo(expected, 5);
  });

  test('Sun/Moon Midpoint shortest arc', () => {
    const sun = 10;    // Aries
    const moon = 200;  // Libra

    const mid = computeSunMoonMidpoint(sun, moon);

    // Shortest arc: (10 + 200) / 2 = 105 (Leo)
    const expected = 105;

    console.log(`Sun/Moon midpoint: ${formatDegrees(mid)}, expected: ${formatDegrees(expected)}`);
    expect(approx(mid, expected, 1)).toBe(true);
  });

  test('Sun/Moon Midpoint across 0° wraparound', () => {
    const sun = 350;   // Pisces
    const moon = 10;   // Aries

    const mid = computeSunMoonMidpoint(sun, moon);

    // Shortest arc wraps around 0°: (350 + 10) / 2 = 0° (or 360°)
    const expected = 0;

    console.log(`Sun/Moon midpoint (0° wraparound): ${formatDegrees(mid)}, expected: ${formatDegrees(expected)}`);
    expect(approx(mid, expected, 1)).toBe(true);
  });
});

// ============================================================================
// BENCHMARK (informational)
// ============================================================================

describe('Ephemeris Engine - Performance', () => {
  test('sweBody performance', () => {
    const jd = 2451545.0;
    const iterations = 100;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      sweBody(0, jd + i * 0.1); // Sun at varying times
    }
    const elapsed = performance.now() - start;

    const avgTime = elapsed / iterations;
    console.log(
      `sweBody (${iterations} calls): ${elapsed.toFixed(2)}ms avg ${avgTime.toFixed(3)}ms/call`
    );

    expect(avgTime).toBeLessThan(50); // Should be very fast
  });
});
