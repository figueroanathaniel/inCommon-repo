/* house-systems.js: where the twelve houses begin, in every system the
   Astropedia teaches. Mechanics layer: it takes the sky frame (the RAMC, the
   obliquity and the latitude, all in degrees) and returns twelve ecliptic
   longitudes. It reads no clock, no storage and no ephemeris, and it holds no
   writing about what a house means.

   The systems, by the key the app stores:
     W  Whole Sign      the rising sign is the 1st house, sign by sign
     E  Equal           30 degrees at a time from the Ascendant
     P  Porphyry        each quadrant between the angles cut in three
     O  Placidus        each degree's own diurnal and nocturnal arcs in three
     K  Koch            the Midheaven degree's arc in three, as Ascendants
     R  Regiomontanus   the celestial equator in twelve, through the horizon's north and south
     C  Campanus        the prime vertical in twelve, through the same two points
     A  Alcabitius      the Ascendant degree's arcs in three, along right ascension
     T  Topocentric     pole heights a third and two thirds of the latitude
     M  Morinus         the equator in twelve, carried to the ecliptic through its poles
     X  Meridian        the equator in twelve, carried through the celestial poles

   Placidus and Koch divide time rather than space, and inside the polar
   circles (latitude at or beyond 90 less the obliquity) some degrees of the
   ecliptic never rise or never set, so their cusps do not exist there.
   cusps() then draws Porphyry and says so (fallback: true, asked: the system
   that was asked for), which is what the Swiss Ephemeris does. Every other
   system is defined at every latitude but the poles themselves.

   Every cusp was checked against the Swiss Ephemeris 2.10.03 (pyswisseph,
   houses_armc_ex2) over 768 sky frames from 75 S to 78 N; the fixture is
   tools/fixtures/house-systems-swiss.json. Placidus agrees within a
   millionth of a degree, every other system within a billionth.

   Every cusp is a longitude in [0, 360). House n begins at cusps[n - 1] and
   runs to cusps[n % 12]; houseOf() decides a boundary the way hd-wheel.js does
   for gates: a boundary belongs to the house that begins there. */
(function (root) {
  'use strict';
  const R = Math.PI / 180;
  const norm = x => ((x % 360) + 360) % 360;
  const sin = d => Math.sin(d * R), cos = d => Math.cos(d * R), tan = d => Math.tan(d * R);
  const atan2 = (y, x) => norm(Math.atan2(y, x) / R);

  const SYSTEMS = [
    { key: 'W', name: 'Whole Sign', quadrant: false },
    { key: 'E', name: 'Equal', quadrant: false },
    { key: 'P', name: 'Porphyry', quadrant: true },
    { key: 'O', name: 'Placidus', quadrant: true, polar: true },
    { key: 'K', name: 'Koch', quadrant: true, polar: true },
    { key: 'R', name: 'Regiomontanus', quadrant: true },
    { key: 'C', name: 'Campanus', quadrant: true },
    { key: 'A', name: 'Alcabitius', quadrant: true },
    { key: 'T', name: 'Topocentric', quadrant: true },
    { key: 'M', name: 'Morinus', quadrant: false },
    { key: 'X', name: 'Meridian', quadrant: false }
  ];
  const DEFAULT = 'W';

  /* The ecliptic longitude with right ascension ra (the Midheaven formula). */
  function lonOfRA(ra, eps) { return atan2(sin(ra), cos(ra) * cos(eps)); }
  /* The ecliptic degree rising on a horizon of pole height p when the
     oblique ascension of the east point is h. p = latitude and h = RAMC + 90
     is the Ascendant itself. */
  function lonOnCircle(h, p, eps) {
    return atan2(sin(h), cos(h) * cos(eps) - tan(p) * sin(eps));
  }
  function decOf(lon, eps) { return Math.asin(sin(eps) * sin(lon)) / R; }
  function raOf(lon, eps) { return atan2(sin(lon) * cos(eps), cos(lon)); }
  /* Diurnal semi arc, in degrees, of a declination at a latitude; null when
     the point never rises or never sets. */
  function dsa(dec, lat) {
    const x = -tan(lat) * tan(dec);
    if (x < -1 || x > 1) return null;
    return Math.acos(x) / R;
  }

  /* The Ascendant and Midheaven, picking the eastern crossing explicitly so a
     polar chart does not hand back the Descendant. Same rule as the app's
     ascendant(). */
  function angles(ramc, eps, lat) {
    let asc = lonOnCircle(ramc + 90, lat, eps);
    if (norm(ramc - raOf(asc, eps)) < 180) asc = norm(asc + 180);
    return { asc: asc, mc: lonOfRA(ramc, eps) };
  }

  /* Inside the polar circle the Midheaven degree can stand below the horizon.
     Regiomontanus, Campanus and Topocentric then take the lower meridian
     crossing as the tenth cusp, as the Swiss Ephemeris does, so the twelve
     cusps still run in order round the wheel. */
  function tenth(ang, eps, lat) {
    return Math.abs(lat - decOf(ang.mc, eps)) > 90 ? norm(ang.mc + 180) : ang.mc;
  }

  function fill(c11, c12, asc, c2, c3, mc) {
    return [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180),
      norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
  }

  function placidus(ramc, eps, lat, ang) {
    /* Cusp 11 is the ecliptic degree that has risen through a third of its own
       diurnal semi arc: its right ascension is RAMC + DSA/3, and DSA depends on
       the degree's own declination, so the answer is iterated. 12 is two
       thirds; 2 and 3 are the nocturnal arc below the horizon. */
    const solve = (f, below) => {
      let lon = below ? norm(ang.asc + 30 * f * 3) : norm(ang.mc + 30 * f * 3), ok = true;
      for (let i = 0; i < 200; i++) {
        const d = dsa(decOf(lon, eps), lat);
        if (d == null) { ok = false; break; }
        const ra = below ? norm(ramc + 180 - (180 - d) * (1 - f)) : norm(ramc + d * f);
        const nx = lonOfRA(ra, eps);
        const step = Math.abs(((nx - lon + 540) % 360) - 180);
        lon = nx;
        if (step < 1e-12) break;
      }
      return ok ? lon : null;
    };
    const c11 = solve(1 / 3, false), c12 = solve(2 / 3, false);
    const c2 = solve(1 / 3, true), c3 = solve(2 / 3, true);
    if ([c11, c12, c2, c3].some(x => x == null)) return null;
    return fill(c11, c12, ang.asc, c2, c3, ang.mc);
  }

  function koch(ramc, eps, lat, ang) {
    /* The Midheaven degree's ascensional difference in thirds: cusp 11 is the
       Ascendant of the moment RAMC stood 60 degrees plus two thirds of it
       back, 12 is 30 plus one third back, and 2 and 3 run forward the same
       way. This is the oblique ascension of the Midheaven degree, worked
       through the Ascendant formula. */
    if (Math.abs(lat) >= 90 - eps) return null;
    const sd = sin(ang.mc) * sin(eps) / cos(lat);
    if (Math.abs(sd) > 1) return null;
    const ca = Math.sqrt(1 - sd * sd);
    const c = Math.atan(tan(lat) / ca);
    const x = Math.sin(c) * sd;
    if (Math.abs(x) > 1) return null;
    const ad3 = Math.asin(x) / R / 3;
    const A = h => lonOnCircle(h, lat, eps);
    return fill(A(ramc + 30 - 2 * ad3), A(ramc + 60 - ad3), ang.asc,
      A(ramc + 120 + ad3), A(ramc + 150 + 2 * ad3), ang.mc);
  }

  function alcabitius(ramc, eps, lat, ang) {
    const d = dsa(decOf(ang.asc, eps), lat);
    if (d == null) return null;
    const n = 180 - d;
    const c11 = lonOfRA(ramc + d / 3, eps), c12 = lonOfRA(ramc + 2 * d / 3, eps);
    const c2 = lonOfRA(ramc + d + n / 3, eps), c3 = lonOfRA(ramc + d + 2 * n / 3, eps);
    return fill(c11, c12, ang.asc, c2, c3, ang.mc);
  }

  /* A circle through the north and south points of the horizon, meeting the
     celestial equator at hour distance h from the meridian, has pole height
     atan(tan(lat) sin(h)). Regiomontanus divides the equator: h = 30, 60. */
  function regiomontanus(ramc, eps, lat, ang) {
    const t = tenth(ang, eps, lat), f = t === ang.mc ? 0 : 180;
    const at = h => norm(lonOnCircle(ramc + h, Math.atan(tan(lat) * sin(h)) / R, eps) + f);
    return fill(at(30), at(60), ang.asc, at(120), at(150), t);
  }

  /* Campanus divides the prime vertical. A circle through the horizon's north
     and south points crossing the prime vertical a degrees from the zenith
     meets the equator at hour distance atan(tan(a) / cos(lat))... written
     here from the circle's own geometry instead, as a plane through those
     points, so it does not lean on that identity. */
  function campanus(ramc, eps, lat, ang) {
    const Z = [cos(lat) * cos(ramc), cos(lat) * sin(ramc), sin(lat)];
    const N = [-sin(lat) * cos(ramc), -sin(lat) * sin(ramc), cos(lat)];
    const E = [-sin(ramc), cos(ramc), 0];
    const K = [0, -sin(eps), cos(eps)];
    const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const at = a => {
      const u = [cos(a) * Z[0] + sin(a) * E[0], cos(a) * Z[1] + sin(a) * E[1], cos(a) * Z[2] + sin(a) * E[2]];
      let d = cross(K, cross(N, u));
      if (dot(d, u) < 0) d = d.map(x => -x);
      /* d is on the ecliptic; its longitude in the ecliptic frame. */
      const y = d[1] * cos(eps) + d[2] * sin(eps);
      return atan2(y, d[0]);
    };
    return fill(at(30), at(60), ang.asc, at(120), at(150), tenth(ang, eps, lat));
  }

  function topocentric(ramc, eps, lat, ang) {
    const t = tenth(ang, eps, lat), f = t === ang.mc ? 0 : 180;
    const at = (h, k) => norm(lonOnCircle(ramc + h, Math.atan(tan(lat) * k) / R, eps) + f);
    return fill(at(30, 1 / 3), at(60, 2 / 3), ang.asc, at(120, 2 / 3), at(150, 1 / 3), t);
  }

  function porphyry(ang) {
    const ic = norm(ang.mc + 180);
    const q1 = norm(ang.asc - ang.mc), q2 = norm(ic - ang.asc);
    return fill(norm(ang.mc + q1 / 3), norm(ang.mc + 2 * q1 / 3), ang.asc,
      norm(ang.asc + q2 / 3), norm(ang.asc + 2 * q2 / 3), ang.mc);
  }

  /* cusps(system, frame): frame is { ramc, eps, lat } in degrees. Returns
     { ok, cusps, asc, mc, system } or { ok: false, why }. */
  function cusps(system, frame) {
    const key = SYSTEMS.some(s => s.key === system) ? system : DEFAULT;
    const ramc = norm(+frame.ramc), eps = +frame.eps, lat = +frame.lat;
    if (![ramc, eps, lat].every(Number.isFinite)) return { ok: false, why: 'input', system: key };
    if (Math.abs(lat) >= 90) return { ok: false, why: 'pole', system: key };
    const ang = angles(ramc, eps, lat);
    let c = null;
    if (key === 'W') { const s = Math.floor((ang.asc + 1e-9) / 30) * 30; c = Array.from({ length: 12 }, (_, i) => norm(s + 30 * i)); }
    else if (key === 'E') c = Array.from({ length: 12 }, (_, i) => norm(ang.asc + 30 * i));
    else if (key === 'P') c = porphyry(ang);
    else if (key === 'O') c = placidus(ramc, eps, lat, ang);
    else if (key === 'K') c = koch(ramc, eps, lat, ang);
    else if (key === 'R') c = regiomontanus(ramc, eps, lat, ang);
    else if (key === 'C') c = campanus(ramc, eps, lat, ang);
    else if (key === 'A') c = alcabitius(ramc, eps, lat, ang);
    else if (key === 'T') c = topocentric(ramc, eps, lat, ang);
    else if (key === 'M') c = Array.from({ length: 12 }, (_, i) => atan2(sin(ramc + 90 + 30 * i) * cos(eps), cos(ramc + 90 + 30 * i)));
    else if (key === 'X') c = Array.from({ length: 12 }, (_, i) => lonOfRA(ramc + 90 + 30 * i, eps));
    /* Placidus and Koch have no cusps inside the polar circle, because some
       ecliptic degrees there never rise or never set. The chart is drawn in
       Porphyry instead, the same substitution the Swiss Ephemeris makes, and
       the answer says so: system is what was drawn, asked is what was asked. */
    if (!c) return { ok: true, system: 'P', asked: key, fallback: true, cusps: porphyry(ang), asc: ang.asc, mc: ang.mc };
    return { ok: true, system: key, asked: key, fallback: false, cusps: c, asc: ang.asc, mc: ang.mc };
  }

  /* The house holding a longitude, 1 to 12, from twelve cusps. */
  function houseOf(lon, cs) {
    const x = norm(lon);
    for (let i = 0; i < 12; i++) {
      const a = cs[i], b = cs[(i + 1) % 12];
      if (norm(x - a) < norm(b - a) || (norm(b - a) === 0 && x === a)) return i + 1;
    }
    return 1;
  }

  const api = { SYSTEMS: SYSTEMS, DEFAULT: DEFAULT, cusps: cusps, houseOf: houseOf, angles: angles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HouseSystems = api;
})(typeof window !== 'undefined' ? window : this);
