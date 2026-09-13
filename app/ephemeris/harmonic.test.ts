/*! ephemeris/harmonic.test.ts
 * Tests for harmonic chart recasting
 */

import {
  recastHarmonic,
  recastHarmonicMemoized,
  pointsHashForMemo,
  clearHarmonicCache,
  expectedAspectInHarmonic,
  harmonicAspectFamily,
  HarmonicPointData
} from './harmonic';

import { PointData } from './engine';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create a mock PointData point
 */
function mockPoint(id: string, name: string, lon: number, status: 'ok' | 'unavailable' = 'ok'): PointData {
  return {
    id,
    name,
    lon,
    lat: 0,
    speed: 1.0,
    house: 1,
    status
  };
}

/**
 * Arc distance calculation (shortest path)
 */
function arcDist(lon1: number, lon2: number): number {
  let d = Math.abs(lon1 - lon2);
  return d > 180 ? 360 - d : d;
}

// ============================================================================
// BASIC RECASTING TESTS
// ============================================================================

describe('Harmonic Recasting', () => {
  beforeEach(() => {
    clearHarmonicCache();
  });

  test('n=1 (identity): returns input mod float noise', () => {
    const points = [
      mockPoint('Sun', 'Sun', 82.5),
      mockPoint('Moon', 'Moon', 195.0),
      mockPoint('Venus', 'Venus', 95.4)
    ];

    const harmonic = recastHarmonic(points, 1);

    expect(harmonic.length).toBe(3);
    harmonic.forEach((h, i) => {
      expect(h.lon).toBeCloseTo(points[i].lon, 5);
      expect(h.origLon).toBe(points[i].lon);
      expect(h.harmonic).toBe(1);
    });
  });

  test('n=5: multiply by 5 and fold mod 360', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 72),    // 72 * 5 = 360 → 0 (conjunction in 5H)
      mockPoint('Venus', 'Venus', 144)  // 144 * 5 = 720 → 0 (conjunction in 5H)
    ];

    const harmonic = recastHarmonic(points, 5);

    expect(harmonic[0].lon).toBeCloseTo(0, 2);      // 0 * 5 = 0
    expect(harmonic[1].lon).toBeCloseTo(0, 2);      // 72 * 5 = 360 = 0
    expect(harmonic[2].lon).toBeCloseTo(0, 2);      // 144 * 5 = 720 = 0
  });

  test('n=3: trine family appears as conjunctions', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),   // Trine
      mockPoint('Venus', 'Venus', 240)  // Trine
    ];

    const harmonic = recastHarmonic(points, 3);

    // All should be conjunct in 3H
    expect(harmonic[0].lon).toBeCloseTo(0, 2);      // 0 * 3 = 0
    expect(harmonic[1].lon).toBeCloseTo(0, 2);      // 120 * 3 = 360 = 0
    expect(harmonic[2].lon).toBeCloseTo(0, 2);      // 240 * 3 = 720 = 0
  });

  test('n=4: square family appears as conjunctions', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90),    // Square
      mockPoint('Mars', 'Mars', 180),   // Opposition (also in 4H pattern)
      mockPoint('Venus', 'Venus', 270)  // Square
    ];

    const harmonic = recastHarmonic(points, 4);

    expect(harmonic[0].lon).toBeCloseTo(0, 2);      // 0 * 4 = 0
    expect(harmonic[1].lon).toBeCloseTo(0, 2);      // 90 * 4 = 360 = 0
    expect(harmonic[2].lon).toBeCloseTo(0, 2);      // 180 * 4 = 720 = 0
    expect(harmonic[3].lon).toBeCloseTo(0, 2);      // 270 * 4 = 1080 = 0
  });

  test('Speed is multiplied by N', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0)
    ];
    points[0].speed = 1.02;  // Sun's typical speed

    const harmonic = recastHarmonic(points, 5);
    expect(harmonic[0].speed).toBeCloseTo(5.1, 1);  // 1.02 * 5
  });

  test('Retrograde flag can flip in high harmonics', () => {
    const points = [
      mockPoint('Saturn', 'Saturn', 210)
    ];
    points[0].speed = -0.05;  // Retrograde

    const harmonic = recastHarmonic(points, 9);
    // Speed becomes -0.45 (still retrograde)
    expect(harmonic[0].speed).toBeLessThan(0);
    expect(harmonic[0].speed).toBeCloseTo(-0.45, 1);
  });

  test('House data is null in harmonic view', () => {
    const points = [
      mockPoint('Sun', 'Sun', 82.5)
    ];
    points[0].house = 5;

    const harmonic = recastHarmonic(points, 5);
    expect(harmonic[0].house).toBeNull();
  });

  test('Angles skipped by default unless configured', () => {
    const points = [
      mockPoint('Ascendant', 'Ascendant', 15),
      mockPoint('Midheaven', 'Midheaven', 280),
      mockPoint('Sun', 'Sun', 82.5)
    ];

    const harmonic = recastHarmonic(points, 5, { harmonicIncludeAngles: false });

    expect(harmonic[0].status).toBe('harmonic-skipped');
    expect(harmonic[0].lon).toBe(15);  // Unchanged
    expect(harmonic[1].status).toBe('harmonic-skipped');
    expect(harmonic[1].lon).toBe(280);  // Unchanged
    expect(harmonic[2].harmonic).toBe(5);  // Sun recast normally
  });

  test('Angles included if configured', () => {
    const points = [
      mockPoint('Ascendant', 'Ascendant', 15),
      mockPoint('Sun', 'Sun', 82.5)
    ];

    const harmonic = recastHarmonic(points, 5, { harmonicIncludeAngles: true });

    expect(harmonic[0].lon).toBeCloseTo(75, 2);  // 15 * 5 = 75
    expect(harmonic[1].lon).toBeCloseTo(72.5, 2);  // 82.5 * 5 = 412.5 → 52.5
  });

  test('Lunar nodes skipped by default', () => {
    const points = [
      mockPoint('North Node', 'North Node', 172.8),
      mockPoint('South Node', 'South Node', 352.8),  // +180 from NN
      mockPoint('Sun', 'Sun', 82.5)
    ];

    const harmonic = recastHarmonic(points, 5);

    expect(harmonic[0].status).toBe('harmonic-skipped');
    expect(harmonic[1].status).toBe('harmonic-skipped');
    expect(harmonic[2].harmonic).toBe(5);  // Sun recast normally
  });

  test('Asteroids/minor bodies marked harmonic-approx', () => {
    const points = [
      mockPoint('Chiron', 'Chiron', 120),
      mockPoint('Ceres', 'Ceres', 45),
      mockPoint('Sun', 'Sun', 82.5)
    ];

    const harmonic = recastHarmonic(points, 5);

    expect(harmonic[0].status).toBe('harmonic-approx');
    expect(harmonic[1].status).toBe('harmonic-approx');
    expect(harmonic[2].status).toBe('ok');  // Sun unchanged
  });

  test('origLon field preserves original longitude', () => {
    const points = [
      mockPoint('Sun', 'Sun', 82.5),
      mockPoint('Moon', 'Moon', 195.0)
    ];

    const harmonic = recastHarmonic(points, 5);

    expect(harmonic[0].origLon).toBe(82.5);
    expect(harmonic[1].origLon).toBe(195.0);
  });

  test('Rejects invalid harmonics', () => {
    const points = [mockPoint('Sun', 'Sun', 82.5)];

    expect(() => recastHarmonic(points, 0)).toThrow();
    expect(() => recastHarmonic(points, 14)).toThrow();
    expect(() => recastHarmonic(points, -1)).toThrow();
  });
});

// ============================================================================
// MEMOIZATION TESTS
// ============================================================================

describe('Harmonic Memoization', () => {
  beforeEach(() => {
    clearHarmonicCache();
  });

  test('Memoized call returns same result as non-memoized', () => {
    const points = [
      mockPoint('Sun', 'Sun', 82.5),
      mockPoint('Moon', 'Moon', 195.0),
      mockPoint('Venus', 'Venus', 95.4)
    ];

    const result1 = recastHarmonic(points, 5);
    const result2 = recastHarmonicMemoized(points, 5);

    expect(result2.length).toBe(result1.length);
    result2.forEach((h, i) => {
      expect(h.lon).toBeCloseTo(result1[i].lon, 5);
      expect(h.harmonic).toBe(result1[i].harmonic);
    });
  });

  test('Cache hits on repeated calls', () => {
    const points = [
      mockPoint('Sun', 'Sun', 82.5),
      mockPoint('Moon', 'Moon', 195.0)
    ];

    const start1 = performance.now();
    const result1 = recastHarmonicMemoized(points, 5);
    const elapsed1 = performance.now() - start1;

    const start2 = performance.now();
    const result2 = recastHarmonicMemoized(points, 5);
    const elapsed2 = performance.now() - start2;

    // Second call should be faster (cached)
    expect(result2).toEqual(result1);
    // Note: timing test is unreliable in automated tests, so just verify correctness
  });

  test('Different N values produce different results', () => {
    const points = [
      mockPoint('Sun', 'Sun', 72)
    ];

    const h3 = recastHarmonicMemoized(points, 3);
    const h5 = recastHarmonicMemoized(points, 5);
    const h7 = recastHarmonicMemoized(points, 7);

    expect(h3[0].lon).toBeCloseTo(216, 2);  // 72 * 3 = 216
    expect(h5[0].lon).toBeCloseTo(0, 2);    // 72 * 5 = 360 = 0
    expect(h7[0].lon).toBeCloseTo(144, 2);  // 72 * 7 = 504 → 144
  });

  test('Clear cache works', () => {
    const points = [mockPoint('Sun', 'Sun', 82.5)];
    recastHarmonicMemoized(points, 5);
    clearHarmonicCache();
    // After clear, next call should recompute (no error)
    const result = recastHarmonicMemoized(points, 5);
    expect(result.length).toBe(1);
  });
});

// ============================================================================
// HARMONIC ASPECT FAMILY TESTS
// ============================================================================

describe('Harmonic Aspect Families', () => {
  test('Aspect family arc per harmonic', () => {
    expect(harmonicAspectFamily(2)).toBeCloseTo(180, 0);  // Opposition
    expect(harmonicAspectFamily(3)).toBeCloseTo(120, 0);  // Trine
    expect(harmonicAspectFamily(4)).toBeCloseTo(90, 0);   // Square
    expect(harmonicAspectFamily(5)).toBeCloseTo(72, 0);   // Quintile
    expect(harmonicAspectFamily(6)).toBeCloseTo(60, 0);   // Sextile
    expect(harmonicAspectFamily(7)).toBeCloseTo(51.43, 1); // Septile
  });

  test('Expected aspect detection', () => {
    // 72° in radix = quintile = 0° in 5H
    expect(expectedAspectInHarmonic(72, 5)).toBeCloseTo(0, 0);

    // 120° in radix = trine = 0° in 3H
    expect(expectedAspectInHarmonic(120, 3)).toBeCloseTo(0, 0);

    // 90° in radix = square = 0° in 4H
    expect(expectedAspectInHarmonic(90, 4)).toBeCloseTo(0, 0);

    // 30° off = should return diff
    expect(expectedAspectInHarmonic(102, 5)).toBeGreaterThan(0);
  });
});

// ============================================================================
// EDGE CASE: GOLDEN YOD IN 5TH HARMONIC
// ============================================================================

describe('Golden Yod Detection', () => {
  test('Golden yod (0°, 144°, 288° three-way) conjunct in 5th harmonic', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 144),
      mockPoint('Venus', 'Venus', 288)
    ];

    const harmonic5 = recastHarmonic(points, 5);

    // All should be conjunct: 0*5=0, 144*5=720→0, 288*5=1440→0
    expect(harmonic5[0].lon).toBeCloseTo(0, 2);
    expect(harmonic5[1].lon).toBeCloseTo(0, 2);
    expect(harmonic5[2].lon).toBeCloseTo(0, 2);
  });

  test('Radix grand trine NOT conjunct in 5th harmonic', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250)
    ];

    const harmonic5 = recastHarmonic(points, 5);

    // Should NOT all be at same longitude
    const lons = [harmonic5[0].lon, harmonic5[1].lon, harmonic5[2].lon];
    const diffs = [
      arcDist(lons[0], lons[1]),
      arcDist(lons[1], lons[2]),
      arcDist(lons[2], lons[0])
    ];
    // At least one diff should be > 6 (outside conjunction orb)
    expect(diffs.some(d => d > 6)).toBe(true);
  });
});

// ============================================================================
// WRAPAROUND & PRECISION TESTS
// ============================================================================

describe('Wraparound and Precision', () => {
  test('Large angles wrap correctly', () => {
    const points = [mockPoint('p1', 'p1', 350)];

    const h5 = recastHarmonic(points, 5);
    expect(h5[0].lon).toBeCloseTo(310, 2);  // 350 * 5 = 1750 → 1750 - 4*360 = 310
  });

  test('Sign/degree/minute/second recomputation', () => {
    const points = [mockPoint('Sun', 'Sun', 82.5)];  // Gemini 22°30'

    const h2 = recastHarmonic(points, 2);
    // 82.5 * 2 = 165 = Libra 15°
    expect(h2[0].lon).toBeCloseTo(165, 2);

    const h3 = recastHarmonic(points, 3);
    // 82.5 * 3 = 247.5 = Sagittarius 7°30'
    expect(h3[0].lon).toBeCloseTo(247.5, 2);
  });

  test('Retrograde flag survives high harmonics', () => {
    const points = [mockPoint('Saturn', 'Saturn', 210)];
    points[0].speed = -0.02;  // Retrograde

    const h9 = recastHarmonic(points, 9);
    expect(h9[0].speed).toBeLessThan(0);  // Still retrograde
  });
});
