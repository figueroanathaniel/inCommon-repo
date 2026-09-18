/* minor-bodies-ephemeris.js: Chiron, Ceres, Pallas, Juno, Vesta for inCommon. V2.0.0

   WHAT CHANGED IN V2, AND WHY IT HAD TO
   V1 shipped L0 values it called 'provisional', with the note "trust the sign,
   not the degree". Measured against JPL Horizons, that note was far too kind.
   The four asteroids were out by 47 to 98 degrees at a spot check, and by up to
   170 degrees across 1900-2100: one to three whole signs. The sign was not
   trustworthy either, so every asteroid row in the Expanded Chart was a
   confidently formatted fiction. Two things were wrong:

     1. The mean longitudes at epoch were simply not right, and nothing in the
        build could notice, because there was no reference to check them against.
     2. The model was COPLANAR. It took varpi = Omega + omega and pretended the
        orbit lay in the ecliptic. For an inclined orbit that is wrong in
        LONGITUDE, not only in latitude, because what reaches the geocentric
        longitude is the in-plane projection: the true heliocentric longitude is
        Omega + atan2(sin u cos i, cos u) with u = omega + nu, and the coplanar
        shortcut uses Omega + omega + nu instead. For Pallas, inclined 34.8
        degrees, that alone is several degrees of error that no amount of
        refitting L0 can remove.

   WHAT V2 DOES
   Full three-dimensional Kepler from real JPL elements, then general precession
   to the ecliptic of date, because the elements are J2000 and the rest of the
   app works in of-date longitude.

   Every element below except L0 and n is the body's actual osculating value from
   JPL Horizons at J2000.0. L0 (mean longitude at epoch) and n (mean daily
   motion) are then fitted, and ONLY those two, against 41 Horizons longitudes
   spanning 1900-2100. Fitting all seven elements scored better in-window and
   was thrown out: it drove Pallas to a semi-major axis of 1.68 AU, and on a
   hold-out series it was wrong by up to 49 degrees. Elements that are not the
   body's real orbit do not extrapolate, so they are not shipped.

   ACCURACY, MEASURED RATHER THAN ASSERTED
   Residuals in ecliptic longitude against JPL Horizons, on a hold-out series at
   a different cadence (403-day steps) over a wider span than was fitted:

     body     1900-2100 worst   1850-2150 worst
     Ceres          0.80 deg          1.24 deg
     Vesta          1.01 deg          1.01 deg
     Juno           1.71 deg          1.91 deg
     Pallas         4.89 deg          5.99 deg
     Chiron         0.52 deg         18.13 deg

   Read that table before trusting a degree. Ceres, Vesta and Juno are good to
   about a degree, which names the sign safely except within a degree of a cusp.
   Pallas is the honest weak spot: strongly perturbed and steeply inclined, it
   can be several degrees out and can name the wrong sign near a cusp. Chiron is
   excellent across 1900-2100 and falls apart outside it, which is what a body
   crossing Saturn's orbit on a chaotic 50-year path does to any fixed two-body
   model; n is fitted to the window people are actually born in.

   calibrate() still exists and still wins: one real position for a body pins it
   tighter than any of the above. See INTEGRATION at the bottom.                */
(function () {
  'use strict';
  var RAD = Math.PI / 180, DAY = 86400000;
  function norm360(x) { return ((x % 360) + 360) % 360; }
  function t2000(d) { return d.getTime() / DAY + 2440587.5 - 2451545.0; }

  /* Earth, for the heliocentric -> geocentric step. Same values the app uses.
     Earth's orbit defines the ecliptic, so treating it as coplanar is exact. */
  var EARTH = [100.46435, 0.985609101, 0.016709, 102.93735, 1.00000011];

  /* a, e, i, om (ascending node), w (argument of perihelion): real JPL Horizons
     osculating elements at J2000.0, in the J2000 ecliptic frame.
     L0, n: fitted over 1900-2100 as described above. worst/worstWide: measured
     hold-out residuals in degrees, carried here so status() can report a number
     rather than an adjective.                                                 */
  var EL = {
    Chiron: { a: 13.605081, e: 0.3793437, i: 6.94157, om: 209.39667, w: 339.14219,
              L0: 216.26487, n: 0.0195425123, worst: 0.52, worstWide: 18.13, confidence: 'fitted' },
    Ceres:  { a: 2.766494, e: 0.0783751, i: 10.58336, om: 80.49436, w: 73.92279,
              L0: 160.86738, n: 0.2140855736, worst: 0.80, worstWide: 1.24, confidence: 'fitted' },
    Pallas: { a: 2.772323, e: 0.2296435, i: 34.84614, om: 173.19780, w: 310.26556,
              L0: 116.28191, n: 0.2136802905, worst: 4.89, worstWide: 5.99, confidence: 'fitted' },
    Juno:   { a: 2.668036, e: 0.2584432, i: 12.96742, om: 170.17260, w: 248.03162,
              L0: 298.72361, n: 0.2259442299, worst: 1.71, worstWide: 1.91, confidence: 'fitted' },
    Vesta:  { a: 2.361535, e: 0.0900226, i: 7.13393, om: 103.95145, w: 149.58678,
              L0: 234.45605, n: 0.2715661236, worst: 1.01, worstWide: 1.01, confidence: 'fitted' }
  };
  var STORE = 'incommon.minorbodies.calibration.v2';

  function solveE(M, ecc) {
    var E = M + ecc * Math.sin(M);
    for (var k = 0; k < 24; k++) {
      var d = (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
      E -= d; if (Math.abs(d) < 1e-12) break;
    }
    return E;
  }
  /* Coplanar, for Earth only. */
  function earthXY(t) {
    var M = norm360(EARTH[0] + EARTH[1] * t - EARTH[3]) * RAD, ecc = EARTH[2];
    var E = solveE(M, ecc);
    var nu = 2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
    var r = EARTH[4] * (1 - ecc * Math.cos(E)), lon = EARTH[3] * RAD + nu;
    return [r * Math.cos(lon), r * Math.sin(lon)];
  }
  /* General precession in longitude, J2000 frame -> ecliptic of date. */
  function precession(t) { var T = t / 36525; return 1.396971 * T + 0.0003086 * T * T; }

  /* Geocentric ecliptic longitude of date. The array layout is the contract the
     app reads; slots 5 to 7 carry the inclination, node and perihelion argument
     that make the projection correct. */
  function geoLonArr(el, t) {
    var L0 = el[0], n = el[1], ecc = el[2], varpi = el[3], a = el[4];
    var inc = el.length > 5 ? el[5] : 0, om = el.length > 6 ? el[6] : 0;
    var w = el.length > 7 ? el[7] : varpi;
    var M = norm360(L0 + n * t - varpi) * RAD;
    var E = solveE(M, ecc);
    var nu = 2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
    var r = a * (1 - ecc * Math.cos(E));
    var u = w * RAD + nu, i = inc * RAD, O = om * RAD;
    var cu = Math.cos(u), su = Math.sin(u);
    var x = r * (Math.cos(O) * cu - Math.sin(O) * su * Math.cos(i));
    var y = r * (Math.sin(O) * cu + Math.cos(O) * su * Math.cos(i));
    var e2 = earthXY(t);
    return norm360(norm360(Math.atan2(y - e2[1], x - e2[0]) / RAD) + precession(t));
  }

  /* The 8-slot contract: [L0, n, e, varpi, a, i, om, w]. The first five slots
     keep V1's meaning exactly, so a consumer that only reads five still gets a
     coherent (coplanar, less accurate) answer rather than nonsense. */
  function arr(name) {
    var b = EL[name];
    return [b.L0, b.n, b.e, norm360(b.om + b.w), b.a, b.i, b.om, b.w];
  }
  function sep(a, b) { var d = Math.abs(norm360(a - b)); return d > 180 ? 360 - d : d; }

  var MB = {
    VERSION: '2.0.0',
    BODIES: ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'],
    elements: EL,

    /* Geocentric longitude of date for a Date, for spot-checks and calibration. */
    longitudeOn: function (name, date) {
      if (!EL[name]) return null;
      return geoLonArr(arr(name), t2000(date instanceof Date ? date : new Date(date)));
    },

    /* Pin a body to a known position. Give it one date and the geocentric
       ecliptic longitude of date a real ephemeris reports (astro.com, JPL
       Horizons, Swiss Ephemeris, any of them), and L0 is solved to fit.
       Returns the residual in degrees. Persists unless persist === false.     */
    calibrate: function (name, date, knownLongitude, persist) {
      var b = EL[name]; if (!b) throw new Error('Unknown body: ' + name);
      var t = t2000(date instanceof Date ? date : new Date(date)), el = arr(name);
      var err = function (L) { el[0] = L; return sep(geoLonArr(el, t), knownLongitude); };
      var best = 0, bestE = 1e9, L;
      for (L = 0; L < 360; L += 0.5) { var e0 = err(L); if (e0 < bestE) { bestE = e0; best = L; } }
      for (var step = 0.25; step > 0.0005; step /= 2) {
        [best - step, best + step].forEach(function (c) {
          var e1 = err(norm360(c)); if (e1 < bestE) { bestE = e1; best = norm360(c); }
        });
      }
      b.L0 = best; b.confidence = 'calibrated';
      b.calibratedAt = { date: String(date), lon: knownLongitude, residual: bestE };
      if (persist !== false) MB.save();
      MB.install();
      return bestE;
    },

    /* Second anchor for the same body refines n instead of L0. Use two dates
       years apart when a single pin still drifts (Chiron especially). */
    calibrateMotion: function (name, dateA, lonA, dateB, lonB) {
      var b = EL[name]; if (!b) throw new Error('Unknown body: ' + name);
      var base = b.n, bestN = base, bestE = 1e9;
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

    /* What to show a user who asks how much to trust these. The numbers are
       measured hold-out residuals against JPL Horizons, not estimates. */
    status: function () {
      return MB.BODIES.map(function (k) {
        var b = EL[k];
        return { body: k, confidence: b.confidence, inclination: b.i,
                 worst1900to2100: b.worst, worst1850to2150: b.worstWide,
                 note: b.confidence === 'calibrated'
                   ? 'pinned to a supplied position; residual ' + (b.calibratedAt ? b.calibratedAt.residual.toFixed(3) : '?') + ' deg'
                   : 'real JPL elements, L0 and n fitted to 1900-2100; worst measured miss ' + b.worst + ' deg in that window' };
      });
    }
  };

  MB.restore();
  MB.install();
  window.MinorBodiesEphemeris = MB;

  /* INTEGRATION
     Loaded from the helmet before first render, so the Expanded Chart shows all
     five bodies with positions that agree with a real ephemeris to the degrees
     tabulated at the top of this file.

     To pin a body tighter than the fit (once, from the console; it persists):
         MinorBodiesEphemeris.calibrate('Pallas', '2026-07-26', 137.42)
     To check what you have, including the measured error bars:
         console.table(MinorBodiesEphemeris.status())
     To go back to blank rather than approximate:
         MinorBodiesEphemeris.uninstall()                                      */
})();
