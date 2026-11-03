#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import { seed, database, denied, runtime, writes, hashes, key, entries } from './lib/recovery-fixtures.mjs';
const require = createRequire(import.meta.url);
const handshake = require('../app/bootstrap-handshake');
const table = 'throughline_entries';

for (const token of [undefined, '2.9.6', '', '2.9.7 ']) {
  test('browser boot blocks missing/stale/malformed token: ' + String(token), async () => {
    const db = database(), initial = seed(table);
    const r = runtime(initial, db, null, { token });
    assert.equal(r.api.status().assetHandshake.ok, false);
    assert.equal(r.api.status().upgradeRequired, true);
    assert.equal((await r.api.push()).reason, 'upgradeRequired');
    r.api.schedule(); assert.equal(r.timers.size, 0);
    assert.equal(writes(db).length, 0); assert.equal(r.snapshot(), initial);
    assert.equal((await r.api.pull()).ok, true);
    assert.ok(db.calls.some(c => c.op === 'select')); assert.equal(writes(db).length, 0);
  });
}

test('missing verifier fails closed despite a matching document token', async () => {
  const db = database(), r = runtime(seed(table), db, null, { token: '2.9.7', missingVerifier: true });
  assert.equal(r.api.status().assetHandshake.reason, 'BOOTSTRAP_VERIFIER_UNAVAILABLE');
  assert.equal((await r.api.push()).ok, false); assert.equal(writes(db).length, 0);
});

test('changing a token and calling init again cannot promote a blocked page', async () => {
  const db = database(), r = runtime(seed(table), db, null, { token: '2.9.6' });
  r.context.__INCOMMON_RELEASE_TOKEN__ = '2.9.7';
  r.api.init({ url: 'https://recovery-test.invalid', anonKey: 'test-key', core: {}, storage: r.storage,
    pm: { _store() { return { profiles: [] }; }, getMemory() { return []; }, subscribe() {} } });
  assert.equal(r.api.status().assetHandshake.ok, false);
  assert.equal((await r.api.push()).reason, 'upgradeRequired');
  assert.equal(writes(db).length, 0);
});

test('document, module, interface and configured transport must all agree', () => {
  const descriptor = { version: '2.9.7', contract: 'v2-composite-upsert', push() {}, pull() {} };
  const transport = { global: { headers: { 'X-InCommon-Write-Contract': 'v2-composite-upsert' } } };
  assert.equal(handshake.verify('2.9.7', descriptor, transport).ok, true);
  assert.equal(handshake.verify('2.9.7', { ...descriptor, version: '2.9.6' }, transport).ok, false);
  assert.equal(handshake.verify('2.9.7', { ...descriptor, contract: 'old' }, transport).ok, false);
  assert.equal(handshake.verify('2.9.7', { ...descriptor, push: null }, transport).ok, false);
  assert.equal(handshake.verify('2.9.7', descriptor, {}).ok, false);
});

test('fresh verified runtime replays only unacknowledged backlog; server rejection stays latched', async () => {
  const db = database(rec => rec.table === table && rec.row?.local_id === 'entry-2' ? denied() : null);
  const r = runtime(seed(table), db, null, { token: '2.9.7' });
  assert.equal(r.api.status().assetHandshake.ok, true);
  assert.equal((await r.api.push()).reason, 'upgradeRequired');
  const snapshot = r.snapshot(), firstId = db.tables[table][0].id;
  assert.equal(Object.keys(hashes(r, table)).length, 1);
  assert.equal(r.api.status().assetHandshake.ok, true, 'Local boot evidence never overrides a server rejection');
  assert.equal((await r.api.push()).reason, 'upgradeRequired');
  const stale = runtime(snapshot, db, null, { token: '2.9.6' });
  assert.equal((await stale.api.push()).reason, 'upgradeRequired');
  assert.equal(stale.snapshot(), snapshot);
  db.fail = null; db.calls = [];
  const fresh = runtime(snapshot, db, null, { token: '2.9.7' });
  assert.equal(fresh.api.status().upgradeRequired, false);
  assert.equal((await fresh.api.push()).ok, true);
  assert.deepEqual(writes(db).filter(c => c.table === table).map(c => c.row.local_id), ['entry-2']);
  assert.equal(db.tables[table][0].id, firstId); assert.equal(db.tables[table].length, 2);
  assert.deepEqual(JSON.parse(fresh.storage.getItem(key(table))), entries);
  assert.equal(Object.keys(hashes(fresh, table)).length, 2);
});

test('delivery documents embed immutable matching tokens before scripts run', () => {
  for (const name of ['app/cover.html', 'app/inCommonApp v2.dc.html']) {
    const html = fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
    const script = html.match(/<script>(Object.defineProperty\(window, '__INCOMMON_RELEASE_TOKEN__'[\s\S]*?)<\/script>/);
    assert.ok(script, name);
    const window = {}; vm.runInNewContext(script[1], { window });
    assert.equal(window.__INCOMMON_RELEASE_TOKEN__, '2.9.7');
    assert.equal(Object.getOwnPropertyDescriptor(window, '__INCOMMON_RELEASE_TOKEN__').writable, false);
    assert.equal(html.indexOf(script[0]), html.indexOf('<script>'));
  }
});
