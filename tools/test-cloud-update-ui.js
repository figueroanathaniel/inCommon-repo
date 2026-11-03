#!/usr/bin/env node
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { IDBFactory } = require('fake-indexeddb');
const Drafts = require('../app/cloud-update-drafts');
const UI = require('../app/cloud-update-ui');
const fs = require('node:fs');
const vm = require('node:vm');
const scope = { account: 'account-a', profile: 'profile-a', tab: 'tab-a' };
const waitFor = async predicate => {
  for (let n = 0; n < 200; n++) { if (predicate()) return; await new Promise(r => setTimeout(r, 2)); }
  throw Error('Async recovery operation did not finish');
};

test('IndexedDB commits only allowlisted writing fields, scoped across accounts, profiles and tabs', async () => {
  const indexedDB = new IDBFactory();
  const a = Drafts.create(indexedDB);
  await a.save(scope, { input: 'Unsent Oki text', dreamText: 'Dream draft', cloudPassword: 'secret',
    mfSecret: 'secret', af: { dob: 'private' }, formPin: '1234',
    draft: { title: 'Writing', note: 'Note', date: '2026-11-02', password: 'secret' } });
  const fresh = Drafts.create(indexedDB);
  const found = await fresh.load(scope);
  assert.deepEqual(found.fields, { input: 'Unsent Oki text', dreamText: 'Dream draft',
    draft: { title: 'Writing', note: 'Note', date: '2026-11-02' } });
  for (const part of ['account', 'profile', 'tab']) assert.equal(await fresh.load({ ...scope, [part]: 'different' }), null);
  assert.equal(found.expires - found.at, Drafts.maxAge);
});

test('empty drafts delete the copy; expiration, profile and account deletion remove only matching copies', async () => {
  let now = 1000;
  const engine = Drafts.create(new IDBFactory(), () => now);
  await engine.save(scope, { input: 'Before expiry' });
  now += Drafts.maxAge + 1; assert.equal(await engine.load(scope), null);
  await engine.save(scope, { input: 'A' });
  const other = { account: 'account-b', profile: 'profile-b', tab: 'tab-b' };
  await engine.save(other, { input: 'B' });
  await engine.removeProfile(scope.profile); assert.equal(await engine.load(scope), null);
  assert.equal((await engine.load(other)).fields.input, 'B');
  await engine.save(scope, { input: 'A again' });
  await engine.removeAccount(scope.account); assert.equal(await engine.load(scope), null);
  await engine.save(other, {}); assert.equal(await engine.load(other), null);
});

test('restore refuses to overwrite new writing and does not restore credential fields', () => {
  assert.throws(() => Drafts.restore({ input: 'New writing' }, { input: 'Old writing' }), /differs/);
  assert.deepEqual(Drafts.restore({ input: '' }, { input: 'Old writing', cloudPassword: 'never' }), { input: 'Old writing' });
  assert.throws(() => Drafts.pick({ input: 'x'.repeat(1000001) }), /too large/);
  assert.throws(() => Drafts.create(new IDBFactory()).save({ ...scope, account: '' }, {}), /required/);
});

test('unavailable and blocked storage rejects instead of claiming a saved copy or writing late', async () => {
  await assert.rejects(Drafts.create(null).save(scope, { input: 'Keep in memory' }), /unavailable/);
  let closed = 0, written = 0;
  const request = { result: { close() { closed++; }, transaction() { written++; } } };
  const idb = { open() { queueMicrotask(() => { request.onblocked(); queueMicrotask(() => request.onsuccess()); }); return request; } };
  await assert.rejects(Drafts.create(idb).save(scope, { input: 'Keep in memory' }), /busy/);
  assert.equal(closed, 1); assert.equal(written, 0);
});

function host(engine, state, focused) {
  const status = { userId: scope.account, upgradeRequired: true };
  const env = { CloudUpdateDrafts: { ...Drafts, store: () => engine },
    sessionStorage: { getItem: () => scope.tab }, crypto: { randomUUID: () => scope.tab },
    document: { activeElement: focused } };
  const h = { state: { ready: true, cloudStatus: status, input: '', draft: { title: '', note: '', date: '2026-11-02' }, ...state },
    cloud: { status: () => status }, PM: () => ({ activeId: () => scope.profile, getProfile: () => ({ id: scope.profile }) }),
    setState(patch) { this.state = { ...this.state, ...patch }; } };
  Object.assign(h, UI.createHostMethods(env));
  return h;
}

test('host rejection saves writing without freezing edits; fresh host offers explicit, conflict-safe restore', async () => {
  const engine = Drafts.create(new IDBFactory());
  const h = host(engine, { input: 'Unsent text', cloudPassword: 'never copied' });
  h.cloudUpgradeRequired();
  await waitFor(() => h._cloudDraftStamp && !h._cloudDraftSaving);
  assert.equal(h.state.cloudNoticeOpen, true);
  assert.equal((await engine.load(scope)).fields.input, 'Unsent text');
  h.state.input = 'Still editing'; h.cloudRecoveryTrack();
  await waitFor(() => h._cloudDraftStamp === JSON.stringify({ input: 'Still editing' }));
  const fresh = host(engine); fresh.cloudRecoveryTrack();
  await waitFor(() => fresh.state.cloudDraftAvailable);
  assert.equal(fresh.state.input, '', 'Restore never happens automatically');
  fresh.state.input = 'Different new text'; fresh.cloudRecoveryRestore();
  assert.equal(fresh.state.input, 'Different new text'); assert.match(fresh.state.cloudDraftMsg, /Nothing was replaced/);
  fresh.state.input = ''; fresh.cloudRecoveryRestore();
  assert.equal(fresh.state.input, 'Still editing'); assert.equal(fresh.state.cloudDraftAvailable, false);
  assert.equal(fresh.state.cloudPassword, undefined);
});

test('host surfaces storage errors and ignores callbacks after unmount', async () => {
  const h = host(Drafts.create(null), { input: 'Not persisted' }); h.cloudUpgradeRequired();
  await waitFor(() => /could not be read/.test(h.state.cloudDraftMsg));
  assert.equal(h.state.input, 'Not persisted'); assert.equal(h.state.cloudDraftBusy, false);
  let resolve;
  const pending = host({ load: () => new Promise(r => { resolve = r; }) });
  pending.cloudRecoveryTrack(); pending.cloudRecoveryStop();
  const before = { ...pending.state }; resolve({ fields: { input: 'late' }, expires: Date.now() + 1000 });
  await new Promise(r => setImmediate(r));
  assert.deepEqual(pending.state, before);
});

test('account signout cleanup removes recovery copies without touching source storage', async () => {
  const engine = Drafts.create(new IDBFactory());
  await engine.save(scope, { input: 'Private draft' });
  const h = host(engine, { input: 'Current writing' });
  await h.cloudRecoveryForgetAccount();
  assert.equal(await engine.load(scope), null); assert.equal(h.state.input, 'Current writing');
  assert.equal(h.state.cloudNoticeOpen, false);
});

test('actual ProfileManager profile deletion also removes that profile recovery copy', async () => {
  const engine = Drafts.create(new IDBFactory());
  await engine.save(scope, { input: 'Deleted profile writing' });
  const context = { window: { CloudUpdateDrafts: { store: () => engine } },
    localStorage: { removeItem() {} }, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../app/profile-manager.js'), 'utf8'), context);
  context.window.ProfileManager._dropProfileKeys(scope.profile);
  assert.equal(await engine.load(scope), null);
});

test('focused text locks only during the snapshot write and unlocks on failure or unmount', async () => {
  let fail;
  const engine = { load: () => Promise.resolve(null), save: () => new Promise((resolve, reject) => { fail = reject; }) };
  const field = { tagName: 'TEXTAREA', value: 'Unsent text', readOnly: false };
  const h = host(engine, { input: 'Unsent text' }, field); h.cloudUpgradeRequired();
  await waitFor(() => h._cloudDraftSaving);
  assert.equal(field.readOnly, true);
  fail(Error('Storage refused the transaction'));
  await waitFor(() => !h._cloudDraftSaving);
  assert.equal(field.readOnly, false); assert.equal(field.value, 'Unsent text');
  assert.match(h.state.cloudDraftMsg, /could not be saved/);
  const release = h.cloudRecoveryLockInput(); h._cloudDraftUnlock = release;
  assert.equal(field.readOnly, true); h.cloudRecoveryStop(); assert.equal(field.readOnly, false);
  const secret = host(engine, {}, { tagName: 'INPUT', type: 'password', readOnly: false });
  secret.cloudRecoveryLockInput()();
});
