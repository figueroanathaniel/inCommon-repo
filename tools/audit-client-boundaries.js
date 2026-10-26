#!/usr/bin/env node
/* Rank the minor-body model and count actual sign/HD partition disagreements
 * against its sampled reference fixture. Passing the model's regression gate
 * is not a promise that every sign, gate or line is identical to an ephemeris.
 * These references were used in model fitting; they are not held-out data.
 */
'use strict';
const M = require('../app/minor-body-elements.js');
const H = require('../app/hd-wheel.js');
const fixture = require('./fixtures/minor-bodies-horizons.json');
const { separation } = require('./lib/lift-client-calculator.js');
const ranked = [];
let total = 0;
for (const id of M.ids()) {
  const refs = fixture.horizons[id] || fixture.swiss[id];
  if (!refs || refs.length < 400) throw Error('Missing boundary references: ' + id);
  const row = { id, worstArcmin: 0, signChanges: 0, gateChanges: 0, lineChanges: 0, count: refs.length };
  for (const [t, reference] of refs) {
    const obtained = M.lon(id, t);
    row.worstArcmin = Math.max(row.worstArcmin, separation(obtained, reference) * 60);
    if (Math.floor(obtained / 30) !== Math.floor(reference / 30)) row.signChanges++;
    const a = H.gateLine(obtained), b = H.gateLine(reference);
    if (a.gate !== b.gate) row.gateChanges++;
    if (a.gate !== b.gate || a.line !== b.line) row.lineChanges++;
    total++;
  }
  ranked.push(row);
}
ranked.sort((a, b) => b.worstArcmin - a.worstArcmin);
console.log('id             max arcmin   sign differences   gate differences   gate/line differences');
for (const r of ranked) {
  if (ranked.indexOf(r) < 12 || r.signChanges || r.gateChanges || r.lineChanges) {
    console.log(`${r.id.padEnd(14)} ${r.worstArcmin.toFixed(3).padStart(10)} ${String(r.signChanges).padStart(18)} ${String(r.gateChanges).padStart(18)} ${String(r.lineChanges).padStart(23)}`);
  }
}
const sums = ranked.reduce((s, r) => [s[0] + r.signChanges, s[1] + r.gateChanges, s[2] + r.lineChanges], [0, 0, 0]);
console.log(`${total} sampled positions: ${sums[0]} sign, ${sums[1]} gate, ${sums[2]} gate/line differences.`);
console.log('Boundary audit is descriptive; it does not certify unsampled times or block an acknowledged approximate model.');
