#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ME = require('../app/minor-body-elements.js');
const H = require('../app/comet-hyakutake-jpl.js');
const ref = require('./fixtures/observatory-1994-reference.json');
const rows = fs.readFileSync(path.join(__dirname, '..', 'reports', 'observatory-1994-reconciled.tsv'), 'utf8')
  .trimEnd().split('\n').slice(1).map(line => line.split('\t'));
const byName = Object.fromEntries(rows.map(r => [r[1], r]));
const t = Date.parse(ref.epoch_utc) / 86400000 + 2440587.5 - 2451545;
const deltaSeconds = (a, b) => Math.abs((((a - b + 540) % 360) - 180) * 3600);
const asc = ref.swiss_angle_longitude_deg['Ascendant (AC)'];
const house = lon => Math.floor(((lon - asc + 360) % 360) / 30) + 1;
assert.strictEqual(rows.length, 97);
assert.strictEqual(rows.filter(r => r[3]).length, 97);
for (const name of ['quaoar', 'dejanira', 'karma', 'damocles']) {
  const title = name[0].toUpperCase() + name.slice(1);
  const error = deltaSeconds(ME.lon(name, t), ref.jpl_longitude_deg[title]);
  assert(error < (name === 'quaoar' ? 1 : 3), title + ' model: ' + error.toFixed(3) + '″');
}
assert(deltaSeconds(H.lon(t), ref.jpl_longitude_deg.Hyakutake) < 0.9);
assert.strictEqual(house(ref.jpl_longitude_deg.Karma), 3);
assert.strictEqual(house(ref.jpl_longitude_deg.Tyche), 6);
assert.strictEqual(house(ref.jpl_longitude_deg.Hyakutake), 12);
assert.strictEqual(house(ref.jpl_longitude_deg.Quaoar), 1);
assert.strictEqual(byName['Mars Node'][7], '6');
assert.strictEqual(byName['Mars Node'][8], 'Swiss heliocentric osculating ascending node');
assert.strictEqual(byName['Venus Node'][3], '16°37\'48" Gemini');
assert.strictEqual(byName['Venus Node'][7], '7');
assert.strictEqual(byName['North Node'][7], '1');
assert.strictEqual(byName['South Node'][7], '7');
assert.strictEqual(byName['Lilith (Osculating)'][7], '6');
assert.strictEqual(byName['Lilith (Osculating)'][8], 'Swiss osculating lunar apogee');
assert.strictEqual(byName['Zeus'][3], '0°14\'37" Libra');
assert.strictEqual(byName['Karma'][6], '2');
assert.strictEqual(byName['Karma'][7], '3');
assert(deltaSeconds(ref.derived_longitude_deg['Antivertex'], ref.derived_longitude_deg.Vertex + 180) < 1e-6);
assert(deltaSeconds(ref.swiss_lunar_point_longitude_deg.Selena,
  ref.swiss_lunar_point_longitude_deg['Lilith (Mean)'] + 180) < 1e-6);
assert.strictEqual(byName['Sun/Moon Midpoint'][7], '5');
assert.strictEqual(byName['Part of Fortune'][7], '10');
console.log('check-observatory-reconciliation: 97 defined rows, selected node conventions, corrected houses and natal JPL anchors');
