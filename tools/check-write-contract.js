#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const cloudContract = require('./lib/cloud-write-contract');
const browser = { URL, Headers, Request, Response, AbortController, WebSocket,
  console, crypto: globalThis.crypto, atob, btoa, setTimeout, clearTimeout, setInterval, clearInterval };
vm.createContext(browser);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../app/supabase-js-2.57.1.umd.min.js'), 'utf8'), browser);
const sdk = browser.supabase;
const calls = [];
let client;
let refuse = false;
const configured = cloudContract(path.resolve(__dirname, '../app/incommon-cloud.js'), (url, key, options) => {
  client = sdk.createClient(url, key, {
    ...options, global: { ...options.global, fetch: async (url, init) => {
      const headers = new Headers(init.headers);
      calls.push({ url: new URL(url), method: init.method || 'GET', headers });
      assert.equal(headers.get('X-InCommon-Write-Contract'), 'v2-composite-upsert');
      assert.equal(headers.get('apikey'), key, 'Public API key is preserved');
      assert.equal(headers.get('authorization'), 'Bearer ' + key, 'SDK authorization is preserved');
      if (refuse) return new Response(JSON.stringify({ code: 'PT423',
        details: 'CLIENT_UPGRADE_REQUIRED', message: 'Client upgrade required' }), {
        status: 423, headers: { 'Content-Type': 'application/json' }
      });
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    } }
  });
  return client;
});
(async () => {
  assert.equal(configured.options.auth, undefined, 'Application does not override auth defaults');
  const row = { profile_id: '11111111-1111-4111-8111-111111111111', local_id: 'contract-test', payload: {} };
  for (const table of ['throughline_entries', 'oki_messages']) {
    for (const query of [
      client.from(table).upsert(row, { onConflict: 'profile_id,local_id' }).select(),
      client.from(table).update({ payload: {} }).eq('local_id', row.local_id),
      client.from(table).delete().eq('local_id', row.local_id),
      client.from(table).select('id')
    ]) assert.equal((await query).error, null);
  }
  assert.deepEqual(calls.map(c => c.method), ['POST', 'PATCH', 'DELETE', 'GET', 'POST', 'PATCH', 'DELETE', 'GET']);
  const post = calls.find(c => c.method === 'POST');
  assert.equal(post.url.searchParams.get('on_conflict'), 'profile_id,local_id');
  assert.match(post.headers.get('prefer'), /resolution=merge-duplicates/);
  assert.match(post.headers.get('prefer'), /return=representation/);
  refuse = true;
  configured.api._setClientForTests(client, { user: { id: 'transport-test-user' } });
  const rejected = await configured.api.push();
  assert.equal(rejected.reason, 'upgradeRequired', 'Real SDK maps the HTTP gate signature');
  assert.equal(configured.api.status().upgradeRequired, true);
  const afterRejection = calls.length;
  assert.equal((await configured.api.push()).reason, 'upgradeRequired');
  assert.equal(calls.length, afterRejection, 'Paused push sends no more HTTP calls');
  console.log('PASS actual init and vendored SDK: contract, auth/API key/Prefer, POST/PATCH/DELETE/GET, HTTP 423 classification and write pause');
})().catch(error => { console.error('FAIL ' + error.message); process.exitCode = 1; });
