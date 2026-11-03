#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import { pid, uid, MAP, OUTBOX, entries, copy, key, seed, database, denied, runtime, hashes, writes } from './lib/recovery-fixtures.mjs';

for (const table of ['throughline_entries', 'oki_messages']) {
  test(table + ': partial 423 preserves records and hashes, pauses writes, reads and edits remain available', async () => {
    const db = database(rec => rec.table === table && rec.row?.local_id === 'entry-2' ? denied() : null);
    let notifications = 0;
    const r = runtime(seed(table), db, (result, storage) => {
      notifications++; assert.equal(result.reason, 'upgradeRequired');
      assert.equal(Object.keys(JSON.parse(storage.getItem(MAP)).hashes[table]).length, 1,
        'Acknowledgments are durable before the host is notified');
    });
    r.api.schedule(); assert.equal(r.timers.size, 1);
    const result = await r.api.push();
    assert.equal(result.reason, 'upgradeRequired'); assert.equal(result.code, 'PT423');
    assert.equal(result.status, 423); assert.equal(result.details, 'CLIENT_UPGRADE_REQUIRED');
    assert.equal(result.sent, 1); assert.equal(db.tables[table].length, 1);
    assert.equal(Object.keys(hashes(r, table)).length, 1);
    assert.deepEqual(JSON.parse(r.storage.getItem(key(table))), entries);
    assert.equal(r.api.status().writeState, 'upgradeRequired');
    assert.equal(r.api.status().upgradeRequired, true); assert.equal(r.api.status().mode, 'cloud');
    assert.equal(r.timers.size, 0); assert.equal(notifications, 1);
    const count = writes(db).length;
    assert.equal((await r.api.push()).reason, 'upgradeRequired');
    r.emit('memory:deleted', { profileId: pid, id: 'pending-delete' });
    const pending = r.storage.getItem(OUTBOX);
    r.api.schedule(); assert.equal(r.timers.size, 0);
    assert.equal((await r.api.pull()).ok, true, 'Reads still run while write-paused');
    const sync = await r.api.sync(); assert.equal(sync.reason, 'upgradeRequired');
    assert.ok(db.calls.some(c => c.op === 'select'));
    assert.equal(writes(db).length, count, 'Neither pull nor sync flushes deletions while paused');
    assert.equal(r.storage.getItem(OUTBOX), pending);
    const added = [...entries, { id: 'entry-3', text: 'Local edit while paused' }];
    r.storage.setItem(key(table), JSON.stringify(added));
    r.emit('memory:added', { profileId: pid });
    assert.deepEqual(JSON.parse(r.storage.getItem(key(table))), added);
    assert.equal(r.timers.size, 0); assert.equal(notifications, 1);
  });
  test(table + ': fresh runtime retries only unacknowledged records and preserves server IDs', async () => {
    const db = database(rec => rec.table === table && rec.row?.local_id === 'entry-2' ? denied() : null);
    const r = runtime(seed(table), db); assert.equal((await r.api.push()).reason, 'upgradeRequired');
    const firstId = db.tables[table][0].id, snapshot = r.snapshot();
    db.fail = null; db.calls = [];
    const fresh = runtime(snapshot, db); assert.equal(fresh.api.status().upgradeRequired, false);
    assert.equal((await fresh.api.push()).ok, true);
    assert.deepEqual(writes(db).filter(c => c.table === table).map(c => c.row.local_id), ['entry-2']);
    assert.equal(db.tables[table].length, 2); assert.equal(db.tables[table][0].id, firstId);
    assert.equal(Object.keys(hashes(fresh, table)).length, 2);
    assert.deepEqual(JSON.parse(fresh.storage.getItem(key(table))), entries);
    db.calls = []; assert.equal((await fresh.api.push()).ok, true);
    assert.equal(writes(db).filter(c => c.table === table).length, 0);
  });
}

test('rejected outbox retains failed, unattempted and concurrently queued deletions', async () => {
  let r;
  const db = database(rec => {
    if (rec.op === 'delete') {
      r.emit('memory:deleted', { profileId: pid, id: 'queued-during-request' });
      return denied();
    }
  });
  r = runtime(seed('throughline_entries'), db);
  r.emit('memory:deleted', { profileId: pid, id: 'failed' });
  r.emit('memory:deleted', { profileId: pid, id: 'not-attempted' });
  const result = await r.api.push(); assert.equal(result.reason, 'upgradeRequired');
  assert.deepEqual(JSON.parse(r.storage.getItem(OUTBOX)).map(op => op.id),
    ['failed', 'not-attempted', 'queued-during-request']);
  assert.equal(writes(db).length, 1, 'No later writes follow the rejection');
  assert.equal(r.timers.size, 0);
});

test('ordinary maintenance, other errors and forged error text do not latch upgradeRequired', async () => {
  const cases = [
    denied({ error: { code: 'PT423', details: 'MAINTENANCE_LOCKOUT_ACTIVE', message: 'Maintenance' } }),
    denied({ status: 403 }),
    denied({ error: { code: 'OTHER', details: 'CLIENT_UPGRADE_REQUIRED', message: 'Client upgrade required' } }),
    { status: 500, error: { message: 'CLIENT_UPGRADE_REQUIRED' } }
  ];
  for (const response of cases) {
    const db = database(rec => rec.table === 'throughline_entries' ? response : null);
    const r = runtime(seed('throughline_entries'), db);
    assert.equal((await r.api.push()).ok, false); assert.equal(r.api.status().upgradeRequired, false);
    r.api.schedule(); assert.equal(r.timers.size, 1);
    const before = writes(db).length; await r.api.push(); assert.ok(writes(db).length > before);
  }
});

test('upgrade rejection stops remaining generic table writes and survives a throwing host callback', async () => {
  const snapshot = JSON.parse(seed('throughline_entries'));
  snapshot['fixture.profiles'] = JSON.stringify([{ id: pid }, { id: 'another-local-profile' }]);
  const db = database(rec => rec.table === 'profiles' ? denied() : null);
  const r = runtime(JSON.stringify(snapshot), db, () => { throw Error('Host update check failed'); });
  const result = await r.api.push(); assert.equal(result.reason, 'upgradeRequired');
  assert.equal(writes(db).filter(c => c.table === 'profiles').length, 1);
  assert.equal(db.tables.throughline_entries.length, 0);
  assert.deepEqual(JSON.parse(r.storage.getItem(key('throughline_entries'))), entries);
});
