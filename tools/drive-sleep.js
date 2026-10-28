#!/usr/bin/env node
/*! tools/drive-sleep.js: the sleep reading, read on the page, in both shells.
 *
 * WHAT THIS IS. The browser gates that existed for the sleep correction
 * (drive-cover, drive-routes, drive-register, drive-swipe) never read the
 * readings: they press controls and check navigation. The drift sweep reads
 * pixels, and its H phase runs eight to sixteen minutes, so the sleep prose
 * could regress on screen with every gate still green. This drives the reading
 * itself:
 *
 *   S1  On a phone, Sleep chosen from the readings menu renders the reading,
 *       and none of the five replaced phrases is anywhere on the page.
 *   S2  The same on the desktop shell, and exactly one of the two closings is
 *       present: the post-spending one, or the horizontal-rest one.
 *   S3  The closing agrees with the rows above it. The defined-Sacral row
 *       appears with the post-spending closing and the horizontal closing never
 *       appears with it, which is the contradiction the review caught.
 *   S4  Both shells show the same sleep text, character for character, and it
 *       is the text the module composed for this chart. The module contract
 *       (group H) owns the teaching across six chart shapes; this row ties the
 *       screen to whatever that contract currently says, in both layouts.
 *
 * LIMIT, STATED RATHER THAN IMPLIED. The guest sample chart has an open
 * Sacral, so the four corrected entries do not render on it: their conditions
 * do not match. What this gate therefore proves is that the sleep reading
 * renders, carries no replaced phrase, closes consistently with its own rows,
 * and matches its source in both shells. The defined-Sacral branch is held by
 * the module rows, not here.
 *
 * HOW IT RUNS. It serves the repository itself, loads the app as a guest on the
 * sample chart, opens the readings menu, chooses Sleep, and switches to Full
 * text so a paragraph is never split across deck cards. It needs Playwright and
 * Chromium, like the other gates, and says so plainly when they are missing.
 * WebGL is off: this is about the words, and the raytracer is H's to measure.
 *
 * Usage: node tools/drive-sleep.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-sleep: Playwright is not installed. Install it (npm i -g playwright and\n' +
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

/* The five phrases the correction removed. Nothing a reader can see may carry
   them again, in either shell. */
const OLD = /before you are tired|before the energy runs out|burn off lying down|get horizontal before you are finished|already exhausted, night after night/i;
/* The two closings, and the two rows that belong to the defined-Sacral side. */
const SPENT = 'has been spent, not before it';
const HORIZONTAL = 'horizontal position long before sleep';
const SACRAL_ROWS = ['energy spent on something the gut said yes to', 'engine still running'];

(async () => {
  const { chromium } = loadPlaywright();
  const server = await serve();
  const APP = 'http://127.0.0.1:' + server.address().port + '/app/inCommonApp%20v2.dc.html';
  const browser = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const errors = [];

  async function open(w, h, touch) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch });
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); } catch (e) {}
    });
    await ctx.route('**/supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => { if (!/WebGL/i.test(e.message)) errors.push(e.message); });
    await p.goto(APP + '#/spirit/human-design', { timeout: 120000 });
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(2500);
    return { ctx, p };
  }

  /* The reading as it is on screen, taken from the panel under the reading
     layout toggle rather than from the whole page, so the shell's own chrome
     does not enter the comparison. */
  const readSleep = async p => {
    /* Full text first, so a paragraph is never split across deck cards and the
       closing sentence is findable as one string. */
    await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="radio"]')]
        .find(x => /^full text$/i.test((x.textContent || '').trim()) && x.getClientRects().length);
      if (b) b.click();
    });
    await p.waitForTimeout(400);
    /* The menu body is committed a tick after the trigger, so the item is
       pressed in a second step rather than in the same evaluation. */
    await p.evaluate(() => {
      const tr = [...document.querySelectorAll('[data-dd-trigger="1"]')].find(x => x.getClientRects().length);
      if (tr) tr.click();
    });
    await p.waitForSelector('[role="menuitemradio"]', { timeout: 8000 });
    const chose = await p.evaluate(() => {
      const it = [...document.querySelectorAll('[role="menuitemradio"]')]
        .find(x => /^\s*sleep\s*$/i.test(x.textContent || ''));
      if (!it) return false;
      it.click();
      return true;
    });
    await p.waitForFunction(() => window.__incommonApp.state.hdTab === 'sleep', null, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(600);
    return p.evaluate((chose) => {
      const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
      const a = window.__incommonApp;
      const rg = [...document.querySelectorAll('[role="radiogroup"]')]
        .find(g => /reading layout/i.test(g.getAttribute('aria-label') || ''));
      const panel = rg ? [...rg.parentElement.children]
        .find(c => c !== rg && norm(c.innerText).length > 400) : null;
      return {
        tab: a.state.hdTab, mode: a.state.hdReadMode || '', opened: chose,
        paras: a.hdTeachVals().hdParas.length,
        text: norm(panel ? panel.innerText : document.body.innerText),
        bag: a.hdTeachVals().hdParas.map(p => p.t).join(' '),
        quads: a.hdTeachVals().hdQuads.map(q => q.items.length)
      };
    }, chose);
  };

  try {
    const phone = await open(390, 844, true);
    const phoneRead = await readSleep(phone.p);
    await phone.ctx.close();

    const desk = await open(1440, 900, false);
    const deskRead = await readSleep(desk.p);
    await desk.ctx.close();

    const shape = r => ({
      choseSleep: r.tab === 'sleep' && r.opened,
      paragraphs: r.paras >= 5,
      replaced: OLD.test(r.text),
      closesWith: r.text.indexOf(SPENT) !== -1 ? 'spent' : (r.text.indexOf(HORIZONTAL) !== -1 ? 'horizontal' : 'neither'),
      sacralRows: SACRAL_ROWS.filter(x => r.text.indexOf(x) !== -1).length,
      quadItems: r.quads.join(',')
    });
    const phoneShape = shape(phoneRead);
    const deskShape = shape(deskRead);

    t('S1', 'On a phone, Sleep chosen from the readings menu renders the reading and carries none of the five replaced phrases',
      { choseSleep: true, paragraphs: true, replaced: false, closes: 'one of the two' },
      { choseSleep: phoneShape.choseSleep, paragraphs: phoneShape.paragraphs, replaced: phoneShape.replaced,
        closes: phoneShape.closesWith === 'neither' ? 'neither' : 'one of the two' });

    t('S2', 'The desktop shell renders the same reading, and exactly one of the two closings is on the page',
      { choseSleep: true, paragraphs: true, replaced: false, oneClosing: true },
      { choseSleep: deskShape.choseSleep, paragraphs: deskShape.paragraphs, replaced: deskShape.replaced,
        oneClosing: (deskRead.text.indexOf(SPENT) !== -1) !== (deskRead.text.indexOf(HORIZONTAL) !== -1) });

    /* Whichever side of Sacral definition this chart is on, the rows and the
       closing beneath them have to agree: a reading that promises the
       post-spending close while showing the horizontal rows, or the reverse, is
       the contradiction Kimi named. */
    const agreed = s => (s.sacralRows > 0) === (s.closesWith === 'spent');
    /* Four quads, each holding three to five items: pick() pads a short list to
       three and never past five, so a shorter or longer list means selection
       changed rather than the sample chart did. */
    const quadsOk = s => s.quads.length === 4 && s.quads.every(n => n >= 3 && n <= 5);
    t('S3', 'The closing agrees with the rows above it: the defined-Sacral rows appear with the post-spending closing and never with the horizontal one',
      { phoneAgrees: true, desktopAgrees: true, quads: 'four, three to five each, both shells alike' },
      { phoneAgrees: agreed(phoneShape), desktopAgrees: agreed(deskShape),
        quads: quadsOk(phoneRead) && quadsOk(deskRead) && phoneShape.quadItems === deskShape.quadItems
          ? 'four, three to five each, both shells alike'
          : 'phone ' + phoneShape.quadItems + ' desktop ' + deskShape.quadItems });

    /* What the reader sees has to be what the module composed for this chart,
       in both shells. That is the claim this gate can make about content: the
       module contract (group H) owns the teaching across six shapes, and this
       row ties the screen to whatever that contract currently says. */
    /* The full text panel carries the paragraphs first and the quad grid under
       them, so the composed paragraphs have to be its prefix. */
    const onScreen = (read, bag) => {
      const want = String(bag || '').replace(/\s+/g, ' ').trim();
      return want.length > 200 && read.text.indexOf(want) === 0;
    };
    t('S4', 'Both shells show the same sleep text, character for character, and it is the text the module composes, so neither layout can drift from the other or from the source',
      { identical: true, matchesSource: true, phoneMatches: true, desktopMatches: true },
      { identical: phoneRead.text === deskRead.text,
        matchesSource: phoneRead.text.length > 200,
        phoneMatches: onScreen(phoneRead, phoneRead.bag), desktopMatches: onScreen(deskRead, deskRead.bag) });
  } catch (e) {
    t('S-ERR', 'drive failure: ' + (e && e.message), 'no error', String(e && e.message));
  } finally {
    await browser.close();
    server.close();
  }

  t('S-PAGE', 'No page error in either shell beyond the expected missing WebGL', [], errors);
  for (const r of rows) {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) console.log('     expected ' + JSON.stringify(r.expected) + '\n     actual   ' + JSON.stringify(r.actual));
  }
  const ok = rows.filter(r => r.pass).length;
  console.log('drive-sleep: ' + ok + '/' + rows.length + ' passed');
  process.exit(ok === rows.length ? 0 : 1);
})();
