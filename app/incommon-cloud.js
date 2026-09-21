/*! incommon-cloud.js: consent-gated sync between ProfileManager and Supabase (UMD).
 * The SAME file runs in the app (window.InCommonCloud) and in the test
 * suites (Node require), mirroring the module contract the repo keeps:
 * no test-time transforms, no load-time side effects.
 *
 * WHAT THIS MODULE IS. The single place where local state is allowed to leave
 * the device. It reads ProfileManager (profile-manager.js, V1.3.0 header
 * contract) as its only source of truth, subscribes to its events, and pushes
 * a consent-gated mirror of what changed. The app never calls Supabase
 * directly; if this module is absent, inert, or unsigned-in, the app is
 * exactly the offline-first program it was yesterday.
 *
 * WHAT THIS MODULE NEVER DOES:
 *   1. It never touches the network without a session.
 *   2. It never sends a memory whose consent gate is closed. The gate is read
 *      per push, per profile, from ProfileManager's own consent record, so a
 *      revocation takes effect on the next push, not on the next login. Rows
 *      marked kept (visible locally while consent is off) do NOT sync: kept
 *      is a local view courtesy, not permission to move the row.
 *   3. It never resurrects a deletion. profile:deleted and memory:deleted
 *      become outbox operations flushed on the next push, so a deletion
 *      cannot be outrun by a bad connection.
 *   4. It never sees the service key. The anon key is all it holds, and RLS
 *      is the wall, proven by the two-user isolation test of 2026-09-20.
 *   5. It never mints identifiers. ProfileManager already issues UUIDs; the
 *      local id IS the remote primary key, and memory rows carry their local
 *      ids, so sync bookkeeping is a hash cache, not an id map.
 *
 * SYNC MODEL, stated plainly: push is idempotent and consent-gated; pull is
 * whole-record and on demand (first sign-in of an existing device, the
 * migration pass). Multi-device conflict resolution is a later pass; the
 * local record wins by design because this app is local-first.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.InCommonCloud = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* The outer wrapper's `root` parameter is out of scope here: this function
     is a separate expression, evaluated where it is WRITTEN, not inside the
     wrapper it is passed into. Every root.* use below (lib(), the recovery
     session flag) was silently throwing ReferenceError, caught by this
     module's own try/catches, until the integration harness rewrite drove
     PIN recovery end to end and found it always failing. */
  var root = typeof self !== 'undefined' ? self : this;
  var VERSION = '2.0.0';

  /* Sync bookkeeping. Deliberately outside every ProfileManager key: export
     must not carry hashes, and deleting the app state must not orphan rows
     whose only address lived inside it. */
  var MAP_KEY = 'incommon_cloud_map_v2';
  var OUTBOX_KEY = 'incommon_cloud_outbox_v2';
  var RECOVERY_FLAG = 'incommon_pin_recovery';

  /* The local record writes in bursts (a reading saves several memories at
     once). One debounced push covers a burst; each row is still guarded by
     its content hash, so a delayed push never rewrites unchanged rows. */
  var DEBOUNCE_MS = 1200;

  /* ---------- small utilities ---------- */

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function canonical(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    var keys = Object.keys(v).sort();
    return '{' + keys.map(function (k) { return JSON.stringify(k) + ':' + canonical(v[k]); }).join(',') + '}';
  }
  function hashOf(v) { return fnv1a(canonical(v)); }

  /* ---------- storage helpers (never throw across the seam) ---------- */

  function readJSON(key, fallback) {
    try {
      var raw = cfg.storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { cfg.storage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  function loadMap() { return readJSON(MAP_KEY, { hashes: {} }); }
  function saveMap(m) { writeJSON(MAP_KEY, m); }
  function hashCache(m, table) { if (!m.hashes[table]) m.hashes[table] = {}; return m.hashes[table]; }
  function loadOutbox() { return readJSON(OUTBOX_KEY, []); }
  function saveOutbox(o) { writeJSON(OUTBOX_KEY, o); }

  /* ---------- module state ---------- */

  var cfg = null;       // { url, anonKey, storage, core, pm }
  var client = null;
  var session = null;
  var listeners = [];
  var timer = null;
  var lastPushAt = 0;

  function lib() { return (root && root.supabase) || null; }
  function uid() { return session && session.user ? session.user.id : null; }
  function notify() {
    var s = status();
    listeners.forEach(function (cb) { try { cb(s); } catch (e) {} });
  }

  /* ---------- consent gate ----------

     Read live from ProfileManager on every push. birthData is not a toggle:
     entering birth data is the consent, disclosed at creation, so profile
     rows always sync. Memories sync only when the consent they name is
     granted. The ledger and pairs always sync: they are governance records,
     and every device must be able to agree what was permitted. */
  function memoryAllowed(pm, pid, memoryType, consentRequired, kept) {
    if (!consentRequired) return true;
    var consents = pm.getConsents(pid);
    if (consents[consentRequired]) return true;
    /* kept rows stay visible locally while consent is off. That is a promise
       about this device, not permission to move the row off it. */
    return false;
  }

  /* ---------- plan building: ProfileManager state to remote rows ---------- */

  /* RAW PROFILE ROWS. pm._store() is named private by convention, not
     enforced, and the sync layer is the one legitimate outside reader: it
     needs pin_hash, which the public decorate path deliberately withholds.
     If _store is ever actually hidden, this is the single line that moves. */
  function buildPlan() {
    var pm = cfg.pm;
    var userId = uid();
    var store = pm._store();
    var map = loadMap();
    var plan = { profiles: [], memories: [], throughline: [], oki: [], consent: [], pairs: [], map: map };

    store.profiles.forEach(function (p) {
      plan.profiles.push({
        _key: p.id,
        _hash: hashOf(p),
        row: {
          id: p.id,
          account_id: userId,
          is_active: p.id === store.activeId,
          is_default: p.id === (store.defaultId || store.activeId),
          name: p.name || null,
          avatar_color: p.avatar_color || null,
          avatar_kind: p.avatar_kind || null,
          avatar_image: p.avatar_image || null,
          avatar_sign: p.avatar_sign || null,
          birth_date: p.birth_date || null,
          birth_time: p.birth_time || null,
          birth_location: p.birth_location || null,
          birth_lat: p.birth_lat == null ? null : p.birth_lat,
          birth_lon: p.birth_lon == null ? null : p.birth_lon,
          timezone: p.timezone || null,
          tz_offset: p.tz_offset == null ? null : p.tz_offset,
          location_resolved: !!p.location_resolved,
          birth_time_unknown: !!p.birth_time_unknown,
          pin_hash: p.pin_hash || null,
          updated_at: new Date().toISOString()
        }
      });

      /* Memories, gated per row by the consent they name. respectConsent is
         false on purpose: the sync layer applies its own gate and must see
         every row to decide, rather than inheriting the view filter. */
      pm.getMemory({ profileId: p.id, respectConsent: false }).forEach(function (m) {
        if (!memoryAllowed(pm, p.id, m.memoryType, m.consentRequired, m.kept)) return;
        plan.memories.push({
          _key: p.id + '/' + m.id,
          _hash: hashOf(m),
          row: {
            profile_id: p.id,
            local_id: m.id,
            memory_type: m.memoryType,
            content: m.content == null ? {} : m.content,
            created_at: m.createdAt || new Date().toISOString(),
            is_private: !!m.isPrivate,
            consent_required: m.consentRequired || null,
            kept: !!m.kept
          }
        });
      });

      /* Manual Throughline entries and the Oki conversation live under keys
         the ProfileManager header documents. Both are arrays when present.
         Items may lack stable ids, so the dedupe key is content hash plus
         occurrence count, stable under append and under deletion of other
         items. */
      ['throughline', 'oki'].forEach(function (which) {
        var arr = readJSON('incommon.p.' + p.id + '.' + which, []);
        if (!Array.isArray(arr)) arr = arr ? [arr] : [];
        var gate = which === 'throughline' ? 'journal' : 'conversation';
        if (!pm.getConsents(p.id)[gate]) return;
        var bucket = which === 'throughline' ? plan.throughline : plan.oki;
        var seen = {};
        arr.forEach(function (item) {
          var h = hashOf(item);
          var n = seen[h] || 0; seen[h] = n + 1;
          bucket.push({
            _key: p.id + '/' + h + '#' + n,
            _hash: h,
            row: {
              profile_id: p.id,
              local_id: (item && item.id) ? String(item.id) : null,
              payload: item == null ? {} : item,
              created_at: (item && item.created_at) ? item.created_at : new Date().toISOString()
            }
          });
        });
      });

      /* The consent ledger. The unique (profile_id, scope, ts) constraint
         makes replay harmless: the same event upserts to itself. */
      var rec = readJSON('incommon.consent.' + p.id, null);
      if (rec && Array.isArray(rec.events)) {
        rec.events.forEach(function (e) {
          if (!e || !e.id) return;
          plan.consent.push({
            _key: p.id + '/' + e.id + '/' + e.ts,
            _hash: hashOf(e),
            row: {
              profile_id: p.id,
              scope: String(e.id),
              action: e.granted ? 'grant' : 'revoke',
              via: 'user',
              ts: e.ts || new Date().toISOString()
            }
          });
        });
      }
    });

    /* Two-person consent binds profiles, not the account, but the row is
       account scoped in the schema because both parties are this user's
       profiles or cards held by them. */
    (store.pairs || []).forEach(function (pr) {
      plan.pairs.push({
        _key: pr.key,
        _hash: hashOf(pr),
        row: {
          account_id: userId,
          profile_a: pr.a,
          profile_b: pr.b,
          enabled: !!pr.enabled,
          enabled_by: pr.enabled_by || null,
          enabled_at: pr.enabled_at || null
        }
      });
    });

    return plan;
  }

  /* ---------- push ---------- */

  function ensureAccountRow(userId) {
    return client.from('accounts').insert({ id: userId }).then(function (res) {
      if (res.error) {
        var dup = res.error.code === '409' || /duplicate|exists/i.test(res.error.message || '');
        if (!dup) return { ok: false, error: res.error.message };
      }
      return { ok: true };
    });
  }

  /* Upsert one table. The schema's unique constraints do the dedupe, and the
     hash cache skips rows that have not changed, so a push after a quiet
     week touches nothing. */
  function pushTable(table, items, onConflict) {
    var map = loadMap();
    var cache = hashCache(map, table);
    var chain = Promise.resolve({ ok: true, sent: 0, skipped: 0 });
    items.forEach(function (item) {
      chain = chain.then(function (acc) {
        if (cache[item._key] === item._hash) { acc.skipped++; return acc; }
        return client.from(table).upsert(item.row, { onConflict: onConflict }).then(function (res) {
          if (res.error) { acc.ok = false; acc.error = res.error.message; return acc; }
          cache[item._key] = item._hash;
          acc.sent++;
          return acc;
        });
      });
    });
    return chain.then(function (acc) { saveMap(map); return acc; });
  }

  function push() {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    var userId = uid();
    if (!userId) return Promise.resolve({ ok: false, reason: 'no-session' });

    var plan = buildPlan();
    return ensureAccountRow(userId).then(function (acc) {
      if (!acc.ok) return acc;
      return pushTable('profiles', plan.profiles, 'id').then(function (r) {
        if (!r.ok) return r;
        return pushTable('consent_events', plan.consent, 'profile_id,scope,ts').then(function (r2) {
          if (!r2.ok) return r2;
          return pushTable('pairs', plan.pairs, 'profile_a,profile_b').then(function (r3) {
            if (!r3.ok) return r3;
            return pushTable('memories', plan.memories, 'profile_id,local_id').then(function (r4) {
              if (!r4.ok) return r4;
              return pushTable('throughline_entries', plan.throughline, 'id').then(function (r5) {
                if (!r5.ok) return r5;
                return pushTable('oki_messages', plan.oki, 'id');
              });
            });
          });
        });
      });
    }).then(function (acc) {
      if (acc.ok) { lastPushAt = Date.now(); return flushOutbox().then(function () { return acc; }); }
      return acc;
    }).catch(function (e) {
      return { ok: false, reason: 'offline', error: e && e.message };
    });
  }

  function schedule() {
    if (!client) return;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; push(); }, DEBOUNCE_MS);
  }

  /* ---------- outbox: deletions cannot be outrun ---------- */

  function queueOp(op) {
    var o = loadOutbox();
    var sig = op.op + ':' + (op.pid || '') + ':' + (op.type || '');
    if (!o.some(function (x) { return (x.op + ':' + (x.pid || '') + ':' + (x.type || '')) === sig; })) {
      o.push(op);
      saveOutbox(o);
    }
  }

  function flushOutbox() {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    var userId = uid();
    if (!userId) return Promise.resolve({ ok: false, reason: 'no-session' });
    var o = loadOutbox();
    if (!o.length) return Promise.resolve({ ok: true });
    var chain = Promise.resolve({ ok: true });
    var remaining = [];
    o.forEach(function (op) {
      chain = chain.then(function (acc) {
        if (!acc.ok) { remaining.push(op); return acc; }
        if (op.op === 'del-profile') {
          return client.from('profiles').delete().eq('id', op.pid).then(function (res) {
            if (res.error) { acc.ok = false; acc.error = res.error.message; remaining.push(op); }
            return acc;
          });
        }
        if (op.op === 'del-memories') {
          var q = client.from('memories').delete().eq('profile_id', op.pid);
          if (op.type) q = q.eq('memory_type', op.type);
          return q.then(function (res) {
            if (res.error) { acc.ok = false; acc.error = res.error.message; remaining.push(op); }
            return acc;
          });
        }
        return acc;
      });
    });
    return chain.then(function (acc) { saveOutbox(remaining); return acc; });
  }

  /* ---------- pull: whole-record fetch, gated the same way push is ---------- */

  function pullAll() {
    if (!client) return Promise.resolve(null);
    if (!uid()) return Promise.resolve(null);
    var result = { profiles: [], tables: {} };
    return client.from('profiles').select('*').then(function (res) {
      if (!res.error && Array.isArray(res.data)) result.profiles = res.data;
      var chain = Promise.resolve(result);
      ['consent_events', 'pairs', 'memories', 'throughline_entries', 'oki_messages'].forEach(function (t) {
        chain = chain.then(function () {
          return client.from(t).select('*').then(function (r2) {
            result.tables[t] = r2.error ? [] : r2.data;
          });
        });
      });
      return chain;
    }).then(function () { return result; }).catch(function () { return null; });
  }

  /* ---------- PIN recovery through the account email ----------

     The PIN is a courtesy gate; the email is the root of trust. Recovery
     re-proves ownership with a magic link, then recomputes the same digest
     ProfileManager stores (pm.pinHash(pin, profileId), the id as salt) for
     every profile of the account and writes the hashes remotely. The PIN
     itself never travels. */
  function startPinRecovery(email) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    try { root.sessionStorage.setItem(RECOVERY_FLAG, '1'); } catch (e) {}
    return client.auth.signInWithOtp({ email: email }).then(function (res) {
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true };
    }).catch(function (e) { return { ok: false, error: e && e.message }; });
  }

  function isRecoverySession() {
    try { return root.sessionStorage && root.sessionStorage.getItem(RECOVERY_FLAG) === '1' && !!uid(); }
    catch (e) { return false; }
  }

  function completePinRecovery(pin) {
    if (!isRecoverySession()) return Promise.resolve({ ok: false, reason: 'not-recovery-session' });
    if (!cfg.pm || typeof cfg.pm.pinHash !== 'function') return Promise.resolve({ ok: false, reason: 'no-pm' });
    var chain = Promise.resolve({ ok: true });
    cfg.pm._store().profiles.forEach(function (p) {
      chain = chain.then(function (acc) {
        if (!acc.ok) return acc;
        return client.from('profiles').update({ pin_hash: cfg.pm.pinHash(pin, p.id), pin_updated_at: new Date().toISOString() })
          .eq('id', p.id).then(function (res) {
            if (res.error) { acc.ok = false; acc.error = res.error.message; }
            return acc;
          });
      });
    });
    return chain.then(function (acc) {
      if (acc.ok) { try { root.sessionStorage.removeItem(RECOVERY_FLAG); } catch (e) {} }
      return acc;
    }).catch(function (e) { return { ok: false, error: e && e.message }; });
  }

  /* ---------- auth wrappers ---------- */

  function normalize(p) {
    return p.then(function (res) {
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true, data: res.data };
    }).catch(function (e) { return { ok: false, error: e && e.message }; });
  }

  /* ---------- status ---------- */

  function status() {
    if (!client) return { mode: 'off', VERSION: VERSION };
    return {
      mode: session ? 'cloud' : 'local',
      email: session && session.user ? session.user.email : null,
      lastPushAt: lastPushAt || null,
      pendingOps: loadOutbox().length,
      VERSION: VERSION
    };
  }

  /* ---------- init ---------- */

  function init(opts) {
    if (!opts || !opts.url || !opts.anonKey || !opts.core || !opts.pm || !opts.storage) return null;
    if (typeof opts.pm._store !== 'function' || typeof opts.pm.getMemory !== 'function') return null;
    var l = lib();
    if (!l || typeof l.createClient !== 'function') return null; // vendored library absent: stay inert
    cfg = { url: opts.url, anonKey: opts.anonKey, storage: opts.storage, core: opts.core, pm: opts.pm };
    client = l.createClient(opts.url, opts.anonKey);

    /* THE SEAM. Any ProfileManager event means the local record changed, and
       every change is a push candidate. Deletions are queued, not pushed, so
       a wipe is never re-uploaded by the debounce that follows it. */
    try {
      opts.pm.subscribe(function (name, detail) {
        if (name === 'profile:deleted' && detail && detail.id) queueOp({ op: 'del-profile', pid: detail.id });
        else if (name === 'memory:deleted' && detail) queueOp({ op: 'del-memories', pid: detail.profileId || (cfg.pm.activeId && cfg.pm.activeId()), type: detail.type || null });
        schedule();
      });
    } catch (e) {}

    client.auth.onAuthStateChange(function (_event, s) {
      var had = !!session;
      session = s || null;
      notify();
      if (session && !had) push();
    });
    return api;
  }

  var api = {
    VERSION: VERSION,
    init: init,
    status: status,
    onSessionChange: function (cb) { if (typeof cb === 'function') listeners.push(cb); },
    signUp: function (email, password) { return normalize(client.auth.signUp({ email: email, password: password })); },
    signIn: function (email, password) { return normalize(client.auth.signInWithPassword({ email: email, password: password })); },
    signOut: function () { return normalize(client.auth.signOut()); },
    schedule: schedule,
    push: push,
    pullAll: pullAll,
    startPinRecovery: startPinRecovery,
    isRecoverySession: isRecoverySession,
    completePinRecovery: completePinRecovery,
    /* inspect() reports what the plan would push, without pushing. Run it
       against a live session in step 4: counts that read zero where the app
       plainly has data are a consent gate working as designed, and counts
       that read zero where consent is on are a mapping bug. */
    inspect: function () {
      if (!cfg || !uid()) return null;
      var plan = buildPlan();
      var counts = { profiles: plan.profiles.length, memories: plan.memories.length,
        throughline: plan.throughline.length, oki: plan.oki.length,
        consent: plan.consent.length, pairs: plan.pairs.length };
      var pm = cfg.pm;
      var raw = 0, gatedOut = 0;
      pm.listProfiles().forEach(function (p) {
        var all = pm.getMemory({ profileId: p.id, respectConsent: false });
        raw += all.length;
        all.forEach(function (m) { if (!memoryAllowed(pm, p.id, m.memoryType, m.consentRequired, m.kept)) gatedOut++; });
      });
      return { counts: counts, rawMemories: raw, excludedByConsent: gatedOut, pendingOps: loadOutbox().length };
    },
    /* Test hooks: run-module-tests.js injects these instead of the vendored
       library and a live ProfileManager, so every gate and outbox path runs
       in Node. */
    _setClientForTests: function (c, s) { client = c; session = s || null; },
    _setConfigForTests: function (o) { cfg = o; }
  };

  return api;
}));
