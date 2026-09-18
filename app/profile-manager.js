/* profile-manager.js: inCommon multi-profile data layer. V1.3.0
   Pure JavaScript, no UI, no framework. Local-only: localStorage, no cloud sync.
   Every profile is fully isolated: consents, memories, conversations, and charts
   are stored under keys scoped by profile id.

   Storage map
     incommon.profiles.v1            { schemaVersion, activeId, profiles[], pairs[] }
     incommon.consent.<profileId>    consent record (same shape as the legacy global key)
     incommon.consent.data.<pid>     consented source data
     incommon.p.<pid>.memories       [{ id, memory_type, content, created_at, is_private }]
     incommon.p.<pid>.throughline    manual Throughline entries
     incommon.p.<pid>.stella         conversation history
   Legacy (pre-multi-profile) keys are migrated once by migrateLegacyProfile().  */
(function () {
  'use strict';
  var ROOT = 'incommon.profiles.v1';
  var MAX_PROFILES = 6;
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
  function read(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) {} }

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
    VERSION: '1.4.0',
    MAX_PROFILES: MAX_PROFILES,
    COLORS: COLORS,
    CONSENT_TYPES: CONSENT_TYPES,

    /* ---------- store ---------- */
    _store: function () {
      var s = read(ROOT, null);
      if (!s || !Array.isArray(s.profiles)) s = { schemaVersion: 2, activeId: null, defaultId: null, profiles: [], pairs: [] };
      if (!Array.isArray(s.pairs)) s.pairs = [];
      if (!s.defaultId && s.profiles.length) s.defaultId = s.activeId || s.profiles[0].id;
      return s;
    },
    _save: function (s) { write(ROOT, s); this._emit('profiles:changed', {}); return s; },
    _emit: function (name, detail) {
      try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) {}
      (this._subs || []).forEach(function (fn) { try { fn(name, detail); } catch (e) {} });
    },
    subscribe: function (fn) { (this._subs = this._subs || []).push(fn); return function () {}; },

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
          birthLocation: p.birth_location, hasPin: !!p.pin_hash, createdAt: p.created_at };
      });
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
        locationResolved: !!p.location_resolved, birthStamp: [p.birth_date, p.birth_time, p.birth_lat, p.birth_lon].join('|')
      };
      out.isDefault = p.id === (s || this._store()).defaultId;
      out.hasBirthTime = !!(p.birth_time && /^\d{2}:\d{2}$/.test(p.birth_time));
      out.hasCoords = out.birthLat != null && out.birthLon != null;
      out.timedChart = out.hasBirthTime && out.hasCoords;
      out.summary = out.birthDate
        ? 'Born ' + out.birthDate + (out.hasBirthTime ? ' at ' + out.birthTime : ' (time unknown)') + (out.birthLocation ? ' in ' + out.birthLocation : '')
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
        location_resolved: geo.resolved
      };
      s.profiles.push(p);
      if (!s.activeId || s.profiles.length === 1) s.activeId = p.id;
      if (!s.defaultId) s.defaultId = p.id;
      this._save(s);
      /* Memory consents start off. birthData is not a toggle: entering birth data
         IS the consent for the calculations it feeds, disclosed at creation and
         revocable only by deleting the profile. */
      this.initConsents(p.id);
      if (p.birth_date) this.setConsent('birthData', true, p.id);
      this.invalidateCalculations(p.id);
      this._emit('profile:created', { id: p.id });
      return this.getProfile(p.id);
    },

    updateProfile: function (id, patch) {
      patch = patch || {};
      var s = this._store(), target = null;
      s.profiles.forEach(function (p) { if (p.id === id) target = p; });
      if (!target) throw new Error('No such profile');
      var birthChanged = false;
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
      this.clearStellaContext();
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
      if (s.activeId === id) { s.activeId = s.profiles[0].id; this.clearStellaContext(); }
      this._save(s);
      /* Cascade: every scoped key for this profile is removed. */
      ['incommon.consent', 'incommon.consent.data', 'incommon.p.' + id + '.memories',
        'incommon.p.' + id + '.throughline', 'incommon.p.' + id + '.stella', 'incommon.charts'
      ].forEach(function (base) { drop(base.indexOf(id) === -1 ? base + '.' + id : base); });
      delete (this._calcCache || {})[id];
      this._emit('profile:deleted', { id: id });
      return this.getActiveProfile();
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
      return out;
    },
    setConsent: function (type, granted, id) {
      var pid = id || this.activeId(), k = this.keyFor('incommon.consent', pid), rec = read(k, null), ts = nowISO();
      if (!rec || !rec.consents) { this.initConsents(pid); rec = read(k, null); }
      rec.consents[type] = { granted: !!granted, updatedAt: ts };
      rec.updatedAt = ts;
      rec.events = (rec.events || []).concat([{ ts: ts, id: type, granted: !!granted }]).slice(-50);
      write(k, rec);
      this._emit('consent:changed', { profileId: pid, type: type, granted: !!granted });
      return this.getConsents(pid);
    },

    /* ---------- per-profile memories ----------
       Single write path for everything the app remembers about a person.
       Each memory type is bound to the consent flag that governs it: a write
       with consent off is refused and reported, never silently dropped. */
    MEMORY_CONSENT: { journal: 'journal', mood: 'mood', practice_completion: 'assessments', stella_conversation: 'conversation' },
    ENFORCE_ON_WRITE: { stella_conversation: true },
    consentFor: function (type) { return this.MEMORY_CONSENT[type] || null; },

    addMemory: function (a, b, c, d) {
      /* Object form: addMemory({ profileId, type, content, isPrivate, consentRequired })
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
         whether STELLA may read it (enforced in getMemory), not whether the
         person gets to keep their own writing. */
      if (!granted && this.ENFORCE_ON_WRITE[type]) return { ok: false, reason: 'consent-off', consentRequired: need, type: type };
      var k = 'incommon.p.' + pid + '.memories', list = read(k, []);
      var row = { id: uuid(), profile_id: pid, memory_type: type, content: JSON.stringify(o.content == null ? {} : o.content),
        created_at: o.createdAt || nowISO(), is_private: o.isPrivate ? 1 : 0, consent_required: need || null };
      list.unshift(row);
      write(k, list.slice(0, 800));
      this._emit('memory:added', { profileId: pid, type: type });
      return { ok: true, id: row.id, stellaVisible: granted, memory: this._hydrate(row) };
    },

    _hydrate: function (m) {
      var c = m.content; try { c = JSON.parse(m.content); } catch (e) {}
      return { id: m.id, profileId: m.profile_id, type: m.memory_type, memoryType: m.memory_type,
        content: c, createdAt: m.created_at, isPrivate: !!m.is_private, consentRequired: m.consent_required || null };
    },

    /* getMemory({ profileId, type, respectConsent })
       respectConsent defaults TRUE: revoking a consent hides that type from every
       reader (Stella, Throughline, export) without destroying the rows, so the
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
          if (respect) { var need = m.consent_required || self.consentFor(m.memory_type); if (need && !con[need]) return false; }
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
      this._emit('memory:deleted', { profileId: pid, type: opts.type || null, removed: before.length - after.length });
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
        return { astralBody: pl.name, glyph: pl.glyph, degree: s.degree, sign: s.sign, degreeInSign: s.degreeInSign,
          address: s.address, symbol: s.symbol, keyword: s.keyword, verified: s.verified };
      });
    },

    /* ---------- Stella isolation ---------- */
    clearStellaContext: function () {
      this._promptCache = null;
      this._emit('stella:context-cleared', {});
    },

    /* Repairs profiles whose location text never resolved against an older,
       smaller gazetteer. Returns the ids whose charts must be recomputed. */
    reresolveLocations: function () {
      var s = this._store(), fixed = [], self = this;
      s.profiles.forEach(function (p) {
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
      /* Legacy global keys → scoped keys for the new default profile. */
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
