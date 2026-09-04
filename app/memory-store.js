/*! memory-store.js: inCommon MemoryStore V1.0 (UMD, pure JS, no deps).
 * Oki's memory, device-local, encrypted at rest.
 *   - IndexedDB storage; values AES-GCM-encrypted with a key derived from the
 *     user's passphrase (PBKDF2-SHA256, 250k iters). Key lives in memory only.
 *   - Granular consent per data type, so reads/writes by actor 'oki' are
 *     checked against the shared consent record ('incommon.consent', schema v2,
 *     same one ConsentManager writes). The user always owns their store.
 *   - Automatic expiration: 30 / 90 / 365 days, user-configurable; expired
 *     records are swept on unlock and lazily on read.
 *   - Export as JSON (explicit user action only), complete deletion per type.
 *   - Audit log: 'Oki accessed your Journal Entries on <date> for <purpose>'.
 * NOTHING here touches the network. Conversation content is never stored
 * server-side; memory leaves this device only via an explicit user export.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.MemoryStore = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DB_NAME = 'incommon.memory', DB_VER = 1, ITERS = 250000, CONSENT_KEY = 'incommon.consent';
  var TYPES = { birthData: 'Birth Data', journal: 'Journal Entries', relationships: 'Relationships', assessments: 'Assessments', mood: 'Mood Check-ins', conversation: 'Conversation History' };
  var RETENTION_OPTIONS = [30, 90, 365];
  var KEY = null; // CryptoKey, in-memory only, never persisted, dropped on lock()
  var dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = function (e) {
        var d = e.target.result;
        var s = d.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
        s.createIndex('type', 'type');
        d.createObjectStore('meta', { keyPath: 'k' });
        d.createObjectStore('audit', { keyPath: 'id', autoIncrement: true });
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function req(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function store(name, mode) { return open().then(function (db) { return db.transaction(name, mode).objectStore(name); }); }

  function metaGet(k) { return store('meta', 'readonly').then(function (s) { return req(s.get(k)); }).then(function (v) { return v ? v.v : null; }); }
  function metaSet(k, v) { return store('meta', 'readwrite').then(function (s) { return req(s.put({ k: k, v: v })); }); }

  // ---- crypto ----------------------------------------------------------------
  var te = new TextEncoder(), td = new TextDecoder();
  function b64(buf) { var b = ''; new Uint8Array(buf).forEach(function (x) { b += String.fromCharCode(x); }); return btoa(b); }
  function unb64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; }
  function deriveKey(passphrase, saltBuf) {
    return crypto.subtle.importKey('raw', te.encode(String(passphrase)), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltBuf, iterations: ITERS, hash: 'SHA-256' }, base,
        { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function enc(value) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, KEY, te.encode(JSON.stringify(value)))
      .then(function (ct) { return { iv: b64(iv.buffer), ct: b64(ct) }; });
  }
  function dec(rec) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(unb64(rec.iv)) }, KEY, unb64(rec.ct))
      .then(function (pt) { return JSON.parse(td.decode(pt)); });
  }

  // ---- consent (shared record with ConsentManager) ---------------------------
  function readConsent() {
    var out = {}; for (var t in TYPES) out[t] = false;
    try {
      var raw = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (raw && raw.consents) for (var k in TYPES) out[k] = !!(raw.consents[k] && raw.consents[k].granted);
      else if (raw && raw.version === 1) for (var k2 in TYPES) out[k2] = !!raw[k2];
    } catch (e) {}
    return out;
  }
  function setConsent(type, granted) {
    if (!TYPES[type]) return Promise.reject(errOf('unknown-type'));
    var now = new Date().toISOString(), raw = null;
    try { raw = JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch (e) {}
    if (!raw || !raw.consents) {
      raw = { schemaVersion: 2, updatedAt: now, migratedFrom: null, consents: {}, events: [] };
      for (var k in TYPES) raw.consents[k] = { granted: false, updatedAt: null };
    }
    raw.consents[type] = { granted: !!granted, updatedAt: now };
    raw.updatedAt = now;
    raw.events = (raw.events || []).concat([{ ts: now, id: type, granted: !!granted }]).slice(-50);
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(raw)); } catch (e) {}
    return audit('user', type, granted ? 'consent-on' : 'consent-off', 'consent switch');
  }

  // ---- audit ------------------------------------------------------------------
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return iso; } }
  function audit(actor, type, action, purpose, n) {
    return store('audit', 'readwrite').then(function (s) {
      return req(s.add({ ts: new Date().toISOString(), actor: actor, type: type, action: action, purpose: purpose || '', n: n || null }));
    }).then(function () {
      return store('audit', 'readonly').then(function (s) { return req(s.count()); });
    }).then(function (c) {
      if (c > 500) return store('audit', 'readwrite').then(function (s) {
        return req(s.openCursor()).then(function (cur) { if (cur) cur.delete(); });
      });
    }).catch(function () {}); // audit-trim failure is never fatal to the operation itself
  }
  function auditLine(e) {
    var label = TYPES[e.type] || e.type || 'the store', date = fmtDate(e.ts);
    if (e.action === 'read' && e.actor === 'oki') return 'Oki accessed your ' + label + ' on ' + date + ' for \u201C' + (e.purpose || 'unspecified') + '\u201D.';
    if (e.action === 'denied') return 'Oki was denied access to your ' + label + ' on ' + date + ' (consent off). The stated purpose was \u201C' + (e.purpose || 'unspecified') + '\u201D.';
    if (e.action === 'write') return (e.actor === 'oki' ? 'Oki added to' : 'You added to') + ' your ' + label + ' on ' + date + (e.purpose ? ', for ' + e.purpose : '') + '.';
    if (e.action === 'read') return 'You viewed your ' + label + ' on ' + date + '.';
    if (e.action === 'delete') return 'You permanently deleted your ' + label + ' (' + (e.n || 0) + ' records) on ' + date + '.';
    if (e.action === 'export') return 'You exported your data as JSON on ' + date + '. That is the only way memory leaves this device.';
    if (e.action === 'sweep') return 'Retention sweep expired ' + (e.n || 0) + ' record' + (e.n === 1 ? '' : 's') + ' on ' + date + '.';
    if (e.action === 'consent-on') return 'You granted Oki access to ' + label + ' on ' + date + '.';
    if (e.action === 'consent-off') return 'You revoked Oki\u2019s access to ' + label + ' on ' + date + '.';
    if (e.action === 'unlock') return 'Store unlocked on ' + date + '. Key derived, held in memory only.';
    if (e.action === 'lock') return 'Store locked on ' + date + '. Key dropped from memory.';
    return e.actor + ' ' + e.action + ' ' + label + ' on ' + date + '.';
  }
  function getAudit(limit) {
    return store('audit', 'readonly').then(function (s) { return req(s.getAll()); }).then(function (all) {
      return all.reverse().slice(0, limit || 50).map(function (e) { return { ts: e.ts, actor: e.actor, action: e.action, line: auditLine(e) }; });
    });
  }

  // ---- lock / unlock ----------------------------------------------------------
  function errOf(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function isUnlocked() { return !!KEY; }
  function unlock(passphrase) {
    if (!passphrase || String(passphrase).length < 4) return Promise.reject(errOf('weak-passphrase', 'Use at least 4 characters.'));
    return metaGet('salt').then(function (salt) {
      var saltBuf = salt ? unb64(salt) : crypto.getRandomValues(new Uint8Array(16)).buffer;
      var fresh = !salt;
      return deriveKey(passphrase, saltBuf).then(function (key) {
        KEY = key;
        if (fresh) {
          return metaSet('salt', b64(saltBuf)).then(function () { return enc('incommon-sentinel'); })
            .then(function (s) { return metaSet('sentinel', s); });
        }
        return metaGet('sentinel').then(function (s) {
          if (!s) return enc('incommon-sentinel').then(function (x) { return metaSet('sentinel', x); });
          return dec(s).catch(function () { KEY = null; throw errOf('wrong-passphrase', 'That passphrase doesn\u2019t open this store.'); });
        });
      });
    }).then(function () { return audit('user', null, 'unlock'); })
      .then(function () { return sweepExpired(); })
      .then(function (n) { return { unlocked: true, swept: n }; });
  }
  function lock() { KEY = null; return audit('user', null, 'lock').then(function () { return { unlocked: false }; }); }

  // ---- retention ---------------------------------------------------------------
  function getRetention() { return metaGet('retentionDays').then(function (d) { return RETENTION_OPTIONS.indexOf(d) >= 0 ? d : 90; }); }
  function setRetention(days) {
    if (RETENTION_OPTIONS.indexOf(days) < 0) return Promise.reject(errOf('bad-retention', 'Use 30, 90, or 365.'));
    return metaSet('retentionDays', days).then(function () {
      // re-stamp every record from its createdAt, then sweep
      return store('records', 'readwrite').then(function (s) { return req(s.getAll()).then(function (all) {
        all.forEach(function (r) { r.expiresAt = r.createdAt + days * 86400000; s.put(r); });
        return all.length;
      }); });
    }).then(function () { return sweepExpired(); }).then(function (n) { return { retentionDays: days, swept: n }; });
  }
  function sweepExpired() {
    var now = Date.now();
    return store('records', 'readwrite').then(function (s) { return req(s.getAll()).then(function (all) {
      var dead = all.filter(function (r) { return r.expiresAt && r.expiresAt < now; });
      dead.forEach(function (r) { s.delete(r.id); });
      return dead.length;
    }); }).then(function (n) { if (n > 0) return audit('system', null, 'sweep', '', n).then(function () { return n; }); return n; });
  }

  // ---- data ops -----------------------------------------------------------------
  function assertType(t) { if (!TYPES[t]) throw errOf('unknown-type', 'Unknown data type: ' + t); }
  function write(type, value, opts) {
    opts = opts || {};
    var actor = opts.actor || 'user';
    try { assertType(type); } catch (e) { return Promise.reject(e); }
    if (!KEY) return Promise.reject(errOf('locked', 'Unlock the store first.'));
    if (actor === 'oki' && !readConsent()[type]) {
      return audit('oki', type, 'denied', opts.purpose).then(function () { throw errOf('consent-denied', 'Consent for ' + TYPES[type] + ' is off.'); });
    }
    return getRetention().then(function (days) {
      return enc(value).then(function (e) {
        var now = Date.now();
        return store('records', 'readwrite').then(function (s) {
          return req(s.add({ type: type, iv: e.iv, ct: e.ct, createdAt: now, expiresAt: now + days * 86400000 }));
        });
      });
    }).then(function (id) { return audit(actor, type, 'write', opts.purpose).then(function () { return { id: id }; }); });
  }
  function readAll(type, opts) {
    opts = opts || {};
    var actor = opts.actor || 'user';
    try { assertType(type); } catch (e) { return Promise.reject(e); }
    if (!KEY) return Promise.reject(errOf('locked', 'Unlock the store first.'));
    if (actor === 'oki' && !readConsent()[type]) {
      return audit('oki', type, 'denied', opts.purpose).then(function () { throw errOf('consent-denied', 'Consent for ' + TYPES[type] + ' is off.'); });
    }
    var now = Date.now();
    return store('records', 'readonly').then(function (s) { return req(s.index('type').getAll(type)); }).then(function (recs) {
      var live = recs.filter(function (r) { return !r.expiresAt || r.expiresAt >= now; });
      return Promise.all(live.map(function (r) { return dec(r).then(function (v) { return { id: r.id, createdAt: r.createdAt, expiresAt: r.expiresAt, value: v }; }); }));
    }).then(function (out) { return audit(actor, type, 'read', opts.purpose).then(function () { return out; }); });
  }
  function deleteType(type) {
    try { assertType(type); } catch (e) { return Promise.reject(e); }
    return store('records', 'readwrite').then(function (s) { return req(s.index('type').getAllKeys(type)).then(function (keys) {
      keys.forEach(function (k) { s.delete(k); });
      return keys.length;
    }); }).then(function (n) { return audit('user', type, 'delete', '', n).then(function () { return { deleted: n }; }); });
  }
  function counts() {
    return store('records', 'readonly').then(function (s) { return req(s.getAll()); }).then(function (all) {
      var now = Date.now(), out = {};
      for (var t in TYPES) out[t] = { count: 0, nextExpiry: null };
      all.forEach(function (r) {
        if (!out[r.type]) return;
        if (r.expiresAt && r.expiresAt < now) return;
        out[r.type].count++;
        if (!out[r.type].nextExpiry || r.expiresAt < out[r.type].nextExpiry) out[r.type].nextExpiry = r.expiresAt;
      });
      return out;
    });
  }
  function rawSample() {
    return store('records', 'readonly').then(function (s) { return req(s.getAll()); }).then(function (all) {
      if (!all.length) return null;
      var r = all[0];
      return { id: r.id, type: r.type, iv: r.iv, ct: String(r.ct).slice(0, 64) + '\u2026', note: 'ciphertext as stored, nothing legible without the key' };
    });
  }
  function exportJSON() {
    if (!KEY) return Promise.reject(errOf('locked', 'Unlock to export. Export decrypts, and only you can do it.'));
    var types = Object.keys(TYPES);
    return Promise.all(types.map(function (t) {
      var now = Date.now();
      return store('records', 'readonly').then(function (s) { return req(s.index('type').getAll(t)); }).then(function (recs) {
        return Promise.all(recs.filter(function (r) { return !r.expiresAt || r.expiresAt >= now; }).map(dec));
      });
    })).then(function (lists) {
      var data = {}; types.forEach(function (t, i) { data[t] = lists[i]; });
      return Promise.all([getRetention(), getAudit(100)]).then(function (rl) {
        return audit('user', null, 'export').then(function () {
          return { app: 'inCommon', kind: 'memory-export', exportedAt: new Date().toISOString(),
            retentionDays: rl[0], consent: readConsent(), data: data, auditLog: rl[1].map(function (a) { return a.line; }) };
        });
      });
    });
  }

  return { unlock: unlock, lock: lock, isUnlocked: isUnlocked, write: write, readAll: readAll, deleteType: deleteType,
    setConsent: setConsent, getConsent: readConsent, setRetention: setRetention, getRetention: getRetention,
    sweepExpired: sweepExpired, exportJSON: exportJSON, getAudit: getAudit, counts: counts, rawSample: rawSample,
    TYPES: TYPES, RETENTION_OPTIONS: RETENTION_OPTIONS, VERSION: '1.0' };
}));
