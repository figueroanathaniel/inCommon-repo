#!/usr/bin/env node
/* Client acceptance audit for calculated points outside the Lilith gate.
 * References: tools/fixtures/client-chart-swiss-reference.json and the JPL
 * Horizons birth snapshot. This intentionally exits nonzero on known gaps.
 * It extracts the actual class methods used in the browser, and does not
 * count the dated reconciliation as a working date-general implementation.
 */
'use strict';

const { calculator, source: src, separation: sep, tOf } = require('./lib/lift-client-calculator.js');
const app = calculator(['RAD', 'EARTH_EL', 'PLANET_NODE', 'COMET_ELEMENTS'],
  ['norm360', 'planetaryNodeOf', 'meanMotionOf', 'solveKeplerE', 'trueAnomalyOf', 'helioOf', 'cometLonOf', 'expandedLonAt']);
const livePoint = (id, t) => app.expandedLonAt({ id }, t, { sun: 0, moon: 0 }).lon;
const ref = require('./fixtures/client-chart-swiss-reference.json');
const natal = require('./fixtures/observatory-1994-reference.json');
if (ref.rows.length < 8) throw Error('Missing multi-date reference coverage');
const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const nodalCeilingArcsec = 1;
let failures = 0, worst = { name: '', error: 0 };
const natalRow = ref.rows.find(row => row.utc === natal.epoch_utc);
if (!natalRow) throw Error('Node fixture is missing the natal cross-check');
const asc = 232.66274023598433;
const house = lon => 1 + Math.floor(((lon - asc + 720) % 360) / 30);
const sign = lon => Math.floor((((lon % 360) + 360) % 360) / 30);
for (const name of planets) {
  let max = 0, at = '';
  for (const row of ref.rows) {
    const error = sep(livePoint(name.toLowerCase() + 'Node', tOf(row.utc)), row.heliocentricOsculatingAscendingNodeDeg[name]) * 3600;
    if (error > max) { max = error; at = row.utc; }
  }
  if (max > nodalCeilingArcsec) failures++;
  if (max > worst.error) worst = { name, error: max };
  console.log(`${name.padEnd(8)} planetary node: worst ${max.toFixed(1)} arcsec at ${at} ${max <= nodalCeilingArcsec ? 'PASS' : 'FAIL'}`);
  const obtained = livePoint(name.toLowerCase() + 'Node', tOf(natal.epoch_utc));
  const expected = natalRow.heliocentricOsculatingAscendingNodeDeg[name];
  if (sign(obtained) !== sign(expected) || house(obtained) !== house(expected)) {
    console.log(`  NATAL BOUNDARY: live sign ${sign(obtained) + 1}/house ${house(obtained)}; reference sign ${sign(expected) + 1}/house ${house(expected)}`);
  }
}
// The manifest names a mean lunar node. Check the actual core longitude
// expression instead of accepting the 1994 reference as runtime behavior.
for (const label of ['North Node', 'South Node']) {
  const nodeFormula = src.match(new RegExp("if \\(name === '" + label + "'\\) return (this\\.norm360\\([^;]+\\));"));
  if (!nodeFormula) throw Error('Live ' + label + ' formula changed; audit its convention');
  const nodeOf = new Function('t', 'return ' + nodeFormula[1]);
  let nodeWorst = 0;
  for (const row of ref.rows) {
    const reference = app.norm360(row.meanLunarNorthNodeDeg + (label === 'South Node' ? 180 : 0));
    nodeWorst = Math.max(nodeWorst, sep(nodeOf.call(app, tOf(row.utc)), reference) * 3600);
  }
  if (nodeWorst > nodalCeilingArcsec) failures++;
  console.log(`Mean lunar ${label}: worst ${nodeWorst.toFixed(1)} arcsec ${nodeWorst <= nodalCeilingArcsec ? 'PASS' : 'FAIL'}`);
}

// These two named comets still route to one static two-body orbit apiece.
// Check the actual solver against the independent 1994 Horizons reference.
// A single instant cannot establish a multi-year uncertainty bound.
const jpl = natal.jpl_longitude_deg;
if (!jpl) throw Error('The JPL reference shape changed; inspect snapshot');
for (const [id, label] of [['halley', "Halley's Comet"], ['halebopp', 'Hale-Bopp']]) {
  const expected = jpl[label];
  if (!Number.isFinite(expected)) throw Error('Missing dated JPL reference for ' + label);
  const error = sep(livePoint(id, tOf('1994-02-17T05:37:00Z')), expected);
  if (error > 1 / 3600) failures++;
  console.log(`${label}: 1994 JPL error ${error.toFixed(4)} degrees (${(error * 60).toFixed(1)} arcminutes) ${error <= 1 / 3600 ? 'PASS' : 'FAIL'}`);
}
// Astronomy Engine's load guard and bad-fallback negative control are tested
// by check-astral-bodies.js. Do not call its guarded startup a silent failure.
console.log(`Largest sampled planetary-node error: ${worst.name} ${worst.error.toFixed(1)} arcsec.`);
if (failures) {
  console.error(`NOT CLIENT-READY: ${failures} reference comparisons exceed one arcsecond; inspect chart boundaries and replace approximations before claiming precision.`);
  process.exitCode = 1;
}
