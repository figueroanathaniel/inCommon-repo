/*! ephemeris-router.js: Ephemeris backend router and orchestrator. V1.0.0 (UMD)
 *
 * ROUTER selects which backend (current or Swiss WASM) to use for position
 * computation. Implements graceful fallback: if Swiss WASM fails to load or
 * initialize, automatically uses the current (simplified) ephemeris.
 *
 * PUBLIC API:
 *   router.init() -> Promise
 *     Initialize the primary backend (Swiss if available, else current).
 *     Respects opts.forceBackend = 'current' to skip Swiss.
 *
 *   router.compute(pointId, jd, lat, lon, houseSys, opts) -> EphemPoint
 *     Compute position. Returns structured result or null if unavailable.
 *
 *   router.status() -> { ready, primary, fallback, errors }
 *     Report which backends are active and any load errors.
 *
 * DESIGN:
 * - Primary backend (Swiss) initialized eagerly on init().
 * - Fallback backend (current) always available, no init needed.
 * - If primary fails to init, falls back transparently.
 * - Caching via ephemeris-cache.js is transparent to router.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EphemerisRouter = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  function EphemerisRouter(opts) {
    this.opts = opts || {};
    this.primaryBackend = null;
    this.fallbackBackend = null;
    this.primaryReady = false;
    this.fallbackReady = false;
    this.errors = [];
    this._initPromise = null;
  }

  /** Initialize backends. Swiss WASM first; fall back to current if it fails.
   * @returns {Promise} Resolves when at least fallback backend is ready
   */
  EphemerisRouter.prototype.init = function () {
    var self = this;

    if (this._initPromise) return this._initPromise;

    this._initPromise = Promise.resolve().then(function () {
      /* Load and init fallback (current) backend. Always succeeds. */
      var CurrentBackendModule = (typeof window !== 'undefined' && window.EphemerisBackendCurrent) ||
        require('./ephemeris-backend-current.js');
      self.fallbackBackend = CurrentBackendModule.create({ logErrors: self.opts.logErrors });
      return self.fallbackBackend.init();
    }).then(function () {
      self.fallbackReady = true;

      /* If user forces current ephemeris, skip Swiss */
      if (self.opts.forceBackend === 'current') {
        if (self.opts.logErrors) console.log('[EphemerisRouter] Forced to current backend');
        return;
      }

      /* Try to load Swiss Ephemeris WASM as primary backend */
      var SwissBackendModule = (typeof window !== 'undefined' && window.EphemerisBackendSwiss) ||
        require('./ephemeris-backend-swiss.js');
      self.primaryBackend = SwissBackendModule.create({ logErrors: self.opts.logErrors });

      return self.primaryBackend.init().then(function () {
        self.primaryReady = true;
        if (self.opts.logErrors) console.log('[EphemerisRouter] Swiss Ephemeris WASM initialized');
      }).catch(function (err) {
        self.primaryReady = false;
        self.errors.push('[EphemerisRouter] Swiss Ephemeris WASM init failed: ' + err.message);
        if (self.opts.logErrors) console.warn('[EphemerisRouter] Swiss WASM unavailable, using current:', err.message);
        /* Fall back is already ready */
      });
    }).catch(function (err) {
      self.errors.push('[EphemerisRouter] Router initialization failed: ' + err.message);
      if (self.opts.logErrors) console.error('[EphemerisRouter] Init error:', err);
      throw err;
    });

    return this._initPromise;
  };

  /** Compute a point using whichever backend is available
   * @param {string} pointId - Point ID (e.g., 'sun', 'moon', 'chiron')
   * @param {number} jd - Julian Day number
   * @param {number} [lat] - Observer latitude (optional)
   * @param {number} [lon] - Observer longitude (optional)
   * @param {string} [houseSys] - House system code (optional)
   * @returns {Object|null} EphemPoint or null if computation fails
   */
  EphemerisRouter.prototype.compute = function (pointId, jd, lat, lon, houseSys, opts) {
    opts = opts || {};

    /* Try primary (Swiss) first */
    if (this.primaryReady && this.primaryBackend) {
      var result = this.primaryBackend.compute(pointId, jd, lat, lon, houseSys, opts);
      if (result) return result;
    }

    /* Fall back to current ephemeris */
    if (this.fallbackReady && this.fallbackBackend) {
      return this.fallbackBackend.compute(pointId, jd, lat, lon, houseSys, opts);
    }

    return null;
  };

  /** Compute all 17 points for a given instant
   * @param {number} jd - Julian Day number
   * @param {number} [lat] - Observer latitude (optional)
   * @param {number} [lon] - Observer longitude (optional)
   * @param {string} [houseSys] - House system code (optional)
   * @returns {Array} Array of EphemPoint objects
   */
  EphemerisRouter.prototype.computeAll = function (jd, lat, lon, houseSys, opts) {
    opts = opts || {};
    var Points = (typeof window !== 'undefined' && window.EphemerisPoints) || require('./ephemeris-points.js');
    var results = [];

    Points.ordered().forEach(function (point) {
      var result = this.compute(point.id, jd, lat, lon, houseSys, opts);
      if (result) results.push(result);
    }, this);

    return results;
  };

  /** Report router status and which backend is active
   * @returns {Object} Status object with ready, primary, fallback, errors, using
   */
  EphemerisRouter.prototype.status = function () {
    return {
      ready: this.fallbackReady,
      primary: this.primaryReady ? 'Swiss Ephemeris WASM' : 'unavailable',
      fallback: this.fallbackReady ? 'Current (simplified)' : 'unavailable',
      errors: this.errors.slice(),
      using: this.primaryReady ? 'swiss' : 'current'
    };
  };

  /** Clean up and close backends (frees WASM memory) */
  EphemerisRouter.prototype.close = function () {
    if (this.primaryBackend && this.primaryBackend.close) {
      this.primaryBackend.close();
    }
    if (this.fallbackBackend && this.fallbackBackend.close) {
      this.fallbackBackend.close();
    }
    this.primaryBackend = null;
    this.fallbackBackend = null;
    this.primaryReady = false;
    this.fallbackReady = false;
  };

  return { VERSION: VERSION, create: function (opts) { return new EphemerisRouter(opts); } };
}));
