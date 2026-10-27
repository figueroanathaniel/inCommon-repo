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
 *   1. It never touches the network without a session, with one exception
 *      the reader asks for by pressing a button: signing in, making an
 *      account or asking for a new password on the cover, by email or by
 *      phone, checking a code a text brought or an authenticator app shows,
 *      and taking the session an emailed link brings back. None of those calls carries any local state;
 *      the record only moves once the app's own client exists.
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
 * SYNC MODEL, stated plainly: push is idempotent and consent-gated; pull
 * brings the whole account down and merges it in, so one account reads the
 * same on every device it signs in on. sync() is pull then push, run when a
 * session starts and whenever the app asks (it asks when the page comes back
 * into view). The merge is three way, and the hash cache is the common base:
 * a row whose local copy still hashes to what this device last synced has
 * not been touched here, so the server's copy is newer and is taken; a row
 * changed here since keeps the local copy, and the push that follows sends
 * it. A row this device synced before and the server no longer holds was
 * deleted on another device, and goes here too, except on a device's first
 * pull (below). Nothing a pull applies is a local act, so it never queues a
 * deletion back up.
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
  var VERSION = '2.9.3';

  /* The project's own url and anon key, as data rather than machinery: no
     environment file, no build-time injection, no separate secrets module.
     init() falls back to these when a caller does not supply its own (the
     Node test suites always do, through _setClientForTests/_setConfigForTests,
     so this pair is reached only by the real app). The anon key is meant to
     ship here; RLS is the wall, proven by the two-user isolation test of
     2026-09-20. service_role must never appear in this file or anywhere else
     in the repo. */
  var PROJECT_URL = 'https://lkzcybzhjjxdqetwwdrx.supabase.co';
  var PROJECT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxremN5Ynpoamp4ZHFldHd3ZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTYwMDcsImV4cCI6MjEwNTQzMjAwN30.jgsqfpPmbd2SM23R-E7KuRg3eWxsgvIhISBkhYC0mtM';

  /* Sync bookkeeping. Deliberately outside every ProfileManager key: export
     must not carry hashes, and deleting the app state must not orphan rows
     whose only address lived inside it. */
  var MAP_KEY = 'incommon_cloud_map_v2';
  /* Rows fetched per request. PostgREST answers at most 1000 rows unless the
     project raises it, so a pull pages rather than trusting one answer to be
     the whole account. */
  var PAGE = 500;
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
  /* A session whose password passed and whose code has not been entered yet
     (two-step sign in, below). It is kept here rather than in session, so
     every call that asks for a session finds none, and the app reads as
     signed out until the cover has the code. */
  var held = null;
  var listeners = [];
  var timer = null;
  var lastPushAt = 0;
  var lastPullAt = 0;
  var pulling = null;   // the pull in flight, which a push waits behind
  var syncing = null;   // the sync in flight, so two never overlap

  function lib() { return (root && root.supabase) || null; }
  function uid() { return session && session.user ? session.user.id : null; }
  function notify() {
    var s = status();
    listeners.forEach(function (cb) { try { cb(s); } catch (e) {} });
  }

  /* ---------- the memory types the server accepts ----------

     public.memories carries a check constraint naming exactly these four
     (server/cloud-schema.sql). A row of any other type is refused, and one
     refused upsert stops the whole push: the memories after it, the
     Throughline and the deletion outbox never go up. The Archive writes
     archive_deleted rows, so a reader who deleted one entry stopped syncing
     for good. Those rows are this device's own record of what was deleted
     and stay here; only these four types travel. K69 holds this list equal
     to the constraint, so the two cannot drift apart unnoticed. */
  var SYNC_MEMORY_TYPES = ['journal', 'mood', 'practice_completion', 'stella_conversation'];

  /* ---------- consent gate ----------

     Read live from ProfileManager on every push. birthData is not a toggle:
     entering birth data is the consent, disclosed at creation, so profile
     rows always sync. Memories sync only when the consent they name is
     granted. The ledger and pairs always sync: they are governance records,
     and every device must be able to agree what was permitted.

     A row that names no consent is held to its type's, the same fallback
     getMemory() reads with. Restoring an entry from the Archive writes it back
     with consent_required null, and before 27 October 2026 that row passed
     this gate whatever its type's consent said: a restored journal entry went
     up with journal off (K71). */
  function memoryAllowed(pm, pid, memoryType, consentRequired, kept) {
    var need = consentRequired || (typeof pm.consentFor === 'function' ? pm.consentFor(memoryType) : null);
    if (!need) return true;
    var consents = pm.getConsents(pid);
    if (consents[need]) return true;
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
        if (SYNC_MEMORY_TYPES.indexOf(m.memoryType) === -1) return;
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
    /* A push that ran while a pull was writing would hash a half merged
       record. It waits; the pull's own sync:pulled event schedules it anyway. */
    if (pulling) return pulling.then(function () { return push(); });

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

  function opSig(x) { return x.op + ':' + (x.pid || '') + ':' + (x.type || '') + ':' + (x.id || ''); }
  function queueOp(op) {
    var o = loadOutbox();
    var sig = opSig(op);
    if (!o.some(function (x) { return opSig(x) === sig; })) {
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
        /* One entry, by the id it carries both here and on the server. Before
           the id travelled with the event, deleting one journal entry queued
           del-memories with no type, which deleted every memory the profile
           had on the server. */
        if (op.op === 'del-memory') {
          return client.from('memories').delete().eq('profile_id', op.pid).eq('local_id', op.id).then(function (res) {
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

  /* ---------- pull: the account, brought down and merged in ----------

     Four rules carry the weight.

     A FAILED READ APPLIES NOTHING. Every table is read before anything is
     written, and one error anywhere returns a reason with the record exactly as
     it was. A table that failed must never read as a table that is empty,
     because empty is what a deletion looks like.

     AN EMPTY ACCOUNT DELETES NOTHING. A server holding no profiles is a new
     account, or one whose rows did not come back; either way it is no evidence
     that this device's profiles were deleted elsewhere.

     A DEVICE'S FIRST PULL DELETES NOTHING EITHER. Before this version, deleting
     one journal entry deleted every memory its profile had on the server (see
     del-memory above), while this device's hash cache still says they were
     sent. Read as deletions made elsewhere, that bug's damage would spread to
     this device too. So on the first pull, a row the cache says was sent and
     the server lacks is sent again rather than deleted: the cache entry is
     dropped and the push that follows uploads it. From the second pull on, an
     absence is a deletion.

     A PENDING LOCAL DELETION WINS. The outbox is flushed before reading, and
     anything still queued is skipped on the way in, so a deletion made offline
     is not undone by the pull that runs when the signal comes back. */
  function fetchAll(table, filter) {
    var rows = [];
    function page(from) {
      var q = client.from(table).select('*');
      if (filter) q = filter(q);
      var paged = typeof q.range === 'function';
      if (paged && typeof q.order === 'function') q = q.order('id', { ascending: true });
      if (paged) q = q.range(from, from + PAGE - 1);
      return Promise.resolve(q).then(function (res) {
        if (!res || res.error) throw new Error((res && res.error && res.error.message) || 'no answer');
        var got = Array.isArray(res.data) ? res.data : [];
        rows = rows.concat(got);
        /* Until a page comes back empty, not until one comes back short: a
           project whose row limit is under PAGE answers every page short. */
        return paged && got.length ? page(from + got.length) : rows;
      });
    }
    return page(0);
  }
  function iso(x) {
    var t = Date.parse(x);
    return isNaN(t) ? (x || new Date().toISOString()) : new Date(t).toISOString();
  }
  function str(v) { return v == null ? '' : String(v); }
  /* The columns a profile row carries, as the local profile spells them. A
     string the push sent as null comes back as the empty string the local
     record writes, so a row that only went up and came back reads unchanged. */
  var PROFILE_TEXT = ['avatar_color', 'avatar_image', 'avatar_sign', 'birth_date', 'birth_time', 'birth_location', 'timezone'];
  var PROFILE_NUM = ['birth_lat', 'birth_lon', 'tz_offset'];
  var PROFILE_BOOL = ['location_resolved', 'birth_time_unknown'];
  var BIRTH = ['birth_date', 'birth_time', 'birth_location', 'birth_lat', 'birth_lon', 'tz_offset', 'timezone', 'birth_time_unknown'];
  function profileFromRow(row, base) {
    var p = Object.assign({}, base || {}), changed = false;
    function put(k, v, same) { if (!same(p[k], v)) { p[k] = v; changed = true; } }
    var txt = function (a, b) { return str(a) === str(b); };
    var num = function (a, b) { return (a == null ? null : Number(a)) === (b == null ? null : Number(b)); };
    var bool = function (a, b) { return !!a === !!b; };
    if (!p.id) { p.id = row.id; changed = true; }
    if (row.name && row.name !== p.name) { p.name = row.name; changed = true; }
    PROFILE_TEXT.forEach(function (k) { put(k, str(row[k]), txt); });
    PROFILE_NUM.forEach(function (k) { put(k, row[k] == null ? null : Number(row[k]), num); });
    PROFILE_BOOL.forEach(function (k) { put(k, !!row[k], bool); });
    put('avatar_kind', row.avatar_kind || 'initials', function (a, b) { return (a || 'initials') === b; });
    put('pin_hash', row.pin_hash || null, function (a, b) { return (a || null) === b; });
    if (!p.created_at) p.created_at = iso(row.created_at);
    if (!p.name) p.name = 'Profile';
    return { profile: p, changed: changed };
  }
  function birthMoved(a, b) {
    return BIRTH.some(function (k) { return str(a && a[k]) !== str(b && b[k]); });
  }
  function hydrateRow(r) {
    var pm = cfg.pm;
    if (typeof pm._hydrate === 'function') return pm._hydrate(r);
    var c = r.content; try { c = JSON.parse(r.content); } catch (e) {}
    return { id: r.id, profileId: r.profile_id, type: r.memory_type, memoryType: r.memory_type, content: c,
      createdAt: r.created_at, isPrivate: !!r.is_private, consentRequired: r.consent_required || null, kept: !!r.kept };
  }

  function pull() {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    var userId = uid();
    if (!userId) return Promise.resolve({ ok: false, reason: 'no-session' });
    if (!cfg || !cfg.pm || typeof cfg.pm.importSynced !== 'function') return Promise.resolve({ ok: false, reason: 'off' });
    if (pulling) return pulling;
    var remote = {};
    pulling = flushOutbox().catch(function () {}).then(function () {
      return fetchAll('profiles', function (q) { return typeof q.eq === 'function' ? q.eq('account_id', userId) : q; });
    }).then(function (rows) {
      remote.profiles = rows;
      var ids = rows.map(function (r) { return r.id; });
      var byProfile = function (q) { return typeof q.in === 'function' ? q.in('profile_id', ids) : q; };
      if (!ids.length) { remote.consent_events = []; remote.memories = []; remote.throughline_entries = []; remote.oki_messages = []; }
      var chain = Promise.resolve();
      ['consent_events', 'memories', 'throughline_entries', 'oki_messages'].forEach(function (t) {
        if (!ids.length) return;
        chain = chain.then(function () { return fetchAll(t, byProfile).then(function (r) { remote[t] = r; }); });
      });
      return chain.then(function () {
        return fetchAll('pairs', function (q) { return typeof q.eq === 'function' ? q.eq('account_id', userId) : q; });
      }).then(function (r) { remote.pairs = r; });
    }).then(function () {
      var res = merge(remote, userId);
      lastPullAt = Date.now();
      notify();
      if (cfg.onPulled) { try { cfg.onPulled(res); } catch (e) {} }
      return res;
    }, function (e) {
      var msg = (e && e.message) || '';
      return { ok: false, reason: /fetch|network|offline|Failed/i.test(msg) ? 'offline' : 'error', error: msg };
    });
    return pulling.then(function (r) { pulling = null; return r; }, function (e) { pulling = null; throw e; });
  }

  function merge(remote, userId) {
    var pm = cfg.pm, store = pm._store(), map = loadMap();
    /* Per account: a device that pulled for one account has not pulled for
       the next one to sign in on it. */
    map.pulled = map.pulled || {};
    var firstPull = !map.pulled[userId];
    var cP = hashCache(map, 'profiles'), cM = hashCache(map, 'memories'), cC = hashCache(map, 'consent_events');
    var cT = hashCache(map, 'throughline_entries'), cO = hashCache(map, 'oki_messages'), cR = hashCache(map, 'pairs');
    var outbox = loadOutbox();
    var pendingProfile = {}, pendingMem = {}, pendingType = {};
    outbox.forEach(function (op) {
      if (op.op === 'del-profile') pendingProfile[op.pid] = 1;
      if (op.op === 'del-memory') pendingMem[op.pid + '/' + op.id] = 1;
      if (op.op === 'del-memories') pendingType[op.pid + '/' + (op.type || '*')] = 1;
    });
    var placeholders = [];
    if (cfg.placeholders) { try { placeholders = cfg.placeholders() || []; } catch (e) { placeholders = []; } }
    var isPlaceholder = function (id) { return placeholders.indexOf(id) !== -1; };

    var d = { profiles: [], removeProfiles: [], pairs: [], memories: {}, consents: {}, lists: {}, recalc: [] };
    var res = { ok: true, changed: false, adopted: false, firstPull: firstPull,
      profilesAdded: 0, profilesUpdated: 0, profilesRemoved: 0, memoriesAdded: 0, memoriesRemoved: 0, entriesAdded: 0 };

    /* ---- profiles ---- */
    var localById = {};
    store.profiles.forEach(function (p) { localById[p.id] = p; });
    var remoteRows = remote.profiles.filter(function (r) { return r && r.id && !pendingProfile[r.id]; });
    var remoteById = {};
    remoteRows.forEach(function (r) { remoteById[r.id] = r; });
    var ownBefore = store.profiles.filter(function (p) { return !isPlaceholder(p.id); });
    var serverHas = remoteRows.length > 0;
    var room = (pm.MAX_PROFILES || 6) - ownBefore.length;
    remoteRows.forEach(function (r) {
      var L = localById[r.id];
      if (L) {
        /* Changed here since the last sync: the local copy wins and the push
           sends it. Untouched here: the server's copy is the newer one. */
        if (cP[r.id] !== hashOf(L)) return;
        var m = profileFromRow(r, L);
        if (!m.changed) return;
        d.profiles.push(m.profile);
        if (birthMoved(L, m.profile)) d.recalc.push(r.id);
        cP[r.id] = hashOf(m.profile);
        res.profilesUpdated++;
        return;
      }
      if (cP[r.id] && !firstPull) return;  // deleted here; the outbox is carrying it up
      if (room <= 0) return;
      var made = profileFromRow(r, null).profile;
      d.profiles.push(made);
      cP[r.id] = hashOf(made);
      room--;
      res.profilesAdded++;
    });
    store.profiles.forEach(function (L) {
      if (remoteById[L.id] || !serverHas) return;
      if (isPlaceholder(L.id)) return;
      if (cP[L.id] === undefined) return;          // never synced: new here, the push sends it
      if (firstPull) { delete cP[L.id]; return; }   // send it again rather than trust an absence
      if (cP[L.id] !== hashOf(L)) return;           // changed here since: keep it, the push restores it
      d.removeProfiles.push(L.id);
      delete cP[L.id];
      res.profilesRemoved++;
    });
    /* A stand in (the sample a blank device invents) gives way once the account
       brings a profile of its own. If it ever reached the server, it goes there
       too. */
    if (remoteRows.some(function (r) { return !isPlaceholder(r.id); })) {
      placeholders.forEach(function (id) {
        if (!localById[id] || remoteById[id]) return;
        d.removeProfiles.push(id);
        delete cP[id];
      });
    }
    /* A device with nothing of its own opens on what the account had. */
    if (!ownBefore.length && res.profilesAdded) {
      res.adopted = true;
      var pick = remoteRows.filter(function (r) { return r.is_default; })[0] || remoteRows.filter(function (r) { return r.is_active; })[0] || remoteRows[0];
      d.activeId = pick.id;
      d.defaultId = (remoteRows.filter(function (r) { return r.is_default; })[0] || pick).id;
    }
    /* Profiles that will exist once this lands. */
    var gone = {};
    d.removeProfiles.forEach(function (id) { gone[id] = 1; });
    var present = {};
    store.profiles.forEach(function (p) { if (!gone[p.id]) present[p.id] = 1; });
    d.profiles.forEach(function (p) { if (!gone[p.id]) present[p.id] = 1; });

    /* ---- consent ledger: union by event, the latest event decides ---- */
    remote.consent_events.forEach(function (r) {
      if (!present[r.profile_id] || !r.scope) return;
      var e = { ts: iso(r.ts), id: String(r.scope), granted: r.action === 'grant' };
      (d.consents[r.profile_id] = d.consents[r.profile_id] || []).push(e);
      cC[r.profile_id + '/' + e.id + '/' + e.ts] = hashOf(e);
    });

    /* ---- memories ---- */
    var remoteMem = {};
    remote.memories.forEach(function (r) {
      if (!present[r.profile_id] || r.local_id == null) return;
      (remoteMem[r.profile_id] = remoteMem[r.profile_id] || {})[String(r.local_id)] = r;
    });
    Object.keys(present).forEach(function (pid) {
      var local = localById[pid] ? pm.getMemory({ profileId: pid, respectConsent: false }) : [];
      var have = {}, rm = remoteMem[pid] || {}, add = [], remove = [];
      local.forEach(function (m) { have[m.id] = m; });
      Object.keys(rm).forEach(function (id) {
        if (have[id]) return;
        var r = rm[id], key = pid + '/' + id;
        if (pendingMem[key] || pendingType[pid + '/' + r.memory_type] || pendingType[pid + '/*']) return;
        if (cM[key] && !firstPull) return;  // deleted here
        var raw = { id: id, profile_id: pid, memory_type: r.memory_type,
          content: JSON.stringify(r.content == null ? {} : r.content), created_at: iso(r.created_at),
          is_private: r.is_private ? 1 : 0, consent_required: r.consent_required || null };
        if (r.kept) raw.kept = 1;
        add.push(raw);
        cM[key] = hashOf(hydrateRow(raw));
      });
      /* Only for a profile the server still holds: one it no longer holds is
         either deleted (and goes whole, above) or changed here and kept, and
         its rows are not the server's to remove. */
      if (localById[pid] && remoteById[pid]) {
        local.forEach(function (m) {
          var key = pid + '/' + m.id;
          if (rm[m.id] || cM[key] === undefined) return;
          if (firstPull) { delete cM[key]; return; }
          if (cM[key] !== hashOf(m)) return;
          remove.push(m.id);
          delete cM[key];
        });
      }
      if (add.length || remove.length) {
        d.memories[pid] = { add: add, remove: remove };
        res.memoriesAdded += add.length;
        res.memoriesRemoved += remove.length;
      }
    });

    /* ---- Throughline entries and the Oki log: appended, never edited ----
       Their rows carry the whole item, keyed here by content hash and
       occurrence, exactly as buildPlan keys them, so what comes down is
       recorded as already sent and is never uploaded a second time. */
    [['throughline_entries', 'throughline', cT], ['oki_messages', 'oki', cO]].forEach(function (spec) {
      var byPid = {};
      remote[spec[0]].forEach(function (r) {
        if (!present[r.profile_id] || r.payload == null) return;
        (byPid[r.profile_id] = byPid[r.profile_id] || []).push(r.payload);
      });
      Object.keys(byPid).forEach(function (pid) {
        var arr = localById[pid] ? readJSON('incommon.p.' + pid + '.' + spec[1], []) : [];
        if (!Array.isArray(arr)) arr = arr ? [arr] : [];
        var count = {}, ids = {}, add = [];
        arr.forEach(function (it) {
          var h = hashOf(it); count[h] = (count[h] || 0) + 1;
          if (it && it.id != null) ids[String(it.id)] = 1;
        });
        var seenRemote = {};
        byPid[pid].forEach(function (it) {
          var h = hashOf(it), n = seenRemote[h] || 0;
          seenRemote[h] = n + 1;
          var key = pid + '/' + h + '#' + n;
          if (n < (count[h] || 0)) { spec[2][key] = h; return; }      // already here
          if (it && it.id != null && ids[String(it.id)]) { spec[2][key] = h; return; }
          if (spec[2][key] && !firstPull) return;                      // removed here
          add.push(it);
          count[h] = (count[h] || 0) + 1;
          spec[2][key] = h;
        });
        if (add.length) {
          (d.lists[pid] = d.lists[pid] || {})[spec[1]] = add;
          res.entriesAdded += add.length;
        }
      });
    });

    /* ---- two-person consent ---- */
    var localPairs = {};
    (store.pairs || []).forEach(function (pr) { localPairs[pr.key] = pr; });
    remote.pairs.forEach(function (r) {
      if (!r || !r.profile_a || !r.profile_b) return;
      var key = [r.profile_a, r.profile_b].sort().join('::');
      var L = localPairs[key];
      var pr = { key: key, a: r.profile_a, b: r.profile_b, enabled: r.enabled ? 1 : 0,
        enabled_by: r.enabled_by || null, enabled_at: r.enabled_at ? iso(r.enabled_at) : null };
      if (L) {
        if (cR[key] !== hashOf(L)) return;
        if (!!L.enabled === !!pr.enabled && (L.enabled_by || null) === pr.enabled_by) return;
        pr.a = L.a; pr.b = L.b;
      } else if (cR[key] && !firstPull) return;
      d.pairs.push(pr);
      cR[key] = hashOf(pr);
    });

    res.changed = !!(d.profiles.length || d.removeProfiles.length || d.pairs.length || res.memoriesAdded || res.memoriesRemoved ||
      res.entriesAdded || Object.keys(d.consents).some(function (pid) { return consentNews(pid, d.consents[pid]); }));
    if (res.changed) pm.importSynced(d);
    map.pulled[userId] = new Date().toISOString();
    saveMap(map);
    return res;
  }
  /* True when the server's ledger holds an event this device has not seen. */
  function consentNews(pid, events) {
    var rec = readJSON('incommon.consent.' + pid, null), seen = {}, local = (rec && rec.events) || [];
    local.forEach(function (e) { seen[e.id + '@' + iso(e.ts)] = 1; });
    /* The device keeps the last fifty events and the server keeps them all, so
       an event older than everything kept here was trimmed here, not missed. */
    var floor = local.length >= 50 ? Math.min.apply(null, local.map(function (e) { return Date.parse(e.ts) || 0; })) : -Infinity;
    return events.some(function (e) { return !seen[e.id + '@' + e.ts] && Date.parse(e.ts) >= floor; });
  }

  /* Pull, then push: what the account holds comes down first, so a device
     never uploads a placeholder over an account it has not read yet. */
  function sync() {
    if (syncing) return syncing;
    syncing = pull().then(function (pr) {
      return push().then(function (ps) { return { ok: !!(pr.ok && ps.ok), pull: pr, push: ps }; });
    }).then(function (r) { syncing = null; return r; }, function (e) { syncing = null; return { ok: false, reason: 'error', error: e && e.message }; });
    return syncing;
  }

  /* ---------- PIN recovery through the account email ----------

     The PIN is a courtesy gate; the email is the root of trust. Recovery
     re-proves ownership with a magic link, then recomputes the same digest
     ProfileManager stores (pm.pinHash(pin, profileId), the id as salt) for
     every profile of the account and writes the hashes remotely. The PIN
     itself never travels. */
  function startPinRecovery(email) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    /* Recovery must not be satisfiable by a session that already exists.
       Before this cleared it, a signed-in browser reached isRecoverySession()
       the instant this ran - the flag went true and uid() was already
       truthy from the existing session, so completePinRecovery() was
       reachable before the email was ever sent, let alone opened. Clearing
       the session here, synchronously, before the flag is set, is what
       makes that check trustworthy: it can only become true again once a
       fresh sign-in actually happens, through the link this sends. */
    session = null;
    try { root.sessionStorage.setItem(RECOVERY_FLAG, '1'); } catch (e) {}
    return client.auth.signOut().catch(function () {}).then(function () {
      return client.auth.signInWithOtp({ email: email });
    }).then(function (res) {
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true };
    }).catch(function (e) { return { ok: false, error: e && e.message }; });
  }

  /* True from the moment startPinRecovery sends its email until the emailed
     link is actually opened: the flag is set but no session has reached
     this browser yet. The UI's waiting state reads this. */
  function isRecoveryPending() {
    try { return !!(root.sessionStorage && root.sessionStorage.getItem(RECOVERY_FLAG) === '1' && !uid()); }
    catch (e) { return false; }
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

  /* ---------- signing in on the cover, with a password ----------

     An email and a password, since 29 September 2026. The emailed sign in
     link came before it and was replaced at the owner's request, because it
     only finished in the browser that asked for it: the PKCE code verifier
     lives there, and an email opened on the phone, or in the mail app's own
     browser, arrived with nothing to finish it. Google sign in was here too
     and was taken out the same day.

     The cover is its own page with no ProfileManager, so none of these need
     init(). They share only the project and the browser's storage with the
     app's client: supabase-js writes the session to localStorage under the key
     it derives from the project url, and the client init() makes on the app
     page finds it there.

     THE ONE CLIENT HERE IS ON THE IMPLICIT FLOW, and that is what lets every
     email this page causes work in any browser. A password sign in returns a
     session at once and needs no flow at all; the two emails, confirming a new
     address and choosing a new password, come back with the tokens after the
     #, and tokens need no verifier. The # is the app's router, so the cover's
     hash forward leaves a hash carrying tokens alone and the cover adopts them
     itself (adoptSession), then drops them from the address.

     It does not read the url by itself (detectSessionInUrl off), so a token
     is taken only where the cover chose to take it. The app's own client is
     implicit too, by the library defaults, which K20 holds. */
  var coverClient = null;
  function coverLib() {
    if (coverClient) return coverClient;
    var l = lib();
    if (!l || typeof l.createClient !== 'function') return null;
    coverClient = l.createClient(PROJECT_URL, PROJECT_ANON_KEY, {
      auth: { flowType: 'implicit', detectSessionInUrl: false, persistSession: true, autoRefreshToken: false }
    });
    return coverClient;
  }

  var EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* A PHONE NUMBER IS A LOGIN TOO, since the owner asked on 30 September 2026
     for signing in by phone and for recovering a password by text. The cover
     has one field for both, so every function below takes what was typed and
     asks idOf() which it is: an email if it has the shape of one, a phone if
     it has only digits and the punctuation people write numbers with.

     Supabase wants a phone in E.164, a plus and the country code. People type
     (555) 123-4567. Ten digits with no plus are read as a US number, eleven
     starting with 1 likewise, and a leading 00 is the international prefix.
     Anything else needs the country code written, and the cover says so,
     because guessing a country is how a text goes to a stranger. */
  var PHONE_SHAPE = /^\+[1-9]\d{7,14}$/;
  function normPhone(raw) {
    var s = String(raw || '').trim();
    if (!s || /[a-z@]/i.test(s) || !/^[+\d\s().-]+$/.test(s)) return null;
    var plus = s.charAt(0) === '+', d = s.replace(/\D/g, '');
    if (!plus && d.slice(0, 2) === '00') { d = d.slice(2); plus = true; }
    if (!plus) {
      if (d.length === 10) d = '1' + d;
      else if (!(d.length === 11 && d.charAt(0) === '1')) return null;
    }
    var e = '+' + d;
    return PHONE_SHAPE.test(e) ? e : null;
  }
  function idOf(raw) {
    var s = String(raw || '').trim();
    if (EMAIL_SHAPE.test(s)) return { email: s };
    var p = normPhone(s);
    return p ? { phone: p } : null;
  }
  /* Supabase keeps a phone without its plus. */
  function phoneOfUser(u) { return u && u.phone ? '+' + String(u.phone).replace(/^\+/, '') : null; }
  /* Eight, stated rather than left to the project's own floor of six. A
     project that asks for more still refuses a shorter one, and that comes
     back as weak. */
  var PASSWORD_MIN = 8;

  /* Every refusal is a reason the cover can say in words. The code decides
     first where Supabase sends one, and the message only where it does not,
     because older projects answer with the message alone. The order matters
     once: a new password equal to the old one is refused with a sentence that
     also matches the weak one. */
  function authReason(e) {
    var m = String((e && e.message) || ''), code = String((e && e.code) || '');
    if (e && e.status === 429 || /rate limit|too many/i.test(m) || /rate_limit/.test(code)) return 'rate';
    if (e && (e.name === 'AuthRetryableFetchError' || /failed to fetch|network/i.test(m))) return 'offline';
    if (code === 'phone_provider_disabled' || /unsupported phone provider|phone (signups|logins|provider)[^.]*disabled/i.test(m)) return 'phoneOff';
    if (code === 'sms_send_failed' || /error sending (confirmation |phone change |recovery )?(sms|otp)/i.test(m)) return 'smsFailed';
    if (code === 'otp_expired' || /token has expired or is invalid/i.test(m)) return 'badCode';
    if (code === 'mfa_verification_failed' || code === 'mfa_challenge_expired' || /invalid totp code/i.test(m)) return 'badCode';
    if (code === 'insufficient_aal' || /aal2 (session )?(is )?required/i.test(m)) return 'needsCode';
    if (/^mfa_.*not_enabled$/.test(code)) return 'mfaOff';
    if (code === 'phone_not_confirmed' || /phone not confirmed/i.test(m)) return 'phoneUnconfirmed';
    if (code === 'phone_exists' || /phone number has already been registered/i.test(m)) return 'phoneTaken';
    if (/invalid phone/i.test(m)) return 'invalid';
    if (code === 'invalid_credentials' || /invalid login credentials/i.test(m)) return 'wrong';
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(m)) return 'unconfirmed';
    if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(m)) return 'exists';
    if (code === 'same_password' || /different from the old/i.test(m)) return 'same';
    if (code === 'weak_password' || (e && e.name === 'AuthWeakPasswordError') || /password should/i.test(m)) return 'weak';
    if (code === 'signup_disabled' || /signups not allowed/i.test(m)) return 'closed';
    if (code === 'captcha_failed' || /captcha/i.test(m)) return 'captcha';
    return 'error';
  }
  function authCall(run) {
    return Promise.resolve().then(run).catch(function (e) {
      return { error: { name: e && e.name, message: (e && e.message) || 'failed to fetch' } };
    });
  }
  function refused(res) {
    return { ok: false, reason: authReason(res.error), error: String(res.error.message || '') };
  }
  /* CLOUDFLARE TURNSTILE, since 11 October 2026. With CAPTCHA protection on in
     the project, Supabase refuses five calls that arrive without a token:
     password sign in, sign up, the reset email, a text code and a resend
     (the server's own /token for the password grant, /signup, /recover, /otp
     and /resend). Checking a code, refreshing a session, finishing an emailed
     link and the two-step code are not asked for one. The cover gets the token
     from the widget and hands it in as opts.captchaToken; a token is good once,
     so the cover asks for a fresh one per call. With no token the calls are
     sent exactly as before, which is what lets the page ship before the
     project turns the check on. */
  function cap(opts) { var t = opts && opts.captchaToken; return t ? String(t) : null; }

  function passwordSignIn(login, password, opts) {
    var id = idOf(login);
    if (!id) return Promise.resolve({ ok: false, reason: 'invalid' });
    if (!password) return Promise.resolve({ ok: false, reason: 'nopassword' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    return authCall(function () {
      var cred = id.email ? { email: id.email, password: String(password) } : { phone: id.phone, password: String(password) };
      if (cap(opts)) cred.options = { captchaToken: cap(opts) };
      return c.auth.signInWithPassword(cred);
    }).then(function (res) {
      if (res && res.error) return refused(res);
      var s = res && res.data && res.data.session;
      if (!s) return { ok: false, reason: 'error', error: 'no session returned' };
      return gate(s, { ok: true, email: (s.user && s.user.email) || id.email || null, phone: phoneOfUser(s.user) || id.phone || null });
    });
  }

  /* THE NEWSLETTER CHOICE RIDES ON THE SIGN UP, AND ONLY ON IT.

     The cover asks with a box that starts ticked and can be unticked, shown
     only while an account is being made, and the answer goes to Supabase as
     user metadata through signUp's options.data, which Supabase writes only
     when the call creates the account. So it is recorded once, at creation,
     as the owner asked. Nothing is sent to a mailing list from here: the list
     is read out of the project by the owner (docs/NEWSLETTER-SETUP.md). Absent
     opts leave the call without it, so a caller that does not ask records
     nothing.

     Three answers, because Supabase gives three. With email confirmation on,
     which is the project default, a new address gets a link and no session
     (confirm). With it off, the session comes back at once (signedIn). And an
     address that already has a confirmed account is answered, deliberately,
     like a new one, so the address cannot be tested for an account by
     anybody: the only tell is a user with no identities, which is reported
     as exists so the reader is sent to sign in rather than told to check an
     email that will never come. */

  /* Where a sign up came from: the utm tags the cover kept, cleaned again
     here because the module must not trust its caller. Four known keys,
     short plain words, or nothing at all. K25b. */
  function fromOf(opts) {
    var f = opts && opts.from, out = {}, any = false;
    if (!f || typeof f !== 'object') return null;
    ['source', 'medium', 'campaign', 'content'].forEach(function (k) {
      var v = typeof f[k] === 'string' ? f[k].toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 40) : '';
      if (v) { out[k] = v; any = true; }
    });
    return any ? out : null;
  }

  function passwordSignUp(login, password, redirectTo, opts) {
    var id = idOf(login);
    if (!id) return Promise.resolve({ ok: false, reason: 'invalid' });
    if (String(password || '').length < PASSWORD_MIN) return Promise.resolve({ ok: false, reason: 'short' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    /* By phone, Supabase texts a code rather than emailing a link, and the
       cover asks for it (phoneCodeCheck). There is no newsletter answer to
       carry: the list is read by email, and a phone account has none. */
    if (id.phone) {
      return authCall(function () {
        var up = { phone: id.phone, password: String(password) };
        if (cap(opts)) up.options = { captchaToken: cap(opts) };
        if (fromOf(opts)) { up.options = up.options || {}; up.options.data = { signup_from: fromOf(opts) }; }
        return c.auth.signUp(up);
      }).then(function (res) {
        if (res && res.error) return refused(res);
        var d = (res && res.data) || {};
        if (d.session) return { ok: true, signedIn: true, phone: phoneOfUser(d.session.user) || id.phone };
        if (d.user && Array.isArray(d.user.identities) && d.user.identities.length === 0) return { ok: false, reason: 'exists' };
        return { ok: true, confirm: true, via: 'phone', phone: id.phone };
      });
    }
    var addr = id.email;
    var options = { emailRedirectTo: redirectTo };
    if (cap(opts)) options.captchaToken = cap(opts);
    if (opts && typeof opts.newsletter === 'boolean') {
      options.data = { newsletter: opts.newsletter, newsletter_source: opts.source === 'app-register' ? 'app-register' : 'cover-signup', newsletter_decided_at: new Date().toISOString() };
    }
    if (fromOf(opts)) { options.data = options.data || {}; options.data.signup_from = fromOf(opts); }
    /* The registration card in the app (26 October 2026) asks for a phone
       number as well, marked optional. It is not a login: it rides with the
       account as metadata, in E.164 and only when it reads as a number, and
       signing in by phone still needs the number confirmed by text from the
       profile card. A number that does not read as one is refused before
       anything is sent. */
    if (opts && opts.phone != null && String(opts.phone).trim()) {
      var contact = normPhone(opts.phone);
      if (!contact) return Promise.resolve({ ok: false, reason: 'badPhone' });
      options.data = options.data || {};
      options.data.contact_phone = contact;
    }
    return authCall(function () {
      return c.auth.signUp({ email: addr, password: String(password), options: options });
    }).then(function (res) {
      if (res && res.error) return refused(res);
      var d = (res && res.data) || {};
      if (d.session) return { ok: true, signedIn: true, email: (d.session.user && d.session.user.email) || addr };
      if (d.user && Array.isArray(d.user.identities) && d.user.identities.length === 0) return { ok: false, reason: 'exists' };
      return { ok: true, confirm: true, email: addr };
    });
  }

  /* The reset email comes back to the page that asked, with the tokens after
     the # and type=recovery, which the cover adopts and then asks for the new
     password. Supabase answers the same whether or not the address has an
     account, and so does the cover. */
  function passwordResetStart(login, redirectTo, opts) {
    var id = idOf(login);
    if (!id) return Promise.resolve({ ok: false, reason: 'invalid' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    if (id.phone) return phoneCodeSend(c, id.phone, opts);
    return authCall(function () {
      var o = { redirectTo: redirectTo };
      if (cap(opts)) o.captchaToken = cap(opts);
      return c.auth.resetPasswordForEmail(id.email, o);
    }).then(function (res) {
      return res && res.error ? refused(res) : { ok: true };
    });
  }

  /* BY PHONE, A NEW PASSWORD STARTS WITH A CODE BY TEXT. Supabase has no reset
     text as such; what it has is a one time code that signs the number's
     account in, and a signed in account may set its password (passwordSet),
     which is the same last step the reset email leads to. shouldCreateUser is
     off, so a number with no account is never made one here. Supabase refuses
     such a number with "signups not allowed for otp", and the cover answers
     it exactly as it answers a number that has an account, so nobody can use
     this to find out whose number is registered. */
  function phoneCodeSend(c, phone, opts) {
    return authCall(function () {
      var o = { shouldCreateUser: false };
      if (cap(opts)) o.captchaToken = cap(opts);
      return c.auth.signInWithOtp({ phone: phone, options: o });
    }).then(function (res) {
      if (res && res.error) {
        var r = refused(res);
        if (r.reason === 'closed' || /otp_disabled/.test(String(res.error.code || ''))) return { ok: true, via: 'phone', phone: phone };
        return r;
      }
      return { ok: true, via: 'phone', phone: phone };
    });
  }

  /* The code the text brought, for either reason the cover asked for one:
     finishing a phone sign up, or starting a new password. Both are Supabase's
     type sms, and both come back with a session on this client. */
  function codeOf(raw) { var t = String(raw || '').replace(/\s/g, ''); return /^\d{4,10}$/.test(t) ? t : null; }
  function phoneCodeCheck(phone, code) {
    var p = normPhone(phone), t = codeOf(code);
    if (!p) return Promise.resolve({ ok: false, reason: 'invalid' });
    if (!t) return Promise.resolve({ ok: false, reason: 'badCode' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    return authCall(function () {
      return c.auth.verifyOtp({ phone: p, token: t, type: 'sms' });
    }).then(function (res) {
      if (res && res.error) return refused(res);
      var s = res && res.data && res.data.session;
      if (!s) return { ok: false, reason: 'error', error: 'no session returned' };
      return gate(s, { ok: true, phone: phoneOfUser(s.user) || p, email: (s.user && s.user.email) || null });
    });
  }
  /* Another code, for the reason the first one was sent. A sign up asks
     Supabase to resend its confirmation; a new password simply asks again. */
  function phoneCodeResend(phone, purpose, opts) {
    var p = normPhone(phone);
    if (!p) return Promise.resolve({ ok: false, reason: 'invalid' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    if (purpose === 'recover') return phoneCodeSend(c, p, opts);
    return authCall(function () {
      var r = { type: 'sms', phone: p };
      if (cap(opts)) r.options = { captchaToken: cap(opts) };
      return c.auth.resend(r);
    }).then(function (res) {
      return res && res.error ? refused(res) : { ok: true, via: 'phone', phone: p };
    });
  }

  /* ---------- a phone on an account that already exists ----------

     Most accounts were made with an email. For one of them to sign in by
     phone, or to recover its password by text, the phone has to be on the
     account and proven to belong to its owner, so the app asks for the
     number, Supabase texts a code to it (updateUser), and the code confirms
     it (verifyOtp, type phone_change). This is the app's own client, with the
     session it already has: the cover is for the signed out. */
  function phoneAddStart(raw) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    if (!session) return Promise.resolve({ ok: false, reason: 'signedOut' });
    var p = normPhone(raw);
    if (!p) return Promise.resolve({ ok: false, reason: 'invalid' });
    return authCall(function () {
      return client.auth.updateUser({ phone: p });
    }).then(function (res) {
      return res && res.error ? refused(res) : { ok: true, phone: p };
    });
  }
  function phoneAddVerify(raw, code) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    if (!session) return Promise.resolve({ ok: false, reason: 'signedOut' });
    var p = normPhone(raw), t = codeOf(code);
    if (!p) return Promise.resolve({ ok: false, reason: 'invalid' });
    if (!t) return Promise.resolve({ ok: false, reason: 'badCode' });
    return authCall(function () {
      return client.auth.verifyOtp({ phone: p, token: t, type: 'phone_change' });
    }).then(function (res) {
      if (res && res.error) return refused(res);
      var u = res && res.data && (res.data.user || (res.data.session && res.data.session.user));
      /* The library tells onAuthStateChange as well; this makes the phone
         show at once rather than after that event lands. */
      if (u && session) { session = Object.assign({}, session, { user: u }); notify(); }
      return { ok: true, phone: phoneOfUser(u) || p };
    });
  }

  /* ---------- remember me ----------

     The owner asked on 30 September 2026 for a Remember me box, so a loyal
     reader need not type their login again. Three things are remembered and
     none of them is the password in this page's storage: a password kept in
     localStorage is readable by any script that ever runs on this origin and
     by anybody holding the device, and it would be the one secret this app
     stored in the clear. So:

     - the login they typed is kept here (REMEMBER_KEY), and the cover fills
       it in next time;
     - the password is handed to the browser's own password manager, which
       keeps it encrypted and fills it back (the cover does that, through the
       Credential Management API where it exists and the autocomplete names
       everywhere);
     - and the session is kept, which is what staying signed in is.

     Unticked, the login is forgotten and the session lasts only while the
     browser is open: EPHEMERAL_KEY marks it, a session cookie (no expiry, so
     the browser drops it on closing) says this browser session is the one
     that signed in, and init() clears the stored session when the mark is
     there and the cookie is not. The session sits in localStorage, which
     survives a closed browser, so without the sweep an unticked box would
     change nothing. */
  var REMEMBER_KEY = 'incommon.signin.remember';
  var EPHEMERAL_KEY = 'incommon.signin.ephemeral';
  var LIVE_COOKIE = 'incommon_signin_live';
  function localStore() { try { return root.localStorage || null; } catch (e) { return null; } }
  function rememberGet() {
    try {
      var st = localStore(), v = st && JSON.parse(st.getItem(REMEMBER_KEY) || 'null');
      var on = !v || v.on !== false;
      return { on: on, login: on && v && v.login ? String(v.login) : null };
    } catch (e) { return { on: true, login: null }; }
  }
  function rememberSet(on, login) {
    var st = localStore();
    if (!st) return false;
    try {
      if (on) {
        var l = String(login || '').trim();
        st.setItem(REMEMBER_KEY, JSON.stringify(l ? { on: true, login: l } : { on: true }));
        st.removeItem(EPHEMERAL_KEY);
      } else {
        st.setItem(REMEMBER_KEY, JSON.stringify({ on: false }));
        st.setItem(EPHEMERAL_KEY, '1');
        if (root.document) root.document.cookie = LIVE_COOKIE + '=1; path=/; SameSite=Lax';
      }
      return true;
    } catch (e) { return false; }
  }
  /* The key supabase-js keeps a session under, derived the way it derives it:
     sb, the first label of the project's host, auth-token. */
  function sessionKeyFor(url) {
    var host = String(url || '').replace(/^[a-z]+:\/\//i, '').split('/')[0];
    return 'sb-' + host.split('.')[0] + '-auth-token';
  }
  function ephemeralSweep(url, storage) {
    try {
      if (!storage || storage.getItem(EPHEMERAL_KEY) !== '1') return false;
      var cookie = (root.document && root.document.cookie) || '';
      if (new RegExp('(^|;\\s*)' + LIVE_COOKIE + '=1(;|$)').test(cookie)) return false;
      storage.removeItem(sessionKeyFor(url));
      storage.removeItem(EPHEMERAL_KEY);
      return true;
    } catch (e) { return false; }
  }

  /* Tokens from an emailed link, read off the cover's hash by the cover. They
     are checked with the server by setSession before anything is stored, so a
     hand written hash signs nobody in, and the address named is the server's,
     never the url's. */
  function adoptSession(accessToken, refreshToken) {
    if (!accessToken || !refreshToken) return Promise.resolve({ ok: false, reason: 'error', error: 'no tokens' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    return authCall(function () {
      return c.auth.setSession({ access_token: String(accessToken), refresh_token: String(refreshToken) });
    }).then(function (res) {
      if (res && res.error) return refused(res);
      var s = res && res.data && res.data.session;
      if (!s) return { ok: false, reason: 'error', error: 'no session returned' };
      return gate(s, { ok: true, email: (s.user && s.user.email) || null });
    });
  }

  /* The new password, once a recovery link has been adopted. It needs the
     session adoptSession just stored, and nothing else: no old password,
     because not knowing it is the whole reason the reader is here. */
  function passwordSet(password) {
    if (String(password || '').length < PASSWORD_MIN) return Promise.resolve({ ok: false, reason: 'short' });
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    return authCall(function () {
      return c.auth.updateUser({ password: String(password) });
    }).then(function (res) {
      return res && res.error ? refused(res) : { ok: true };
    });
  }

  /* A sign in link sent before the password came in returns as ?code=, and
     this finishes it for as long as one is still in somebody's inbox. It
     works on this client because the code verifier the PKCE client stored
     sits under the same key, and the exchange reads it from there. */
  function oauthFinish(code) {
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    return Promise.resolve().then(function () { return c.auth.exchangeCodeForSession(code); }).then(function (res) {
      var s = res && res.data && res.data.session;
      if (res.error || !s) return { ok: false, reason: 'error', error: res.error && res.error.message };
      return gate(s, { ok: true, email: (s.user && s.user.email) || null });
    }).catch(function (e) { return { ok: false, reason: 'error', error: e && e.message }; });
  }

  /* ---------- two-step sign in ----------

     The owner asked on 11 October 2026 for two-step sign in, optional. A
     reader who turns it on adds inCommon to an authenticator app (a TOTP
     factor, which Supabase offers on every plan; a texted code would need the
     SMS provider docs/PHONE-SETUP.md has not switched on), and from then on a
     password alone is not enough: every sign in asks for the six digits the
     app is showing.

     A PASSWORD THAT PASSED STILL MAKES A SESSION, and that is the part to
     hold. Supabase signs the reader in at aal1 and expects the code to lift it
     to aal2, so between the two there is a real session for an account whose
     owner asked for more than a password. Three places refuse it, and all
     three are needed. This module holds it aside (owesCode) and the app treats
     it as signed out, which is courtesy. server/oracle and server/billing
     answer it MFA_REQUIRED. And server/mfa-policies.sql refuses it at every
     table, which is the wall: without it a stolen password would read the
     reader's record straight from the REST API with the cover never asked.

     owesCode reads two things the session already carries: whether the user
     has a verified factor, and the aal claim inside the access token. A
     token that cannot be read owes the code, because the side to fail on is
     the closed one. Nothing here is a reason to trust the token: the server
     checks it on every call, and this only decides what the page offers. */
  function b64urlText(s) {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    s = String(s || '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    var out = '', bits = 0, acc = 0;
    for (var i = 0; i < s.length; i++) {
      var v = A.indexOf(s.charAt(i));
      if (v < 0) return null;
      acc = (acc << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out += String.fromCharCode((acc >> bits) & 255); }
    }
    try { return decodeURIComponent(escape(out)); } catch (e) { return out; }
  }
  function tokenClaims(token) {
    try { return JSON.parse(b64urlText(String(token || '').split('.')[1]) || 'null'); } catch (e) { return null; }
  }
  function owesCode(s) {
    var f = s && s.user && s.user.factors;
    if (!Array.isArray(f) || !f.some(function (x) { return x && x.status === 'verified'; })) return false;
    var c = tokenClaims(s.access_token);
    return !(c && c.aal === 'aal2');
  }
  /* A sign in on the cover that still owes its code says so, and the cover
     asks for it before going on. */
  function gate(s, out) { if (owesCode(s)) out.mfa = true; return out; }
  /* Six digits, as every authenticator app shows them; spaces are allowed
     because some apps print the code as two groups of three. */
  function totpOf(raw) { var t = String(raw || '').replace(/\s/g, ''); return /^\d{6}$/.test(t) ? t : null; }
  /* The one verified authenticator, from the server's own list, which
     supabase-js reads fresh from the user rather than from the session. */
  function verifiedFactor(c) {
    return authCall(function () { return c.auth.mfa.listFactors(); }).then(function (res) {
      if (res && res.error) return { error: res.error };
      var t = res && res.data && res.data.totp;
      return { factor: Array.isArray(t) && t.length ? t[0] : null, all: (res && res.data && res.data.all) || [] };
    });
  }
  function codeCheck(c, code, factorId) {
    var t = totpOf(code);
    if (!t) return Promise.resolve({ ok: false, reason: 'badCode' });
    var found = factorId ? Promise.resolve({ factor: { id: factorId } }) : verifiedFactor(c);
    return found.then(function (f) {
      if (f.error) return refused(f);
      if (!f.factor) return { ok: false, reason: 'error', error: 'no authenticator on this account' };
      return authCall(function () {
        return c.auth.mfa.challengeAndVerify({ factorId: f.factor.id, code: t });
      }).then(function (res) {
        return res && res.error ? refused(res) : { ok: true, factorId: f.factor.id };
      });
    });
  }
  /* The cover's half: the code that finishes a sign in. The session it lifts
     is the one the password made, so it is stored where the app's client
     reads it, already at aal2. */
  function mfaVerify(code) {
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: false, reason: 'off' });
    return codeCheck(c, code);
  }
  /* "Use another account" from the code step leaves nothing half signed in
     on this device. Local scope, so the reader's other devices stay as they
     were. */
  function coverSignOut() {
    var c = coverLib();
    if (!c) return Promise.resolve({ ok: true });
    return authCall(function () { return c.auth.signOut({ scope: 'local' }); }).then(function () { return { ok: true }; });
  }

  /* The app's half, on the session the app already holds: whether it is on,
     turning it on, and turning it off. Turning it on is two steps, because an
     authenticator that has never shown a code is not proven to hold the
     secret: enroll returns the QR code and the key, and the first code the
     app shows confirms it (and lifts this session to aal2 as it does).
     Turning it off asks for a current code first, so a phone left unlocked is
     not enough to take the second step away. */
  function appReady() {
    if (!client) return { ok: false, reason: 'off' };
    if (!session) return { ok: false, reason: 'signedOut' };
    return null;
  }
  function mfaStatus() {
    var no = appReady();
    if (no) return Promise.resolve(no);
    return verifiedFactor(client).then(function (f) {
      return f.error ? refused(f) : { ok: true, on: !!f.factor };
    });
  }
  function mfaEnrollStart() {
    var no = appReady();
    if (no) return Promise.resolve(no);
    return verifiedFactor(client).then(function (f) {
      if (f.error) return refused(f);
      if (f.factor) return { ok: false, reason: 'already' };
      /* A setup that was started and never confirmed leaves an unverified
         factor behind, and Supabase caps how many there may be, so those go
         first. They never counted for anything: only a verified one asks
         for a code. */
      var stale = f.all.filter(function (x) { return x && x.factor_type === 'totp' && x.status !== 'verified'; });
      return stale.reduce(function (p, x) {
        return p.then(function () { return authCall(function () { return client.auth.mfa.unenroll({ factorId: x.id }); }); });
      }, Promise.resolve()).then(function () {
        return authCall(function () {
          return client.auth.mfa.enroll({ factorType: 'totp', issuer: 'inCommon', friendlyName: 'inCommon ' + Date.now() });
        });
      }).then(function (res) {
        if (res && res.error) return refused(res);
        var d = (res && res.data) || {}, t = d.totp || {};
        if (!d.id || !t.qr_code || !t.secret) return { ok: false, reason: 'error', error: 'no authenticator returned' };
        return { ok: true, factorId: d.id, qr: t.qr_code, secret: t.secret, uri: t.uri || null };
      });
    });
  }
  function mfaEnrollVerify(factorId, code) {
    var no = appReady();
    if (no) return Promise.resolve(no);
    if (!factorId) return Promise.resolve({ ok: false, reason: 'error', error: 'no authenticator to confirm' });
    return codeCheck(client, code, factorId);
  }
  function mfaDisable(code) {
    var no = appReady();
    if (no) return Promise.resolve(no);
    return codeCheck(client, code).then(function (r) {
      if (!r.ok) return r;
      return authCall(function () { return client.auth.mfa.unenroll({ factorId: r.factorId }); }).then(function (res) {
        return res && res.error ? refused(res) : { ok: true };
      });
    });
  }

  /* ---------- the Oracle ---------- */

  /* THE ORACLE IS ASKED THROUGH THE ONE MODULE ALLOWED TO TALK TO SUPABASE.

     A reading is written by a server function (server/oracle/index.ts) that
     holds the AI key, so the key never reaches a browser. It is asked only
     with a session: the function refuses anyone it cannot name, and every
     reading it writes costs money. What travels is the dossier the app
     composed on the device, in the Celestial Codex's format: the first name
     and chart facts, and nothing else. No journal, no birth date, time or
     place. From the function it goes on to Kimi, which writes the reading.

     Every way it can fail comes back as a reason the page can say in words,
     never as a thrown error: signed out, not set up yet (the function is not
     deployed, which is a 404), the daily limit, the model busy, offline, or
     an error. The server's own message is kept for the console only. */
  function oracleCode(e) {
    var ctx = e && e.context;
    if (!ctx || typeof ctx.json !== 'function') return Promise.resolve(null);
    return Promise.resolve().then(function () { return ctx.json(); })
      .then(function (b) { return (b && b.code) || null; }, function () { return null; });
  }
  /* AN IN-DEPTH READING IS TWO CALLS, because one call for all of it ran past
     what the function may take. The first writes the standard fields, deeper;
     the second writes chapters, timing, shadow work and journal prompts and
     answers with the two joined. Each call has the function's whole time to
     itself, and the first is kept, so a failed second one is retried alone.
     A server that still writes the whole reading in one call (it has no
     chapters to add) answers the first with them already in, and the second
     call is skipped. The page may pass onFirst, called with the first half as
     soon as it arrives, so it can be shown while the second is written. */
  function oracleRead(req) {
    if (!req) return oracleCall(req);
    var onFirst = typeof req.onFirst === 'function' ? req.onFirst : null;
    var body = Object.assign({}, req);
    delete body.onFirst;
    if (body.depth !== 'deep') return oracleCall(body);
    return oracleCall(Object.assign({}, body, { part: 'a' })).then(function (a) {
      if (!a.ok || (a.reading && Array.isArray(a.reading.chapters))) return a;
      /* The first half is on its way to the page before the second is asked
         for, so the reader has something to read while it is written. */
      if (onFirst) { try { onFirst(a); } catch (e) { /* a page that throws must not cost the reading */ } }
      return oracleCall(Object.assign({}, body, { part: 'b' }));
    });
  }
  function oracleCall(req) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    if (!session) return Promise.resolve({ ok: false, reason: 'signedOut' });
    return Promise.resolve().then(function () {
      return client.functions.invoke('oracle', { body: req });
    }).then(function (res) {
      if (res && !res.error && res.data && res.data.reading) {
        return { ok: true, reading: res.data.reading, cached: !!res.data.cached,
          periodKey: res.data.periodKey || null, label: res.data.label || null };
      }
      var e = res && res.error, st = e && e.context && e.context.status;
      return oracleCode(e).then(function (code) {
        /* The code decides first, because two failures share a status: the
           daily limit and the provider's rate limit are both 429. */
        if (st === 402 || code === 'PREMIUM_REQUIRED') return { ok: false, reason: 'premium' };
        if (code === 'RATE_LIMITED') return { ok: false, reason: 'busy' };
        if (code === 'OUT_OF_CREDITS') return { ok: false, reason: 'silent' };
        /* The function gave up on Kimi (504 TIMEOUT). Kimi was writing, so it
           counts toward the limit, and it is not the same as a refusal. */
        if (code === 'TIMEOUT' || st === 504) return { ok: false, reason: 'timeout' };
        if (st === 404 || code === 'NOT_SET_UP') return { ok: false, reason: 'notSetUp' };
        /* MFA_REQUIRED is a session that never entered its code; to the page
           it is signed out, and the cover asks for the code. */
        if (st === 401 || code === 'SIGNED_OUT' || code === 'MFA_REQUIRED') return { ok: false, reason: 'signedOut' };
        if (st === 429 || code === 'LIMIT') return { ok: false, reason: 'limit' };
        if (st === 503) return { ok: false, reason: 'silent' };
        if (st === 409 || code === 'PENDING') return { ok: false, reason: 'pending' };
        if (e && /FunctionsFetchError|FunctionsRelayError/.test(e.name || '')) return { ok: false, reason: 'offline' };
        return { ok: false, reason: 'error', error: (e && e.message) || 'no reading returned' };
      });
    }).catch(function (e) { return { ok: false, reason: 'offline', error: e && e.message }; });
  }

  /* ---------- Omni tarot ----------

     Omni is written by the Oracle function since it became a paid add-on, so
     the app asks for it with the shuffle it drew (the seed), the number of
     cards and the topic, and nothing else. It comes back through the Oracle's
     own answers: premium when Codex Luminary is not open to this reader. */
  function tarotRead(req) {
    req = req || {};
    return oracleCall({ kind: 'tarot', seed: req.seed, count: req.count, topic: req.topic });
  }

  /* ---------- Oracle Voice ---------- */

  /* ElevenLabs text-to-speech, per-section, so stopping early never bills
     for what was not heard. The key lives as a secret; the page never sees
     it. Audio is returned as an ArrayBuffer on success, or a reason on
     failure, matching the Oracle's own contract.

     The function is asked straight through its address, the way a gift asks
     billing, rather than through client.functions.invoke: this version of the
     client reads any content type it does not know as TEXT, and audio/mpeg is
     one it does not know, so a good answer arrived as a corrupted string and
     every listen fell back to the device's own voice. The bearer is the
     reader's session; the function's errors come back as { reason }. */
  function oracleVoice(req) {
    if (!client) return Promise.resolve({ ok: false, reason: "off" });
    if (!session || !session.access_token) return Promise.resolve({ ok: false, reason: "signedOut" });
    var url = (cfg && cfg.url) || PROJECT_URL, key = (cfg && cfg.anonKey) || PROJECT_ANON_KEY;
    return Promise.resolve().then(function () {
      return fetch(url + "/functions/v1/oracle-voice", {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: "Bearer " + session.access_token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req || {})
      });
    }).then(function (res) {
      if (res && res.ok && ((res.headers.get("Content-Type") || "").indexOf("audio/") === 0)) {
        return res.arrayBuffer().then(function (buf) {
          return buf && buf.byteLength ? { ok: true, audio: buf } : { ok: false, reason: "silent" };
        });
      }
      var st = res ? res.status : 0;
      return Promise.resolve().then(function () { return res.json(); }).then(function (b) {
        var code = (b && (b.code || b.reason)) || null;
        if (st === 402 || code === "PREMIUM_REQUIRED") return { ok: false, reason: "premium" };
        if (code === "RATE_LIMITED") return { ok: false, reason: "busy" };
        if (code === "OUT_OF_CREDITS") return { ok: false, reason: "silent" };
        if (code === "TIMEOUT" || st === 504) return { ok: false, reason: "timeout" };
        if (st === 404 || code === "NOT_SET_UP") return { ok: false, reason: "notSetUp" };
        if (st === 401 || code === "SIGNED_OUT" || code === "MFA_REQUIRED") return { ok: false, reason: "signedOut" };
        if (st === 429 || code === "LIMIT") return { ok: false, reason: "limit" };
        if (st === 503 || code === "SILENT") return { ok: false, reason: "silent" };
        return { ok: false, reason: "error", error: String(code || st) };
      }, function () { return { ok: false, reason: "error", error: "status " + st }; });
    }).catch(function (e) { return { ok: false, reason: "offline", error: e && e.message }; });
  }

  /* ---------- Codex Luminary ---------- */

  /* THE PAID TIER IS ASKED THROUGH THIS MODULE TOO, and for the same reason.
     server/billing/index.ts holds the Stripe keys and keeps each reader's
     unlock; the page asks it whether this reader has Codex Luminary, for the
     one time Checkout's address, for a gift's, and, for a reader who
     subscribed before the subscription was retired, for the billing portal.
     The page never sees a card, a Stripe key or a price id, only the address
     Stripe gives back, and the reader leaves for it and returns.

     Failures come back as reasons, never throws, like the Oracle's: signed
     out, not set up (the function is not deployed, a 404 with no code of its
     own), notConfigured (deployed, but no Stripe key yet), already (a
     Luminary asking to pay twice), noAccount (a portal for somebody who never
     opened a checkout), offline, or error. */
  function billingCall(body) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    if (!session) return Promise.resolve({ ok: false, reason: 'signedOut' });
    return Promise.resolve().then(function () {
      return client.functions.invoke('billing', { body: body });
    }).then(function (res) {
      if (res && !res.error && res.data) return { ok: true, data: res.data };
      var e = res && res.error, st = e && e.context && e.context.status;
      return oracleCode(e).then(function (code) {
        if (code === 'NO_ACCOUNT') return { ok: false, reason: 'noAccount' };
        if (code === 'NOT_CONFIGURED') return { ok: false, reason: 'notConfigured' };
        if (code === 'ALREADY') return { ok: false, reason: 'already' };
        if (code === 'REGION') return { ok: false, reason: 'region' };
        if (st === 404) return { ok: false, reason: 'notSetUp' };
        if (st === 401 || code === 'SIGNED_OUT' || code === 'MFA_REQUIRED') return { ok: false, reason: 'signedOut' };
        if (e && /FunctionsFetchError|FunctionsRelayError/.test(e.name || '')) return { ok: false, reason: 'offline' };
        return { ok: false, reason: 'error', error: (e && e.message) || 'no answer' };
      });
    }).catch(function (e) { return { ok: false, reason: 'offline', error: e && e.message }; });
  }
  /* country is the page's guess at where the reader is, from the device's time
     zone, as two letters or nothing. The server uses it to say whether
     Luminary is sold there, and refuses an unlock for a
     country it does not sell to yet. It is a guess and the server treats it as
     one: what Stripe collects at checkout is what it acts on in the end. */
  function billingStatus(opts) {
    var country = opts && /^[A-Z]{2}$/.test(String(opts.country || '')) ? opts.country : undefined;
    return billingCall({ action: 'status', sync: !!(opts && opts.sync), country: country }).then(function (r) {
      return r.ok ? { ok: true, status: r.data.status || null } : r;
    });
  }
  function billingPortal(returnTo) {
    return billingCall({ action: 'portal', returnTo: returnTo }).then(function (r) {
      return r.ok && r.data.url ? { ok: true, url: r.data.url } : (r.ok ? { ok: false, reason: 'error' } : r);
    });
  }
  /* CODEX LUMINARY IS OPENED ONCE, at an amount the reader chooses on
     Stripe's own page, and it opens every add-on (18 October 2026: the
     subscription it replaced is no longer sold). The page sends no amount:
     only where to come back to and the country it guessed. The answer is the
     Checkout address, or already (this account has it), region, or the
     reasons above. */
  function billingUnlock(returnTo, country) {
    country = /^[A-Z]{2}$/.test(String(country || '')) ? country : undefined;
    return billingCall({ action: 'unlock', returnTo: returnTo, country: country }).then(function (r) {
      return r.ok && r.data.url ? { ok: true, url: r.data.url } : (r.ok ? { ok: false, reason: 'error' } : r);
    });
  }
  /* A GIFT NEEDS NO ACCOUNT. It buys nothing, so the billing function opens
     its Checkout without naming anybody, and it is asked straight through the
     functions address with the public anon key, the way Contact Support writes,
     because a reader who never signed in has no client to ask with. Nothing
     but where to come back to is sent. */
  function billingSupport(returnTo, opts) {
    var doFetch = (opts && opts.fetch) || (typeof fetch === 'function' ? fetch : null);
    if (!doFetch) return Promise.resolve({ ok: false, reason: 'offline' });
    var url = (cfg && cfg.url) || PROJECT_URL, key = (cfg && cfg.anonKey) || PROJECT_ANON_KEY;
    return Promise.resolve().then(function () {
      return doFetch(url + '/functions/v1/billing', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'support', returnTo: returnTo })
      });
    }).then(function (res) {
      return Promise.resolve(res ? res.json() : null).catch(function () { return null; }).then(function (b) {
        if (res && res.ok && b && b.url) return { ok: true, url: b.url };
        var st = res ? res.status : 0, code = b && b.code;
        if (code === 'NOT_CONFIGURED') return { ok: false, reason: 'notConfigured' };
        /* A gift is answered before anybody is named, so SIGNED_OUT can only
           come from a billing function deployed before gifts existed. */
        if (st === 404 || st === 401) return { ok: false, reason: 'notSetUp' };
        return { ok: false, reason: 'error', error: String(code || st) };
      });
    }).catch(function (e) { return { ok: false, reason: 'offline', error: e && e.message }; });
  }

  /* ---------- Deleting the account ----------

     The App Store and Google Play require an app with accounts to let the
     reader delete theirs from inside it (docs/ACCOUNT-DELETION.md). The work is
     server/account/index.ts: Luminary cancelled at Stripe first, then every row,
     then the sign in itself. confirm is the word the reader typed, and the
     server checks it again, so no stray call deletes anything.

     After the server answers yes, this device forgets the account too: the
     sync map and the outbox go, because the map records rows as already
     uploaded and a later sign in to a new account would otherwise skip them,
     the remembered login goes, and the session is signed out locally, since
     the server no longer has a user to sign out. What is on the device stays,
     unless the page also erases it. */
  function accountDelete(confirm) {
    if (!client) return Promise.resolve({ ok: false, reason: 'off' });
    if (!session) return Promise.resolve({ ok: false, reason: 'signedOut' });
    return Promise.resolve().then(function () {
      return client.functions.invoke('account', { body: { action: 'delete', confirm: String(confirm || '') } });
    }).then(function (res) {
      if (res && !res.error && res.data && res.data.deleted) {
        try { root.localStorage.removeItem(MAP_KEY); } catch (e) {}
        try { root.localStorage.removeItem(OUTBOX_KEY); } catch (e) {}
        try { root.localStorage.removeItem(REMEMBER_KEY); } catch (e) {}
        session = null;
        return normalize(client.auth.signOut({ scope: 'local' })).then(function () { return { ok: true }; }, function () { return { ok: true }; });
      }
      var e = res && res.error, st = e && e.context && e.context.status;
      return oracleCode(e).then(function (code) {
        if (code === 'STRIPE') return { ok: false, reason: 'stripe' };
        if (code === 'REVENUECAT') return { ok: false, reason: 'revenuecat' };
        if (code === 'BAD_REQUEST') return { ok: false, reason: 'confirm' };
        if (st === 404) return { ok: false, reason: 'notSetUp' };
        if (st === 401 || code === 'SIGNED_OUT' || code === 'MFA_REQUIRED') return { ok: false, reason: 'signedOut' };
        if (e && /FunctionsFetchError|FunctionsRelayError/.test(e.name || '')) return { ok: false, reason: 'offline' };
        return { ok: false, reason: 'error', error: (e && e.message) || 'no answer' };
      });
    }).catch(function (e) { return { ok: false, reason: 'offline', error: e && e.message }; });
  }

  /* ---------- Contact Support ----------

     A support request is one row in public.support_requests
     (server/support.sql). It is written straight to the REST API rather than
     through the client, because a reader who never made an account has no
     client and is exactly the reader most likely to need help, and because a
     session held for its two-step code must not be the one sending it: the
     restrictive policy in server/mfa-policies.sql would refuse that token. So a
     signed in reader sends with their own token, which stamps user_id, and
     anybody else sends with the public anon key. Nobody can read the table
     back: there is no select policy, and the owner reads it in the dashboard.
     The topics and the bounds are the table's own checks, repeated here so a
     reader is told what is wrong before anything is sent. */
  var SUPPORT_TOPICS = ['general', 'account', 'billing', 'privacy', 'delete', 'problem'];
  function supportSend(req, opts) {
    req = req || {};
    var doFetch = (opts && opts.fetch) || (typeof fetch === 'function' ? fetch : null);
    var topic = String(req.topic || 'general');
    var email = String(req.email || '').trim();
    var message = String(req.message || '').trim();
    if (SUPPORT_TOPICS.indexOf(topic) === -1) topic = 'general';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return Promise.resolve({ ok: false, reason: 'email' });
    if (message.length < 10) return Promise.resolve({ ok: false, reason: 'short' });
    if (message.length > 5000) return Promise.resolve({ ok: false, reason: 'long' });
    if (!doFetch) return Promise.resolve({ ok: false, reason: 'offline' });
    var url = (cfg && cfg.url) || PROJECT_URL, key = (cfg && cfg.anonKey) || PROJECT_ANON_KEY;
    var token = session && session.access_token ? session.access_token : key;
    return Promise.resolve().then(function () {
      return doFetch(url + '/rest/v1/support_requests', {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ topic: topic, email: email, message: message })
      });
    }).then(function (res) {
      if (res && res.ok) return { ok: true };
      return Promise.resolve(res ? res.text() : '').catch(function () { return ''; }).then(function (t) {
        var st = res ? res.status : 0;
        if (/support_rate/.test(t)) return { ok: false, reason: 'rate' };
        if (st === 404 || /PGRST205|42P01|support_requests/.test(t) && /does not exist|Could not find/.test(t)) return { ok: false, reason: 'notSetUp' };
        if (st === 401 || st === 403) return { ok: false, reason: 'refused' };
        return { ok: false, reason: 'error', error: String(t || st).slice(0, 200) };
      });
    }).catch(function (e) { return { ok: false, reason: 'offline', error: e && e.message }; });
  }

  /* ---------- status ---------- */

  function status() {
    if (!client) return { mode: 'off', VERSION: VERSION };
    return {
      mode: session ? 'cloud' : 'local',
      email: session && session.user ? session.user.email : null,
      phone: session && session.user ? phoneOfUser(session.user) : null,
      /* The store apps hand this to RevenueCat as the app user id, so a
         purchase is filed under the same reader the server knows. */
      userId: uid(),
      owesCode: !!held,
      lastPushAt: lastPushAt || null,
      lastPullAt: lastPullAt || null,
      pendingOps: loadOutbox().length,
      VERSION: VERSION
    };
  }

  /* ---------- init ---------- */

  function init(opts) {
    if (!opts) return null;
    var url = opts.url || PROJECT_URL;
    var anonKey = opts.anonKey || PROJECT_ANON_KEY;
    if (!url || !anonKey || !opts.core || !opts.pm || !opts.storage) return null;
    if (typeof opts.pm._store !== 'function' || typeof opts.pm.getMemory !== 'function') return null;
    var l = lib();
    if (!l || typeof l.createClient !== 'function') return null; // vendored library absent: stay inert
    cfg = { url: url, anonKey: anonKey, storage: opts.storage, core: opts.core, pm: opts.pm,
      /* placeholders(): ids of local profiles that stand in for nobody (the
         sample a blank device invents), which give way to the account's own.
         onPulled(result): told after every pull that read the server. */
      placeholders: typeof opts.placeholders === 'function' ? opts.placeholders : null,
      onPulled: typeof opts.onPulled === 'function' ? opts.onPulled : null };
    /* Before the client reads the stored session: a sign in that asked not to
       be remembered ends with the browser session it was made in. */
    ephemeralSweep(url, opts.storage);
    client = l.createClient(url, anonKey);

    /* THE SEAM. Any ProfileManager event means the local record changed, and
       every change is a push candidate. Deletions are queued, not pushed, so
       a wipe is never re-uploaded by the debounce that follows it. */
    try {
      opts.pm.subscribe(function (name, detail) {
        var mpid = detail && (detail.profileId || (cfg.pm.activeId && cfg.pm.activeId()));
        if (name === 'profile:deleted' && detail && detail.id) queueOp({ op: 'del-profile', pid: detail.id });
        else if (name === 'memory:deleted' && detail && detail.id) queueOp({ op: 'del-memory', pid: mpid, id: String(detail.id) });
        else if (name === 'memory:deleted' && detail) queueOp({ op: 'del-memories', pid: mpid, type: detail.type || null });
        schedule();
      });
    } catch (e) {}

    client.auth.onAuthStateChange(function (_event, s) {
      var had = !!session;
      held = owesCode(s) ? s : null;
      session = held ? null : (s || null);
      notify();
      if (session && !had) sync();
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
    /* Signing out has to end the session on THIS device even when the server
       cannot be told. supabase-js keeps the stored session when its sign out
       request fails for any reason but a 401, 403 or 404 (no signal, a
       timeout), so a Log Out on a weak connection left the reader signed in
       and the cover offered them straight back in. The local sign out needs
       no network.
       LOG OUT ENDS THIS DEVICE'S SESSION AND NO OTHER. supabase-js signs out
       globally by default, which revoked every session the account held, so
       Logging Out on a phone signed the laptop out too and its next request
       failed with "Refresh Token Not Found" (owner, 18 October 2026). The
       scope is 'local': this session is revoked on the server, the others
       carry on. */
    signOut: function () {
      return normalize(client.auth.signOut({ scope: 'local' })).then(function (r) {
        if (r.ok) return r;
        return normalize(client.auth.signOut({ scope: 'local' })).then(function () { return r; });
      });
    },
    schedule: schedule,
    push: push,
    pull: pull,
    /* The name the app's comments have always used for the pull. */
    pullAll: pull,
    sync: sync,
    startPinRecovery: startPinRecovery,
    isRecoveryPending: isRecoveryPending,
    isRecoverySession: isRecoverySession,
    completePinRecovery: completePinRecovery,
    passwordSignIn: passwordSignIn,
    passwordSignUp: passwordSignUp,
    passwordResetStart: passwordResetStart,
    adoptSession: adoptSession,
    passwordSet: passwordSet,
    oauthFinish: oauthFinish,
    phoneCodeCheck: phoneCodeCheck,
    phoneCodeResend: phoneCodeResend,
    phoneAddStart: phoneAddStart,
    phoneAddVerify: phoneAddVerify,
    rememberGet: rememberGet,
    rememberSet: rememberSet,
    normPhone: normPhone,
    oracleRead: oracleRead,
    tarotRead: tarotRead,
    oracleVoice: oracleVoice,
    supportSend: supportSend,
    SUPPORT_TOPICS: SUPPORT_TOPICS.slice(),
    SYNC_MEMORY_TYPES: SYNC_MEMORY_TYPES.slice(),
    billingStatus: billingStatus,
    billingPortal: billingPortal,
    billingUnlock: billingUnlock,
    billingSupport: billingSupport,
    accountDelete: accountDelete,
    mfaVerify: mfaVerify,
    coverSignOut: coverSignOut,
    mfaStatus: mfaStatus,
    mfaEnrollStart: mfaEnrollStart,
    mfaEnrollVerify: mfaEnrollVerify,
    mfaDisable: mfaDisable,
    owesCode: owesCode,
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
    _setClientForTests: function (c, s) { client = c; session = s || null; held = null; },
    _setConfigForTests: function (o) { cfg = o; pulling = null; syncing = null; lastPullAt = 0; }
  };

  return api;
}));