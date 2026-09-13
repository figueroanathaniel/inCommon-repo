#!/usr/bin/env node
/* check-harmonic.js: runs ephemeris/harmonic.test.ts.
 *
 * harmonic.test.ts exports { runTests() } the same shape multiChart.test.js
 * and engine.test.ts already do, and run-module-tests.js already knows how
 * to fold results in that shape into its own row list; this script gives
 * the harmonic recasting module the same "run it on its own" path
 * check-ephemeris-engine.js gives the ephemeris engine, for the same
 * reason: not every gate needs the full run-module-tests.js pass to be
 * exercised.
 *
 * Usage: node tools/check-harmonic.js
 */
'use strict';

const path = require('path');

const repo = path.resolve(__dirname, '..');
const TEST_PATH = path.join(repo, 'app', 'ephemeris', 'harmonic.test.ts');

function die(m) { console.error('check-harmonic: ' + m); process.exit(1); }

let mod;
try {
  mod = require(TEST_PATH);
} catch (e) {
  die('harmonic.test.ts (or harmonic.ts) does not compile: ' + e.message);
}

const r = mod.runTests();
r.results.forEach(row => {
  console.log((row.pass ? '  ok   ' : '  FAIL ') + row.id + '  ' + row.name + (row.error ? '\n        ' + row.error : ''));
});

if (r.failed) {
  console.error('check-harmonic: ' + r.passed + '/' + (r.passed + r.failed) + ' passed');
  process.exit(1);
}

console.log('check-harmonic: ok');
console.log('  assertions          ' + r.passed);
