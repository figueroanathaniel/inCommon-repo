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
  var VERSION = '2.7.1';

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
      options.data = { newsletter: opts.newsletter, newsletter_source: 'cover-signup', newsletter_decided_at: new Date().toISOString() };
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

  /* ---------- Codex Luminary ---------- */

  /* THE PAID TIER IS ASKED THROUGH THIS MODULE TOO, and for the same reason.
     server/billing/index.ts holds the Stripe keys and keeps each reader's
     subscription; the page asks it three things: whether this reader is a
     Luminary, for a Stripe Checkout address, and for the billing portal's.
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
        if (st === 404) return { ok: false, reason: 'notSetUp' };
        if (st === 401 || code === 'SIGNED_OUT' || code === 'MFA_REQUIRED') return { ok: false, reason: 'signedOut' };
        if (e && /FunctionsFetchError|FunctionsRelayError/.test(e.name || '')) return { ok: false, reason: 'offline' };
        return { ok: false, reason: 'error', error: (e && e.message) || 'no answer' };
      });
    }).catch(function (e) { return { ok: false, reason: 'offline', error: e && e.message }; });
  }
  function billingStatus(opts) {
    return billingCall({ action: 'status', sync: !!(opts && opts.sync) }).then(function (r) {
      return r.ok ? { ok: true, status: r.data.status || null } : r;
    });
  }
  function billingCheckout(plan, returnTo) {
    return billingCall({ action: 'checkout', plan: plan, returnTo: returnTo }).then(function (r) {
      return r.ok && r.data.url ? { ok: true, url: r.data.url } : (r.ok ? { ok: false, reason: 'error' } : r);
    });
  }
  function billingPortal(returnTo) {
    return billingCall({ action: 'portal', returnTo: returnTo }).then(function (r) {
      return r.ok && r.data.url ? { ok: true, url: r.data.url } : (r.ok ? { ok: false, reason: 'error' } : r);
    });
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
      owesCode: !!held,
      lastPushAt: lastPushAt || null,
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
    cfg = { url: url, anonKey: anonKey, storage: opts.storage, core: opts.core, pm: opts.pm };
    /* Before the client reads the stored session: a sign in that asked not to
       be remembered ends with the browser session it was made in. */
    ephemeralSweep(url, opts.storage);
    client = l.createClient(url, anonKey);

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
      held = owesCode(s) ? s : null;
      session = held ? null : (s || null);
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
    /* Signing out has to end the session on THIS device even when the server
       cannot be told. supabase-js keeps the stored session when its sign out
       request fails for any reason but a 401, 403 or 404 (no signal, a
       timeout), so a Log Out on a weak connection left the reader signed in
       and the cover offered them straight back in. The local sign out needs
       no network. */
    signOut: function () {
      return normalize(client.auth.signOut()).then(function (r) {
        if (r.ok) return r;
        return normalize(client.auth.signOut({ scope: 'local' })).then(function () { return r; });
      });
    },
    schedule: schedule,
    push: push,
    pullAll: pullAll,
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
    supportSend: supportSend,
    SUPPORT_TOPICS: SUPPORT_TOPICS.slice(),
    billingStatus: billingStatus,
    billingCheckout: billingCheckout,
    billingPortal: billingPortal,
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
    _setConfigForTests: function (o) { cfg = o; }
  };

  return api;
}));
