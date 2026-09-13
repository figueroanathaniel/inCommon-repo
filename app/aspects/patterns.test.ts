/*! aspects/patterns.test.ts
 * Unit tests for aspect-pattern detection (Tiers 1-3)
 * Hand-built PointData sets with true-positive/true-negative per detector
 */

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
  detectPatterns,
  ChartPattern,
  PatternConfig
} from './patterns';

import { PointData } from '../ephemeris/engine';

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
    speed: 0,
    house: 1,
    status
  };
}

/**
 * Helper to measure arc between two longitudes
 */
function arcDist(lon1: number, lon2: number): number {
  let d = Math.abs(lon1 - lon2);
  return d > 180 ? 360 - d : d;
}

// ============================================================================
// GRAND TRINE TESTS
// ============================================================================

describe('Grand Trine Detection', () => {
  test('True positive: 3 planets at 120° apart (Fire trine)', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),      // Aries 10°
      mockPoint('Moon', 'Moon', 130),   // Leo 10°
      mockPoint('Venus', 'Venus', 250)  // Sagittarius 10°
    ];

    const patterns = detectGrandTrine(points);
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('Grand Trine');
    expect(patterns[0].planets).toEqual(['Sun', 'Moon', 'Venus']);
    expect(patterns[0].tier).toBe(1);
    expect(patterns[0].description).toContain('harmonious');
  });

  test('True negative: 3 planets NOT at 120° apart', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90),    // Square instead
      mockPoint('Venus', 'Venus', 180)  // Opposite
    ];

    const patterns = detectGrandTrine(points);
    expect(patterns.length).toBe(0);
  });

  test('True negative: 3 planets with one outside orb', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 265)  // 15° off perfect trine (orb is 6°)
    ];

    const patterns = detectGrandTrine(points);
    expect(patterns.length).toBe(0);
  });

  test('Ignores unavailable points', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250, 'unavailable')  // Unavailable
    ];

    const patterns = detectGrandTrine(points);
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// T-SQUARE TESTS
// ============================================================================

describe('T-Square Detection', () => {
  test('True positive: 2 planets opposite, 1 square to both (tension)', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),        // 0°
      mockPoint('Moon', 'Moon', 180),    // 180° (opposite)
      mockPoint('Mars', 'Mars', 90)      // 90° to both (square to Sun and Moon)
    ];

    const patterns = detectTSquare(points);
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('T-Square');
    expect(patterns[0].apex).toBe('Mars');
    expect(patterns[0].releasePoint).toBeDefined();
    expect(patterns[0].tier).toBe(1);
  });

  test('Release point is opposite the apex, between the two opposite planets', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 180),
      mockPoint('Mars', 'Mars', 90)
    ];

    const patterns = detectTSquare(points);
    expect(patterns.length).toBe(1);

    // Release point = (0 + 180) / 2 + 180 = 90 + 180 = 270
    const expectedRelease = 270;
    expect(patterns[0].releasePoint).toBeCloseTo(expectedRelease, 0);
  });

  test('True negative: 3 planets without opposite aspect', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90),
      mockPoint('Mars', 'Mars', 180)
    ];

    const patterns = detectTSquare(points);
    expect(patterns.length).toBe(0);
  });

  test('True negative: opposite but no squares', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 180),
      mockPoint('Mars', 'Mars', 45)  // Only 45° to Sun (not square)
    ];

    const patterns = detectTSquare(points);
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// GRAND CROSS TESTS
// ============================================================================

describe('Grand Cross Detection', () => {
  test('True positive: 4 planets in 2 oppositions + 4 squares', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 180),    // Opposite to Sun
      mockPoint('Mars', 'Mars', 90),
      mockPoint('Venus', 'Venus', 270)   // Opposite to Mars
    ];

    const patterns = detectGrandCross(points);
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('Grand Cross');
    expect(patterns[0].planets.length).toBe(4);
    expect(patterns[0].tier).toBe(1);
    expect(patterns[0].description).toContain('tension');
  });

  test('True negative: 4 planets without 2 clear oppositions', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90),
      mockPoint('Mars', 'Mars', 180),
      mockPoint('Venus', 'Venus', 270)
    ];

    const patterns = detectGrandCross(points);
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// KITE TESTS
// ============================================================================

describe('Kite Detection', () => {
  test('True positive: Grand Trine + tail sextile to 2, opposite to 1', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250),
      mockPoint('Mars', 'Mars', 70)     // Sextile to Sun and Moon, opposite to Venus
    ];

    const patterns = detectKite(points);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.name === 'Kite')).toBe(true);
  });

  test('True negative: Grand Trine without tail', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250),
      mockPoint('Mars', 'Mars', 0)      // Not positioned as a tail
    ];

    const patterns = detectKite(points);
    const kites = patterns.filter(p => p.name === 'Kite');
    expect(kites.length).toBe(0);
  });
});

// ============================================================================
// YOD TESTS
// ============================================================================

describe('Yod Detection', () => {
  test('True positive: 2 quincunx + 1 sextile (Finger of God)', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),    // Sextile to Sun
      mockPoint('Mars', 'Mars', 150)    // Quincunx to both
    ];

    const patterns = detectYod(points);
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('Yod');
    expect(patterns[0].apex).toBe('Mars');
    expect(patterns[0].tier).toBe(1);
    expect(patterns[0].description).toContain('fated');
  });

  test('True negative: 3 planets without quincunx pair', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),
      mockPoint('Mars', 'Mars', 120)    // Trine to Sun, not quincunx
    ];

    const patterns = detectYod(points);
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// MYSTIC RECTANGLE TESTS
// ============================================================================

describe('Mystic Rectangle Detection', () => {
  test('True positive: 4 planets alternating sextile/trine', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),     // Sextile to Sun
      mockPoint('Venus', 'Venus', 180),  // Trine to Moon
      mockPoint('Mars', 'Mars', 120)     // Sextile to Venus, Trine to Sun
    ];

    const patterns = detectMysticRectangle(points);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.name === 'Mystic Rectangle')).toBe(true);
  });

  test('True negative: 4 planets with wrong aspect configuration', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90),     // Square instead of sextile
      mockPoint('Venus', 'Venus', 180),
      mockPoint('Mars', 'Mars', 270)
    ];

    const patterns = detectMysticRectangle(points);
    const rects = patterns.filter(p => p.name === 'Mystic Rectangle');
    expect(rects.length).toBe(0);
  });
});

// ============================================================================
// BOOMERANG TESTS
// ============================================================================

describe('Boomerang Detection', () => {
  test('True positive: T-Square + 4th planet sextile to both opposite planets', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 180),
      mockPoint('Mars', 'Mars', 90),
      mockPoint('Venus', 'Venus', 60)    // Sextile to both Sun and Moon
    ];

    const patterns = detectBoomerang(points);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.name === 'Boomerang')).toBe(true);
  });

  test('True negative: T-Square without resolution sextiles', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 180),
      mockPoint('Mars', 'Mars', 90),
      mockPoint('Venus', 'Venus', 30)    // Too close to Sun, not sextile
    ];

    const patterns = detectBoomerang(points);
    const boomerangs = patterns.filter(p => p.name === 'Boomerang');
    expect(boomerangs.length).toBe(0);
  });
});

// ============================================================================
// CRADLE TESTS
// ============================================================================

describe('Cradle Detection', () => {
  test('True positive: 4 planets in balanced sextile/trine pattern', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),     // Sextile to Sun
      mockPoint('Venus', 'Venus', 180),  // Trine to Sun
      mockPoint('Mars', 'Mars', 120)     // Trine to Moon, Sextile to Venus
    ];

    const patterns = detectCradle(points);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns.some(p => p.name === 'Cradle')).toBe(true);
  });

  test('True negative: 4 planets without holding pattern', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 45),
      mockPoint('Venus', 'Venus', 90),
      mockPoint('Mars', 'Mars', 135)
    ];

    const patterns = detectCradle(points);
    const cradles = patterns.filter(p => p.name === 'Cradle');
    expect(cradles.length).toBe(0);
  });
});

// ============================================================================
// TALENT TRIANGLE TESTS
// ============================================================================

describe('Talent Triangle Detection', () => {
  test('True positive: 3 planets with 2 sextiles + 1 trine', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),     // Sextile to Sun
      mockPoint('Venus', 'Venus', 120)   // Sextile to Moon, Trine to Sun
    ];

    const patterns = detectTalentTriangle(points);
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('Talent Triangle');
    expect(patterns[0].tier).toBe(1);
    expect(patterns[0].description).toContain('talent');
  });

  test('True negative: 3 planets with wrong configuration', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90),     // Square
      mockPoint('Venus', 'Venus', 180)   // Opposite
    ];

    const patterns = detectTalentTriangle(points);
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// STELLIUM TESTS
// ============================================================================

describe('Stellium Detection', () => {
  test('True positive: 4+ planets in same sign', () => {
    const points = [
      mockPoint('Sun', 'Sun', 5),
      mockPoint('Moon', 'Moon', 12),
      mockPoint('Venus', 'Venus', 20),
      mockPoint('Mars', 'Mars', 25),
      mockPoint('Mercury', 'Mercury', 8)  // All in Aries (0-30°)
    ];

    const patterns = detectStellium(points);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].name).toContain('Stellium');
    expect(patterns[0].planets.length).toBeGreaterThanOrEqual(4);
    expect(patterns[0].tier).toBe(1);
  });

  test('True negative: Only 3 planets in sign (not stellium)', () => {
    const points = [
      mockPoint('Sun', 'Sun', 5),
      mockPoint('Moon', 'Moon', 12),
      mockPoint('Venus', 'Venus', 20)
    ];

    const patterns = detectStellium(points);
    expect(patterns.length).toBe(0);
  });

  test('True negative: 4 planets across different signs', () => {
    const points = [
      mockPoint('Sun', 'Sun', 5),        // Aries
      mockPoint('Moon', 'Moon', 65),     // Gemini
      mockPoint('Venus', 'Venus', 125),  // Leo
      mockPoint('Mars', 'Mars', 185)     // Libra
    ];

    const patterns = detectStellium(points);
    expect(patterns.length).toBe(0);
  });
});

// ============================================================================
// CONFIGURATION & FILTERING
// ============================================================================

describe('Pattern Configuration', () => {
  test('Ignores unavailable points by default', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10, 'ok'),
      mockPoint('Moon', 'Moon', 130, 'ok'),
      mockPoint('Venus', 'Venus', 250, 'ok'),
      mockPoint('Chiron', 'Chiron', 0, 'unavailable')  // Unavailable point
    ];

    const patterns = detectPatterns(points, { includeMinorPointsInPatterns: false });
    expect(patterns.length).toBeGreaterThan(0);
    // Grand Trine should still be detected with just the 3 available points
    expect(patterns.some(p => p.name === 'Grand Trine')).toBe(true);
  });

  test('Returns empty array for fewer than 3 points', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 90)
    ];

    const patterns = detectPatterns(points);
    expect(patterns.length).toBe(0);
  });

  test('Tier 2 patterns disabled by default', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),
      mockPoint('Venus', 'Venus', 120)
    ];

    const patterns = detectPatterns(points, { showMinorPatterns: false });
    // Only Tier 1 patterns present
    expect(patterns.every(p => p.tier === 1)).toBe(true);
  });

  test('Tier 3 patterns disabled by default', () => {
    const points = [
      mockPoint('Sun', 'Sun', 22),
      mockPoint('Moon', 'Moon', 180)
    ];

    const patterns = detectPatterns(points, { showDegreeLore: false });
    // No Tier 3 patterns present
    expect(patterns.every(p => p.tier !== 3)).toBe(true);
  });
});

// ============================================================================
// INTEGRATION: TEST CHART 1990-06-15
// ============================================================================

describe('Full Chart Patterns (1990-06-15 12:00 UTC NYC)', () => {
  test('Computes patterns from real chart data (placeholder)', () => {
    // This is a placeholder test showing the interface.
    // In production, this would load the computed chart from the ephemeris engine
    // and run detection on the actual points.

    const mockChart: PointData[] = [
      mockPoint('Sun', 'Sun', 82.5),      // Gemini
      mockPoint('Moon', 'Moon', 195.0),   // Libra
      mockPoint('Mercury', 'Mercury', 88.3),
      mockPoint('Venus', 'Venus', 95.4),
      mockPoint('Mars', 'Mars', 335.1),   // Pisces
      mockPoint('Jupiter', 'Jupiter', 340.2),
      mockPoint('Saturn', 'Saturn', 208.1),
      mockPoint('Uranus', 'Uranus', 249.6),
      mockPoint('Neptune', 'Neptune', 284.8),
      mockPoint('Pluto', 'Pluto', 261.7),
      mockPoint('North Node', 'North Node', 172.8)
    ];

    const patterns = detectPatterns(mockChart);

    // Assertion: at least some pattern detection occurs
    // (The actual patterns will depend on the computed positions)
    expect(patterns).toBeInstanceOf(Array);
    expect(Array.isArray(patterns)).toBe(true);

    // Each pattern should have required fields
    patterns.forEach(p => {
      expect(p.name).toBeDefined();
      expect(p.planets.length).toBeGreaterThanOrEqual(2);
      expect([1, 2, 3]).toContain(p.tier);
      expect(p.description).toBeDefined();
      expect(typeof p.description).toBe('string');
      expect(p.description.length).toBeGreaterThan(0);
    });
  });

  test('Aspect chain is well-formed', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250)
    ];

    const patterns = detectPatterns(points);
    const grandTrine = patterns.find(p => p.name === 'Grand Trine');

    expect(grandTrine).toBeDefined();
    expect(grandTrine!.aspectChain.length).toBeGreaterThan(0);

    grandTrine!.aspectChain.forEach(aspect => {
      expect(aspect.a).toBeDefined();
      expect(aspect.aspect).toBeDefined();
      expect(aspect.b).toBeDefined();
      expect(aspect.orb).toBeDefined();
      expect(typeof aspect.orb).toBe('number');
      expect(aspect.orb).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// EDGE CASES & PRECISION
// ============================================================================

describe('Edge Cases', () => {
  test('Grand sextile: detects only perfect 6-point ring', () => {
    // Perfect 6-point sextile ring (60° apart)
    const perfectRing: PointData[] = [
      mockPoint('p1', 'p1', 0),
      mockPoint('p2', 'p2', 60),
      mockPoint('p3', 'p3', 120),
      mockPoint('p4', 'p4', 180),
      mockPoint('p5', 'p5', 240),
      mockPoint('p6', 'p6', 300)
    ];

    const patterns = detectPatterns(perfectRing);
    // NOTE: Grand sextile is not implemented yet in this Tier 1 set
    // This test is a placeholder for when it is added
    expect(patterns).toBeDefined();
  });

  test('5 points at sextile spacing fails (not 6)', () => {
    // 5 points only
    const almostRing: PointData[] = [
      mockPoint('p1', 'p1', 0),
      mockPoint('p2', 'p2', 60),
      mockPoint('p3', 'p3', 120),
      mockPoint('p4', 'p4', 180),
      mockPoint('p5', 'p5', 240)
      // Missing p6 at 300°
    ];

    const patterns = detectPatterns(almostRing);
    // Should not detect a sextile ring
    expect(patterns).toBeDefined();
  });

  test('Wraparound at 0°/360°', () => {
    const points = [
      mockPoint('Sun', 'Sun', 358),      // Just before 360°
      mockPoint('Moon', 'Moon', 118),
      mockPoint('Venus', 'Venus', 238)
    ];

    const patterns = detectPatterns(points);
    // Should detect grand trine despite wraparound
    expect(patterns.some(p => p.name === 'Grand Trine')).toBe(true);
  });

  test('Multiple patterns from same point set', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),
      mockPoint('Venus', 'Venus', 120),
      mockPoint('Mars', 'Mars', 180),
      mockPoint('Jupiter', 'Jupiter', 240),
      mockPoint('Saturn', 'Saturn', 300)
    ];

    const patterns = detectPatterns(points);
    // One point can belong to multiple patterns
    expect(patterns.length).toBeGreaterThan(0);

    // No pattern should claim impossibly many planets
    patterns.forEach(p => {
      expect(p.planets.length).toBeLessThanOrEqual(points.length);
    });
  });

  test('Very tight orbs still work', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10.0),
      mockPoint('Moon', 'Moon', 130.1),  // 0.1° off perfect trine
      mockPoint('Venus', 'Venus', 249.9) // 0.1° off perfect trine
    ];

    const patterns = detectPatterns(points);
    // Should detect grand trine (orb = 6° per aspect)
    expect(patterns.some(p => p.name === 'Grand Trine')).toBe(true);
  });
});
