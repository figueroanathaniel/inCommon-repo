/*! hd-wheel.js: longitude to gate and line. V1.0.0 (UMD)
 *
 * THE ARITHMETIC IS TRIVIAL AND THE BOUNDARIES ARE NOT. A gate is 360/64 =
 * 5.625 degrees and a line is 5.625/6 = 0.9375 degrees, so the mapping is two
 * divisions. What matters is what happens at the edges, because a birth a
 * thousandth of a degree either side of a boundary gets a different gate, and
 * neither answer looks wrong on screen.
 *
 * THE TIE BREAK, STATED ONCE: a boundary belongs to the gate and line that
 * BEGIN there. Gate 41 begins at 302 degrees exactly, so 302.0 is gate 41 line
 * 1, and 301.999999 is the last line of the gate before it. Half open
 * intervals, [start, end), all the way round. This is a decision rather than a
 * discovery: the tradition does not settle it, floating point cannot represent
 * most boundaries exactly anyway, and what a build owes its reader is that the
 * same longitude always gives the same answer.
 *
 * WHY THE WHEEL STARTS AT 302. The gate order is not the numeric order: the
 * sequence runs 41, 19, 13, 49 and so on, and gate 41 opens at 2 degrees of
 * Aquarius, which is 302 degrees of ecliptic longitude. That offset and that
 * order are the whole of the mapping, and they are data rather than code, which
 * is why they live in one table that a test can read.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.HDWheel = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  var START = 302;            // ecliptic longitude where gate 41 begins
  var GATE_DEG = 360 / 64;    // 5.625
  var LINE_DEG = GATE_DEG / 6; // 0.9375

  /* The wheel order, from gate 41 forward. Sixty four entries, each appearing
     once, which is what row W2 checks: a duplicate here would silently give two
     longitudes the same gate and lose another entirely. */
  var WHEEL = [41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23,
    8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46,
    18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60];

  function norm360(x) { return ((x % 360) + 360) % 360; }

  function gateLine(lon) {
    var off = norm360(lon - START);
    /* The clamps are for floating point alone: norm360 can return a value that
       is 360 minus an epsilon, and floor of that over 5.625 is 63, but a value
       that rounds up at the last bit would index past the table. They are not
       the tie break, and they are not doing rounding work. */
    var i = Math.floor(off / GATE_DEG);
    if (i > 63) i = 63; else if (i < 0) i = 0;
    var within = off - i * GATE_DEG;
    var line = Math.floor(within / LINE_DEG) + 1;
    if (line > 6) line = 6; else if (line < 1) line = 1;
    return { gate: WHEEL[i], line: line, index: i,
      degreeInGate: within, gateStart: norm360(START + i * GATE_DEG) };
  }

  /* Where a gate begins, which is what a boundary test needs in order to ask
     the question from the other direction. */
  function gateStart(gate) {
    var i = WHEEL.indexOf(gate);
    return i === -1 ? null : norm360(START + i * GATE_DEG);
  }

  return { VERSION: VERSION, START: START, GATE_DEG: GATE_DEG, LINE_DEG: LINE_DEG,
    WHEEL: WHEEL, norm360: norm360, gateLine: gateLine, gateStart: gateStart };
}));
