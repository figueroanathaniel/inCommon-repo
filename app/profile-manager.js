/* profile-manager.js: inCommon multi-profile data layer. V1.7.1
   Pure JavaScript, no UI, no framework. Local first: everything lives in
   localStorage, and incommon-cloud.js mirrors it to the reader's account and
   brings other devices' changes back through importSynced().
   One store per signed in account, and one for the guest: see scope().
   Every profile is fully isolated: consents, memories, conversations, and charts
   are stored under keys scoped by profile id.

   Storage map
     incommon.profiles.v1            { schemaVersion, activeId, profiles[], pairs[] }, the guest's
     incommon.profiles.v1.u.<userId> the same, for one signed in account (see scope())
     incommon.consent.<profileId>    consent record (same shape as the legacy global key)
     incommon.consent.data.<pid>     consented source data
     incommon.p.<pid>.memories       [{ id, memory_type, content, created_at, is_private }]
     incommon.p.<pid>.throughline    manual Throughline entries
     incommon.p.<pid>.oki         conversation history
     incommon.p.<pid>.oracle      Oracle readings kept on this device, per period
     incommon.p.<pid>.oracleDeep  set once an in-depth reading has been asked for (lets the page prepare the next)
     incommon.p.<pid>.chartVersions.v1  { v, versions[] } earlier and current births, once one is corrected (1.2)
     incommon.p.<pid>.chartNotes.v1     { v, notes[] } notes attached to an address in the chart (1.2)
   Legacy (pre-multi-profile) keys are migrated once by migrateLegacyProfile().  */
(function () {
  'use strict';
  var ROOT = 'incommon.profiles.v1';
  var MAX_PROFILES = 6;

  /* EACH ACCOUNT HAS ITS OWN PROFILES ON A DEVICE. The owner asked on 12
     October 2026, after three accounts signed in on one browser all opened
     onto the same birth data. The profile list was one device wide store, and
     every other profile key is scoped by profile id, so scoping that one store
     by account separates everything that hangs off it: memories, journal,
     consents, Oracle readings, saved people, and what the cloud module pushes,
     since it reads this store.

     The account is read once, at the first read of the store, from the session
     supabase-js left in localStorage, which is the only way a reader becomes
     signed in: on the cover, and then by navigating here. Signing out and
     deleting an account navigate away too, so a page never changes owner while
     it is open. Signed out, the store is the plain ROOT, the guest's.

     A session the browser has closed (the remember me mark without its cookie)
     and one that still owes its two-step code read as signed out here, as they
     do everywhere else, so a password alone does not open the profiles of an
     account that asked for more. owesCode below is the cover's rule, and K46
     holds all three copies equal.

     THE FIRST ACCOUNT TO OPEN THE APP ON A DEVICE THAT ALREADY HOLDS PROFILES
     TAKES THEM. Before this every account and the guest shared one store, and
     nothing in it records whose it was, so the first sign in after the change
     claims it, along with the ACCOUNT_KEYS below. Every account after that
     starts on a blank page, and the guest store starts blank once claimed. */
  var ACCOUNT_KEYS = ['incommon.firstrun', 'incommon.sample', 'incommon.friends', 'incommon.adverse.log', 'incommon.mem.archived'];
  /* people-library.js's store, device wide, { <profile id>: [records] }. */
  var PEOPLE_KEY = 'incommon.people.v1';
  var SCOPE = null;
  function owesCode(st) {
    try {
      var f = st && st.user && st.user.factors;
      if (!Array.isArray(f) || !f.some(function (x) { return x && x.status === 'verified'; })) return false;
      var p = String(st.access_token || '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(p + '==='.slice((p.length + 3) % 4))).aal !== 'aal2';
    } catch (e) { return true; }
  }
  function sessionOwner() {
    try {
      if (localStorage.getItem('incommon.signin.ephemeral') === '1'
          && !/(^|;\s*)incommon_signin_live=1(;|$)/.test((typeof document !== 'undefined' && document.cookie) || '')) return null;
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/^sb-[a-z0-9]+-auth-token$/.test(k || '')) continue;
        var st = JSON.parse(localStorage.getItem(k) || 'null'), u = st && st.user;
        if (!st || !st.refresh_token || !u || !u.id || owesCode(st)) return null;
        return String(u.id);
      }
    } catch (e) {}
    return null;
  }
  function scoped(key, owner) { return owner ? key + '.u.' + owner : key; }
  function scope() {
    if (SCOPE) return SCOPE;
    var owner = sessionOwner();
    SCOPE = { owner: owner, root: scoped(ROOT, owner), claimed: false };
    try {
      if (owner && localStorage.getItem(SCOPE.root) == null && localStorage.getItem(ROOT) != null) {
        localStorage.setItem(SCOPE.root, localStorage.getItem(ROOT));
        ACCOUNT_KEYS.forEach(function (k) {
          var v = localStorage.getItem(k), dest = scoped(k, owner);
          if (v != null && localStorage.getItem(dest) == null) localStorage.setItem(dest, v);
          localStorage.removeItem(k);
        });
        localStorage.removeItem(ROOT);
        SCOPE.claimed = true;
      }
    } catch (e) {}
    return SCOPE;
  }
  var CONSENT_TYPES = ['birthData', 'journal', 'relationships', 'assessments', 'mood', 'conversation'];
  var COLORS = ['#d3ad6e', '#59b37d', '#7eb8da', '#c9a0dc', '#e07a5f', '#f2cc8f'];

  /* A small offline gazetteer. The app is local-only by design, so location entry
     never touches the network: a match here yields lat/lon/timezone, and anything
     else is stored as raw text and flagged unresolved (charts fall back to solar). */
  var CITIES = [
    ['new york', 40.713, -74.006, 'America/New_York', -4], ['brooklyn', 40.678, -73.944, 'America/New_York', -4],
    ['los angeles', 34.052, -118.244, 'America/Los_Angeles', -7], ['san francisco', 37.775, -122.419, 'America/Los_Angeles', -7],
    ['chicago', 41.878, -87.630, 'America/Chicago', -5], ['houston', 29.760, -95.370, 'America/Chicago', -5],
    ['dallas', 32.777, -96.797, 'America/Chicago', -5], ['austin', 30.267, -97.743, 'America/Chicago', -5],
    ['phoenix', 33.448, -112.074, 'America/Phoenix', -7], ['denver', 39.739, -104.990, 'America/Denver', -6],
    ['seattle', 47.606, -122.332, 'America/Los_Angeles', -7], ['portland', 45.515, -122.678, 'America/Los_Angeles', -7],
    ['atlanta', 33.749, -84.388, 'America/New_York', -4], ['miami', 25.762, -80.192, 'America/New_York', -4],
    ['boston', 42.360, -71.058, 'America/New_York', -4], ['philadelphia', 39.953, -75.165, 'America/New_York', -4],
    ['detroit', 42.331, -83.046, 'America/Detroit', -4], ['minneapolis', 44.978, -93.265, 'America/Chicago', -5],
    ['new orleans', 29.951, -90.072, 'America/Chicago', -5], ['nashville', 36.163, -86.781, 'America/Chicago', -5],
    ['las vegas', 36.170, -115.140, 'America/Los_Angeles', -7], ['san diego', 32.716, -117.161, 'America/Los_Angeles', -7],
    ['honolulu', 21.307, -157.858, 'Pacific/Honolulu', -10], ['anchorage', 61.218, -149.900, 'America/Anchorage', -8],
    ['toronto', 43.653, -79.383, 'America/Toronto', -4], ['vancouver', 49.283, -123.121, 'America/Vancouver', -7],
    ['montreal', 45.502, -73.567, 'America/Toronto', -4], ['mexico city', 19.433, -99.133, 'America/Mexico_City', -6],
    ['london', 51.507, -0.128, 'Europe/London', 1], ['manchester', 53.480, -2.243, 'Europe/London', 1],
    ['dublin', 53.350, -6.260, 'Europe/Dublin', 1], ['paris', 48.857, 2.352, 'Europe/Paris', 2],
    ['berlin', 52.520, 13.405, 'Europe/Berlin', 2], ['madrid', 40.417, -3.704, 'Europe/Madrid', 2],
    ['barcelona', 41.385, 2.173, 'Europe/Madrid', 2], ['rome', 41.903, 12.496, 'Europe/Rome', 2],
    ['amsterdam', 52.368, 4.904, 'Europe/Amsterdam', 2], ['lisbon', 38.722, -9.139, 'Europe/Lisbon', 1],
    ['stockholm', 59.329, 18.069, 'Europe/Stockholm', 2], ['warsaw', 52.230, 21.012, 'Europe/Warsaw', 2],
    ['istanbul', 41.008, 28.978, 'Europe/Istanbul', 3], ['moscow', 55.756, 37.617, 'Europe/Moscow', 3],
    ['cairo', 30.044, 31.236, 'Africa/Cairo', 3], ['lagos', 6.524, 3.379, 'Africa/Lagos', 1],
    ['nairobi', -1.286, 36.817, 'Africa/Nairobi', 3], ['johannesburg', -26.204, 28.047, 'Africa/Johannesburg', 2],
    ['dubai', 25.205, 55.271, 'Asia/Dubai', 4], ['karachi', 24.861, 67.010, 'Asia/Karachi', 5],
    ['mumbai', 19.076, 72.878, 'Asia/Kolkata', 5.5], ['delhi', 28.614, 77.209, 'Asia/Kolkata', 5.5],
    ['bangalore', 12.972, 77.595, 'Asia/Kolkata', 5.5], ['bangkok', 13.756, 100.502, 'Asia/Bangkok', 7],
    ['singapore', 1.352, 103.820, 'Asia/Singapore', 8], ['hong kong', 22.320, 114.170, 'Asia/Hong_Kong', 8],
    ['shanghai', 31.230, 121.474, 'Asia/Shanghai', 8], ['beijing', 39.904, 116.407, 'Asia/Shanghai', 8],
    ['seoul', 37.567, 126.978, 'Asia/Seoul', 9], ['tokyo', 35.690, 139.692, 'Asia/Tokyo', 9],
    ['manila', 14.599, 120.984, 'Asia/Manila', 8], ['jakarta', -6.208, 106.846, 'Asia/Jakarta', 7],
    ['sydney', -33.868, 151.209, 'Australia/Sydney', 10], ['melbourne', -37.814, 144.963, 'Australia/Melbourne', 10],
    ['auckland', -36.848, 174.763, 'Pacific/Auckland', 12], ['sao paulo', -23.551, -46.633, 'America/Sao_Paulo', -3],
    ['rio de janeiro', -22.907, -43.173, 'America/Sao_Paulo', -3], ['buenos aires', -34.604, -58.382, 'America/Argentina/Buenos_Aires', -3],
    ['bogota', 4.711, -74.072, 'America/Bogota', -5], ['lima', -12.046, -77.043, 'America/Lima', -5],
    ['santiago', -33.449, -70.669, 'America/Santiago', -4]
  ];

  function uuid() {
    if (window.crypto && crypto.randomUUID) { try { return crypto.randomUUID(); } catch (e) {} }
    return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function nowISO() { return new Date().toISOString(); }
  /* The ledger keeps its last fifty events, and never drops the latest event
     of a consent to do it: the sync module sends the ledger from this list,
     and a mark (forOther, birthData, birthCleared) pushed out of it would
     never reach the account again (the 2.2 review's note, 30 October 2026). */
  function keepEvents(list) {
    var tail = list.slice(-50), last = {};
    list.forEach(function (e, i) { if (e && e.id) last[e.id] = i; });
    var start = list.length - tail.length;
    var extra = Object.keys(last).map(function (k) { return last[k]; })
      .filter(function (i) { return i < start; }).sort(function (a, b) { return a - b; })
      .map(function (i) { return list[i]; });
    return extra.concat(tail);
  }
  function read(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ---------- chart versions and chart notes (1.2) --------------------------
     data-contracts/HD-STUDY-MODEL.md, sections 3 and 4, approved by the owner
     on 29 October 2026. A corrected birth is a new version, never an
     overwrite: the profile keeps the current birth where it always has, and
     the history sits beside it under its own key. A version stores the birth,
     never the chart, because a stored chart outlives the arithmetic that made
     it. Notes are attached to an address (the vault's Chart address) and the
     version they were written against, and they are never moved, rewritten or
     deleted because the chart changed. */
  var CHART_NOTE_MAX = 4000;
  function versionsKey(id) { return 'incommon.p.' + id + '.chartVersions.v1'; }
  function notesKey(id) { return 'incommon.p.' + id + '.chartNotes.v1'; }
  function birthFields(p) {
    return { birth_date: p.birth_date || '', birth_time: p.birth_time || '',
      birth_time_unknown: p.birth_time_unknown === true, birth_location: p.birth_location || '',
      birth_lat: p.birth_lat == null ? null : p.birth_lat, birth_lon: p.birth_lon == null ? null : p.birth_lon,
      timezone: p.timezone || '', tz_offset: p.tz_offset == null ? null : p.tz_offset };
  }
  /* The birth record of section 2.2, for a profile. A typed profile has no
     precision, no source rating and no recorded offset, so those are null and
     the zone check is not_given. offset_used is what birth-time.js draws the
     chart with, which is the offset the zone had on that date. */
  function birthRecord(b) {
    var BT = window.BirthTime, used = b.tz_offset, state = b.birth_time ? 'known' : b.birth_time_unknown ? 'unknown' : 'unanswered';
    if (BT && BT.instant) {
      try {
        var r = BT.instant({ birthDate: b.birth_date, birthTime: b.birth_time, timeUnknown: b.birth_time_unknown,
          timezone: b.timezone, tzOffset: b.tz_offset });
        if (r) { if (typeof r.offset === 'number' && !isNaN(r.offset)) used = r.offset; state = r.timeState || state; }
      } catch (e) {}
    }
    return { date: b.birth_date, time: state === 'known' ? b.birth_time : null, time_state: state,
      time_precision: null, time_window_min: null, time_source: null,
      place: b.birth_location, lat: b.birth_lat, lon: b.birth_lon, zone: b.timezone,
      offset_recorded: null, offset_used: used == null ? null : used, zone_check: 'not_given' };
  }
  /* The key two versions are compared by: the birth itself, written out.
     Not PeopleLibrary.chartHash(), which carries STATE_VERSION, so every
     arithmetic change would make the same birth read as a new version
     (privacy review F14). Not a hash either: a hash of a birth is the birth
     to anybody who can enumerate the days and places (F10), so a hash would
     only look like it hid something. It never leaves the device in an
     export (share-rules.js), and on the server it sits beside the birth it
     describes, which the same reader already holds. */
  function birthKey(b) {
    var c = function (v) { return v == null || v === '' ? '' : String(v); };
    var ll = function (v) { return v == null || v === '' || isNaN(+v) ? '' : (+v).toFixed(4); };
    return ['b1', c(b.birth_date), c(b.birth_time), b.birth_time_unknown === true ? 'u' : '',
      ll(b.birth_lat), ll(b.birth_lon), c(b.timezone), c(b.tz_offset)].join('|');
  }
  function birthReason(a, b) {
    if (a.birth_date !== b.birth_date) return 'date_corrected';
    if (a.birth_time !== b.birth_time || a.birth_time_unknown !== b.birth_time_unknown) return 'time_corrected';
    if (a.birth_lat !== b.birth_lat || a.birth_lon !== b.birth_lon || a.birth_location !== b.birth_location) return 'place_corrected';
    return 'zone_repaired';
  }
  /* An address, as the vault's Chart address note proposes and section 2.3
     adopts. A channel is checked against the topology's thirty six when that
     module is loaded, and against the shape alone when it is not. */
  var CHART_CENTRES = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Spleen', 'Sacral', 'Solar Plexus', 'Root'];
  var CHART_BODIES = ['Sun', 'Earth', 'Moon', 'North Node', 'South Node', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  var CHART_FACETS = ['type', 'strategy', 'authority', 'profile', 'definition', 'cross'];
  function gateOk(n) { return /^\d{1,2}$/.test(n) && +n >= 1 && +n <= 64; }
  function chartAddressOk(a) {
    var m, s = String(a || '');
    if ((m = /^centre:(.+)$/.exec(s))) return CHART_CENTRES.indexOf(m[1]) !== -1;
    if ((m = /^gate:(\d+)$/.exec(s))) return gateOk(m[1]);
    if ((m = /^line:(\d+)\.([1-6])$/.exec(s))) return gateOk(m[1]);
    if ((m = /^channel:(\d+)-(\d+)$/.exec(s))) {
      if (!gateOk(m[1]) || !gateOk(m[2]) || +m[1] >= +m[2]) return false;
      var T = window.HDTopology;
      return T && Array.isArray(T.PAIRS) ? T.PAIRS.indexOf(+m[1] + '-' + +m[2]) !== -1 : true;
    }
    if ((m = /^activation:(personality|design):(.+)$/.exec(s))) return CHART_BODIES.indexOf(m[2]) !== -1;
    if ((m = /^facet:(.+)$/.exec(s))) return CHART_FACETS.indexOf(m[1]) !== -1;
    return false;
  }
  /* Key order is not meaning, so the comparison is over sorted keys. */
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
    return JSON.stringify(v);
  }

  /* Non-cryptographic PIN digest. A 4-digit PIN is a courtesy lock on a local
     device, not a security boundary: this is stated plainly in the UI. */
  function pinHash(pin, salt) {
    var s = String(salt || '') + '|' + String(pin || ''), h1 = 0x811c9dc5, h2 = 0x1000193;
    for (var i = 0; i < s.length; i++) {
      h1 = ((h1 ^ s.charCodeAt(i)) * 0x01000193) >>> 0;
      h2 = ((h2 + s.charCodeAt(i) * (i + 7)) * 2654435761) >>> 0;
    }
    return h1.toString(16) + h2.toString(16);
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  var PM = {
    VERSION: '1.8.2',
    MAX_PROFILES: MAX_PROFILES,
    COLORS: COLORS,
    CONSENT_TYPES: CONSENT_TYPES,
    /* incommon-cloud.js's completePinRecovery() recomputes this digest
       remotely (pm.pinHash(pin, profileId), the id as salt) so the PIN
       itself never travels; it was never on this object until the
       integration harness rewrite drove PIN recovery end to end and found
       recovery always failing with reason 'no-pm'. */
    pinHash: pinHash,

    /* ---------- store ---------- */
    _store: function () {
      var s = read(scope().root, null);
      if (!s || !Array.isArray(s.profiles)) s = { schemaVersion: 2, activeId: null, defaultId: null, profiles: [], pairs: [] };
      if (!Array.isArray(s.pairs)) s.pairs = [];
      if (!s.defaultId && s.profiles.length) s.defaultId = s.activeId || s.profiles[0].id;
      return s;
    },
    _save: function (s) { write(scope().root, s); this._emit('profiles:changed', {}); return s; },
    _emit: function (name, detail) {
      try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {}
      (this._subs || []).forEach(function (fn) { try { fn(name, detail); } catch (e) {} });
    },
    subscribe: function (fn) { (this._subs = this._subs || []).push(fn); return function () {}; },

    /* ---------- the account this device's profiles belong to ---------- */
    /* The signed in account's id, or null for the guest store. */
    owner: function () { return scope().owner; },
    /* A device wide key that holds one account's data (ACCOUNT_KEYS): the app
       reads and writes those through here so each account keeps its own. */
    accountKey: function (key) { return scoped(key, scope().owner); },
    /* Every key on this device that belongs to the signed in account: its
       store, its ACCOUNT_KEYS, and every key scoped to one of its profiles.
       Erasing these and nothing else is what "erase this device" means once
       one browser can hold several accounts. */
    accountStorageKeys: function () {
      var sc = scope(), ids = this._store().profiles.map(function (p) { return p.id; }), out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || '';
          if (k === sc.root || ids.some(function (id) { return k.indexOf(id) !== -1; })) out.push(k);
        }
      } catch (e) {}
      ACCOUNT_KEYS.forEach(function (k) { var a = scoped(k, sc.owner); if (out.indexOf(a) === -1) out.push(a); });
      return out;
    },

    /* The people this account's profiles saved, removed from people-library's
       device wide store (G6). accountStorageKeys() matches key names, and that
       store is one key holding every profile's people, so erasing the keys
       leaves them: "erase this device" calls this first. Another account's
       people, and the guest's, stay. */
    forgetAccountPeople: function () {
      var self = this, n = 0;
      this._store().profiles.forEach(function (p) { self._forgetPeople(p.id); n++; });
      return n;
    },

    /* The account is gone and the reader kept what was on the device: it
       becomes the guest's, which is what the delete dialog promises ("you can
       keep using inCommon without an account"). Left under the account's key
       it would belong to an id nobody can sign in as again. Profiles join any
       the guest already has; an account key moves only where the guest has
       none of its own. */
    releaseToGuest: function () {
      var sc = scope();
      if (!sc.owner) return false;
      try {
        var mine = read(sc.root, null), guest = read(ROOT, null);
        if (mine && Array.isArray(mine.profiles)) {
          if (!guest || !Array.isArray(guest.profiles) || !guest.profiles.length) guest = mine;
          else {
            guest.profiles = guest.profiles.concat(mine.profiles);
            guest.pairs = (guest.pairs || []).concat(mine.pairs || []);
          }
          write(ROOT, guest);
        }
        localStorage.removeItem(sc.root);
        ACCOUNT_KEYS.forEach(function (k) {
          var a = scoped(k, sc.owner), v = localStorage.getItem(a);
          if (v != null && localStorage.getItem(k) == null) localStorage.setItem(k, v);
          localStorage.removeItem(a);
        });
      } catch (e) { return false; }
      return true;
    },

    /* ---------- scoped keys, every read of profile data goes through here ---------- */
    keyFor: function (base, profileId) {
      var id = profileId || this.activeId();
      if (!id) throw new Error('ProfileManager: no active profile, refusing an unscoped ' + base + ' access');
      return base + '.' + id;
    },

    /* ---------- profiles ---------- */
    listProfiles: function () {
      var s = this._store();
      return s.profiles.map(function (p) {
        return { id: p.id, name: p.name, avatarColor: p.avatar_color, initials: initials(p.name),
          avatarKind: p.avatar_kind || 'initials', avatarImage: p.avatar_image || '', avatarSign: p.avatar_sign || '',
          isActive: p.id === s.activeId, isDefault: p.id === s.defaultId, birthDate: p.birth_date, birthTime: p.birth_time,
          birthLocation: p.birth_location, hasPin: !!p.pin_hash, createdAt: p.created_at, forOther: p.for_other === true };
      });
    },
    /* The reader's own profiles and the ones made for somebody else, apart
       (privacy review F9, the owner's (c) of 30 October 2026). A screen that
       lists profiles shows the two as two groups, never one list. */
    ownProfiles: function () { return this.listProfiles().filter(function (p) { return !p.forOther; }); },
    otherProfiles: function () { return this.listProfiles().filter(function (p) { return p.forOther; }); },
    /* A profile made for somebody else stays on this device: the sync module
       sends nothing of it and asks the server to delete any copy it already
       holds, which the 'profile:for-other' event queues. It is the owner's (b)
       of 30 October 2026, the rule section 5 of HD-STUDY-MODEL.md keeps for
       every other person's chart. The Oracle and the card are the app's to
       refuse for it, through isForOther(). */
    isForOther: function (id) {
      var s = this._store(), pid = id || s.activeId, hit = false;
      s.profiles.forEach(function (p) { if (p.id === pid && p.for_other === true) hit = true; });
      return hit;
    },
    setProfileForOther: function (id, on) {
      var s = this._store(), target = null;
      s.profiles.forEach(function (p) { if (p.id === id) target = p; });
      if (!target) throw new Error('No such profile');
      if (!!on === (target.for_other === true)) return this.getProfile(id);
      /* The key is absent rather than false on the reader's own profiles, so
         a profile that was never marked hashes exactly as it did before. */
      if (on) target.for_other = true; else delete target.for_other;
      this._save(s);
      /* The mark travels in the consent ledger, which every device merges
         whatever the birth switch says, so the account's other devices learn
         it and stop sending the profile (the follow-up review's finding 2). */
      this.setConsent('forOther', !!on, id);
      this._emit('profile:for-other', { id: id, forOther: !!on });
      return this.getProfile(id);
    },
    count: function () { return this._store().profiles.length; },
    atCapacity: function () { return this.count() >= MAX_PROFILES; },
    activeId: function () { return this._store().activeId; },
    defaultId: function () { var s = this._store(); return s.defaultId || s.activeId; },
    /* The profile that opens on launch. Independent of who is active right now. */
    setDefaultProfile: function (id) {
      var s = this._store();
      if (!s.profiles.some(function (p) { return p.id === id; })) throw new Error('No such profile');
      s.defaultId = id; this._save(s);
      this._emit('profile:default-changed', { id: id });
      return this.getProfile(id);
    },
    /* Launch resolution: default → active → first. Returns null when there are
       no profiles at all, which the app treats as "force the create flow". */
    resolveLaunchProfile: function () {
      var s = this._store();
      if (!s.profiles.length) return null;
      var want = s.defaultId || s.activeId;
      if (!s.profiles.some(function (p) { return p.id === want; })) want = s.profiles[0].id;
      if (s.activeId !== want) { s.activeId = want; this._save(s); }
      return this.getProfile(want);
    },
    getProfile: function (id) {
      var s = this._store(), p = null;
      s.profiles.forEach(function (x) { if (x.id === id) p = x; });
      return p ? this._decorate(p, s) : null;
    },
    getActiveProfile: function () {
      var s = this._store();
      if (!s.activeId) return null;
      return this.getProfile(s.activeId);
    },
    _decorate: function (p, s) {
      var out = {
        id: p.id, name: p.name, avatarColor: p.avatar_color, initials: initials(p.name),
        avatarKind: p.avatar_kind || 'initials', avatarImage: p.avatar_image || '', avatarSign: p.avatar_sign || '',
        pinSet: !!p.pin_hash, createdAt: p.created_at, isActive: p.id === (s || this._store()).activeId,
        birthDate: p.birth_date || '', birthTime: p.birth_time || '', birthLocation: p.birth_location || '',
        birthLat: p.birth_lat == null ? null : p.birth_lat, birthLon: p.birth_lon == null ? null : p.birth_lon,
        tzOffset: p.tz_offset == null ? null : p.tz_offset, timezone: p.timezone || '',
        locationResolved: !!p.location_resolved, forOther: p.for_other === true,
        /* The stamp is what invalidates every cached chart, so the answer to
           the time question belongs in it: saying "I do not know" changes what
           the app is allowed to draw, and a cache that survived that change
           would keep drawing the old answer. The zone and the stored offset
           belong in it for the same reason: they move the birth instant, and
           reresolveLocations() changes a zone while keeping the coordinates,
           so a stamp without them let a kept Oracle reading and the Cycle
           Audit scan outlive the correction (1.3, D-09). */
        birthStamp: [p.birth_date, p.birth_time, p.birth_lat, p.birth_lon, p.birth_time_unknown ? 'u' : '',
          p.timezone || '', p.tz_offset == null ? '' : p.tz_offset].join('|')
      };
      out.isDefault = p.id === (s || this._store()).defaultId;
      out.hasBirthTime = !!(p.birth_time && /^\d{2}:\d{2}$/.test(p.birth_time));
      out.hasCoords = out.birthLat != null && out.birthLon != null;
      out.timedChart = out.hasBirthTime && out.hasCoords;
      /* THREE STATES, NOT TWO. A blank time is not an answer: it is either a
         reader who said they do not know (timeUnknown) or a question nobody
         has put to them yet (neither flag set). Charts read the same either
         way; the difference is what the screen is allowed to say, and whether
         it is still worth asking. */
      out.timeUnknown = p.birth_time_unknown === true && !out.hasBirthTime;
      out.timeAnswered = out.hasBirthTime || out.timeUnknown;
      out.summary = out.birthDate
        ? 'Born ' + out.birthDate + (out.hasBirthTime ? ' at ' + out.birthTime : out.timeUnknown ? ' (time unknown)' : ' (no time entered)') + (out.birthLocation ? ' in ' + out.birthLocation : '')
        : 'Birth data not set';
      return out;
    },

    geocode: function (text) {
      var q = String(text || '').trim().toLowerCase();
      if (!q) return { resolved: false, lat: null, lon: null, timezone: '', tzOffset: null };
      /* Manual coordinates the user typed in the fallback fields: "38.9,-77.0" */
      var manual = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
      if (manual) return { resolved: true, lat: +manual[1], lon: +manual[2], timezone: 'manual', tzOffset: Math.round(+manual[2] / 15) };
      /* Places found through the online lookup, remembered on this device.
         Checked ahead of the gazetteer because this entry is a choice somebody
         made for this exact spelling, and a choice outranks a default: someone
         who typed "Springfield" and picked the Illinois one should keep it,
         not be moved to Missouri because Missouri's is larger. */
      if (window.GeoOnline) {
        var c = window.GeoOnline.resolve(text);
        if (c) return { resolved: true, lat: c.lat, lon: c.lon, timezone: c.timezone, tzOffset: c.tzOffset };
      }
      if (window.Gazetteer) {
        var g = window.Gazetteer.lookup(text);
        if (g) return { resolved: true, lat: g.lat, lon: g.lon, timezone: g.timezone, tzOffset: g.tzOffset };
      }
      /* Last resort, and only if the gazetteer module did not load at all.

         This compared with indexOf, which meant the query merely had to contain
         one of these names somewhere. "Manchester, NH" resolved to Manchester,
         England; "Paris, TX" to Paris, France. Both wrote foreign coordinates
         onto a birth chart and reported themselves resolved. The list is a
         safety net for a missing script, not a search index, so it now answers
         only to its own name, optionally followed by a region. */
      for (var i = 0; i < CITIES.length; i++) {
        var c = CITIES[i][0];
        if (q === c || q.slice(0, c.length + 1) === c + ',' || q.slice(0, c.length + 1) === c + ' ') {
          return { resolved: true, lat: CITIES[i][1], lon: CITIES[i][2], timezone: CITIES[i][3], tzOffset: CITIES[i][4] };
        }
      }
      return { resolved: false, lat: null, lon: null, timezone: '', tzOffset: null };
    },

    createProfile: function (opts) {
      opts = opts || {};
      var s = this._store();
      if (s.profiles.length >= MAX_PROFILES) throw new Error('Maximum of ' + MAX_PROFILES + ' profiles reached');
      var name = String(opts.name || '').trim();
      if (!name) throw new Error('A profile needs a name');
      var geo = this.geocode(opts.birthLocation);
      var p = {
        id: uuid(), name: name, avatar_color: opts.avatarColor || COLORS[0], pin_hash: null,
        avatar_kind: opts.avatarKind || 'initials', avatar_image: opts.avatarImage || '', avatar_sign: opts.avatarSign || '',
        created_at: nowISO(), birth_date: opts.birthDate || '', birth_time: opts.birthTime || '',
        birth_location: String(opts.birthLocation || '').trim(),
        birth_lat: geo.lat, birth_lon: geo.lon, timezone: geo.timezone, tz_offset: geo.tzOffset,
        location_resolved: geo.resolved,
        birth_time_unknown: opts.timeUnknown === true
      };
      if (opts.forOther === true) p.for_other = true;
      s.profiles.push(p);
      if (!s.activeId || s.profiles.length === 1) s.activeId = p.id;
      if (!s.defaultId) s.defaultId = p.id;
      this._save(s);
      /* Memory consents start off. birthData starts on with a birth date: it
         is "Save my profile to my account", and since 30 October 2026 the sync
         module reads it (privacy review F2, the owner: "it serves no purpose
         if it defaults with no option"). Off keeps the birth on this device. */
      this.initConsents(p.id);
      if (p.birth_date) this.setConsent('birthData', true, p.id);
      if (p.for_other) this.setConsent('forOther', true, p.id);
      this.invalidateCalculations(p.id);
      this._emit('profile:created', { id: p.id });
      return this.getProfile(p.id);
    },

    updateProfile: function (id, patch) {
      patch = patch || {};
      var s = this._store(), target = null;
      s.profiles.forEach(function (p) { if (p.id === id) target = p; });
      if (!target) throw new Error('No such profile');
      var birthChanged = false, before = birthFields(target);
      if (patch.name != null && String(patch.name).trim()) target.name = String(patch.name).trim();
      if (patch.avatarColor) target.avatar_color = patch.avatarColor;
      /* Avatar face: 'initials' | 'photo' | 'sign'. The photo is a downscaled data
         URL written by the app; it never leaves the device. */
      if (patch.avatarKind) target.avatar_kind = patch.avatarKind;
      if (patch.avatarImage != null) target.avatar_image = patch.avatarImage;
      if (patch.avatarSign != null) target.avatar_sign = patch.avatarSign;
      ['birthDate', 'birthTime', 'birthLocation'].forEach(function (k) {
        var col = k === 'birthDate' ? 'birth_date' : k === 'birthTime' ? 'birth_time' : 'birth_location';
        if (patch[k] != null && patch[k] !== target[col]) { target[col] = patch[k]; birthChanged = true; }
      });
      /* Answering the time question is a birth change like any other: it moves
         what the app may draw, so the cached charts go with it. A time and a
         declared unknown cannot both be true, and the time wins, because the
         reader typed it more recently than they shrugged. */
      if (patch.timeUnknown != null && (patch.timeUnknown === true) !== (target.birth_time_unknown === true)) {
        target.birth_time_unknown = patch.timeUnknown === true;
        if (target.birth_time_unknown) target.birth_time = '';
        birthChanged = true;
      }
      if (target.birth_time) target.birth_time_unknown = false;
      /* A profile saved before the gazetteer grew can hold a real city with null
         coordinates. Re-resolve whenever coords are missing, not only on change. */
      if (!birthChanged && target.birth_location && target.birth_lat == null) birthChanged = true;
      if (birthChanged) {
        var geo = this.geocode(target.birth_location);
        target.birth_lat = geo.lat; target.birth_lon = geo.lon;
        target.timezone = geo.timezone; target.tz_offset = geo.tzOffset;
        target.location_resolved = geo.resolved;
      }
      this._save(s);
      if (birthChanged) this._birthMoved(id, before, birthFields(target));
      /* Birth data drives every calculated system: drop all cached charts. */
      if (birthChanged) { this.invalidateCalculations(id); this._emit('profile:recalculated', { id: id }); }
      return this.getProfile(id);
    },

    setActiveProfile: function (id) {
      var s = this._store(), exists = s.profiles.some(function (p) { return p.id === id; });
      if (!exists) throw new Error('No such profile');
      if (s.activeId === id) return this.getProfile(id);
      var from = s.activeId;
      s.activeId = id;
      this._save(s);
      /* Hard requirement: nothing from the previous profile may survive the switch. */
      this.clearOkiContext();
      this._emit('profile:switched', { from: from, to: id });
      return this.getProfile(id);
    },

    deleteProfile: function (id, confirmName) {
      var s = this._store(), target = null;
      s.profiles.forEach(function (p) { if (p.id === id) target = p; });
      if (!target) throw new Error('No such profile');
      if (s.profiles.length <= 1) throw new Error('The last profile cannot be deleted');
      if (String(confirmName || '').trim() !== target.name) throw new Error('Name confirmation does not match');
      s.profiles = s.profiles.filter(function (p) { return p.id !== id; });
      s.pairs = s.pairs.filter(function (pr) { return pr.a !== id && pr.b !== id; });
      if (s.defaultId === id) s.defaultId = s.profiles[0].id;
      if (s.activeId === id) { s.activeId = s.profiles[0].id; this.clearOkiContext(); }
      this._save(s);
      this._dropProfileKeys(id);
      this._forgetPeople(id);
      this._emit('profile:deleted', { id: id });
      return this.getActiveProfile();
    },

    /* The people this profile saved go with it (G6, the owner, 30 October
       2026: "if a profile is deleted, delete it everywhere"). The saved
       people store is people-library.js's and device wide, keyed inside by
       the profile that saved them, so neither this module's keys nor the
       account's cascade reach it. Its own forgetOwner() is asked when the
       module is loaded; without it the one entry is removed directly, so the
       deletion does not depend on a module having loaded. Called for a
       deletion made here and for one another device made, never for the
       sample giving way to the account's own profile. */
    _forgetPeople: function (id) {
      var PL = null;
      try { PL = typeof window !== 'undefined' && window.PeopleLibrary; } catch (e) { PL = null; }
      if (PL && typeof PL.forgetOwner === 'function') { PL.forgetOwner(id); return; }
      try {
        var all = JSON.parse(localStorage.getItem(PEOPLE_KEY) || 'null');
        if (all && typeof all === 'object' && Object.prototype.hasOwnProperty.call(all, String(id))) {
          delete all[String(id)];
          localStorage.setItem(PEOPLE_KEY, JSON.stringify(all));
        }
      } catch (e) {}
    },

    /* Cascade: every scoped key for this profile is removed. Shared by a
       deletion here and a deletion another device made, which importSynced
       applies. */
    _dropProfileKeys: function (id) {
      ['incommon.consent', 'incommon.consent.data', 'incommon.p.' + id + '.memories',
        'incommon.p.' + id + '.throughline', 'incommon.p.' + id + '.oki', 'incommon.charts',
        'incommon.p.' + id + '.oracle', 'incommon.p.' + id + '.oracleConsent', 'incommon.p.' + id + '.oracleDeep',
        'incommon.p.' + id + '.study', versionsKey(id), notesKey(id)
      ].forEach(function (base) { drop(base.indexOf(id) === -1 ? base + '.' + id : base); });
      delete (this._calcCache || {})[id];
    },

    /* ---------- chart versions (1.2, HD-STUDY-MODEL.md section 4) ----------
       Called after a birth field changed and the store was saved. The first
       birth a profile is given is not a correction, so it makes no version;
       the first correction writes the old birth as version 1 and the new one
       as version 2, and every correction after that adds one. The sample
       chart is nobody's, so replacing it is not a correction either. Clearing
       the birth date clears the history (O8): a reader who clears their birth
       data has asked for it to be gone, and a history that kept every earlier
       birth would defeat the button. Notes stay; they are the reader's own
       words, and read as unresolved until a birth is given again. */
    _birthMoved: function (id, before, after) {
      /* When the birth last moved on this device, and whether it was cleared,
         so a Clear birth data made on another device can be told from a birth
         given here since (the follow-up review's finding 1). The clear is a
         ledger event, which syncs whatever the birth switch says, and it
         carries no birth data. */
      if (birthKey(before) !== birthKey(after)) {
        var st = this._store(), at = nowISO();
        st.profiles.forEach(function (p) { if (p.id === id) p.birth_at = at; });
        this._save(st);
        var bc = this.consentState('birthCleared', id);
        if (!after.birth_date && before.birth_date) this.setConsent('birthCleared', true, id);
        else if (after.birth_date && bc.granted) this.setConsent('birthCleared', false, id);
      }
      /* Clear birth data (O8). The history goes, and so does every note's
         record of what its address resolved to, because that is derived from
         the birth (privacy review F4): a gate and line list kept after the
         date is cleared is the date by another name. The words stay, and
         read as unresolved. */
      if (!after.birth_date) {
        drop(versionsKey(id));
        var cr = read(notesKey(id), null);
        if (cr && Array.isArray(cr.notes) && cr.notes.some(function (n) { return n.resolved != null; })) {
          cr.notes.forEach(function (n) { n.resolved = null; });
          write(notesKey(id), cr);
        }
        return null;
      }
      if (!before.birth_date) return null;
      if (read(scoped('incommon.sample', scope().owner), '') === id) return null;
      if (birthKey(before) === birthKey(after)) return null;
      var rec = read(versionsKey(id), null);
      if (!rec || !Array.isArray(rec.versions)) rec = { v: 1, versions: [] };
      var make = function (b, reason) {
        return { id: uuid(), subject: 'profile:' + id, seq: rec.versions.length + 1, reason: reason,
          birth: birthRecord(b), birth_key: birthKey(b), created_at: nowISO() };
      };
      var first = null;
      if (!rec.versions.length) { first = make(before, 'initial'); rec.versions.push(first); }
      var v = make(after, birthReason(before, after));
      rec.versions.push(v);
      if (!write(versionsKey(id), rec)) return null;
      /* A note written before any correction was written against the birth
         that is now version 1, so it is given that version's id. */
      if (first) {
        var nr = read(notesKey(id), null);
        if (nr && Array.isArray(nr.notes) && nr.notes.some(function (n) { return n.version == null; })) {
          nr.notes.forEach(function (n) { if (n.version == null) n.version = first.id; });
          write(notesKey(id), nr);
        }
      }
      this._emit('chart:versioned', { id: id, version: v.id, reason: v.reason });
      return v;
    },
    listChartVersions: function (id) {
      var pid = id || this.activeId();
      var rec = pid ? read(versionsKey(pid), null) : null;
      return rec && Array.isArray(rec.versions) ? rec.versions.slice() : [];
    },
    /* The version a note written now belongs to: the latest, or null while
       the birth has never been corrected. */
    currentChartVersion: function (id) {
      var list = this.listChartVersions(id);
      return list.length ? list[list.length - 1] : null;
    },

    /* ---------- chart notes (1.2, HD-STUDY-MODEL.md section 3) ---------------
       The reader's own words about a part of their own chart. Kept on the
       device whatever the consent switches say; the journal consent (O1)
       decides only whether they leave it, once sync is built. */
    chartAddressOk: function (a) { return chartAddressOk(a); },
    listChartNotes: function (id, filter) {
      var pid = id || this.activeId(), f = filter || {};
      var rec = pid ? read(notesKey(pid), null) : null;
      var out = rec && Array.isArray(rec.notes) ? rec.notes.slice() : [];
      if (f.address) out = out.filter(function (n) { return n.address === f.address; });
      if (f.version !== undefined) out = out.filter(function (n) { return n.version === f.version; });
      return out;
    },
    addChartNote: function (id, o) {
      var pid = id || this.activeId();
      if (!this.getProfile(pid)) throw new Error('No such profile');
      o = o || {};
      if (!chartAddressOk(o.address)) throw new Error('Not a chart address: ' + o.address);
      var text = String(o.text == null ? '' : o.text);
      if (!text.trim()) throw new Error('A note needs some words');
      if (text.length > CHART_NOTE_MAX) throw new Error('A note holds at most ' + CHART_NOTE_MAX + ' characters');
      var cur = this.currentChartVersion(pid), at = nowISO();
      var note = { id: uuid(), subject: 'profile:' + pid, address: o.address, version: cur ? cur.id : null,
        resolved: o.resolved == null ? null : o.resolved, text: text, created_at: at, updated_at: at };
      var rec = read(notesKey(pid), null);
      if (!rec || !Array.isArray(rec.notes)) rec = { v: 1, notes: [] };
      rec.notes.push(note);
      if (!write(notesKey(pid), rec)) throw new Error('The note could not be saved on this device');
      this._emit('chart:note', { id: pid, note: note.id, action: 'added' });
      return note;
    },
    /* Editing changes the words only. What the address resolved to when the
       note was written stays as it was, because that is what a later reading
       is compared with. */
    updateChartNote: function (id, noteId, text) {
      var pid = id || this.activeId(), rec = read(notesKey(pid), null), hit = null;
      var t = String(text == null ? '' : text);
      if (!t.trim()) throw new Error('A note needs some words');
      if (t.length > CHART_NOTE_MAX) throw new Error('A note holds at most ' + CHART_NOTE_MAX + ' characters');
      ((rec && rec.notes) || []).forEach(function (n) { if (n.id === noteId) { n.text = t; n.updated_at = nowISO(); hit = n; } });
      if (!hit) throw new Error('No such note');
      write(notesKey(pid), rec);
      this._emit('chart:note', { id: pid, note: noteId, action: 'updated' });
      return hit;
    },
    deleteChartNote: function (id, noteId) {
      var pid = id || this.activeId(), rec = read(notesKey(pid), null);
      var list = (rec && rec.notes) || [], kept = list.filter(function (n) { return n.id !== noteId; });
      if (kept.length === list.length) return false;
      rec.notes = kept;
      write(notesKey(pid), rec);
      this._emit('chart:note', { id: pid, note: noteId, action: 'deleted' });
      return true;
    },
    /* Section 3.2: the note's address resolved again against the current
       chart, compared with what it resolved to when written. The caller
       resolves (it holds the chart); this only compares. */
    chartNoteStatus: function (note, resolvedNow) {
      if (!note || resolvedNow == null) return 'unresolved';
      if (note.resolved == null) return 'unresolved';
      return stable(note.resolved) === stable(resolvedNow) ? 'same' : 'changed';
    },

    /* ---------- PIN ---------- */
    setProfilePin: function (id, pin) {
      var s = this._store(), ok = false;
      s.profiles.forEach(function (p) { if (p.id === id) { p.pin_hash = pinHash(pin, p.id); ok = true; } });
      if (!ok) throw new Error('No such profile');
      this._save(s); return true;
    },
    clearProfilePin: function (id) {
      var s = this._store();
      s.profiles.forEach(function (p) { if (p.id === id) p.pin_hash = null; });
      this._save(s); return true;
    },
    requiresPin: function (id) { var s = this._store(), r = false; s.profiles.forEach(function (p) { if (p.id === id) r = !!p.pin_hash; }); return r; },
    verifyProfilePin: function (id, pin) {
      var s = this._store(), hash = null;
      s.profiles.forEach(function (p) { if (p.id === id) hash = p.pin_hash; });
      if (!hash) return true;
      return pinHash(pin, id) === hash;
    },

    /* ---------- per-profile consents ---------- */
    initConsents: function (id) {
      var k = this.keyFor('incommon.consent', id);
      if (read(k, null)) return;
      var rec = { schemaVersion: 3, profileId: id, updatedAt: nowISO(), consents: {}, events: [] };
      CONSENT_TYPES.forEach(function (t) { rec.consents[t] = { granted: false, updatedAt: null }; });
      write(k, rec);
    },
    getConsents: function (id) {
      var rec = read(this.keyFor('incommon.consent', id), null), out = {};
      CONSENT_TYPES.forEach(function (t) { out[t] = !!(rec && rec.consents && rec.consents[t] && rec.consents[t].granted); });
      if (!out.birthData && this._birthUndecided(id, rec)) out.birthData = true;
      return out;
    },
    /* birthData that was never decided reads as on while the profile holds a
       birth date, because that is what createProfile has always recorded and
       what every profile given its birth later was synced as. Only a decision,
       the switch turned off, reads as off. Without this a profile given its
       birth after it was made would show the switch off while it synced, and
       would stop syncing the moment the push started reading the switch. */
    _birthUndecided: function (id, rec) {
      var c = rec && rec.consents && rec.consents.birthData;
      if (c && c.updatedAt) return false;
      var s = this._store(), pid = id || s.activeId, has = false;
      s.profiles.forEach(function (p) { if (p.id === pid && p.birth_date) has = true; });
      return has;
    },
    /* One consent as the sync module needs it to merge with the account's
       ledger: what it reads now, and when it was decided (null if never). */
    consentState: function (type, id) {
      var rec = read(this.keyFor('incommon.consent', id), null);
      var c = rec && rec.consents && rec.consents[type];
      var granted = !!(c && c.granted);
      if (type === 'birthData' && !granted && this._birthUndecided(id, rec)) granted = true;
      return { granted: granted, at: c && c.updatedAt ? c.updatedAt : null };
    },
    setConsent: function (type, granted, id) {
      var pid = id || this.activeId(), k = this.keyFor('incommon.consent', pid), rec = read(k, null), ts = nowISO();
      if (!rec || !rec.consents) { this.initConsents(pid); rec = read(k, null); }
      rec.consents[type] = { granted: !!granted, updatedAt: ts };
      rec.updatedAt = ts;
      rec.events = keepEvents((rec.events || []).concat([{ ts: ts, id: type, granted: !!granted }]));
      write(k, rec);
      this._emit('consent:changed', { profileId: pid, type: type, granted: !!granted });
      return this.getConsents(pid);
    },

    /* ---------- per-profile memories ----------
       Single write path for everything the app remembers about a person.
       Each memory type is bound to the consent flag that governs it: a write
       with consent off is refused and reported, never silently dropped. */
    MEMORY_CONSENT: { journal: 'journal', mood: 'mood', practice_completion: 'assessments', stella_conversation: 'conversation', chart_note: 'journal' },
    ENFORCE_ON_WRITE: { stella_conversation: true },
    consentFor: function (type) { return this.MEMORY_CONSENT[type] || null; },

    addMemory: function (a, b, c, d) {
      /* Object form: addMemory({ profileId, type, content, isPrivate, consentRequired, keep })
         Positional form kept for the earlier call sites: (type, content, isPrivate, id) */
      var o = (a && typeof a === 'object' && !Array.isArray(a)) ? a
        : { type: a, content: b, isPrivate: c, profileId: d };
      var pid = o.profileId || this.activeId();
      if (!pid) return { ok: false, reason: 'no-active-profile' };
      var type = o.type;
      var need = o.consentRequired !== undefined ? o.consentRequired : this.consentFor(type);
      var granted = !need || this.getConsents(pid)[need];
      /* Only records the app generates on the user's behalf are refused outright.
         Something the user typed is always kept for them: consent decides
         whether OKI may read it (enforced in getMemory), not whether the
         person gets to keep their own writing. */
      if (!granted && this.ENFORCE_ON_WRITE[type]) return { ok: false, reason: 'consent-off', consentRequired: need, type: type };
      var k = 'incommon.p.' + pid + '.memories', list = read(k, []);
      var row = { id: uuid(), profile_id: pid, memory_type: type, content: JSON.stringify(o.content == null ? {} : o.content),
        created_at: o.createdAt || nowISO(), is_private: o.isPrivate ? 1 : 0, consent_required: need || null };
      /* keep: the reader asked for this one entry to stay in view while its
         consent is off. It is a mark on the row rather than a null consent, so
         the entry still says which consent it belongs to, and getMemory reads
         the mark. A type the app writes on the reader's behalf cannot carry it. */
      var keep = !!o.keep && !this.ENFORCE_ON_WRITE[type];
      if (keep) row.kept = 1;
      list.unshift(row);
      write(k, list.slice(0, 800));
      this._emit('memory:added', { profileId: pid, type: type });
      return { ok: true, id: row.id, stellaVisible: granted || keep, kept: keep, memory: this._hydrate(row) };
    },

    _hydrate: function (m) {
      var c = m.content; try { c = JSON.parse(m.content); } catch (e) {}
      return { id: m.id, profileId: m.profile_id, type: m.memory_type, memoryType: m.memory_type,
        content: c, createdAt: m.created_at, isPrivate: !!m.is_private, consentRequired: m.consent_required || null, kept: !!m.kept };
    },

    /* getMemory({ profileId, type, respectConsent })
       respectConsent defaults TRUE: revoking a consent hides that type from every
       reader (Oki, Throughline, export) without destroying the rows, so the
       user can turn it back on and find their history intact. */
    getMemory: function (opts) {
      opts = opts || {};
      if (typeof opts === 'string') opts = { type: opts };
      var pid = opts.profileId || this.activeId();
      if (!pid) return [];
      var self = this, respect = opts.respectConsent !== false, con = this.getConsents(pid);
      return read('incommon.p.' + pid + '.memories', [])
        .filter(function (m) {
          if (m.profile_id !== pid) return false;
          if (opts.type && m.memory_type !== opts.type) return false;
          if (opts.includePrivate === false && m.is_private) return false;
          if (respect && !m.kept) { var need = m.consent_required || self.consentFor(m.memory_type); if (need && !con[need]) return false; }
          return true;
        })
        .map(function (m) { return self._hydrate(m); });
    },
    listMemories: function (memoryType, id) { return this.getMemory({ type: memoryType, profileId: id, respectConsent: false }); },

    memoryCounts: function (id) {
      var pid = id || this.activeId(), out = { journal: 0, mood: 0, practice_completion: 0, stella_conversation: 0 };
      read('incommon.p.' + pid + '.memories', []).forEach(function (m) {
        if (m.profile_id !== pid) return;
        out[m.memory_type] = (out[m.memory_type] || 0) + 1;
      });
      return out;
    },

    /* Hard delete. Called on consent revocation when the user chooses to erase
       rather than hide, and by the per-category Delete buttons in Settings. */
    deleteMemory: function (opts) {
      opts = opts || {};
      if (typeof opts === 'string') opts = { type: opts };
      var pid = opts.profileId || this.activeId(), k = 'incommon.p.' + pid + '.memories';
      var before = read(k, []), after = before.filter(function (m) {
        if (m.profile_id !== pid) return true;
        if (opts.id) return m.id !== opts.id;
        if (opts.type) return m.memory_type !== opts.type;
        return false;
      });
      write(k, after);
      /* The id travels with the event, so the cloud module deletes that one
         row remotely rather than every memory the profile has. */
      this._emit('memory:deleted', { profileId: pid, type: opts.type || null, id: opts.id || null, removed: before.length - after.length });
      return before.length - after.length;
    },

    /* ---------- two-person consent ---------- */
    _pairKey: function (a, b) { return [a, b].sort().join('::'); },
    getTwoPersonConsent: function (a, b) {
      var s = this._store(), key = this._pairKey(a, b), found = null;
      s.pairs.forEach(function (p) { if (p.key === key) found = p; });
      return found ? { enabled: !!found.enabled, enabledBy: found.enabled_by, enabledAt: found.enabled_at }
        : { enabled: false, enabledBy: null, enabledAt: null };
    },
    setTwoPersonConsent: function (a, b, enabled, initiatedBy) {
      var s = this._store(), key = this._pairKey(a, b), found = null;
      s.pairs.forEach(function (p) { if (p.key === key) found = p; });
      if (!found) { found = { key: key, a: a, b: b, enabled: 0, enabled_by: null, enabled_at: null }; s.pairs.push(found); }
      found.enabled = enabled ? 1 : 0;
      found.enabled_by = enabled ? (initiatedBy || this.activeId()) : found.enabled_by;
      found.enabled_at = nowISO();
      this._save(s);
      this._emit('consent:two-person', { a: a, b: b, enabled: !!enabled });
      return this.getTwoPersonConsent(a, b);
    },
    sharedPartners: function (id) {
      var pid = id || this.activeId(), self = this, out = [];
      this._store().pairs.forEach(function (p) {
        if (!p.enabled) return;
        if (p.a === pid) out.push(p.b); else if (p.b === pid) out.push(p.a);
      });
      return out.map(function (x) { return self.getProfile(x); }).filter(Boolean);
    },

    /* ---------- calculated systems ----------
       The app owns the ephemeris (incommon-core + the chart engine in the DC).
       It registers one calculator here so charts are computed in exactly one
       place and cached per profile until birth data changes. */
    registerCalculator: function (fn) { this._calc = fn; this._calcCache = {}; },
    invalidateCalculations: function (id) {
      if (!this._calcCache) return;
      if (id) delete this._calcCache[id]; else this._calcCache = {};
    },
    getCalculations: function (id) {
      var p = id ? this.getProfile(id) : this.getActiveProfile();
      /* The app registers its chart engine here. A global fallback keeps the hook
         alive if this module is re-evaluated after the app already registered. */
      var fn = this._calc || window.__incommonCalcFor;
      if (!p || !fn) return null;
      this._calc = fn;
      this._calcCache = this._calcCache || {};
      var hit = this._calcCache[p.id];
      if (hit && hit.stamp === p.birthStamp) return hit.value;
      var value = fn(p);
      this._calcCache[p.id] = { stamp: p.birthStamp, value: value };
      return value;
    },
    getSabianSymbolsForProfile: function (id) {
      var calc = this.getCalculations(id), S = window.SabianSymbols;
      if (!calc || !S || !Array.isArray(calc.natal)) return [];
      return calc.natal.map(function (pl) {
        var s = S.at(pl.lon);
        return { body: pl.name, glyph: pl.glyph, degree: s.degree, sign: s.sign, degreeInSign: s.degreeInSign,
          address: s.address, symbol: s.symbol, keyword: s.keyword, verified: s.verified };
      });
    },

    /* ---------- Oki isolation ---------- */
    clearOkiContext: function () {
      this._promptCache = null;
      this._emit('oki:context-cleared', {});
    },

    /* Repairs profiles whose location text never resolved against an older,
       smaller gazetteer, or that were placed in Puerto Rico with the wrong
       zone. Returns the ids whose charts must be recomputed. */
    reresolveLocations: function () {
      var s = this._store(), fixed = [], self = this, before = {};
      s.profiles.forEach(function (p) { before[p.id] = birthFields(p); });
      s.profiles.forEach(function (p) {
        /* A Puerto Rico place saved while the list filed the island under New
           York's zone carries New_York: an hour out every winter. Its
           coordinates are right, so only the zone is put back. */
        if (p.timezone === 'America/New_York' && p.birth_lat >= 17.8 && p.birth_lat <= 18.6 && p.birth_lon >= -67.3 && p.birth_lon <= -65.2) {
          p.timezone = 'America/Puerto_Rico'; p.tz_offset = -4;
          fixed.push(p.id);
          return;
        }
        if (!p.birth_location || p.birth_lat != null) return;
        var geo = self.geocode(p.birth_location);
        if (!geo.resolved) return;
        p.birth_lat = geo.lat; p.birth_lon = geo.lon;
        p.timezone = geo.timezone; p.tz_offset = geo.tzOffset;
        p.location_resolved = true;
        fixed.push(p.id);
      });
      if (fixed.length) {
        this._save(s);
        /* A repair moves the instant, so it is a version like a correction
           the reader made (the owner's decision O7). */
        s.profiles.forEach(function (p) { if (fixed.indexOf(p.id) !== -1) self._birthMoved(p.id, before[p.id], birthFields(p)); });
        fixed.forEach(function (id) { self.invalidateCalculations(id); });
        this._emit('profile:recalculated', { ids: fixed });
      }
      return fixed;
    },

    /* ---------- migration ---------- */
    migrateLegacyProfile: function (legacy) {
      legacy = legacy || {};
      var s = this._store();
      if (s.profiles.length) return { migrated: false, reason: 'profiles already exist' };
      var p = this.createProfile({
        name: legacy.name || 'Default Profile',
        birthDate: legacy.birthDate || '',
        birthTime: legacy.birthTime || '',
        birthLocation: legacy.birthLocation || '',
        avatarColor: COLORS[0]
      });
      var moved = [];
      /* Legacy global keys → scoped keys for the new default profile. They are
         the device's history from before profiles, so only the guest store
         takes them: an account opening a blank store is a new reader, and
         the claim above already gave the first account what was here. */
      if (scope().owner) return { migrated: true, profileId: p.id, name: p.name, moved: moved };
      [['incommon.consent', 'incommon.consent'], ['incommon.consent.data', 'incommon.consent.data'],
       ['incommon.throughline.manual', 'incommon.p.' + p.id + '.throughline']
      ].forEach(function (pair) {
        var old = read(pair[0], null);
        if (old == null) return;
        var dest = pair[1].indexOf(p.id) === -1 ? pair[1] + '.' + p.id : pair[1];
        write(dest, old); moved.push(pair[0]);
      });
      return { migrated: true, profileId: p.id, name: p.name, moved: moved };
    },

    /* ---------- what another device wrote, brought down by the cloud ----------
       incommon-cloud.js decides what changed (it holds the record of what
       this device last synced); this is the one place it is written, so the
       storage shapes stay this module's. Nothing here is a local act, so it
       emits sync:pulled and never profile:deleted or memory:deleted: those
       would queue the same deletion back up to the server.

       d.profiles        full local profile objects, replaced by id or added
       d.removeProfiles  ids another device deleted (never the last profile)
       d.activeId        the profile to open, when this device had none of its own
       d.defaultId       the default, likewise
       d.pairs           two-person consent records, replaced by key or added
       d.memories        { pid: { add: [raw rows], remove: [ids] } }
       d.consents        { pid: [{ ts, id, granted }] } merged into the ledger
       d.lists           { pid: { throughline: [items], oki: [items] } } appended
       d.recalc          ids whose birth data changed */
    importSynced: function (d) {
      d = d || {};
      var self = this, out = { profiles: 0, removed: 0, memories: 0, consents: 0, entries: 0 };
      /* Deleted on another device, and so deleted here, whatever this device
         did to it since (the owner, 30 October 2026: "if a profile is
         deleted, delete it everywhere"). The deleted profiles go first, and
         then, if that leaves this device with none and the pull brings none,
         it starts over with a fresh one, as the delete dialog does on the
         device it was deleted on; that one is new here and goes up like any
         other. Removing first is what lets a device whose six profiles were
         all deleted end on the fresh one in this pull: made first, it had no
         room. */
      var dead = {};
      (d.deletedProfiles || []).forEach(function (id) { dead[id] = 1; });
      var s0 = this._store();
      var gone = s0.profiles.filter(function (p) { return dead[p.id]; }).map(function (p) { return p.id; });
      if (gone.length) {
        s0.profiles = s0.profiles.filter(function (p) { return !dead[p.id]; });
        s0.pairs = (s0.pairs || []).filter(function (pr) { return !dead[pr.a] && !dead[pr.b]; });
        write(scope().root, s0);
        gone.forEach(function (id) { self._dropProfileKeys(id); out.removed++; });
        if (!s0.profiles.length && !(d.profiles || []).some(function (p) { return p && !dead[p.id]; })) {
          var fresh = this.createProfile({ name: 'Default Profile' });
          var s1 = this._store(); s1.activeId = fresh.id; s1.defaultId = fresh.id; write(scope().root, s1);
        }
      }
      (d.deletedProfiles || []).forEach(function (id) { self._forgetPeople(id); });
      var s = this._store();
      (d.removeProfiles || []).forEach(function (id) {
        if (s.profiles.length <= 1 && !(d.profiles || []).length) return;
        var before = s.profiles.length;
        s.profiles = s.profiles.filter(function (p) { return p.id !== id; });
        if (s.profiles.length === before) return;
        s.pairs = s.pairs.filter(function (pr) { return pr.a !== id && pr.b !== id; });
        self._dropProfileKeys(id);
        out.removed++;
      });
      var arrived = {};
      (d.profiles || []).forEach(function (p) {
        if (!p || !p.id) return;
        var i = -1;
        s.profiles.forEach(function (x, j) { if (x.id === p.id) i = j; });
        if (i !== -1 && p.birth_date && birthKey(s.profiles[i]) !== birthKey(p)) arrived[p.id] = 1;
        if (i !== -1) s.profiles[i] = p;
        else if (s.profiles.length < MAX_PROFILES) s.profiles.push(p);
        else return;
        out.profiles++;
      });
      var has = function (id) { return s.profiles.some(function (p) { return p.id === id; }); };
      if (d.activeId && has(d.activeId)) s.activeId = d.activeId;
      if (d.defaultId && has(d.defaultId)) s.defaultId = d.defaultId;
      if (!has(s.activeId)) s.activeId = s.profiles.length ? s.profiles[0].id : null;
      if (!has(s.defaultId)) s.defaultId = s.activeId;
      (d.pairs || []).forEach(function (pr) {
        if (!pr || !pr.key) return;
        var i = -1;
        s.pairs.forEach(function (x, j) { if (x.key === pr.key) i = j; });
        if (i !== -1) s.pairs[i] = pr; else s.pairs.push(pr);
      });
      write(scope().root, s);

      var when = function (x) { var t = Date.parse(x); return isNaN(t) ? 0 : t; };
      var clearAt = {};
      Object.keys(d.consents || {}).forEach(function (pid) {
        if (!has(pid)) return;
        self.initConsents(pid);
        var k = 'incommon.consent.' + pid, rec = read(k, null), seen = {}, all = [];
        (rec.events || []).concat(d.consents[pid] || []).forEach(function (e) {
          if (!e || !e.id) return;
          var sig = e.id + '@' + e.ts;
          if (seen[sig]) return;
          seen[sig] = 1; all.push({ ts: e.ts, id: e.id, granted: !!e.granted });
        });
        all.sort(function (a, b) { return when(a.ts) - when(b.ts); });
        /* The newest Clear birth data, whatever came after it: a clear and
           then a new birth leaves the ledger on the revoke the new birth
           writes, and a device that missed both still owes the clear. */
        all.forEach(function (e) { if (e.id === 'birthCleared' && e.granted) clearAt[pid] = e.ts; });
        /* The latest event for each consent is its state, whichever device it
           was made on. */
        all.forEach(function (e) { rec.consents[e.id] = { granted: e.granted, updatedAt: e.ts }; });
        rec.events = keepEvents(all);
        if (all.length) rec.updatedAt = all[all.length - 1].ts;
        write(k, rec);
        out.consents++;
      });
      /* Two marks the account's other devices made, read from the merged
         ledger: a profile made for somebody else, and a Clear birth data.
         Neither carries any birth data, so both travel whatever the birth
         switch says. The newest clear is acted on whether or not a new birth
         followed it (the ledger then ends on that birth's revoke), and only
         when the birth this device held is older than the clear: then this
         device's history and what its notes resolved to are of the cleared
         birth, and go. The birth fields go too while the clear is still in
         force; after a new birth the pulled row has already brought it. A
         birth that arrives in a pull is this device's birth from then on, so
         its birth_at moves to now and a later pull does not clear what is
         written about it. */
      var st2 = this._store(), moved = false, dropped = [];
      st2.profiles.forEach(function (p) {
        if (!d.consents || !d.consents[p.id]) return;
        var rec2 = read('incommon.consent.' + p.id, null), c2 = (rec2 && rec2.consents) || {};
        var fo = c2.forOther;
        if (fo && fo.updatedAt && !!fo.granted !== (p.for_other === true)) {
          if (fo.granted) p.for_other = true; else delete p.for_other;
          moved = true;
        }
        var bc = c2.birthCleared, cut = clearAt[p.id];
        var older = !!cut && (!p.birth_at || when(p.birth_at) < when(cut));
        if (older && bc && bc.granted && (p.birth_date || p.birth_time || p.birth_location)) {
          p.birth_date = ''; p.birth_time = ''; p.birth_location = ''; p.birth_lat = null; p.birth_lon = null;
          p.timezone = ''; p.tz_offset = null; p.location_resolved = false; p.birth_time_unknown = false;
          p.birth_at = bc.updatedAt;
          moved = true;
        } else if (arrived[p.id]) {
          p.birth_at = nowISO();
          moved = true;
        }
        if (older) dropped.push(p.id);
      });
      if (moved) write(scope().root, st2);
      dropped.forEach(function (pid) {
        drop(versionsKey(pid));
        var nr = read(notesKey(pid), null);
        if (nr && Array.isArray(nr.notes) && nr.notes.some(function (n) { return n.resolved != null; })) {
          nr.notes.forEach(function (n) { n.resolved = null; });
          write(notesKey(pid), nr);
        }
        self.invalidateCalculations(pid);
      });
      Object.keys(d.memories || {}).forEach(function (pid) {
        if (!has(pid)) return;
        var k = 'incommon.p.' + pid + '.memories', m = d.memories[pid] || {}, gone = {};
        (m.remove || []).forEach(function (id) { gone[id] = 1; });
        var list = read(k, []).filter(function (r) { return !gone[r.id]; }), ids = {};
        list.forEach(function (r) { ids[r.id] = 1; });
        (m.add || []).forEach(function (r) { if (r && r.id && !ids[r.id]) { ids[r.id] = 1; list.push(r); out.memories++; } });
        list.sort(function (a, b) { return when(b.created_at) - when(a.created_at); });
        write(k, list.slice(0, 800));
      });
      Object.keys(d.lists || {}).forEach(function (pid) {
        if (!has(pid)) return;
        ['throughline', 'oki'].forEach(function (which) {
          var add = (d.lists[pid] || {})[which];
          if (!add || !add.length) return;
          var k = 'incommon.p.' + pid + '.' + which, arr = read(k, []);
          if (!Array.isArray(arr)) arr = arr ? [arr] : [];
          arr = arr.concat(add);
          /* Newest first, the order the app writes them in. An entry's time is
             its at, else its date, else the stamp in its m<time> id. */
          var at = function (x) {
            if (!x) return 0;
            if (typeof x.at === 'number') return x.at;
            var t = when(x.date || x.created_at);
            if (t) return t;
            var n = /^m(\d{10,})$/.exec(String(x.id || ''));
            return n ? Number(n[1]) : 0;
          };
          if (which === 'throughline') arr = arr.map(function (x, i) { return [x, i]; })
            .sort(function (a, b) { return (at(b[0]) - at(a[0])) || (a[1] - b[1]); }).map(function (p) { return p[0]; });
          write(k, arr);
          out.entries += add.length;
        });
      });
      (d.recalc || []).forEach(function (id) { self.invalidateCalculations(id); });
      this._emit('profiles:changed', {});
      this._emit('sync:pulled', out);
      return out;
    },

    /* ---------- export ---------- */
    exportProfile: function (id) {
      var pid = id || this.activeId(), p = this.getProfile(pid);
      return {
        exportedAt: nowISO(), schema: 'incommon.profile.v1', scope: 'single-profile',
        profile: p, consents: this.getConsents(pid),
        consentedData: read(this.keyFor('incommon.consent.data', pid), {}),
        memories: this.getMemory({ profileId: pid }),
        memoryCounts: this.memoryCounts(pid),
        withheldByConsent: (function (self) {
          var all = self.listMemories(null, pid).length, shown = self.getMemory({ profileId: pid }).length;
          return all - shown;
        })(this),
        throughline: read('incommon.p.' + pid + '.throughline', []),
        /* 1.2: the birth's history and the notes on the chart. The notes are
           withheld while the journal consent is off, as journal entries are,
           and counted so the export says something was left out. */
        chartVersions: this.listChartVersions(pid),
        chartNotes: this.getConsents(pid).journal ? this.listChartNotes(pid) : [],
        chartNotesWithheld: this.getConsents(pid).journal ? 0 : this.listChartNotes(pid).length,
        sharedWith: this.sharedPartners(pid).map(function (x) { return x.name; })
      };
    },
    exportAll: function () {
      var self = this;
      return { exportedAt: nowISO(), schema: 'incommon.profiles.v1', scope: 'all-profiles',
        profiles: this.listProfiles().map(function (p) { return self.exportProfile(p.id); }) };
    }
  };

  window.ProfileManager = PM;
})();
