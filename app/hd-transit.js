/*! hd-transit.js: the gates the sky stands in at one instant. V1.0.0 (UMD)
 *
 * WHAT IT IS. Every body's gate and line at an instant the caller names, in an
 * order declared here that never depends on the sky, and the same list split
 * by whether a chart holds each gate. Gate numbers and line numbers only: no
 * names, no keynotes, no sentences. The words belong to the screen, and
 * nothing interpretive may be written for this layer until it has been
 * reviewed.
 *
 * IT CARRIES NO EPHEMERIS AND READS NO CLOCK. The app hands it a longitude
 * function and an instant, the same shape arc-solver.js takes. A module that
 * called the clock itself could not be tested at a boundary, and one that
 * carried its own Moon would be a second answer for one body.
 *
 * THE INSTANT IS A MINUTE, AND IT IS THE START OF THAT MINUTE. The Moon moves
 * a line in about an hour and three quarters, so a day is not an instant and
 * the sky at local noon is not the sky now. A reading is taken at the first
 * millisecond of the minute it is asked in, and the instant travels inside the
 * reading, so a screen can say which minute it shows and two renders inside
 * one minute cannot disagree.
 *
 * THE DAY IS CIVIL AND BELONGS TO A ZONE; THE INSTANT BELONGS TO NOBODY. One
 * minute is the 11th in Tonga and the 10th in Pago Pago, and the gates are the
 * same in both. civilDay() asks Intl, the way birth-time.js does, because a
 * hand written offset is wrong on every day a clock changes.
 *
 * EARTH AND THE SOUTH NODE ARE DERIVED, opposite the Sun and the North Node,
 * exactly as hdGatesFor() derives them in the app. A body the caller cannot
 * place comes back with a null gate rather than a guessed one, and sits in
 * neither half of a split.
 *
 * NOTHING HERE IS A SCORE. No field counts, ranks or rates anything, and a
 * reading knows nothing about yesterday, so there is nothing a streak could be
 * built from. Nothing is persisted and no reading is held: the app memoises
 * per minute, because that is a render concern and not a fact about the sky.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDTransit = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  /* The app's own body order, the PLNS table, with each derived body directly
     after the one it is derived from. Declared rather than sorted: an order
     computed from positions moves with the sky, and an order that moves is an
     order somebody eventually reads as meaning something. */
  var BODIES = Object.freeze(['Sun', 'Earth', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter',
    'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node']);
  var OPPOSITE = { 'Earth': 'Sun', 'South Node': 'North Node' };
  var MINUTE = 60000;

  function finite(x) { return typeof x === 'number' && isFinite(x); }

  /* Found by name the way every module in this build finds its dependencies,
     or passed in, which is what a Node caller does. */
  function wheelOf(opts) {
    if (opts && opts.wheel) return opts.wheel;
    var g = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : null);
    return g && g.HDWheel ? g.HDWheel : null;
  }

  function minuteStart(ms) { return Math.floor(ms / MINUTE) * MINUTE; }

  /* Days from J2000.0, the scale the app's lonOf() takes. */
  function t2000(ms) { return ms / 86400000 + 2440587.5 - 2451545.0; }

  /* Exactly the instant given, not rounded: reading() is what chooses the
     minute. Each body is asked for once, so Earth reuses the Sun it was
     derived from rather than asking the sky a second time. */
  function activations(lonOf, ms, opts) {
    var W = wheelOf(opts);
    if (typeof lonOf !== 'function' || !finite(ms) || !W) return null;
    var t = t2000(ms), seen = Object.create(null);
    var lon = function (name) {
      if (!(name in seen)) { var v = lonOf(name, t); seen[name] = finite(v) ? v : null; }
      return seen[name];
    };
    return BODIES.map(function (body) {
      var src = OPPOSITE[body], L = lon(src || body);
      if (L === null) return { body: body, gate: null, line: null };
      var r = W.gateLine(src ? W.norm360(L + 180) : L);
      return { body: body, gate: r.gate, line: r.line };
    });
  }

  /* The local calendar date of an instant in a zone, as YYYY-MM-DD. No zone
     means the device's own. A zone Intl does not know returns null. */
  function civilDay(ms, timeZone) {
    if (!finite(ms)) return null;
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: timeZone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day;
    } catch (e) { return null; }
  }

  function reading(lonOf, ms, opts) {
    if (!finite(ms)) return null;
    var at = minuteStart(ms), acts = activations(lonOf, at, opts);
    if (!acts) return null;
    return { instant: new Date(at).toISOString(), day: civilDay(at, opts && opts.timeZone), activations: acts };
  }

  /* Which of these gates a chart holds. Accepts a Set or an array of gate
     numbers and refuses anything else. Both halves keep the declared order,
     and a body with no gate is in neither. */
  function split(acts, chartGates) {
    var has = chartGates && typeof chartGates.has === 'function' ? function (g) { return chartGates.has(g); }
      : Array.isArray(chartGates) ? function (g) { return chartGates.indexOf(g) !== -1; } : null;
    if (!Array.isArray(acts) || !has) return null;
    var inside = [], outside = [];
    acts.forEach(function (a) {
      if (!a || a.gate === null) return;
      (has(a.gate) ? inside : outside).push({ body: a.body, gate: a.gate, line: a.line });
    });
    return { inside: inside, outside: outside };
  }

  return { VERSION: VERSION, BODIES: BODIES, MINUTE: MINUTE, minuteStart: minuteStart, t2000: t2000,
    activations: activations, civilDay: civilDay, reading: reading, split: split };
}));
