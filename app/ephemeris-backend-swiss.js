/*! ephemeris-backend-swiss.js: Swiss Ephemeris WASM backend. V1.0.0 (UMD)
 *
 * OPTIONAL backend using swisseph-wasm (https://npm.im/swisseph-wasm).
 * If WASM is unavailable or fails to load, the app falls back to the
 * current (simplified) ephemeris.
 *
 * Provides same interface as ephemeris-backend-current.js:
 *   compute(pointId, jd, lat, lon, houseSys, opts) -> EphemPoint
 *
 * GRACEFUL DEGRADATION: if swisseph-wasm cannot be imported or initialized,
 * instance.ready becomes false and compute() returns null, signaling the
 * router to use the fallback backend.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EphemerisBackendSwiss = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  function SwissBackend(opts) {
    this.opts = opts || {};
    this.ready = false;
    this.swe = null;
    this._initPromise = null;
    this._initCallbacks = [];
  }

  /* Initialize Swiss Ephemeris WASM. Returns Promise. */
  SwissBackend.prototype.init = function (callback) {
    var self = this;

    if (this.ready) {
      if (callback) this._nextTick(function () { callback(null); });
      return Promise.resolve();
    }

    if (this._initPromise) {
      if (callback) this._initCallbacks.push(callback);
      return this._initPromise;
    }

    this._initPromise = this._loadAndInit().then(
      function () { self.ready = true; self._fireCallbacks(null); },
      function (err) { self.ready = false; self._fireCallbacks(err); throw err; }
    );

    if (callback) this._initCallbacks.push(callback);
    return this._initPromise;
  };

  SwissBackend.prototype._nextTick = function (fn) {
    if (typeof setImmediate !== 'undefined') setImmediate(fn);
    else if (typeof process !== 'undefined' && process.nextTick) process.nextTick(fn);
    else setTimeout(fn, 0);
  };

  SwissBackend.prototype._fireCallbacks = function (err) {
    var cbs = this._initCallbacks;
    this._initCallbacks = [];
    cbs.forEach(function (cb) { cb(err); });
  };

  /* Load swisseph-wasm module */
  SwissBackend.prototype._loadAndInit = function () {
    var self = this;
    return Promise.resolve().then(function () {
      /* Try to import swisseph-wasm. In Node.js, this uses require; in browser with
         bundler (Webpack, Vite), this is handled by import statement. For browsers
         without bundler, swisseph-wasm must be in global scope or loaded separately. */
      var SwissEph;

      if (typeof require !== 'undefined') {
        try {
          SwissEph = require('swisseph-wasm');
        } catch (e) {
          throw new Error('swisseph-wasm not installed: npm install swisseph-wasm');
        }
      } else if (typeof window !== 'undefined' && window.SwissEph) {
        SwissEph = window.SwissEph;
      } else {
        throw new Error('swisseph-wasm not loaded (require failed and window.SwissEph not found)');
      }

      self.swe = new SwissEph();
      return self.swe.initSwissEph();
    }).catch(function (err) {
      self.ready = false;
      if (self.opts.logErrors) console.error('[SwissBackend] Init failed:', err.message);
      throw err;
    });
  };

  /* Close/cleanup WASM instance */
  SwissBackend.prototype.close = function () {
    if (this.swe && this.swe.close) {
      this.swe.close();
    }
    this.swe = null;
    this.ready = false;
  };

  /* Map point name to Swiss Ephemeris body ID */
  SwissBackend.prototype._swissBodyId = function (pointName) {
    var map = {
      'Sun': 0, 'Moon': 1, 'Mercury': 2, 'Venus': 3, 'Mars': 4, 'Jupiter': 5,
      'Saturn': 6, 'Uranus': 7, 'Neptune': 8, 'Pluto': 9,
      'North Node': 10, 'South Node': 10, /* South Node is computed as +180 */
      'Chiron': 15, 'Ceres': 10001, 'Pallas': 10002, 'Juno': 10003, 'Vesta': 10004
    };
    return map[pointName] !== undefined ? map[pointName] : null;
  };

  /* Map sign index to Swiss constants (tropical zodiac) */
  SwissBackend.prototype._signName = function (signIndex) {
    var signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[signIndex] || 'Unknown';
  };

  /* Compute a point and return structured EphemPoint */
  SwissBackend.prototype.compute = function (pointId, jd, lat, lon, houseSys, opts) {
    if (!this.ready || !this.swe) return null;

    opts = opts || {};
    var Points = (typeof window !== 'undefined' && window.EphemerisPoints) || require('./ephemeris-points.js');
    var point = Points.byId(pointId);
    if (!point) return null;

    try {
      var bodyId = this._swissBodyId(point.name);
      if (bodyId === null) return null;

      /* Call swe_calc with UT flag (UTC, no offset) and Swiss Ephemeris flag */
      var flag = this.swe.SEFLG_SWIEPH; /* Use Swiss Ephemeris, not Moshier */
      var result = this.swe.calc_ut(jd, bodyId, flag);

      if (!result || result.length < 2) return null;

      var longitude = result[0]; /* ecliptic longitude in degrees */
      var latitude = result[1] || null;
      var distance = result[2] || null;
      var speedLon = result[3] || null;

      /* For South Node, add 180 to North Node */
      if (point.name === 'South Node') {
        longitude = (longitude + 180) % 360;
        if (speedLon !== null) speedLon = -speedLon; /* Speed reverses */
      }

      /* Compute sign and degree in sign */
      var signIndex = Math.floor(longitude / 30);
      if (signIndex > 11) signIndex = 11;
      if (signIndex < 0) signIndex = 0;
      var degreeInSign = longitude - signIndex * 30;

      /* House calculation (optional, requires lat/lon and house system) */
      var house = null;
      if (lat !== null && lon !== null && houseSys) {
        /* House system calculation would go here via swe_houses or swe_houses_armc */
        /* For now, placeholder */
      }

      /* Retrograde: body is retrograde if speed is negative */
      var retrograde = speedLon !== null && speedLon < 0;

      return {
        id: pointId,
        name: point.name,
        glyph: point.glyph,
        lon: longitude,
        lat: latitude,
        dist: distance,
        sign: signIndex,
        signName: this._signName(signIndex),
        degreeInSign: degreeInSign,
        house: house,
        retrograde: retrograde,
        speed: speedLon,
        category: point.category,
        accuracy: point.accuracy && point.accuracy.swiss,
        backend: 'swiss'
      };
    } catch (err) {
      if (this.opts.logErrors) console.error('[SwissBackend.compute]', pointId, err.message);
      return null;
    }
  };

  return { VERSION: VERSION, create: function (opts) { return new SwissBackend(opts); } };
}));
