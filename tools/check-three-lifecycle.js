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
  const canceled = [], timers = new Map();
  let tid = 0;
  const context = { window: win, document: doc, console, Set, Math,
    cancelAnimationFrame(id) { canceled.push(id); },
    setTimeout(fn) { timers.set(++tid, fn); return tid; },
    clearTimeout(id) { timers.delete(id); } };
  vm.runInNewContext(fs.readFileSync(path.join(app, name + '.js'), 'utf8'), context, { filename: name + '.js' });
  return { win, doc, canceled, timers, context };
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

/* An unseen stage gives back its bloom targets after a delay, makes nothing
   while asleep, makes them again when seen, and a pending release dies with
   the scene. A run of very late frames drops a rung at once. */
for (const [file, exported] of [['chart-scene', 'ChartScene'], ['hd-scene', 'HDScene'], ['cycle-scene', 'CycleScene']]) {
  const { win, timers } = load(file);
  const s = win[exported].create({});
  s.ready = true; s.bloom = true; s.warm = false;
  const targets = ['scene', 'a', 'b', 'c', 'd'].map(asset);
  s.post = Object.fromEntries(['scene', 'a', 'b', 'c', 'd'].map((k, i) => [k, targets[i]]));
  s.postSleep(false);
  check(timers.size === 1 && s.post, file + ' waits before releasing an unseen stage');
  s.postSleep(true);
  check(timers.size === 0 && s.post && targets.every(a => a.calls === 0), file + ' a quick return keeps the bloom targets');
  s.postSleep(false);
  const fire = () => { const q = [...timers.values()]; timers.clear(); q.forEach(fn => fn()); };
  fire();
  check(s.post && targets.every(a => a.calls === 0) && timers.size === 1, file + ' keeps the bloom targets until the warm-up has run');
  s.warm = true;
  fire();
  check(s.post === null && s._postOff === true && targets.every(a => a.calls === 1), file + ' releases bloom targets while unseen');
  s.setupPost();
  check(s.post === null, file + ' makes no targets while asleep');
  let made = 0;
  s.setupPost = function () { made++; };
  s.postSleep(true);
  check(made === 1 && s._postOff === false, file + ' makes the targets again when seen');
  s.post = { scene: asset(), a: asset(), b: asset(), c: asset(), d: asset() };
  s.postSleep(false);
  check(timers.size === 1, file + ' schedules a second release');
  s.destroy();
  check(timers.size === 0, file + ' destroy cancels a pending release');
  const q = win[exported].create({});
  let rungs = 0;
  q.level = 0; q.frames = []; q.resize = function () { rungs++; };
  q.measure(150, true); q.measure(150, true);
  const before = q.level;
  q.measure(150, true);
  check(before === 0 && q.level === 1 && rungs === 1, file + ' three very late frames drop a rung at once');
}

/* The ladder is fed frames, never the time a stage spent off screen. */
for (const [file, exported] of [['chart-scene', 'ChartScene'], ['hd-scene', 'HDScene'], ['cycle-scene', 'CycleScene']]) {
  const { win, context } = load(file);
  let raf = 0, queue = new Map();
  context.requestAnimationFrame = fn => { queue.set(++raf, fn); return raf; };
  context.cancelAnimationFrame = id => { queue.delete(id); };
  const run = ts => { const q = [...queue.values()]; queue.clear(); q.forEach(fn => fn(ts)); };
  const s = win[exported].create({});
  const seen = [];
  s.ready = true; s.host = element(); s.el.root.isConnected = true; s.visible = true;
  s.measure = function (ms) { seen.push(ms); };
  s.frame = s.step = s.render = s.postSleep = function () {};
  s.updateRun();
  for (let t = 1000; t <= 1400; t += 40) run(t);
  s.visible = false; s.updateRun();
  s.visible = true; s.updateRun();
  for (let t = 9000; t <= 9400; t += 40) run(t);
  check(seen.length > 10 && seen.every(ms => ms < 100), file + ' does not time the gap a stage was away');
  seen.length = 0;
  s.visible = false; s.updateRun(); s.visible = true; s.updateRun();
  [20000, 21500, 21540, 21580, 21620, 21660].forEach(run);
  check(seen.length === 2 && seen.every(ms => ms === 40), file + ' does not judge the first frames after a start');
}

const { win } = load('body-globes');
function makeGeo() { return Object.assign(asset('shared globe geometry'), { translate() { return this; } }); }
const globe = win.BodyGlobes.create({ SphereGeometry: makeGeo, PlaneGeometry: makeGeo });
const objects = [globe.geo, globe.shellGeo, globe.tailGeo];
globe.coronaTex = asset('corona'); globe.glowTex = asset('glow');
objects.push(globe.coronaTex, globe.glowTex);
globe.destroy(); globe.destroy();
check(objects.every(a => a.calls === 1), 'body-globes frees each shared asset once');
/* Exercise globe update with the vendored CPU math, without a renderer. */
const T = await import(require('url').pathToFileURL(path.join(app, 'three.core.js')).href);
let allocations = 0;
class Vec extends T.Vector3 { constructor(...args) { super(...args); allocations++; } }
class Quat extends T.Quaternion { constructor(...args) { super(...args); allocations++; } }
const cached = win.BodyGlobes.create({ SphereGeometry: makeGeo, PlaneGeometry: makeGeo, Vector3: Vec, Quaternion: Quat });
const world = new T.Group(), ring = new T.Object3D(), tails = [new T.Object3D(), new T.Object3D()];
world.position.set(2, 3, 4); ring.rotation.set(0.4, 0.2, 0.7); world.add(ring);
ring.material = { uniforms: { uCen: { value: new T.Vector3() }, uR: { value: 0 }, uN: { value: new T.Vector3() } } };
tails[1].userData.bend = 0.18;
world.userData = { parts: [], ring, tails };
const sun = new T.Vector3(-3, 1, 5), camera = new T.Vector3(10, 8, -4);
cached.update(world, 0, 0.5, sun, camera, 2);
const scratch = cached._frameMath;
allocations = 0;
for (let i = 0; i < 1000; i++) { camera.x = 10 + Math.sin(i); cached.update(world, 0, 0.5, sun, camera, 2); }
check(allocations === 0, 'body-globes allocates no vectors or quaternions in warmed ring and comet updates');
check(cached._frameMath === scratch, 'body-globes reuses math storage across frames');
const normal = new T.Vector3(0, 0, 1).applyQuaternion(ring.getWorldQuaternion(new T.Quaternion()));
check(normal.distanceTo(ring.material.uniforms.uN.value) < 1e-12, 'body-globes preserves ring world normal');
check(tails.every(t => Math.abs(t.quaternion.length() - 1) < 1e-12) && tails[0].quaternion.angleTo(tails[1].quaternion) > 0.01,
  'body-globes keeps independently oriented normalized comet tails');
cached.destroy();
check(cached._frameMath === null, 'body-globes releases CPU math storage on destroy');
console.log('Three.js lifecycle: ' + checks + ' checks passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
