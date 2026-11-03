/* Local boot compatibility evidence, not authentication or server acceptance. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BootstrapHandshake = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var RELEASE = '2.9.7', CONTRACT = 'v2-composite-upsert';
  function verify(token, runtime, transport) {
    var reason = null;
    if (token !== RELEASE) reason = 'DOCUMENT_RELEASE_MISMATCH';
    else if (!runtime || runtime.version !== RELEASE) reason = 'MODULE_RELEASE_MISMATCH';
    else if (runtime.contract !== CONTRACT || !transport ||
        !transport.global || !transport.global.headers ||
        transport.global.headers['X-InCommon-Write-Contract'] !== CONTRACT) reason = 'WRITE_CONTRACT_MISMATCH';
    else if (typeof runtime.push !== 'function' || typeof runtime.pull !== 'function') reason = 'SYNC_INTERFACE_UNAVAILABLE';
    return Object.freeze({ ok: !reason, reason: reason || 'LOCAL_BOOT_VERIFIED',
      release: RELEASE, contract: CONTRACT });
  }
  var INTENT = 'incommon.update.intent.v1';
  function verifyBrowser(env, runtime, transport) {
    var local = verify(env.__INCOMMON_RELEASE_TOKEN__, runtime, transport);
    if (!local.ok) return local;
    try {
      var url = env.location ? new URL(env.location.href) : null;
      var raw = env.sessionStorage && env.sessionStorage.getItem(INTENT);
      if (!raw && !(url && url.searchParams.has('ic_update'))) return local;
      var intent = JSON.parse(raw || 'null');
      if (!intent || !/^[a-f0-9]{64}$/.test(intent.build || '') || !intent.attempt ||
          !Number.isFinite(intent.expires) || intent.expires <= Date.now() ||
          !url || url.searchParams.get('ic_update') !== intent.build ||
          url.searchParams.get('ic_attempt') !== intent.attempt || env.__INCOMMON_BUILD_ID__ !== intent.build) {
        return Object.freeze({ ok: false, reason: 'RELOAD_BUILD_MISMATCH' });
      }
      return Object.freeze({ ok: true, reason: 'STAGED_BOOT_VERIFIED', build: intent.build, reload: true });
    } catch (e) { return Object.freeze({ ok: false, reason: 'RELOAD_CONTEXT_UNAVAILABLE' }); }
  }
  function acknowledge(env, result) {
    if (!result.ok || !result.reload) return;
    /* Only navigation bookkeeping is removed. The core's server-rejection
       latch, record arrays, hashes, deletion outbox and copies are untouched. */
    var url = new URL(env.location.href);
    url.searchParams.delete('ic_update'); url.searchParams.delete('ic_attempt');
    env.history.replaceState(env.history.state, '', url.href);
    env.sessionStorage.removeItem(INTENT);
  }
  return Object.freeze({ verify: verify, verifyBrowser: verifyBrowser, acknowledge: acknowledge });
}));
