#!/usr/bin/env node
'use strict';
// Real compiled app, service worker and IndexedDB. No external requests allowed.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict'), { chromium } = require('playwright');
const bundle = path.resolve(__dirname, '../deploy/v6.4');
const screenshots = path.resolve(__dirname, '../docs/contract-gate/browser-delivery');
fs.mkdirSync(screenshots, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(bundle, 'release-manifest.json')));
let mode = 'good';
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const file = path.resolve(bundle, '.' + decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!file.startsWith(bundle + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile() ||
      (u.pathname === '/release-manifest.json' && mode === 'missing')) { res.writeHead(404); res.end(); return; }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (u.pathname === '/app.html' && u.searchParams.has('fixture')) {
    // The page is an older build fixture. The staged network target is the
    // unmodified compiled artifact whose digest the manifest actually names.
    res.end(fs.readFileSync(file, 'utf8').replace("value: '" + manifest.build + "'", "value: '" + 'b'.repeat(64) + "'"));
  } else if (u.pathname === '/app.html' && u.searchParams.has('stage') && mode === 'corrupt') res.end('Corrupted delivery');
  else fs.createReadStream(file).pipe(res);
});
async function setup(page) {
  await page.goto('/app.html?fixture=old#/today', { timeout: 120000 });
  await page.waitForFunction(() => window.__incommonApp?.state.ready, null, { timeout: 120000 });
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 60000 });
  await page.evaluate(async () => {
    const a = window.__incommonApp;
    // Auth is a host presentation fixture; the gate/network is not exercised.
    const original = window.InCommonCloud.status();
    const status = { ...original, userId: 'delivery-fixture', mode: 'cloud', upgradeRequired: true };
    a.cloud = Object.assign(Object.create(a.cloud || window.InCommonCloud), { status: () => status });
    await caches.open('unrelated-test-cache');
    a.setState({ cloudStatus: status, input: 'Writing before confirmed update' });
    a.cloudUpgradeRequired();
  });
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ args: ['--disable-webgl', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'] });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      mode = 'good';
      const context = await browser.newContext({ baseURL: origin, viewport });
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await context.addInitScript(() => { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
      await setup(page);
      await page.waitForFunction(() => window.__incommonApp.state.cloudUpdateReady && /saved on this device/.test(window.__incommonApp.state.cloudDraftMsg), null, { timeout: 120000 });
      const notice = page.locator('[data-cloud-update-notice]');
      const bounds = await notice.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
      for (const button of await notice.locator('button').all()) {
        const b = await button.boundingBox(); assert.ok(b.width >= 44 && b.height >= 44);
      }
      await page.screenshot({ path: path.join(screenshots, viewport.width + '-staged.png') });
      const before = page.url();
      await page.evaluate(() => {
        const f = document.createElement('textarea'); f.id = 'unmapped-update-writing'; f.value = 'Do not lose';
        f.style.cssText = 'position:fixed;bottom:5px;left:5px;width:120px;height:44px;z-index:300'; document.body.appendChild(f);
      });
      await page.getByRole('button', { name: 'Reload to update', exact: true }).click();
      await page.waitForFunction(() => /Reload blocked/.test(window.__incommonApp.state.cloudUpdateMsg));
      assert.equal(await page.getByRole('button', { name: 'Reload to update', exact: true }).isDisabled(), true);
      assert.equal(page.url(), before); assert.equal(await page.locator('#unmapped-update-writing').inputValue(), 'Do not lose');
      await page.locator('#unmapped-update-writing').evaluate(f => f.remove());
      await page.getByRole('button', { name: 'Check open forms', exact: true }).click();
      await page.waitForFunction(() => window.__incommonApp.state.cloudFormsReady);
      await context.setOffline(true);
      await page.getByRole('button', { name: 'Reload to update', exact: true }).click();
      await page.waitForFunction(build => window.__INCOMMON_BUILD_ID__ === build && window.__incommonApp?.state.ready, manifest.build, { timeout: 120000 });
      const boot = await page.evaluate(() => ({ boot: window.InCommonCloud.status().assetHandshake,
        intent: sessionStorage.getItem('incommon.update.intent.v1'), caches: null }));
      assert.equal(boot.boot.reason, 'STAGED_BOOT_VERIFIED'); assert.equal(boot.intent, null);
      assert.ok(!(new URL(page.url())).searchParams.has('ic_update'));
      await page.evaluate(() => {
        const a = window.__incommonApp;
        const status = { ...window.InCommonCloud.status(), userId: 'delivery-fixture', mode: 'cloud' };
        a.cloud = Object.assign(Object.create(a.cloud || window.InCommonCloud), { status: () => status });
        a.setState({ cloudStatus: status }); a.cloudRecoveryTrack();
      });
      await page.waitForFunction(() => window.__incommonApp.state.cloudDraftAvailable);
      await page.getByRole('button', { name: 'Restore writing drafts', exact: true }).click();
      await page.waitForFunction(() => window.__incommonApp.state.input === 'Writing before confirmed update');
      assert.ok((await page.evaluate(() => caches.keys())).includes('unrelated-test-cache'));
      await page.screenshot({ path: path.join(screenshots, viewport.width + '-restored.png') });
      assert.deepEqual(errors, []);
      console.log('PASS ' + viewport.width + ': live form block, offline staged navigation, build acknowledgment, explicit draft restore, unrelated cache retained');
      await context.close();
    }
    for (const failure of ['missing', 'corrupt']) {
      mode = failure;
      const context = await browser.newContext({ baseURL: origin });
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await context.addInitScript(() => { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); });
      const page = await context.newPage(); await setup(page);
      await page.waitForFunction(() => /No new verified/.test(window.__incommonApp.state.cloudUpdateMsg), null, { timeout: 120000 });
      assert.equal(await page.getByRole('button', { name: 'Reload to update', exact: true }).count(), 0);
      assert.equal(await page.evaluate(() => window.__incommonApp.state.input), 'Writing before confirmed update');
      console.log('PASS ' + failure + ': no reload offered, current writing retained'); await context.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error('FAIL ' + error.stack); server.close(); process.exitCode = 1; });
