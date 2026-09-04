/*! arc-solver.js: finding the moment a body reaches a longitude. V1.0.0 (UMD)
 *
 * WHY THIS EXISTS. The design side of a bodygraph is not "88 days before
 * birth". It is the moment the Sun stood 88 degrees of arc earlier, and the
 * time that takes is not constant: the Earth moves fastest at perihelion in
 * early January and slowest at aphelion in early July, so 88 degrees of solar
 * arc takes anywhere from about 86 to about 92 days.
 *
 * The build approximated it as a fixed 88.36 days. Measured against a solved
 * arc across twelve birth months, that approximation lands up to 3.6 days out.
 * On the design side that is up to 3.5 degrees of Sun, which is nearly four
 * lines and flips a gate, and up to 46 degrees of MOON, which is more than
 * eight gates. Half the year had a design Moon in the wrong gate, which changes
 * defined channels, defined centres, and can change the Type and Authority the
 * whole reading is built on. Nothing reported it, because a wrong gate looks
 * exactly like a right one.
 *
 * WHAT IT IS. A bisection root finder over a longitude function supplied by the
 * caller, so this file knows nothing about ephemerides and the app keeps one
 * copy of its own. Two callers today: the design moment, and the return
 * crossings a cycle chart needs. Both are the same question asked twice, which
 * is why they share a solver rather than each growing their own.
 *
 * WHY BISECTION. It cannot diverge, it needs no derivative, and its iteration
 * count is knowable in advance: an eleven day bracket refined to one arcsecond
 * of solar motion is about twenty halvings. A faster method that occasionally
 * runs away would be the wrong trade for arithmetic that decides what a chart
 * says. The count is returned so a caller can assert it stayed bounded, because
 * a runaway means a bad bracket and a bad bracket means a wrong date.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.ArcSolver = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  /* One arcsecond, in degrees. The spec's tolerance, and it is not arbitrary:
     a line boundary is 0.9375 degrees, so an arcsecond is about three
     thousandths of the smallest thing a chart can get wrong. */
  var ARCSEC = 1 / 3600;
  var MAX_ITER = 80;

  function norm360(x) { return ((x % 360) + 360) % 360; }
  /* Signed separation in (-180, 180]. Every comparison here is angular, so a
     plain subtraction is wrong once per orbit and right the rest of the time,
     which is the worst way for arithmetic to be wrong. */
  function delta(a, b) { var d = norm360(a - b); return d > 180 ? d - 360 : d; }

  /* Bisect for the instant where lonFn(t) reaches target, inside a bracket the
     caller guarantees contains exactly one crossing. Returns the time, the
     residual in degrees, and the iterations it took. */
  function solve(lonFn, target, lo, hi, tolDeg) {
    var tol = tolDeg == null ? ARCSEC : tolDeg;
    var f = function (t) { return delta(lonFn(t), target); };
    var flo = f(lo), fhi = f(hi), i = 0;
    if (flo === 0) return { t: lo, residual: 0, iterations: 0, bracketed: true };
    if (fhi === 0) return { t: hi, residual: 0, iterations: 0, bracketed: true };
    /* No sign change means the crossing is not in here. Say so rather than
       returning the midpoint of a bracket that never contained an answer. */
    if (flo > 0 === fhi > 0) return { t: null, residual: null, iterations: 0, bracketed: false };
    var mid = lo, fm = flo;
    while (i < MAX_ITER) {
      mid = (lo + hi) / 2;
      fm = f(mid);
      i++;
      if (Math.abs(fm) <= tol || (hi - lo) < 1e-9) break;
      if ((fm > 0) === (flo > 0)) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; }
    }
    return { t: mid, residual: Math.abs(fm), iterations: i, bracketed: true };
  }

  /* THE DESIGN MOMENT. Solved, never assumed.

     The bracket is generous on both sides of the fixed day count the build used
     to trust, because the true answer moves by nearly four days across the year
     and a bracket that is merely typical is a bracket that fails in July. */
  function designMoment(sunLonFn, tNatal, opts) {
    var o = opts || {};
    var arc = o.arc == null ? 88 : o.arc;
    var target = norm360(sunLonFn(tNatal) - arc);
    var lo = tNatal - (o.maxDays == null ? 96 : o.maxDays);
    var hi = tNatal - (o.minDays == null ? 83 : o.minDays);
    var r = solve(sunLonFn, target, lo, hi, o.tolerance);
    if (!r.bracketed) {
      /* Only reachable if the caller hands in a longitude function that is not
         the Sun. Falling back to the old constant would hide that, so the
         failure is returned and the app keeps its own fallback in one place. */
      return { t: null, target: target, solved: false, iterations: r.iterations, residual: null };
    }
    return { t: r.t, target: target, solved: true, iterations: r.iterations, residual: r.residual,
      daysBefore: tNatal - r.t };
  }

  /* EVERY CROSSING IN THE WINDOW, NOT THE FIRST.

     A body that turns retrograde crosses the same longitude three times, and
     Saturn and Chiron routinely do. Reporting one date for a three pass return
     is not a rounding error, it is a false statement about when something
     happens. The scan steps coarsely, notices each sign change, and bisects
     inside it, so the count of crossings comes out of the data rather than out
     of an assumption about how many there should be. */
  function crossings(lonFn, target, from, to, opts) {
    var o = opts || {};
    var step = o.step == null ? 2 : o.step;
    var out = [], t = from, prev = delta(lonFn(from), target), iterations = 0;
    while (t < to) {
      var next = Math.min(t + step, to);
      var cur = delta(lonFn(next), target);
      /* A sign change with both ends near the target is a real crossing; a sign
         change with a huge jump is the wrap at the far side of the circle. */
      if (prev !== 0 && (prev > 0) !== (cur > 0) && Math.abs(prev) < 90 && Math.abs(cur) < 90) {
        var r = solve(lonFn, target, t, next, o.tolerance);
        iterations += r.iterations;
        if (r.bracketed && r.t != null) out.push({ t: r.t, residual: r.residual });
      }
      t = next; prev = cur;
      if (out.length > 12) break;
    }
    return { crossings: out, count: out.length, iterations: iterations,
      multiPass: out.length > 1 };
  }

  return { VERSION: VERSION, ARCSEC: ARCSEC, MAX_ITER: MAX_ITER,
    norm360: norm360, delta: delta,
    solve: solve, designMoment: designMoment, crossings: crossings };
}));
