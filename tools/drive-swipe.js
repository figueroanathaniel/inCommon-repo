#!/usr/bin/env node
/*! tools/drive-swipe.js: the phone's sideways swipes, made faster than the screen moves.
 *
 * WHAT THIS IS. The owner's report of 27 October 2026, on an iPhone: "if I
 * swipe too quickly or too early I switch tabs in the app. Sometimes it gets
 * stuck between 2 of them". A swipe moves the reader one step along the chain
 * (see "Swiping on the phone is one chain" in CLAUDE.md) by a smooth scroll
 * that is pinned when it lands. A touch on a scroller still travelling cancels
 * the pin, and two faults followed from that:
 *
 *   - the swipe was dropped, because the pager kept moving under our own
 *     animation during the touch and that read as the browser having moved it;
 *   - with the swipe dropped and the pin gone nothing finished the move, and
 *     on an iPhone, where a touch also stops the smooth scroll where it is, the
 *     pager or the section column stayed between two screens.
 *
 *   W1  Three swipes forward from the first chart, the third made while the
 *       second is still travelling: every swipe counts, so the reader is on
 *       the Library's first tab, with the column on a section.
 *   W2  Three quick swipes back from there: every swipe counts and the
 *       interrupted section move is finished, so the reader is on the first
 *       chart, the pager on a page and the column on a section.
 *   W3  A tap while a swipe is still travelling: the move is finished where it
 *       was going, on the second chart, and the pager is on a page.
 *
 * Each row runs twice: as Chromium behaves, and as an iPhone does, where a
 * touch stops a smooth scroll in place. The second is simulated by a capture
 * listener that stops both scrollers on touchstart, because no WebKit is
 * installed here; it is the half of the fault Chromium cannot show.
 *
 * HOW IT RUNS. It serves the repository itself, loads the source app as a
 * guest on the default profile with WebGL off, emulates an iPhone 13 and
 * sends real touch events through the DevTools protocol. Swipes start where
 * the app's own vtHScrollableAt() allows one, outside the top and bottom
 * bands. Like drive-cover.js it needs Playwright and Chromium.
 *
 * Usage: node tools/drive-swipe.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-swipe: Playwright is not installed. Install it (npm i -g playwright and\n' +
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

  async function run(iphone) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); } catch (e) {}
    });
    await ctx.route('**/supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(APP + '#/spirit/human-design', { timeout: 120000 });
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(3500);
    if (iphone) {
      await p.evaluate(() => {
        document.addEventListener('touchstart', () => {
          for (const el of document.querySelectorAll('[data-vt-pager],[data-vt-scroll]')) {
            const l = el.scrollLeft, tp = el.scrollTop;
            el.style.scrollBehavior = 'auto';
            el.scrollTo({ left: l, top: tp, behavior: 'instant' });
          }
        }, { capture: true, passive: true });
      });
    }
    const cdp = await ctx.newCDPSession(p);
    const freeY = () => p.evaluate(() => {
      const a = window.__incommonApp, h = innerHeight;
      for (let y = 120; y < h - 60; y += 20) {
        const el = document.elementFromPoint(195, y);
        if (el && !a.vtHScrollableAt(el) && y > a.VT_BAND && y < h - a.VT_BAND) return y;
      }
      return 470;
    });
    const swipe = async dx => {
      const y = await freeY(), x0 = dx < 0 ? 330 : 60, steps = 6;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= steps; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / steps, y: y + i }] });
        await new Promise(r => setTimeout(r, 15));
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const tap = async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 400 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const where = () => p.evaluate(() => {
      const a = window.__incommonApp, pg = document.querySelector('[data-vt-pager]'), col = document.querySelector('[data-vt-scroll]');
      const w = pg.clientWidth || 1, at = pg.scrollLeft / w;
      return {
        tab: a.state.tab, chart: a.state.vtTab || 0, libTab: a.libSubOf(),
        pagerOnPage: Math.abs(at - Math.round(at)) < 0.01,
        columnOnSection: [...document.querySelectorAll('[data-vt-sec]')].some(s => Math.abs(s.offsetTop - col.scrollTop) <= 1)
      };
    });
    const out = {};
    await swipe(-200); await p.waitForTimeout(1500);
    await swipe(-200); await p.waitForTimeout(140); await swipe(-200);
    await p.waitForTimeout(2800);
    out.w1 = await where();
    await swipe(200); await p.waitForTimeout(120); await swipe(200); await p.waitForTimeout(120); await swipe(200);
    await p.waitForTimeout(3000);
    out.w2 = await where();
    await swipe(-200); await p.waitForTimeout(140); await tap();
    await p.waitForTimeout(2800);
    out.w3 = await where();
    await ctx.close();
    return out;
  }

  try {
    const chromiumRun = await run(false);
    const iphoneRun = await run(true);
    const pick = (r, keys) => keys.reduce((o, k) => { o[k] = r[k]; return o; }, {});
    const W1 = { tab: 'library', libTab: 'study', columnOnSection: true };
    const W2 = { tab: 'spirit', chart: 0, pagerOnPage: true, columnOnSection: true };
    const W3 = { tab: 'spirit', chart: 1, pagerOnPage: true, columnOnSection: true };
    t('W1', 'Three swipes forward, the third mid-move, all count: Library, first tab, on a section',
      { chromium: W1, iphone: W1 },
      { chromium: pick(chromiumRun.w1, Object.keys(W1)), iphone: pick(iphoneRun.w1, Object.keys(W1)) });
    t('W2', 'Three quick swipes back all count and the interrupted section move is finished: first chart, nothing between screens',
      { chromium: W2, iphone: W2 },
      { chromium: pick(chromiumRun.w2, Object.keys(W2)), iphone: pick(iphoneRun.w2, Object.keys(W2)) });
    t('W3', 'A tap mid-move finishes the move where it was going: second chart, on a page',
      { chromium: W3, iphone: W3 },
      { chromium: pick(chromiumRun.w3, Object.keys(W3)), iphone: pick(iphoneRun.w3, Object.keys(W3)) });
  } catch (e) {
    t('W-ERR', 'drive failure: ' + (e && e.message), 'no error', String(e && e.message));
  } finally {
    await browser.close();
    server.close();
  }

  t('W-PAGE', 'No page error beyond the expected missing WebGL',
    [], errors.filter(m => !/WebGL/i.test(m)));
  for (const r of rows) {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) console.log('     expected ' + JSON.stringify(r.expected) + '\n     actual   ' + JSON.stringify(r.actual));
  }
  const ok = rows.filter(r => r.pass).length;
  console.log('drive-swipe: ' + ok + '/' + rows.length + ' passed');
  process.exit(ok === rows.length ? 0 : 1);
})();
