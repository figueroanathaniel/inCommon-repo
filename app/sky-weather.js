/* sky-weather.js: the sky's own events, dated ahead. Mechanics layer: it
   returns times, bodies, signs and separations, and no writing about what any
   of it means. It reads no clock and no storage; the app hands it the window
   to search and the vendored astronomy-engine.

   What it finds, inside the window it is given:
   - The Moon's four phases (astronomy-engine SearchMoonQuarter).
   - Eclipses of the Sun and the Moon (SearchGlobalSolarEclipse,
     SearchLunarEclipse).
   - Stations of Mercury to Pluto: the instant the daily motion in ecliptic
     longitude of date changes sign, bisected to a minute.
   - The conjunction of each of Mercury to Pluto with the Sun. A body is
     cazimi while within 17 minutes of the Sun in longitude (Skyscript
     glossary, after Lilly), and the module also says whether the latitude is
     inside that disk too, because Bonatti asks for both (Liber Astronomiae,
     Dykes 2007 p.211, as quoted by Anthony Louis).
   - Conjunctions in longitude between two of Mercury to Pluto, and of the
     Moon with Mercury to Saturn when the two are within MOON_MEET degrees
     of latitude.
   - Gatherings: three or more of the Sun and Mercury to Pluto inside
     GATHER degrees, each set dated at the day it is tightest.
   - Meteor shower maxima: the instant the Sun reaches the shower's solar
     longitude of maximum, J2000, as the IMO lists it (SHOWERS, with the
     source of every value), and how lit the Moon is then.
   - Passes of the Moon and Mercury to Pluto by the star clusters near the
     ecliptic: the conjunction in longitude of date, kept when the latitude
     difference is inside CLUSTER_NEAR.

   CLUSTERS also serves the chart: clusterLon() gives any cluster's ecliptic
   longitude of date at any instant, which is how a cluster becomes a point.

   Times are Date objects in UTC. Nothing here is rounded for display. */
(function (root) {
  'use strict';
  const norm = x => ((x % 360) + 360) % 360;
  const wrap = x => { x = norm(x); return x > 180 ? x - 360 : x; };
  const DAY = 86400000;
  const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const MOON_PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const CAZIMI = 17 / 60, CAZIMI_LAT = 16 / 60;
  const MOON_MEET = 4, GATHER = 10, CLUSTER_NEAR = 6;

  /* J2000 right ascension and declination, from each cluster's Wikipedia
     infobox, read 5 November 2026. The temperaments are Ptolemy's,
     Tetrabiblos I.9 (Robbins, Loeb 1940, at penelope.uchicago.edu):
     the Pleiades "like those of the moon and Jupiter"; of the Hyades, the
     bright reddish one (the Torch) like Mars, "the others, like that of Saturn
     and moderately like that of Mercury"; "the cloud-like cluster in the
     breast, called the Manger, the same as Mars and the moon"; "the cluster of
     the Coma Berenices beneath the Bear's tail, to that of the moon and Venus";
     "the cluster in the hilt of the sword" of Perseus, "of Mars and Mercury". */
  const CLUSTERS = [
    { id: 'pleiades', name: 'Pleiades', glyph: 'M45', ra: 3 + 46 / 60 + 38 / 3600, dec: 24 + 10 / 60 + 41 / 3600, mag: 1.6, con: 'Taurus', like: ['Moon', 'Jupiter'] },
    { id: 'hyades', name: 'Hyades', glyph: 'Hy', ra: 4 + 27 / 60, dec: 15 + 52 / 60, mag: 0.5, con: 'Taurus', like: ['Saturn', 'Mercury'] },
    { id: 'praesepe', name: 'Praesepe', glyph: 'M44', ra: 8 + 40.4 / 60, dec: 19 + 59 / 60, mag: 3.7, con: 'Cancer', like: ['Mars', 'Moon'] },
    { id: 'comacluster', name: 'Coma Star Cluster', glyph: 'Mel', ra: 12 + 22.5 / 60, dec: 25 + 51 / 60, mag: 1.8, con: 'Coma Berenices', like: ['Moon', 'Venus'] },
    { id: 'doublecluster', name: 'Double Cluster', glyph: 'hχ', ra: 2 + 20 / 60, dec: 57 + 8 / 60, mag: 3.7, con: 'Perseus', like: ['Mars', 'Mercury'] }
  ];

  /* Solar longitude of maximum, J2000, from the IMO Meteor Shower Calendar.
     src names where each number was read: c24, c25 and c26 are the 2024,
     2025 and 2026 calendars' own shower sections; t is the calendar's
     working list (Table 5) as read through a summary, held instead by the
     2026 calendar's dates, which tools/check-sky-weather.js compares. ZHR and
     radiant are from imo.net/resources/calendar unless src says otherwise. */
  const SHOWERS = [
    { id: 'QUA', name: 'Quadrantids', lam: 283.15, src: 'c25', zhr: 80, ra: 229.5, dec: 49.5 },
    { id: 'LYR', name: 'Lyrids', lam: 32.32, src: 'c26', zhr: 18, ra: 271, dec: 34 },
    { id: 'ETA', name: 'Eta Aquariids', lam: 45.5, src: 'c25', zhr: 50, ra: 338, dec: -1 },
    { id: 'SDA', name: 'Southern Delta Aquariids', lam: 128, src: 'c25', zhr: 25, ra: 340, dec: -16.4 },
    { id: 'CAP', name: 'Alpha Capricornids', lam: 128, src: 'c25', zhr: 5, ra: 307, dec: -10.2 },
    { id: 'PER', name: 'Perseids', lam: 140.0, src: 'c24', zhr: 100, ra: 48, dec: 58 },
    { id: 'DRA', name: 'Draconids', lam: 195.4, src: 'c26', zhr: 5, ra: 263, dec: 56 },
    { id: 'ORI', name: 'Orionids', lam: 208, src: 'c25', zhr: 20, ra: 95, dec: 15.5 },
    { id: 'STA', name: 'Southern Taurids', lam: 223, src: 't', zhr: 5, ra: 52, dec: 15 },
    { id: 'NTA', name: 'Northern Taurids', lam: 230, src: 't', zhr: 5, ra: 58, dec: 22.7 },
    { id: 'LEO', name: 'Leonids', lam: 235.27, src: 't', zhr: 10, ra: 152, dec: 21.6 },
    { id: 'GEM', name: 'Geminids', lam: 262.2, src: 'c24', zhr: 150, ra: 112, dec: 32.2 },
    { id: 'URS', name: 'Ursids', lam: 270.7, src: 't', zhr: 10, ra: 217, dec: 74.8 }
  ];

  function make(A) {
    const T = d => A.MakeTime(d);
    const at = (name, d) => {
      const t = T(d);
      if (name === 'Sun') { const s = A.SunPosition(t); return { lon: s.elon, lat: s.elat }; }
      if (name === 'Moon') { const m = A.EclipticGeoMoon(t); return { lon: m.lon, lat: m.lat }; }
      const e = A.Ecliptic(A.GeoVector(name, t, true)); return { lon: e.elon, lat: e.elat };
    };
    const lon = (n, d) => at(n, d).lon;
    const clusterPos = (c, d) => {
      const e = A.Ecliptic(A.VectorFromSphere(new A.Spherical(c.dec, c.ra * 15, 1), T(d)));
      return { lon: e.elon, lat: e.elat };
    };
    const D = ms => new Date(ms);
    /* Bisect f between a and b (ms) where f changes sign, to a minute. */
    const bisect = (f, a, b) => {
      let fa = f(a);
      for (let i = 0; i < 40 && b - a > 60000; i++) {
        const m = (a + b) / 2, fm = f(m);
        if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
      }
      return (a + b) / 2;
    };
    /* Zero crossings of f, sampled every step ms. A jump of more than 180
       degrees is a wrap, not a crossing. */
    const crossings = (f, a, b, step) => {
      const out = []; let t0 = a, f0 = f(a);
      for (let t1 = a + step; t0 < b; t1 += step) {
        const f1 = f(t1);
        if ((f0 < 0) !== (f1 < 0) && Math.abs(f1 - f0) < 180) out.push(bisect(f, t0, t1));
        t0 = t1; f0 = f1;
      }
      return out;
    };
    const speed = (n, ms) => wrap(lon(n, D(ms + DAY / 4)) - lon(n, D(ms - DAY / 4))) * 2;

    function phases(a, b) {
      const out = []; let q = A.SearchMoonQuarter(T(D(a)));
      while (q.time.date.getTime() < b) {
        const t = q.time.date.getTime();
        if (t >= a) out.push({ kind: 'phase', t: D(t), quarter: q.quarter, moon: lon('Moon', D(t)) });
        q = A.NextMoonQuarter(q);
      }
      return out;
    }
    function eclipses(a, b) {
      const out = [];
      let s = A.SearchGlobalSolarEclipse(T(D(a)));
      while (s.peak.date.getTime() < b) { out.push({ kind: 'eclipse', body: 'Sun', t: s.peak.date, type: s.kind, sun: lon('Sun', s.peak.date) }); s = A.NextGlobalSolarEclipse(s.peak); }
      let l = A.SearchLunarEclipse(T(D(a)));
      while (l.peak.date.getTime() < b) { out.push({ kind: 'eclipse', body: 'Moon', t: l.peak.date, type: l.kind, moon: lon('Moon', l.peak.date) }); l = A.NextLunarEclipse(l.peak); }
      return out.filter(e => e.t.getTime() >= a);
    }
    function stations(a, b) {
      const out = [];
      PLANETS.forEach(n => {
        crossings(ms => speed(n, ms), a, b, DAY / 2).forEach(t => {
          const after = speed(n, t + DAY);
          out.push({ kind: 'station', t: D(t), body: n, dir: after < 0 ? 'retrograde' : 'direct', lon: lon(n, D(t)) });
        });
      });
      return out;
    }
    function sunMeetings(a, b) {
      const out = [];
      PLANETS.forEach(n => {
        const f = ms => wrap(lon(n, D(ms)) - lon('Sun', D(ms)));
        crossings(f, a, b, DAY / 2).forEach(t => {
          /* The edges of the 17 minute disk, found either side of the exact instant. */
          const g = ms => Math.abs(f(ms)) - CAZIMI;
          const win = DAY * 3;
          const enter = g(t - win) > 0 ? bisect(g, t - win, t) : t - win;
          const leave = g(t + win) > 0 ? bisect(ms => -g(ms), t, t + win) : t + win;
          const p = at(n, D(t)), s = at('Sun', D(t));
          out.push({ kind: 'cazimi', t: D(t), body: n, lon: p.lon, from: D(enter), to: D(leave),
            dlat: p.lat - s.lat, inLat: Math.abs(p.lat - s.lat) <= CAZIMI_LAT, retro: speed(n, t) < 0 });
        });
      });
      return out;
    }
    function meetings(a, b) {
      const out = [];
      for (let i = 0; i < PLANETS.length; i++) for (let j = i + 1; j < PLANETS.length; j++) {
        const x = PLANETS[i], y = PLANETS[j];
        crossings(ms => wrap(lon(x, D(ms)) - lon(y, D(ms))), a, b, DAY / 2).forEach(t => {
          const p = at(x, D(t)), q = at(y, D(t));
          out.push({ kind: 'meet', t: D(t), a: x, b: y, lon: p.lon, sep: Math.abs(p.lat - q.lat) });
        });
      }
      MOON_PLANETS.forEach(y => {
        crossings(ms => wrap(lon('Moon', D(ms)) - lon(y, D(ms))), a, b, DAY / 8).forEach(t => {
          const p = at('Moon', D(t)), q = at(y, D(t)), sep = Math.abs(p.lat - q.lat);
          if (sep <= MOON_MEET) out.push({ kind: 'meet', t: D(t), a: 'Moon', b: y, lon: p.lon, sep });
        });
      });
      return out;
    }
    function clusterPasses(a, b) {
      const out = [];
      CLUSTERS.forEach(c => {
        ['Moon'].concat(PLANETS).forEach(n => {
          const f = ms => wrap(lon(n, D(ms)) - clusterPos(c, D(ms)).lon);
          crossings(f, a, b, n === 'Moon' ? DAY / 8 : DAY / 2).forEach(t => {
            const p = at(n, D(t)), q = clusterPos(c, D(t)), sep = Math.abs(p.lat - q.lat);
            if (sep <= CLUSTER_NEAR) out.push({ kind: 'cluster', t: D(t), body: n, cluster: c.id, name: c.name, lon: q.lon, sep });
          });
        });
      });
      return out;
    }
    function gatherings(a, b) {
      const names = ['Sun'].concat(PLANETS), best = {};
      for (let ms = a; ms < b; ms += DAY / 4) {
        const pts = names.map(n => ({ n, l: norm(lon(n, D(ms))) })).sort((x, y) => x.l - y.l);
        const k = pts.length;
        for (let i = 0; i < k; i++) {
          const set = [pts[i]];
          for (let j = 1; j < k; j++) { const q = pts[(i + j) % k]; if (norm(q.l - pts[i].l) <= GATHER) set.push(q); else break; }
          if (set.length < 3) continue;
          const key = set.map(s => s.n).sort().join('|'), span = norm(set[set.length - 1].l - set[0].l);
          if (!best[key] || span < best[key].span) best[key] = { span, ms, names: set.map(s => s.n), lon: set[0].l };
        }
      }
      /* A set inside a larger set on the same day is the larger one. */
      const all = Object.keys(best).map(k => best[k]);
      return all.filter(g => !all.some(h => h !== g && h.names.length > g.names.length && g.names.every(n => h.names.indexOf(n) !== -1) && Math.abs(h.ms - g.ms) < DAY * 3))
        .map(g => ({ kind: 'gather', t: D(g.ms), names: g.names, span: g.span, lon: g.lon }));
    }
    const sunJ2000 = ms => {
      const v = A.RotateVector(A.Rotation_EQJ_ECL(), A.GeoVector('Sun', T(D(ms)), true));
      return A.SphereFromVector(v).lon;
    };
    function showers(a, b) {
      const out = [];
      SHOWERS.forEach(s => {
        crossings(ms => wrap(sunJ2000(ms) - s.lam), a - DAY, b + DAY, DAY / 2).forEach(t => {
          if (t < a || t >= b) return;
          const ill = A.Illumination('Moon', T(D(t)));
          out.push({ kind: 'shower', t: D(t), id: s.id, name: s.name, zhr: s.zhr, lam: s.lam, ra: s.ra, dec: s.dec, moonLit: ill.phase_fraction });
        });
      });
      return out;
    }
    /* Everything in [a, b), sorted by time. */
    function events(from, to) {
      const a = +from, b = +to;
      return [].concat(phases(a, b), eclipses(a, b), stations(a, b), sunMeetings(a, b), meetings(a, b),
        clusterPasses(a, b), gatherings(a, b), showers(a, b))
        .filter(e => +e.t >= a && +e.t < b).sort((x, y) => x.t - y.t);
    }
    return { events, lon, phases, eclipses, stations, sunMeetings, meetings, clusterPasses, gatherings, showers, sunJ2000,
      clusterLon: (id, d) => { const c = CLUSTERS.find(x => x.id === id); return c ? clusterPos(c, d).lon : null; } };
  }

  const api = { CLUSTERS, SHOWERS, PLANETS, CAZIMI, CAZIMI_LAT, MOON_MEET, GATHER, CLUSTER_NEAR, make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SkyWeather = api;
})(typeof window !== 'undefined' ? window : globalThis);
