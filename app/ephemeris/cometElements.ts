/*! ephemeris/cometElements.ts: Osculating orbital elements for major comets.
 *
 * Data source: JPL Horizons System / Minor Planet Center
 * Retrieved: 2026-09 (sample computation epoch)
 * Reference: Meeus, Astronomical Algorithms, Ch. 35
 *
 * Elements are given at a specific epoch and are osculating (best-fit)
 * for the orbital arc they span. For long-period comets like Halley,
 * perturbations accumulate, so elements degrade over decades away from epoch.
 *
 * For production use:
 * 1. Download latest elements from JPL Horizons or MPC
 * 2. Replace epoch JD and orbital elements
 * 3. Validate against astro.com / Astrodienst output at test date
 *
 * Citation format:
 * - JPL Horizons: "Horizons System, NASA Jet Propulsion Laboratory"
 * - MPC: "Minor Planet Center, International Astronomical Union"
 */

export interface CometElements {
  name: string;
  perihelionJD: number;      // Perihelion passage (JD TT)
  perihelionLon: number;     // Perihelion ecliptic longitude (degrees, for reference)
  perihelionLat: number;     // Perihelion ecliptic latitude (degrees, for reference)
  semiMajorAxis?: number;    // a (AU) — semi-major axis
  eccentricity: number;      // e (0-1) — eccentricity
  inclination: number;       // i (degrees) — orbital inclination
  longAscNode: number;       // Ω (degrees) — longitude of ascending node
  argPerihelion: number;     // ω (degrees) — argument of perihelion
  magnitude?: number;        // Absolute magnitude H (for brightness estimation)
  epoch?: number;            // JD epoch for which elements are valid
  source?: string;           // Data source citation
}

/**
 * Halley's Comet
 * - Orbital period: ~76 years
 * - Next perihelion: 2061-07-28
 * - Last perihelion: 1986-02-09
 *
 * Elements from JPL Horizons at perihelion 1986-02-09 (JD 2446470.12)
 * These are well-constrained historical elements; valid for centuries around 1986.
 */
export const HALLEY: CometElements = {
  name: 'Halley',
  perihelionJD: 2446470.12, // 1986-02-09 14:52:48 TT
  perihelionLon: 239.0,     // Sagittarius region (reference)
  perihelionLat: -0.14,     // Nearly ecliptic
  semiMajorAxis: 17.94,     // AU (elliptical, a = 17.94 AU)
  eccentricity: 0.9671,     // Highly eccentric
  inclination: 162.2421,    // Retrograde
  longAscNode: 58.42,       // degrees
  argPerihelion: 111.33,    // degrees
  magnitude: 0.4,           // Absolute magnitude at 1 AU from Sun and Earth
  epoch: 2446470.12,        // Epoch of osculating elements
  source: 'JPL Horizons, perihelion 1986-02-09'
};

/**
 * Hale-Bopp (C/1995 O1)
 * - Perihelion: 1997-04-01
 * - Long-period comet with ~2,533-year orbital period
 *
 * Elements from JPL at perihelion approach (1997-04-01, JD 2450540.5)
 * Valid primarily 1995-1999; degrades significantly after.
 */
export const HALE_BOPP: CometElements = {
  name: 'Hale-Bopp',
  perihelionJD: 2450540.5,   // 1997-04-01 12:00 TT (approximate)
  perihelionLon: 282.0,      // Taurus/Gemini region
  perihelionLat: -89.5,      // Nearly perpendicular to ecliptic
  semiMajorAxis: 186.5,      // AU (very elongated elliptical)
  eccentricity: 0.9951,      // Nearly parabolic
  inclination: 89.43,        // Nearly perpendicular to ecliptic
  longAscNode: 282.47,       // degrees
  argPerihelion: 130.73,     // degrees
  magnitude: -1.1,           // Very bright at perihelion
  epoch: 2450540.5,
  source: 'JPL Horizons, perihelion 1997-04-01'
};

/**
 * Hyakutake (C/1996 B2)
 * - Perihelion: 1996-05-01
 * - Long-period comet; discovered 1996, passed within 0.15 AU of Earth
 *
 * Elements from JPL at perihelion (1996-05-01, JD 2450214.5)
 * Valid primarily 1996; significant perturbation effects 1800s-2000s.
 */
export const HYAKUTAKE: CometElements = {
  name: 'Hyakutake',
  perihelionJD: 2450214.5,   // 1996-05-01 12:00 TT
  perihelionLon: 131.0,      // Leo region
  perihelionLat: +61.4,      // Far north of ecliptic
  semiMajorAxis: 175.0,      // AU (approximate; highly eccentric)
  eccentricity: 0.999633,    // Extremely eccentric
  inclination: 124.4,        // Retrograde
  longAscNode: 188.6,        // degrees
  argPerihelion: 20.5,       // degrees
  magnitude: 0.5,            // Moderately bright
  epoch: 2450214.5,
  source: 'JPL Horizons, perihelion 1996-05-01'
};

/**
 * Registry of all comets available for computation.
 * Keyed by ID (from pointRegistry.ts).
 */
export const COMET_ELEMENTS: Record<string, CometElements> = {
  halley: HALLEY,
  halebopp: HALE_BOPP,
  hyakutake: HYAKUTAKE
};
