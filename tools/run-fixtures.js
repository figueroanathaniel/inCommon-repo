#!/usr/bin/env node
/* run-fixtures.js: the per-commit calculation gate.
 *
 * SCOPE, STATED PLAINLY. This is a fixtures-driven runner covering N1 to N6 and
 * A1 to A3, nine assertions, executed against the real app/incommon-core.js with
 * no transforms. It is NOT the V1.2 "43 pure assertions" suite: that suite lived
 * in handoff/tests.js, which is not in the handover, and nothing here reproduces
 * its coverage. Read a green result as "the numerology and angel-number vectors
 * in calculation-fixtures.json still hold", and nothing wider.
 *
 * DELIBERATELY NOT EXECUTED. calculation-fixtures.json also carries timezone,
 * lunar and astrology_referenceValues_DEMO_NOT_VERIFIED blocks. Its own meta
 * calls those reference targets that a licensed engine must reproduce, and the
 * astrology block says in its name that it is not verified. Turning them into
 * assertions here would manufacture green from values nothing computed, so they
 * are reported as declared-not-executed and counted separately.
 *
 * WHY BINDINGS ARE CODED PER ID. The fixtures record their inputs as working
 * notes for a human ("PY 1 + month 7"), not as machine arguments, so each id is
 * bound to the core call it exercises. The expected values are always read from
 * the fixture file, never restated here, so the fixture stays the source of
 * truth. A fixture with no binding is a FAILURE, not a skip: a runner that
 * quietly ignores what it does not recognise reports green having proved less
 * than it claims.
 *
 * Usage:  node verification/run-fixtures.js [--core <path>] [--fixtures <path>] [--quiet]
 * Exit:   0 all passed, 1 any failure or any structural problem.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const here = __dirname;
const corePath = path.resolve(arg('--core', path.join(here, '..', 'app', 'incommon-core.js')));
const fixturesPath = path.resolve(arg('--fixtures', path.join(here, '..', 'data-contracts', 'calculation-fixtures.json')));
const quiet = process.argv.indexOf('--quiet') !== -1;

for (const p of [corePath, fixturesPath]) {
  if (!fs.existsSync(p)) {
    console.error('run-fixtures: cannot find ' + p);
    process.exit(1);
  }
}

const core = require(corePath);
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const persona = (fixtures.meta && fixtures.meta.persona) || {};
const dob = String(persona.born || '').slice(0, 10);
const nameAtBirth = persona.nameAtBirth || '';

/* Each binding returns the actual value in the shape the fixture's `expected`
   uses: a number for the numerology rows, an object for the angel rows. */
const BINDINGS = {
  N1: f => core.lifePath(f.input).value,
  N2: f => {
    const year = Number((/(\d{4})/.exec(f.input) || [])[1]);
    if (!year) throw new Error('no four digit year in input "' + f.input + '"');
    return core.personalYear(dob, year).value;
  },
  N3: f => {
    const m = /PY\s*(\d+)\s*\+\s*month\s*(\d+)/i.exec(f.input);
    if (!m) throw new Error('cannot read personal year and month from "' + f.input + '"');
    return core.personalMonth(Number(m[1]), Number(m[2])).value;
  },
  N4: f => core.expression(f.input).value,
  N5: f => core.soulUrge(f.input).value,
  N6: f => core.reduce(Number(f.input)).value,
  A1: f => core.angelAnalyze(f.input),
  A2: f => core.angelAnalyze(f.input),
  A3: f => core.angelAnalyze(f.input)
};

/* Compare only the keys the fixture actually states. An angel fixture that
   declares { root, repeating } is not asked about `master`. */
function compare(expected, actual) {
  if (expected !== null && typeof expected === 'object') {
    const checked = {};
    let ok = true;
    for (const k of Object.keys(expected)) {
      checked[k] = actual ? actual[k] : undefined;
      if (checked[k] !== expected[k]) ok = false;
    }
    return { ok, actual: checked };
  }
  return { ok: actual === expected, actual };
}

const assertions = [];
const structural = [];

const blocks = [
  { key: 'numerology', prefix: 'N' },
  { key: 'angelNumbers', prefix: 'A' }
];

for (const block of blocks) {
  const rows = fixtures[block.key];
  if (!Array.isArray(rows) || rows.length === 0) {
    structural.push('fixture block "' + block.key + '" is missing or empty');
    continue;
  }
  for (const f of rows) {
    const bind = BINDINGS[f.id];
    if (!bind) {
      assertions.push({
        id: f.id, name: f.name || f.id, pass: false,
        expected: f.expected, actual: 'no binding in run-fixtures.js for this fixture id',
        work: f.work || null
      });
      continue;
    }
    let result;
    try {
      const actual = bind(f);
      result = compare(f.expected, actual);
    } catch (e) {
      result = { ok: false, actual: 'threw: ' + e.message };
    }
    assertions.push({
      id: f.id, name: f.name || f.id, pass: result.ok,
      expected: f.expected, actual: result.actual, work: f.work || null
    });
  }
}

/* Guards on the runner itself. If the fixture file shrinks, or a binding stops
   being reached, the total moves and that is a failure rather than a quieter
   green. The expected shape is six numerology rows and three angel rows. */
const EXPECTED_SHAPE = { numerology: 6, angelNumbers: 3, total: 9 };
const shape = {
  numerology: assertions.filter(a => a.id[0] === 'N').length,
  angelNumbers: assertions.filter(a => a.id[0] === 'A').length,
  total: assertions.length
};
for (const k of Object.keys(EXPECTED_SHAPE)) {
  if (shape[k] !== EXPECTED_SHAPE[k]) {
    structural.push('expected ' + EXPECTED_SHAPE[k] + ' ' + k + ' assertions, ran ' + shape[k]);
  }
}

const notExecuted = Object.keys(fixtures)
  .filter(k => ['meta', 'numerology', 'angelNumbers'].indexOf(k) === -1)
  .map(k => ({
    block: k,
    reason: 'declared in the fixtures as a reference target, not an executable vector'
  }));

const pass = assertions.filter(a => a.pass).length;
const fail = assertions.length - pass;
const exitCode = (fail || structural.length) ? 1 : 0;

const out = {
  suite: 'inCommon calculation gate (fixtures-driven runner, N1-N6 and A1-A3)',
  coverage: 'Nine assertions from calculation-fixtures.json, executed against incommon-core.js. This is not the V1.2 43-assertion pure suite, which is not in the handover.',
  timestamp: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform },
  sourceHashes: {
    'incommon-core.js': sha(corePath),
    'calculation-fixtures.json': sha(fixturesPath)
  },
  coreVersion: core.VERSION,
  persona: { nameAtBirth, dob },
  shape,
  totals: { total: assertions.length, pass, fail },
  structuralProblems: structural,
  notExecuted,
  exitCode,
  assertions
};

if (quiet) {
  console.log(
    out.suite + ': ' + pass + '/' + assertions.length + ' passed' +
    (structural.length ? ', ' + structural.length + ' structural problem(s)' : '')
  );
  assertions.filter(a => !a.pass).forEach(a => {
    console.log('  FAIL ' + a.id + ' ' + a.name +
      '\n    expected ' + JSON.stringify(a.expected) +
      '\n    actual   ' + JSON.stringify(a.actual));
  });
  structural.forEach(s => console.log('  STRUCTURAL ' + s));
} else {
  console.log(JSON.stringify(out, null, 2));
}

process.exitCode = exitCode;
