/* User-confirmed reload coordinator. Never clears sync state or source records. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CloudUpdateDelivery = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var INTENT = 'incommon.update.intent.v1';
  function create(env) {
    var registration;
    function message(type, fields) {
      return new Promise(function (resolve, reject) {
        var worker = env.navigator.serviceWorker.controller;
        if (!registration || !worker || worker !== registration.active) { reject(Error('Update worker is not controlling this tab')); return; }
        var channel = new env.MessageChannel(), timer = setTimeout(function () { finish(Error('Update worker timed out')); }, 60000);
        function finish(error, value) {
          clearTimeout(timer); channel.port1.close(); channel.port2.close();
          if (error) reject(error); else resolve(value);
        }
        channel.port1.onmessage = function (e) { e.data && e.data.ok ? finish(null, e.data.result) : finish(Error('Update could not be verified')); };
        try { worker.postMessage(Object.assign({ type: type }, fields), [channel.port2]); }
        catch (e) { finish(e); }
      });
    }
    async function prepare() {
      if (!env.isSecureContext || !env.navigator.serviceWorker || !env.crypto.subtle ||
          !/^[a-f0-9]{64}$/.test(env.__INCOMMON_BUILD_ID__ || '')) throw Error('Update staging is unavailable here');
      registration = await env.navigator.serviceWorker.getRegistration(env.location.href);
      if (!registration || new URL(registration.scope).origin !== env.location.origin ||
          !registration.active || !/\/sw\.js$/.test(new URL(registration.active.scriptURL).pathname)) throw Error('No compatible update worker');
      await registration.update();
      var installing = registration.installing || registration.waiting;
      if (installing && installing.state !== 'activated') await new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { done(Error('Worker activation timed out')); }, 25000);
        function done(error) { clearTimeout(timer); installing.removeEventListener('statechange', change); error ? reject(error) : resolve(); }
        function change() { if (installing.state === 'activated') done(); else if (installing.state === 'redundant') done(Error('Worker activation failed')); }
        installing.addEventListener('statechange', change); change();
      });
    }
    return {
      stage: async function (options) {
        await prepare();
        var boot = env.InCommonCloud && env.InCommonCloud.status().assetHandshake;
        var recoverBoot = !!(options && options.confirmed && boot && !boot.ok && /^RELOAD_/.test(boot.reason));
        var receipt = await message('IC_STAGE', { currentBuild: env.__INCOMMON_BUILD_ID__, recoverBoot: recoverBoot });
        if (!receipt || !/^[a-f0-9]{64}$/.test(receipt.build || '') || receipt.release !== '2.9.7' ||
            receipt.contract !== 'v2-composite-upsert' || !Number.isFinite(receipt.at) || receipt.at > Date.now()) throw Error('Invalid update receipt');
        return receipt;
      },
      reload: async function (receipt, host) {
        if (!receipt || (receipt.build === env.__INCOMMON_BUILD_ID__ && !receipt.recoverBoot) || Date.now() - receipt.at > 30 * 60 * 1000) throw Error('Stage a new update first');
        var scope = host.scope(); if (!scope) throw Error('An active profile is required');
        var signature = JSON.stringify(scope);
        var worker = env.navigator.serviceWorker.controller;
        var verified = await message('IC_VERIFY', { build: receipt.build });
        if (!verified || verified.build !== receipt.build) throw Error('Update verification changed');
        var snapshot = await host.load(scope);
        if (signature !== JSON.stringify(host.scope()) || !host.active() ||
            env.navigator.serviceWorker.controller !== worker || registration.active !== worker) throw Error('Profile, page or worker changed');
        var destination = new URL('app.html', registration.scope);
        var attempt = env.crypto.randomUUID();
        destination.searchParams.set('ic_update', receipt.build); destination.searchParams.set('ic_attempt', attempt);
        if (env.location.hash && !/^#\//.test(env.location.hash)) throw Error('Finish signing in before updating');
        destination.hash = env.location.hash;
        env.sessionStorage.setItem(INTENT, JSON.stringify({ build: receipt.build, attempt: attempt,
          account: scope.account, profile: scope.profile, tab: scope.tab, expires: Date.now() + 10 * 60 * 1000 }));
        /* Nothing async, no state updates and no cache deletion between the
           final live form check and navigation. A button click is consent. */
        try {
          var result = host.guard(scope, snapshot);
          if (!result.formsReady) throw Error(result.message || 'Save open work before updating');
          env.location.assign(destination.href);
        } catch (e) { env.sessionStorage.removeItem(INTENT); throw e; }
      }
    };
  }
  return { create: create, intentKey: INTENT };
}));
