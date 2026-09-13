#!/usr/bin/env node
/* check-registry-integration.js: runs ephemeris/integration.test.ts.
 *
 * Named for what the file actually tests now rather than kept as
 * "integration": the registry (pointRegistry.ts) and the computation
 * layer (engine.ts) agreeing with each other end to end - registry
 * counts, SYMBOLISM coverage, and a full computeAll() pass over all 97
 * points. integration.test.ts exports { runTests() } the same shape
 * multiChart.test.js and engine.test.ts already do, and
 * run-module-tests.js already knows how to fold results in that shape
 * into its own row list; this script gives it the same "run it on its
 * own" path check-ephemeris-engine.js gives the ephemeris engine.
 *
 * Usage: node tools/check-registry-integration.js
 */
'use strict';

const path = require('path');

const repo = path.resolve(__dirname, '..');
const TEST_PATH = path.join(repo, 'app', 'ephemeris', 'integration.test.ts');

function die(m) { console.error('check-registry-integration: ' + m); process.exit(1); }

let mod;
try {
  mod = require(TEST_PATH);
} catch (e) {
  die('integration.test.ts (or pointRegistry.ts / engine.ts) does not compile: ' + e.message);
}

const r = mod.runTests();
r.results.forEach(row => {
  console.log((row.pass ? '  ok   ' : '  FAIL ') + row.id + '  ' + row.name + (row.error ? '\n        ' + row.error : ''));
});

if (r.failed) {
  console.error('check-registry-integration: ' + r.passed + '/' + (r.passed + r.failed) + ' passed');
  process.exit(1);
}

console.log('check-registry-integration: ok');
console.log('  assertions          ' + r.passed);
