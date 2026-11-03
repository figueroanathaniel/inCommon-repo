#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import { seed, database, runtime, writes } from './lib/recovery-fixtures.mjs';
import { MessageChannel } from 'node:worker_threads';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Assets = require('../app/update-assets'), Delivery = require('../app/cloud-update-delivery');
const Boot = require('../app/bootstrap-handshake');
const base = 'https://update.test/', build = 'a'.repeat(64), old = 'b'.repeat(64);
const html = '<!doctype html><html>' + 'verified compiled app '.repeat(100) + '</html>';
const manifest = { schema: 1, build, release: '2.9.7', contract: 'v2-composite-upsert',
  app: { path: 'app.html', bytes: Buffer.byteLength(html), sha256: crypto.createHash('sha256').update(html).digest('hex') } };
function cacheStorage() {
  const stores = new Map();
  return { stores, async open(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const values = stores.get(name), key = x => new URL(typeof x === 'string' ? x : x.url, base).href;
    return { async match(x) { return values.get(key(x))?.clone(); }, async put(x, r) { values.set(key(x), r.clone()); } };
  }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); } };
}
function fixture() {
  const calls = [], caches = cacheStorage();
  const f = { manifest: structuredClone(manifest), html, offline: false,
    env: { crypto: crypto.webcrypto, caches, async fetch(url, options) {
      calls.push({ url: String(url), options }); if (f.offline) throw Error('Offline');
      if (String(url).includes('release-manifest.json')) return new Response(JSON.stringify(f.manifest));
      return new Response(f.html, { headers: { 'content-type': 'text/html' } });
    } }, calls, caches };
  f.assets = Assets.create(f.env, base); return f;
}

test('staging checks exact origin paths, bytes/digest and fresh fetch; no navigation or unrelated eviction', async () => {
  const f = fixture(); await f.caches.open('unrelated-private-cache');
  const receipt = await f.assets.stage(old);
  assert.equal(receipt.build, build); assert.equal(await (await f.assets.shell(build)).text(), html);
  assert.ok((await f.caches.keys()).includes('unrelated-private-cache'));
  for (const call of f.calls) {
    assert.equal(new URL(call.url).origin, 'https://update.test');
    assert.equal(call.options.cache, 'no-store'); assert.equal(call.options.credentials, 'omit');
    assert.equal(call.options.redirect, 'error');
  }
  await assert.rejects(f.assets.stage(build), /already loaded/);
});

test('manifest traversal, wrong release and corrupt/absent shell fail closed', async () => {
  for (const patch of [{ app: { ...manifest.app, path: '../evil.html' } }, { release: '2.9.6' }, { contract: 'old' }]) {
    const f = fixture(); Object.assign(f.manifest, patch); await assert.rejects(f.assets.stage(old));
    assert.equal((await f.caches.keys()).length, 0);
  }
  const corrupt = fixture(); corrupt.html += 'changed'; await assert.rejects(corrupt.assets.stage(old), /digest/);
  const offline = fixture(); offline.offline = true; await assert.rejects(offline.assets.stage(old), /Offline/);
});

test('incomplete, expired or corrupted staging cannot be verified', async () => {
  const f = fixture(); await assert.rejects(f.assets.shell(build), /not staged/);
  await f.assets.stage(old);
  const c = await f.caches.open('incommon-update-v1-' + build);
  await c.put(base + 'app.html', new Response('corrupt', { headers: { 'content-type': 'text/html' } }));
  await assert.rejects(f.assets.shell(build), /digest/);
  await f.assets.stage(old);
  await c.put(base + '__incommon_stage_receipt__', new Response(JSON.stringify({ manifest, at: Date.now() - Assets.maxAge - 1 })));
  await assert.rejects(f.assets.shell(build), /expired/);
});

function bridge() {
  const assigned = [], volume = new Map(), scope = { account: 'a', profile: 'p', tab: 't' };
  let snapshot = { fields: { input: 'committed' } }, currentScope = scope;
  const worker = { scriptURL: base + 'sw.js', postMessage(data, ports) {
    queueMicrotask(() => ports[0].postMessage({ ok: true, result: data.type === 'IC_STAGE'
      ? { build, release: '2.9.7', contract: 'v2-composite-upsert', at: Date.now(), recoverBoot: data.recoverBoot } : { build: data.build } }));
  } };
  const registration = { scope: base, active: worker, async update() {} };
  const env = { isSecureContext: true, __INCOMMON_BUILD_ID__: old, crypto: crypto.webcrypto, MessageChannel,
    navigator: { serviceWorker: { controller: worker, async getRegistration() { return registration; } } },
    location: { href: base + 'app.html#/library/dreams', origin: 'https://update.test', hash: '#/library/dreams', assign: u => assigned.push(u) },
    sessionStorage: { setItem: (k, v) => volume.set(k, v), removeItem: k => volume.delete(k) } };
  const host = { scope: () => currentScope, active: () => true, load: async () => snapshot,
    guard: () => ({ formsReady: true, allowed: false }) };
  return { env, host, volume, assigned, worker, registration, delivery: Delivery.create(env),
    changeScope() { currentScope = { ...scope, profile: 'other' }; } };
}

test('only explicit reload navigates; verified intent and route are preserved', async () => {
  const f = bridge(), receipt = await f.delivery.stage(); assert.deepEqual(f.assigned, []);
  let guardCalls = 0; f.host.guard = () => { guardCalls++; return { formsReady: true }; };
  await f.delivery.reload(receipt, f.host);
  assert.equal(guardCalls, 1); assert.equal(f.assigned.length, 1);
  const u = new URL(f.assigned[0]), intent = JSON.parse(f.volume.get(Delivery.intentKey));
  assert.equal(u.searchParams.get('ic_update'), build); assert.equal(u.searchParams.get('ic_attempt'), intent.attempt);
  assert.equal(u.hash, '#/library/dreams'); assert.equal(intent.profile, 'p');
});

test('fresh guard failure, input races and changed owner/worker prevent navigation', async () => {
  for (const kind of ['guard', 'input', 'owner', 'worker']) {
    const f = bridge(), receipt = await f.delivery.stage();
    f.host.guard = () => ({ formsReady: false, message: 'Unsaved writing' });
    if (kind === 'input') f.host.load = async () => { f.host.guard = () => ({ formsReady: false }); return {}; };
    if (kind === 'owner') f.host.load = async () => { f.changeScope(); return {}; };
    if (kind === 'worker') f.host.load = async () => { f.env.navigator.serviceWorker.controller = {}; return {}; };
    await assert.rejects(f.delivery.reload(receipt, f.host));
    assert.deepEqual(f.assigned, []); assert.equal(f.volume.has(Delivery.intentKey), false);
  }
});

test('unavailable storage, expired receipt or a page unmounted during verification stays put', async () => {
  for (const kind of ['storage', 'expired', 'unmounted']) {
    const f = bridge(), receipt = await f.delivery.stage();
    if (kind === 'storage') f.env.sessionStorage.setItem = () => { throw Error('Storage blocked'); };
    if (kind === 'expired') receipt.at = 0;
    if (kind === 'unmounted') f.host.active = () => false;
    await assert.rejects(f.delivery.reload(receipt, f.host)); assert.equal(f.assigned.length, 0);
  }
});

test('expired boot can re-stage the same shell only through an explicit recovery action', async () => {
  const assets = fixture(); await assert.rejects(assets.assets.stage(build), /already loaded/);
  assert.equal((await assets.assets.stage(build, true)).recoverBoot, true);
  const f = bridge(); f.env.__INCOMMON_BUILD_ID__ = build;
  f.env.InCommonCloud = { status: () => ({ assetHandshake: { ok: false, reason: 'RELOAD_BUILD_MISMATCH' } }) };
  const automatic = await f.delivery.stage(); assert.equal(automatic.recoverBoot, false);
  await assert.rejects(f.delivery.reload(automatic, f.host));
  const confirmed = await f.delivery.stage({ confirmed: true }); assert.equal(confirmed.recoverBoot, true);
  await f.delivery.reload(confirmed, f.host); assert.equal(f.assigned.length, 1);
});

test('actual sync init checks reload intent before any push and acknowledges only a matching build', async () => {
  for (const loaded of [old, build]) {
    const values = new Map([[Delivery.intentKey, JSON.stringify({ build, attempt: 'attempt', expires: Date.now() + 10000 })]]);
    const location = { href: base + 'app.html?ic_update=' + build + '&ic_attempt=attempt' };
    const db = database();
    const r = runtime(seed('throughline_entries'), db, null, { token: '2.9.7', context: {
      URL, location, __INCOMMON_BUILD_ID__: loaded,
      history: { state: {}, replaceState(_s, _t, u) { location.href = u; } },
      sessionStorage: { getItem: k => values.get(k) || null, removeItem: k => values.delete(k) }
    } });
    const pushed = await r.api.push();
    if (loaded === old) {
      assert.equal(pushed.reason, 'upgradeRequired'); assert.equal(writes(db).length, 0);
      assert.equal(values.has(Delivery.intentKey), true);
    } else {
      assert.equal(pushed.ok, true); assert.equal(r.api.status().assetHandshake.reason, 'STAGED_BOOT_VERIFIED');
      assert.equal(values.has(Delivery.intentKey), false);
    }
  }
});

test('post-reload build match acknowledges only navigation bookkeeping; stale/missing/expired evidence blocks', () => {
  const runtime = { version: '2.9.7', contract: 'v2-composite-upsert', push() {}, pull() {} };
  const transport = { global: { headers: { 'X-InCommon-Write-Contract': runtime.contract } } };
  for (const kind of ['valid', 'stale', 'missing', 'expired']) {
    const intent = { build, attempt: 'attempt', expires: Date.now() + 10000 };
    if (kind === 'expired') intent.expires = 0;
    const volume = new Map([['source-records', 'preserve'], [Delivery.intentKey, JSON.stringify(intent)]]);
    if (kind === 'missing') volume.delete(Delivery.intentKey);
    const env = { __INCOMMON_RELEASE_TOKEN__: '2.9.7', __INCOMMON_BUILD_ID__: kind === 'stale' ? old : build,
      location: { href: base + 'app.html?ic_update=' + build + '&ic_attempt=attempt#/today' },
      history: { state: {}, replaceState(_s, _t, u) { env.location.href = u; } },
      sessionStorage: { getItem: k => volume.get(k) || null, removeItem: k => volume.delete(k) } };
    const result = Boot.verifyBrowser(env, runtime, transport);
    assert.equal(result.ok, kind === 'valid');
    if (result.ok) { Boot.acknowledge(env, result); assert.equal(volume.has(Delivery.intentKey), false); assert.equal(new URL(env.location.href).search, ''); }
    assert.equal(volume.get('source-records'), 'preserve');
  }
});

test('actual worker serves verified update offline and removes only obsolete own runtime caches', async () => {
  const f = fixture(); await f.assets.stage(old);
  await f.caches.open('unrelated-private-cache'); await f.caches.open('incommon-dev-v6.4'); await f.caches.open('incommon-v-old');
  const handlers = {};
  const self = { ...f.env, registration: { scope: base }, UpdateAssets: Assets,
    clients: { claim: async () => {} }, addEventListener: (type, fn) => { handlers[type] = fn; } };
  vm.runInNewContext(fs.readFileSync(new URL('../deploy/v6.4/sw.js', import.meta.url), 'utf8'),
    { self, caches: f.caches, location: new URL(base), importScripts() {}, URL, Response, Request, fetch: f.env.fetch });
  let activation; handlers.activate({ waitUntil: p => { activation = p; } }); await activation;
  assert.equal((await f.caches.keys()).includes('incommon-v-old'), false);
  assert.equal((await f.caches.keys()).includes('unrelated-private-cache'), true);
  assert.equal((await f.caches.keys()).includes('incommon-dev-v6.4'), true);
  f.offline = true;
  const current = await f.caches.open('incommon-v6.4-oraplayer1');
  await current.put(base + 'app.html', new Response('previous runtime'));
  let ordinary;
  handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: base + 'app.html' },
    respondWith: p => { ordinary = p; } });
  assert.equal(await (await ordinary).text(), 'previous runtime', 'Staging never changes ordinary offline lookup');
  let navigation; handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: base + 'app.html?ic_update=' + build },
    respondWith: p => { navigation = p; } });
  assert.equal(await (await navigation).text(), html);
  assert.equal(await (await (await f.caches.open('incommon-v6.4-oraplayer1')).match(base + 'app.html')).text(), html);
  let failed;
  handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: base + 'app.html?ic_update=' + old },
    respondWith: p => { failed = p; } });
  const fallback = await failed;
  assert.equal(fallback.status, 503); assert.match(await fallback.text(), /Back button/);
});

test('built manifest matches compiled bytes/build token and the copied worker helper', () => {
  const m = JSON.parse(fs.readFileSync(new URL('../deploy/v6.4/release-manifest.json', import.meta.url)));
  const app = fs.readFileSync(new URL('../deploy/v6.4/app.html', import.meta.url));
  Assets.valid(m); assert.equal(m.app.bytes, app.length);
  assert.equal(m.app.sha256, crypto.createHash('sha256').update(app).digest('hex'));
  assert.ok(app.toString().includes("value: '" + m.build + "'"));
  assert.equal(fs.readFileSync(new URL('../app/update-assets.js', import.meta.url), 'utf8'),
    fs.readFileSync(new URL('../deploy/v6.4/update-assets.js', import.meta.url), 'utf8'));
});
