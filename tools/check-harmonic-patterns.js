#!/usr/bin/env node
/* check-harmonic-patterns.js: runs aspects/harmonicPatterns.test.ts.
 *
 * harmonicPatterns.test.ts exports { runTests() } the same shape
 * multiChart.test.js and engine.test.ts already do, and run-module-tests.js
 * already knows how to fold results in that shape into its own row list;
 * this script gives the harmonic-pattern module the same "run it on its
 * own" path check-ephemeris-engine.js gives the ephemeris engine.
 *
 * Usage: node tools/check-harmonic-patterns.js
 */
'use strict';

const path = require('path');

const repo = path.resolve(__dirname, '..');
const TEST_PATH = path.join(repo, 'app', 'aspects', 'harmonicPatterns.test.ts');

function die(m) { console.error('check-harmonic-patterns: ' + m); process.exit(1); }

let mod;
try {
  mod = require(TEST_PATH);
} catch (e) {
  die('harmonicPatterns.test.ts (or harmonicPatterns.ts) does not compile: ' + e.message);
}

const r = mod.runTests();
r.results.forEach(row => {
  console.log((row.pass ? '  ok   ' : '  FAIL ') + row.id + '  ' + row.name + (row.error ? '\n        ' + row.error : ''));
});

if (r.failed) {
  console.error('check-harmonic-patterns: ' + r.passed + '/' + (r.passed + r.failed) + ' passed');
  process.exit(1);
}

console.log('check-harmonic-patterns: ok');
console.log('  assertions          ' + r.passed);
