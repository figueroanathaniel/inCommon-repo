#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { IDBFactory } = require('fake-indexeddb');
const registry = require('../app/ui-registry');
const guard = require('../app/reload-guard');
const drafts = require('../app/cloud-update-drafts');
const UI = require('../app/cloud-update-ui');
const scope = { account: 'account', profile: 'profile', tab: 'tab' };
function field(value, attrs = {}, properties = {}) {
  return { tagName: 'TEXTAREA', type: 'textarea', value, autocomplete: '',
    getClientRects: () => [{}], getAttribute: key => attrs[key] || null, ...properties };
}
function document(controls = [], dirty = []) {
  return { querySelectorAll: selector => selector.startsWith('input,') ? controls : dirty };
}
async function options(state, controls) {
  const store = drafts.create(new IDBFactory()); await store.save(scope, state);
  return { state, document: document(controls), scope, snapshot: await store.load(scope) };
}

test('A: credential/PIN/financial fields are not serialized or authorized by a forged mapping', async () => {
  const state = { input: 'Writing', cloudPassword: 'password', formPin: '1111', mfSecret: 'secret', relText: 'Release' };
  assert.deepEqual(registry.pick(state), { input: 'Writing' });
  assert.deepEqual(registry.restore({}, { cloudPassword: 'password', formPin: '1111', relText: 'Release' }), {});
  for (const props of [
    { type: 'password' }, { autocomplete: 'one-time-code' }, { autocomplete: 'cc-number' },
    { autocomplete: 'cc-csc' }
  ]) {
    const opt = await options({ input: 'sensitive' }, [field('sensitive', { 'data-recovery-field': 'input' }, props)]);
    assert.equal(guard.evaluate(opt).reason, 'SENSITIVE_INPUT');
  }
  const pin = await options({}, [field('1111', { 'data-reload-sensitive': 'true' }, { tagName: 'INPUT', type: 'text' })]);
  assert.equal(guard.evaluate(pin).reason, 'SENSITIVE_INPUT');
});

test('B: every active control is scanned, and unknown dirty forms cannot default to eligible', async () => {
  const opt = await options({ input: 'Saved writing' }, [
    field('Saved writing', { 'data-recovery-field': 'input' }), field('Unsaved unmapped text')
  ]);
  assert.equal(guard.evaluate(opt).reason, 'UNSUPPORTED_RETAINED_DATA');
  opt.document = document([], [field('', { 'data-dirty': 'true' })]);
  assert.equal(guard.evaluate(opt).reason, 'UNSUPPORTED_DIRTY_SURFACE');
  opt.document = document([field('', { 'data-dirty': 'true' })]);
  assert.equal(guard.evaluate(opt).formsReady, false);
});

test('C: committed mapped writing survives fresh storage/restore; forms-ready is not asset authorization', async () => {
  const indexedDB = new IDBFactory(), store = drafts.create(indexedDB);
  const state = { dreamText: 'Dream writing', dreamMoodB: 'Quiet', draft: { title: 'Title', note: 'Note', date: '2026-11-02' } };
  const controls = [field(state.dreamText, { 'data-recovery-field': 'dreamText' }),
    field(state.draft.note, { 'data-recovery-field': 'draft.note' })];
  assert.equal(guard.evaluate({ state, scope, document: document(controls), snapshot: null }).reason, 'BACKUP_NOT_COMMITTED');
  await store.save(scope, state);
  const fresh = drafts.create(indexedDB), snapshot = await fresh.load(scope);
  const result = guard.evaluate({ state, scope, document: document(controls), snapshot });
  assert.equal(result.formsReady, true); assert.equal(result.allowed, false);
  assert.equal(result.reason, 'ASSETS_NOT_VERIFIED');
  assert.deepEqual(registry.restore({}, snapshot.fields), state);
  assert.throws(() => registry.restore({ dreamText: 'New writing' }, snapshot.fields), /differs/);
});

test('every mapped scalar and nested draft field has a validated roundtrip', async () => {
  for (const path of registry.paths) {
    const state = path.startsWith('draft.') ? { draft: { title: 'Title', note: 'Note', date: '2026-11-02' } } : { [path]: 'Writing' };
    const value = registry.value(state, path);
    const opt = await options(state, [field(value, { 'data-recovery-field': path })]);
    assert.equal(guard.evaluate(opt).formsReady, true, path);
    assert.equal(registry.value(registry.restore({}, opt.snapshot.fields), path), value);
  }
});

test('stale, expired, wrong-owner and in-progress snapshots block; DOM/state mismatch blocks', async () => {
  const opt = await options({ input: 'Saved' }, [field('Saved', { 'data-recovery-field': 'input' })]);
  assert.equal(guard.evaluate({ ...opt, saving: true }).formsReady, false);
  assert.equal(guard.evaluate({ ...opt, scope: { ...scope, account: 'other' } }).formsReady, false);
  assert.equal(guard.evaluate({ ...opt, snapshot: { ...opt.snapshot, expires: 0 } }).formsReady, false);
  assert.equal(guard.evaluate({ ...opt, state: { input: 'Changed' } }).reason, 'BACKUP_STALE');
  assert.equal(guard.evaluate({ ...opt, document: document([field('Browser value not in state', { 'data-recovery-field': 'input' })]) }).reason, 'INPUT_NOT_CAPTURED');
});

test('unmapped files, custom editors and checkbox state block; only declared navigation controls are ignored', async () => {
  for (const control of [
    field('selected-file', {}, { type: 'file', files: [{}] }),
    field('', {}, { isContentEditable: true, textContent: 'Custom writing' }),
    field('', {}, { type: 'checkbox', checked: false }),
    field('secret', { 'data-reload-ui': 'arbitrary-ignore' })
  ]) assert.equal(guard.evaluate({ state: {}, scope, document: document([control]), snapshot: null }).formsReady, false);
  assert.equal(guard.evaluate({ state: {}, scope, document: document([
    field('2026-11-02', { 'data-reload-ui': 'horoDate' }, { type: 'date' })
  ]), snapshot: null }).formsReady, true);
});

test('hidden retained writing/secrets and active work block even without a native form element', () => {
  for (const state of [{ pnotes: { 0: 'Unmapped note' } }, { mfSecret: 'secret' }, { formMode: 'edit', form: {} },
    { dreamRej: { symbol: true } }, { supBusy: true }, { recOn: true }, { typing: true }]) {
    assert.equal(guard.evaluate({ state, scope, document: document(), snapshot: null }).formsReady, false);
  }
});

test('a pending guard cannot become eligible after a new input or owner change', async () => {
  let resolve;
  const state = { ready: true, input: 'Before', cloudFormsReady: false };
  const env = { ReloadGuard: guard, document: document([field('Before', { 'data-recovery-field': 'input' })]),
    CloudUpdateDrafts: { ...drafts, store: () => ({ load: () => new Promise(r => { resolve = r; }) }) } };
  const host = { state, cloudRecoveryScope: () => scope, setState(patch) { Object.assign(this.state, patch); } };
  Object.assign(host, UI.createHostMethods(env)); host.cloudRecoveryScope = () => scope;
  const pending = host.cloudRecoveryCheckForms();
  host.state.input = 'After'; host.cloudRecoveryInvalidateForms();
  resolve({ ...scope, expires: Date.now() + 10000, fields: { input: 'Before' } });
  assert.equal((await pending).reason, 'INPUT_OR_SCOPE_CHANGED'); assert.equal(host.state.cloudFormsReady, false);
});

test('actual template mappings reference schema paths; birth/PIN fields never enter the writing schema', () => {
  const source = fs.readFileSync(new URL('../app/inCommonApp v2.dc.html', import.meta.url), 'utf8');
  const found = [...source.matchAll(/data-recovery-field="([^"]+)"/g)].map(m => m[1]);
  assert.ok(found.length > 20);
  for (const path of found) assert.ok(registry.paths.includes(path), path);
  for (const name of ['formPin', 'mfCode', 'afBdate', 'regPass']) assert.ok(!registry.paths.includes(name));
  assert.ok(source.includes('data-reload-sensitive="true"'));
});
