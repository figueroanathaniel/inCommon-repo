#!/usr/bin/env node
'use strict';
const { calculator, source, separation, tOf } = require('./lib/lift-client-calculator.js');
const Astronomy = require('../app/astronomy-engine-2.1.19.min.js');
const fixture = require('./fixtures/client-chart-swiss-reference.json');
if ((source.match(/^  skyFrame\(/gm) || []).length !== 1 ||
    (source.match(/^  chartSkyFrame\(/gm) || []).length !== 1 ||
    /this\.skyFrame\(this\.t2000/.test(source)) throw Error('Canvas and astronomical frame methods collide');
const app = calculator(['RAD'], ['norm360', 'chartSkyFrame', 'ascendant', 'vertexOf', 'houseOf', 'sectOf', 'expandedLonAt'], { Astronomy });
app.signOf = lon => ({ sign: String(Math.floor(lon / 30)), deg: lon % 30, idx: Math.floor(lon / 30) });
app.t2000 = d => tOf(d.toISOString());
if (fixture.rows.length < 8) throw Error('Angle fixture lacks date coverage');
const worst = { asc: 0, mc: 0, vertex: 0 };
const at = {};
let count = 0, failures = 0, edgeChecks = 0, sectFailures = 0, lotChecks = 0;
for (const row of fixture.rows) {
  if (row.angles.length < 9) throw Error('Angle fixture lacks geographic coverage');
  for (const reference of row.angles) {
    app.natalDate = () => new Date(row.utc);
    app.activeProfile = () => ({ timedChart: true, birthLat: reference.latitude, birthLon: reference.longitude });
    const obtained = app.ascendant();
    const results = { asc: obtained.asc, mc: obtained.mc, vertex: app.vertexOf(tOf(row.utc)) };
    if (app.sectOf(row.solarLongitudeDeg, obtained) !== (reference.sunAltitudeDeg >= 0)) {
      sectFailures++;
      console.log('SECT FAIL: ' + row.utc + ' ' + reference.place);
    }
    for (const id of ['partOfFortune', 'partOfSpirit']) {
      const value = app.expandedLonAt({ id }, tOf(row.utc), {
        sun: row.solarLongitudeDeg, moon: row.lunarLongitudeDeg, asc: obtained,
        day: app.sectOf(row.solarLongitudeDeg, obtained),
      });
      if (separation(value.lon, reference[id]) * 3600 > 1) throw Error(id + ' disagrees with the selected sect rule at ' + row.utc + ' ' + reference.place);
      lotChecks++;
    }
    for (const key of Object.keys(worst)) {
      const error = separation(results[key], reference[key]) * 3600;
      if (error > worst[key]) { worst[key] = error; at[key] = row.utc + ' ' + reference.place; }
      if (error > 1) failures++;
    }
    // Equal-house cusp edges must agree with the public mathematical rule.
    // This is boundary arithmetic, separate from the independent angle check.
    for (let cusp = 0; cusp < 12; cusp++) {
      for (const delta of [-1e-6, 1e-6]) {
        const longitude = app.norm360(obtained.asc + cusp * 30 + delta);
        const expected = delta > 0 ? cusp + 1 : (cusp === 0 ? 12 : cusp);
        const got = app.houseOf(longitude, { lon: 0 }, obtained);
        if (got !== expected) throw Error('Equal-house cusp inconsistency at ' + row.utc);
        edgeChecks++;
      }
    }
    count++;
  }
}
// Exactly representable cusp values test half-open ownership without a
// floating-point representation of an observed angle changing the question.
for (const asc of [0, 15, 232.5]) for (let cusp = 0; cusp < 12; cusp++) {
  if (app.houseOf(app.norm360(asc + cusp * 30), {}, { asc }) !== cusp + 1) throw Error('Exact cusp ownership failed');
  edgeChecks++;
}
for (const key of Object.keys(worst)) console.log(`${key}: worst ${worst[key].toFixed(4)} arcsec at ${at[key]}`);
console.log(`${count} charts, ${edgeChecks} Equal House boundary checks, ${lotChecks} lot-formula checks using reference Sun/Moon; ${failures} angle comparisons above 1 arcsecond; ${sectFailures} day/night failures.`);
if (failures || sectFailures) process.exitCode = 1;
