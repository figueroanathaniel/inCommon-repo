#!/usr/bin/env node
/*! tools/drive-register.js: every way into the app from the cover ends on the
 * registration card or on the default profile, never on the old birth page.
 *
 * WHAT THIS IS. The owner's report of 27 October 2026: "the registration card
 * is not pulling up, the birth entry page we got rid of still is". The card
 * was asked for only by a tab flag, and a browser that held a sign in threw
 * the flag away (a signed in reader is never asked to make an account), then
 * fell through to the first run page, because each account keeps its own
 * first run marker and one that never finished first run on this device has
 * none. Continue with a saved session goes straight in with no flag at all and
 * met the same page. "Continue without an account" on the sign in form set
 * only the guest mark and met it too.
 *
 *   J1  Yes on the cover, signed out: the card, with the account folded under
 *       "Create account?" (owner, 27 October 2026), so the birth moment can be
 *       given without an email.
 *   J2  Yes on the cover, with a sign in this browser holds: the card, asking
 *       for the birth moment only (no email, no password), never the old page.
 *   J3  Continue straight in with a held sign in, first run never finished on
 *       this device: the same card, birth moment only.
 *   J4  The same, first run already finished for that account: Today, no card.
 *   J5  Saving the signed in card: the profile takes the full name, the date
 *       and the place (the name whole as the birth name, its first word as the
 *       profile's), the
 *       card goes, first run is marked for the account, and a reload stays on
 *       Today.
 *   J6  The guest mark alone ("Continue without an account"): the default
 *       profile, no card and no old page.
 *   J7  Use mine on the sample banner: the card, not the old page.
 *   J8  "Create account?" opens the email, phone and password, and the button
 *       becomes Create my account.
 *   J9  A guest saves the birth moment with the account left folded: the
 *       profile takes it, no account is asked for, first run is marked, and a
 *       reload stays on Today.
 *   J11 No full name, no save: the field is marked and the message names it.
 *   J12 Signed in with an account made on the cover, the card's name field
 *       starts from the name the account was made with.
 *   J10 The logo and the title never share a line box, and no section of the
 *       card is crushed under the next, folded and opened, at three phone
 *       heights. Measured in Chromium; the owner saw them overlap on an iPhone,
 *       where WebKit sized the logo's box from its height alone.
 *   J-PAGE  No page error.
 *
 * HOW IT RUNS. It serves the repository itself, loads the source app at
 * iPhone 13 size with WebGL off, blocks every request to Supabase, and fakes a
 * held sign in by writing the shape profile-manager.js reads (an sb-*-auth-token
 * with a refresh token and a user id, no verified factor). Nothing here reaches
 * a real account. Like drive-cover.js it needs Playwright and Chromium.
 *
 * Usage: node tools/drive-register.js     exit 0 when every row passes
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const REPO = path.resolve(__dirname, '..');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-register: Playwright is not installed. Install it (npm i -g playwright and\n' +
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

/* A held sign in, as profile-manager.js's sessionOwner() reads it. No
   verified factor, so it owes no code. The token is not a real one. */
const USER = 'test-user-0001';
const SESSION = JSON.stringify({ access_token: 'test.e30.test', refresh_token: 'test-refresh', user: { id: USER, factors: [] } });

(async () => {
  const { chromium, devices } = loadPlaywright();
  const server = await serve();
  const APP = 'http://127.0.0.1:' + server.address().port + '/app/inCommonApp%20v2.dc.html';
  const browser = await chromium.launch({ args: ['--disable-webgl'] });
  const errors = [];

  /* One fresh context per case. tab sets sessionStorage for the tab, local
     sets localStorage, both before the app runs. */
  async function open(opts) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    await ctx.addInitScript(o => {
      try {
        if (!sessionStorage.getItem('__seeded')) {
          sessionStorage.setItem('__seeded', '1');
          Object.entries(o.tab || {}).forEach(([k, v]) => sessionStorage.setItem(k, v));
          Object.entries(o.local || {}).forEach(([k, v]) => localStorage.setItem(k, v));
        }
      } catch (e) {}
    }, opts);
    await ctx.route('**/*supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(APP + '#/today', { timeout: 120000 });
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(1500);
    return { ctx, p };
  }
  const look = p => p.evaluate(() => {
    const vis = s => !!document.querySelector(s) && document.querySelector(s).getClientRects().length > 0;
    return {
      card: vis('.welcome-registration-card'),
      askAccount: vis('#reg-email') && vis('#reg-pass'),
      toggle: vis('.reg-acct-toggle'),
      oldPage: vis('[data-screen-label="First run"]'),
      today: window.__incommonApp.state.tab === 'today'
    };
  });
  const signedIn = { ['sb-testref-auth-token']: SESSION };

  try {
    /* J1 */
    let { ctx, p } = await open({ tab: { 'incommon.guest.chosen': '1', 'incommon.register': '1' } });
    t('J1', 'Yes on the cover, signed out: the card, with the account folded under Create account?',
      { card: true, askAccount: false, toggle: true, oldPage: false, today: true }, await look(p));

    /* J8, same page */
    await p.evaluate(() => document.querySelector('.reg-acct-toggle').click());
    await p.waitForTimeout(500);
    const opened = await look(p);
    const label = await p.evaluate(() => (document.querySelector('.reg-go') || {}).textContent.trim());
    const expanded = await p.evaluate(() => document.querySelector('.reg-acct-toggle').getAttribute('aria-expanded'));
    t('J8', 'Create account? opens the email, phone and password, and the button becomes Create my account',
      { askAccount: true, expanded: 'true', label: 'Create my account' }, { askAccount: opened.askAccount, expanded, label });
    await ctx.close();

    /* J2 */
    ({ ctx, p } = await open({ tab: { 'incommon.guest.chosen': '1', 'incommon.register': '1' }, local: signedIn }));
    t('J2', 'Yes on the cover with a held sign in: the card asks for the birth moment only, never the old page',
      { card: true, askAccount: false, toggle: false, oldPage: false, today: true }, await look(p));
    await ctx.close();

    /* J3 */
    ({ ctx, p } = await open({ local: signedIn }));
    t('J3', 'Continue straight in with a held sign in, first run never finished here: the same card, birth moment only',
      { card: true, askAccount: false, toggle: false, oldPage: false, today: true }, await look(p));
    await ctx.close();

    /* J4 */
    ({ ctx, p } = await open({ local: { ...signedIn, ['incommon.firstrun.u.' + USER]: 'true' } }));
    t('J4', 'Continue straight in with a held sign in, first run finished for that account: Today, no card',
      { card: false, askAccount: false, toggle: false, oldPage: false, today: true }, await look(p));
    await ctx.close();

    /* J5 */
    ({ ctx, p } = await open({ local: signedIn }));
    await p.evaluate(() => {
      const a = window.__incommonApp;
      a.afSet('bname', 'Ana Maria Ruiz');
      a.afSet('bdate', '1988-04-12');
      a.afSet('bplace', '40.7128, -74.0060');
    });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.__incommonApp.regSubmit());
    await p.waitForTimeout(1200);
    const saved = await p.evaluate(u => {
      const PM = window.ProfileManager, prof = PM.getProfile(PM.activeId()) || {};
      return { name: prof.name, birthName: window.__incommonApp.birthName(), birthDate: prof.birthDate, hasPlace: !!prof.birthLocation, marked: localStorage.getItem('incommon.firstrun.u.' + u) };
    }, USER);
    const after = await look(p);
    await p.reload();
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(1200);
    const reloaded = await look(p);
    t('J5', 'Saving the signed in card keeps the birth moment, closes the card, marks first run, and a reload stays on Today',
      { name: 'Ana', birthName: 'Ana Maria Ruiz', birthDate: '1988-04-12', hasPlace: true, marked: 'true', cardGone: true, reloadCard: false, reloadOld: false },
      { ...saved, cardGone: !after.card, reloadCard: reloaded.card, reloadOld: reloaded.oldPage });
    await ctx.close();

    /* J6 */
    ({ ctx, p } = await open({ tab: { 'incommon.guest.chosen': '1' } }));
    t('J6', 'The guest mark alone (Continue without an account): the default profile, no card, no old page',
      { card: false, askAccount: false, toggle: false, oldPage: false, today: true }, await look(p));
    await ctx.close();

    /* J7 */
    ({ ctx, p } = await open({ tab: { 'incommon.guest.chosen': '1', 'incommon.guest.default': '1' } }));
    const useMine = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /^\s*Use mine\s*$/.test(x.textContent) && x.getClientRects().length);
      if (b) b.click();
      return !!b;
    });
    await p.waitForTimeout(800);
    t('J7', 'Use mine on the sample banner opens the card, not the old page',
      { button: true, card: true, askAccount: false, toggle: true, oldPage: false, today: true }, { button: useMine, ...(await look(p)) });
    await ctx.close();

    /* J9 */
    ({ ctx, p } = await open({ tab: { 'incommon.guest.chosen': '1', 'incommon.register': '1' } }));
    await p.evaluate(() => {
      window.__signUps = 0;
      const CL = window.InCommonCloud;
      if (CL) CL.passwordSignUp = () => { window.__signUps++; return Promise.resolve({ ok: false, reason: 'offline' }); };
      const a = window.__incommonApp;
      a.afSet('bname', 'Jordan Lee Okafor');
      a.afSet('bdate', '1979-11-30');
      a.afSet('bplace', '34.0522, -118.2437');
    });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.__incommonApp.regSubmit());
    await p.waitForTimeout(1200);
    const g = await p.evaluate(() => {
      const PM = window.ProfileManager, prof = PM.getProfile(PM.activeId()) || {};
      return { birthName: window.__incommonApp.birthName(), birthDate: prof.birthDate, hasPlace: !!prof.birthLocation, signUps: window.__signUps, marked: localStorage.getItem('incommon.firstrun') };
    });
    const gAfter = await look(p);
    await p.reload();
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(1200);
    const gReload = await look(p);
    t('J9', 'A guest saves the birth moment with the account folded: no account asked for, first run marked, reload stays on Today',
      { birthName: 'Jordan Lee Okafor', birthDate: '1979-11-30', hasPlace: true, signUps: 0, marked: 'true', cardGone: true, reloadCard: false, reloadOld: false },
      { ...g, cardGone: !gAfter.card, reloadCard: gReload.card, reloadOld: gReload.oldPage });
    await ctx.close();

    /* J11 */
    ({ ctx, p } = await open({ tab: { 'incommon.guest.chosen': '1', 'incommon.register': '1' } }));
    await p.evaluate(() => { const a = window.__incommonApp; a.afSet('bdate', '1979-11-30'); });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.__incommonApp.regSubmit());
    await p.waitForTimeout(600);
    const noName = await p.evaluate(() => ({
      invalid: document.querySelector('#reg-name').getAttribute('aria-invalid'),
      msg: /full name/i.test(document.querySelector('#reg-msg').textContent),
      marked: localStorage.getItem('incommon.firstrun')
    }));
    t('J11', 'The card will not save without the full name, and says so on the field',
      { invalid: 'true', msg: true, marked: null, card: true }, { ...noName, card: (await look(p)).card });
    await ctx.close();

    /* J12: the session under the key supabase-js reads, unexpired so nothing
       tries to refresh it, carrying the name the cover sent. */
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const named = JSON.stringify({ access_token: 'test.e30.test', refresh_token: 'test-refresh', expires_at: exp, expires_in: 3600, token_type: 'bearer',
      user: { id: USER, factors: [], email: 'reader@j12.invalid', user_metadata: { full_name: 'Ana Maria Ruiz' } } });
    ({ ctx, p } = await open({ local: { 'sb-lkzcybzhjjxdqetwwdrx-auth-token': named } }));
    await p.waitForTimeout(800);
    const pre = await p.evaluate(() => ({ value: (document.querySelector('#reg-name') || {}).value || '', account: !!document.querySelector('#reg-email') }));
    t('J12', 'Signed in with an account made on the cover, the card starts from the name the account was made with',
      { value: 'Ana Maria Ruiz', account: false }, pre);
    await ctx.close();

    /* J10 */
    const heads = {};
    for (const [w, h] of [[390, 664], [375, 560], [430, 740]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await c.addInitScript(() => { try { if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.register', '1'); } } catch (e) {} });
      await c.route('**/*supabase.co/**', r => r.abort());
      const q = await c.newPage();
      q.on('pageerror', e => errors.push(e.message));
      await q.goto(APP + '#/today', { timeout: 120000 });
      await q.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
      await q.waitForTimeout(1200);
      /* Folded and opened: the logo and title stay apart, and no section of
         the card is crushed under the next (the card's sections never shrink;
         a card taller than the screen scrolls inside itself instead). */
      const check = () => q.evaluate(() => {
        const a = document.querySelector('.app-logo-small').getBoundingClientRect(), b = document.querySelector('#reg-title').getBoundingClientRect();
        const apart = a.bottom <= b.top + 0.5 || a.right <= b.left + 0.5 || b.right <= a.left + 0.5 || b.bottom <= a.top + 0.5;
        const kids = [...document.querySelector('.welcome-registration-card').children].map(e => e.getBoundingClientRect());
        const stacked = kids.every((r, i) => i === 0 || r.top >= kids[i - 1].bottom - 0.5);
        return apart && stacked && a.width > 0 && a.height > 0;
      });
      const folded = await check();
      await q.evaluate(() => document.querySelector('.reg-acct-toggle').click());
      await q.waitForTimeout(500);
      heads[w + 'x' + h] = folded && await check();
      await c.close();
    }
    t('J10', 'The logo and title never overlap and no section is crushed, folded and opened, at 390x664, 375x560 and 430x740',
      { '390x664': true, '375x560': true, '430x740': true }, heads);
  } catch (e) {
    t('J-ERR', 'drive failure: ' + (e && e.message), 'no error', String(e && e.message));
  } finally {
    await browser.close();
    server.close();
  }

  t('J-PAGE', 'No page error beyond the expected missing WebGL',
    [], errors.filter(m => !/WebGL/i.test(m)));
  for (const r of rows) {
    console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.name);
    if (!r.pass) console.log('     expected ' + JSON.stringify(r.expected) + '\n     actual   ' + JSON.stringify(r.actual));
  }
  const ok = rows.filter(r => r.pass).length;
  console.log('drive-register: ' + ok + '/' + rows.length + ' passed');
  process.exit(ok === rows.length ? 0 : 1);
})();
