/* check-three-lifecycle.js: verify GPU and listener cleanup without WebGL.
   The chart arithmetic is deliberately absent from this test. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const app = path.resolve(__dirname, '../app');

let checks = 0;
function check(ok, name) { assert.ok(ok, name); checks++; }
function asset(name) {
  return { name, calls: 0, dispose() { this.calls++; } };
}
function events() {
  const listeners = new Map();
  return {
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener(name, fn) { if (listeners.has(name)) listeners.get(name).delete(fn); },
    count(name) { return (listeners.get(name) || new Set()).size; }
  };
}
function element() {
  const el = Object.assign(events(), {
    style: {}, parentNode: null,
    setAttribute() {},
    appendChild(child) { child.parentNode = el; },
    removeChild(child) { if (child.parentNode === el) child.parentNode = null; }
  });
  return el;
}
function load(name) {
  const win = Object.assign(events(), { matchMedia: () => ({ matches: false }) });
  const doc = Object.assign(events(), { createElement: element });
  const canceled = [];
  const context = { window: win, document: doc, console, Set, Math,
    cancelAnimationFrame(id) { canceled.push(id); } };
  vm.runInNewContext(fs.readFileSync(path.join(app, name + '.js'), 'utf8'), context, { filename: name + '.js' });
  return { win, doc, canceled };
}
function graph(nodes) { return { traverse(fn) { nodes.forEach(fn); } }; }

async function main() {
for (const [file, exported, extra] of [
  ['chart-scene', 'ChartScene', ['wallGeo', 'pillarGeo', 'orbGeo', 'ribGeo']],
  ['hd-scene', 'HDScene', ['orbGeo', 'ribGeo']],
  ['cycle-scene', 'CycleScene', ['pillarGeo']]
]) {
  const { win, doc, canceled } = load(file);
  const s = win[exported].create({});
  const baseBlur = win.count('blur');
  const geo = asset('shared geometry'), tex = asset('label texture');
  const mat = Object.assign(asset('shared material'), { map: tex });
  const other = asset('second material'), orphan = asset('unattached geometry');
  s.scene = graph([{ geometry: geo, material: [mat, other] }, { geometry: geo, material: mat }]);
  s.postScene = graph([{ geometry: asset('post quad'), material: mat }]);
  s[extra[0]] = orphan;
  const bright = s.mBright = asset('bright pass');
  const blur = s.mBlur = asset('blur pass');
  const comp = s.mComp = asset('composite pass');
  const targets = ['scene', 'a', 'b', 'c', 'd'].map(asset);
  s.post = Object.fromEntries(['scene', 'a', 'b', 'c', 'd'].map((k, i) => [k, targets[i]]));
  const renderer = s.r = asset('renderer');
  s._kick = 101;
  s.raf = 102;
  if (file === 'chart-scene') {
    const globes = s.globes = { destroyed: 0, destroy() { this.destroyed++; } };
    s.bodies = [];
    s._onBlur = () => {};
    win.addEventListener('blur', s._onBlur);
    s._testGlobes = globes;
  } else if (file === 'hd-scene') {
    s._onBlur = () => {};
    win.addEventListener('blur', s._onBlur);
  }
  const host = s.host = element();
  s._onKey = () => {};
  s._onKeyUp = () => {};
  host.addEventListener('keydown', s._onKey);
  host.addEventListener('keyup', s._onKeyUp);
  const initialVis = doc.count('visibilitychange');
  s.destroy();
  check(geo.calls === 1 && mat.calls === 1 && tex.calls === 1 && other.calls === 1, file + ' frees shared assets once');
  check(orphan.calls === 1, file + ' frees orphaned shared geometry');
  check([bright, blur, comp].every(a => a.calls === 1), file + ' frees all three post materials');
  check(targets.every(a => a.calls === 1) && renderer.calls === 1, file + ' frees render targets and renderer');
  check(canceled.includes(101) && canceled.includes(102), file + ' cancels both queued frames');
  check(doc.count('visibilitychange') === initialVis - 1, file + ' releases document listener');
  check(win.count('blur') === baseBlur - (file === 'cycle-scene' ? 1 : 0), file + ' releases window blur listener');
  if (file !== 'cycle-scene') {
    check(host.count('keydown') === 0 && host.count('keyup') === 0, file + ' releases host keys');
  }
  if (file === 'chart-scene') check(s._testGlobes.destroyed === 1, 'chart-scene releases globe cache');
  s.destroy();
  check(renderer.calls === 1 && geo.calls === 1, file + ' destroy is idempotent');
  let reason = null;
  const failed = win[exported].create({ onFail: why => { reason = why; } });
  const failedRenderer = failed.r = asset('failed renderer');
  failed.fail('lost'); failed.fail('lost');
  check(reason === 'lost' && failedRenderer.calls === 1, file + ' WebGL loss frees resources and notifies once');

  for (const outcome of ['resolve', 'reject']) {
    const pending = win[exported].create({});
    const material = asset('pending shader material');
    const geometry = asset('pending geometry');
    const pendingRenderer = asset('pending renderer');
    pending.scene = graph([{ geometry, material }]);
    pending.r = pendingRenderer;
    let settle;
    pending._warmJobs = new Promise((yes, no) => { settle = outcome === 'resolve' ? yes : no; });
    const pendingHost = pending.host = element();
    pending._onKeyUp = () => {};
    pendingHost.addEventListener('keyup', pending._onKeyUp);
    const beforeBlur = win.count('blur');
    pending.destroy();
    pending.destroy();
    check(material.calls === 0 && geometry.calls === 0 && pendingRenderer.calls === 0,
      file + ' retains GPU assets while shader compile is pending (' + outcome + ')');
    check(file === 'cycle-scene' ? win.count('blur') === beforeBlur - 1 : pendingHost.count('keyup') === 0,
      file + ' detaches listeners before shader compile settles (' + outcome + ')');
    settle(outcome === 'resolve' ? undefined : new Error('shader compile failed'));
    await pending._warmJobs.catch(() => {});
    await new Promise(resolve => setImmediate(resolve));
    check(material.calls === 1 && geometry.calls === 1 && pendingRenderer.calls === 1,
      file + ' frees every GPU asset once after shader compile (' + outcome + ')');
  }
}

const { win } = load('body-globes');
function makeGeo() { return Object.assign(asset('shared globe geometry'), { translate() { return this; } }); }
const globe = win.BodyGlobes.create({ SphereGeometry: makeGeo, PlaneGeometry: makeGeo });
const objects = [globe.geo, globe.shellGeo, globe.tailGeo];
globe.coronaTex = asset('corona'); globe.glowTex = asset('glow');
objects.push(globe.coronaTex, globe.glowTex);
globe.destroy(); globe.destroy();
check(objects.every(a => a.calls === 1), 'body-globes frees each shared asset once');
console.log('Three.js lifecycle: ' + checks + ' checks passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
