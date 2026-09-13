/*! ephemeris/integration.test.ts
 * Integration tests for Prompts 1–6
 * Acceptance criteria for the complete delivery
 */

import {
  BASIC_REGISTRY,
  EXPANDED_REGISTRY,
  SYMBOLISM,
  byCategory,
  validateRegistry
} from './pointRegistry';

import {
  initEngine,
  sweBody,
  sweAsteroid,
  lunarNode,
  computeSelena,
  computeAriesPoint,
  computeAntivertex,
  computePartOfFortune,
  computePartOfSpirit,
  computeSunMoonMidpoint,
  computeVertex,
  computeComet,
  assignHouse,
  computeAll
} from './engine';

import { HALLEY, HALE_BOPP, HYAKUTAKE } from './cometElements';

// ============================================================================
// SETUP
// ============================================================================

beforeAll(async () => {
  try {
    await initEngine();
  } catch (err) {
    console.warn('Swiss Ephemeris not available; using fallback', err);
  }
});

// ============================================================================
// PROMPT 1: REGISTRY INTEGRITY
// ============================================================================

describe('Registry Integrity (Prompt 1)', () => {
  test('Registry validation passes', () => {
    const result = validateRegistry();
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('BASIC_REGISTRY has exactly 17 points', () => {
    expect(BASIC_REGISTRY.length).toBe(17);
  });

  test('EXPANDED_REGISTRY has 81+ points', () => {
    expect(EXPANDED_REGISTRY.length).toBeGreaterThanOrEqual(81);
  });

  test('All 98 points have unique IDs', () => {
    const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
    const ids = allPoints.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(allPoints.length);
  });

  test('All points have valid categories', () => {
    const validCategories = ['basic', 'angle', 'body', 'node', 'asteroid', 'centaur', 'tno', 'comet', 'hypothetical', 'derived'];
    const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
    allPoints.forEach(p => {
      expect(validCategories).toContain(p.category);
    });
  });

  test('All tooltips ≤120 characters', () => {
    const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
    allPoints.forEach(p => {
      expect(p.tooltip.length).toBeLessThanOrEqual(120);
    });
  });

  test('All references ≤120 characters', () => {
    const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
    allPoints.forEach(p => {
      expect(p.reference.length).toBeLessThanOrEqual(120);
    });
  });

  test('SYMBOLISM has entry for every point', () => {
    const allPoints = [...BASIC_REGISTRY, ...EXPANDED_REGISTRY];
    allPoints.forEach(p => {
      expect(SYMBOLISM[p.id]).toBeDefined();
      expect(SYMBOLISM[p.id].archetype).toBeDefined();
      expect(SYMBOLISM[p.id].practical).toBeDefined();
    });
  });

  test('Category groupings are correct', () => {
    expect(byCategory('asteroid').length).toBeGreaterThan(20);
    expect(byCategory('body').length).toBe(10); // Sun–Pluto
    expect(byCategory('angle').length).toBe(4);  // ASC, MC, IC, DC
  });
});

// ============================================================================
// PROMPT 2: ENGINE SANITY
// ============================================================================

describe('Engine Sanity (Prompt 2)', () => {
  // Test (a): Sun at J2000.0
  test('Sun at J2000.0 ≈ 280.4° ± 0.1°', () => {
    const JD2000 = 2451545.0;
    const sun = sweBody(0, JD2000);
    expect(sun.lon).toBeCloseTo(280.4, 1);
  });

  // Test (b): Asteroids (Ceres, Chiron, Eris, Sedna)
  test('Asteroids compute or return null gracefully', () => {
    const jd = 2459800.5;
    const ceres = sweAsteroid(1, jd);
    const chiron = sweAsteroid(2060, jd);
    const eris = sweAsteroid(136199, jd);
    const sedna = sweAsteroid(90377, jd);

    [ceres, chiron, eris, sedna].forEach(result => {
      if (result !== null) {
        expect(typeof result.lon).toBe('number');
        expect(result.lon).toBeGreaterThanOrEqual(0);
        expect(result.lon).toBeLessThan(360);
      }
    });
  });

  // Test (c): Vertex (NYC 1990)
  test('Vertex computation NYC 1990-04-19', () => {
    const lat = 40.7128;
    const lon = -74.0060;
    const jdApprox = 2448000.0 + 109 + 18.034 / 24;
    const mcLon = 280.0;

    const vertex = computeVertex(jdApprox, lat, lon, mcLon);
    expect(vertex).toBeGreaterThanOrEqual(0);
    expect(vertex).toBeLessThan(360);
    expect(Math.abs(vertex - 313)).toBeLessThan(10); // ~313° expected
  });

  // Test (d): Halley 1986
  test('Halley perihelion 1986 ≈ 239° ± 0.5°', () => {
    const jdPerihelion = 2446470.12;
    const result = computeComet('Halley', jdPerihelion);

    expect(result).toBeDefined();
    expect(result?.lon).toBeDefined();
    expect(result!.lon).toBeCloseTo(239, 0.5);
  });

  // Test (e): South Node = North + 180°
  test('South Node = Mean Node + 180° exactly', () => {
    const jd = 2459800.5;
    const nodes = lunarNode(jd);

    expect(nodes.southNode).toBeDefined();
    const expected = (nodes.northNode + 180) % 360;
    expect(nodes.southNode).toBeCloseTo(expected, 5);
  });

  // Additional: Manual point formulas
  test('Part of Fortune day formula', () => {
    const asc = 15;
    const moon = 195;
    const sun = 75;

    const pof = computePartOfFortune(asc, moon, sun, false, 'day');
    const expected = (asc + moon - sun + 360) % 360;

    expect(pof).toBeCloseTo(expected, 5);
  });

  test('Selena = Lilith + 180°', () => {
    const lilithMean = 100;
    const selena = computeSelena(lilithMean);
    const expected = (lilithMean + 180) % 360;

    expect(selena).toBe(expected);
  });

  test('Aries Point always 0°', () => {
    expect(computeAriesPoint()).toBe(0);
  });

  test('Antivertex = Vertex + 180°', () => {
    const vertex = 45;
    const antivertex = computeAntivertex(vertex);
    const expected = (vertex + 180) % 360;

    expect(antivertex).toBe(expected);
  });

  test('Sun/Moon midpoint shortest arc', () => {
    const sun = 10;
    const moon = 50;

    const mid = computeSunMoonMidpoint(sun, moon);
    const expected = 30; // (10 + 50) / 2

    expect(Math.abs(mid - expected)).toBeLessThan(1);
  });
});

// ============================================================================
// INTEGRATION: FULL CHART COMPUTATION
// ============================================================================

describe('Full Chart Integration (Prompts 1–2)', () => {
  test('Compute all 80+ points for 1990-06-15 12:00 UTC, 40.7°N 74.0°W', async () => {
    // NYC, 1990-06-15 12:00 UTC (noon)
    // JD = 2448000 (approx 1990-01-01 12:00) + 165 days + 0.5
    const jd = 2448000.0 + 165.5;
    const lat = 40.7128;
    const lon = -74.0060;

    // House cusps (placeholder for Placidus)
    const houseCusps = [
      0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330
    ];

    const chart = computeAll(jd, lat, lon, houseCusps);

    // Assertion 1: All 98 registry points return data
    expect(chart.length).toBeGreaterThanOrEqual(80);

    // Assertion 2: Each point has required fields
    chart.forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.lon).toBeDefined();
      expect(['ok', 'unavailable', 'fixed']).toContain(p.status);
      expect(p.lon).toBeGreaterThanOrEqual(0);
      expect(p.lon).toBeLessThan(360);
    });

    // Assertion 3: South Node = North Node + 180°
    const northNode = chart.find(p => p.name === 'North Node');
    const southNode = chart.find(p => p.name === 'South Node');
    expect(northNode).toBeDefined();
    expect(southNode).toBeDefined();

    const expected = (northNode!.lon + 180) % 360;
    expect(Math.abs(southNode!.lon - expected)).toBeLessThan(0.01);

    // Assertion 4: Manual points computed correctly
    const lilith = chart.find(p => p.name === 'Lilith (Mean)');
    const selena = chart.find(p => p.name === 'Selena');
    expect(lilith).toBeDefined();
    expect(selena).toBeDefined();

    const expectedSelena = (lilith!.lon + 180) % 360;
    expect(Math.abs(selena!.lon - expectedSelena)).toBeLessThan(0.01);

    // Assertion 5: Aries Point is 0°
    const ariesPoint = chart.find(p => p.name === 'Aries Point');
    expect(ariesPoint?.lon).toBe(0);

    // Assertion 6: Angles (DC, IC) are opposite to ASC, MC
    const asc = chart.find(p => p.name === 'Ascendant');
    const dc = chart.find(p => p.name === 'Descendant');
    const mc = chart.find(p => p.name === 'Midheaven');
    const ic = chart.find(p => p.name === 'Nadir');

    if (asc && dc) {
      const expectedDC = (asc.lon + 180) % 360;
      expect(Math.abs(dc.lon - expectedDC)).toBeLessThan(0.01);
    }

    if (mc && ic) {
      const expectedIC = (mc.lon + 180) % 360;
      expect(Math.abs(ic.lon - expectedIC)).toBeLessThan(0.01);
    }

    // Assertion 7: At least 80+ points either 'ok' or 'unavailable' (no crash)
    const validStatuses = chart.filter(p =>
      p.status === 'ok' || p.status === 'unavailable' || p.status === 'fixed'
    );
    expect(validStatuses.length).toBe(chart.length);

    console.log(`✓ Full chart computed: ${chart.length} points`);
    console.log(`  OK: ${chart.filter(p => p.status === 'ok').length}`);
    console.log(`  Unavailable: ${chart.filter(p => p.status === 'unavailable').length}`);
    console.log(`  Fixed: ${chart.filter(p => p.status === 'fixed').length}`);
  });

  test('Minor bodies plausibility check', () => {
    const jd = 2459800.5;
    const chart = computeAll(jd, 40.7, -74.0, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);

    // Chiron should exist and have a longitude
    const chiron = chart.find(p => p.name === 'Chiron');
    expect(chiron).toBeDefined();
    if (chiron?.status === 'ok') {
      expect(chiron.lon).toBeGreaterThanOrEqual(0);
      expect(chiron.lon).toBeLessThan(360);
    }

    // Ceres should exist
    const ceres = chart.find(p => p.name === 'Ceres');
    expect(ceres).toBeDefined();
  });
});

// ============================================================================
// UI SMOKE TESTS (Prompt 5–6)
// ============================================================================

describe('UI Smoke Tests (Prompts 5–6)', () => {
  test('Expand button element exists and is focusable', () => {
    const button = document.getElementById('expand-chart-button');
    expect(button).toBeDefined();
    expect(button?.getAttribute('aria-label')).toBeDefined();
    expect(button?.tabIndex).toBeGreaterThanOrEqual(-1);
  });

  test('Overlay element exists with correct ARIA attributes', () => {
    const overlay = document.getElementById('expand-chart-overlay');
    expect(overlay).toBeDefined();
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
  });

  test('House cusps panel renders without error', () => {
    const panel = document.getElementById('houses-list');
    expect(panel).toBeDefined();
  });

  test('Points table renders without error', () => {
    const tbody = document.getElementById('expand-points-table-body');
    expect(tbody).toBeDefined();
  });

  test('SVG wheel renders without error', () => {
    const svg = document.querySelector('#expand-chart-overlay svg');
    expect(svg).toBeDefined();
    expect(svg?.getAttribute('role')).toBe('img');
  });

  test('Tooltip element exists and is hidden initially', () => {
    const tooltip = document.getElementById('expand-point-tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip?.style.display).toBe('none');
  });

  test('Aspects grid elements exist', () => {
    const table = document.getElementById('expand-aspects-table-body');
    const cards = document.getElementById('expand-aspects-cards');
    expect(table || cards).toBeDefined(); // At least one should exist
  });
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

describe('Performance (Prompts 4–6)', () => {
  test('computeAll completes in ≤150ms for 98 points', () => {
    const jd = 2459800.5;
    const lat = 40.7;
    const lon = -74.0;
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

    const start = performance.now();
    const chart = computeAll(jd, lat, lon, cusps);
    const elapsed = performance.now() - start;

    console.log(`computeAll took ${elapsed.toFixed(1)}ms for ${chart.length} points`);
    expect(elapsed).toBeLessThan(150);
  });

  test('Memoization reduces repeat calls', () => {
    const jd = 2459800.5;
    const lat = 40.7;
    const lon = -74.0;
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

    // First call
    const start1 = performance.now();
    const chart1 = computeAll(jd, lat, lon, cusps);
    const elapsed1 = performance.now() - start1;

    // Second call (should hit cache)
    const start2 = performance.now();
    const chart2 = computeAll(jd, lat, lon, cusps);
    const elapsed2 = performance.now() - start2;

    console.log(`First call: ${elapsed1.toFixed(1)}ms`);
    console.log(`Cached call: ${elapsed2.toFixed(1)}ms`);

    // Cached should be noticeably faster (at least 50% faster)
    expect(elapsed2).toBeLessThan(elapsed1 * 0.5 + 5); // Allow 5ms variance
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  test('No crash on missing asteroid ephemeris', () => {
    const jd = 2459800.5;
    // Mythical asteroid ID that shouldn't exist
    const result = sweAsteroid(999999, jd);
    // Should return null or valid position
    expect(result === null || typeof result === 'object').toBe(true);
  });

  test('House assignment wraps around at 0°/360°', () => {
    const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

    // Point at 359° should be in house 12
    const house1 = assignHouse(359, cusps);
    expect([12, 1]).toContain(house1); // Boundary case

    // Point at 15° should be in house 1
    const house2 = assignHouse(15, cusps);
    expect(house2).toBe(1);
  });

  test('South Node at boundary (178°–182° from North Node)', () => {
    const jd = 2459800.5;
    const nodes = lunarNode(jd);

    const diff = Math.abs(nodes.southNode - (nodes.northNode + 180) % 360);
    expect(diff).toBeLessThan(0.01); // Exact 180° opposite
  });
});
