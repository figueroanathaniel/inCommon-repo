#!/usr/bin/env node
/* Node runner for the pure half of the V1.2 suite.
 * Usage: node handoff/run-tests-node.js   (from the bundle root or handoff/)
 * Executes the SAME incommon-core.js + tests.js files the prototype and the
 * browser Test Runner use: no transforms. DOM integration tests (IT*) are
 * browser-only and reported "skipped" here; run "Test Runner V1.2.dc.html"
 * over a static server for those.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const here = __dirname;
const corePath = path.join(here, '..', 'app', 'incommon-core.js');
const testsPath = path.join(here, '..', 'app', 'handoff', 'tests.js');
const core = require(corePath);
const tests = require(testsPath);
const fixtures = JSON.parse(fs.readFileSync(path.join(here, '..', 'data-contracts', 'calculation-fixtures.json'), 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

tests.runPure(core, fixtures).then(assertions => {
  const pass = assertions.filter(a => a.pass).length;
  const fail = assertions.length - pass;
  const out = {
    suite: 'inCommon V1.2 verification tests (pure half, Node)',
    timestamp: new Date().toISOString(),
    environment: { node: process.version, platform: process.platform },
    sourceHashes: { 'incommon-core.js': sha(corePath), 'handoff/tests.js': sha(testsPath) },
    coreVersion: core.VERSION,
    totals: { total: assertions.length, pass, fail, skipped: tests.INTEGRATION_IDS.length },
    skipped: tests.INTEGRATION_IDS.map(id => ({ id, reason: 'browser-only DOM integration test, run Test Runner V1.2.dc.html' })),
    exitCode: fail ? 1 : 0,
    assertions
  };
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = out.exitCode;
}).catch(e => { console.error(e); process.exitCode = 1; });
