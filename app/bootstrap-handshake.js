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
  return Object.freeze({ verify: verify });
}));
