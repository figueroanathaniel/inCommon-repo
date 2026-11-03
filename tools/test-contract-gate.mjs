#!/usr/bin/env node
// Requires a reviewed sandbox hook already enabled. Never changes configuration.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const validate = require('./lib/remote-sandbox-target');
const cloudContract = require('./lib/cloud-write-contract');
const env = process.env;

async function main() {
  if (env.ALLOW_UNSAFE_TARGET) throw Error('ALLOW_UNSAFE_TARGET is not supported');
  assert.ok(env.SUPABASE_URL, 'Missing SUPABASE_URL');
  const origin = validate(env.SUPABASE_URL, require('./fixtures/remote-sync-sandbox.json'));
  for (const name of ['SUPABASE_ANON_KEY', 'SUPABASE_TEST_USER_A_JWT']) {
    assert.ok(env[name], 'Missing ' + name);
  }
  const configured = cloudContract(fileURLToPath(new URL('../app/incommon-cloud.js', import.meta.url)));
  const contract = configured.header;
  const authHeaders = { apikey: env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.SUPABASE_TEST_USER_A_JWT };
  const tables = ['throughline_entries', 'oki_messages'];
  const profile = randomUUID();
  let profileMayExist = false;
  let failure;
  const cleanupErrors = [];
  async function request(route, method = 'GET', body, signature = contract, prefer) {
    const headers = { ...authHeaders, 'Content-Type': 'application/json' };
    if (signature !== null && signature !== undefined) headers['X-InCommon-Write-Contract'] = signature;
    if (prefer) headers.Prefer = prefer;
    const response = await fetch(origin + route, {
      method, headers, redirect: 'error', signal: AbortSignal.timeout(20000),
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { throw Error('Non-JSON response, HTTP ' + response.status); }
    return { status: response.status, ok: response.ok, data };
  }
  function success(r, label) { assert.ok(r.ok, label + ': HTTP ' + r.status); return r.data; }
  function receipt(table, label, r) {
    console.log(JSON.stringify({ table, case: label, status: r.status,
      code: r.data && !Array.isArray(r.data) ? r.data.code || null : null }));
  }
  try {
    const user = success(await request('/auth/v1/user'), 'Authenticate real fixture session');
    assert.ok(user.id, 'Auth must identify a real user');
    profileMayExist = true;
    const created = success(await request('/rest/v1/profiles?select=id', 'POST', {
      id: profile, account_id: user.id, name: 'Disposable contract gate fixture', is_active: false
    }, contract, 'return=representation'), 'Create owner profile');
    assert.equal(created?.[0]?.id, profile);
    for (const table of tables) {
      const endpoint = '/rest/v1/' + table;
      const rows = endpoint + '?profile_id=eq.' + profile + '&select=id,local_id,payload';
      const payload = { profile_id: profile, local_id: 'contract-fixture', payload: { probe: 'initial' } };
      const prefer = 'resolution=merge-duplicates,return=representation';
      const first = await request(endpoint + '?on_conflict=profile_id,local_id', 'POST', payload, contract, prefer);
      const stored = success(first, table + ' valid composite upsert');
      assert.equal(stored?.length, 1); assert.ok(stored[0].id != null);
      const id = stored[0].id;
      assert.equal(stored[0].local_id, payload.local_id);
      receipt(table, 'valid-composite-upsert', first);
      const replay = await request(endpoint + '?on_conflict=profile_id,local_id', 'POST', {
        ...payload, payload: { probe: 'replay' }
      }, contract, prefer);
      assert.equal(success(replay, 'Valid replay')?.[0]?.id, id);
      assert.equal(success(await request(rows), 'Replay read-back').length, 1);
      receipt(table, 'valid-replay-stable-id', replay);
      const signatures = [
        ['missing', null], ['empty', ''], ['old-contract', 'v1'],
        ['malformed', 'v2-composite-upsert-extra'], ['combined-values', 'v2-composite-upsert,evil']
      ];
      for (const [label, signature] of signatures) {
        for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
          const route = method === 'POST' ? endpoint + '?on_conflict=id' : endpoint + '?id=eq.' + id;
          const body = method === 'DELETE' ? undefined : method === 'PATCH'
            ? { payload: { probe: 'must-not-commit' } }
            : { ...payload, id, payload: { probe: 'must-not-commit' } };
          // null explicitly omits the header; undefined would select the default.
          const rejected = await request(route, method, body, signature, prefer);
          receipt(table, label + '-' + method, rejected);
          assert.equal(rejected.status, 423, label + ' ' + method + ' must return 423');
          assert.equal(rejected.data?.code, 'PT423');
          assert.equal(rejected.data?.details, 'CLIENT_UPGRADE_REQUIRED');
          const after = success(await request(rows, 'GET', undefined, null), 'Headerless read control');
          assert.equal(after.length, 1); assert.equal(after[0].id, id);
          assert.deepEqual(after[0].payload, { probe: 'replay' }, 'Rejected writes must not change data');
        }
      }
      const patched = await request(endpoint + '?id=eq.' + id, 'PATCH', { payload: { probe: 'patch' } }, contract, 'return=representation');
      assert.equal(success(patched, 'Valid PATCH')?.[0]?.id, id);
      assert.deepEqual(success(await request(rows), 'PATCH read-back')[0].payload, { probe: 'patch' });
      receipt(table, 'valid-PATCH', patched);
      const deleted = await request(endpoint + '?id=eq.' + id, 'DELETE', undefined, contract, 'return=representation');
      assert.equal(success(deleted, 'Valid DELETE')?.[0]?.id, id);
      assert.equal(success(await request(rows), 'DELETE read-back').length, 0);
      receipt(table, 'valid-DELETE', deleted);
    }
  } catch (error) { failure = error; }
  finally {
    if (profileMayExist) {
      try {
        success(await request('/rest/v1/profiles?id=eq.' + profile, 'DELETE'), 'Delete disposable profile');
        const control = success(await request('/rest/v1/profiles?id=eq.' + profile + '&select=id'), 'Profile cleanup read-back');
        assert.equal(control.length, 0);
        for (const table of tables) {
          assert.equal(success(await request('/rest/v1/' + table + '?profile_id=eq.' + profile + '&select=id'), 'Child cleanup read-back').length, 0);
        }
        console.log('PASS disposable profile and child cleanup read-back');
      } catch (error) { cleanupErrors.push(error); }
    }
  }
  if (failure || cleanupErrors.length) throw new AggregateError([failure, ...cleanupErrors].filter(Boolean),
    [failure?.message, ...cleanupErrors.map(e => 'CLEANUP: ' + e.message)].filter(Boolean).join('; '));
  console.log('PASS contract allow/reject, stable keyed replay, read controls and cleanup; no production sign-off');
}
main().catch(error => { console.error('FAIL ' + error.message); process.exitCode = 1; });
