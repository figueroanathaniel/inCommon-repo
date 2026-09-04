/*! ephemeris-cache.js: one entry per body per instant. V1.0.0 (UMD)
 *
 * WHY THIS DOES NOT VIOLATE COMPUTE ON READ.
 *
 * The standing rule is compute on read, store nothing derivable. A position is
 * not derived user state: it is where a body was at an instant, true for
 * everybody, containing no birth record, no name and nothing a reader typed.
 * The rule exists so that a person editing their birth data cannot leave a
 * stale reading behind them, and nothing in here can go stale that way, because
 * nothing in here is keyed by a person.
 *
 * It is also IN MEMORY AND NEVER PERSISTED, which is the second half of the
 * compliance. pair-cache.js writes to localStorage because a composite is
 * expensive to regenerate and cheap to store. A position is the opposite, a few
 * microseconds to compute, so persisting one would cost more in storage,
 * serialisation and invalidation risk than it could ever return. This cache
 * lives for the life of the page and dies with it.
 *
 * WHAT WAS MEASURED, BECAUSE THE SHAPE FOLLOWS FROM IT.
 * `node tools/bench-ephemeris.js` reproduces all of this, and it prints ratios
 * as well as times on purpose. The absolute numbers move by 3x between runs on
 * one machine, so a comment quoting microseconds would be wrong by the second
 * week. The ratios do not move:
 *
 *   a cached transitWindows walk            about 90% faster
 *   the SAME walk keyed by a string         5% faster, and negative as often
 *   number key against string key           about 10x
 *   one lonRaw call                         low single digit microseconds
 *
 * Three things follow.
 *
 * THE KEY IS A NUMBER, NOT A STRING. A cache keyed on the UTC instant rendered
 * as a string is not measurably faster than no cache at all: building the key
 * costs about as much as the answer it is saving, and on half the runs it costs
 * more. Body name to a small integer slot, and a Map keyed by the raw float t,
 * and the same walk is served ten times faster. When a miss costs microseconds,
 * the key has to cost nanoseconds.
 *
 * THERE IS NO LRU AND THERE MUST NOT BE. LRU wants bookkeeping on every HIT, a
 * splice or a delete and re-set, and measured against a recompute of a few microseconds that bookkeeping is worth less than the miss it prevents. At the
 * ceiling this clears wholesale. Refilling is cheap by construction, and an
 * eviction policy that costs more than the thing it evicts is decoration.
 *
 * THERE IS NO TTL. A position at an instant does not expire, and the entries
 * that go cold are the ones from a day that has passed. They are keyed by their
 * own instant, so they are never wrong, only unused, and the ceiling collects
 * them. A timer to delete correct values is a timer that can only lose.
 *
 * WHAT IS DELIBERATELY NOT CACHED, AND THIS ONE IS CORRECTNESS RATHER THAN
 * TASTE. Chiron and the four asteroids are read out of window.MinorBodies,
 * which minor-bodies-ephemeris.js installs and can uninstall, and which
 * restore() can recalibrate from stored elements. A body whose answer depends
 * on mutable global state cannot be memoised against its instant alone: cache a
 * null taken before install and the Expanded Chart shows "not computed" for the
 * rest of the session. CACHEABLE is therefore the eleven bodies whose position
 * is a pure function of t, and everything else passes straight through.
 *
 * WHERE THIS CACHE LOSES, WHICH IS NOT NOTHING. Filling is not free. A walk
 * that never repeats an instant pays the fill and collects nothing, and comes
 * out about 20% SLOWER than no cache at all. transitWindows is exactly that
 * walk: it memoises its own result per day per profile, so it only ever runs
 * cold, and this cache costs it about a millisecond.
 *
 * It is still a clear win, and here is the arithmetic rather than the
 * assertion. That millisecond is paid once per day per profile. The natal
 * chart is read by ten call sites that have no memo of their own, all asking
 * for one instant, so the first is a miss and the next nine are hits, and that
 * happens on every render. Ten renders pay the walk back. There are many more
 * than ten renders.
 *
 * THE CACHE IS OPTIONAL. lonOf() uses it when it is present and computes when
 * it is not, and it is absent from modulesReady() on purpose. A performance
 * memo must never be able to stop the app from booting.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.EphemerisCache = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  /* Pure functions of t. Anything not on this list is computed every time.
     Adding a body here is a claim that its position depends on nothing but the
     instant, so check that before you add one. */
  var CACHEABLE = ['Sun', 'Moon', 'North Node', 'South Node', 'Mercury', 'Venus',
    'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

  /* Body name to slot, resolved once. A string key per lookup is the thing this
     cache exists to avoid, so the name is never part of the key. */
  var SLOT = {};
  for (var i = 0; i < CACHEABLE.length; i++) SLOT[CACHEABLE[i]] = i;

  /* Enough for a full transitWindows walk (1986) several times over plus every
     chart on screen, and small enough that the cache is never the reason a tab
     is using memory. Roughly 200KB at the ceiling. */
  var MAX_ENTRIES = 4000;

  var tables = [];
  for (var j = 0; j < CACHEABLE.length; j++) tables.push(new Map());
  var entries = 0;

  var metrics = { hits: 0, misses: 0, passthrough: 0, clears: 0 };

  function clear() {
    for (var k = 0; k < tables.length; k++) tables[k].clear();
    entries = 0;
    metrics.clears++;
  }

  /* THE COMPUTE FUNCTION IS REGISTERED ONCE, NOT PASSED PER CALL.
     The obvious API is through(body, t, () => compute(body, t)), and it
     allocates a closure on every lookup including every hit. Measured on a cold
     transitWindows walk, where every one of 1986 lookups misses, that allocation
     cost between a third and two thirds of the walk again: the cache made the
     cold path slower than no cache, and the cold path is the one that runs,
     because transitWindows memoises its own result per day per profile. One
     registered function and the allocation disappears.

     Reading and filling still happen in a single call for the original reason:
     a caller that can read without filling is a caller that eventually does,
     and the cache then looks like it is working with a hit rate of zero. */
  var compute = null;
  function source(fn) { compute = fn; }

  function get(body, t) {
    if (!compute) return null;
    var slot = SLOT[body];
    if (slot === undefined) { metrics.passthrough++; return compute(body, t); }
    var table = tables[slot];
    var hit = table.get(t);
    if (hit !== undefined) { metrics.hits++; return hit; }
    metrics.misses++;
    var val = compute(body, t);
    /* A null is a body with no supplier and is not a position. Storing one
       would be storing the absence of the ephemeris rather than a fact from
       it. */
    if (val == null) return val;
    if (entries >= MAX_ENTRIES) clear();
    table.set(t, val);
    entries++;
    return val;
  }

  function report() {
    var looks = metrics.hits + metrics.misses;
    return {
      version: VERSION,
      entries: entries,
      ceiling: MAX_ENTRIES,
      hits: metrics.hits,
      misses: metrics.misses,
      passthrough: metrics.passthrough,
      clears: metrics.clears,
      hitRate: looks ? metrics.hits / looks : null,
      /* A Map entry with a float key and a float value costs roughly this once
         V8 overhead is counted. It is an estimate and is labelled as one. */
      approxBytes: entries * 48,
      persisted: false
    };
  }

  function reset() { clear(); metrics.hits = 0; metrics.misses = 0; metrics.passthrough = 0; metrics.clears = 0; }

  return {
    VERSION: VERSION, CACHEABLE: CACHEABLE, MAX_ENTRIES: MAX_ENTRIES,
    source: source, get: get, report: report, reset: reset, clear: clear,
    cacheable: function (body) { return SLOT[body] !== undefined; }
  };
}));
