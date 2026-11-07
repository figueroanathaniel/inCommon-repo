#!/usr/bin/env node
/*! tools/drive-reading-text.js: the Today readings, rendered, carry no code.
 *
 * WHAT THIS IS. The rendered half of check-reading-text.js. On 7 November
 * 2026 the Today horoscope printed a template function's source mid sentence,
 * "(A, B, pa, pb) => 'A thread runs from ' + A + ...", on the days the variant
 * cycle landed on one of two slots. A single render could miss it for weeks,
 * so this renders the Today pages for every day of 2026 and 2027.
 *
 *   R1  For 730 consecutive days, every string horoVals() hands the Today
 *       template (Horoscope, Alignment, Daily Numerology, Together) is free of
 *       "=>", "function(" and "[object ". Before the fix this found the leak on
 *       dozens of days for the default profile.
 *   R2  Every one of those days builds a horoscope without throwing.
 *
 * HOW IT RUNS. Like drive-routes.js: it serves the repository on a free port
 * and loads the source app with WebGL off, as a guest on the default profile,
 * with Supabase blocked. The day is moved by replacing horoNow(), the one
 * place every Today page reads its date from. Only the default profile is
 * swept; the table shapes behind every profile are covered by
 * check-reading-text.js. Needs Playwright and a Chromium, and says so when
 * either is missing.
 *
 * Usage: node tools/drive-reading-text.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-reading-text: Playwright is not installed. Install it (npm i -g playwright and\n' +
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
  const { chromium } = loadPlaywright();
  const server = await serve();
  const APP = 'http://127.0.0.1:' + server.address().port + '/app/inCommonApp%20v2.dc.html';
  const browser = await chromium.launch({ args: ['--disable-webgl'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); } catch (e) {}
    });
    await ctx.route('**/supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(APP + '#/today', { timeout: 120000 });
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    const r = await p.evaluate(() => {
      const a = window.__incommonApp, own = Object.prototype.hasOwnProperty.call(a, 'horoNow'), was = a.horoNow;
      const out = { days: 0, built: 0, leaks: [], threw: [] };
      const grab = (v, acc, seen) => {
        if (typeof v === 'string') { acc.push(v); return; }
        if (!v || typeof v !== 'object' || seen.has(v)) return;
        seen.add(v);
        for (const k of Object.keys(v)) grab(v[k], acc, seen);
      };
      const CODE = /=>|\bfunction\s*\(|\[object /;
      const start = new Date(2026, 0, 1, 12, 0, 0);
      try {
        for (let i = 0; i < 730; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0);
          a.horoNow = () => d; a._horoKey = null;
          out.days++;
          let vals;
          try { vals = a.horoVals(); } catch (e) { out.threw.push(d.toDateString() + ': ' + e.message); continue; }
          if (vals.horoHas) out.built++;
          const acc = []; grab(vals, acc, new Set());
          for (const s of acc) if (CODE.test(s)) out.leaks.push(d.toDateString() + ': ' + s.slice(0, 140));
        }
      } finally {
        if (own) a.horoNow = was; else delete a.horoNow;
        a._horoKey = null;
      }
      return out;
    });
    t('R1', 'No Today reading over 730 days carries program code', [], r.leaks.slice(0, 5));
    t('R2', 'Every one of the 730 days builds a horoscope without throwing',
      { days: 730, built: 730, threw: [] }, { days: r.days, built: r.built, threw: r.threw.slice(0, 5) });
    await ctx.close();
  } catch (e) {
    t('R-ERR', 'drive failure: ' + (e && e.message), 'no error', String(e && e.message));
  } finally {
    await browser.close();
    server.close();
  }

  t('R-PAGE', 'No page error beyond the expected missing WebGL',
    [], errors.filter(m => !/WebGL/i.test(m)));
  for (const r of rows) {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) console.log('     expected ' + JSON.stringify(r.expected) + '\n     actual   ' + JSON.stringify(r.actual));
  }
  const ok = rows.filter(r => r.pass).length;
  console.log('drive-reading-text: ' + ok + '/' + rows.length + ' passed');
  process.exit(ok === rows.length ? 0 : 1);
})();
