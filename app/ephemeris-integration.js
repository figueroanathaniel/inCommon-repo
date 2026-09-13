/*! ephemeris-integration.js: Integration helper for main app. V1.0.0 (UMD)
 *
 * Provides helpers to migrate the main app component from direct lonRaw() calls
 * to router-based computation. Handles initialization, cleanup, and API mapping.
 *
 * USAGE IN MAIN COMPONENT:
 *   In componentDidMount():
 *     this.ephIntegration = EphemerisIntegration.init(this);
 *     await this.ephIntegration.ready();
 *
 *   Replace this.lonOf(name, t) with:
 *     this.ephIntegration.lonOf(name, t)  [same API, uses router internally]
 *
 *   In componentWillUnmount():
 *     this.ephIntegration.close();
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EphemerisIntegration = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  var POINT_NAMES = {
    'Sun': 'sun', 'Moon': 'moon', 'Mercury': 'mercury', 'Venus': 'venus',
    'Mars': 'mars', 'Jupiter': 'jupiter', 'Saturn': 'saturn', 'Uranus': 'uranus',
    'Neptune': 'neptune', 'Pluto': 'pluto', 'North Node': 'northNode',
    'South Node': 'southNode', 'Earth': 'earth', 'Chiron': 'chiron',
    'Ceres': 'ceres', 'Pallas': 'pallas', 'Juno': 'juno', 'Vesta': 'vesta'
  };

  function EphemerisIntegration(component) {
    this.component = component;
    this.router = null;
    this.fallbackImpl = null;
    this._readyPromise = null;
    this._ready = false;
  }

  EphemerisIntegration.prototype.ready = function () {
    var self = this;
    if (this._ready) return Promise.resolve();
    if (this._readyPromise) return this._readyPromise;

    this._readyPromise = Promise.resolve().then(function () {
      /* Try to initialize router */
      var Router = (typeof window !== 'undefined' && window.EphemerisRouter) ||
        (typeof require !== 'undefined' && require('./ephemeris-router.js'));

      if (Router && Router.create) {
        self.router = Router.create({ logErrors: false });
        return self.router.init();
      }

      /* Fallback: no router, use existing lonRaw on component */
      if (self.component && self.component.lonRaw) {
        self.fallbackImpl = self.component;
        return Promise.resolve();
      }

      throw new Error('Ephemeris router and fallback lonRaw both unavailable');
    }).then(function () {
      self._ready = true;
    }).catch(function (err) {
      if (self.component && self.component.lonRaw) {
        /* Fallback to component lonRaw if router fails */
        self.fallbackImpl = self.component;
        self._ready = true;
        console.warn('[EphemerisIntegration] Router failed, using component lonRaw:', err.message);
      } else {
        throw err;
      }
    });

    return this._readyPromise;
  };

  /* Get point ID from name (e.g., 'Sun' -> 'sun') */
  EphemerisIntegration.prototype._pointId = function (name) {
    return POINT_NAMES[name] || null;
  };

  /** Compute longitude: use router if available, fallback to component lonRaw
   * @param {string} name - Point name (e.g., 'Sun', 'Moon')
   * @param {number} t - Julian Day number
   * @returns {number|null} Ecliptic longitude in degrees
   */
  EphemerisIntegration.prototype.lonOf = function (name, t) {
    if (!this._ready) {
      console.warn('[EphemerisIntegration] lonOf("' + name + '") called before ready(), using fallback');
      return this.fallbackImpl && this.fallbackImpl.lonRaw ? this.fallbackImpl.lonRaw(name, t) : null;
    }

    /* Try router first */
    if (this.router) {
      var pointId = this._pointId(name);
      if (pointId) {
        try {
          var result = this.router.compute(pointId, t);
          if (result && result.lon != null) return result.lon;
        } catch (err) {
          console.warn('[EphemerisIntegration] Router compute failed:', err.message);
        }
      }
    }

    /* Fall back to component lonRaw if router not available or returns null */
    if (this.fallbackImpl && this.fallbackImpl.lonRaw) {
      return this.fallbackImpl.lonRaw(name, t);
    }

    return null;
  };

  /* Get full point data (lon, lat, dist, sign, house, etc.) */
  EphemerisIntegration.prototype.computePoint = function (name, t, lat, lon, houseSys) {
    if (!this._ready) return null;

    if (this.router) {
      var pointId = this._pointId(name);
      if (pointId) {
        try {
          return this.router.compute(pointId, t, lat, lon, houseSys);
        } catch (err) {
          console.warn('[EphemerisIntegration] Router compute failed:', err.message);
        }
      }
    }

    /* Fallback: build basic point from lonRaw */
    if (this.fallbackImpl && this.fallbackImpl.lonRaw) {
      var longitude = this.fallbackImpl.lonRaw(name, t);
      if (longitude == null) return null;

      var signOf = this.fallbackImpl.signOf || this.component.signOf;
      var s = signOf ? signOf.call(this.fallbackImpl || this.component, longitude) : {};

      return {
        id: this._pointId(name),
        name: name,
        lon: longitude,
        lat: null,
        dist: null,
        sign: s.idx,
        degreeInSign: s.deg,
        house: null,
        retrograde: null,
        speed: null,
        backend: 'fallback'
      };
    }

    return null;
  };

  /* Get router status (which backend is active) */
  EphemerisIntegration.prototype.status = function () {
    if (!this._ready) return { ready: false, status: 'initializing' };
    if (this.router) {
      return this.router.status();
    }
    return { ready: true, status: 'fallback', using: 'component.lonRaw' };
  };

  /* Clean up */
  EphemerisIntegration.prototype.close = function () {
    if (this.router && this.router.close) {
      this.router.close();
    }
    this.router = null;
    this.fallbackImpl = null;
    this._ready = false;
  };

  return {
    VERSION: VERSION,
    init: function (component, opts) {
      var inst = new EphemerisIntegration(component);
      inst.ready().catch(function (err) {
        console.error('[EphemerisIntegration] Init failed:', err.message);
      });
      return inst;
    }
  };
}));
