import * as Astronomy from "astronomy-engine";

export type PlanetKey =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "northNode"
  // Advanced chart (Luminary): asteroids, centaurs, dwarf planets, and sensitive points
  | "southNode"
  | "lilith"
  | "chiron"
  | "ceres"
  | "pallas"
  | "juno"
  | "vesta"
  | "eris"
  | "vertex"
  | "fortune"
  | "eastPoint";

export type PointKind = "planet" | "node" | "asteroid" | "point";

export type PlanetPosition = {
  key: PlanetKey;
  name: string;
  glyph: string;
  longitude: number;
  signIndex: number;
  degreeInSign: number;
  retrograde: boolean;
  house: number | null;
  kind?: PointKind;
};

export type AspectType =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition"
  | "semisextile"
  | "semisquare"
  | "quintile"
  | "sesquiquadrate"
  | "quincunx";

export type Aspect = {
  a: PlanetKey;
  b: PlanetKey;
  type: AspectType;
  orb: number;
};

export type NatalChart = {
  instant: Date;
  planets: PlanetPosition[];
  ascendant: number | null;
  midheaven: number | null;
  houseCusps: number[] | null;
  aspects: Aspect[];
};

export const SIGN_NAMES = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// ︎ forces text (non-emoji) presentation
export const SIGN_GLYPHS = [
  "♈︎",
  "♉︎",
  "♊︎",
  "♋︎",
  "♌︎",
  "♍︎",
  "♎︎",
  "♏︎",
  "♐︎",
  "♑︎",
  "♒︎",
  "♓︎",
];

const BODY_DEFS: {
  key: PlanetKey;
  name: string;
  glyph: string;
  body?: Astronomy.Body;
}[] = [
  { key: "sun", name: "Sun", glyph: "☉", body: Astronomy.Body.Sun },
  { key: "moon", name: "Moon", glyph: "☽", body: Astronomy.Body.Moon },
  { key: "mercury", name: "Mercury", glyph: "☿", body: Astronomy.Body.Mercury },
  { key: "venus", name: "Venus", glyph: "♀︎", body: Astronomy.Body.Venus },
  { key: "mars", name: "Mars", glyph: "♂︎", body: Astronomy.Body.Mars },
  { key: "jupiter", name: "Jupiter", glyph: "♃", body: Astronomy.Body.Jupiter },
  { key: "saturn", name: "Saturn", glyph: "♄", body: Astronomy.Body.Saturn },
  { key: "uranus", name: "Uranus", glyph: "♅", body: Astronomy.Body.Uranus },
  { key: "neptune", name: "Neptune", glyph: "♆", body: Astronomy.Body.Neptune },
  { key: "pluto", name: "Pluto", glyph: "♇", body: Astronomy.Body.Pluto },
  { key: "northNode", name: "North Node", glyph: "☊" },
];

const norm = (x: number) => ((x % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function julianCenturies(date: Date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525;
}

function meanNode(date: Date) {
  const T = julianCenturies(date);
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
}

export function geocentricLongitude(key: PlanetKey, date: Date): number {
  if (key === "northNode") return meanNode(date);
  if (key === "sun") return norm(Astronomy.SunPosition(date).elon);
  if (key === "moon") return norm(Astronomy.EclipticGeoMoon(date).lon);
  const def = BODY_DEFS.find((b) => b.key === key)!;
  const v = Astronomy.GeoVector(def.body!, date, true);
  return norm(Astronomy.Ecliptic(v).elon);
}

/** Geocentric ecliptic-of-date longitude and latitude (degrees). Nodes and points return latitude 0. */
export function geocentricEcliptic(key: PlanetKey, date: Date): { lon: number; lat: number } {
  if (key === "moon") {
    const m = Astronomy.EclipticGeoMoon(date);
    return { lon: norm(m.lon), lat: m.lat };
  }
  const def = BODY_DEFS.find((b) => b.key === key);
  if (!def?.body || key === "sun") return { lon: geocentricLongitude(key, date), lat: 0 };
  const e = Astronomy.Ecliptic(Astronomy.GeoVector(def.body, date, true));
  return { lon: norm(e.elon), lat: e.elat };
}

const ASPECTS: { type: AspectType; angle: number; orb: number }[] = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 5 },
  { type: "square", angle: 90, orb: 7 },
  { type: "trine", angle: 120, orb: 7 },
  { type: "opposition", angle: 180, orb: 8 },
];

export function findAspect(lonA: number, lonB: number, orbScale = 1) {
  let diff = Math.abs(norm(lonA - lonB));
  if (diff > 180) diff = 360 - diff;
  for (const asp of ASPECTS) {
    const orb = Math.abs(diff - asp.angle);
    if (orb <= asp.orb * orbScale) return { type: asp.type, orb };
  }
  return null;
}

export function astroEngine(
  instant: Date,
  location: { latitude: number; longitude: number } | null
): NatalChart {
  let ascendant: number | null = null;
  let midheaven: number | null = null;
  let houseCusps: number[] | null = null;

  if (location) {
    const T = julianCenturies(instant);
    const eps = rad(23.4392911 - 0.0130042 * T);
    const gast = Astronomy.SiderealTime(instant); // hours
    const ramc = rad(norm(gast * 15 + location.longitude));
    const phi = rad(location.latitude);
    midheaven = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
    ascendant = norm(
      deg(
        Math.atan2(
          Math.cos(ramc),
          -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
        )
      )
    );
    houseCusps = Array.from({ length: 12 }, (_, i) => norm(ascendant! + i * 30));
  }

  const planets: PlanetPosition[] = BODY_DEFS.map((def) => {
    const lon = geocentricLongitude(def.key, instant);
    const later = geocentricLongitude(def.key, new Date(instant.getTime() + 3600_000 * 12));
    let delta = later - lon;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const retrograde = def.key === "northNode" ? true : delta < 0;
    return {
      key: def.key,
      name: def.name,
      glyph: def.glyph,
      longitude: lon,
      signIndex: Math.floor(lon / 30),
      degreeInSign: lon % 30,
      retrograde: def.key === "sun" || def.key === "moon" ? false : retrograde,
      house: ascendant === null ? null : Math.floor(norm(lon - ascendant) / 30) + 1,
    };
  });

  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = findAspect(planets[i].longitude, planets[j].longitude);
      if (a) aspects.push({ a: planets[i].key, b: planets[j].key, type: a.type, orb: a.orb });
    }
  }

  return { instant, planets, ascendant, midheaven, houseCusps, aspects };
}

export function formatDegree(lon: number) {
  const signIndex = Math.floor(norm(lon) / 30);
  const within = norm(lon) % 30;
  const d = Math.floor(within);
  const m = Math.floor((within - d) * 60);
  return `${d}°${m.toString().padStart(2, "0")}′ ${SIGN_NAMES[signIndex]}`;
}
