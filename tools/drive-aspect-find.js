#!/usr/bin/env node
/*! tools/drive-aspect-find.js: a body can be found in the Expert aspect grid.
 *
 * WHAT THIS IS. The owner said on 7 November 2026 that the Expert table "is
 * impossible to read or utilize after a certain point". The find field over
 * the grid turns it into a list. This drives the real field, typing through
 * real key events, at 1440 and at 375 with touch, with Expert switched on:
 *
 *   F1  one body ("chiron") lists only contacts that name Chiron, closest
 *       to exact first;
 *   F2  two bodies ("venus eris") list only the contact between them;
 *   F3  a body and an aspect ("venus trine") list only Venus's trines, and a
 *       whole name wins over a longer one (Venus, not the Venus Node);
 *   F4  an unknown word says so rather than showing an empty grid;
 *   F5  focus stays in the field while typing;
 *   F6  clearing the field brings the grid back.
 *
 * Usage: node tools/drive-aspect-find.js     exit 0 when every row passes
 */
'use strict';
const fs = require('fs'), http = require('http'), path = require('path');
const REPO = path.resolve(__dirname, '..');
function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-aspect-find: Playwright is not installed.');
  process.exit(2);
}
const { chromium } = loadPlaywright();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const f = path.join(REPO, rel);
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const rows = [];
const t = (id, ok, v) => { rows.push([id, ok]); console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + JSON.stringify(v)); };
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const APP = 'http://127.0.0.1:' + server.address().port + '/app/inCommonApp%20v2.dc.html';
  const b = await chromium.launch({ args: ['--disable-webgl'] });
  try {
    for (const [w, h, name, touch] of [[1440, 900, 'desk', false], [375, 812, 'phone', true]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
      await ctx.addInitScript(() => { try { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); } catch (e) {} });
      await ctx.route('**/supabase.co/**', r => r.abort());
      const p = await ctx.newPage();
      await p.goto(APP + '#/spirit/astrology', { timeout: 120000 });
      await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
      await p.waitForTimeout(2000);
      await p.evaluate(() => { const x = [...document.querySelectorAll('button[aria-label]')].find(e => e.offsetParent && /expanded chart/i.test(e.getAttribute('aria-label'))); x.click(); });
      await p.waitForTimeout(4000);
      await p.evaluate(() => window.__incommonApp.chartBloomVals().bloomShowAll());
      await p.waitForTimeout(1200);
      const read = () => p.evaluate(() => {
        const g = [...document.querySelectorAll('[data-asp-grid]')].find(e => e.offsetParent);
        return { lines: [...g.querySelectorAll('li')].map(l => l.children[1].textContent), orbs: [...g.querySelectorAll('li')].map(l => l.children[2].textContent),
          text: g.innerText.trim().slice(0, 80), table: !!g.querySelector('table'), focus: !!(document.activeElement && document.activeElement.hasAttribute('data-asp-find')) };
      });
      const type = async q => {
        await p.evaluate(() => { const i = [...document.querySelectorAll('[data-asp-find]')].find(e => e.offsetParent); i.scrollIntoView({ block: 'center' }); i.focus(); });
        await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
        if (q) await p.keyboard.type(q, { delay: 15 });
        await p.waitForTimeout(500);
        return read();
      };
      const deg = s => { const m = /(\d+)\u00b0(\d+)/.exec(s); return m ? +m[1] + m[2] / 60 : NaN; };
      let r = await type('chiron');
      t(name + ' F1', r.lines.length > 0 && r.lines.every(l => /^Chiron /.test(l)) && r.orbs.map(deg).every((v, i, a) => !i || a[i - 1] <= v), r.lines.length);
      t(name + ' F5', r.focus, r.focus);
      r = await type('venus eris');
      t(name + ' F2', r.lines.length === 1 && /^Venus \w+ Eris$/.test(r.lines[0]), r.lines);
      r = await type('venus trine');
      t(name + ' F3', r.lines.length > 0 && r.lines.every(l => /^Venus trine /.test(l)), r.lines);
      r = await type('zzzz');
      t(name + ' F4', !r.lines.length && !r.table && /No point by that name/.test(r.text), r.text);
      r = await type('');
      t(name + ' F6', r.table, r.table);
      await ctx.close();
    }
  } finally { await b.close(); server.close(); }
  const bad = rows.filter(r => !r[1]);
  console.log('drive-aspect-find: ' + (bad.length ? bad.length + ' of ' + rows.length + ' rows failed' : 'ok, ' + rows.length + ' rows'));
  process.exit(bad.length ? 1 : 0);
})();
