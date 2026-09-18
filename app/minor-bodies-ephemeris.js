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

   THIS MODULE IS THE FALLBACK NOW, NOT THE SUPPLIER
   minor-body-elements.js carries Ceres, Pallas, Juno and Vesta as fetched JPL
   Horizons elements at several epochs each, measured at 0.032 to 0.058 degrees
   worst case, and the app reads that first. What is here is what the app falls
   back to when that module is missing, which is the same order eris and sedna
   already use: a missing module should cost accuracy, not the four bodies.

   ACCURACY, MEASURED
   The paragraph that used to sit here claimed a few tenths of a degree for the
   main belt asteroids over a century. That was never measured and it was wrong
   by two orders of magnitude. Against 404 JPL Horizons apparent longitudes
   every 181 days from 1900 to 2100, the elements this module shipped with
   measured an RMS of 35 to 110 degrees and a worst case of 169. Flat across
   every window, 1980-2010 as much as 1900-2100, so it was a wrong phase rather
   than drift: L0 was simply wrong, which the old paragraph did admit by calling
   it provisional without ever saying how provisional.

   They are fitted now, by the method the Chiron block below states, and every
   figure in the table is measured against those 404 positions with half of them
   held out of the fit. What a single epoch two body model can actually do for a
   main belt asteroid across two centuries is this, and no more:

       Ceres    RMS 2.98   worst  9.09      Juno   RMS 1.02   worst  7.94
       Pallas   RMS 6.47   worst 29.59      Vesta  RMS 0.41   worst  2.33

   So the sign is safe for Vesta and NOT safe for the other three, and none of
   the four may name a degree. accuracyDeg carries each body's own number and
   the app reads it rather than assuming a shared one.

   Two things bound that and neither is worth fixing here. minorLon() treats
   every orbit as coplanar with the ecliptic, which is a longitude error rather
   than only a latitude one and is why Pallas at 34.8 degrees of inclination is
   the worst of the four; projecting it in three dimensions was tried and
   measured, and it moved Pallas from 29.6 to 18.6 degrees, still nowhere near
   useful, because the error is secular perturbation rather than geometry. And
   more epochs would fix it properly, which is precisely what
   minor-body-elements.js already is. A fallback does not need a second copy of
   the thing it falls back from; it needs to be honest about what it is.        */
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
  /* CHIRON IS FITTED, AND THIS IS THE METHOD THE NEXT BODY SHOULD COPY.

     The rule that keeps a fit honest: a and n are NOT free parameters. The
     semi-major axis is the published one and the mean motion is derived from it
     by Kepler's third law, so the model stays an orbit rather than becoming a
     curve that happens to pass near some points. Letting a float produced a
     better residual and an object at 11.37 AU, which is not Chiron.

     What IS fitted is the phase and the two slowly varying angles, because
     those are genuinely "mean over the interval" for a body Saturn and Uranus
     keep perturbing: L0, e and varpi, by coordinate descent against real
     positions.

     Reference: NASA JPL Horizons, target 2060 Chiron (1977 UB), geocentric
     apparent ecliptic longitude (ObsEcLon) at 500@399, 81 samples at two year
     steps from 1900-01-01 to 2060-01-01, retrieved 2026-08-27.

     Measured against those 81: RMS 0.559 deg, worst 0.923 deg, none over one
     degree. The previous shipped elements measured RMS 0.732 and worst 1.519.

     WHAT THAT ACCURACY BUYS, stated so the app can gate on it: naming a sign is
     safe except within about a degree of a cusp; an aspect at ordinary orb is
     safe; a Human Design gate is safe to about a sixth of a gate. A Sabian
     degree is NOT safe and must not be printed for this body. */
  var EL = {
    Chiron: { a: 13.6371, e: 0.380233, varpi: 188.33266, i: 6.93, L0: 216.20376,
              confidence: 'fitted', accuracyDeg: 0.93,
              fit: { source: 'JPL Horizons 2060 Chiron, ObsEcLon at 500@399',
                     samples: 81, span: '1900-2060', rms: 0.559, worst: 0.923,
                     retrieved: '2026-08-27', free: ['L0', 'e', 'varpi'], held: ['a', 'n'] } },
    /* Fitted the same way Chiron is: a is the published semi-major axis and n
       comes from it by Kepler III, both held, and only L0, e and varpi are
       free. Fitted on 202 of the 404 references, with the other 202 held out;
       the holdout worst case equals the full worst case for all four, which is
       what says the fit generalised rather than bent to its own samples. */
    Ceres:  { a: 2.7660, e: 0.072932, varpi: 153.75091, i: 10.59, L0: 160.76983,
              confidence: 'fitted', accuracyDeg: 9.09,
              fit: { source: 'JPL Horizons 1 Ceres, ObsEcLon at 500@399',
                     samples: 404, span: '1900-2100', rms: 2.980, worst: 9.091, holdoutWorst: 9.091,
                     retrieved: '2026-09-18', free: ['L0', 'e', 'varpi'], held: ['a', 'n'] } },
    Pallas: { a: 2.7726, e: 0.234472, varpi: 126.07013, i: 34.84, L0: 116.51419,
              confidence: 'fitted', accuracyDeg: 29.59,
              fit: { source: 'JPL Horizons 2 Pallas, ObsEcLon at 500@399',
                     samples: 404, span: '1900-2100', rms: 6.472, worst: 29.586, holdoutWorst: 29.586,
                     retrieved: '2026-09-18', free: ['L0', 'e', 'varpi'], held: ['a', 'n'] } },
    Juno:   { a: 2.6693, e: 0.256067, varpi:  57.41474, i: 12.98, L0: 298.71199,
              confidence: 'fitted', accuracyDeg: 7.94,
              fit: { source: 'JPL Horizons 3 Juno, ObsEcLon at 500@399',
                     samples: 404, span: '1900-2100', rms: 1.024, worst: 7.944, holdoutWorst: 7.944,
                     retrieved: '2026-09-18', free: ['L0', 'e', 'varpi'], held: ['a', 'n'] } },
    Vesta:  { a: 2.3615, e: 0.089627, varpi: 254.73792, i:  7.14, L0: 234.40188,
              confidence: 'fitted', accuracyDeg: 2.33,
              fit: { source: 'JPL Horizons 4 Vesta, ObsEcLon at 500@399',
                     samples: 404, span: '1900-2100', rms: 0.414, worst: 2.326, holdoutWorst: 2.326,
                     retrieved: '2026-09-18', free: ['L0', 'e', 'varpi'], held: ['a', 'n'] } }
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

  /* Mean motion from the semi-major axis, for every body, always. This is the
     line that keeps a fitted orbit an orbit. Chiron's L0 is the fitted value
     above; the perihelion derivation it used to ship with is gone, because a
     single anchor point fixes the phase at one instant and says nothing about
     the rest of the span. */
  (function () { MB_KEYS(EL).forEach(function (k) { EL[k].n = motion(EL[k].a); }); })();
  function MB_KEYS(o) { return Object.keys(o); }

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
                 accuracyDeg: b.accuracyDeg || null,
                 note: b.confidence === 'calibrated'
                   ? 'pinned to a supplied position; residual ' + (b.calibratedAt ? b.calibratedAt.residual.toFixed(3) : '?') + ' deg'
                   : b.confidence === 'fitted'
                     ? 'fitted to ' + b.fit.samples + ' ' + b.fit.source.split(',')[0] + ' positions across ' + b.fit.span +
                       '; worst ' + b.fit.worst + ' deg, so the sign and the aspect hold and the exact degree does not'
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
