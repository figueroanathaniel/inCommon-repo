/*! analytics.js: product measurement that cannot leak. V1.0.0 (UMD)
 *
 * WHY THIS EXISTS AT ALL. Not to watch anybody. It exists so that a later
 * question about which parts of the app are worth keeping can be answered with
 * something other than a guess, and because instrumentation is cheap to add now
 * and expensive to retrofit onto a shipped app. Nothing here changes what any
 * reader sees.
 *
 * THE SHAPE IS THE PROMISE. An event is a NAME FROM A FIXED LIST AND A DAY.
 * There is no payload parameter. emit() takes one argument and the writer only
 * ever writes a name it recognises, a day stamp and a count, so there is no
 * call site anywhere that could pass a journal line, a chart, a birth date or a
 * search term into this module even by accident. That is a stronger guarantee
 * than a policy about what callers should do, and it is the reason the function
 * is shaped this way rather than taking the usual properties object.
 *
 * OFF UNTIL ASKED. Nothing is aggregated and nothing is stored until the reader
 * turns it on. The default is off, the same default the sensitive memory
 * settings carry, and off means the store stays absent rather than collected
 * and withheld.
 *
 * LOCAL FIRST, AND THE ENDPOINT IS DARK. Everything aggregates on the device.
 * exportPayload() builds exactly what would be sent so the shape can be
 * reviewed, and transmit() refuses, every time, because ENDPOINT is null. The
 * interface is here; the wire is not. Turning it on is a deliberate change with
 * its own consent copy, not a constant to be filled in quietly.
 *
 * IT NEVER NOTIFIES. There is no reference to the Notification API in this
 * file and there must not be one. Quiet hours and category controls govern
 * anything that can interrupt a reader, so the safest way to be inside those
 * rules is to have nothing here that can interrupt anybody.
 *
 * NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Analytics = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  var OPTIN_KEY = 'incommon.analytics.optin';
  var AGG_KEY = 'incommon.analytics.agg';
  var SCHEMA = 1;

  /* The whole vocabulary. A name that is not on this list is dropped, so the
     list is the schema and docs/ANALYTICS-EVENTS.md is generated from it rather
     than written beside it. */
  var EVENTS = {
    chart_generated: 'A natal chart was drawn for the active profile.',
    connection_chart_generated: 'A composite of two charts was drawn.',
    contact_added: 'A second person was saved to this device.',
    contact_removed: 'A saved person was removed.',
    layer3_expanded: 'A traditional interpretation was opened by tapping to expand it.',
    layer4_expanded: 'A synthesis block was opened by tapping to expand it.',
    birth_data_confirmed: 'A resolved birth place and offset were confirmed.',
    birth_time_declared_unknown: 'The reader chose "I do not know my birth time".',
    birth_data_edited: 'Stored birth data was corrected after the fact.',
    connection_chart_cached: 'A composite was served from the pair cache instead of being computed.',
    person_added: 'A person was saved to the People Library.',
    person_removed: 'A person was removed from the People Library.',
    person_notes_enabled: 'Notes were switched on for one saved person.',
    library_cap_reached: 'An add was refused because the library was full.',
    feature_abandoned: 'A flow was left before it finished.',
    session_start: 'The app was opened.',
    session_end: 'The app was closed or backgrounded.'
  };

  /* Session length is a duration, not a moment, and a duration to the
     millisecond is close enough to a fingerprint to be worth blunting. Buckets
     are wide on purpose. */
  var BUCKETS = [[60000, 'under 1m'], [300000, '1m to 5m'], [900000, '5m to 15m'],
    [1800000, '15m to 30m'], [3600000, '30m to 1h'], [Infinity, 'over 1h']];

  /* THE HISTOGRAMS, AS FIXED BUCKET TABLES.

     Prompt D asks for people_records_per_user and group_size as histograms. A
     histogram whose label is the value is a payload by another name, and the
     one property this module has that a policy cannot give it is that there is
     nowhere to put content. So a value is mapped to a name from a table before
     anything is written, and the table is the whole vocabulary. */
  var HISTOGRAMS = {
    people_records: [[0, 'none'], [1, '1'], [3, '2 to 3'], [6, '4 to 6'], [12, '7 to 12'], [Infinity, 'over 12']],
    group_size: [[2, '2'], [5, '3 to 5'], [8, '6 to 8'], [12, '9 to 12'], [30, '13 to 30'], [Infinity, 'over 30']]
  };
  function bucketOf(table, n) {
    var v = +n;
    if (!(v >= 0)) return null;
    for (var i = 0; i < table.length; i++) if (v <= table[i][0]) return table[i][1];
    return table[table.length - 1][1];
  }

  var DAY_CAP = 90;
  var ENDPOINT = null; // deliberately dark. See the header.

  var store = null;

  function backing() {
    if (store) return store;
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) {}
    return null;
  }
  /* The app injects nothing; the tests inject a plain object with the same four
     methods, which is what lets this file be exercised without a browser. */
  function configure(opts) { store = (opts && opts.store) || null; }

  function read(k, fb) {
    var s = backing(); if (!s) return fb;
    try { var v = JSON.parse(s.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; }
  }
  function write(k, v) {
    var s = backing(); if (!s) return;
    try { s.setItem(k, JSON.stringify(v)); } catch (e) {}
  }
  function drop(k) {
    var s = backing(); if (!s) return;
    try { s.removeItem(k); } catch (e) {}
  }

  function today(now) {
    var d = now ? new Date(now) : new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function isOptedIn() { return read(OPTIN_KEY, false) === true; }

  /* Turning it off deletes what was gathered. An off switch that keeps the
     record is a pause button wearing the wrong label. */
  function optIn(on) {
    var v = on === true;
    write(OPTIN_KEY, v);
    if (!v) drop(AGG_KEY);
    return v;
  }

  function blank() { return { v: SCHEMA, days: {} }; }

  /* THE ONLY WRITER. Everything that reaches storage goes through here, and the
     three things it writes are a day stamp, a name that was already on the
     list, and an integer. There is no branch that writes anything else. */
  function bump(section, key, now) {
    if (!isOptedIn()) return false;
    var agg = read(AGG_KEY, null);
    if (!agg || agg.v !== SCHEMA || !agg.days) agg = blank();
    var day = today(now);
    var d = agg.days[day] || (agg.days[day] = { events: {}, sessions: {} });
    var bucket = d[section] || (d[section] = {});
    bucket[key] = (bucket[key] | 0) + 1;

    var keys = Object.keys(agg.days).sort();
    while (keys.length > DAY_CAP) { delete agg.days[keys.shift()]; }
    write(AGG_KEY, agg);
    return true;
  }

  /* One argument, by design. See the header: there is nowhere to put content,
     so no call site can leak any. */
  function emit(name) {
    if (!Object.prototype.hasOwnProperty.call(EVENTS, String(name))) return false;
    return bump('events', String(name));
  }

  /* One reading of a distribution, recorded as a bucket name. Returns the
     bucket so a caller can show the reader exactly what was written. */
  function observe(metric, value) {
    var table = HISTOGRAMS[String(metric)];
    if (!table) return false;
    var label = bucketOf(table, value);
    if (!label) return false;
    /* The cap alert Prompt D wants is not a server page. On a device it is the
       refusal at the cap plus this row, which is the same information without
       an alerting stack that does not exist. */
    if (!bump('hist_' + metric, label)) return false;
    return label;
  }

  function sessionEnd(durationMs) {
    var ms = +durationMs;
    if (!(ms >= 0)) return false;
    var label = 'over 1h';
    for (var i = 0; i < BUCKETS.length; i++) { if (ms < BUCKETS[i][0]) { label = BUCKETS[i][1]; break; } }
    bump('events', 'session_end');
    return bump('sessions', label);
  }

  /* Return days are counted from the day stamps already in the store rather
     than tracked separately, so there is no second record of when someone was
     here. */
  function snapshot() {
    var agg = read(AGG_KEY, null);
    if (!agg || !agg.days) return { v: SCHEMA, optedIn: isOptedIn(), dayCount: 0, firstDay: '', lastDay: '', events: {}, sessions: {} };
    var days = Object.keys(agg.days).sort();
    var events = {}, sessions = {}, histograms = {};
    days.forEach(function (d) {
      var row = agg.days[d] || {};
      Object.keys(row.events || {}).forEach(function (k) { events[k] = (events[k] | 0) + row.events[k]; });
      Object.keys(row.sessions || {}).forEach(function (k) { sessions[k] = (sessions[k] | 0) + row.sessions[k]; });
      Object.keys(row).forEach(function (sec) {
        if (sec.indexOf('hist_') !== 0) return;
        var h = histograms[sec.slice(5)] || (histograms[sec.slice(5)] = {});
        Object.keys(row[sec]).forEach(function (k) { h[k] = (h[k] | 0) + row[sec][k]; });
      });
    });
    return { v: SCHEMA, optedIn: isOptedIn(), dayCount: days.length,
      firstDay: days[0] || '', lastDay: days[days.length - 1] || '',
      events: events, sessions: sessions, histograms: histograms };
  }

  /* What would be sent, if there were anywhere to send it. Built from the
     snapshot so it cannot contain a field the snapshot does not, and returned
     as null when the reader has not opted in, so an accidental call in the off
     state produces nothing rather than something small. */
  /* GAUGES ARE COMPUTED, NOT STORED.

     pair_cache_hit_rate and time_unknown_share are properties of two other
     stores at the moment somebody asks. Writing them down would create a
     third record of the same facts and a way for the three to disagree, so the
     app hands this module two functions and it asks them. */
  var gaugeSources = {};
  function sources(o) { gaugeSources = o || {}; }
  function gauges() {
    var out = { pair_cache_hit_rate: null, time_unknown_share: null, people_records: null };
    try { if (gaugeSources.pairCache) { var s = gaugeSources.pairCache(); out.pair_cache_hit_rate = s ? s.hitRate : null; } } catch (e) {}
    try { if (gaugeSources.people) { var p = gaugeSources.people();
      out.people_records = p ? p.count : null;
      out.time_unknown_share = (p && p.count) ? Math.round((p.timeUnknown / p.count) * 100) / 100 : null; } } catch (e) {}
    return out;
  }

  function exportPayload() {
    if (!isOptedIn()) return null;
    var s = snapshot();
    return { schema: SCHEMA, app: 'inCommon', generatedAt: new Date().toISOString().slice(0, 10),
      dayCount: s.dayCount, firstDay: s.firstDay, lastDay: s.lastDay,
      events: s.events, sessions: s.sessions, histograms: s.histograms, gauges: gauges() };
  }

  function transmit() {
    if (!ENDPOINT) return { sent: false, reason: 'no endpoint: export is built but not wired, by design' };
    return { sent: false, reason: 'unreachable' };
  }

  function clear() { drop(AGG_KEY); }

  /* For the settings screen: what is held, in one line, without making the
     reader open anything. */
  function describe() {
    var s = snapshot();
    if (!s.optedIn) return 'Off. Nothing is being counted and nothing is stored.';
    if (!s.dayCount) return 'On. Nothing counted yet.';
    var total = Object.keys(s.events).reduce(function (n, k) { return n + s.events[k]; }, 0);
    return 'On. ' + total + ' counts across ' + s.dayCount + (s.dayCount === 1 ? ' day' : ' days') +
      ', on this device only. Names and numbers, never anything you wrote.';
  }

  return { VERSION: VERSION, SCHEMA: SCHEMA, EVENTS: EVENTS, BUCKETS: BUCKETS,
    HISTOGRAMS: HISTOGRAMS, observe: observe, sources: sources, gauges: gauges,
    DAY_CAP: DAY_CAP, ENDPOINT: ENDPOINT, NOTIFIES: false,
    OPTIN_KEY: OPTIN_KEY, AGG_KEY: AGG_KEY,
    configure: configure, emit: emit, sessionEnd: sessionEnd,
    isOptedIn: isOptedIn, optIn: optIn, snapshot: snapshot,
    exportPayload: exportPayload, transmit: transmit, clear: clear, describe: describe };
}));
