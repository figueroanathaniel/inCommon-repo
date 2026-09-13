#!/usr/bin/env node
/* check-ephemeris-engine.js: runs ephemeris/engine.test.ts.
 *
 * engine.test.ts exports { runTests() } the same shape multiChart.test.js
 * and skyWire.test.js already do, and run-module-tests.js already knows
 * how to fold results in that shape into its own row list; this script
 * gives the ephemeris engine the same "run it on its own" path
 * check-point-registry.js gives the registry, for the same reason: not
 * every gate needs the full run-module-tests.js pass to be exercised.
 *
 * Usage: node tools/check-ephemeris-engine.js
 */
'use strict';

const path = require('path');

const repo = path.resolve(__dirname, '..');
const TEST_PATH = path.join(repo, 'app', 'ephemeris', 'engine.test.ts');

function die(m) { console.error('check-ephemeris-engine: ' + m); process.exit(1); }

let mod;
try {
  mod = require(TEST_PATH);
} catch (e) {
  die('engine.test.ts (or engine.ts) does not compile: ' + e.message);
}

const r = mod.runTests();
r.results.forEach(row => {
  console.log((row.pass ? '  ok   ' : '  FAIL ') + row.id + '  ' + row.name + (row.error ? '\n        ' + row.error : ''));
});

if (r.failed) {
  console.error('check-ephemeris-engine: ' + r.passed + '/' + (r.passed + r.failed) + ' passed');
  process.exit(1);
}

console.log('check-ephemeris-engine: ok');
console.log('  assertions          ' + r.passed);
