import type { AsteroidPosition } from "./types";

// Backend-only: precise geocentric ecliptic-of-date positions from NASA JPL Horizons.
const BODIES: { key: AsteroidPosition["key"]; command: string }[] = [
  { key: "chiron", command: "2060;" },
  { key: "ceres", command: "1;" },
  { key: "pallas", command: "2;" },
  { key: "juno", command: "3;" },
  { key: "vesta", command: "4;" },
  { key: "eris", command: "136199;" },
];

async function fetchBody(command: string, jd: number) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${command}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'500@399'",
    TLIST: `'${jd.toFixed(6)}' '${(jd + 1).toFixed(6)}'`,
    QUANTITIES: "'31'",
    ANG_FORMAT: "'DEG'",
    CSV_FORMAT: "'YES'",
  });
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`);
  if (!res.ok) throw new Error(`Horizons ${res.status}`);
  const data = (await res.json()) as { result?: string; error?: string };
  if (!data.result) throw new Error(data.error ?? "Horizons returned no result");
  const block = data.result.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!block) throw new Error("Horizons: no ephemeris block");
  const rows = block
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((s) => s.trim()))
    .map((cols) => ({ lon: parseFloat(cols[3]), lat: parseFloat(cols[4]) }));
  if (rows.length < 2 || Number.isNaN(rows[0].lon)) throw new Error("Horizons: unparseable row");
  let delta = rows[1].lon - rows[0].lon;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return { lon: rows[0].lon, lat: rows[0].lat, retrograde: delta < 0 };
}

export async function horizonsServer(instant: Date): Promise<AsteroidPosition[]> {
  const jd = instant.getTime() / 86400000 + 2440587.5;
  const out: AsteroidPosition[] = [];
  // Horizons rejects concurrent requests from one IP (503), so query sequentially with a short backoff.
  for (const b of BODIES) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const v = await fetchBody(b.command, jd);
        out.push({ key: b.key, longitude: v.lon, latitude: v.lat, retrograde: v.retrograde });
        break;
      } catch (e) {
        if (attempt === 2) console.error(`Horizons failed for ${b.key}`, e);
        else await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }
  if (out.length === 0) throw new Error("Could not reach the JPL ephemeris right now. Please try again shortly.");
  return out;
}

export const HORIZONS_BODY_COUNT = BODIES.length;
