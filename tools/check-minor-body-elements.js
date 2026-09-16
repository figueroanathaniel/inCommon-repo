#!/usr/bin/env node
/* check-minor-body-elements.js: the expanded chart's fetched bodies are where
 * they say they are, as closely as they say.
 *
 * WHAT IT ASSERTS.
 *   1. Every body the fetcher names is in app/minor-body-elements.js, and
 *      nothing is in the module that the fetcher does not name.
 *   2. Every body's recorded worst case is still true: its longitude is
 *      recomputed at every reference instant (JPL Horizons apparent positions
 *      for the real bodies, the Swiss Ephemeris for the hypotheticals) and the
 *      largest miss may not exceed the recorded `w`. A worst case that has
 *      stopped being true is a Sabian symbol the app is printing on a number
 *      that cannot hold it.
 *   3. No worst case is over CEILING_DEG, which is the figure the app lets
 *      decide whether a body may name a degree. A body over it would still
 *      draw, but it would be drawing a precision it has not earned.
 *   4. A real body returns null outside its measured span rather than
 *      extrapolating, and a hypothetical has no span.
 *   5. Every registry id in the app is accounted for: computed by the app's
 *      own formulas, supplied by this module, or declared unavailable here
 *      with a reason. A new registry entry cannot arrive and silently read
 *      "n/a: no ephemeris" again.
 *
 * It refuses to report green on a walk it cannot trust: fewer references than
 * the fixtures should hold, or a registry it cannot find.
 *
 * Usage: node tools/check-minor-body-elements.js [--verbose]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const verbose = process.argv.indexOf('--verbose') !== -1;
const fail = [];
function die(m) { console.error('check-minor-body-elements: ' + m); process.exit(1); }

const CEILING_DEG = 0.2;
/* Computed inside the app itself, not by this module. */
const APP_COMPUTED = ['chiron', 'ceres', 'pallas', 'juno', 'vesta', 'lilithMean', 'selena',
  'mercuryNode', 'venusNode', 'marsNode', 'jupiterNode', 'saturnNode', 'uranusNode', 'neptuneNode', 'plutoNode',
  'ariesPoint', 'halley', 'halebopp', 'hyakutake', 'vertex', 'antivertex', 'partOfSpirit', 'sunmoonMidpoint'];
/* Declared absent, each with the reason the page gives. */
const UNAVAILABLE = {
  lilithOsc: 'the osculating apogee moves up to thirty degrees either side of the mean within a month, and needs a lunar theory this build does not carry'
};

const ME = require(path.join(repo, 'app', 'minor-body-elements.js'));
const { BODIES, HYPOTHETICALS } = require('./fetch-minor-body-elements.js');
const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'minor-bodies-horizons.json'), 'utf8'));

/* 1: the two lists agree */
const expected = Object.keys(BODIES).concat(Object.keys(HYPOTHETICALS)).sort();
const have = ME.ids().slice().sort();
if (JSON.stringify(expected) !== JSON.stringify(have)) {
  fail.push('module ids differ from the fetcher: missing ' + expected.filter(x => have.indexOf(x) === -1).join(', ') +
    '; extra ' + have.filter(x => expected.indexOf(x) === -1).join(', '));
}

/* 2 and 3: the worst cases */
let compared = 0;
for (const id of have) {
  const refs = (HYPOTHETICALS[id] ? FIX.swiss : FIX.horizons)[id];
  if (!refs || refs.length < 400) { fail.push(id + ': ' + (refs ? refs.length : 0) + ' references, expected 400 or more'); continue; }
  let worst = 0, at = null;
  for (const [t, lon] of refs) {
    const got = ME.lon(id, t);
    if (got == null) { fail.push(id + ': null at t=' + t + ', inside the span it was measured over'); break; }
    let d = Math.abs(got - lon); if (d > 180) d = 360 - d;
    if (d > worst) { worst = d; at = t; }
    compared++;
  }
  const rec = ME.worstDeg(id);
  if (worst > rec + 0.0005) fail.push(id + ': worst case ' + worst.toFixed(4) + ' deg at t=' + at + ' exceeds the recorded ' + rec);
  if (rec > CEILING_DEG) fail.push(id + ': recorded worst case ' + rec + ' is over the ' + CEILING_DEG + ' deg ceiling');
  if (verbose) console.log('  ' + id.padEnd(14) + 'worst ' + worst.toFixed(4) + '  recorded ' + rec);
}
if (compared < 50 * 400) fail.push('only ' + compared + ' positions compared; the fixtures are not being read');

/* 4: spans */
for (const id of Object.keys(BODIES)) {
  const sp = ME.span(id);
  if (!sp) { fail.push(id + ': a real body with no measured span'); continue; }
  if (ME.lon(id, sp[0] - 1) !== null || ME.lon(id, sp[1] + 1) !== null) fail.push(id + ': returns a position outside its measured span');
}
for (const id of Object.keys(HYPOTHETICALS)) {
  if (ME.span(id) !== null) fail.push(id + ': a hypothetical carries a span');
  if (ME.lon(id, -80000) == null) fail.push(id + ': a hypothetical refused an instant');
}
if (ME.lon('nobody', 0) !== null) fail.push('an unknown id returned a position');

/* 5: the registry is accounted for */
const app = fs.readFileSync(path.join(repo, 'app', 'inCommonApp v2.dc.html'), 'utf8');
const reg = app.slice(app.indexOf('  EXPANDED_REGISTRY = ['), app.indexOf('  RING1_IDS = '));
const ids = [];
reg.replace(/\{ id: '([A-Za-z0-9_]+)'/g, (m, id) => { ids.push(id); return m; });
if (ids.length !== 80) fail.push('found ' + ids.length + ' registry ids in the app, expected 80');
for (const id of ids) {
  const n = [APP_COMPUTED.indexOf(id) !== -1, ME.has(id), !!UNAVAILABLE[id]].filter(Boolean).length;
  if (n !== 1) fail.push(id + ': accounted for ' + n + ' times (app formula, this module, declared unavailable)');
}
if (app.indexOf('<script src="./minor-body-elements.js"></script>') === -1) fail.push('the app does not load minor-body-elements.js');
for (const [id, why] of Object.entries(UNAVAILABLE)) {
  if (app.indexOf(why) === -1) fail.push(id + ': the app does not give the declared reason for its absence');
}

if (fail.length) {
  fail.forEach(f => console.error('  FAIL ' + f));
  die(fail.length + ' failure' + (fail.length === 1 ? '' : 's'));
}
console.log('check-minor-body-elements: ' + have.length + ' bodies, ' + compared + ' positions within their recorded worst case, ' +
  ids.length + ' registry ids accounted for');
