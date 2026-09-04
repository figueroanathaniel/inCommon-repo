/*! people-library.js: the people a reader saves. V1.0.0 (UMD)
 *
 * WHY THIS IS THE FIRST THING BUILT, AND NOT THE SECOND.
 *
 * A single personal chart is a one-time visit: once you have seen it, the app
 * is a calculator you close. A stored roster of other people is the only thing
 * on this roadmap that grows on its own as a life does, and everything
 * relational reads from it: two records for a composite, n for a family, groups
 * of records for a Union, one record for anybody's return chart but your own.
 * It is also the cheapest item on the list and the only one with no pairwise
 * cost. See docs/reference/jovian-archive/2026-08-28-phase-1-roadmap.md.
 *
 * THIS IS THE HIGHEST SENSITIVITY STORE IN THE PRODUCT, and that is not a
 * figure of speech. Every other store holds what the reader chose to write
 * about themselves. This one holds claims about third parties who never agreed
 * to be in an app at all, including minors, including the dead. Five rules
 * follow from that and none of them are negotiable:
 *
 *   1. NOTES ARE OFF. Not off by convention, off because the only writer in
 *      this file writes false and there is no second path in. A default that
 *      lives in a caller is a default somebody forgets.
 *   2. DELETING IS DELETING. The record and its notes go in the same write.
 *      There is no tombstone, no recycle bin, no seven day window. That window
 *      is right for the reader's own memories and wrong for somebody else's
 *      birth date.
 *   3. NO INVENTED PLACEMENTS. When the birth time is unknown, every time
 *      dependent field in the stored state is null. Not noon, not a guess, not
 *      an average. Row P4 asserts it.
 *   4. FOUR LAYERS, FOUR KEYS. Calculated fact, the reader's own words, the
 *      tradition, and synthesis come back as separate keys and are never
 *      joined here. A person record is the easiest place in the app to collapse
 *      them by accident, because they all describe one human being.
 *   5. NOTHING LEAVES. There is no server in this product, so there is nothing
 *      to encrypt against and nobody to encrypt from. The guarantee is not
 *      encryption at rest and this file will not claim it is: the guarantee is
 *      that the data never moves.
 *
 * NO STREAKS, NO COUNTERS, NO PROMPTS TO ADD ANYBODY. This module deliberately
 * exposes no "completeness" and no "last viewed", because a surface cannot
 * render a guilt trip out of a number that does not exist.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.PeopleLibrary = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  /* Bumped whenever the shape or the arithmetic of computed_state changes, so
     stored records can be recognised as stale and recomputed. It is also what
     invalidates the pair cache. */
  var STATE_VERSION = 1;
  var KEY = 'incommon.people.v1';
  var LEGACY_KEY = 'incommon.friends';
  var MAX_PEOPLE = 12;

  /* ---------- SHA-256, synchronous ----------------------------------------
     crypto.subtle is async and cannot be used inside a render path, and a
     chart hash is needed while building a row. This is the standard
     implementation, kept small. It is here rather than borrowed because the
     module has to run identically in the app and in the node gate. */
  function sha256hex(msg) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = [], i, c;
    var str = String(msg);
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c < 128) bytes.push(c);
      else if (c < 2048) { bytes.push(192 | (c >> 6), 128 | (c & 63)); }
      else { bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63)); }
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (i = 7; i >= 0; i--) bytes.push((i < 4 ? Math.floor(bitLen / Math.pow(2, 8 * i)) : 0) & 255);
    var w = new Array(64), a, b, cc, d, e, f, g, h, t1, t2, j;
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (i = 0; i < bytes.length; i += 64) {
      for (j = 0; j < 16; j++) {
        w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3];
      }
      for (j = 16; j < 64; j++) {
        var s0 = rr(w[j - 15], 7) ^ rr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        var s1 = rr(w[j - 2], 17) ^ rr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      a = H[0]; b = H[1]; cc = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];
      for (j = 0; j < 64; j++) {
        t1 = (h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & cc) ^ (b & cc))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return out;
  }

  /* ---------- wiring ------------------------------------------------------- */
  var store = null, compute = null, clock = null;
  /* The app injects the chart engine; the tests inject a plain object and a
     stub. Nothing in this file knows how to compute a chart, which is what
     keeps the store testable without a browser. */
  function configure(opts) {
    if (!opts) return;
    if (opts.store !== undefined) store = opts.store;
    if (opts.compute !== undefined) compute = opts.compute;
    if (opts.now !== undefined) clock = opts.now;
  }
  function backing() {
    if (store) return store;
    try { if (typeof localStorage !== 'undefined' && localStorage) return localStorage; } catch (e) {}
    return null;
  }
  function nowISO() { return (clock ? new Date(clock()) : new Date()).toISOString(); }
  function read() {
    var s = backing(); if (!s) return {};
    try { var v = JSON.parse(s.getItem(KEY)); return (v && typeof v === 'object') ? v : {}; } catch (e) { return {}; }
  }
  function write(all) {
    var s = backing(); if (!s) return;
    try { s.setItem(KEY, JSON.stringify(all)); } catch (e) {}
  }

  /* ---------- the birth input, normalised ---------------------------------
     THE HASH IS OVER THE MOMENT, NOT OVER THE CLOCK.

     Two records describing the same instant in different zones are the same
     birth and must produce the same hash, or the pair cache will hold two
     entries for one pair of people and the whole point of it is lost. So the
     canonical form is the UTC instant plus the rounded coordinates, and the
     wall clock the reader typed does not appear in it. Row P8 asserts this
     with the same birth expressed in Chicago and in UTC. */
  function normalize(input) {
    var b = input || {};
    var date = String(b.birth_date || b.birthDate || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    var time = String(b.birth_time || b.birthTime || '');
    var known = /^\d{2}:\d{2}$/.test(time);
    var offset = b.tz_offset != null ? +b.tz_offset : (b.tzOffset != null ? +b.tzOffset : 0);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    var hh = known ? +time.slice(0, 2) : 0, mi = known ? +time.slice(3, 5) : 0;
    /* An unknown time has no instant. It gets the date at 00:00 UTC as its
       canonical marker and a flag, so two unknown-time records for the same
       day and place are the same record and neither pretends to a moment. */
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3], known ? hh - offset : 0, known ? mi : 0);
    var lat = b.birth_lat != null ? +b.birth_lat : (b.birthLat != null ? +b.birthLat : null);
    var lon = b.birth_lon != null ? +b.birth_lon : (b.birthLon != null ? +b.birthLon : null);
    return {
      instant: ms,
      timeKnown: known,
      /* Four decimal places is about eleven metres, far finer than any birth
         record and coarse enough that two spellings of one city agree. */
      lat: lat == null ? null : Math.round(lat * 10000) / 10000,
      lon: lon == null ? null : Math.round(lon * 10000) / 10000
    };
  }

  function chartHash(input) {
    var n = normalize(input);
    if (!n) return '';
    var canon = ['v' + STATE_VERSION, n.instant, n.timeKnown ? 't' : 'u',
      n.lat == null ? 'x' : n.lat.toFixed(4), n.lon == null ? 'x' : n.lon.toFixed(4)].join('|');
    return sha256hex(canon).slice(0, 32);
  }

  /* ---------- the stored state -------------------------------------------
     NO INVENTED PLACEMENTS, AND THE DISTINCTION THAT MAKES IT WORKABLE.

     What is stored is never an estimate. When the birth time is unknown, every
     time dependent key here is null: no noon, no default, no average.

     What a SCREEN may do is different, and the difference is deliberate. A live
     view can still draw a provisional chart for an unknown time as long as it
     says so on the face of it, which is what birth-time.js availability() is
     for. The rule is that an estimate may be shown and labelled, and may never
     be written down as though it were a fact. A stored guess outlives the
     label that explained it. */
  var TIME_DEPENDENT = ['ascendant', 'midheaven', 'houses', 'house_rulers', 'moon', 'personal_points'];

  function computeStateFor(input) {
    var n = normalize(input);
    if (!n) return null;
    var raw = compute ? compute({ instant: n.instant, timeKnown: n.timeKnown, lat: n.lat, lon: n.lon }) : null;
    var state = { v: STATE_VERSION, longitudes: (raw && raw.longitudes) || null,
      gates: (raw && raw.gates) || null, channels: (raw && raw.channels) || null,
      centers: (raw && raw.centers) || null };
    TIME_DEPENDENT.forEach(function (k) {
      state[k] = n.timeKnown && raw && raw[k] !== undefined ? raw[k] : null;
    });
    state.time_unknown = !n.timeKnown;
    return state;
  }

  /* ---------- records ------------------------------------------------------ */
  function blank(owner, input) {
    var n = nowISO();
    var timeStr = String(input.birth_time || input.birthTime || '');
    var known = /^\d{2}:\d{2}$/.test(timeStr);
    return {
      id: 'p' + sha256hex(owner + '|' + n + '|' + Math.random()).slice(0, 16),
      owner: String(owner),
      display_name: String(input.display_name || input.name || '').slice(0, 80),
      relationship_label: input.relationship_label == null ? null : String(input.relationship_label).slice(0, 60),
      birth_date: String(input.birth_date || input.birthDate || '').slice(0, 10),
      birth_time: known ? timeStr.slice(0, 5) : null,
      birth_lat: input.birth_lat != null ? +input.birth_lat : (input.birthLat != null ? +input.birthLat : null),
      birth_lon: input.birth_lon != null ? +input.birth_lon : (input.birthLon != null ? +input.birthLon : null),
      birth_tz: String(input.birth_tz || input.timezone || ''),
      tz_offset: input.tz_offset != null ? +input.tz_offset : (input.tzOffset != null ? +input.tzOffset : null),
      /* Derived, never taken from the caller: a caller that could set this
         could set it wrong and there would be no way to tell afterwards. */
      time_unknown: !known,
      computed_state: null,
      computed_state_version: STATE_VERSION,
      chart_hash: '',
      /* THE DEFAULT LIVES HERE, in the only writer, and nowhere else. */
      notes_enabled: false,
      notes: null,
      source: String(input.source || 'manual'),
      created_at: n,
      updated_at: n
    };
  }

  function list(owner) {
    var all = read(), rows = all[String(owner)] || [];
    return rows.slice();
  }
  function count(owner) { return list(owner).length; }
  function room(owner) { return count(owner) < MAX_PEOPLE; }
  function get(owner, id) {
    var rows = list(owner);
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  /* The cap refuses rather than trims. A cap that drops the oldest record to
     make room deletes somebody's saved person without saying so. */
  function add(owner, input) {
    if (!input) return { ok: false, reason: 'empty' };
    var o = String(owner);
    var all = read(), rows = all[o] || [];
    if (rows.length >= MAX_PEOPLE) return { ok: false, reason: 'full', max: MAX_PEOPLE };
    var rec = blank(o, input);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.birth_date)) return { ok: false, reason: 'birth_date' };
    rec.chart_hash = chartHash(rec);
    rec.computed_state = computeStateFor(rec);
    /* Same birth moment, same place, already saved: this is the same person
       arriving twice, so it updates rather than duplicating. */
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].chart_hash && rows[i].chart_hash === rec.chart_hash) {
        rows[i] = merge(rows[i], { display_name: rec.display_name, relationship_label: rec.relationship_label });
        all[o] = rows; write(all);
        return { ok: true, record: rows[i], duplicateOf: rows[i].id };
      }
    }
    rows.unshift(rec);
    all[o] = rows; write(all);
    return { ok: true, record: rec };
  }

  function merge(rec, patch) {
    var out = {}, k;
    for (k in rec) out[k] = rec[k];
    ['display_name', 'relationship_label', 'birth_date', 'birth_time',
      'birth_lat', 'birth_lon', 'birth_tz', 'tz_offset'].forEach(function (f) {
      if (patch[f] !== undefined) out[f] = patch[f];
    });
    out.time_unknown = !/^\d{2}:\d{2}$/.test(String(out.birth_time || ''));
    if (out.time_unknown) out.birth_time = null;
    out.chart_hash = chartHash(out);
    out.computed_state = computeStateFor(out);
    out.computed_state_version = STATE_VERSION;
    out.updated_at = nowISO();
    return out;
  }

  function update(owner, id, patch) {
    var o = String(owner), all = read(), rows = all[o] || [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) {
        rows[i] = merge(rows[i], patch || {});
        all[o] = rows; write(all);
        return { ok: true, record: rows[i] };
      }
    }
    return { ok: false, reason: 'missing' };
  }

  /* One write removes the record and everything attached to it. There is no
     path that keeps the notes, because there is no second store to keep them
     in: the notes live on the record. */
  function remove(owner, id) {
    var o = String(owner), all = read(), rows = all[o] || [], out = [], gone = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) { gone = rows[i]; continue; }
      out.push(rows[i]);
    }
    if (!gone) return { ok: false, reason: 'missing' };
    all[o] = out; write(all);
    return { ok: true, removed: id, notesDestroyed: gone.notes != null };
  }

  /* Turning notes off destroys them. The switch is not a visibility toggle:
     a reader who turns notes off for somebody has said they do not want them
     held, and holding them anyway while hiding them is the opposite of what
     the control appears to do. */
  function enableNotes(owner, id, on) {
    var o = String(owner), all = read(), rows = all[o] || [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) {
        rows[i].notes_enabled = on === true;
        if (!rows[i].notes_enabled) rows[i].notes = null;
        rows[i].updated_at = nowISO();
        all[o] = rows; write(all);
        return { ok: true, notes_enabled: rows[i].notes_enabled, notesDestroyed: !rows[i].notes_enabled };
      }
    }
    return { ok: false, reason: 'missing' };
  }

  function setNotes(owner, id, text) {
    var o = String(owner), all = read(), rows = all[o] || [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) {
        if (!rows[i].notes_enabled) return { ok: false, reason: 'notes_disabled' };
        rows[i].notes = text == null ? null : String(text);
        rows[i].updated_at = nowISO();
        all[o] = rows; write(all);
        return { ok: true };
      }
    }
    return { ok: false, reason: 'missing' };
  }

  /* ---------- reading, in four separate layers -----------------------------
     They come back as four keys and are never joined here. A caller that wants
     them together has to do the joining itself, in a place where somebody
     reviewing the screen can see it happen. */
  function display(owner, id, parts) {
    var rec = get(owner, id);
    if (!rec) return null;
    var p = parts || {};
    return {
      id: rec.id,
      display_name: rec.display_name,
      relationship_label: rec.relationship_label,
      time_unknown: rec.time_unknown,
      calculated_fact: p.calculated_fact || null,
      user_words: rec.notes_enabled ? (rec.notes || null) : null,
      traditional: p.traditional || null,
      synthesis: p.synthesis || null,
      notes_enabled: rec.notes_enabled
    };
  }

  /* ---------- the one store, not two --------------------------------------
     The contacts store that shipped on 27 August held the same thing under a
     different name. It is migrated once and the old key is left in place
     rather than deleted, so a reader who downgrades does not lose anybody. */
  function migrateLegacy(owner) {
    var s = backing(); if (!s) return { migrated: 0 };
    var raw = null;
    try { raw = JSON.parse(s.getItem(LEGACY_KEY)); } catch (e) { raw = null; }
    if (!Array.isArray(raw) || !raw.length) return { migrated: 0 };
    var done = 0;
    raw.forEach(function (row) {
      var c = row && row.card;
      if (!c || !c.d) return;
      var r = add(owner, { display_name: c.n || 'Saved person', birth_date: c.d,
        birth_time: c.t || null, birth_lat: c.la, birth_lon: c.lo,
        birth_tz: c.tz || '', tz_offset: c.to,
        source: row.source === 'manual' ? 'manual' : 'card' });
      if (r.ok && !r.duplicateOf) done++;
    });
    return { migrated: done };
  }

  return {
    VERSION: VERSION, STATE_VERSION: STATE_VERSION, KEY: KEY, LEGACY_KEY: LEGACY_KEY,
    MAX_PEOPLE: MAX_PEOPLE, TIME_DEPENDENT: TIME_DEPENDENT,
    configure: configure, sha256hex: sha256hex,
    normalize: normalize, chartHash: chartHash, computeStateFor: computeStateFor,
    list: list, count: count, room: room, get: get,
    add: add, update: update, remove: remove,
    enableNotes: enableNotes, setNotes: setNotes, display: display,
    migrateLegacy: migrateLegacy
  };
}));
