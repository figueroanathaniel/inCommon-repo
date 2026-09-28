import * as Astronomy from "astronomy-engine";
import { geocentricEcliptic, geocentricLongitude, PlanetKey } from "./astroEngine";
import type { AsteroidPosition } from "./advancedChart";

export type AcgAngle = "ASC" | "MC" | "DSC" | "IC";
export type AcgLine = { id: string; planet: PlanetKey; name: string; glyph: string; angle: AcgAngle; segments: [number, number][][] };
export type AcgHit = { line: AcgLine; distanceKm: number };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm = (x: number) => ((x % 360) + 360) % 360;
const wrap180 = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;

export const ACG_BODIES: { key: PlanetKey; name: string; glyph: string }[] = [
  { key: "sun", name: "Sun", glyph: "☉" },
  { key: "moon", name: "Moon", glyph: "☽" },
  { key: "mercury", name: "Mercury", glyph: "☿" },
  { key: "venus", name: "Venus", glyph: "♀︎" },
  { key: "mars", name: "Mars", glyph: "♂︎" },
  { key: "jupiter", name: "Jupiter", glyph: "♃" },
  { key: "saturn", name: "Saturn", glyph: "♄" },
  { key: "uranus", name: "Uranus", glyph: "♅" },
  { key: "neptune", name: "Neptune", glyph: "♆" },
  { key: "pluto", name: "Pluto", glyph: "♇" },
  { key: "northNode", name: "North Node", glyph: "☊" },
  { key: "chiron", name: "Chiron", glyph: "⚷" },
];

function toEquatorial(lon: number, lat: number, eps: number) {
  const l = rad(lon);
  const b = rad(lat);
  const dec = Math.asin(Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l));
  const ra = Math.atan2(Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps), Math.cos(l));
  return { ra: norm(deg(ra)), dec: deg(dec) };
}

/** Split a polyline wherever it jumps across the antimeridian. */
function splitDateline(points: [number, number][]) {
  const segs: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (const p of points) {
    const prev = cur[cur.length - 1];
    if (prev && Math.abs(p[1] - prev[1]) > 180) {
      if (cur.length > 1) segs.push(cur);
      cur = [];
    }
    cur.push(p);
  }
  if (cur.length > 1) segs.push(cur);
  return segs;
}

/** Planetary angle lines (Jim Lewis-style astro*carto*graphy) for a birth instant. */
export function computeAcgLines(instant: Date, asteroids: AsteroidPosition[] | null): AcgLine[] {
  const T = (instant.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const eps = rad(23.4392911 - 0.0130042 * T);
  const gast = Astronomy.SiderealTime(instant) * 15;
  const lines: AcgLine[] = [];

  for (const b of ACG_BODIES) {
    let ecl: { lon: number; lat: number } | null = null;
    if (b.key === "chiron") {
      const c = asteroids?.find((a) => a.key === "chiron");
      if (c) ecl = { lon: c.longitude, lat: c.latitude };
    } else if (b.key === "northNode") {
      ecl = { lon: geocentricLongitude("northNode", instant), lat: 0 };
    } else {
      ecl = geocentricEcliptic(b.key, instant);
    }
    if (!ecl) continue;
    const { ra, dec } = toEquatorial(ecl.lon, ecl.lat, eps);

    const mcLon = wrap180(ra - gast);
    const vertical = (lng: number): [number, number][] => Array.from({ length: 161 }, (_, i) => [-80 + i, lng] as [number, number]);
    lines.push({ id: `${b.key}-MC`, planet: b.key, name: b.name, glyph: b.glyph, angle: "MC", segments: [vertical(mcLon)] });
    lines.push({ id: `${b.key}-IC`, planet: b.key, name: b.name, glyph: b.glyph, angle: "IC", segments: [vertical(wrap180(mcLon + 180))] });

    const asc: [number, number][] = [];
    const dsc: [number, number][] = [];
    for (let lat = -78; lat <= 78; lat += 1) {
      const cosH = -Math.tan(rad(lat)) * Math.tan(rad(dec));
      if (Math.abs(cosH) > 1) continue;
      const H0 = deg(Math.acos(cosH));
      asc.push([lat, wrap180(ra - H0 - gast)]);
      dsc.push([lat, wrap180(ra + H0 - gast)]);
    }
    lines.push({ id: `${b.key}-ASC`, planet: b.key, name: b.name, glyph: b.glyph, angle: "ASC", segments: splitDateline(asc) });
    lines.push({ id: `${b.key}-DSC`, planet: b.key, name: b.name, glyph: b.glyph, angle: "DSC", segments: splitDateline(dsc) });
  }
  return lines;
}

/** Ascendant and Midheaven (ecliptic longitudes) if born at the same instant in another place. */
export function relocatedAngles(instant: Date, lat: number, lng: number) {
  const T = (instant.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;
  const eps = rad(23.4392911 - 0.0130042 * T);
  const ramc = rad(norm(Astronomy.SiderealTime(instant) * 15 + lng));
  const mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
  const asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)))));
  return { asc, mc };
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Lines passing within `radiusKm` of a location, nearest first. */
export function linesNear(lines: AcgLine[], lat: number, lng: number, radiusKm = 800): AcgHit[] {
  const hits: AcgHit[] = [];
  for (const line of lines) {
    let best = Infinity;
    for (const seg of line.segments) {
      for (let i = 0; i < seg.length; i++) {
        best = Math.min(best, haversineKm([lat, lng], seg[i]));
        if (i > 0) {
          // midpoint refinement for 1° spacing
          const mid: [number, number] = [(seg[i][0] + seg[i - 1][0]) / 2, (seg[i][1] + seg[i - 1][1]) / 2];
          best = Math.min(best, haversineKm([lat, lng], mid));
        }
      }
    }
    if (best <= radiusKm) hits.push({ line, distanceKm: Math.round(best) });
  }
  return hits.sort((a, b) => a.distanceKm - b.distanceKm);
}
