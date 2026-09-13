/*! ephemeris/harmonic.ts
 * Harmonic chart recasting (John Addey)
 * Multiply all longitudes by N mod 360 to reveal Nth-harmonic aspect family as conjunctions
 */

import type { PointData } from './engine.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface HarmonicPointData extends PointData {
  origLon: number;           // Original longitude
  harmonic: number;          // N (2–13)
}

export interface HarmonicConfig {
  harmonicIncludeAngles: boolean;  // Recast angles (ASC/MC/DC/IC)? Default false
  maxHarmonic: number;              // Cap on harmonic (default 13)
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert longitude to sign, degree, minute, second
 */
function lonToSZodiacParts(lon: number): { sign: number; deg: number; min: number; sec: number } {
  const norm = lon % 360;
  const sign = Math.floor(norm / 30);           // 0–11
  const rem = norm - sign * 30;
  const deg = Math.floor(rem);                   // 0–29
  const minRem = (rem - deg) * 60;
  const min = Math.floor(minRem);               // 0–59
  const sec = Math.round((minRem - min) * 60); // 0–59 (rounded)

  return { sign, deg, min, sec };
}

/**
 * Retrograde detection: speed < 0 (in original ephemeris)
 * In harmonic view: speed * n; retrograde flag flips if speed crosses 0
 */
function isRetrograde(speed: number): boolean {
  return speed < 0;
}

// ============================================================================
// MAIN RECAST FUNCTION
// ============================================================================

/**
 * Recast a chart to its Nth harmonic
 * Multiply all longitudes by N and fold mod 360
 */
export function recastHarmonic(
  points: PointData[],
  n: number,
  config: Partial<HarmonicConfig> = {}
): HarmonicPointData[] {
  if (n < 1 || n > 13) {
    throw new Error(`Harmonic N must be 1–13, got ${n}`);
  }

  const finalConfig: HarmonicConfig = {
    harmonicIncludeAngles: false,
    maxHarmonic: 13,
    ...config
  };

  if (n > finalConfig.maxHarmonic) {
    throw new Error(`Harmonic ${n} exceeds maxHarmonic ${finalConfig.maxHarmonic}`);
  }

  return points.map(p => {
    // Skip certain point types unless explicitly configured
    const angleIds = ['Ascendant', 'Midheaven', 'Descendant', 'Nadir'];
    const nodeIds = ['North Node', 'South Node', 'North Node (True)', 'South Node (True)', 'Ascending Lunar Node', 'Descending Lunar Node'];
    const hypotheticalIds = ['Cupido', 'Hades', 'Zeus', 'Kronos', 'Apollon', 'Admetos', 'Vulkanus', 'Poseidon'];

    const isAngle = angleIds.includes(p.name);
    const isNode = nodeIds.includes(p.name);
    const isHypothetical = hypotheticalIds.includes(p.name);

    if (!finalConfig.harmonicIncludeAngles && (isAngle || isNode || isHypothetical)) {
      // Skip recasting; return as-is but mark harmonic status
      return {
        ...p,
        origLon: p.lon,
        harmonic: n,
        status: 'harmonic-skipped'
      } as HarmonicPointData;
    }

    // Recast longitude
    const newLon = (p.lon * n) % 360;
    const parts = lonToSZodiacParts(newLon);

    // Recast speed
    const newSpeed = p.speed * n;
    const wasRetro = isRetrograde(p.speed);
    const isNowRetro = isRetrograde(newSpeed);

    // Mark asteroids/minor bodies as harmonic-approx
    let newStatus = p.status;
    if (p.status === 'ok' && (p.name.toLowerCase().includes('asteroid') ||
        ['Ceres', 'Pallas', 'Juno', 'Vesta', 'Chiron', 'Eris', 'Lilith'].includes(p.name))) {
      newStatus = 'harmonic-approx';
    }

    return {
      id: p.id,
      name: p.name,
      lon: newLon,
      origLon: p.lon,
      lat: p.lat,               // Latitude unchanged
      speed: newSpeed,          // Multiplied speed (may exceed normal ranges)
      house: null,              // Houses don't apply in harmonic view
      status: newStatus,
      harmonic: n
    } as HarmonicPointData;
  });
}

/**
 * Hash a points array for memoization
 * Simple: count + sum of longitudes (not cryptographic, just for cache keys)
 */
export function pointsHashForMemo(points: PointData[]): string {
  const count = points.length;
  const lonSum = points.reduce((sum, p) => sum + p.lon, 0).toFixed(2);
  return `${count}:${lonSum}`;
}

// ============================================================================
// MEMOIZATION CACHE
// ============================================================================

const harmonicCache = new Map<string, HarmonicPointData[]>();
const CACHE_MAX_SIZE = 20;

/**
 * Memoized recastHarmonic
 */
export function recastHarmonicMemoized(
  points: PointData[],
  n: number,
  config: Partial<HarmonicConfig> = {}
): HarmonicPointData[] {
  const hash = pointsHashForMemo(points);
  const key = `${hash}|${n}`;

  if (harmonicCache.has(key)) {
    return harmonicCache.get(key)!;
  }

  const result = recastHarmonic(points, n, config);

  // Maintain cache size
  if (harmonicCache.size >= CACHE_MAX_SIZE) {
    const firstKey = harmonicCache.keys().next().value;
    harmonicCache.delete(firstKey);
  }

  harmonicCache.set(key, result);
  return result;
}

/**
 * Clear the harmonic cache
 */
export function clearHarmonicCache(): void {
  harmonicCache.clear();
}

// ============================================================================
// UTILITY: VERIFY HARMONIC PROPERTIES
// ============================================================================

/**
 * Check if a harmonic view has the expected aspect family visible as conjunctions
 * For example, in the 5th harmonic, any two points 72° apart (quintile, 360/5) in the radix
 * will be conjunct in the 5H view.
 */
export function expectedAspectInHarmonic(radixArc: number, n: number): number {
  // Expected conjunction arc if the radix arc corresponds to harmonic aspect family n
  // Radix arc = 360 / n gives conjunction in nth harmonic
  const harmonicArc = 360 / n;
  const diff = Math.abs(radixArc - harmonicArc);
  return diff <= 6 ? 0 : diff; // Return 0 if within orb (6°), else the diff
}

/**
 * Get the aspect family arc for a harmonic (e.g., 5th harmonic = 72° quintiles)
 */
export function harmonicAspectFamily(n: number): number {
  return 360 / n;
}
