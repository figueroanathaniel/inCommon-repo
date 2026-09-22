#!/usr/bin/env node
/*! tools/drift-check.js: re-verify deploy/v6.3/ against a recorded baseline,
 *  and only spend a browser run when the bundle has actually moved.
 *
 * WHY THIS EXISTS. Seven of the suite's eight phases (M, E, F, G, T, R, N)
 * are deterministic: DOM structure, getComputedStyle, Canvas2D readback.
 * Run one twice against byte-identical bundle content and it reports the
 * same pass count twice, by construction. Re-running on request with
 * nothing upstream having changed burns real time for zero new
 * information. This script makes "has anything changed" a cheap first
 * question, one git fetch and two sha256sums, and only pays for the full
 * sweep when the answer is yes.
 *
 * H is the one exception and is NOT gated by the hash check: it measures
 * an actual render under a GPU-less container's SwiftShader fallback, and
 * has shown real run-to-run variance in elapsed time and in H2b's lit
 * percentage, always inside the documented healthy band. A repeat H run
 * is genuine new data about that variance even when the bundle hasn't
 * moved. Pass --with-h to include it; it is excluded by default because
 * it can run past ten minutes on this class of machine.
 *
 * THE BASELINE IS GENERATED, NEVER TYPED. tools/fixtures/
 * drift-check-baseline.json holds the two hashes this script trusts. It
 * is written only by --record-baseline, deliberately: a hash baseline
 * that could drift out from under a silent write is the exact fault
 * hd-topology.js and check-minor-body-elements.js were built to avoid
 * elsewhere in this repo. Record a new baseline after a real rebuild is
 * confirmed intentional, never to silence a failing check.
 *
 * THIS TOOL IS DIFFERENT IN KIND FROM EVERY OTHER SCRIPT IN tools/. It is
 * the only one that drives a real browser, and it needs Playwright and a
 * Chromium binary that this repo does not install (no package.json, no
 * node_modules, matching the rest of this project's tooling). Where it
 * cannot find either, it says so plainly and exits, rather than a raw
 * module-not-found stack trace.
 *
 * NOTHING IN app/ OR deploy/ IS EVER WRITTEN. Every phase is graded by
 * intercepting the verification runner's own network requests and
 * answering them with the real deploy/v6.3/ bytes read off disk. H
 * additionally serves a version of the H runner file with its internal
 * 180s budget raised, again served only, never written to disk.
 *
 * Usage:
 *   node tools/drift-check.js                    # hash check; sweep only if changed
 *   node tools/drift-check.js --force             # run the sweep regardless of hash
 *   node tools/drift-check.js --with-h             # sweep + one H run, if the sweep runs
 *   node tools/drift-check.js --record-baseline    # after a green --force, write the baseline
 */
'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const BUNDLE = path.join(REPO, 'deploy/v6.3');
const APP_HTML = path.join(BUNDLE, 'app.html');
const INDEX_HTML = path.join(BUNDLE, 'index.html');
const BASELINE_PATH = path.join(REPO, 'tools/fixtures/drift-check-baseline.json');
const ORIGIN = 'http://127.0.0.1:8099';

const TRACKED = {
  'deploy/v6.3/app.html': APP_HTML,
  'deploy/v6.3/index.html': INDEX_HTML
};

const PHASES = [
  { tag: 'M', file: 'Verification M - acceptance matrix.dc.html', expect: 90 },
  { tag: 'E', file: 'Verification E - breakpoint crossing.dc.html', expect: 5 },
  { tag: 'F', file: 'Verification F - functional sweep.dc.html', expect: 16 },
  { tag: 'G', file: 'Verification G - ada phase.dc.html', expect: 33 },
  { tag: 'T', file: 'Verification T - theme phase.dc.html', expect: 64 },
  { tag: 'R', file: 'Verification R - removal phase.dc.html', expect: 14 },
  { tag: 'N', file: 'Verification N - new surfaces.dc.html', expect: 58 }
];

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const WITH_H = args.includes('--with-h');
const RECORD = args.includes('--record-baseline');

const t0 = Date.now();
const el = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(7) + 's';
const log = (...a) => console.log(el(), ...a);

function sh(cmd) {
  return execSync(cmd, { cwd: REPO, encoding: 'utf8' }).trim();
}

function sha256(p) {
  return execSync(`sha256sum "${p}"`, { encoding: 'utf8' }).split(/\s+/)[0];
}

/* Playwright and its bundled Chromium are not repo dependencies here (this
   project runs no package manager at all), so a plain checkout may not have
   either. Try normal module resolution first, so this keeps working if
   Playwright is ever added as a devDependency; fall back to the path this
   container's global install actually uses; fail with a plain sentence
   otherwise, never a raw stack trace. */
function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error(
    'drift-check needs Playwright, which is not installed on this machine.\n' +
    'This repo installs no dependencies at all (no package.json), so that is\n' +
    'expected outside a container that already has Playwright globally\n' +
    'available. Install it (npm install -g playwright, then\n' +
    'npx playwright install chromium) to run this tool, or run the\n' +
    'verification suite by hand in a real browser instead.'
  );
  process.exit(3);
}

function findChromium() {
  const { chromium } = loadPlaywright();
  const candidates = [
    process.env.DRIFT_CHECK_CHROMIUM,
    (() => { try { return chromium.executablePath(); } catch (e) { return null; } })(),
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  ].filter(Boolean);
  for (const c of candidates) { if (fs.existsSync(c)) return { chromium, path: c }; }
  console.error(
    'drift-check found the Playwright module but no Chromium binary at any\n' +
    'of the paths it knows to check. Set DRIFT_CHECK_CHROMIUM to the real\n' +
    'path, or run: npx playwright install chromium'
  );
  process.exit(3);
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')); }
  catch (e) { return null; }
}

function writeBaseline(hashes) {
  const out = {
    'deploy/v6.3/app.html': hashes['deploy/v6.3/app.html'],
    'deploy/v6.3/index.html': hashes['deploy/v6.3/index.html'],
    recordedAt: new Date().toISOString(),
    recordedBy: 'a full drift-check sweep that passed all green (M/E/F/G/T/R/N)'
  };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(out, null, 2) + '\n');
  return out;
}

async function ensureServer() {
  try {
    const r = await fetch(ORIGIN + '/verification/', { method: 'HEAD' }).catch(() => null);
    if (r) return;
  } catch (e) {}
  log('starting http-server on :8099');
  const child = spawn('npx', ['--yes', 'http-server', '.', '-p', '8099', '-c-1', '--silent'],
    { cwd: REPO, detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const r2 = await fetch(ORIGIN + '/verification/', { method: 'HEAD' });
      if (r2) return;
    } catch (e) {}
  }
  throw new Error('http-server did not come up on :8099');
}

async function gradeDeterministic(browser, phase) {
  const url = ORIGIN + '/verification/' + encodeURIComponent(phase.file);
  const bundleBytes = fs.readFileSync(APP_HTML, 'utf8');
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/inCommonApp*', r =>
    r.fulfill({ status: 200, contentType: 'text/html', body: bundleBytes }));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const t1 = Date.now();
  let lines = null;
  while (Date.now() - t1 < 400000) {
    try {
      lines = await page.evaluate(() =>
        (document.body.innerText || '').split('\n').map(x => x.trim()).filter(Boolean));
    } catch (e) { lines = null; }
    if (lines) {
      const joined = lines.join(' ');
      if (/assertions passed|\d+ (of \d+ )?failed\./i.test(joined)) break;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  await page.close();
  if (!lines) return { tag: phase.tag, ok: false, detail: 'no result within budget' };

  const joined = lines.join(' ');
  const passMatch = joined.match(/All (\d+) assertions passed/);
  const failMatch = joined.match(/(\d+) (?:of \d+ )?failed\./);
  if (passMatch) {
    const n = parseInt(passMatch[1], 10);
    return { tag: phase.tag, ok: n === phase.expect, detail: `${n}/${phase.expect}` };
  }
  if (failMatch) {
    const bad = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('expected')) bad.push(lines[i - 2]);
    }
    return { tag: phase.tag, ok: false, detail: `${failMatch[1]} failed: ${bad.join(', ')}` };
  }
  return { tag: phase.tag, ok: false, detail: 'unparseable result: ' + joined.slice(0, 120) };
}

async function gradeH(browser) {
  const RUNNER = path.join(REPO, 'verification/Verification H - cover phase.dc.html');
  let runner = fs.readFileSync(RUNNER, 'utf8');
  const BUDGET_OLD = 'new Promise(r => setTimeout(() => r(false), 180000))';
  if (runner.split(BUDGET_OLD).length - 1 !== 1) {
    return { tag: 'H', ok: false, detail: 'H budget anchor not found, runner source changed' };
  }
  runner = runner.replace(BUDGET_OLD, 'new Promise(r => setTimeout(() => r(false), 900000))');
  const bundleIndex = fs.readFileSync(INDEX_HTML, 'utf8');
  const bundleApp = fs.readFileSync(APP_HTML, 'utf8');

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/Verification%20H%20-%20cover%20phase.dc.html*', r =>
    r.fulfill({ status: 200, contentType: 'text/html', body: runner }));
  await page.route('**/app/cover.html*', r =>
    r.fulfill({ status: 200, contentType: 'text/html', body: bundleIndex }));
  await page.route('**/app/app.html*', r =>
    r.fulfill({ status: 200, contentType: 'text/html', body: bundleApp }));

  const url = ORIGIN + '/verification/Verification%20H%20-%20cover%20phase.dc.html';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const t1 = Date.now();
  let lines = null;
  while (Date.now() - t1 < 960000) {
    try {
      lines = await page.evaluate(() =>
        (document.body.innerText || '').split('\n').map(x => x.trim()).filter(Boolean));
    } catch (e) { lines = null; }
    if (lines) {
      const joined = lines.join(' ');
      if (/assertions passed|\d+ (of \d+ )?failed\./i.test(joined)) break;
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  await page.close();
  if (!lines) return { tag: 'H', ok: false, detail: 'no result within 16min budget' };

  const joined = lines.join(' ');
  const passMatch = joined.match(/All (\d+) assertions passed/);
  const h2b = lines.find(l => /pixel read actually happened/.test(l)) || '';
  if (passMatch) {
    return { tag: 'H', ok: parseInt(passMatch[1], 10) === 17, detail: `${passMatch[1]}/17 substantive; ${h2b}` };
  }
  return { tag: 'H', ok: false, detail: joined.slice(0, 200) };
}

(async () => {
  log('checking repo state');
  try { sh('git fetch origin main --quiet'); } catch (e) { log('git fetch failed, continuing on local state:', e.message.split('\n')[0]); }
  try {
    const localHead = sh('git rev-parse HEAD');
    const remoteHead = sh('git rev-parse origin/main');
    if (localHead !== remoteHead) {
      sh('git merge --ff-only origin/main');
      log('fast-forwarded local main to', sh('git rev-parse --short HEAD'));
    }
  } catch (e) { log('branch sync skipped:', e.message.split('\n')[0]); }

  const current = {};
  for (const rel of Object.keys(TRACKED)) current[rel] = sha256(TRACKED[rel]);

  const baseline = readBaseline();
  if (!baseline) {
    log('NO BASELINE RECORDED YET at ' + path.relative(REPO, BASELINE_PATH));
    log('treating this as drift; run --force then --record-baseline to establish one');
  }

  let drifted = !baseline;
  if (baseline) {
    for (const rel of Object.keys(TRACKED)) {
      log(rel + ':');
      log('  baseline', baseline[rel]);
      log('  current ', current[rel]);
      if (baseline[rel] !== current[rel]) drifted = true;
    }
  }

  if (!drifted && !FORCE) {
    log('NO DRIFT. Bundle matches the recorded baseline (' + baseline.recordedAt + '). Skipping the sweep.');
    log('(pass --force to run it anyway)');
    process.exit(0);
  }

  if (drifted && baseline) log('*** DRIFT DETECTED *** bundle bytes changed since the recorded baseline.');
  else if (FORCE) log('--force set: running the full sweep.');

  const { path: chromePath, chromium } = findChromium();
  await ensureServer();
  const browser = await chromium.launch({
    executablePath: chromePath, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader',
           '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const results = [];
  for (const phase of PHASES) {
    log('running', phase.tag, '...');
    const r = await gradeDeterministic(browser, phase);
    results.push(r);
    log(' ', phase.tag, r.ok ? 'PASS' : 'FAIL', r.detail);
  }

  if (WITH_H) {
    log('running H (this can take 8-16 minutes under a GPU-less container) ...');
    const r = await gradeH(browser);
    results.push(r);
    log(' ', r.tag, r.ok ? 'PASS' : 'FAIL', r.detail);
  } else {
    log('H skipped (pass --with-h to include it)');
  }

  await browser.close();

  console.log('');
  console.log('=== SUMMARY ===');
  let allOk = true;
  for (const r of results) {
    console.log('  ' + r.tag.padEnd(3) + (r.ok ? 'PASS  ' : 'FAIL  ') + r.detail);
    if (!r.ok) allOk = false;
  }
  console.log(allOk ? 'ALL GREEN' : 'AT LEAST ONE FAILURE, see above');

  if (RECORD) {
    if (!allOk) {
      console.log('--record-baseline ignored: the sweep was not all green.');
    } else {
      const out = writeBaseline(current);
      console.log('baseline written to ' + path.relative(REPO, BASELINE_PATH) + ' at ' + out.recordedAt);
    }
  }

  process.exit(allOk ? 0 : 1);
})().catch(e => { log('DRIFT-CHECK ERROR', e); process.exit(2); });
