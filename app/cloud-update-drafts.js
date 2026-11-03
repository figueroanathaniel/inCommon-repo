/* Local recovery copies of writing drafts only. No network or load-time IO. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(null, require('./ui-registry'));
  else root.CloudUpdateDrafts = factory(root, root.SafeFormRegistry);
}(typeof self !== 'undefined' ? self : this, function (root, registry) {
  'use strict';
  var DB = 'incommon-update-drafts-v1', AGE = 24 * 60 * 60 * 1000;
  var pick = registry.pick;
  function scoped(scope) {
    if (!scope || ['account', 'profile', 'tab'].some(function (key) {
      return typeof scope[key] !== 'string' || !scope[key] || scope[key].length > 200;
    })) throw Error('A signed-in account, profile and tab are required');
    return JSON.stringify([scope.account, scope.profile, scope.tab]);
  }
  var restore = registry.restore;
  function create(indexedDB, now) {
    now = now || Date.now;
    var queue = Promise.resolve();
    function transaction(mode, run) {
      return new Promise(function (resolve, reject) {
        if (!indexedDB) { reject(Error('Local recovery storage is unavailable')); return; }
        var open, blocked = false;
        try { open = indexedDB.open(DB, 1); } catch (e) { reject(e); return; }
        open.onerror = function () { reject(open.error || Error('Cannot open recovery storage')); };
        open.onblocked = function () { blocked = true; reject(Error('Recovery storage is busy')); };
        open.onupgradeneeded = function () {
          if (!open.result.objectStoreNames.contains('drafts')) open.result.createObjectStore('drafts', { keyPath: 'id' });
        };
        open.onsuccess = function () {
          if (blocked) { open.result.close(); return; }
          var db = open.result, value, tx;
          try {
            tx = db.transaction('drafts', mode);
            tx.oncomplete = function () { db.close(); resolve(value); };
            tx.onabort = tx.onerror = function () { db.close(); reject(tx.error || Error('Draft transaction failed')); };
            run(tx.objectStore('drafts'), function (result) { value = result; });
          } catch (e) { if (tx) tx.abort(); db.close(); reject(e); }
        };
      });
    }
    function serial(run) {
      var pending = queue.then(run, run);
      queue = pending.catch(function () {});
      return pending;
    }
    function purge(predicate) {
      return serial(function () {
        return transaction('readwrite', function (store) {
          var request = store.openCursor();
          request.onsuccess = function () {
            var cursor = request.result;
            if (!cursor) return;
            if (predicate(cursor.value)) cursor.delete();
            cursor.continue();
          };
        });
      });
    }
    return {
      save: function (scope, state) {
        var id = scoped(scope), fields = pick(state), at = now();
        var record = { id: id, account: scope.account, profile: scope.profile, tab: scope.tab,
          at: at, expires: at + AGE, fields: fields };
        return serial(function () {
          return transaction('readwrite', function (store, done) {
            if (Object.keys(fields).length) store.put(record); else store.delete(id);
            done(record);
          });
        });
      },
      load: function (scope) {
        var id = scoped(scope);
        return purge(function (record) { return !record.expires || record.expires <= now(); }).then(function () {
          return serial(function () {
            return transaction('readonly', function (store, done) {
              var request = store.get(id);
              request.onsuccess = function () {
                var record = request.result;
                if (!record || record.account !== scope.account || record.profile !== scope.profile || record.tab !== scope.tab) { done(null); return; }
                record.fields = pick(record.fields || {});
                done(record);
              };
            });
          });
        });
      },
      remove: function (scope) {
        var id = scoped(scope);
        return serial(function () { return transaction('readwrite', function (store) { store.delete(id); }); });
      },
      removeProfile: function (id) { return purge(function (record) { return record.profile === id || record.expires <= now(); }); },
      removeAccount: function (id) { return purge(function (record) { return record.account === id || record.expires <= now(); }); }
    };
  }
  var singleton;
  return { pick: pick, restore: restore, create: create, maxAge: AGE,
    store: function () {
      if (!singleton) {
        var indexedDB;
        try { indexedDB = root && root.indexedDB; } catch (e) {}
        singleton = create(indexedDB);
      }
      return singleton;
    } };
}));
