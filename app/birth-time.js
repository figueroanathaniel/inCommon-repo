/*! birth-time.js: reading, resolving and degrading a birth moment. V1.0.0 (UMD)
 *
 * WHY THIS IS A MODULE AND NOT A METHOD. Everything here decides what a chart
 * is drawn from, and a wrong answer produces a chart that is complete,
 * confident and about a different person. That is the one class of error this
 * app cannot detect after the fact, so the arithmetic lives where a test can
 * reach it without a browser: the same file is executed by the app
 * (window.BirthTime) and by tools/run-module-tests.js (Node require).
 *
 * THE FOUR RULES IT EXISTS TO HOLD:
 *
 * 1. A BLANK FIELD IS NOT AN ANSWER. There are three states, not two: the
 *    reader has given a time, the reader has said they do not know it, or the
 *    question is still open. Nothing here turns the third into the second.
 *    A build that treats blank as "unknown" has decided something on the
 *    reader's behalf and then drawn a chart on it.
 *
 * 2. THE OFFSET BELONGS TO THE BIRTH DATE, NOT TO TODAY. A zone's standard
 *    offset applied year round puts every summer birth an hour late, which is
 *    about fifteen degrees of Ascendant and routinely a whole rising sign.
 *    Daylight rules have also changed repeatedly and differ by country, so a
 *    hand written rule is wrong for somebody. Intl carries the IANA database
 *    including its history and is already on the device, so the zone's own
 *    record is what gets asked.
 *
 * 3. AN ASSUMPTION IS RETURNED, NEVER HIDDEN. instant() will still produce a
 *    Date when the time is unknown, because a solar chart is worth drawing.
 *    It returns assumed:true beside it, and the screen is required to say so.
 *    Nothing in here substitutes noon quietly and moves on.
 *
 * 4. NO EM DASHES.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.BirthTime = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';

  /* The placeholder used when a chart has to be drawn without a time. Noon
     rather than midnight because it is the least wrong hour: it halves the
     Moon's worst case error and keeps the solar day unambiguous either side of
     a date boundary. It is still a placeholder, and everything that uses it
     says so. */
  var ASSUMED_HOUR = 12, ASSUMED_MIN = 0;

  var TIME_STATE = { KNOWN: 'known', UNKNOWN: 'unknown', UNANSWERED: 'unanswered' };

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- reading what was typed ----------------------------------------
     Accepts what people actually write. The meridiem argument is the explicit
     control beside the field: '24' means the digits are a 24 hour clock, 'am'
     and 'pm' mean they are not. A meridiem written into the text wins over the
     control, because someone who typed pm meant it.

     It refuses rather than guesses. "13:00 am" is not quietly read as 01:00:
     it is a contradiction, and a contradiction in a birth time is worth one
     question to the reader. */
  function parse(text, meridiem) {
    var raw = String(text == null ? '' : text).trim();
    if (!raw) return { ok: false, time: '', reason: 'empty' };

    var mer = String(meridiem || '').toLowerCase();
    var inText = /(^|[^a-z])(a\.?m\.?|p\.?m\.?)\s*$/i.exec(raw);
    if (inText) {
      mer = inText[2].toLowerCase().charAt(0) === 'a' ? 'am' : 'pm';
      raw = raw.slice(0, inText.index + inText[1].length).trim();
    }
    if (mer !== 'am' && mer !== 'pm') mer = '24';

    /* Hours and minutes, separated by a colon, a dot or a space. Seconds are
       allowed in and dropped: an input of type time may hand back HH:MM:SS,
       and rejecting that told the reader their perfectly good birth time was
       malformed. A bare "7" is four different times and is refused. */
    var m = /^(\d{1,2})\s*[:.\s]\s*(\d{2})(?:\s*[:.]\s*\d{1,2})?$/.exec(raw);
    if (!m) return { ok: false, time: '', reason: 'shape' };

    var h = +m[1], mi = +m[2];
    if (mi > 59) return { ok: false, time: '', reason: 'minute' };

    if (mer === '24') {
      if (h > 23) return { ok: false, time: '', reason: 'hour' };
    } else {
      if (h < 1 || h > 12) return { ok: false, time: '', reason: 'hour12' };
      if (mer === 'am') h = (h === 12 ? 0 : h);
      else h = (h === 12 ? 12 : h + 12);
    }
    return { ok: true, time: pad2(h) + ':' + pad2(mi), reason: '' };
  }

  /* The colon, written for a keypad that does not have one.

     parse() refuses a bare "7" on purpose, because it is four different times.
     That is right, and on a phone it made the field impossible to fill: a
     numeric keypad offers digits and nothing else, so a reader typing their
     birth time had no way to separate the hour from the minute and every
     attempt came back malformed. The separator is put in for them here.

     Anchored on the right, because the example beside the field is 2:05 and
     three digits are far more often H:MM than HH:M.

     A deletion is passed straight through. Re-masking on the way out turns one
     backspace on "14:30" into "1:43", which reads as the field fighting the
     reader; left alone it goes 14:3, 14:, 14, 1, which is what they expect.
     Anything carrying a letter is passed through too: that is a reader on a
     full keyboard writing their own am or pm, which parse() already reads, and
     stripping it would quietly move their birth time by twelve hours. */
  function mask(next, prev) {
    var raw = String(next == null ? '' : next);
    if (/[a-z]/i.test(raw)) return raw;
    if (prev != null && raw.length < String(prev).length) return raw;
    var d = raw.replace(/\D/g, '').slice(0, 4);
    if (d.length <= 2) return d;
    return d.slice(0, d.length - 2) + ':' + d.slice(-2);
  }

  /* One shape for a stored birth time: zero padded HH:MM. Two layers once
     disagreed about this, one accepting "0:37" and the other deciding a chart
     is timed with a two digit hour, so a time was saved and then silently
     ignored: no Ascendant, whole sign houses, and nothing reporting it. */
  function norm(v) {
    var r = parse(v, '24');
    return r.ok ? r.time : '';
  }

  function format12(hhmm) {
    var m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ''));
    if (!m) return '';
    var h = +m[1], mi = m[2], suf = h < 12 ? 'am' : 'pm';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + mi + ' ' + suf;
  }

  /* The state of the question, read from what is stored. KNOWN is a time that
     can be read; UNKNOWN is the reader having said so; UNANSWERED is neither,
     and it is the state the first run form leaves behind when someone skips. */
  function timeState(birth) {
    var b = birth || {};
    if (norm(b.birthTime || b.time)) return TIME_STATE.KNOWN;
    if (b.timeUnknown === true) return TIME_STATE.UNKNOWN;
    return TIME_STATE.UNANSWERED;
  }

  /* ---------- what the zone itself says ------------------------------------ */
  function zoneOffset(tz, at) {
    if (!tz || tz === 'manual') return null;
    try {
      var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var q = {};
      f.formatToParts(at).forEach(function (x) { q[x.type] = x.value; });
      if (!q.year) return null;
      // hour12:false yields 24 for midnight in some engines.
      var asUTC = Date.UTC(+q.year, +q.month - 1, +q.day, (+q.hour) % 24, +q.minute, +q.second);
      return (asUTC - at.getTime()) / 3600000;
    } catch (e) { return null; }
  }

  /* Solved iteratively because the offset depends on the instant and the
     instant depends on the offset. Two passes settle everything except a local
     time inside a transition hour, where it keeps the first reading rather
     than oscillating: an hour that happened twice has no single right answer,
     and picking one and saying so beats reporting a stalemate to the reader. */
  function utcOffsetFor(tz, y, mo, d, hh, mi, fallback) {
    var fb = fallback == null ? 0 : +fallback;
    if (!tz || tz === 'manual') return { offset: fb, source: 'stored', ambiguous: false };
    var off = fb, found = null;
    for (var i = 0; i < 2; i++) {
      var at = new Date(Date.UTC(y, mo, d, hh - off, mi));
      found = zoneOffset(tz, at);
      if (found == null) return { offset: fb, source: 'stored', ambiguous: false };
      if (found === off) return { offset: off, source: 'zone', ambiguous: false };
      off = found;
    }
    return { offset: off, source: 'zone', ambiguous: true };
  }

  /* Whether the birth fell inside that zone's daylight saving, asked the only
     way that holds everywhere: against the lowest offset that zone reached in
     the same year. A hemisphere assumption would be wrong for half the astral body,
     and a fixed one hour assumption is wrong for Lord Howe Island. */
  function isDst(tz, at) {
    if (!tz || tz === 'manual' || !at) return null;
    var here = zoneOffset(tz, at);
    if (here == null) return null;
    var y = at.getUTCFullYear(), lo = here;
    for (var mo = 0; mo < 12; mo++) {
      var o = zoneOffset(tz, new Date(Date.UTC(y, mo, 15, 12, 0)));
      if (o != null && o < lo) lo = o;
    }
    return here > lo;
  }

  function offsetLabel(h) {
    if (h == null || isNaN(h)) return '';
    var sign = h < 0 ? '-' : '+', a = Math.abs(h);
    var hh = Math.floor(a), mm = Math.round((a - hh) * 60);
    return 'UTC' + sign + pad2(hh) + ':' + pad2(mm);
  }

  /* ---------- the instant a chart is drawn for ------------------------------
     Returns the moment AND everything a screen needs in order to be honest
     about it: whether the hour was given or assumed, which offset was used,
     where that offset came from, and whether the local time was ambiguous. */
  function instant(birth) {
    var b = birth || {};
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(b.birthDate || b.date || ''));
    if (!m) return null;
    var state = timeState(b);
    var known = state === TIME_STATE.KNOWN;
    var t = known ? norm(b.birthTime || b.time).split(':') : [ASSUMED_HOUR, ASSUMED_MIN];
    var y = +m[1], mo = +m[2] - 1, d = +m[3], hh = +t[0] || 0, mi = +t[1] || 0;
    /* An assumed hour is a placeholder in local time and is not worth resolving
       a historical offset for: the hour itself is the error, and an offset
       applied to a guess dresses the guess up as arithmetic. */
    var r = known
      ? utcOffsetFor(b.timezone, y, mo, d, hh, mi, b.tzOffset)
      : { offset: 0, source: 'none', ambiguous: false };
    return {
      date: new Date(Date.UTC(y, mo, d, hh - r.offset, mi)),
      timeState: state, timeKnown: known, assumed: !known,
      assumedTime: known ? '' : pad2(ASSUMED_HOUR) + ':' + pad2(ASSUMED_MIN),
      offset: r.offset, offsetSource: r.source, ambiguous: r.ambiguous,
      zone: b.timezone || ''
    };
  }

  /* What a screen is allowed to draw. The time dependent elements are named
     here once, so no screen has to keep its own list. Marked unavailable is
     the contract: not hidden, and not guessed. */
  var TIME_DEPENDENT = ['houses', 'the Ascendant', 'the Midheaven', 'house rulers', 'the Moon to the degree', 'gate lines near a boundary'];

  function availability(birth) {
    var state = timeState(birth);
    var known = state === TIME_STATE.KNOWN;
    var b = birth || {};
    var hasPlace = !!(b.birthLat != null && b.birthLon != null);
    return {
      timeState: state,
      timed: known && hasPlace,
      unavailable: known && hasPlace ? [] : TIME_DEPENDENT.slice(),
      /* Written the way it would be said out loud, because this line is what
         the reader sees where a house number would have been. */
      note: state === TIME_STATE.UNKNOWN
        ? 'Your birth time is not known, so this is drawn for 12:00 noon local as a placeholder. Houses, the Ascendant and the Midheaven cannot be computed from a date alone, so they are left out rather than estimated.'
        : state === TIME_STATE.UNANSWERED
          ? 'No birth time has been entered yet, so this is drawn for 12:00 noon local as a placeholder. Add a time, or say that you do not know it, and this line changes to match.'
          : hasPlace ? '' : 'A birth time is set but the birth place has not resolved to coordinates, so houses and the angles stay uncomputed. They need both.'
    };
  }

  return { VERSION: VERSION, TIME_STATE: TIME_STATE, TIME_DEPENDENT: TIME_DEPENDENT,
    ASSUMED_HOUR: ASSUMED_HOUR, ASSUMED_MIN: ASSUMED_MIN,
    parse: parse, norm: norm, mask: mask, format12: format12, timeState: timeState,
    zoneOffset: zoneOffset, utcOffsetFor: utcOffsetFor, isDst: isDst,
    offsetLabel: offsetLabel, instant: instant, availability: availability };
}));
