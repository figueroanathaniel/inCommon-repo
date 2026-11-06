#!/usr/bin/env node
/*! tools/drive-place.js: the reader's place, kept between the Library and My
 * Charts, and the window a line about the reader's own wiring opens.
 *
 * Asked for by the owner on 6 November 2026: "let the user ping pong back and
 * forth between a section of the library and their chart without losing their
 * place", and a lesson that names a gate the reader holds opens "a window with
 * gate 30 ... and at the end return to where they left off".
 *
 *   PL1  In the Atlas's modern study, Held in your chart opens a window on the
 *        held gate (what it is, how it sits in your chart, what you might meet)
 *   PL2  Back to where you were closes it: same entry, same scroll, focus on the
 *        line that opened it
 *   PL3  The window's way to the wiring, then the place pill and back again:
 *        the Atlas and the chart each come back at their own scroll
 *   PL4  The tab bar resumes the Library and My Charts on a first press, from
 *        each other and from Today
 *   PL5  A second press on the Library is still the fresh start
 *   PL6  Contrast and tap targets over the window and the pill: four
 *        identities, hardened and not, at 1440 and 375, with the harness's own
 *        contrastFails() and tapTargets()
 *
 * Each of PL1 to PL5 runs at a desktop's size and an iPhone's. It serves the
 * repository itself and loads the source app with WebGL off, as a guest on the
 * default profile with a birth of its own, so the chart is the reader's and not
 * the sample. Supabase is never reached. Needs Playwright and Chromium.
 *
 * Usage: node tools/drive-place.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-place: Playwright is not installed. Install it (npm i -g playwright and\n' +
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

/* The harness's own measures, not a copy of them: the suite's factory is
   loaded with two more names on its export. */
const HARNESS = fs.readFileSync(path.join(REPO, 'app', 'handoff', 'tests-v6.0.js'), 'utf8')
  .replace('runCover: runCover };', 'runCover: runCover, contrastFails: contrastFails, tapTargets: tapTargets };');

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

  async function open(phone) {
    const ctx = await browser.newContext(phone ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); } catch (e) {}
    });
    await ctx.route('**/supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(APP + '#/today', { timeout: 120000 });
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    /* A birth whose wiring holds gate 30 and not gate 41, so the window has a
       held gate, an open centre and a hanging gate to say. */
    await p.evaluate(() => { const PM = window.ProfileManager; PM.updateProfile(PM.activeId(), { birthDate: '1990-07-15', birthTime: '14:30', birthLocation: 'Miami, FL, USA' }); });
    await p.waitForTimeout(1200);
    return { ctx, p };
  }
  const scrolls = p => p.evaluate(() => {
    const o = {};
    [].slice.call(document.querySelectorAll('[data-dc-tpl]')).forEach(e => {
      if (e.scrollTop > 0 && !e.hasAttribute('data-vt-scroll')) o[e.getAttribute('data-dc-tpl')] = Math.round(e.scrollTop);
    });
    return o;
  });
  const where = p => p.evaluate(() => { const a = window.__incommonApp, s = a.state; return [a.curTab(), s.libView || '', s.atlasItem || ''].join('|'); });
  const sameOn = (a, b) => Object.keys(a).filter(k => b[k] !== a[k]);

  for (const phone of [false, true]) {
    const tag = phone ? 'phone' : 'desktop';
    const { ctx, p } = await open(phone);
    const navAt = async i => {
      if (phone) await p.locator('nav[data-app-nav="vertical"] button').nth(i).click();
      else await p.locator('nav[data-app-nav="desktop"]:visible button').nth(i).click();
      await p.waitForTimeout(2200);
    };
    /* My Charts first, scrolled, so the chart has a place of its own to keep. */
    await navAt(1);
    if (!phone) { await p.evaluate(() => window.__incommonApp.setState({ spiritView: 'humanDesign' })); await p.waitForTimeout(1200); }
    await p.evaluate(phone => {
      const el = phone ? document.getElementById('incommon-panel-humanDesign')
        : [].slice.call(document.querySelectorAll('main[data-shell="desktop"] [data-dc-tpl]')).find(e => e.scrollHeight > e.clientHeight + 200 && /auto|scroll/.test(getComputedStyle(e).overflowY));
      if (el) el.scrollTop = 380;
    }, phone);
    await p.waitForTimeout(400);
    const chartAt = await scrolls(p);

    await p.evaluate(() => window.__incommonApp.hdAtlasTo('study', 'solar-fears-group')());
    await p.waitForTimeout(3000);
    const held = p.locator('button:has-text("Held in your chart"):visible').first();
    await held.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    const atlasAt = await scrolls(p);

    await held.click();
    await p.waitForTimeout(800);
    const win = await p.evaluate(() => {
      const d = document.querySelector('[data-atlas-rec]');
      if (!d) return null;
      return { title: d.getAttribute('aria-label'), text: d.textContent.toLowerCase() };
    });
    t('PL1' + tag[0], tag + ': Held in your chart opens a window on gate 30 with its three parts',
      { title: 'Gate 30, Feelings', has: true },
      { title: win && win.title, has: !!win && ['what it is', 'how it sits in your chart', 'what you might meet', 'hanging gate'].every(h => win.text.indexOf(h) !== -1) });

    await p.locator('[data-atlas-rec] button:has-text("Back to where you were")').click();
    await p.waitForTimeout(700);
    const after = await scrolls(p);
    t('PL2' + tag[0], tag + ': closing the window leaves the entry, the scroll and the focus where they were',
      { where: 'library|hdatlas|solar-fears-group', moved: [], focus: true, open: 0 },
      { where: await where(p), moved: sameOn(atlasAt, after), focus: await p.evaluate(() => /Held in your chart/.test((document.activeElement || {}).innerText || '')),
        open: await p.locator('[data-atlas-rec]').count() });

    await held.click();
    await p.waitForTimeout(700);
    await p.locator('[data-atlas-rec] button:has-text("in your wiring")').click();
    await p.waitForTimeout(2500);
    const closeHd = p.locator('[role=dialog] button[aria-label*="lose"]:visible').first();
    if (await closeHd.count()) { await closeHd.click(); await p.waitForTimeout(600); }
    const atChart = await scrolls(p);
    const pill1 = await p.locator('[data-ping-back]:visible').first().innerText().catch(() => '');
    await p.locator('[data-ping-back]:visible').first().click();
    await p.waitForTimeout(2500);
    const backAtlas = await scrolls(p);
    const pill2 = await p.locator('[data-ping-back]:visible').first().innerText().catch(() => '');
    await p.locator('[data-ping-back]:visible').first().click();
    await p.waitForTimeout(2500);
    const backChart = await scrolls(p);
    t('PL3' + tag[0], tag + ': the pill ping pongs between the Atlas entry and the wiring, each at its own scroll',
      { pill1: true, pill2: true, chartKept: [], atlasKept: [], chartAgain: [] },
      { pill1: /Back to Inadequacy, intimacy and fate/.test(pill1), pill2: /Back to your wiring/.test(pill2),
        chartKept: sameOn(chartAt, atChart).filter(k => !(k in atlasAt)), atlasKept: sameOn(atlasAt, backAtlas), chartAgain: sameOn(atChart, backChart).filter(k => !(k in atlasAt)) });

    await navAt(2);
    const tabLib = [await where(p), sameOn(atlasAt, await scrolls(p))];
    await navAt(1);
    const tabChart = sameOn(atChart, await scrolls(p)).filter(k => !(k in atlasAt));
    await navAt(0);
    await navAt(2);
    const fromToday = [await where(p), sameOn(atlasAt, await scrolls(p))];
    t('PL4' + tag[0], tag + ': a first press on the Library or My Charts resumes the place, from each other and from Today',
      { tabLib: ['library|hdatlas|solar-fears-group', []], tabChart: [], fromToday: ['library|hdatlas|solar-fears-group', []] },
      { tabLib: tabLib, tabChart: tabChart, fromToday: fromToday });

    await navAt(2);
    t('PL5' + tag[0], tag + ': a second press on the Library is still the fresh start', 'library||', await where(p));
    await ctx.close();
  }

  /* PL6: contrast and tap targets over the window and the pill. */
  const fails = [];
  for (const phone of [false, true]) {
    const { ctx, p } = await open(phone);
    await p.addScriptTag({ content: HARNESS });
    for (const key of ['deepfield', 'midnight', 'dawn', 'gold']) {
      for (const hc of [false, true]) {
        await p.evaluate(([k, h]) => { const a = window.__incommonApp; a.themeSet(k); a.themeHCSet(h); }, [key, hc]);
        await p.evaluate(() => { const a = window.__incommonApp; a.setState({ atlasRec: null }); a.hdAtlasTo('study', 'solar-fears-group')(); });
        await p.waitForTimeout(2200);
        await p.locator('button:has-text("Held in your chart"):visible').first().click();
        await p.waitForTimeout(700);
        const r1 = await p.evaluate(() => { const H = window.InCommonTestsV14, d = document.querySelector('[data-atlas-rec]').parentNode;
          const doc = { querySelectorAll: s => d.querySelectorAll(s) };
          return { c: H.contrastFails(window, doc), s: H.tapTargets(window, doc) }; });
        await p.evaluate(() => window.__incommonApp.setState({ atlasRec: null }));
        await p.waitForTimeout(300);
        await p.evaluate(() => window.__incommonApp.chartGoKeep('humanDesign', 0)());
        await p.waitForTimeout(1800);
        const r2 = await p.evaluate(() => { const H = window.InCommonTestsV14, b = document.querySelector('[data-ping-back]:not([hidden])');
          if (!b) return { none: true };
          const doc = { querySelectorAll: s => [b].concat([].slice.call(b.querySelectorAll(s))).filter(x => x.matches(s)) };
          return { c: H.contrastFails(window, doc), s: H.tapTargets(window, doc) }; });
        const label = (phone ? 375 : 1440) + ' ' + key + (hc ? ' hardened' : '');
        if (r1.c.checked < 8) fails.push({ at: label + ' window', measured: r1.c.checked });
        if (r1.c.fails.length || r1.s.length) fails.push({ at: label + ' window', contrast: r1.c.fails, small: r1.s, checked: r1.c.checked });
        if (r2.none) fails.push({ at: label + ' pill', missing: true });
        else if (r2.c.fails.length || r2.s.length) fails.push({ at: label + ' pill', contrast: r2.c.fails, small: r2.s });
      }
    }
    await ctx.close();
  }
  t('PL6', 'The window and the pill: no pair under 4.5:1 and no control under 44px, 32 cases', [], fails);

  t('PL-PAGE', 'No page error beyond the expected missing WebGL', [], errors.filter(m => !/WebGL/i.test(m)));
  await browser.close();
  server.close();
  let bad = 0;
  rows.forEach(r => {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) { bad++; console.log('   expected ' + JSON.stringify(r.expected) + '\n   actual   ' + JSON.stringify(r.actual)); }
  });
  console.log('drive-place: ' + (rows.length - bad) + '/' + rows.length + ' passed');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
