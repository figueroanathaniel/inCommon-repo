/* minor-bodies-ephemeris.js: Chiron, Ceres, Pallas, Juno, Vesta for inCommon.

   CONTRACT
   The app reads window.MinorBodies[name] as a 5-slot element array, identical to
   the layout its own planets use:

       [ L0, n, e, varpi, a ]
         L0    mean longitude at J2000.0 (deg)
         n     mean daily motion (deg/day)
         e     eccentricity
         varpi longitude of perihelion, Omega + omega (deg)
         a     semi-major axis (AU)

   It then runs minorLon(): a real Newton-iterated Kepler solve, heliocentric to
   geocentric. That is the right shape for this job. Do NOT precompute daily
   longitude tables. A 1900-2100 daily array for five bodies is ~365,000 samples
   (several MB, or ~1.5MB as Float32) and is not one degree more accurate than
   evaluating the same elements on demand, because the accuracy ceiling is the
   ELEMENTS, not the sampling. Everything below is ~2KB and exact to the model.

   ACCURACY, HONESTLY
   Two-body Kepler with fixed mean elements is good to a few tenths of a degree
   for the main-belt asteroids over a century, and drifts more for Chiron, whose
   50-year orbit crosses Saturn and is genuinely chaotic. Two further caveats:
     - minorLon() treats every orbit as coplanar with the ecliptic. Fine for
       Ceres (i=10.6 deg) and Vesta (i=7.1 deg). Pallas is inclined 34.8 deg, so
       its ecliptic longitude can be off by more than the elements alone imply.
     - Mean longitudes at epoch (L0) below are this build's best estimates. They
       are marked provisional. A single lookup per body against a real ephemeris
       pins each one to arcminutes via calibrate(). See INTEGRATION at bottom.

   Nothing here is presented as observatory-grade. It is good enough to name a
   sign and a wide aspect, and calibrate() is how you make it better.           */
(function () {
  'use strict';
  var RAD = Math.PI / 180, DAY = 86400000;
  function norm360(x) { return ((x % 360) + 360) % 360; }
  function t2000(d) { return d.getTime() / DAY + 2440587.5 - 2451545.0; }

  /* Earth, for the heliocentric -> geocentric step. Same values the app uses. */
  var EARTH = [100.46435, 0.985609101, 0.016709, 102.93735, 1.00000011];

  /* a and e are standard published osculating elements, reliable to the digits
     shown. varpi = Omega + omega. n is derived from a by Kepler's third law, so
     it cannot disagree with the orbit. L0 is the provisional part.

     Chiron is anchored differently and better: its perihelion passage of
     1996 Feb 14 means M = 0 there, so L0 = varpi - n * t_peri. That is a real
     observational anchor rather than a remembered epoch value, which is why
     Chiron ships confidence 'anchored' while the asteroids ship 'provisional'. */
  var EL = {
    Chiron: { a: 13.6371, e: 0.3823, varpi: 188.9, i: 6.93, L0: null,
              anchor: { kind: 'perihelion', date: '1996-02-14' }, confidence: 'anchored' },
    Ceres:  { a: 2.7660, e: 0.0791, varpi: 154.32, i: 10.59, L0: 267.73, confidence: 'provisional' },
    Pallas: { a: 2.7726, e: 0.2299, varpi: 123.18, i: 34.84, L0: 182.38, confidence: 'provisional' },
    Juno:   { a: 2.6693, e: 0.2579, varpi:  57.00, i: 12.98, L0: 239.00, confidence: 'provisional' },
    Vesta:  { a: 2.3615, e: 0.0895, varpi: 253.76, i:  7.14, L0: 201.56, confidence: 'provisional' }
  };
  var STORE = 'incommon.minorbodies.calibration.v1';

  function motion(a) { return 0.9856076686 / (a * Math.sqrt(a)); } // deg/day, Kepler III

  function helio(el, t) {
    var M = norm360(el[0] + el[1] * t - el[3]) * RAD, ecc = el[2], E = M + ecc * Math.sin(M);
    for (var k = 0; k < 12; k++) {
      var d = (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
      E -= d; if (Math.abs(d) < 1e-11) break;
    }
    var nu = 2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
    var r = el[4] * (1 - ecc * Math.cos(E)), lon = el[3] * RAD + nu;
    return [r * Math.cos(lon), r * Math.sin(lon)];
  }
  /* Geocentric ecliptic longitude, mirrors the app's minorLon exactly, so what
     this module reports and what the chart draws cannot diverge. */
  function geoLon(el, t) {
    var p = helio(el, t), e = helio(EARTH, t);
    return norm360(Math.atan2(p[1] - e[1], p[0] - e[0]) / RAD);
  }
  function arr(name) {
    var b = EL[name];
    return [b.L0, b.n != null ? b.n : motion(b.a), b.e, b.varpi, b.a];
  }
  function sep(a, b) { var d = Math.abs(norm360(a - b)); return d > 180 ? 360 - d : d; }

  /* Resolve Chiron's L0 from its perihelion passage: M = 0 at perihelion. */
  (function () {
    var c = EL.Chiron, n = motion(c.a);
    c.n = n;
    c.L0 = norm360(c.varpi - n * t2000(new Date(c.anchor.date + 'T12:00:00Z')));
  })();

  var MB = {
    VERSION: '1.0.0',
    BODIES: ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'],
    elements: EL,

    /* Geocentric longitude for a Date, for spot-checks and calibration. */
    longitudeOn: function (name, date) {
      if (!EL[name]) return null;
      return geoLon(arr(name), t2000(date instanceof Date ? date : new Date(date)));
    },

    /* Pin a body to a known position. Give it one date and the geocentric
       ecliptic longitude a real ephemeris reports (astro.com, JPL Horizons,
       Swiss Ephemeris, any of them), and L0 is solved to fit. Coarse sweep
       then bisection, the same method the app uses for Chiron's ingress.
       Returns the residual in degrees. Persists unless persist === false.    */
    calibrate: function (name, date, knownLongitude, persist) {
      var b = EL[name]; if (!b) throw new Error('Unknown body: ' + name);
      var t = t2000(date instanceof Date ? date : new Date(date)), el = arr(name);
      var err = function (L) { el[0] = L; return sep(geoLon(el, t), knownLongitude); };
      var best = 0, bestE = 1e9, L;
      for (L = 0; L < 360; L += 0.5) { var e0 = err(L); if (e0 < bestE) { bestE = e0; best = L; } }
      for (var step = 0.25; step > 0.0005; step /= 2) {
        [best - step, best + step].forEach(function (c) {
          var e1 = err(norm360(c)); if (e1 < bestE) { bestE = e1; best = norm360(c); }
        });
      }
      b.L0 = best; b.confidence = 'calibrated'; b.calibratedAt = { date: String(date), lon: knownLongitude, residual: bestE };
      if (persist !== false) MB.save();
      MB.install();
      return bestE;
    },

    /* Second anchor for the same body refines n instead of L0. Use two dates
       years apart when a single pin still drifts (Chiron especially). */
    calibrateMotion: function (name, dateA, lonA, dateB, lonB) {
      var b = EL[name]; if (!b) throw new Error('Unknown body: ' + name);
      var base = b.n != null ? b.n : motion(b.a), bestN = base, bestE = 1e9;
      for (var f = -0.02; f <= 0.02001; f += 0.0002) {
        b.n = base * (1 + f);
        MB.calibrate(name, dateA, lonA, false);
        var e = sep(MB.longitudeOn(name, dateB), lonB);
        if (e < bestE) { bestE = e; bestN = b.n; }
      }
      b.n = bestN;
      MB.calibrate(name, dateA, lonA, false);
      b.confidence = 'calibrated';
      MB.save();
      return bestE;
    },

    save: function () {
      try {
        var out = {};
        MB.BODIES.forEach(function (k) {
          if (EL[k].confidence === 'calibrated') out[k] = { L0: EL[k].L0, n: EL[k].n, calibratedAt: EL[k].calibratedAt };
        });
        localStorage.setItem(STORE, JSON.stringify(out));
      } catch (e) { /* storage unavailable, calibration stays in memory */ }
    },
    restore: function () {
      try {
        var raw = localStorage.getItem(STORE); if (!raw) return false;
        var got = JSON.parse(raw), any = false;
        Object.keys(got).forEach(function (k) {
          if (!EL[k]) return;
          EL[k].L0 = got[k].L0; if (got[k].n != null) EL[k].n = got[k].n;
          EL[k].calibratedAt = got[k].calibratedAt; EL[k].confidence = 'calibrated'; any = true;
        });
        return any;
      } catch (e) { return false; }
    },

    /* Publish to the contract the app reads. */
    install: function () {
      var out = window.MinorBodies || {};
      MB.BODIES.forEach(function (k) { out[k] = arr(k); });
      window.MinorBodies = out;
      return out;
    },
    uninstall: function () { MB.BODIES.forEach(function (k) { if (window.MinorBodies) delete window.MinorBodies[k]; }); },

    /* What to show a user who asks how much to trust these. */
    status: function () {
      return MB.BODIES.map(function (k) {
        var b = EL[k];
        return { body: k, confidence: b.confidence, inclination: b.i,
                 note: b.confidence === 'calibrated'
                   ? 'pinned to a supplied position; residual ' + (b.calibratedAt ? b.calibratedAt.residual.toFixed(3) : '?') + ' deg'
                   : b.confidence === 'anchored'
                     ? 'derived from the 1996 perihelion passage; drifts with orbital chaos'
                     : 'mean elements, unpinned: trust the sign, not the degree' };
      });
    }
  };

  MB.restore();
  MB.install();
  window.MinorBodiesEphemeris = MB;

  /* INTEGRATION
     Load AFTER the app's other modules, before first render:
         <script src="./minor-bodies-ephemeris.js"></script>
     Expanded Chart then shows all five bodies instead of "not computed".

     To pin a body (once, from the console; it persists):
         MinorBodiesEphemeris.calibrate('Ceres', '2026-07-26', 137.42)
     To check what you have:
         console.table(MinorBodiesEphemeris.status())
     To go back to blank rather than approximate:
         MinorBodiesEphemeris.uninstall()                                      */
})();
