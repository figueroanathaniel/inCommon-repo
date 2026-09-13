/*! ephemeris-backend-current.js: Current simplified ephemeris (fallback). V1.0.0 (UMD)
 *
 * WRAPPER around the app's existing analytical/Kepler ephemeris (lonRaw,
 * minorLon, etc.). Provides a unified interface for the EphemerisRouter.
 *
 * Returns EphemPoint: { id, name, glyph, lon, lat, dist, sign, degreeInSign,
 * house, retrograde, speed, category, accuracy }
 *
 * No external dependencies. All computation happens here or in called methods.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EphemerisBackendCurrent = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  var RAD = Math.PI / 180, DAY = 86400000;

  function CurrentBackend(opts) {
    this.opts = opts || {};
    this.ready = true;
  }

  /** Unified init (already ready, but respects async interface) */
  CurrentBackend.prototype.init = function (callback) {
    if (callback) process.nextTick(function () { callback(null); });
    return Promise.resolve();
  };

  /* Convert UTC date to Julian Day (same as arc-solver.js does) */
  CurrentBackend.prototype.julday = function (year, month, day, hour, minute, second) {
    /* Simplified Julian Day: UTC seconds since J2000 epoch */
    var d = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0));
    return d.getTime() / DAY + 2440587.5 - 2451545.0;
  };

  /* Normalize longitude to 0-360 range */
  CurrentBackend.prototype.norm360 = function (x) {
    return ((x % 360) + 360) % 360;
  };

  /* Main computation: returns longitude in degrees 0-360 for a given point at JD t */
  CurrentBackend.prototype.lonRaw = function (name, t) {
    /* This is the core from the main app, preserved verbatim. */
    var R = RAD, norm360 = this.norm360.bind(this);

    if (name === 'Sun') {
      var M = norm360(357.5291 + 0.98560028 * t);
      var L = norm360(280.459 + 0.98564736 * t);
      return norm360(L + 1.915 * Math.sin(M * R) + 0.02 * Math.sin(2 * M * R));
    }
    if (name === 'Moon') {
      var Mp = norm360(134.963 + 13.064993 * t);
      var D = norm360(297.85 + 12.190749 * t);
      return norm360(218.316 + 13.176396 * t + 6.289 * Math.sin(Mp * R) + 1.274 * Math.sin((2 * D - Mp) * R));
    }
    if (name === 'North Node') return norm360(125.0445 - 0.0529539 * t);
    if (name === 'South Node') return norm360(125.0445 - 0.0529539 * t + 180);
    if (name === 'Earth') return norm360(this.lonRaw('Sun', t) + 180);

    /* Chiron and asteroids: from window.MinorBodies */
    var ASTEROIDS = ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'];
    if (ASTEROIDS.indexOf(name) !== -1) {
      var supplied = typeof window !== 'undefined' && window.MinorBodies && window.MinorBodies[name];
      return supplied ? this.minorLon(supplied, t) : null;
    }

    /* Mercury–Pluto: from stored elements PL_EL */
    var PL_EL = {
      Mercury: [252.25084, 4.09233445, 0.20563, 77.456, 0.38710],
      Venus: [181.97973, 1.60213034, 0.00677, 131.564, 0.72333],
      Mars: [355.433, 0.52402068, 0.09341, 336.041, 1.52368],
      Jupiter: [34.35151, 0.08309257, 0.04839, 14.331, 5.20260],
      Saturn: [50.07744, 0.03344414, 0.05415, 93.057, 9.55491],
      Uranus: [314.05501, 0.01172577, 0.04717, 173.005, 19.21845],
      Neptune: [304.34867, 0.00598158, 0.00859, 48.124, 30.11039],
      Pluto: [238.92881, 0.00396372, 0.24883, 224.075, 39.48168]
    };

    var el = PL_EL[name];
    if (!el) return 0;

    var helio = function (e) {
      var L = norm360(e[0] + e[1] * t);
      var M = norm360(L - e[3]) * R;
      var nu = M + (2 * e[2] - 0.25 * Math.pow(e[2], 3)) * Math.sin(M) + 1.25 * e[2] * e[2] * Math.sin(2 * M);
      var r = e[4] * (1 - e[2] * e[2]) / (1 + e[2] * Math.cos(nu));
      var lon = e[3] * R + nu;
      return [r * Math.cos(lon), r * Math.sin(lon)];
    };

    var EARTH_EL = [100.46435, 0.985609101, 0.016709, 102.93735, 1.00000011];
    var p = helio(el), earth = helio(EARTH_EL);
    return norm360(Math.atan2(p[1] - earth[1], p[0] - earth[0]) / R);
  };

  /* Kepler solver for minor bodies (Chiron, asteroids) */
  CurrentBackend.prototype.minorLon = function (el, t) {
    var RAD = Math.PI / 180, norm360 = this.norm360.bind(this);
    var M = norm360(el[0] + el[1] * t - el[3]) * RAD, ecc = el[2], E = M + ecc * Math.sin(M);
    for (var k = 0; k < 12; k++) {
      var d = (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
      E -= d;
      if (Math.abs(d) < 1e-11) break;
    }
    var nu = 2 * Math.atan2(Math.sqrt(1 + ecc) * Math.sin(E / 2), Math.sqrt(1 - ecc) * Math.cos(E / 2));
    var r = el[4] * (1 - ecc * Math.cos(E));
    var lon = el[3] * RAD + nu;
    var hx = r * Math.cos(lon), hy = r * Math.sin(lon);
    /* Earth heliocentric */
    var EARTH = [100.46435, 0.985609101, 0.016709, 102.93735, 1.00000011];
    var Me = norm360(EARTH[0] + EARTH[1] * t - EARTH[3]) * RAD, Ee = Me + EARTH[2] * Math.sin(Me);
    for (var i = 0; i < 12; i++) {
      d = (Ee - EARTH[2] * Math.sin(Ee) - Me) / (1 - EARTH[2] * Math.cos(Ee));
      Ee -= d;
      if (Math.abs(d) < 1e-11) break;
    }
    nu = 2 * Math.atan2(Math.sqrt(1 + EARTH[2]) * Math.sin(Ee / 2), Math.sqrt(1 - EARTH[2]) * Math.cos(Ee / 2));
    r = EARTH[4] * (1 - EARTH[2] * Math.cos(Ee));
    lon = EARTH[3] * RAD + nu;
    var ex = r * Math.cos(lon), ey = r * Math.sin(lon);
    return norm360(Math.atan2(hy - ey, hx - ex) / RAD);
  };

  /* Compute a point and return structured EphemPoint */
  CurrentBackend.prototype.compute = function (pointId, jd, lat, lon, houseSys, opts) {
    opts = opts || {};
    var Points = (typeof window !== 'undefined' && window.EphemerisPoints) || require('./ephemeris-points.js');
    var point = Points.byId(pointId);
    if (!point) return null;

    /* Get longitude from lonRaw */
    var longitude = this.lonRaw(point.name, jd);
    if (longitude === null || longitude === 0 && point.name !== 'Earth') return null;

    /* Convert to 0-360 if not already */
    longitude = this.norm360(longitude);

    /* Compute sign and degree in sign */
    var signIndex = Math.floor(longitude / 30);
    if (signIndex > 11) signIndex = 11;
    if (signIndex < 0) signIndex = 0;
    var degreeInSign = longitude - signIndex * 30;

    /* Placeholder for house (requires latitude/longitude and ephemeris computation) */
    var house = null;
    if (lat !== null && lon !== null && houseSys) {
      /* House calculation would go here; for now, null means not computed */
    }

    /* Return structured point */
    return {
      id: pointId,
      name: point.name,
      glyph: point.glyph,
      lon: longitude,
      lat: null, /* Not computed in current ephemeris */
      dist: null,
      sign: signIndex,
      degreeInSign: degreeInSign,
      house: house,
      retrograde: null, /* Not tracked */
      speed: null,
      category: point.category,
      accuracy: point.accuracy && point.accuracy.current,
      backend: 'current'
    };
  };

  return { VERSION: VERSION, create: function (opts) { return new CurrentBackend(opts); } };
}));
