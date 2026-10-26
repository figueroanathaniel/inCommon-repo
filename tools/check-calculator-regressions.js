#!/usr/bin/env node
/* Regression checks for the independently mergeable calculator repairs.
 * This is not the complete client precision acceptance suite (draft PR #86).
 * --json <path> saves per-check output for CI review, even when the gate fails.
 */
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const checks = [
  ['Primary bodies and module-load safeguards', 'check-astral-bodies.js'],
  ['Minor bodies and defined hypothetical orbits', 'check-minor-body-elements.js'],
  ['Hyakutake integrated reference interpolation', 'check-hyakutake-jpl.js'],
  ['Angles, geographic coverage, sect and house edges', 'check-client-angles.js'],
  ['Timezone and shared-module regressions', 'run-module-tests.js', '--quiet'],
  ['Dated manifest reconciliation', 'check-observatory-reconciliation.js'],
  ['Minor-body sign/gate/line boundary audit', 'audit-client-boundaries.js'],
];
const results = [];
for (const [name, script, ...args] of checks) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024,
  });
  const pass = r.status === 0 && !r.error;
  const informational = script === 'audit-client-boundaries.js';
  const output = (r.stdout || '') + (r.stderr || '') + (r.error ? '\n' + r.error.message : '');
  results.push({ name, script, pass, informational, exitCode: r.status, output });
  console.log(`${pass ? (informational ? 'INFO' : 'PASS') : 'FAIL'} ${name}`);
  if (!pass) process.stdout.write(output);
}
const jsonIndex = process.argv.indexOf('--json');
if (jsonIndex !== -1) {
  if (!process.argv[jsonIndex + 1]) throw Error('--json requires an output filename');
  const filename = path.resolve(process.argv[jsonIndex + 1]);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  fs.writeFileSync(filename, JSON.stringify({ revision, generatedUtc: new Date().toISOString(), results }, null, 2) + '\n');
}
const failed = results.filter(x => !x.pass).length;
const gates = results.filter(x => !x.informational);
console.log(`${gates.filter(x => x.pass).length}/${gates.length} regression gates pass; boundary audit retained separately. ${failed ? 'Regression checks failed.' : 'Mergeable regression subset passes. Full client precision acceptance remains blocked by Lilith, nodes and static comets; see draft PR #86.'}`);
if (failed) process.exitCode = 1;
