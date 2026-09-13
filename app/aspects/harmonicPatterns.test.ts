/*! aspects/harmonicPatterns.test.ts
 * Tests for harmonic pattern detection
 */

import {
  detectHarmonicPatterns,
  detectHarmonicRangePatterns,
  harmonicPatternsByTier,
  harmonicPatternsByN,
  groupHarmonicPatternsByN,
  isGoldenYodIn5thHarmonic,
  radixGrandTrineNotIn5th,
  HarmonicPattern
} from './harmonicPatterns';

import { detectPatterns, ChartPattern } from './patterns';
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
    speed: 1.0,
    house: 1,
    status
  };
}

// ============================================================================
// HARMONIC PATTERN DETECTION TESTS
// ============================================================================

describe('Harmonic Pattern Detection', () => {
  test('Radix (n=1) uses standard pattern detection', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250)
    ];

    const patterns = detectHarmonicPatterns(points, 1);

    expect(patterns.length).toBeGreaterThan(0);
    const grandTrine = patterns.find(p => p.name.includes('Grand Trine'));
    expect(grandTrine).toBeDefined();
    expect(grandTrine!.harmonicN).toBe(1);
    expect(grandTrine!.harmonicOf).toEqual(['Sun', 'Moon', 'Venus']);
  });

  test('Harmonic patterns are prefixed with NH:', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const patterns = detectHarmonicPatterns(points, 3);

    patterns.forEach(p => {
      expect(p.name).toMatch(/^3H:/);
      expect(p.harmonicN).toBe(3);
    });
  });

  test('Golden yod (0°, 144°, 288°) appears as 5H: Grand Trine', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 144),
      mockPoint('Venus', 'Venus', 288)
    ];

    const radixPatterns = detectPatterns(points);
    const harmonic5Patterns = detectHarmonicPatterns(points, 5);

    // Radix: no grand trine (it's a yod pattern, not a trine)
    const radixTrines = radixPatterns.filter(p => p.name.includes('Grand Trine'));
    expect(radixTrines.length).toBe(0);

    // 5H: should find grand trine
    const h5Trines = harmonic5Patterns.filter(p => p.name.includes('Grand Trine'));
    expect(h5Trines.length).toBeGreaterThan(0);
    expect(h5Trines[0].name).toBe('5H: Grand Trine');
    expect(h5Trines[0].harmonicOf).toEqual(['Sun', 'Moon', 'Venus']);
  });

  test('Radix grand trine does NOT appear as 5H: Grand Trine', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250)
    ];

    const radixPatterns = detectPatterns(points);
    const harmonic5Patterns = detectHarmonicPatterns(points, 5);

    // Radix: grand trine exists
    const radixTrines = radixPatterns.filter(p => p.name.includes('Grand Trine'));
    expect(radixTrines.length).toBeGreaterThan(0);

    // 5H: should NOT find the same grand trine
    // (it's not a quintile pattern, so it doesn't conjunct in 5H)
    const h5Trines = harmonic5Patterns.filter(
      p => p.name.includes('Grand Trine') &&
           p.harmonicOf.sort().join(',') === ['Sun', 'Moon', 'Venus'].sort().join(',')
    );
    expect(h5Trines.length).toBe(0);
  });

  test('Tier 2 patterns OFF by default in harmonics', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const patterns = detectHarmonicPatterns(points, 3);

    // Only Tier 1 patterns
    expect(patterns.every(p => p.tier === 1)).toBe(true);
  });

  test('Harmonic range detection covers multiple harmonics', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const patterns = detectHarmonicRangePatterns(points, 2, 5);

    // Should have patterns from harmonics 2, 3, 4, 5
    const harmonics = new Set(patterns.map(p => p.harmonicN));
    expect(harmonics.size).toBeGreaterThan(0);
    patterns.forEach(p => {
      expect(p.harmonicN).toBeGreaterThanOrEqual(2);
      expect(p.harmonicN).toBeLessThanOrEqual(5);
    });
  });

  test('harmonicPatternsByTier filters correctly', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const allPatterns = detectHarmonicPatterns(points, 3);
    const tier1 = harmonicPatternsByTier(allPatterns, 1);

    expect(tier1.length).toBeGreaterThan(0);
    expect(tier1.every(p => p.tier === 1)).toBe(true);
  });

  test('harmonicPatternsByN filters by harmonic', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const patterns = detectHarmonicRangePatterns(points, 2, 5);
    const h3Only = harmonicPatternsByN(patterns, 3);

    expect(h3Only.every(p => p.harmonicN === 3)).toBe(true);
  });

  test('groupHarmonicPatternsByN organizes by harmonic', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const patterns = detectHarmonicRangePatterns(points, 2, 5);
    const grouped = groupHarmonicPatternsByN(patterns);

    Object.entries(grouped).forEach(([nStr, pats]) => {
      const n = parseInt(nStr);
      expect(pats.every(p => p.harmonicN === n)).toBe(true);
    });
  });
});

// ============================================================================
// HARMONIC-SPECIFIC VALIDATION TESTS
// ============================================================================

describe('Harmonic Validation Helpers', () => {
  test('isGoldenYodIn5thHarmonic detects golden yod → 5H grand trine', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 144),
      mockPoint('Venus', 'Venus', 288)
    ];

    const radixPatterns = detectPatterns(points);
    const harmonic5Patterns = detectHarmonicPatterns(points, 5);

    // This should return true if a yod appears as grand trine in 5H
    const hasGoldenYod = isGoldenYodIn5thHarmonic(radixPatterns, harmonic5Patterns);
    expect(hasGoldenYod).toBe(true);
  });

  test('isGoldenYodIn5thHarmonic returns false when no yod', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 60),
      mockPoint('Venus', 'Venus', 120)
    ];

    const radixPatterns = detectPatterns(points);
    const harmonic5Patterns = detectHarmonicPatterns(points, 5);

    const hasGoldenYod = isGoldenYodIn5thHarmonic(radixPatterns, harmonic5Patterns);
    expect(hasGoldenYod).toBe(false);  // No yod in radix
  });

  test('radixGrandTrineNotIn5th returns true when no grand trine', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0),
      mockPoint('Moon', 'Moon', 144),
      mockPoint('Venus', 'Venus', 288)
    ];

    const radixPatterns = detectPatterns(points);
    const harmonic5Patterns = detectHarmonicPatterns(points, 5);

    const isCorrect = radixGrandTrineNotIn5th(radixPatterns, harmonic5Patterns);
    expect(isCorrect).toBe(true);  // No radix grand trine (it's a yod)
  });

  test('radixGrandTrineNotIn5th returns true when grand trine not in 5H', () => {
    const points = [
      mockPoint('Sun', 'Sun', 10),
      mockPoint('Moon', 'Moon', 130),
      mockPoint('Venus', 'Venus', 250)
    ];

    const radixPatterns = detectPatterns(points);
    const harmonic5Patterns = detectHarmonicPatterns(points, 5);

    const isCorrect = radixGrandTrineNotIn5th(radixPatterns, harmonic5Patterns);
    expect(isCorrect).toBe(true);  // Grand trine exists but NOT as 5H: Grand Trine
  });
});

// ============================================================================
// HARMONIC MEANINGS TABLE TEST
// ============================================================================

describe('Harmonic Meanings Integration', () => {
  test('Each harmonic 2–13 has a defined meaning', () => {
    const { HARMONIC_MEANINGS } = require('../forecast/harmonicMeanings');

    for (let n = 2; n <= 13; n++) {
      const meaning = HARMONIC_MEANINGS.find((h: any) => h.n === n);
      expect(meaning).toBeDefined();
      expect(meaning.name).toBeDefined();
      expect(meaning.family).toBeDefined();
      expect(meaning.oneLineMeaning).toBeDefined();
    }
  });

  test('Experimental flag on harmonics 10–13', () => {
    const { HARMONIC_MEANINGS } = require('../forecast/harmonicMeanings');

    [10, 11, 12, 13].forEach(n => {
      const meaning = HARMONIC_MEANINGS.find((h: any) => h.n === n);
      expect(meaning.experimental).toBe(true);
    });

    [2, 3, 4, 5, 6, 7, 8, 9].forEach(n => {
      const meaning = HARMONIC_MEANINGS.find((h: any) => h.n === n);
      expect(meaning.experimental).not.toBe(true);
    });
  });
});

// ============================================================================
// EDGE CASES & PERFORMANCE
// ============================================================================

describe('Edge Cases', () => {
  test('Empty points array returns empty patterns', () => {
    const points: PointData[] = [];
    const patterns = detectHarmonicPatterns(points, 5);
    expect(patterns.length).toBe(0);
  });

  test('Single point returns no patterns', () => {
    const points = [mockPoint('Sun', 'Sun', 82.5)];
    const patterns = detectHarmonicPatterns(points, 5);
    expect(patterns.length).toBe(0);
  });

  test('Unavailable points ignored in pattern detection', () => {
    const points = [
      mockPoint('Sun', 'Sun', 0, 'unavailable'),
      mockPoint('Moon', 'Moon', 120),
      mockPoint('Venus', 'Venus', 240)
    ];

    const patterns = detectHarmonicPatterns(points, 3);
    // Should only detect patterns from Moon and Venus (2 points, no pattern)
    expect(patterns.length).toBe(0);
  });

  test('Performance: 90 points in 5H completes quickly', () => {
    const points: PointData[] = [];
    for (let i = 0; i < 90; i++) {
      points.push(mockPoint(`p${i}`, `Point${i}`, (i * 4) % 360));
    }

    const start = performance.now();
    const patterns = detectHarmonicPatterns(points, 5);
    const elapsed = performance.now() - start;

    // Should complete under 100ms (including recast + pattern detection)
    expect(elapsed).toBeLessThan(100);
  });
});
