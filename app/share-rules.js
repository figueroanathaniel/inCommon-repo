/*! share-rules.js: what a chart handout and a chart export may carry. V1.0.0 (UMD)
 *
 * Assignment 2.2, Task 3. A birth date, time and place together identify a
 * person, and the person on a handout is often not the reader: a client, a
 * partner, a child. This module is the one place a handout or an export file
 * is shaped, so the rules cannot drift between the screens that build them.
 *
 * THE SHAPE IS THE PROMISE, as in analytics.js. Nothing here spreads the chart
 * it is given. Every field a payload carries is named below and copied one at
 * a time, so a chart object that carries a latitude, a zone, an email or a
 * stored hash cannot leak any of them by accident.
 *
 * WHAT A HANDOUT CARRIES BY DEFAULT is Type, Strategy, Authority, Profile and
 * Definition, the notes the reader picked, and, on the reader's own chart,
 * their first name. That is all, because that is all that was measured to be
 * a crowd rather than a fingerprint (tools/measure-handout-identifiability.js,
 * 29 October 2026: over 3,000 random births from 1950 to 2010, those five put
 * a birth among a median of 23 others; adding only the defined centres left
 * 39% of births alone, the channels 88%, and every activation with its line
 * named the date to one day in two centuries and the time to about an hour).
 * So the centres, the channels, the gates and the activations are treated as
 * birth data here, exactly as the date, time and place are: each one is off
 * until the reader turns it on.
 *
 * ANOTHER PERSON'S CHART needs that person's word for anything beyond the
 * default. A client's chart needs it for any handout at all, because a
 * practitioner's handout is the thing a client is asked about
 * (data-contracts/HD-STUDY-MODEL.md, section 5). The word is the record the
 * reader keeps, subject_consent with basis card or stated and handout in its
 * scope, not withdrawn. The app cannot verify a stated consent and this file
 * does not pretend to; it only refuses to go further than the record says.
 *
 * A NAME ON A HANDOUT IS A FIRST NAME, and it is off by default for anybody
 * but the reader.
 *
 * NOTES travel as their words. What an address resolved to when a note was
 * written (gate and line values) never travels, and a note's address goes only
 * when the part it names is on the handout too.
 *
 * AN EXPORT is the reader's own backup, made and kept on the device. It carries
 * their own birth data and notes by default and other people only when the
 * reader ticks it (the owner's decision O5), and its includes header says what
 * is in it.
 *
 * NOTHING HERE SENDS ANYTHING. There is no share link (O6): a handout or an
 * export leaves the device only through the reader's own download or share
 * sheet. An unknown option is refused rather than ignored, so a caller that
 * misspells one finds out instead of shipping what it meant to leave out.
 *
 * No dash characters.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShareRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';
  var HANDOUT_SCHEMA = 'incommon.handout.v1';
  var EXPORT_SCHEMA = 'incommon.charts.v1';
  var KINDS = ['self', 'person', 'client'];
  var BASE = ['type', 'strategy', 'authority', 'profile', 'definition'];
  /* Every option a handout takes. All but name are birth data for the purpose
     of consent: see the header. */
  var OPTIONS = ['name', 'centres', 'channels', 'gates', 'activations', 'birthDate', 'birthTime', 'birthPlace'];
  var NEEDS_WORD = ['centres', 'channels', 'gates', 'activations', 'birthDate', 'birthTime', 'birthPlace'];
  var CENTRES = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Spleen', 'Sacral', 'Solar Plexus', 'Root'];
  var SIDES = ['personality', 'design'];
  var BODIES = ['Sun', 'Earth', 'Moon', 'North Node', 'South Node', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  var EXPORT_OPTIONS = ['birthData', 'notes', 'people'];
  var BIRTH_FIELDS = ['date', 'time', 'time_state', 'time_precision', 'time_window_min', 'time_source',
    'place', 'lat', 'lon', 'zone', 'offset_recorded', 'offset_used', 'zone_check'];
  var NOTE_MAX = 4000;

  function fail(reason, detail) { return detail === undefined ? { ok: false, reason: reason } : { ok: false, reason: reason, detail: detail }; }
  function text(v, max) { return v == null ? null : String(v).slice(0, max || 80); }
  function firstName(n) { var w = String(n == null ? '' : n).trim().split(/\s+/)[0]; return w ? w.slice(0, 40) : null; }
  function gateNo(v) { var n = +v; return n >= 1 && n <= 64 && Math.floor(n) === n ? n : null; }
  function lineNo(v) { var n = +v; return n >= 1 && n <= 6 && Math.floor(n) === n ? n : null; }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function hasWord(sc, what) {
    return !!(sc && !sc.withdrawn_at && (sc.basis === 'card' || sc.basis === 'stated') &&
      Array.isArray(sc.scope) && sc.scope.indexOf(what) !== -1);
  }

  /* Which handout option an address belongs to, so a note's address travels
     only beside the part of the chart it names. A facet is always on the
     handout; anything unrecognised never travels. */
  function addressNeeds(a) {
    var s = String(a || '');
    if (/^facet:/.test(s)) return 'base';
    if (/^centre:/.test(s)) return 'centres';
    if (/^channel:/.test(s)) return 'channels';
    if (/^(gate|line):/.test(s)) return 'gates';
    if (/^activation:/.test(s)) return 'activations';
    return null;
  }

  function handout(chart, opts) {
    var c = chart || {}, o = opts || {}, inc = o.include || {}, k;
    if (KINDS.indexOf(c.kind) === -1) return fail('kind');
    for (k in inc) if (own(inc, k) && OPTIONS.indexOf(k) === -1) return fail('unknown_option', k);
    for (k in o) if (own(o, k) && k !== 'include' && k !== 'notes') return fail('unknown_option', k);
    var on = {};
    OPTIONS.forEach(function (x) { on[x] = inc[x] === true; });
    if (inc.name === undefined) on.name = c.kind === 'self';
    var word = c.kind === 'self' || hasWord(c.subject_consent, 'handout');
    if (c.kind === 'client' && !word) return fail('no_consent');
    if (!word && NEEDS_WORD.some(function (x) { return on[x]; })) return fail('no_consent');

    var p = { schema: HANDOUT_SCHEMA, kind: c.kind };
    BASE.forEach(function (x) { p[x] = text(c[x], 60); });
    if (on.name) p.name = firstName(c.name);
    if (on.centres) p.centres = (Array.isArray(c.centres) ? c.centres : []).filter(function (x) { return CENTRES.indexOf(x) !== -1; });
    if (on.channels) p.channels = (Array.isArray(c.channels) ? c.channels : []).map(String)
      .filter(function (x) { var m = /^(\d{1,2})-(\d{1,2})$/.exec(x); return !!m && gateNo(m[1]) && gateNo(m[2]); });
    if (on.gates) p.gates = (Array.isArray(c.gates) ? c.gates : []).map(gateNo).filter(function (x) { return x != null; });
    if (on.activations) p.activations = (Array.isArray(c.activations) ? c.activations : [])
      .filter(function (a) { return a && SIDES.indexOf(a.side) !== -1 && BODIES.indexOf(a.body) !== -1 && gateNo(a.gate) && lineNo(a.line); })
      .map(function (a) { return { side: a.side, body: a.body, gate: gateNo(a.gate), line: lineNo(a.line) }; });
    if (on.birthDate || on.birthTime || on.birthPlace) {
      var b = c.birth || {};
      p.birth = {};
      if (on.birthDate) p.birth.date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : null;
      if (on.birthTime) p.birth.time = /^\d{2}:\d{2}$/.test(String(b.time)) ? String(b.time) : null;
      if (on.birthPlace) p.birth.place = text(b.place, 90);
    }
    var pick = Array.isArray(o.notes) ? o.notes : [];
    p.notes = (Array.isArray(c.notes) ? c.notes : []).filter(function (n) { return n && pick.indexOf(n.id) !== -1; })
      .map(function (n) {
        var out = { text: text(n.text, NOTE_MAX) }, need = addressNeeds(n.address);
        if (need === 'base' || (need && on[need])) out.address = String(n.address);
        return out;
      });
    p.includes = {};
    OPTIONS.forEach(function (x) { p.includes[x] = on[x]; });
    p.includes.notes = p.notes.length;
    return { ok: true, payload: p };
  }

  function birthOf(b) {
    if (!b || typeof b !== 'object') return null;
    var out = {};
    BIRTH_FIELDS.forEach(function (k) { if (own(b, k)) out[k] = b[k]; });
    return out;
  }

  /* subjects: [{ kind, id, display_name, birth, versions, notes, subject_consent }]
     opts: { birthData, notes, people }, the first two on unless set false, the
     last off unless set true. */
  function exportFile(subjects, opts, now) {
    var o = opts || {}, k;
    for (k in o) if (own(o, k) && EXPORT_OPTIONS.indexOf(k) === -1) return fail('unknown_option', k);
    var inc = { birth_data: o.birthData !== false, notes: o.notes !== false, people: o.people === true };
    var list = (Array.isArray(subjects) ? subjects : []).filter(function (s) {
      return s && KINDS.indexOf(s.kind) !== -1 && (s.kind === 'self' || inc.people);
    }).map(function (s) {
      var out = { kind: s.kind, id: text(s.id, 80), display_name: text(s.display_name, 80) };
      out.birth = inc.birth_data ? birthOf(s.birth) : null;
      out.versions = inc.birth_data ? (Array.isArray(s.versions) ? s.versions : []).map(function (v) {
        return { id: text(v.id, 80), seq: +v.seq || null, reason: text(v.reason, 40), birth: birthOf(v.birth),
          chart_hash: text(v.chart_hash, 80), created_at: text(v.created_at, 40) };
      }) : [];
      out.notes = inc.notes ? (Array.isArray(s.notes) ? s.notes : []).map(function (n) {
        var nn = { id: text(n.id, 80), address: text(n.address, 80), version: n.version == null ? null : text(n.version, 80),
          text: text(n.text, NOTE_MAX), created_at: text(n.created_at, 40), updated_at: text(n.updated_at, 40) };
        /* What the address meant when written is derived from the birth, so
           it goes only where the birth goes. */
        if (inc.birth_data && n.resolved != null) nn.resolved = JSON.parse(JSON.stringify(n.resolved));
        return nn;
      }) : [];
      if (s.kind !== 'self' && s.subject_consent) {
        var sc = s.subject_consent;
        out.subject_consent = { basis: text(sc.basis, 20), scope: Array.isArray(sc.scope) ? sc.scope.map(String) : [],
          stated_at: sc.stated_at == null ? null : text(sc.stated_at, 40), withdrawn_at: sc.withdrawn_at == null ? null : text(sc.withdrawn_at, 40) };
      }
      return out;
    });
    return { ok: true, file: { schema: EXPORT_SCHEMA, exported_at: (now ? new Date(now) : new Date()).toISOString(), includes: inc, subjects: list } };
  }

  return { VERSION: VERSION, HANDOUT_SCHEMA: HANDOUT_SCHEMA, EXPORT_SCHEMA: EXPORT_SCHEMA,
    OPTIONS: OPTIONS.slice(), NEEDS_WORD: NEEDS_WORD.slice(), EXPORT_OPTIONS: EXPORT_OPTIONS.slice(),
    handout: handout, exportFile: exportFile };
}));
