/*! ephemeris-worker.js
 * Web Worker for async ephemeris computation
 * Runs computeAll() off main thread, returns results via postMessage
 */

// Import engine (via importScripts or module loader)
// Assumption: swisseph bindings are available in worker scope

let cache = new Map();

/**
 * Generate cache key for memoization
 * Key: rounded(jd*100)|rounded(lat*100)|rounded(lon*100)
 */
function getCacheKey(jd, lat, lon) {
  return Math.round(jd * 100) + '|' + Math.round(lat * 100) + '|' + Math.round(lon * 100);
}

/**
 * Main worker message handler
 * Expects: { type: 'compute', jd, lat, lon, houseCusps, opts }
 */
self.onmessage = async function(event) {
  const { type, jd, lat, lon, houseCusps, opts, id } = event.data;

  if (type === 'compute') {
    try {
      const key = getCacheKey(jd, lat, lon);

      // Check cache
      if (cache.has(key)) {
        const cached = cache.get(key);
        self.postMessage({
          type: 'result',
          id,
          data: cached,
          cached: true,
          timing: 0
        });
        return;
      }

      // Compute (time it)
      const start = performance.now();
      const chart = await computeAll(jd, lat, lon, houseCusps, opts);
      const elapsed = performance.now() - start;

      // Cache result
      cache.set(key, chart);

      // Limit cache size (keep 10 most recent)
      if (cache.size > 10) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      self.postMessage({
        type: 'result',
        id,
        data: chart,
        cached: false,
        timing: elapsed
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        id,
        error: error.message
      });
    }
  }

  if (type === 'clearCache') {
    cache.clear();
    self.postMessage({ type: 'cacheCleared' });
  }
};

/**
 * Stub: computeAll function
 * In real implementation, import from ephemeris/engine.ts
 */
async function computeAll(jd, lat, lon, houseCusps, opts) {
  // TODO: Import actual computeAll from engine
  return [];
}
