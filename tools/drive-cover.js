#!/usr/bin/env node
/*! tools/drive-cover.js: the cover's way in, driven in a real browser.
 *
 * WHAT THIS IS. P13 and P15 of the password drive, rewritten for the cover
 * of 26 October 2026 (the ring, the Continue pill, the question) and kept in
 * the repository this time. The drive they came from was run by hand and
 * never committed, so the two rows that described the old cover ("enter
 * here" pressed twice and three times; the phone opening the form at once)
 * had nothing to edit when that cover went. They live here now, and say
 * what the new cover promises instead:
 *
 *   P13  Continue pressed twice and three times leaves nobody anywhere and
 *        asks one question, never two; a session this browser kept goes in
 *        on a single press with no question at all.
 *   P15  A phone at 390 wide with touch meets the ring and the pill, not the
 *        form, and so does a tablet; the press asks the question on both.
 *   P16  Making an account on the cover asks for the full name, middle name
 *        included (owner, 27 October 2026): the field shows only in Create
 *        New Account, takes focus there, and a sign up without it is refused
 *        before anything is sent.
 *
 * HOW IT RUNS. It serves the repository itself on a free port, so it needs
 * nothing running beside it, and it drives app/cover.html with WebGL turned
 * off: these rows are about the controls, and the raytracer is H's to
 * measure (verification/Verification H - cover phase.dc.html). With no WebGL
 * the cover reveals itself through its 9 second fallback, so each page waits
 * for body.signal-lost before it is pressed. Presses are element.click() in
 * the page, because the pill floats and a pointer driver waits for it to
 * hold still. The app is answered with a stub page, so leaving the cover is
 * seen without loading the app.
 *
 * Like drift-check.js it needs Playwright and a Chromium that this repo does
 * not install, and says so plainly when either is missing.
 *
 * Usage: node tools/drive-cover.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const SESSION_KEY = 'sb-lkzcybzhjjxdqetwwdrx-auth-token';

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-cover: Playwright is not installed. Install it (npm i -g playwright and\n' +
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
  const base = 'http://127.0.0.1:' + server.address().port;
  const COVER = base + '/app/cover.html';
  const browser = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
  const errors = [];

  async function open(w, h, touch, session) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: !!touch, isMobile: !!touch });
    const p = await ctx.newPage();
    p.on('pageerror', e => { if (!/WebGL/i.test(e.message)) errors.push(e.message); });
    /* Supabase is never reached: nothing on the cover calls it before a
       submit, and this drive submits nothing. The app is a stub. */
    await p.route('**/supabase.co/**', r => r.abort());
    await p.route('**/inCommonApp*', r => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>app</title>' }));
    if (session) {
      await p.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch (e) {} }, [SESSION_KEY, session]);
    }
    await p.goto(COVER);
    await p.waitForFunction(() => document.body.classList.contains('signal-lost') || document.body.classList.contains('live'), null, { timeout: 20000 });
    return p;
  }
  const press = (p, sel, n) => p.evaluate(([s, k]) => { for (let i = 0; i < k; i++) document.querySelector(s).click(); }, [sel, n || 1]);

  try {
    /* ---- P13 ---- */
    let p = await open(1280, 800);
    const path0 = await p.evaluate(() => location.pathname);
    const after = async () => p.evaluate(() => ({
      path: location.pathname,
      open: !(document.querySelector('.modal-overlay') || { hidden: true }).hidden,
      dialogs: document.querySelectorAll('.modal-overlay:not([hidden])').length,
      leaving: document.body.classList.contains('leaving')
    }));
    await press(p, 'a.enter', 2);
    await p.waitForTimeout(900);
    const twice = await after();
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
    await press(p, 'a.enter', 3);
    await p.waitForTimeout(900);
    const thrice = await after();
    await p.context().close();

    /* A kept session that owes no code: an access token at aal1 and a user
       with no verified authenticator, the shape signedInAs() accepts. */
    const tok = 'x.' + Buffer.from(JSON.stringify({ aal: 'aal1' })).toString('base64url') + '.y';
    p = await open(1280, 800, false, JSON.stringify({ access_token: tok, refresh_token: 'r', user: { email: 'kept@example.invalid' } }));
    await press(p, 'a.enter', 1);
    await p.waitForTimeout(300);
    const kept = await p.evaluate(() => ({ asked: !(document.querySelector('.modal-overlay') || { hidden: true }).hidden, leaving: document.body.classList.contains('leaving') }));
    await p.waitForURL(/inCommonApp/, { timeout: 8000 }).catch(() => {});
    const keptLanded = /inCommonApp/.test(decodeURIComponent(p.url()));
    await p.context().close();

    t('P13', 'Continue pressed twice and three times stays on the cover with one question; a kept session goes in on one press with no question',
      { twice: { stayed: true, open: true, dialogs: 1, leaving: false }, thrice: { stayed: true, open: true, dialogs: 1, leaving: false },
        kept: { asked: false, leaving: true, landed: true } },
      { twice: { stayed: twice.path === path0, open: twice.open, dialogs: twice.dialogs, leaving: twice.leaving },
        thrice: { stayed: thrice.path === path0, open: thrice.open, dialogs: thrice.dialogs, leaving: thrice.leaving },
        kept: { asked: kept.asked, leaving: kept.leaving, landed: keptLanded } });

    /* ---- P15 ---- */
    const shape = async (w, h) => {
      const q = await open(w, h, true);
      const s = await q.evaluate(() => {
        const a = document.querySelector('a.enter'), r = a.getBoundingClientRect();
        const rc = document.querySelector('.ring-container'), ring = rc ? rc.getBoundingClientRect() : { left: -1, right: 0, top: 0, bottom: 0 };
        return {
          phoneClass: document.body.classList.contains('phone'),
          formHidden: document.getElementById('mailform').hidden,
          formOpen: document.body.classList.contains('open'),
          pillShown: getComputedStyle(a).display !== 'none' && getComputedStyle(a).visibility !== 'hidden',
          pillTall: Math.round(r.height) >= 44,
          ringInside: ring.left >= 0 && ring.right <= innerWidth && ring.top >= 0 && ring.bottom <= innerHeight,
          focused: document.activeElement === document.body
        };
      });
      await press(q, 'a.enter', 1);
      await q.waitForTimeout(400);
      s.asks = await q.evaluate(() => !(document.querySelector('.modal-overlay') || { hidden: true }).hidden && document.getElementById('mailform').hidden);
      await q.context().close();
      return s;
    };
    const phone = await shape(390, 844);
    const tablet = await shape(820, 1180);
    t('P15', 'A phone at 390 wide with touch, and a tablet, meet the ring and the Continue pill rather than the form, nothing takes focus on arrival, and a press asks the question',
      { phone: { phoneClass: true, formHidden: true, formOpen: false, pillShown: true, pillTall: true, ringInside: true, focused: true, asks: true },
        tablet: { phoneClass: false, formHidden: true, formOpen: false, pillShown: true, pillTall: true, ringInside: true, focused: true, asks: true } },
      { phone, tablet });

    /* ---- P16 ---- */
    const q = await open(1280, 800);
    await press(q, 'a.enter', 1);
    await q.waitForTimeout(300);
    await press(q, '.modal-signin', 1);
    await q.waitForTimeout(300);
    const nameState = () => q.evaluate(() => {
      const n = document.getElementById('mailname');
      return { shown: !!n && !n.hidden && n.getClientRects().length > 0, focused: document.activeElement === n, mode: document.getElementById('mailform').getAttribute('data-mode') };
    });
    const inMode = await nameState();
    await press(q, 'button.signin.alt', 1);
    await q.waitForTimeout(300);
    const upMode = await nameState();
    /* A blank name is refused before the module is even fetched: count the
       requests for it from here on. */
    let cloudAsked = 0;
    q.on('request', r => { if (/incommon-cloud\.js/.test(r.url())) cloudAsked++; });
    await q.evaluate(() => {
      document.getElementById('mailaddr').value = 'reader@p16.invalid';
      document.getElementById('mailpass').value = 'correct horse battery';
      document.getElementById('mailform').requestSubmit();
    });
    await q.waitForTimeout(600);
    const refused = await q.evaluate(() => ({
      said: /full name/i.test(document.querySelector('.authmsg').textContent),
      focused: document.activeElement === document.getElementById('mailname'),
      stillUp: document.getElementById('mailform').getAttribute('data-mode') === 'up'
    }));
    await q.context().close();
    t('P16', 'Create New Account asks for the full name, middle name included: shown only there, focused first, and a sign up without it is refused before anything is sent',
      { signIn: { shown: false }, signUp: { shown: true, focused: true }, refused: { said: true, focused: true, stillUp: true, cloudAsked: 0 } },
      { signIn: { shown: inMode.shown }, signUp: { shown: upMode.shown, focused: upMode.focused }, refused: { ...refused, cloudAsked } });
  } catch (e) {
    t('P-ERR', 'drive failure: ' + (e && e.message), 'no error', String(e && e.message));
  } finally {
    await browser.close();
    server.close();
  }

  t('P-PAGE', 'No page error on the cover beyond the expected missing WebGL', [], errors);
  for (const r of rows) {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) console.log('     expected ' + JSON.stringify(r.expected) + '\n     actual   ' + JSON.stringify(r.actual));
  }
  const ok = rows.filter(r => r.pass).length;
  console.log('drive-cover: ' + ok + '/' + rows.length + ' passed');
  process.exit(ok === rows.length ? 0 : 1);
})();
