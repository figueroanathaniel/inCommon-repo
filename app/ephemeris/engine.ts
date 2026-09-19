/*! ephemeris/engine.ts: computation layer behind pointRegistry.ts (Prompt 3).
 *
 * WHY THIS DOES NOT WRAP SWISS EPHEMERIS, even though the brief asked for
 * a binding and named the functions sweBody/sweAsteroid/sweHypothetical.
 * There is no Swiss Ephemeris anywhere in this project to wrap: no
 * pyswisseph (this is not a Python project), no swisseph npm package, no
 * swisseph-wasm global. The app's own ephemeris-backend-swiss.js already
 * documents this exact state: an optional backend for "if you npm install
 * swisseph-wasm", never installed, with the current analytical backend as
 * the real, shipping default. This repository also has no package.json
 * and no build step (CLAUDE.md: "app/ stays flat... paints from the first
 * streamed character"), so `npm install swisseph` is not a small addition
 * here; it would mean inventing a bundler this project has deliberately
 * never had, for a native Node addon that cannot run in a browser at all.
 * The previous engine.ts tried anyway: every function checked
 * isEngineReady() first and threw or returned null otherwise, so nothing
 * in it could ever produce a real number in this app's actual runtime.
 * computeAll() also hardcoded `const ascLon = 0; // FIXME`, and only one
 * of eighty expanded points (Ceres) had a real switch-case; everything
 * else fell through to 'unavailable' whether or not the engine was ready.
 *
 * What this file does instead is what the rest of this app already does
 * successfully: analytical Keplerian orbits from published or fitted
 * elements, the same two-body model already live in
 * inCommonApp v2.dc.html (PL_EL, EARTH_EL, lonRaw, minorLon) and in
 * minor-bodies-ephemeris.js (Chiron, Ceres, Pallas, Juno, Vesta, fitted
 * against 81 JPL Horizons positions). Reusing those exact constants
 * rather than re-deriving new ones means this module cannot silently
 * disagree with the chart the app already draws.
 *
 * HONESTY ABOUT COVERAGE. Of the registry's 97 points, this file computes
 * a real position for the ten astral bodies, both lunar nodes, the four angles
 * (given, not derived here), Chiron and four asteroids (fitted elements,
 * ported), two more asteroids/TNOs with real cited elements (Eris,
 * Sedna), the eight planetary nodes (published J2000 mean elements), the
 * three named comets (mundane only), and every point the spec defines by
 * formula (selena, ariesPoint, antivertex, partOfFortune, partOfSpirit,
 * sunmoonMidpoint, vertex). Mean Lilith gets a cited secular formula;
 * osculating Lilith needs a fuller lunar perturbation theory this file
 * does not implement and says so. The remaining ~68 asteroids, centaurs,
 * TNOs and Hamburg School hypotheticals have no orbital elements sourced
 * anywhere in this codebase, and inventing numbers for them would be
 * worse than the honest 'unavailable' computeAll() gives them: a made up
 * planetary position is not a smaller error than a missing one, it is a
 * wrong one presented as a right one. Adding a body here means giving it
 * the same treatment Chiron got: real elements, cited, measured against
 * a reference ephemeris, worst case recorded.
 */

/* Relative imports carry an explicit .ts extension: Node's native
   TypeScript support treats a file using import/export syntax as an ES
   module, and ES module resolution (unlike require()'s CommonJS
   resolution) does not guess extensions. */
import { allPoints } from './pointRegistry.ts';
import { keplerSolve } from './cometSolver.ts';
import { COMET_ELEMENTS } from './cometElements.ts';
import type { CometElements } from './cometElements.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface PointData {
  id: string;
  name: string;
  lon: number;
  speed?: number;             // degrees/day; < 0 = retrograde
  house?: number;
  status: 'ok' | 'unavailable' | 'fixed';
  note?: string;               // present only when status is not 'ok'
}

export interface Angles {
  asc: number;
  mc: number;
}

export interface ComputeOpts {
  /** Default 'reverse': Part of Fortune uses the night formula (Asc + Sun -
   *  Moon) when isNightChart is true. 'same' keeps the day formula (Asc +
   *  Moon - Sun) regardless, which is a documented simplification, not the
   *  classical rule, and is only useful for callers that want one formula
   *  for every chart. */
  /* Applies to BOTH lots: they are mirror images and reverse together. */
  partOfFortuneNightChart?: 'reverse' | 'same';
  isNightChart?: boolean;
  logErrors?: boolean;
}

// ============================================================================
// SHARED CONSTANTS AND THE ONE KEPLER SOLVER
// ============================================================================

const RAD = Math.PI / 180;
function norm360(x: number): number { return ((x % 360) + 360) % 360; }
function t2000(jd: number): number { return jd - 2451545.0; }

/**
 * Solve Kepler's equation M = E - e sin E for E, by Newton-Raphson.
 * Shared by every body below: astral bodies, minor bodies, Eris and Sedna all
 * go through this one function, so a fix here fixes all of them at once
 * rather than needing to be repeated per body the way the old astral body
 * formula (a truncated equation-of-centre series) and the old minor-body
 * formula (this same Newton solve) used to disagree in method.
 */
function solveKepler(M: number, e: number, tol = 1e-10, maxIter = 30): number {
  let m = M % (2 * Math.PI);
  if (m < -Math.PI) m += 2 * Math.PI;
  if (m > Math.PI) m -= 2 * Math.PI;
  let E = m + e * Math.sin(m);
  for (let k = 0; k < maxIter; k++) {
    const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < tol) break;
  }
  return E;
}

function trueAnomaly(E: number, e: number): number {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

/** [L0, n (deg/day), e, varpi, a]: identical layout and identical values
 *  to PL_EL / EARTH_EL in inCommonApp v2.dc.html, so a chart drawn from
 *  this module and a chart drawn from the app agree by construction. */
type CoplanarEl = [number, number, number, number, number];

const EARTH_EL: CoplanarEl = [100.46435, 0.98564736, 0.01671, 102.937, 1.00000];

const PLANET_EL: Record<string, CoplanarEl> = {
  mercury: [252.25084, 4.09233445, 0.20563, 77.456, 0.38710],
  venus: [181.97973, 1.60213034, 0.00677, 131.564, 0.72333],
  mars: [355.433, 0.52402068, 0.09341, 336.041, 1.52368],
  jupiter: [34.35151, 0.08309257, 0.04839, 14.331, 5.20260],
  saturn: [50.07744, 0.03344414, 0.05415, 93.057, 9.55491],
  uranus: [314.05501, 0.01172577, 0.04717, 173.005, 19.21845],
  neptune: [304.34867, 0.00598158, 0.00859, 48.124, 30.11039],
  pluto: [238.92881, 0.00396372, 0.24883, 224.075, 39.48168]
};

/**
 * Heliocentric [x, y] and the mean motion's own instantaneous speed for a
 * coplanar body (inclination treated as zero). This is the exact model
 * lonRaw()'s helio() and minorLon() already use; it is not the source of
 * the "coplanar" simplification, it is the same simplification, reused.
 */
function coplanarXY(el: CoplanarEl, t: number): [number, number] {
  const [L0, n, e, varpi, a] = el;
  const M = norm360(L0 + n * t - varpi) * RAD;
  const E = solveKepler(M, e);
  const v = trueAnomaly(E, e);
  const r = a * (1 - e * Math.cos(E));
  const lon = varpi * RAD + v;
  return [r * Math.cos(lon), r * Math.sin(lon)];
}

function geocentricLonCoplanar(el: CoplanarEl, t: number): number {
  const [px, py] = coplanarXY(el, t);
  const [ex, ey] = coplanarXY(EARTH_EL, t);
  return norm360(Math.atan2(py - ey, px - ex) / RAD);
}

/** Numerical speed (degrees/day), central difference. Cheap enough to
 *  take twice per body: computeAll() runs once per chart, not per frame. */
function speedOf(lonAt: (t: number) => number, t: number): number {
  const h = 0.5; // half a day either side
  let a = lonAt(t - h), b = lonAt(t + h);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d / (2 * h);
}

// ============================================================================
// 1. PLANETS (Sun, Moon, Mercury..Pluto)
// ============================================================================

/** Sun's geometric ecliptic longitude, low-precision series (Meeus 25.5
 *  truncated to two terms). Same formula lonRaw() uses; ~0.01deg accurate
 *  near J2000, good to a few hundredths of a degree for centuries either
 *  side. Verified: at t=0 (J2000.0) this returns 280.375..., which is
 *  within 0.1 degree of the textbook value 280.4 degrees. */
function sunLon(t: number): number {
  const M = norm360(357.5291 + 0.98560028 * t) * RAD;
  const L = norm360(280.459 + 0.98564736 * t);
  return norm360(L + 1.915 * Math.sin(M) + 0.02 * Math.sin(2 * M));
}

/** Moon's geometric ecliptic longitude, low-precision series (Meeus 47,
 *  two largest perturbation terms). Same formula lonRaw() uses; good to
 *  roughly a degree, which is what a Moon phase and a wide aspect need. */
function moonLon(t: number): number {
  const Mp = norm360(134.963 + 13.064993 * t) * RAD;
  const D = norm360(297.85 + 12.190749 * t) * RAD;
  return norm360(218.316 + 13.176396 * t + 6.289 * Math.sin(Mp) + 1.274 * Math.sin(2 * D - Mp));
}

/**
 * 1. sweBody: named for the brief's Swiss Ephemeris shape, computed from
 * this file's own analytical elements (see the file header for why).
 * id follows the Swiss Ephemeris body numbering the registry already
 * uses (0 Sun, 1 Moon, 2 Mercury .. 9 Pluto), so a future real binding
 * could replace this function's body without changing its callers.
 */
const BODY_BY_ID: Record<number, string> = {
  0: 'sun', 1: 'moon', 2: 'mercury', 3: 'venus', 4: 'mars',
  5: 'jupiter', 6: 'saturn', 7: 'uranus', 8: 'neptune', 9: 'pluto'
};

export function sweBody(id: number, jd: number): { lon: number; speed: number } {
  const t = t2000(jd);
  const name = BODY_BY_ID[id];
  if (name === 'sun') return { lon: sunLon(t), speed: speedOf(sunLon, t) };
  if (name === 'moon') return { lon: moonLon(t), speed: speedOf(moonLon, t) };
  const el = name ? PLANET_EL[name] : undefined;
  if (!el) throw new Error('sweBody: unknown body id ' + id);
  const lon = geocentricLonCoplanar(el, t);
  const speed = speedOf(tt => geocentricLonCoplanar(el, tt), t);
  return { lon, speed };
}

// ============================================================================
// 2. ASTEROIDS (Ceres, Pallas, Juno, Vesta: fitted, ported from
//    minor-bodies-ephemeris.js; Eris and Sedna: real cited elements, new)
// ============================================================================

/** deg/day from semi-major axis (AU), Kepler's third law. Not a free
 *  parameter for any body below: letting it float fits a curve, not an
 *  orbit (see minor-bodies-ephemeris.js's own comment on this, which
 *  found exactly that failure mode once). */
function meanMotion(aAU: number): number { return 0.9856076686 / (aAU * Math.sqrt(aAU)); }

/** Ceres, Pallas, Juno, Vesta: identical a/e/varpi/L0 to
 *  minor-bodies-ephemeris.js's EL table (retrieved from that file, not
 *  re-derived), coplanar model, "provisional" confidence there and here.
 *  Chiron is included here as a fifth coplanar body for the same reason:
 *  it is fitted against 81 JPL Horizons positions (1900-2060, RMS 0.559
 *  degrees, worst 0.923), which is the app's own measured accuracy for
 *  it and is not repeated here. */
const MINOR_EL: Record<string, CoplanarEl> = {
  chiron: [216.20376, meanMotion(13.6371), 0.380233, 188.33266, 13.6371],
  ceres: [267.73, meanMotion(2.7660), 0.0791, 154.32, 2.7660],
  pallas: [182.38, meanMotion(2.7726), 0.2299, 123.18, 2.7726],
  juno: [239.00, meanMotion(2.6693), 0.2579, 57.00, 2.6693],
  vesta: [201.56, meanMotion(2.3615), 0.0895, 253.76, 2.3615]
};
const MINOR_MPC: Record<number, string> = { 2060: 'chiron', 1: 'ceres', 2: 'pallas', 3: 'juno', 4: 'vesta' };

/** Full three-dimensional Keplerian element set: used only where an
 *  inclination and a separate node/perihelion split are actually known,
 *  which as of this file is Eris and Sedna. The coplanar bodies above do
 *  not have Omega and omega split apart in this codebase (only their sum,
 *  varpi) and re-deriving that split would invalidate the fitted L0/e/
 *  varpi values Chiron's fit was measured against. */
interface Elements3D { a: number; e: number; i: number; om: number; w: number; M0: number; epochJD: number; }

function heliocentricXYZ(el: Elements3D, jd: number): [number, number, number] {
  const M = norm360(el.M0 + meanMotion(el.a) * (jd - el.epochJD)) * RAD;
  const E = solveKepler(M, el.e);
  const v = trueAnomaly(E, el.e);
  const r = el.a * (1 - el.e * Math.cos(E));
  const xOrb = r * Math.cos(v), yOrb = r * Math.sin(v);
  const i = el.i * RAD, Om = el.om * RAD, w = el.w * RAD;
  const cosO = Math.cos(Om), sinO = Math.sin(Om), cosW = Math.cos(w), sinW = Math.sin(w), cosI = Math.cos(i), sinI = Math.sin(i);
  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;
  return [x, y, z];
}

/**
 * Eris: a=67.69 AU, e=0.44, i=44.18deg, Omega=35.9045deg, omega=151.66deg,
 * M0=205.11deg at epoch JD 2461000.5 (2025-11-21). Sedna: a=541.6 AU,
 * e=0.859, i=11.93deg, Omega=144.3deg, omega=310.84deg, M0=358.117deg at
 * epoch JD 2458900.5 (2020-05-31). Source: JPL Small-Body Database /
 * Horizons, retrieved 2026-09-13 via web search, cross-checked against
 * two independent citations each for a and e. Neither body has been
 * measured against a reference ephemeris the way Chiron was; treat both
 * as provisional in the same sense the four asteroids above are, and
 * more so for Sedna, whose ~11,400-year period means the observed arc
 * (35 years) constrains its orbit far more weakly than a short-period
 * asteroid's does.
 */
const TNO_3D: Record<string, Elements3D> = {
  eris: { a: 67.69, e: 0.44, i: 44.18, om: 35.9045, w: 151.66, M0: 205.11, epochJD: 2461000.5 },
  sedna: { a: 541.6, e: 0.859, i: 11.93, om: 144.3, w: 310.84, M0: 358.117, epochJD: 2458900.5 }
};
const TNO_MPC: Record<number, string> = { 136199: 'eris', 90377: 'sedna' };

function geocentricLon3D(el: Elements3D, jd: number): number {
  const [hx, hy] = heliocentricXYZ(el, jd);
  const [ex, ey] = coplanarXY(EARTH_EL, t2000(jd));
  return norm360(Math.atan2(hy - ey, hx - ex) / RAD);
}

/**
 * 2. sweAsteroid: mpcId is the asteroid's MPC catalogue number, matching
 * pointRegistry.ts's sweId for every asteroid/centaur/TNO entry. Returns
 * null (never throws) for any body without sourced elements, so one
 * missing body cannot stop computeAll() from finishing the other 96.
 */
export function sweAsteroid(mpcId: number, jd: number): { lon: number; speed: number } | null {
  const minorName = MINOR_EL[MINOR_MPC[mpcId]] ? MINOR_MPC[mpcId] : undefined;
  if (minorName) {
    const el = MINOR_EL[minorName];
    const t = t2000(jd);
    return { lon: geocentricLonCoplanar(el, t), speed: speedOf(tt => geocentricLonCoplanar(el, tt), t) };
  }
  const tnoName = TNO_MPC[mpcId];
  if (tnoName) {
    const el = TNO_3D[tnoName];
    return { lon: geocentricLon3D(el, jd), speed: speedOf(j => geocentricLon3D(el, j), jd) };
  }
  return null; // no elements sourced for this body; caller marks 'unavailable'
}

// ============================================================================
// 3. HYPOTHETICALS (Hamburg School TNPs, sweId 40-47)
// ============================================================================

/**
 * 3. sweHypothetical: NONE of the eight Hamburg School trans-Neptunian
 * points have orbital elements anywhere in this codebase (they are
 * genuinely hypothetical bodies with no physical orbit to source
 * elements FROM; the Hamburg School itself computes them from tables of
 * assumed mean motions that this project has not obtained). Returns null
 * always, honestly, rather than a fabricated position; do not add mean
 * motions here without a cited source for them.
 */
export function sweHypothetical(sweId: number, _jd: number): { lon: number; speed: number } | null {
  if (sweId < 40 || sweId > 47) throw new Error('sweHypothetical: sweId must be 40-47, got ' + sweId);
  return null;
}

// ============================================================================
// 4. LUNAR NODE
// ============================================================================

/**
 * 4. lunarNode: mean node, identical formula to lonRaw()'s 'North Node'
 * case. South Node is the north node's longitude plus 180 degrees,
 * exactly, by definition (the two nodes are where the Moon's orbital
 * plane crosses the ecliptic, which is one line through the Earth, not
 * two independently-moving points).
 */
export function lunarNode(jd: number): { northNode: number; southNode: number } {
  const t = t2000(jd);
  const northNode = norm360(125.0445 - 0.0529539 * t);
  const southNode = norm360(northNode + 180);
  return { northNode, southNode };
}

// ============================================================================
// 5. PLANETARY NODES (ascending node longitude, per astral body)
// ============================================================================

/**
 * J2000.0 mean longitude of ascending node (degrees) and its centennial
 * rate (degrees/Julian century), for the eight non-Earth astral bodies.
 * Source: Standish/JPL "Keplerian elements for approximate positions of
 * the major astral bodies" (mean ecliptic and equinox of J2000), retrieved
 * 2026-09-13. This is a standard reference table, not a fit: the rate is
 * how fast a slowly precessing plane actually moves, not a free
 * parameter chosen to match anything.
 */
const PLANET_NODE: Record<string, { om0: number; rateCentury: number }> = {
  mercury: { om0: 48.33167, rateCentury: -446.30 / 3600 },
  venus: { om0: 76.68069, rateCentury: -996.89 / 3600 },
  mars: { om0: 49.57854, rateCentury: -1020.19 / 3600 },
  jupiter: { om0: 100.55615, rateCentury: 1217.17 / 3600 },
  saturn: { om0: 113.71504, rateCentury: -1591.05 / 3600 },
  uranus: { om0: 74.22988, rateCentury: -1681.40 / 3600 },
  neptune: { om0: 131.72169, rateCentury: -151.25 / 3600 },
  pluto: { om0: 110.30347, rateCentury: -37.33 / 3600 }
};

/**
 * 5. planetaryNodes: the ascending node of each astral body named, as a
 * slowly-precessing mean element (centennial rate applied), not a daily
 * ephemeris position: an astral body's node moves a few arcminutes a year at
 * most, so computing it once per chart (as the brief asks) rather than
 * per render costs nothing and loses nothing.
 */
export function planetaryNodes(jd: number, bodyIds: number[]): Record<number, number> {
  const t = t2000(jd);
  const centuries = t / 36525;
  const out: Record<number, number> = {};
  for (const id of bodyIds) {
    const name = BODY_BY_ID[id];
    const el = name ? PLANET_NODE[name] : undefined;
    if (el) out[id] = norm360(el.om0 + el.rateCentury * centuries);
  }
  return out;
}

// ============================================================================
// 6. MANUAL / DERIVED POINTS
// ============================================================================

/** Mean lunar apogee (Black Moon Lilith, mean). Source: Meeus,
 *  Astronomical Algorithms, mean longitude of lunar perigee series
 *  (83.3532465 + 4069.0137287 deg/century * T); apogee is perigee + 180,
 *  which this reduces to directly since only the longitude is wanted.
 *  This is a secular mean, not a fitted or osculating value: real Lilith
 *  oscillates around it by several degrees over the lunar month, which
 *  is exactly what lilithOsc would need a fuller lunar theory to capture
 *  and which this file does not attempt (see sweHypothetical's honesty
 *  note for the same reasoning applied to a different gap). */
export function lilithMeanLon(jd: number): number {
  const T = t2000(jd) / 36525;
  const perigee = norm360(83.3532465 + 4069.0137287 * T);
  return norm360(perigee + 180);
}

export function computeSelena(lilithMeanLonDeg: number): number {
  return norm360(lilithMeanLonDeg + 180);
}

export function computeAriesPoint(): number { return 0; }

export function computeAntivertex(vertexLon: number): number {
  return norm360(vertexLon + 180);
}

/**
 * Part of Fortune. Day formula: Asc + Moon - Sun. Night formula
 * (classical reversal): Asc + Sun - Moon. opts.partOfFortuneNightChart
 * controls whether the night formula is actually used at night
 * ('reverse', the classical rule and the default) or the day formula is
 * kept regardless ('same', a documented simplification for callers that
 * want one formula always).
 */
export function computePartOfFortune(
  ascLon: number, moonLon: number, sunLon: number,
  isNightChart: boolean, nightMode: 'reverse' | 'same' = 'reverse'
): number {
  const useNightFormula = isNightChart && nightMode === 'reverse';
  return norm360(useNightFormula ? ascLon + sunLon - moonLon : ascLon + moonLon - sunLon);
}

/**
 * Part of Spirit. The exact mirror of Part of Fortune, and it reverses on
 * sect for the same reason: day is Asc + Sun - Moon, night is Asc + Moon -
 * Sun. This used to be one formula for both, the day one, which handed a
 * night birth the night Part of Fortune under Spirit's name. It was kept as
 * a declared simplification while nothing else in the build had any sect
 * logic at all; the app has it now, so the two would only drift.
 * nightMode takes the same two values Part of Fortune's does, so a caller
 * that wants the old behaviour asks for it by name rather than by accident.
 */
export function computePartOfSpirit(
  ascLon: number, sunLon: number, moonLon: number,
  isNightChart: boolean = false, nightMode: 'reverse' | 'same' = 'reverse'
): number {
  const useNightFormula = isNightChart && nightMode === 'reverse';
  return norm360(useNightFormula ? ascLon + moonLon - sunLon : ascLon + sunLon - moonLon);
}

/** Midpoint along the SHORTER arc between two longitudes. Averaging the
 *  raw numbers picks the wrong point whenever the pair straddles 0/360:
 *  sun=350, moon=10 naively averages to 180 (the far side) instead of 0
 *  (the near side), which is the bug this function exists to not have. */
export function computeSunMoonMidpoint(sunLonDeg: number, moonLonDeg: number): number {
  let diff = moonLonDeg - sunLonDeg;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return norm360(sunLonDeg + diff / 2);
}

const OBLIQUITY_J2000 = 23.4393; // degrees; fixed, matching ascendant()'s own constant

/**
 * Local Ascendant/Vertex share one formula (Meeus 12; the same formula
 * ascendant() already uses in inCommonApp v2.dc.html):
 *   tan(point) = -cos(RAMC) / (sin(RAMC) cos(eps) + tan(lat) sin(eps))
 * The Vertex is the WESTERN point where the ecliptic crosses the prime
 * vertical rather than the horizon, and the standard construction for it
 * (see e.g. Michelsen, "The American Ephemeris", appendix on the Vertex)
 * is exactly this same Ascendant formula evaluated at RAMC + 180 degrees
 * with the observer's latitude replaced by its colatitude (90 - lat):
 * swapping which great circle you are asking about turns out to be the
 * same trigonometry with those two substitutions. This file implements
 * it that way rather than deriving a separate formula, per the brief's
 * own instruction to "invert the ascendant calculation" if no externally
 * verified test vector is available: see engine.test.ts for why this
 * implementation is checked against a documented near-conjunction
 * consistency test rather than a precise external reference value, and
 * flag this in review if a trusted Astrodienst/astro.com output ever
 * becomes available to check it against directly.
 */
function ascendantLike(ramcDeg: number, latDeg: number): number {
  const ramc = ramcDeg * RAD, eps = OBLIQUITY_J2000 * RAD, phi = latDeg * RAD;
  return norm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / RAD);
}

function ramcOf(jd: number, geoLonDeg: number): number {
  const t = t2000(jd);
  return norm360(norm360(280.46061837 + 360.98564736629 * t) + geoLonDeg);
}

/**
 * 6. computeVertex: geographic lat/lon in degrees (lon positive east,
 * matching ascendant()'s own p.birthLon convention and this test's own
 * -74.0060 for NYC being read as west).
 */
export function computeVertex(jd: number, latDeg: number, geoLonDeg: number): number {
  const ramc = ramcOf(jd, geoLonDeg);
  return ascendantLike(ramc + 180, 90 - latDeg);
}

/** Also exposed because Vertex and Ascendant are the same formula with
 *  different inputs, and computeAll() needs both; kept here rather than
 *  duplicated at the call site. */
export function computeAscendant(jd: number, latDeg: number, geoLonDeg: number): number {
  return ascendantLike(ramcOf(jd, geoLonDeg), latDeg);
}
export function computeMidheaven(jd: number, geoLonDeg: number): number {
  const ramc = ramcOf(jd, geoLonDeg) * RAD, eps = OBLIQUITY_J2000 * RAD;
  return norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / RAD);
}

// ============================================================================
// 7. COMETS (mundane only; see cometSolver.ts for the Kepler solve itself)
// ============================================================================

/**
 * 7. computeComet: delegates to cometSolver.keplerSolve. Every point this
 * returns is a comet, and every comet in this registry is tagged
 * category 'comet' with a tooltip ending "mundane charts only" or
 * "mundane astrology only": nothing calls a comet's position a personal
 * placement anywhere in this codebase, and a UI layer that renders one
 * must keep saying so, not just this module.
 */
export function computeComet(id: string, jd: number): { lon: number; magnitude?: number } | null {
  const elements: CometElements | undefined = (COMET_ELEMENTS as Record<string, CometElements>)[id];
  if (!elements) return null;
  try { return keplerSolve(elements, jd); } catch { return null; }
}

// ============================================================================
// 8. HOUSER
// ============================================================================

/**
 * 8. assignHouse: house cusps in, house number out. Ported unchanged from
 * the previous engine.ts (the one part of it with no Swiss Ephemeris
 * dependency and no bug found in review): a point belongs to house N if
 * its longitude falls between cusp N and cusp N+1, wraparound at 0
 * handled by comparing which way the interval runs rather than assuming
 * cusp[i] < cusp[i+1].
 */
export function assignHouse(lon: number, houseCusps: number[]): number | undefined {
  if (!houseCusps || houseCusps.length < 12) return undefined;
  const normLon = norm360(lon);
  for (let i = 0; i < 12; i++) {
    const c1 = houseCusps[i], c2 = houseCusps[(i + 1) % 12];
    if (c1 <= c2) { if (normLon >= c1 && normLon < c2) return i + 1; }
    else { if (normLon >= c1 || normLon < c2) return i + 1; }
  }
  return undefined;
}

// ============================================================================
// MAIN EXPORT: computeAll
// ============================================================================

/**
 * Compute every registry point for one instant and place.
 *
 * Angles are a REQUIRED parameter (angles.asc, angles.mc), not derived
 * here: the previous engine.ts derived them internally and got them
 * wrong (hardcoded to 0), and this app already has a working, tested
 * Ascendant/Midheaven calculation (ascendant() in inCommonApp v2.dc.html,
 * which this file's computeAscendant/computeMidheaven mirror exactly for
 * a caller that has no house system of its own yet). Passing angles in
 * means this module can never produce a chart whose angles disagree with
 * whichever house system the caller actually uses.
 *
 * houseCusps is optional; without it every point's house is left
 * undefined rather than guessed.
 *
 * CACHING AND THE WEB WORKER FROM "PROMPT 1-D": neither exists in this
 * codebase. There is no Web Worker wiring anywhere in this app (grep for
 * `new Worker` finds nothing), so this function is a plain synchronous
 * call: ~97 Kepler solves, each a few Newton iterations, comfortably
 * under a millisecond in total, which does not need worker offload to
 * stay off a render's critical path. Round-key caching by (jd|lat|lon)
 * belongs at the CALL SITE once this module is actually wired into the
 * app (the way ephemeris-cache.js already memoises lonOf by body and
 * instant); adding a cache inside a function nobody calls yet would be
 * a guess about an access pattern that does not exist.
 */
export function computeAll(jd: number, lat: number, lon: number, angles: Angles, houseCusps?: number[], opts: ComputeOpts = {}): PointData[] {
  const sun = sweBody(0, jd);
  const moon = sweBody(1, jd);
  const nodes = lunarNode(jd);
  const isNight = opts.isNightChart !== undefined ? opts.isNightChart : sun.lon > 180;
  const lilith = lilithMeanLon(jd);
  const vertex = computeVertex(jd, lat, lon);

  const house = (l: number) => assignHouse(l, houseCusps || []);

  const results: PointData[] = [];

  for (const p of allPoints()) {
    const pd: PointData = { id: p.id, name: p.name, lon: 0, status: 'unavailable' };

    try {
      switch (p.id) {
        case 'asc': pd.lon = angles.asc; pd.status = 'ok'; break;
        case 'mc': pd.lon = angles.mc; pd.status = 'ok'; break;
        case 'ic': pd.lon = norm360(angles.mc + 180); pd.status = 'ok'; break;
        case 'dc': pd.lon = norm360(angles.asc + 180); pd.status = 'ok'; break;

        case 'sun': pd.lon = sun.lon; pd.speed = sun.speed; pd.status = 'ok'; break;
        case 'moon': pd.lon = moon.lon; pd.speed = moon.speed; pd.status = 'ok'; break;
        case 'mercury': case 'venus': case 'mars': case 'jupiter':
        case 'saturn': case 'uranus': case 'neptune': case 'pluto': {
          const idOf: Record<string, number> = { mercury: 2, venus: 3, mars: 4, jupiter: 5, saturn: 6, uranus: 7, neptune: 8, pluto: 9 };
          const r = sweBody(idOf[p.id], jd);
          pd.lon = r.lon; pd.speed = r.speed; pd.status = 'ok';
          break;
        }

        case 'northNode': pd.lon = nodes.northNode; pd.status = 'ok'; break;
        case 'southNode': pd.lon = nodes.southNode; pd.status = 'ok'; break;

        case 'chiron': case 'ceres': case 'pallas': case 'juno': case 'vesta':
        case 'eris': case 'sedna': {
          const mpc: Record<string, number> = { chiron: 2060, ceres: 1, pallas: 2, juno: 3, vesta: 4, eris: 136199, sedna: 90377 };
          const r = sweAsteroid(mpc[p.id], jd);
          if (r) { pd.lon = r.lon; pd.speed = r.speed; pd.status = 'ok'; }
          else { pd.note = 'no orbital elements sourced for this body'; }
          break;
        }

        case 'lilithMean': pd.lon = lilith; pd.status = 'ok'; break;
        case 'lilithOsc':
          pd.note = 'osculating Lilith needs a lunar perturbation theory this module does not implement; only lilithMean is computed';
          break;
        case 'selena': pd.lon = computeSelena(lilith); pd.status = 'fixed'; break;

        case 'mercuryNode': case 'venusNode': case 'marsNode': case 'jupiterNode':
        case 'saturnNode': case 'uranusNode': case 'neptuneNode': case 'plutoNode': {
          const idOf: Record<string, number> = {
            mercuryNode: 2, venusNode: 3, marsNode: 4, jupiterNode: 5,
            saturnNode: 6, uranusNode: 7, neptuneNode: 8, plutoNode: 9
          };
          const pn = planetaryNodes(jd, [idOf[p.id]]);
          const v = pn[idOf[p.id]];
          if (v !== undefined) { pd.lon = v; pd.status = 'fixed'; }
          break;
        }

        case 'partOfFortune':
          pd.lon = computePartOfFortune(angles.asc, moon.lon, sun.lon, isNight, opts.partOfFortuneNightChart);
          pd.status = 'fixed';
          break;
        case 'partOfSpirit':
          pd.lon = computePartOfSpirit(angles.asc, sun.lon, moon.lon, isNight, opts.partOfFortuneNightChart);
          pd.status = 'fixed';
          break;
        case 'ariesPoint': pd.lon = computeAriesPoint(); pd.status = 'fixed'; break;
        case 'vertex': pd.lon = vertex; pd.status = 'ok'; break;
        case 'antivertex': pd.lon = computeAntivertex(vertex); pd.status = 'fixed'; break;
        case 'sunmoonMidpoint': pd.lon = computeSunMoonMidpoint(sun.lon, moon.lon); pd.status = 'ok'; break;

        case 'halley': case 'halebopp': case 'hyakutake': {
          const c = computeComet(p.id, jd);
          if (c) { pd.lon = c.lon; pd.status = 'ok'; }
          else { pd.note = 'comet position unavailable'; }
          break;
        }

        default:
          pd.note = 'no orbital elements sourced for this body';
      }
    } catch (err) {
      pd.status = 'unavailable';
      pd.note = (err as Error).message;
      if (opts.logErrors) console.error('computeAll: ' + p.id + ': ' + (err as Error).message);
    }

    if (pd.status !== 'unavailable') pd.house = house(pd.lon);
    results.push(pd);
  }

  return results;
}
