#!/usr/bin/env node
'use strict';
// Actual source app, Chromium and IndexedDB. All external HTTP is blocked.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const repo = path.resolve(__dirname, '..');
const out = path.join(repo, 'docs/contract-gate/browser-ui');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.resolve(repo, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(repo + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ args: ['--disable-webgl'] });
  try {
    for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
      const context = await browser.newContext({ viewport });
      const errors = [];
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await context.addInitScript(() => {
        sessionStorage.setItem('incommon.guest.chosen', '1');
        sessionStorage.setItem('incommon.guest.default', '1');
      });
      const page = await context.newPage(); page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR ' + error.message); });
      await page.goto(origin + '/app/inCommonApp%20v2.dc.html#/today', { timeout: 120000 });
      await page.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
      const boot = await page.evaluate(() => {
        /* Initialize sync explicitly with a constructor fixture, independent
           of guest startup. No auth restoration or backend requests here. */
        window.supabase = { createClient() { return { auth: { onAuthStateChange() {} } }; } };
        window.InCommonCloud.init({ url: 'https://browser-fixture.invalid', anonKey: 'test-key',
          core: window.InCommonCore, pm: window.ProfileManager, storage: window.localStorage });
        return { token: window.__INCOMMON_RELEASE_TOKEN__, status: window.InCommonCloud.status().assetHandshake };
      });
      assert.equal(boot.token, '2.9.7'); assert.equal(boot.status.ok, true);
      await page.evaluate(() => {
        const a = window.__incommonApp;
        const status = { userId: 'browser-ui-fixture', mode: 'cloud', upgradeRequired: true };
        a.cloud = Object.assign(Object.create(a.cloud || {}), { status: () => status });
        a.setState({ cloudStatus: status, input: 'Unsent browser writing', cloudPassword: 'credential-not-to-copy' });
        a.cloudUpgradeRequired();
      });
      console.log(name + ': notice triggered');
      const notice = page.locator('[data-cloud-update-notice]');
      await notice.waitFor();
      await page.waitForFunction(() => /saved on this device/.test(window.__incommonApp.state.cloudDraftMsg));
      const record = await page.evaluate(async () => {
        const a = window.__incommonApp;
        return window.CloudUpdateDrafts.store().load(a.cloudRecoveryScope());
      });
      assert.equal(record.fields.input, 'Unsent browser writing');
      assert.equal(record.fields.cloudPassword, undefined);
      await page.evaluate(() => window.__incommonApp.setState({ cloudPassword: '' }));
      let formResult = await page.evaluate(() => window.__incommonApp.cloudRecoveryCheckForms());
      assert.equal(formResult.formsReady, true); assert.equal(formResult.allowed, false);
      await page.evaluate(() => {
        const unknown = document.createElement('textarea');
        unknown.id = 'unmapped-recovery-fixture'; unknown.value = 'Unmapped form writing';
        unknown.style.cssText = 'position:fixed;bottom:120px;left:12px;width:200px;height:50px;z-index:300';
        document.body.appendChild(unknown);
        unknown.dispatchEvent(new Event('input', { bubbles: true }));
      });
      assert.equal(await page.evaluate(() => window.__incommonApp.state.cloudFormsReady), false);
      formResult = await page.evaluate(() => window.__incommonApp.cloudRecoveryCheckForms());
      assert.equal(formResult.formsReady, false);
      assert.equal(formResult.reason, 'UNSUPPORTED_RETAINED_DATA');
      assert.equal(await page.locator('#unmapped-recovery-fixture').inputValue(), 'Unmapped form writing');
      await page.locator('#unmapped-recovery-fixture').evaluate(field => field.remove());
      formResult = await page.evaluate(() => window.__incommonApp.cloudRecoveryCheckForms());
      assert.equal(formResult.formsReady, true); assert.equal(formResult.reason, 'ASSETS_NOT_VERIFIED');
      assert.equal(await notice.locator('[role="dialog"]').count(), 0);
      const bounds = await notice.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
      for (const button of await notice.locator('button').all()) {
        const rect = await button.boundingBox(); assert.ok(rect.width >= 44 && rect.height >= 44);
      }
      await page.screenshot({ path: path.join(out, name + '-notice.png') });
      await notice.getByRole('button', { name: 'Keep working' }).click();
      await notice.waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => window.__incommonApp.state.input), 'Unsent browser writing');
      // Test-driven reload only. The product has no reload/eviction handler yet.
      await page.reload({ timeout: 120000 });
      await page.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
      await page.evaluate(() => {
        const a = window.__incommonApp;
        const status = { userId: 'browser-ui-fixture', mode: 'cloud', upgradeRequired: false };
        a.cloud = Object.assign(Object.create(a.cloud || {}), { status: () => status });
        a.setState({ cloudStatus: status }); a.cloudRecoveryTrack();
      });
      await page.waitForFunction(() => window.__incommonApp.state.cloudDraftAvailable);
      assert.equal(await page.evaluate(() => window.__incommonApp.state.input), '');
      await page.locator('[data-cloud-update-notice]').getByRole('button', { name: 'Restore writing drafts' }).click();
      await page.waitForFunction(() => window.__incommonApp.state.input === 'Unsent browser writing');
      assert.equal(await page.evaluate(() => window.__incommonApp.state.cloudPassword), '');
      await page.screenshot({ path: path.join(out, name + '-restored.png') });
      assert.deepEqual(errors, [], 'No page errors');
      console.log('PASS ' + name + ': actual bootstrap handshake, notice, IndexedDB/restore, credential exclusion, form readiness, unmapped-input lockout, 44px controls');
      await context.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error('FAIL ' + error.stack); server.close(); process.exitCode = 1; });
