/*! ephemeris/cometSolver.ts: Kepler solver for cometary positions.
 *
 * Converts osculating orbital elements (Halley, Hale-Bopp, Hyakutake, from
 * cometElements.ts) to a geocentric ecliptic longitude at a given Julian Day.
 *
 * Formula reference: Meeus, Astronomical Algorithms, Ch. 33 (orbital
 * elements to rectangular coordinates) and Ch. 35 (elliptical motion).
 *
 * TWO BUGS FIXED HERE, both real, both silent until checked against a
 * known position:
 *
 * 1. The rotation from the orbital plane to the ecliptic used to fold the
 *    argument of perihelion into BOTH the orbital-plane coordinates
 *    (xOrb = r*cos(v + omega)) AND the rotation matrix that follows,
 *    which already expects xOrb/yOrb measured from perihelion and applies
 *    omega itself. That is the same rotation applied twice, and it does
 *    not cancel out except when omega is 0 or 180. The orbital-plane
 *    coordinates below are measured from perihelion only (r*cos(v),
 *    r*sin(v)); the rotation matrix is the only place omega, i and Omega
 *    apply.
 *
 * 2. The old code returned the HELIOCENTRIC longitude, unlabelled, which
 *    reads as a geocentric one because nothing else here suggests
 *    otherwise. Astrology is geocentric throughout this app. Halley at
 *    its 1986 perihelion was 0.587 AU from the Sun, well inside Earth's
 *    own 1 AU, so the heliocentric and geocentric longitudes differ by
 *    several degrees there, not a rounding error. This file now also
 *    computes Earth's own heliocentric position (same coplanar Keplerian
 *    model the app already uses for the astral bodies, from ephemeris/engine.ts)
 *    and returns the geocentric difference.
 */

export interface CometElements {
  name: string;
  perihelionJD: number;      // Perihelion passage (JD TT)
  perihelionLon: number;     // Perihelion ecliptic longitude (degrees, reference only)
  perihelionLat: number;     // Perihelion ecliptic latitude (degrees, reference only)
  semiMajorAxis?: number;    // a (AU) for elliptical orbits
  eccentricity: number;      // e (0-1)
  inclination: number;       // i (degrees, ecliptic)
  longAscNode: number;       // Omega (degrees)
  argPerihelion: number;     // omega (degrees)
  magnitude?: number;        // Absolute magnitude H (if available)
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/* Gaussian gravitational constant, radians/day at a = 1 AU around the Sun.
   Same constant family as motion() in minor-bodies-ephemeris.js, which uses
   its degrees-per-day equivalent (0.9856076686 = k * 180/pi). Kept in
   radians here because solveKeplers works in radians throughout. */
const GAUSS_K = 0.01720209895;

/* Earth's own coplanar elements, identical to EARTH_EL in the app's own
   inCommonApp v2.dc.html: [L0, n, e, varpi, a]. Duplicated here (rather
   than imported) because cometSolver.ts has no dependency on the live
   app shell and should not gain one just to read four numbers. */
const EARTH_L0 = 100.46435, EARTH_N = 0.98564736, EARTH_E = 0.01671, EARTH_VARPI = 102.937, EARTH_A = 1.00000;

/**
 * Solve Kepler's equation M = E - e*sin(E) for E, by Newton-Raphson.
 * @param M Mean anomaly (radians, any range)
 * @param e Eccentricity (0-1)
 */
function solveKeplers(M: number, e: number, tolerance: number = 1e-9, maxIter: number = 30): number {
  let normM = M % (2 * Math.PI);
  if (normM < -Math.PI) normM += 2 * Math.PI;
  if (normM > Math.PI) normM -= 2 * Math.PI;

  let E = normM + e * Math.sin(normM);
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - normM;
    const fp = 1 - e * Math.cos(E);
    if (Math.abs(fp) < 1e-12) return E; // singular (e -> 1); best guess
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < tolerance) return E;
  }
  return E;
}

/**
 * Heliocentric ecliptic x,y,z from Keplerian elements at true anomaly v.
 * Orbital-plane coordinates are measured from perihelion (angle v alone);
 * omega, i and Omega are applied ONCE, in this rotation, and nowhere else.
 */
function orbitToEcliptic(r: number, v: number, incDeg: number, nodeDeg: number, argPeriDeg: number): [number, number, number] {
  const xOrb = r * Math.cos(v);
  const yOrb = r * Math.sin(v);

  const i = incDeg * DEG_TO_RAD, Om = nodeDeg * DEG_TO_RAD, w = argPeriDeg * DEG_TO_RAD;
  const cosO = Math.cos(Om), sinO = Math.sin(Om);
  const cosW = Math.cos(w), sinW = Math.sin(w);
  const cosI = Math.cos(i), sinI = Math.sin(i);

  const x = (cosO * cosW - sinO * sinW * cosI) * xOrb + (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const y = (sinO * cosW + cosO * sinW * cosI) * xOrb + (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb;
  return [x, y, z];
}

/** Earth's heliocentric position via the same coplanar model the astral bodies use. */
function earthHeliocentric(jd: number): [number, number, number] {
  const t = jd - 2451545.0;
  const M = (((EARTH_L0 + EARTH_N * t - EARTH_VARPI) % 360 + 360) % 360) * DEG_TO_RAD;
  const E = solveKeplers(M, EARTH_E);
  const v = 2 * Math.atan2(Math.sqrt(1 + EARTH_E) * Math.sin(E / 2), Math.sqrt(1 - EARTH_E) * Math.cos(E / 2));
  const r = EARTH_A * (1 - EARTH_E * Math.cos(E));
  const lon = EARTH_VARPI * DEG_TO_RAD + v; // coplanar: Omega+omega collapsed into varpi, i=0
  return [r * Math.cos(lon), r * Math.sin(lon), 0];
}

/**
 * Compute a comet's geocentric ecliptic longitude at a Julian Day, from
 * osculating elements anchored at perihelion passage (mean anomaly is
 * always n*(jd - perihelionJD): zero exactly at perihelion, by
 * construction, so no separate epoch/M0 bookkeeping is needed for these
 * three single-apparition fits).
 */
export function keplerSolve(elements: CometElements, jd: number): { lon: number; magnitude?: number } {
  if (elements.eccentricity < 0 || elements.eccentricity >= 1) {
    throw new Error(`Invalid eccentricity for a Kepler ellipse: ${elements.eccentricity} (must be 0-1)`);
  }
  if (!elements.semiMajorAxis || elements.semiMajorAxis <= 0) {
    throw new Error('keplerSolve requires a positive semiMajorAxis (parabolic/hyperbolic comets are not supported here)');
  }

  const a = elements.semiMajorAxis, e = elements.eccentricity;
  const n = GAUSS_K / Math.pow(a, 1.5); // Kepler's third law, radians/day

  const dt = jd - elements.perihelionJD;
  const M = n * dt; // mean anomaly is 0 exactly at perihelion by construction

  const E = solveKeplers(M, e);
  const v = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const r = a * (1 - e * Math.cos(E));

  const [xh, yh] = orbitToEcliptic(r, v, elements.inclination, elements.longAscNode, elements.argPerihelion);
  const [xe, ye] = earthHeliocentric(jd);

  let lon = Math.atan2(yh - ye, xh - xe) * RAD_TO_DEG;
  lon = ((lon % 360) + 360) % 360;

  const magnitude = elements.magnitude !== undefined
    ? elements.magnitude + 5 * Math.log10(Math.max(r, 1e-6))
    : undefined;

  return { lon, magnitude };
}
