#!/usr/bin/env node
/* Reconcile the submitted Observatory snapshot against dated reference
 * longitudes. This fixture is specific to 1994-02-17 05:37 UTC. Do not use
 * it as an ephemeris for another birth instant or extrapolate its coordinates.
 * Reference longitudes are rounded for display only after house assignment. */
'use strict';

const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..');
const input = path.join(__dirname, 'fixtures', 'submitted-observatory-manifest.tsv');
const reference = require('./fixtures/observatory-1994-reference.json');
const output = path.join(repo, 'reports', 'observatory-1994-reconciled.tsv');
const signs = 'Aries Taurus Gemini Cancer Leo Virgo Libra Scorpio Sagittarius Capricorn Aquarius Pisces'.split(' ');
const asc = reference.swiss_angle_longitude_deg['Ascendant (AC)'];
const norm = x => ((x % 360) + 360) % 360;
const signed = x => norm(x + 180) - 180;
function parse(s) {
  const m = /^(\d+)°(\d+)'(\d+)" (\w+)$/.exec(s);
  if (!m || !signs.includes(m[4])) return null;
  return signs.indexOf(m[4]) * 30 + Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
}
function format(lon) {
  const sec = Math.round(norm(lon) * 3600) % (360 * 3600);
  const sign = Math.floor(sec / 108000);
  const within = sec % 108000;
  return Math.floor(within / 3600) + '°' + String(Math.floor(within % 3600 / 60)).padStart(2, '0') +
    "'" + String(within % 60).padStart(2, '0') + '" ' + signs[sign];
}
const houseOf = lon => Math.floor(norm(lon - asc) / 30) + 1;
const source = name => name in reference.jpl_longitude_deg ? ['JPL Horizons', reference.jpl_longitude_deg[name]]
  : name in reference.swiss_fictitious_longitude_deg ? ['Swiss hypothetical definition', reference.swiss_fictitious_longitude_deg[name]]
  : name in reference.swiss_angle_longitude_deg ? ['Swiss angle geometry', reference.swiss_angle_longitude_deg[name]]
  : name in reference.derived_longitude_deg ? ['defined mathematical point', reference.derived_longitude_deg[name]]
  : name in reference.swiss_lunar_point_longitude_deg ? ['Swiss mean lunar apogee convention', reference.swiss_lunar_point_longitude_deg[name]]
  : name in reference.swiss_heliocentric_osculating_planetary_node_deg ?
    ['Swiss heliocentric osculating ascending node', reference.swiss_heliocentric_osculating_planetary_node_deg[name]]
  : name in reference.swiss_mean_lunar_node_deg ? ['Swiss mean lunar node', reference.swiss_mean_lunar_node_deg[name]]
  : name in reference.swiss_osculating_lunar_apogee_deg ?
    ['Swiss osculating lunar apogee', reference.swiss_osculating_lunar_apogee_deg[name]]
  : ['not independently verified', null];

const lines = fs.readFileSync(input, 'utf8').trimEnd().split(/\r?\n/);
const header = lines.shift();
if (header !== 'category\tname\tlongitude\thouse') throw Error('submitted manifest columns changed');
const rows = lines.map(line => {
  const [category, name, submitted, oldHouse] = line.split('\t');
  const [provenance, lon] = source(name);
  const before = parse(submitted);
  const isAngle = category === 'Angle';
  const newHouse = lon == null || isAngle ? '' : String(houseOf(lon));
  const oldLabel = /^\d+$/.test(oldHouse) ? oldHouse : '';
  const printedHouse = before == null || isAngle ? '' : String(houseOf(before));
  return [category, name, submitted, lon == null ? '' : format(lon),
    lon == null ? '' : lon.toFixed(7), oldHouse, printedHouse, newHouse, provenance,
    lon == null || before == null ? '' : (signed(before - lon) * 3600).toFixed(2),
    newHouse ? (newHouse === oldLabel ? 'matches' : 'corrected') : 'unverified',
    printedHouse && oldLabel !== printedHouse ? 'inconsistent' : 'matches'];
});
if (rows.length !== 97) throw Error('expected 97 source rows, found ' + rows.length);
const corrected = rows.filter(r => r[10] === 'corrected');
const tsv = [
  'category\tname\tsubmitted_longitude\treference_longitude\treference_decimal_deg\tsubmitted_house\thouse_from_submitted_longitude\tequal_house_from_reference\tprovenance\tmanifest_minus_reference_arcsec\tlabel_vs_reference\tlabel_vs_submitted',
  ...rows.map(r => r.join('\t'))
].join('\n') + '\n';
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, tsv);
console.log('Reconciled ' + rows.length + ' rows: ' + rows.filter(r => r[3]).length +
  ' dated/defined coordinates, ' + rows.filter(r => !r[3]).length + ' still unverified.');
console.log('Equal House label corrections: ' + corrected.map(r => r[1] + ' ' + r[5] + '→' + r[7]).join(', '));
console.log('Submitted-position conflicts: ' + rows.filter(r => r[11] === 'inconsistent')
  .map(r => r[1] + ' printed ' + r[6] + ', labeled ' + r[5]).join(', '));
