#!/usr/bin/env node
/*! tools/drive-routes.js: the app's Back stack, driven in a real browser.
 *
 * WHAT THIS IS. A check the harness cannot make. The verification phases run
 * the app inside a frame whose earlier rows leave the router in states a
 * reader never reaches, and on 27 October 2026 one of those states hid this
 * fault from a harness row written to catch it. So this drives the app as a
 * reader meets it: the top level page, fresh, at a phone's size and a
 * desktop's.
 *
 *   B1  Arrive at a screen by a route, move once without one, go Back: the
 *       reader lands on the screen they arrived at. Reported on an iPhone as
 *       "the astral body page in the Observatory exits to Today": the chart
 *       was reached by a route, opening a body's reading replaced its history
 *       entry instead of pushing one, and Back skipped it. The fault was the
 *       arrival's replace flag (_routeNav) outliving an arrival that needed no
 *       address write.
 *
 * HOW IT RUNS. It serves the repository itself on a free port and loads the
 * source app (app/inCommonApp v2.dc.html) with WebGL off, because the Back
 * stack does not depend on the renderer, as a guest on the default profile.
 * Supabase is never reached. Like drive-cover.js it needs Playwright and a
 * Chromium this repo does not install, and says so when either is missing.
 *
 * Usage: node tools/drive-routes.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-routes: Playwright is not installed. Install it (npm i -g playwright and\n' +
    'npx playwright install chromium) to run this tool.');
  process.exit(2);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const file = path.join(REPO, rel);
    if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

const rows = [];
function t(id, name, expected, actual) {
  rows.push({ id, name, pass: JSON.stringify(expected) === JSON.stringify(actual), expected, actual });
}

(async () => {
  const { chromium, devices } = loadPlaywright();
  const server = await serve();
  const APP = 'http://127.0.0.1:' + server.address().port + '/app/inCommonApp%20v2.dc.html';
  const browser = await chromium.launch({ args: ['--disable-webgl'] });
  const errors = [];

  /* One reader's walk, the way a tap moves: the Back stack is the browser's,
     so every step goes through location.hash or the app's own state, and Back
     is history.back(), which is what an iPhone's swipe does. */
  async function walk(opts) {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); } catch (e) {}
    });
    await ctx.route('**/supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(APP + '#/today', { timeout: 120000 });
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(2500);
    const hash = () => p.evaluate(() => location.hash);
    await p.evaluate(() => { location.hash = '#/oracle'; });
    await p.waitForTimeout(900);
    await p.evaluate(() => { location.hash = '#/spirit/astrology'; });
    await p.waitForTimeout(900);
    const arrived = await hash();
    /* What "Open the reading" in the Observatory does: a move with no route. */
    await p.evaluate(() => window.__incommonApp.setState({ chartExpandOpen: false, spiritView: 'placement', placeSel: 'Mars', aspSel: null }));
    await p.waitForTimeout(800);
    const moved = await hash();
    await p.evaluate(() => history.back());
    await p.waitForTimeout(1200);
    const back = await hash();
    await ctx.close();
    return { arrived, moved, back };
  }

  try {
    const want = { arrived: '#/spirit/astrology', moved: '#/spirit/astrology/placement/mars', back: '#/spirit/astrology' };
    const phone = await walk({ ...devices['iPhone 13'] });
    const desktop = await walk({ viewport: { width: 1440, height: 900 } });
    t('B1', 'Back after a routed arrival and one move lands on the screen arrived at, on an iPhone and a desktop',
      { phone: want, desktop: want }, { phone, desktop });
  } catch (e) {
    t('B-ERR', 'drive failure: ' + (e && e.message), 'no error', String(e && e.message));
  } finally {
    await browser.close();
    server.close();
  }

  t('B-PAGE', 'No page error beyond the expected missing WebGL',
    [], errors.filter(m => !/WebGL/i.test(m)));
  for (const r of rows) {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) console.log('     expected ' + JSON.stringify(r.expected) + '\n     actual   ' + JSON.stringify(r.actual));
  }
  const ok = rows.filter(r => r.pass).length;
  console.log('drive-routes: ' + ok + '/' + rows.length + ' passed');
  process.exit(ok === rows.length ? 0 : 1);
})();
