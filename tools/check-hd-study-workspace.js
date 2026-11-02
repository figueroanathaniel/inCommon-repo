#!/usr/bin/env node
/* Task 4.2 source and state contract. This is not a browser/GPU benchmark.
   Run the real drift, lifecycle, H and viewport suites separately. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const scene = read('app/hd-scene.js');
const app = read('app/inCommonApp v2.dc.html');
const pane = read('app/hd-study-pane.js');
const paneModule = require('../app/hd-study-pane.js');
const R = paneModule.reduce;
let passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log('PASS ' + name); }
  catch (e) { console.error('FAIL ' + name + ': ' + e.message); process.exitCode = 1; }
}

check('measured boundaries reject overlap and fit both phone heights', () => {
  for (const [height, top] of [[844,231],[667,231],[844,280]]) {
    const pane = {top: height * .46};
    const stage = {top, bottom:top + 316, width:348};
    const bounds = paneModule.computeStageBoundaries(stage, pane, {bottom:height}, height);
    assert.equal(bounds.isValid, false);
    assert.ok(top + bounds.height <= pane.top);
    assert.equal(paneModule.computeStageBoundaries({...stage,bottom:top + bounds.height},pane,{bottom:height},height).isValid,true);
  }
  const bounds = paneModule.computeStageBoundaries({top:231,bottom:500,width:348},{top:388},{bottom:300},844);
  assert.equal(bounds.height,61);
});
check('first selection highlights without opening', () => {
  assert.equal(R(null, { type: 'select', key: 'c:Sacral', how: 'tap' }), null);
});
check('second selection opens corresponding reading', () => {
  const next = R(null, { type: 'open', key: 'c:Sacral', how: 'tap' });
  assert.equal(next.key, 'c:Sacral'); assert.equal(next.low, false);
});
check('selection follows an already open reading', () => {
  const a = R(null, { type: 'open', key: 'c:Sacral' });
  assert.equal(R(a, { type: 'select', key: 'g:34' }).key, 'g:34');
});
check('view and shell switches preserve selected entry identity', () => {
  const a = R(null, { type: 'open', key: 'g:34' });
  assert.equal(R(a, { type: 'view', to: '2d' }), a);
  assert.equal(R(a, { type: 'view', to: '3d' }), a);
  assert.equal(R(a, { type: 'shell', to: 'mobile' }), a);
});
check('minimize, restore and dismiss keep a coherent selection', () => {
  const a = R(null, { type: 'open', key: 'ch:34-20' });
  const low = R(a, { type: 'low' });
  assert.equal(low.low, true); assert.equal(low.key, a.key);
  assert.equal(R(low, { type: 'low' }).low, false);
  assert.equal(R(low, { type: 'close' }), null);
});
check('GPU lifecycle trims unused focus sprites through shared dispose', () => {
  assert.match(scene, /P\.pruneFocusSprites\s*=\s*function/);
  assert.match(scene, /self\.dispose\(sprite\)/);
  assert.match(scene, /P\.setFocus\s*=\s*function[\s\S]*?this\.pruneFocusSprites\(this\.focusKey\)/);
  assert.match(scene, /P\.trimUnusedResources\s*=\s*function[\s\S]*?this\.pruneFocusSprites\(this\.focusKey\)/);
});
check('scene retains two press and explicit keyboard opening', () => {
  assert.match(scene, /pk\.key === this\.focusKey && !first/);
  assert.match(scene, /this\.o\.onOpen\(pk\.key, 'tap'\)/);
  assert.match(scene, /this\.o\.onOpen\(this\.focusKey, 'key'\)/);
  assert.match(scene, /P\.setReadingOpen\s*=\s*function/);
  assert.match(scene, /this\.readBlend\s*=\s*rm \? this\.readGoal : damp/);
});
check('view re-entry restores the frontend pane camera rail', () => {
  assert.match(app, /S\.setFocus\(st\.hsFocus \|\| null, false\);\s*S\.setReadingOpen\(!!st\.hdPane/);
});
check('2D wiring uses the shared two press handler and visible highlight', () => {
  assert.match(app, /hdWiringPress\(sel\)/);
  assert.match(app, /if \(this\.state\.hsFocus === key\)/);
  assert.ok((app.match(/go: this\.hdWiringPress\(/g) || []).length >= 5);
  assert.match(app, /aria-pressed="{{ c\.selected }}"/);
  assert.match(app, /st\.hsFocus === 'g:' \+ n/);
});
check('desktop and mobile render region panes without a dimming overlay', () => {
  const panes = app.match(/<section data-hd-pane="1"[\s\S]*?<\/section>/g) || [];
  assert.equal(panes.length, 2);
  for (const item of panes) {
    assert.match(item, /role="region"/);
    assert.doesNotMatch(item, /aria-modal="true"|role="dialog"|rgba\(8,7,11,\.76\)/);
  }
  assert.match(app, /data-hd-study-columns="1"/);
  assert.match(app, /grid-template-columns:minmax\(0,1\.15fr\) minmax\(240px,\.85fr\)/);
  assert.match(app, /data-hd-pane-open="{{ hdPaneOpenAttr }}"/);
});
check('mobile stage reveal starts a scroll before snap settlement', () => {
  assert.match(pane, /sc\.scrollTo\(\{ top: target, behavior: 'auto' \}\);\s*this\.vtSettle/);
  assert.match(pane, /hdPaneOpenAttr: p && !p\.low \? '1' : '0'/);
});
check('2D bodygraph gets the mobile stage reserve and reveal target', () => {
  assert.match(pane, /querySelector\('\[data-chart="bodygraph"\]'\)/);
  assert.match(app, /\[data-vt\]\[data-hd-pane-open="1"\] \[data-chart="bodygraph"\]/);
});
check('scene remains independent of database and network access', () => {
  assert.doesNotMatch(scene, /\bfetch\s*\(|\bXMLHttpRequest\b|\bsupabase\b/i);
});
console.log(passed + '/14 source and state checks passed');
