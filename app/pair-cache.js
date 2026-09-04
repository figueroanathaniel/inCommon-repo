/*! pair-cache.js: one entry per pair of people. V1.0.0 (UMD)
 *
 * WHY THIS EXISTS BEFORE THE THING IT CACHES.
 *
 * Composite arithmetic is deterministic given two birth records, so the same
 * two people always produce the same structural readout. The cost that matters
 * is not the arithmetic, which is milliseconds; it is what happens when a group
 * view fans out. A group of n people contains n(n-1)/2 pairs: ten people is 45,
 * twelve is 66, thirty is 435. Render a grid eagerly and one screen has asked
 * for four hundred readouts nobody looked at.
 *
 * The guard is therefore not an optimisation and is not optional. `openOne()`
 * refuses to compute more than one composite per call, so a group view has to
 * ask for pairs one at a time, on open, which is the shape the screen should
 * have had anyway.
 *
 * THE KEY IS THE PAIR, NOT THE READER. SHA-256 over the two chart hashes sorted
 * lexicographically, so (A,B) and (B,A) are one entry, and so two readers who
 * both saved the same two people share it. On a device that only matters when
 * somebody appears in two groups; the reason to write it this way now is that
 * the key survives if a shared layer is ever built, and a key that has to be
 * changed later invalidates everything stored under the old one.
 *
 * WHAT IS CACHED IS STRUCTURE, NEVER PROSE. The value holds what connects, what
 * stays open, and where the pull sits. No generated narrative goes in here,
 * which is what keeps the launch free of model cost: prose arrives per view,
 * behind an explicit tap, and is not stored.
 *
 * WHAT IS NOT IN THE KEY, AND MUST NOT BE: names, labels, notes, or anything a
 * reader typed. The key is two chart hashes, each of which is a digest of a
 * birth moment and a place. A cache key that carried a name would put a name in
 * a store whose whole purpose is to be shared.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.PairCache = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var KEY = 'incommon.paircache.v1';
  /* Entries are cheap and a device is not a server. Enough for a full group at
     the cap several times over, and small enough that the store never becomes
     the reason storage fills. Evicted least recently used. */
  var MAX_ENTRIES = 240;

  var store = null, hasher = null, stateVersion = 1;
  var metrics = { hits: 0, misses: 0, writes: 0, evictions: 0, refusals: 0, generationsAvoided: 0 };

  /* The hash function comes from people-library.js rather than being written
     twice: two implementations of one digest is two digests waiting to
     disagree, and a disagreement here silently halves the hit rate. */
  function configure(opts) {
    if (!opts) return;
    if (opts.store !== undefined) store = opts.store;
    if (opts.sha256 !== undefined) hasher = opts.sha256;
    if (opts.stateVersion !== undefined) stateVersion = opts.stateVersion;
  }
  function backing() {
    if (store) return store;
    try { if (typeof localStorage !== 'undefined' && localStorage) return localStorage; } catch (e) {}
    return null;
  }
  function sha(s) {
    if (hasher) return hasher(s);
    if (typeof self !== 'undefined' && self.PeopleLibrary) return self.PeopleLibrary.sha256hex(s);
    if (typeof globalThis !== 'undefined' && globalThis.PeopleLibrary) return globalThis.PeopleLibrary.sha256hex(s);
    return null;
  }

  function read() {
    var s = backing(); if (!s) return { v: stateVersion, e: {} };
    try {
      var raw = JSON.parse(s.getItem(KEY));
      if (!raw || raw.v !== stateVersion || !raw.e) return { v: stateVersion, e: {} };
      return raw;
    } catch (e) { return { v: stateVersion, e: {} }; }
  }
  function write(all) {
    var s = backing(); if (!s) return;
    try { s.setItem(KEY, JSON.stringify(all)); } catch (e) {}
  }

  /* (A,B) and (B,A) are one pair. Sorting before hashing is the whole of it. */
  function pairKey(hashA, hashB) {
    var a = String(hashA || ''), b = String(hashB || '');
    if (!a || !b) return null;
    var lo = a < b ? a : b, hi = a < b ? b : a;
    var h = sha('pair|v' + stateVersion + '|' + lo + '|' + hi);
    return h ? h.slice(0, 32) : null;
  }

  function get(hashA, hashB) {
    var k = pairKey(hashA, hashB);
    if (!k) return null;
    var all = read(), row = all.e[k];
    if (!row) { metrics.misses++; return null; }
    metrics.hits++;
    metrics.generationsAvoided++;
    row.seen = Date.now();
    all.e[k] = row;
    write(all);
    return row.value;
  }

  function put(hashA, hashB, value) {
    var k = pairKey(hashA, hashB);
    if (!k) return false;
    /* Prose is not cacheable here, and the refusal is loud rather than a
       silent strip: a caller trying to store narrative has misunderstood what
       this layer is for, and should find out now. */
    if (value && (value.narrative || value.prose || value.text)) {
      throw new Error('pair-cache: the cached value is structure only. Narrative is generated per view and never stored.');
    }
    var all = read(), keys = Object.keys(all.e);
    if (keys.length >= MAX_ENTRIES && !all.e[k]) {
      var oldest = null, oldestAt = Infinity;
      for (var i = 0; i < keys.length; i++) {
        var t = all.e[keys[i]].seen || 0;
        if (t < oldestAt) { oldestAt = t; oldest = keys[i]; }
      }
      if (oldest) { delete all.e[oldest]; metrics.evictions++; }
    }
    all.e[k] = { value: value, seen: Date.now(), v: stateVersion };
    metrics.writes++;
    write(all);
    return true;
  }

  /* ONE COMPOSITE PER CALL, AND THE GUARD IS THE POINT.

     A group view calls this once per cell the reader actually opens. It cannot
     be handed a list, because a function that accepts a list is a function
     somebody passes sixty six pairs to. */
  function openOne(hashA, hashB, computeFn) {
    var hit = get(hashA, hashB);
    if (hit) return { value: hit, cached: true };
    if (typeof computeFn !== 'function') { metrics.refusals++; return { value: null, cached: false, reason: 'no compute' }; }
    var value = computeFn();
    if (value) put(hashA, hashB, value);
    return { value: value, cached: false };
  }

  function stats() {
    var all = read(), keys = Object.keys(all.e);
    var bytes = 0;
    try { bytes = JSON.stringify(all).length; } catch (e) { bytes = 0; }
    var looks = metrics.hits + metrics.misses;
    return {
      entries: keys.length, bytes: bytes,
      hits: metrics.hits, misses: metrics.misses,
      hitRate: looks ? Math.round((metrics.hits / looks) * 100) / 100 : 0,
      writes: metrics.writes, evictions: metrics.evictions,
      generationsAvoided: metrics.generationsAvoided,
      stateVersion: stateVersion, max: MAX_ENTRIES
    };
  }

  /* A bump in computed_state_version means every stored readout was produced
     by arithmetic that no longer exists. read() drops them on the next look,
     and this is the explicit form for a caller that wants it now. */
  function invalidate(newVersion) {
    if (newVersion !== undefined) stateVersion = newVersion;
    write({ v: stateVersion, e: {} });
    return { cleared: true, stateVersion: stateVersion };
  }
  function resetMetrics() {
    metrics = { hits: 0, misses: 0, writes: 0, evictions: 0, refusals: 0, generationsAvoided: 0 };
  }

  return { VERSION: VERSION, KEY: KEY, MAX_ENTRIES: MAX_ENTRIES,
    configure: configure, pairKey: pairKey, get: get, put: put,
    openOne: openOne, stats: stats, invalidate: invalidate, resetMetrics: resetMetrics };
}));
