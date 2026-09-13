/*! aspects/patterns.ts
 * Aspect-pattern detection engine (Tiers 1–3)
 * Detects classic, minor, and degree-based patterns from PointData[]
 */

import { PointData } from '../ephemeris/engine';

// ============================================================================
// TYPES
// ============================================================================

export interface AspectInPattern {
  a: string;           // Point A id
  aspect: string;      // 'conjunct', 'sextile', 'square', 'trine', 'opposite', etc.
  b: string;           // Point B id
  orb: number;         // Actual orb (degrees)
}

export interface ChartPattern {
  name: string;              // 'Grand Trine', 'T-Square', etc.
  planets: string[];         // Point IDs forming the pattern
  apex?: string;             // For patterns with an apex (T-square, yod, etc.)
  releasePoint?: number;     // Degree of empty leg (T-square, boomerang, etc.)
  aspectChain: AspectInPattern[];  // All aspects forming the pattern
  tier: 1 | 2 | 3;          // Classic, minor-aspect, or degree-based
  description: string;       // One-sentence symbolism
}

export interface PatternConfig {
  showMinorPatterns: boolean;        // Tier 2 (default false)
  showDegreeLore: boolean;           // Tier 3 (default false)
  includeMinorPointsInPatterns: boolean;  // Use asteroids/nodes (default false, planets only)
  maxOrbScaling: number;             // Multiplier for loosening orbs (default 1.0)
}

// ============================================================================
// ASPECT ORBS & UTILITIES
// ============================================================================

const ASPECT_ORBS = {
  'conjunct': 6,
  'sextile': 4,
  'square': 6,
  'trine': 6,
  'opposite': 6,
  'semisextile': 1.5,
  'semisquare': 2,
  'sesquisquare': 2,
  'quincunx': 3,
  'quintile': 2,
  'biquintile': 2,
  'septile': 1.5,
  'biseptile': 1.5,
  'novile': 1.5,
  'binovile': 1.5
};

/**
 * Normalize degree to 0–360 range
 */
function norm360(deg: number): number {
  let d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/**
 * Calculate shortest arc between two degrees
 */
function arcDistance(lon1: number, lon2: number): number {
  let d = Math.abs(lon1 - lon2);
  return d > 180 ? 360 - d : d;
}

/**
 * Get configured orb for an aspect (with optional minor-point scaling)
 */
function getOrb(aspect: string, isMinorPoint: boolean = false, scaling: number = 1.0): number {
  const baseOrb = ASPECT_ORBS[aspect as keyof typeof ASPECT_ORBS] || 6;
  const scaledOrb = isMinorPoint ? baseOrb * 0.5 : baseOrb;
  return scaledOrb * scaling;
}

/**
 * Check if an aspect is present between two points within orb
 */
function hasAspect(
  p1: PointData,
  p2: PointData,
  aspect: number,
  orb: number
): { matched: boolean; actualOrb: number } {
  const arc = arcDistance(p1.lon, p2.lon);
  const diff = Math.abs(arc - aspect);
  return {
    matched: diff <= orb,
    actualOrb: diff
  };
}

/**
 * Filter points for pattern detection (planets only, or include minor points)
 */
function filterPointsForPatterns(
  points: PointData[],
  includeMinor: boolean
): PointData[] {
  return points.filter(p => {
    // Only points with status 'ok' participate
    if (p.status !== 'ok') return false;

    if (!includeMinor) {
      // Planets only: sun–pluto (10 bodies) + angles
      const planetIds = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven', 'Descendant', 'Nadir'];
      return planetIds.includes(p.name);
    }
    return true;
  });
}

// ============================================================================
// TIER 1: CLASSIC PATTERNS
// ============================================================================

/**
 * Grand Trine: 3 planets, 120° apart, all trines
 */
export function detectGrandTrine(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orb = getOrb('trine');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        const p1 = points[i], p2 = points[j], p3 = points[k];

        const a12 = hasAspect(p1, p2, 120, orb);
        const a23 = hasAspect(p2, p3, 120, orb);
        const a31 = hasAspect(p3, p1, 120, orb);

        if (a12.matched && a23.matched && a31.matched) {
          results.push({
            name: 'Grand Trine',
            planets: [p1.id, p2.id, p3.id],
            aspectChain: [
              { a: p1.id, aspect: 'trine', b: p2.id, orb: a12.actualOrb },
              { a: p2.id, aspect: 'trine', b: p3.id, orb: a23.actualOrb },
              { a: p3.id, aspect: 'trine', b: p1.id, orb: a31.actualOrb }
            ],
            tier: 1,
            description: 'Three planets in harmonious 120° alignment; flowing gift, ease, and natural talent.'
          });
        }
      }
    }
  }
  return results;
}

/**
 * T-Square: 3 planets; 2 opposite (180°), 1 square (90°) to both
 */
export function detectTSquare(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbSquare = getOrb('square');
  const orbOpposite = getOrb('opposite');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = 0; k < points.length; k++) {
        if (k === i || k === j) continue;

        const p1 = points[i], p2 = points[j], apex = points[k];

        const opp = hasAspect(p1, p2, 180, orbOpposite);
        const sq1 = hasAspect(p1, apex, 90, orbSquare);
        const sq2 = hasAspect(p2, apex, 90, orbSquare);

        if (opp.matched && sq1.matched && sq2.matched) {
          // Release point: opposite of apex, halfway between p1 and p2
          const releasePoint = norm360((p1.lon + p2.lon) / 2 + 180);

          results.push({
            name: 'T-Square',
            planets: [p1.id, p2.id, apex.id],
            apex: apex.id,
            releasePoint,
            aspectChain: [
              { a: p1.id, aspect: 'opposite', b: p2.id, orb: opp.actualOrb },
              { a: p1.id, aspect: 'square', b: apex.id, orb: sq1.actualOrb },
              { a: p2.id, aspect: 'square', b: apex.id, orb: sq2.actualOrb }
            ],
            tier: 1,
            description: 'Two opposite planets square to a third; tension seeking release through the empty leg.'
          });
        }
      }
    }
  }
  return results;
}

/**
 * Grand Cross: 4 planets; 2 oppositions, 4 squares (all cardinal or fixed signs)
 */
export function detectGrandCross(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbSquare = getOrb('square');
  const orbOpposite = getOrb('opposite');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        for (let l = k + 1; l < points.length; l++) {
          const p1 = points[i], p2 = points[j], p3 = points[k], p4 = points[l];

          // Check for 2 oppositions and 4 squares
          const opp12 = hasAspect(p1, p2, 180, orbOpposite).matched;
          const opp34 = hasAspect(p3, p4, 180, orbOpposite).matched;
          const sq13 = hasAspect(p1, p3, 90, orbSquare).matched;
          const sq14 = hasAspect(p1, p4, 90, orbSquare).matched;
          const sq23 = hasAspect(p2, p3, 90, orbSquare).matched;
          const sq24 = hasAspect(p2, p4, 90, orbSquare).matched;

          if (opp12 && opp34 && sq13 && sq14 && sq23 && sq24) {
            results.push({
              name: 'Grand Cross',
              planets: [p1.id, p2.id, p3.id, p4.id],
              aspectChain: [
                { a: p1.id, aspect: 'opposite', b: p2.id, orb: arcDistance(p1.lon, p2.lon) % 180 },
                { a: p3.id, aspect: 'opposite', b: p4.id, orb: arcDistance(p3.lon, p4.lon) % 180 },
                { a: p1.id, aspect: 'square', b: p3.id, orb: arcDistance(p1.lon, p3.lon) % 90 },
                { a: p1.id, aspect: 'square', b: p4.id, orb: arcDistance(p1.lon, p4.lon) % 90 },
                { a: p2.id, aspect: 'square', b: p3.id, orb: arcDistance(p2.lon, p3.lon) % 90 },
                { a: p2.id, aspect: 'square', b: p4.id, orb: arcDistance(p2.lon, p4.lon) % 90 }
              ],
              tier: 1,
              description: 'Four planets in square and opposite aspects; intense challenge with no easy escape, demanding mastery.'
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Kite: Grand Trine + 1 planet sextile to 2 of the trine planets, opposite to 1
 */
export function detectKite(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbTrine = getOrb('trine');
  const orbSextile = getOrb('sextile');
  const orbOpposite = getOrb('opposite');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        for (let l = 0; l < points.length; l++) {
          if (l === i || l === j || l === k) continue;

          const p1 = points[i], p2 = points[j], p3 = points[k], tail = points[l];

          // Check grand trine
          const t12 = hasAspect(p1, p2, 120, orbTrine).matched;
          const t23 = hasAspect(p2, p3, 120, orbTrine).matched;
          const t31 = hasAspect(p3, p1, 120, orbTrine).matched;

          if (!t12 || !t23 || !t31) continue;

          // Check tail: sextile to 2, opposite to 1
          const s1 = hasAspect(p1, tail, 60, orbSextile).matched;
          const s2 = hasAspect(p2, tail, 60, orbSextile).matched;
          const s3 = hasAspect(p3, tail, 60, orbSextile).matched;
          const o1 = hasAspect(p1, tail, 180, orbOpposite).matched;
          const o2 = hasAspect(p2, tail, 180, orbOpposite).matched;
          const o3 = hasAspect(p3, tail, 180, orbOpposite).matched;

          if ((s1 && s2 && o3) || (s1 && s3 && o2) || (s2 && s3 && o1)) {
            results.push({
              name: 'Kite',
              planets: [p1.id, p2.id, p3.id, tail.id],
              apex: tail.id,
              aspectChain: [
                { a: p1.id, aspect: 'trine', b: p2.id, orb: arcDistance(p1.lon, p2.lon) % 120 },
                { a: p2.id, aspect: 'trine', b: p3.id, orb: arcDistance(p2.lon, p3.lon) % 120 },
                { a: p3.id, aspect: 'trine', b: p1.id, orb: arcDistance(p3.lon, p1.lon) % 120 }
              ],
              tier: 1,
              description: 'Grand Trine with tail planet; directs diffuse trine energy toward apex, adding purpose and drive.'
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Yod (Finger of God): 2 quincunx (150°), 1 sextile (60°); apex at quincunx base
 */
export function detectYod(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbQuincunx = getOrb('quincunx');
  const orbSextile = getOrb('sextile');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = 0; k < points.length; k++) {
        if (k === i || k === j) continue;

        const p1 = points[i], p2 = points[j], apex = points[k];

        const q1 = hasAspect(p1, apex, 150, orbQuincunx);
        const q2 = hasAspect(p2, apex, 150, orbQuincunx);
        const sx = hasAspect(p1, p2, 60, orbSextile);

        if (q1.matched && q2.matched && sx.matched) {
          results.push({
            name: 'Yod',
            planets: [p1.id, p2.id, apex.id],
            apex: apex.id,
            aspectChain: [
              { a: p1.id, aspect: 'quincunx', b: apex.id, orb: q1.actualOrb },
              { a: p2.id, aspect: 'quincunx', b: apex.id, orb: q2.actualOrb },
              { a: p1.id, aspect: 'sextile', b: p2.id, orb: sx.actualOrb }
            ],
            tier: 1,
            description: 'Two quincunx pointing to an apex; fated spiritual insight requiring adjustment and surrender.'
          });
        }
      }
    }
  }
  return results;
}

/**
 * Mystic Rectangle: 2 sextiles, 2 trines (4 planets in rectangle)
 */
export function detectMysticRectangle(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbSextile = getOrb('sextile');
  const orbTrine = getOrb('trine');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        for (let l = k + 1; l < points.length; l++) {
          const p1 = points[i], p2 = points[j], p3 = points[k], p4 = points[l];

          // Check for rectangle: alternating sextile/trine
          const sx12 = hasAspect(p1, p2, 60, orbSextile).matched;
          const t23 = hasAspect(p2, p3, 120, orbTrine).matched;
          const sx34 = hasAspect(p3, p4, 60, orbSextile).matched;
          const t41 = hasAspect(p4, p1, 120, orbTrine).matched;

          if (sx12 && t23 && sx34 && t41) {
            results.push({
              name: 'Mystic Rectangle',
              planets: [p1.id, p2.id, p3.id, p4.id],
              aspectChain: [
                { a: p1.id, aspect: 'sextile', b: p2.id, orb: arcDistance(p1.lon, p2.lon) % 60 },
                { a: p2.id, aspect: 'trine', b: p3.id, orb: arcDistance(p2.lon, p3.lon) % 120 },
                { a: p3.id, aspect: 'sextile', b: p4.id, orb: arcDistance(p3.lon, p4.lon) % 60 },
                { a: p4.id, aspect: 'trine', b: p1.id, orb: arcDistance(p4.lon, p1.lon) % 120 }
              ],
              tier: 1,
              description: 'Four planets in harmonious rectangle; unusual gifts, paradoxical talents, creative flow.'
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Stellium: 4+ planets in same sign or conjunction
 */
export function detectStellium(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbConjunct = getOrb('conjunct');

  // Group by sign
  const bySign: { [sign: string]: PointData[] } = {};
  points.forEach(p => {
    const signIndex = Math.floor(p.lon / 30);
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const sign = signs[signIndex];
    if (!bySign[sign]) bySign[sign] = [];
    bySign[sign].push(p);
  });

  Object.entries(bySign).forEach(([sign, group]) => {
    if (group.length >= 4) {
      const aspects: AspectInPattern[] = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          aspects.push({
            a: group[i].id,
            aspect: 'stellium',
            b: group[j].id,
            orb: arcDistance(group[i].lon, group[j].lon)
          });
        }
      }

      results.push({
        name: `Stellium in ${sign}`,
        planets: group.map(p => p.id),
        aspectChain: aspects,
        tier: 1,
        description: `Concentrated power and intensity in ${sign}; focused drive, obsessive energy, single-minded purpose.`
      });
    }
  });

  return results;
}

/**
 * Boomerang: T-Square with 1 planet sextile to both opposite planets
 */
export function detectBoomerang(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbSquare = getOrb('square');
  const orbOpposite = getOrb('opposite');
  const orbSextile = getOrb('sextile');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = 0; k < points.length; k++) {
        if (k === i || k === j) continue;

        const p1 = points[i], p2 = points[j], apex = points[k];

        const opp = hasAspect(p1, p2, 180, orbOpposite);
        const sq1 = hasAspect(p1, apex, 90, orbSquare);
        const sq2 = hasAspect(p2, apex, 90, orbSquare);

        if (!opp.matched || !sq1.matched || !sq2.matched) continue;

        // Check for 4th planet sextile to both
        for (let l = 0; l < points.length; l++) {
          if (l === i || l === j || l === k) continue;

          const boomerang = points[l];
          const sx1 = hasAspect(p1, boomerang, 60, orbSextile);
          const sx2 = hasAspect(p2, boomerang, 60, orbSextile);

          if (sx1.matched && sx2.matched) {
            results.push({
              name: 'Boomerang',
              planets: [p1.id, p2.id, apex.id, boomerang.id],
              apex: boomerang.id,
              aspectChain: [
                { a: p1.id, aspect: 'opposite', b: p2.id, orb: opp.actualOrb },
                { a: p1.id, aspect: 'square', b: apex.id, orb: sq1.actualOrb },
                { a: p2.id, aspect: 'square', b: apex.id, orb: sq2.actualOrb },
                { a: p1.id, aspect: 'sextile', b: boomerang.id, orb: sx1.actualOrb },
                { a: p2.id, aspect: 'sextile', b: boomerang.id, orb: sx2.actualOrb }
              ],
              tier: 1,
              description: 'T-Square with sextile resolution planet; reflects back T-square energy, demands active expression through the resolution planet.'
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Cradle: 2 sextiles, 2 trines forming a holding pattern (different shape than mystic rectangle)
 */
export function detectCradle(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbSextile = getOrb('sextile');
  const orbTrine = getOrb('trine');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        for (let l = k + 1; l < points.length; l++) {
          const p1 = points[i], p2 = points[j], p3 = points[k], p4 = points[l];

          // Cradle: p1-p2 sextile, p1-p3 trine, p2-p4 trine, p3-p4 sextile
          const sx12 = hasAspect(p1, p2, 60, orbSextile).matched;
          const t13 = hasAspect(p1, p3, 120, orbTrine).matched;
          const t24 = hasAspect(p2, p4, 120, orbTrine).matched;
          const sx34 = hasAspect(p3, p4, 60, orbSextile).matched;

          if (sx12 && t13 && t24 && sx34) {
            results.push({
              name: 'Cradle',
              planets: [p1.id, p2.id, p3.id, p4.id],
              aspectChain: [
                { a: p1.id, aspect: 'sextile', b: p2.id, orb: arcDistance(p1.lon, p2.lon) % 60 },
                { a: p1.id, aspect: 'trine', b: p3.id, orb: arcDistance(p1.lon, p3.lon) % 120 },
                { a: p2.id, aspect: 'trine', b: p4.id, orb: arcDistance(p2.lon, p4.lon) % 120 },
                { a: p3.id, aspect: 'sextile', b: p4.id, orb: arcDistance(p3.lon, p4.lon) % 60 }
              ],
              tier: 1,
              description: 'Four planets in balanced support pattern; protective holding, comfort, safe foundation.'
            });
          }
        }
      }
    }
  }
  return results;
}

/**
 * Talent Triangle: 2 sextiles, 1 trine (3 planets)
 */
export function detectTalentTriangle(points: PointData[]): ChartPattern[] {
  const results: ChartPattern[] = [];
  const orbSextile = getOrb('sextile');
  const orbTrine = getOrb('trine');

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        const p1 = points[i], p2 = points[j], p3 = points[k];

        // 2 sextiles, 1 trine
        const sx12 = hasAspect(p1, p2, 60, orbSextile).matched;
        const sx23 = hasAspect(p2, p3, 60, orbSextile).matched;
        const t31 = hasAspect(p3, p1, 120, orbTrine).matched;

        if (sx12 && sx23 && t31) {
          results.push({
            name: 'Talent Triangle',
            planets: [p1.id, p2.id, p3.id],
            aspectChain: [
              { a: p1.id, aspect: 'sextile', b: p2.id, orb: arcDistance(p1.lon, p2.lon) % 60 },
              { a: p2.id, aspect: 'sextile', b: p3.id, orb: arcDistance(p2.lon, p3.lon) % 60 },
              { a: p3.id, aspect: 'trine', b: p1.id, orb: arcDistance(p3.lon, p1.lon) % 120 }
            ],
            tier: 1,
            description: 'Three planets in easy flow; creative talent that naturally expresses, gift waiting to be developed.'
          });
        }
      }
    }
  }
  return results;
}

// ============================================================================
// MAIN DETECTOR
// ============================================================================

/**
 * Detect all patterns in a chart
 */
export function detectPatterns(
  points: PointData[],
  config: Partial<PatternConfig> = {}
): ChartPattern[] {
  const finalConfig: PatternConfig = {
    showMinorPatterns: false,
    showDegreeLore: false,
    includeMinorPointsInPatterns: false,
    maxOrbScaling: 1.0,
    ...config
  };

  // Filter points
  const filtered = filterPointsForPatterns(points, finalConfig.includeMinorPointsInPatterns);

  if (filtered.length < 3) return []; // Need at least 3 points for a pattern

  let patterns: ChartPattern[] = [];

  // Tier 1: Classics
  patterns = patterns.concat(
    detectGrandTrine(filtered),
    detectTSquare(filtered),
    detectGrandCross(filtered),
    detectKite(filtered),
    detectYod(filtered),
    detectMysticRectangle(filtered),
    detectBoomerang(filtered),
    detectCradle(filtered),
    detectTalentTriangle(filtered),
    detectStellium(filtered)
  );

  // Tier 2: Minor-aspect patterns (toggleable)
  if (finalConfig.showMinorPatterns) {
    // TODO: Implement Tier 2 patterns (thor's hammer, hard rectangle, etc.)
  }

  // Tier 3: Degree lore (toggleable)
  if (finalConfig.showDegreeLore) {
    // TODO: Implement Tier 3 patterns (22°, 15°, 18°, anaretic 29°)
  }

  return patterns;
}

// ============================================================================
// STATISTICS & HELPERS
// ============================================================================

/**
 * Count pattern participation per point
 */
export function getPatternParticipation(patterns: ChartPattern[]): Record<string, number> {
  const counts: Record<string, number> = {};
  patterns.forEach(p => {
    p.planets.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
  });
  return counts;
}

/**
 * Filter patterns by tier
 */
export function patternsByTier(patterns: ChartPattern[], tier: 1 | 2 | 3): ChartPattern[] {
  return patterns.filter(p => p.tier === tier);
}
