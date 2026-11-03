// Local tests only: actual sync module and init, fixture PM and stateful transport.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../../app/incommon-cloud.js', import.meta.url), 'utf8');
const pid = '11111111-1111-4111-8111-111111111111';
const uid = '22222222-2222-4222-8222-222222222222';
const MAP = 'incommon_cloud_map_v2', OUTBOX = 'incommon_cloud_outbox_v2';
const copy = value => JSON.parse(JSON.stringify(value));
const key = table => 'incommon.p.' + pid + '.' + (table === 'throughline_entries' ? 'throughline' : 'oki');
const entries = [1, 2].map(n => ({ id: 'entry-' + n, text: 'Local entry ' + n, created_at: '2026-11-02T12:0' + n + ':00.000Z' }));
const denied = (overrides = {}) => ({ status: 423, data: null, error: {
  code: 'PT423', details: 'CLIENT_UPGRADE_REQUIRED', message: 'Client upgrade required'
}, ...overrides });
function seed(table) { return JSON.stringify({
  'fixture.profiles': JSON.stringify([{ id: pid, name: 'Test profile' }]),
  [key(table)]: JSON.stringify(entries)
}); }
function database(fail) {
  return { fail, nextId: 9000, calls: [], tables: Object.fromEntries([
    'accounts', 'profiles', 'deleted_profiles', 'memories', 'consent_events', 'pairs',
    'throughline_entries', 'oki_messages'
  ].map(t => [t, []])) };
}
function gateway(db) {
  return { auth: { onAuthStateChange() {} }, from(table) {
    assert.ok(db.tables[table], 'Unmodeled table ' + table);
    const filters = []; let op = 'select', row, options, offset = 0, end = Infinity;
    const q = {
      select() { op = 'select'; return q; }, insert(r) { op = 'insert'; row = r; return q; },
      upsert(r, o) { op = 'upsert'; row = r; options = o; return q; },
      update(r) { op = 'update'; row = r; return q; }, delete() { op = 'delete'; return q; },
      eq(k, v) { filters.push(r => r[k] === v); return q; },
      in(k, values) { filters.push(r => values.includes(r[k])); return q; },
      order() { return q; }, range(a, b) { offset = a; end = b; return q; },
      then(resolve, reject) {
        return Promise.resolve().then(() => {
          const rec = { table, op, row: row && copy(row), options };
          db.calls.push(rec);
          const failure = db.fail && db.fail(rec);
          if (failure) return copy(failure);
          const rows = db.tables[table];
          const matches = r => filters.every(f => f(r));
          if (op === 'select') return { status: 200, error: null,
            data: copy(rows.filter(matches).slice(offset, end === Infinity ? undefined : end + 1)) };
          if (op === 'delete') {
            const removed = rows.filter(matches); db.tables[table] = rows.filter(r => !matches(r));
            return { status: 200, error: null, data: copy(removed) };
          }
          if (op === 'update') {
            const updated = rows.filter(matches); updated.forEach(r => Object.assign(r, copy(row)));
            return { status: 200, error: null, data: copy(updated) };
          }
          const child = ['throughline_entries', 'oki_messages'].includes(table);
          if (child && row.id !== undefined) return { status: 400, error: { code: '428C9', message: 'Identity rejected' } };
          const keys = (options?.onConflict || 'id').split(',');
          let existing = rows.find(r => keys.every(k => row[k] != null && r[k] === row[k]));
          if (op === 'insert' && existing) return { status: 409, error: { code: '23505', message: 'duplicate key' } };
          if (existing) { const id = existing.id; Object.assign(existing, copy(row)); existing.id = id; }
          else {
            if (child && rows.some(r => r.profile_id === row.profile_id && r.local_id === row.local_id))
              return { status: 409, error: { code: '23505', message: 'composite duplicate' } };
            existing = copy(row); if (child) existing.id = ++db.nextId; rows.push(existing);
          }
          return { status: 201, error: null, data: [copy(existing)] };
        }).then(resolve, reject);
      }
    }; return q;
  } };
}
function runtime(snapshot, db, onUpgrade, boot) {
  const volume = JSON.parse(snapshot), timers = new Map(); let timerId = 0, emit;
  const storage = { getItem: k => Object.hasOwn(volume, k) ? volume[k] : null,
    setItem: (k, v) => { volume[k] = String(v); }, removeItem: k => { delete volume[k]; } };
  const client = gateway(db);
  const profiles = () => JSON.parse(storage.getItem('fixture.profiles'));
  const pm = { _store: () => ({ profiles: profiles(), activeId: pid, pairs: [] }),
    getMemory: () => [], getConsents: () => ({ journal: true, conversation: true }),
    subscribe: fn => { emit = fn; }, importSynced() {} };
  const context = { console, localStorage: storage,
    setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
    supabase: { createClient(_url, _key, options) {
      assert.equal(options.global.headers['X-InCommon-Write-Contract'], 'v2-composite-upsert');
      return client;
    } } };
  context.self = context;
  if (boot) { context.document = {}; context.__INCOMMON_RELEASE_TOKEN__ = boot.token; }
  vm.createContext(context);
  if (boot && !boot.missingVerifier) vm.runInContext(fs.readFileSync(new URL('../../app/bootstrap-handshake.js', import.meta.url), 'utf8'), context);
  vm.runInContext(source, context);
  const api = context.InCommonCloud;
  api.init({ url: 'https://recovery-test.invalid', anonKey: 'test-key', core: {}, storage, pm,
    onUpgradeRequired: result => onUpgrade && onUpgrade(result, storage) });
  api._setClientForTests(client, { user: { id: uid } });
  return { api, context, storage, timers, emit: (name, detail) => emit(name, detail),
    snapshot: () => JSON.stringify(volume) };
}
function hashes(r, table) { return JSON.parse(r.storage.getItem(MAP) || '{"hashes":{}}').hashes[table] || {}; }
const writes = db => db.calls.filter(c => c.op !== 'select');

export { pid, uid, MAP, OUTBOX, entries, copy, key, seed, database, denied, runtime, hashes, writes };
