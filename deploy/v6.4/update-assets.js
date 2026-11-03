/* Same-origin compiled-shell staging. No user records, auth or cache eviction. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UpdateAssets = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var PREFIX = 'incommon-update-v1-', AGE = 30 * 60 * 1000;
  function valid(m) {
    if (!m || m.schema !== 1 || m.release !== '2.9.7' || m.contract !== 'v2-composite-upsert' ||
        !/^[a-f0-9]{64}$/.test(m.build || '') || !m.app || m.app.path !== 'app.html' ||
        !/^[a-f0-9]{64}$/.test(m.app.sha256 || '') || !Number.isInteger(m.app.bytes) ||
        m.app.bytes < 1000 || m.app.bytes > 32 * 1024 * 1024) throw Error('Invalid update manifest');
    return m;
  }
  function create(env, scope) {
    var base = new URL(scope), appURL = new URL('app.html', base).href;
    var receiptURL = new URL('__incommon_stage_receipt__', base).href;
    async function digest(bytes) {
      var hash = await env.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    async function checked(response, m) {
      if (!response || !response.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) throw Error('Update shell unavailable');
      var bytes = await response.clone().arrayBuffer();
      if (bytes.byteLength !== m.app.bytes || await digest(bytes) !== m.app.sha256) throw Error('Update shell digest mismatch');
      return response;
    }
    async function fresh(url) {
      var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 25000);
      try {
        var r = await env.fetch(url, { cache: 'no-store', credentials: 'omit', redirect: 'error', signal: ctrl.signal });
        if (!r.ok || (r.url && new URL(r.url).origin !== base.origin)) throw Error('Update fetch failed');
        return r;
      } finally { clearTimeout(timer); }
    }
    return {
      stage: async function (currentBuild, recoverBoot) {
        var u = new URL('release-manifest.json', base); u.searchParams.set('stage', env.crypto.randomUUID());
        var response = await fresh(u.href), text = await response.text();
        if (text.length > 65536) throw Error('Update manifest too large');
        var m = valid(JSON.parse(text));
        if (m.build === currentBuild && !recoverBoot) throw Error('This build is already loaded. Keep working here.');
        var app = new URL(m.app.path, base); app.searchParams.set('stage', m.build);
        var shell = await checked(await fresh(app.href), m);
        var cache = await env.caches.open(PREFIX + m.build), at = Date.now();
        await cache.put(appURL, shell);
        /* Receipt is written last. An incomplete cache is never eligible. */
        await cache.put(receiptURL, new Response(JSON.stringify({ manifest: m, at: at }), { headers: { 'content-type': 'application/json' } }));
        return { build: m.build, release: m.release, contract: m.contract, at: at, recoverBoot: !!recoverBoot };
      },
      shell: async function (build) {
        if (!/^[a-f0-9]{64}$/.test(build || '')) throw Error('Invalid update build');
        var cache = await env.caches.open(PREFIX + build), receipt = await cache.match(receiptURL);
        if (!receipt) throw Error('Update is not staged');
        var saved = await receipt.json(), m = valid(saved.manifest);
        if (m.build !== build || !Number.isFinite(saved.at) || saved.at > Date.now() || Date.now() - saved.at > AGE) throw Error('Staged update expired');
        return checked(await cache.match(appURL), m);
      }
    };
  }
  return { valid: valid, create: create, maxAge: AGE };
}));
