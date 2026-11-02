#!/usr/bin/env node
/* 4.2 study pane: checks for the DRAFT in this folder.
     node docs/outsourcing/task-forces/04-visuals-webgl/4.2-study-pane/check-pane.js
   Part A runs the pure reducer in Node. Part B drives preview.html in
   Chromium (the preinstalled Playwright) at 390x844 with touch and at
   1440x900. Part C greps this folder's own files for the house rules.
   It checks the draft and the preview, NOT the app: nothing here proves the
   pane once it is wired into app/inCommonApp v2.dc.html or hd-scene.js. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const HDPane = require(path.join(HERE, 'pane-controller.js'));

let pass = 0, fail = 0;
function row(id, ok, note) {
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + id + (note ? '  ' + note : ''));
}

/* ---------- A. visibility states ---------- */
(function partA() {
  const R = HDPane.reduce;
  let s = null;
  s = R(s, { type: 'select', key: 'c:Sacral', how: 'tap' });
  row('A1 first press names only, pane stays closed', s === null);
  s = R(s, { type: 'open', key: 'c:Sacral', how: 'tap' });
  row('A2 second press opens on that entry', s && s.key === 'c:Sacral' && s.low === false);
  const s2 = R(s, { type: 'select', key: 'g:34', how: 'key' });
  row('A3 while open, a new selection moves the pane (follow on)', s2 && s2.key === 'g:34');
  const s3 = R(s, { type: 'select', key: 'g:34' }, { follow: false });
  row('A4 follow off keeps the open entry', s3 && s3.key === 'c:Sacral');
  row('A5 same selection returns the same object (no re-render)', R(s, { type: 'select', key: 'c:Sacral' }) === s);
  row('A6 Whole chart (select null) closes', R(s, { type: 'select', key: null }) === null);
  const lo = R(s, { type: 'low' });
  row('A7 low toggles and keeps the entry', lo.low === true && lo.key === 'c:Sacral' && R(lo, { type: 'low' }).low === false);
  row('A8 a new open raises a low sheet', R(lo, { type: 'open', key: 'g:34' }).low === false);
  row('A9 switching view keeps the pane', R(s, { type: 'view', to: '2d' }) === s);
  row('A10 crossing 820px keeps the pane', R(s, { type: 'shell' }) === s);
  row('A11 close closes from any state', R(lo, { type: 'close' }) === null && R(null, { type: 'close' }) === null);
  row('A12 low on a closed pane stays closed', R(null, { type: 'low' }) === null);
  row('A13 open with no key changes nothing', R(s, { type: 'open', key: null }) === s);
}());

/* ---------- C. house rules on this folder's files ---------- */
(function partC() {
  const files = fs.readdirSync(HERE).filter(f => /\.(css|js|html|md)$/.test(f));
  const dash = files.filter(f => /[\u2013\u2014]/.test(fs.readFileSync(path.join(HERE, f), 'utf8')));
  row('C1 no em or en dash in any file', dash.length === 0, dash.join(', '));
  const crisisIn = ['pane.css', 'pane-template.html', 'pane-controller.js'].filter(f => /e5534d/i.test(fs.readFileSync(path.join(HERE, f), 'utf8').replace(/^.*No #e5534d.*$/gm, '')));
  row('C2 #e5534d absent from the pane itself', crisisIn.length === 0, crisisIn.join(', '));
  const purple = files.filter(f => /color\s*:\s*#8b5cf6/i.test(fs.readFileSync(path.join(HERE, f), 'utf8')));
  row('C3 #8b5cf6 never used as text colour', purple.length === 0, purple.join(', '));
  const css = fs.readFileSync(path.join(HERE, 'pane.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  row('C4 pane.css paints no overlay (no inset:0, no backdrop-filter)', !/inset\s*:\s*0/.test(css) && !/backdrop-filter/.test(css));
  const tpl = fs.readFileSync(path.join(HERE, 'pane-template.html'), 'utf8');
  row('C5 template pane is a region, not a modal dialog', !/role="dialog"/.test(tpl) && !/aria-modal/.test(tpl) && /role="region"/.test(tpl));
}());

/* ---------- B. the preview in Chromium ---------- */
async function partB() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { row('B0 playwright available', false, 'BLOCKED: ' + e.message); return; }
  const browser = await chromium.launch();
  const url = 'file://' + path.join(HERE, 'preview.html');

  async function centreOf(page, sel) {
    return page.$eval(sel, n => { const r = n.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: { l: r.left, t: r.top, rr: r.right, b: r.bottom, w: r.width, h: r.height } }; });
  }
  async function pressNode(page, key) {
    /* press the stand-in scene where the node is drawn */
    const p = await page.evaluate(k => {
      const POS = { 'c:Sacral': [.5, .72], 'c:G': [.5, .5], 'c:Head': [.5, .1] };
      const r = document.querySelector('[data-hs-scene]').getBoundingClientRect();
      return { x: r.left + POS[k][0] * r.width, y: r.top + POS[k][1] * r.height };
    }, key);
    await page.mouse.click(p.x, p.y);
  }
  const hasPane = page => page.$('[data-hd-pane]').then(Boolean);
  const activeIn = (page, sel) => page.evaluate(s => { const p = document.querySelector(s); return !!p && p.contains(document.activeElement); }, sel);

  /* ----- phone ----- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(url);
    row('B1 phone: closed at rest', !(await hasPane(page)));
    const help0 = await centreOf(page, '[data-gethelp]');
    await page.evaluate(() => { const s = document.querySelector('[data-vt-scroll]'); s.scrollTop = 40; });
    await pressNode(page, 'c:Sacral');
    row('B2 phone: first press names, no pane', !(await hasPane(page)) && /Sacral/.test(await page.textContent('[data-hud]')));
    await pressNode(page, 'c:Sacral');
    row('B3 phone: second press opens the sheet', await hasPane(page));
    await page.waitForTimeout(400);
    const sheet = await centreOf(page, '[data-hd-pane]');
    const reserve = 844 * 0.46;
    row('B4 phone: sheet top stays below the top reserve (46dvh = ' + reserve.toFixed(0) + 'px)', sheet.r.t >= reserve - 1, 'sheet top ' + sheet.r.t.toFixed(1));
    const dockTop = await page.$eval('.dock', n => n.getBoundingClientRect().top);
    row('B5 phone: sheet ends on the dock top edge', Math.abs(sheet.r.b - dockTop) < 1, 'sheet bottom ' + sheet.r.b.toFixed(1) + ', dock top ' + dockTop.toFixed(1));
    const help = await centreOf(page, '[data-gethelp]');
    const helpHit = await page.evaluate(p => { const n = document.elementFromPoint(p.x, p.y); return !!n && !!n.closest('[data-gethelp]'); }, help);
    row('B6 phone: Get Help visible and pressable with the sheet open', helpHit && Math.abs(help.y - help0.y) < 1);
    const stage = await centreOf(page, '[data-hs-scene]');
    row('B7 phone: the whole stage sits above the sheet', stage.r.b <= sheet.r.t + 1 && stage.r.t >= 59, 'stage ' + stage.r.t.toFixed(0) + ' to ' + stage.r.b.toFixed(0));
    const probes = await page.evaluate(() => {
      const st = document.querySelector('[data-hs-scene]').getBoundingClientRect(), out = [];
      for (let i = 1; i <= 4; i++) for (let j = 1; j <= 3; j++) {
        const x = st.left + st.width * j / 4, y = st.top + st.height * i / 5, n = document.elementFromPoint(x, y);
        out.push(!!n && !!n.closest('[data-hs-scene]'));
      }
      return out;
    });
    row('B8 phone: 12 probes over the stage all hit the stage (no mask)', probes.every(Boolean), probes.filter(Boolean).length + '/12');
    const masks = await page.evaluate(() => {
      const out = [], painted = cs => (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || cs.backgroundImage !== 'none';
      const big = (cs, r) => (cs.position === 'fixed' || cs.position === 'absolute') && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.5;
      [].slice.call(document.querySelectorAll('body *')).forEach(n => {
        const name = n.tagName + '[' + [].slice.call(n.attributes).map(a => a.name).join(',') + ']';
        const cs = getComputedStyle(n), r = n.getBoundingClientRect();
        if (big(cs, r) && painted(cs)) out.push(name);
        ['::before', '::after'].forEach(ps => {
          const c = getComputedStyle(n, ps);
          if (c.content === 'none' || c.content === 'normal' || !painted(c)) return;
          if ((c.position === 'fixed' || c.position === 'absolute') && (c.inset === '0px' || (c.top === '0px' && c.bottom === '0px'))) out.push(name + ps);
        });
      });
      return out;
    });
    row('B9 phone: no painted layer covers the screen', masks.length === 0, masks.join(' '));
    await page.click('[data-hd-pane-low]');
    const low = await centreOf(page, '[data-hd-pane]');
    row('B10 phone: low leaves only the head row', low.r.h < 110 && (await page.getAttribute('[data-hd-pane]', 'data-hd-pane-state')) === 'low', 'height ' + low.r.h.toFixed(0));
    await page.click('[data-hd-pane-low]');
    row('B11 phone: low toggles back', (await page.getAttribute('[data-hd-pane]', 'data-hd-pane-state')) === 'open');
    await page.click('[data-hd-pane-close]');
    row('B12 phone: close button closes', !(await hasPane(page)));
    /* keyboard on the phone shell, the vtBind Escape case */
    await page.focus('[data-hs-scene]');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    row('B13 phone: Enter opens and moves focus into the sheet', (await hasPane(page)) && await activeIn(page, '[data-hd-pane]'));
    const before = await page.evaluate(() => window.__docEscape);
    await page.keyboard.press('Escape');
    const after = await page.evaluate(() => window.__docEscape);
    row('B14 phone: Escape closes, returns focus to the stage, and never reaches the document handler',
      !(await hasPane(page)) && await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-hs-scene')) && after === before,
      'document Escape count ' + before + ' to ' + after);
    if (process.env.PANE_SHOTS) await page.screenshot({ path: path.join(process.env.PANE_SHOTS, 'shot-390-closed.png') });
    await pressNode(page, 'c:G'); await pressNode(page, 'c:G'); await page.waitForTimeout(400);
    if (process.env.PANE_SHOTS) await page.screenshot({ path: path.join(process.env.PANE_SHOTS, 'shot-390-open.png') });
    await ctx.close();
  }

  /* ----- desktop ----- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url);
    const st0 = await centreOf(page, '[data-hs-scene]');
    await pressNode(page, 'c:Sacral');
    row('B15 desktop: first press names, no pane', !(await hasPane(page)));
    await pressNode(page, 'c:Sacral');
    await page.waitForTimeout(400);
    row('B16 desktop: second press opens the pane', await hasPane(page));
    const pn = await centreOf(page, '[data-hd-pane]'), st1 = await centreOf(page, '[data-hs-scene]');
    row('B17 desktop: pane is beside the chart, not over it', pn.r.l >= st1.r.rr, 'stage right ' + st1.r.rr.toFixed(0) + ', pane left ' + pn.r.l.toFixed(0));
    row('B18 desktop: the stage keeps its size (no canvas resize)', Math.abs(st0.r.w - st1.r.w) < 1 && Math.abs(st0.r.h - st1.r.h) < 1);
    const masks = await page.evaluate(() => { const st = document.querySelector('[data-hs-scene]').getBoundingClientRect(); const n = document.elementFromPoint(st.left + st.width / 2, st.top + st.height / 2); return !!n && !!n.closest('[data-hs-scene]'); });
    row('B19 desktop: the stage stays pressable with the pane open', masks);
    /* keyboard: Enter, Tab cycling, Shift+Tab, follow, Escape */
    await page.focus('[data-hs-scene]');
    await page.keyboard.press('ArrowRight');
    const t0 = await page.textContent('[data-hd-pane-title]');
    row('B20 desktop: an arrow step on the stage moves the open pane (follow)', !/Sacral/.test(t0), 'title now ' + t0);
    row('B21 desktop: focus stays on the stage after an arrow step', await page.evaluate(() => document.activeElement.hasAttribute('data-hs-scene')));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
    row('B22 desktop: Enter moves focus to the pane title', await page.evaluate(() => document.activeElement.hasAttribute('data-hd-pane-title')));
    const n = await page.$$eval('[data-hd-pane] button', b => b.length);
    let stayed = true;
    for (let i = 0; i < n + 3; i++) { await page.keyboard.press('Tab'); if (!(await activeIn(page, '[data-hd-pane]'))) stayed = false; }
    row('B23 desktop: Tab ' + (n + 3) + ' times stays inside the pane (' + n + ' buttons)', stayed);
    let stayedB = true;
    for (let i = 0; i < n + 3; i++) { await page.keyboard.press('Shift+Tab'); if (!(await activeIn(page, '[data-hd-pane]'))) stayedB = false; }
    row('B24 desktop: Shift+Tab ' + (n + 3) + ' times stays inside the pane', stayedB);
    const before = await page.evaluate(() => window.__docEscape);
    await page.keyboard.press('Escape');
    row('B25 desktop: Escape closes and returns focus to the stage, document handler untouched',
      !(await hasPane(page)) && await page.evaluate(() => document.activeElement.hasAttribute('data-hs-scene')) && (await page.evaluate(() => window.__docEscape)) === before);
    /* Escape on the stage itself while the pane is open (pointer-opened) */
    await pressNode(page, 'c:Head'); await pressNode(page, 'c:Head');
    await page.focus('[data-hs-scene]');
    await page.keyboard.press('Escape');
    row('B26 desktop: Escape on the stage closes an open pane', !(await hasPane(page)));
    /* crossing 820px with the pane open */
    await pressNode(page, 'c:G'); await pressNode(page, 'c:G');
    await page.setViewportSize({ width: 600, height: 900 });
    await page.waitForTimeout(100);
    row('B27 crossing to the phone shell keeps the pane and its entry', (await hasPane(page)) && /G centre/.test(await page.textContent('[data-hd-pane-title]')) && !!(await page.$('[data-vt] [data-hd-pane]')));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);
    if (process.env.PANE_SHOTS) await page.screenshot({ path: path.join(process.env.PANE_SHOTS, 'shot-1440-open.png') });
    await ctx.close();
  }

  await browser.close();
}

partB().then(() => {
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}, e => { console.error(e); process.exit(2); });
