#!/usr/bin/env node
/* Client-chart acceptance gate for the two distinct Black Moon Lilith points.
 * Run independently: node tools/check-client-lilith.js
 * Swiss Ephemeris 2.10.03 reference, FLG_SWIEPH, tropical of date,
 * swe.calc_ut(JD_UT, MEAN_APOG / OSCU_APOG / MEAN_NODE, FLG_SWIEPH)[0][0].
 * The Swiss library is used only to generate the stored test vectors; it is
 * neither bundled nor required by this script. These vectors are different
 * instants, rather than repeats of the owner's birth-chart snapshot.
 * A failure means the current browser calculator is not approved for a
 * seconds-precise Lilith claim. Do not add this gate to a green release list
 * until its failed cases have been repaired and verified.
 */
'use strict';

const { calculator, separation, tOf } = require('./lib/lift-client-calculator.js');
const app = calculator(['LILITH_OSC_WHY'], ['norm360', 'lilithMeanOf', 'expandedLonAt'], { LunarMeanPoints: require('../app/lunar-mean-points.js'), JPLDerivedPoints: require('../app/jpl-derived-points.js') });
const cases = require('./fixtures/client-chart-swiss-reference.json').rows;
if (cases.length < 8) throw Error('Missing multi-date Lilith references');

const allowableArcsec = 1;
let badMean = 0;
let worstMean = 0;
let badOsculating = 0, unavailableOsculating = 0, meanLabelledOk = 0, badSelena = 0;
for (const row of cases) {
  const { utc: instant, meanLilithDeg: mean, osculatingLilithDeg: osc, meanLunarNorthNodeDeg: node } = row;
  const ctx = { sun: 0, moon: 0 };
  const obtained = app.expandedLonAt({ id: 'lilithMean' }, tOf(instant), ctx);
  const osculating = app.expandedLonAt({ id: 'lilithOsc' }, tOf(instant), ctx);
  const selena = app.expandedLonAt({ id: 'selena' }, tOf(instant), ctx);
  const error = separation(obtained.lon, mean) * 3600;
  const meanOscGap = separation(mean, osc);
  if (error > allowableArcsec) badMean++;
  if (separation(selena.lon, (mean + 180) % 360) * 3600 > allowableArcsec) badSelena++;
  if (error > allowableArcsec && obtained.status === 'ok') meanLabelledOk++;
  if (osculating.lon == null) unavailableOsculating++;
  else if (separation(osculating.lon, osc) * 3600 > allowableArcsec) badOsculating++;
  worstMean = Math.max(worstMean, error);
  console.log(`${instant} mean error ${error.toFixed(1)} arcsec; mean/osculating ${meanOscGap.toFixed(3)} degrees; mean node ${node.toFixed(6)} degrees`);
}
console.log(`Mean Lilith: ${badMean}/${cases.length} cases exceed ${allowableArcsec} arcsec; worst ${worstMean.toFixed(1)} arcsec.`);
console.log(`Osculating Lilith: ${unavailableOsculating} unavailable, ${badOsculating} outside tolerance, ${cases.length} reference instants.`);
console.log(`Selena (opposite mean apogee convention): ${badSelena}/${cases.length} outside tolerance.`);
if (meanLabelledOk) console.error('FAIL: live mean Lilith is labelled ok at a precision these vectors do not support.');
if (badMean || unavailableOsculating || badOsculating || badSelena) {
  console.error('NOT CLIENT-READY: Lilith variants need a date-general validated calculator and honest display precision.');
  process.exitCode = 1;
}
