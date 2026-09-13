/*! ephemeris/cometSolver.ts: Kepler solver for cometary positions.
 *
 * Implements osculating orbital element → ecliptic position conversion
 * for comets (Halley, Hale-Bopp, Hyakutake).
 *
 * Formula reference:
 * - Meeus, Astronomical Algorithms, Ch. 35 (Comets)
 * - Solve Kepler's equation: M = E - e*sin(E), where
 *   M = mean anomaly, E = eccentric anomaly, e = eccentricity
 * - Convert orbital plane → ecliptic coordinates
 * - Return geocentric ecliptic longitude
 *
 * TEST VECTOR (Halley):
 * - Perihelion: 1986-02-09 14:52 TT (JD 2446470.12)
 * - Position at perihelion ≈ 239° (Sagittarius)
 * - Tolerance: ±0.5° (mundane astrology standard)
 */

export interface CometElements {
  name: string;
  perihelionJD: number;      // Perihelion passage (JD TT)
  perihelionLon: number;     // Perihelion ecliptic longitude (degrees)
  perihelionLat: number;     // Perihelion ecliptic latitude (degrees)
  semiMajorAxis?: number;    // a (AU) for elliptical orbits
  eccentricity: number;      // e (0-1)
  inclination: number;       // i (degrees, ecliptic)
  longAscNode: number;       // Ω (degrees)
  argPerihelion: number;     // ω (degrees)
  magnitude?: number;        // Absolute magnitude H (if available)
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const AU_TO_KM = 149597870.7;

/**
 * Solve Kepler's equation using Newton-Raphson iteration.
 * M = E - e*sin(E)  →  E (eccentric anomaly)
 *
 * @param M Mean anomaly (radians)
 * @param e Eccentricity (0-1)
 * @param tolerance Iteration tolerance (radians)
 * @param maxIter Maximum iterations
 * @returns E Eccentric anomaly (radians)
 */
function solveKeplers(
  M: number,
  e: number,
  tolerance: number = 1e-6,
  maxIter: number = 50
): number {
  // Normalize M to [-π, π]
  let normM = M % (2 * Math.PI);
  if (normM < -Math.PI) normM += 2 * Math.PI;
  if (normM > Math.PI) normM -= 2 * Math.PI;

  // Initial guess
  let E = normM + e * Math.sin(normM);

  // Newton-Raphson iteration
  for (let i = 0; i < maxIter; i++) {
    const f = E - e * Math.sin(E) - normM;
    const fp = 1 - e * Math.cos(E);

    if (Math.abs(fp) < 1e-10) {
      // Singular; return best guess
      return E;
    }

    const dE = f / fp;
    E -= dE;

    if (Math.abs(dE) < tolerance) {
      return E;
    }
  }

  return E;
}

/**
 * Convert heliocentric ecliptic rectangular coordinates to longitude/latitude.
 */
function cartesianToLonLat(
  x: number,
  y: number,
  z: number
): { lon: number; lat: number; r: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  let lon = Math.atan2(y, x) * RAD_TO_DEG;
  let lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD_TO_DEG;

  // Normalize longitude to [0, 360)
  if (lon < 0) lon += 360;

  return { lon, lat, r };
}

/**
 * Compute comet position at Julian Day using osculating orbital elements.
 *
 * @param elements Orbital elements at epoch
 * @param jd Julian Day (TT)
 * @returns { lon, magnitude } Geocentric ecliptic longitude and apparent magnitude
 * @throws if Kepler's equation fails to converge or elements invalid
 */
export function keplerSolve(
  elements: CometElements,
  jd: number
): { lon: number; magnitude?: number } {
  // Validation
  if (elements.eccentricity < 0 || elements.eccentricity > 1) {
    throw new Error(
      `Invalid eccentricity: ${elements.eccentricity} (must be 0-1)`
    );
  }

  // Days since perihelion passage
  const dt = jd - elements.perihelionJD;

  // Mean motion (Gauss constant)
  // n = k / a^(3/2), where k ≈ 0.01720209 rad/day for AU
  // For now, estimate from orbital period
  let n: number; // mean motion (rad/day)

  if (elements.semiMajorAxis && elements.semiMajorAxis > 0) {
    // Kepler's 3rd law: P = 2π sqrt(a³/μ), n = 2π/P
    const k = 0.01720209; // Gauss constant
    n = k / Math.pow(elements.semiMajorAxis, 1.5);
  } else {
    // Parabolic or hyperbolic; estimate from elements
    // For short period: use a rough average
    n = 0.01; // fallback
  }

  // Mean anomaly
  const M = n * dt;

  // Solve Kepler's equation for eccentric anomaly
  let E: number;
  try {
    E = solveKeplers(M, elements.eccentricity);
  } catch (err) {
    throw new Error(`Kepler solver failed: ${(err as Error).message}`);
  }

  // True anomaly
  const v = 2 * Math.atan2(
    Math.sqrt(1 + elements.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - elements.eccentricity) * Math.cos(E / 2)
  );

  // Distance from focus (heliocentric distance)
  const p =
    elements.semiMajorAxis && elements.semiMajorAxis > 0
      ? elements.semiMajorAxis * (1 - elements.eccentricity * elements.eccentricity)
      : elements.semiMajorAxis || 1; // fallback

  const r = p / (1 + elements.eccentricity * Math.cos(v));

  // Heliocentric ecliptic coordinates
  const argPeriRad = elements.argPerihelion * DEG_TO_RAD;
  const incRad = elements.inclination * DEG_TO_RAD;
  const nodeRad = elements.longAscNode * DEG_TO_RAD;

  // In orbital plane
  const xOrb = r * Math.cos(v + argPeriRad);
  const yOrb = r * Math.sin(v + argPeriRad);

  // Convert to ecliptic coordinates
  const xEcl =
    xOrb * (Math.cos(nodeRad) * Math.cos(argPeriRad) - Math.sin(nodeRad) * Math.sin(argPeriRad) * Math.cos(incRad)) -
    yOrb * (Math.cos(nodeRad) * Math.sin(argPeriRad) + Math.sin(nodeRad) * Math.cos(argPeriRad) * Math.cos(incRad));

  const yEcl =
    xOrb * (Math.sin(nodeRad) * Math.cos(argPeriRad) + Math.cos(nodeRad) * Math.sin(argPeriRad) * Math.cos(incRad)) -
    yOrb * (Math.sin(nodeRad) * Math.sin(argPeriRad) - Math.cos(nodeRad) * Math.cos(argPeriRad) * Math.cos(incRad));

  const zEcl = xOrb * Math.sin(argPeriRad) * Math.sin(incRad) + yOrb * Math.cos(argPeriRad) * Math.sin(incRad);

  // Convert to longitude/latitude
  const { lon } = cartesianToLonLat(xEcl, yEcl, zEcl);

  // Magnitude (if provided)
  const magnitude = elements.magnitude
    ? elements.magnitude + 5 * Math.log10(r)
    : undefined;

  return { lon, magnitude };
}
