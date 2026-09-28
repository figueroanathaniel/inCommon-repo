import * as Astronomy from "astronomy-engine";
import { Aspect, AspectType, NatalChart, PlanetKey, PlanetPosition, PointKind } from "./astroEngine";

export type AsteroidPosition = { key: PlanetKey; longitude: number; latitude: number; retrograde: boolean };

const norm = (x: number) => ((x % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

const ALL_ASPECTS: { type: AspectType; angle: number; orb: number }[] = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "semisextile", angle: 30, orb: 2 },
  { type: "semisquare", angle: 45, orb: 2 },
  { type: "sextile", angle: 60, orb: 5 },
  { type: "quintile", angle: 72, orb: 1.5 },
  { type: "square", angle: 90, orb: 7 },
  { type: "trine", angle: 120, orb: 7 },
  { type: "sesquiquadrate", angle: 135, orb: 2 },
  { type: "quincunx", angle: 150, orb: 3 },
  { type: "opposition", angle: 180, orb: 8 },
];

export const MAJOR_ASPECTS = new Set<AspectType>(["conjunction", "sextile", "square", "trine", "opposition"]);

const META: Record<string, { name: string; glyph: string; kind: PointKind }> = {
  southNode: { name: "South Node", glyph: "☋", kind: "node" },
  lilith: { name: "Black Moon Lilith", glyph: "⚸", kind: "point" },
  chiron: { name: "Chiron", glyph: "⚷", kind: "asteroid" },
  ceres: { name: "Ceres", glyph: "⚳", kind: "asteroid" },
  pallas: { name: "Pallas", glyph: "⚴", kind: "asteroid" },
  juno: { name: "Juno", glyph: "⚵", kind: "asteroid" },
  vesta: { name: "Vesta", glyph: "⚶", kind: "asteroid" },
  eris: { name: "Eris", glyph: "Er", kind: "asteroid" },
  vertex: { name: "Vertex", glyph: "Vx", kind: "point" },
  fortune: { name: "Part of Fortune", glyph: "⊗", kind: "point" },
  eastPoint: { name: "East Point", glyph: "EP", kind: "point" },
};

function ascFn(ramcDeg: number, latDeg: number, eps: number) {
  const r = rad(ramcDeg);
  return norm(deg(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(eps) + Math.tan(rad(latDeg)) * Math.sin(eps)))));
}

/** Builds the Luminary advanced chart: natal planets plus nodes, Lilith, asteroids, and sensitive points, with minor aspects. */
export function buildAdvancedChart(
  natal: NatalChart,
  location: { latitude: number; longitude: number } | null,
  asteroids: AsteroidPosition[] | null,
  opts: { minorAspects: boolean } = { minorAspects: true }
): NatalChart {
  const T = (natal.instant.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const eps = rad(23.4392911 - 0.0130042 * T);
  const houseOf = (lon: number) => (natal.ascendant === null ? null : Math.floor(norm(lon - natal.ascendant) / 30) + 1);
  const make = (key: PlanetKey, lon: number, retrograde = false): PlanetPosition => ({
    key,
    name: META[key].name,
    glyph: META[key].glyph,
    longitude: norm(lon),
    signIndex: Math.floor(norm(lon) / 30),
    degreeInSign: norm(lon) % 30,
    retrograde,
    house: houseOf(lon),
    kind: META[key].kind,
  });

  const planets: PlanetPosition[] = natal.planets.map((p) => ({ ...p, kind: p.key === "northNode" ? "node" : "planet" }));
  const nn = natal.planets.find((p) => p.key === "northNode")!;
  planets.push(make("southNode", nn.longitude + 180, true));
  const lilith = 83.3532465 + 4069.0137287 * T - 0.01032 * T * T - (T * T * T) / 80053 + (T * T * T * T) / 18999000;
  planets.push(make("lilith", lilith));

  for (const a of asteroids ?? []) planets.push(make(a.key, a.longitude, a.retrograde));

  if (location && natal.ascendant !== null) {
    const ramc = norm(Astronomy.SiderealTime(natal.instant) * 15 + location.longitude);
    const colat = location.latitude >= 0 ? 90 - location.latitude : -90 - location.latitude;
    planets.push(make("vertex", ascFn(ramc - 180, colat, eps)));
    planets.push(make("eastPoint", ascFn(ramc, 0, eps)));
    const sun = natal.planets.find((p) => p.key === "sun")!;
    const moon = natal.planets.find((p) => p.key === "moon")!;
    const dayChart = (sun.house ?? 1) >= 7;
    planets.push(make("fortune", dayChart ? natal.ascendant + moon.longitude - sun.longitude : natal.ascendant + sun.longitude - moon.longitude));
  }

  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if ((a.key === "northNode" && b.key === "southNode") || (a.key === "southNode" && b.key === "northNode")) continue;
      const scale = a.kind === "planet" && b.kind === "planet" ? 1 : 0.6;
      let diff = Math.abs(norm(a.longitude - b.longitude));
      if (diff > 180) diff = 360 - diff;
      for (const asp of ALL_ASPECTS) {
        if (!opts.minorAspects && !MAJOR_ASPECTS.has(asp.type)) continue;
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb * scale) {
          aspects.push({ a: a.key, b: b.key, type: asp.type, orb });
          break;
        }
      }
    }
  }

  return { ...natal, planets, aspects };
}
