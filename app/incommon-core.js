/*! incommon-core.js: inCommon V1.2 shared core (UMD).
 * The SAME file is executed by the prototype (window.InCommonCore) and by the
 * test suites (Node require / browser script). No test-time transforms.
 * Audit trail: Independent Source Audit V1.0 items 1,3,5,6,7,9,13,16.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.InCommonCore = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.2.0';

  /* ---------- digit reduction ---------- */
  var MASTERS = [11, 22, 33];
  function digitSum(n) { return String(n).split('').reduce(function (a, c) { return a + (+c || 0); }, 0); }
  // reduce(29) -> {value:11, steps:[29,11]} (fixture N6). preserveMasters default true.
  function reduce(n, opts) {
    var pm = !opts || opts.preserveMasters !== false;
    var v = Math.abs(Math.floor(+n || 0)), steps = [v];
    while (v > 9 && !(pm && MASTERS.indexOf(v) !== -1)) { v = digitSum(v); steps.push(v); }
    return { value: v, steps: steps };
  }

  /* ---------- numerology engine (audit item 5: live functions, not fixture arithmetic) ---------- */
  var LETTER = {};
  'AJS BKT CLU DMV ENW FOX GPY HQZ IR'.split(' ').forEach(function (g, i) {
    g.split('').forEach(function (ch) { LETTER[ch] = i + 1; });
  });
  var VOWELS = 'AEIOU';
  function nameParts(name) {
    return String(name || '').toUpperCase().replace(/[^A-Z\s\-']/g, ' ').split(/[\s\-']+/).filter(Boolean);
  }
  function isVowel(ch, i, word, yPolicy) {
    if (VOWELS.indexOf(ch) !== -1) return true;
    if (ch !== 'Y') return false;
    if (yPolicy === 'vowel') return true;
    if (yPolicy === 'consonant' || !yPolicy) return false; // fixture N5 policy default
    // 'positional': Y is a vowel when not adjacent to a vowel sound (simplified positional rule)
    var prev = word[i - 1], next = word[i + 1];
    return !(prev && VOWELS.indexOf(prev) !== -1) && !(next && VOWELS.indexOf(next) !== -1);
  }
  function sumWord(word, filter, yPolicy) {
    var s = 0;
    for (var i = 0; i < word.length; i++) {
      var ch = word[i]; if (!LETTER[ch]) continue;
      if (filter === 'vowel' && !isVowel(ch, i, word, yPolicy)) continue;
      if (filter === 'consonant' && isVowel(ch, i, word, yPolicy)) continue;
      s += LETTER[ch];
    }
    return s;
  }
  // Per-word reduce then sum then reduce (fixture N4: MAYA 13→4 · LIN 17→8 · CHEN 21→3 · 15→6)
  function nameNumber(name, filter, yPolicy) {
    var parts = nameParts(name);
    if (!parts.length) return { value: 0, parts: [], work: 'no letters' };
    var pw = parts.map(function (w) {
      var raw = sumWord(w, filter, yPolicy), r = reduce(raw);
      return { word: w, raw: raw, reduced: r.value };
    });
    var total = pw.reduce(function (a, p) { return a + p.reduced; }, 0);
    var fin = reduce(total);
    return { value: fin.value, parts: pw, total: total,
      work: pw.map(function (p) { return p.word + ' ' + p.raw + '→' + p.reduced; }).join(' · ') + ' · ' + total + ' → ' + fin.value };
  }
  function expression(name, yPolicy) { return nameNumber(name, null, yPolicy); }
  function soulUrge(name, yPolicy) { return nameNumber(name, 'vowel', yPolicy); }
  function personality(name, yPolicy) { return nameNumber(name, 'consonant', yPolicy); }
  function parseDOB(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3] };
  }
  // fixture N1: 7 + 2 + (1992→21→3) = 12 → 3 (month/day/year each reduced, then summed, reduced)
  function lifePath(iso) {
    var p = parseDOB(iso); if (!p) return { value: null, work: 'invalid date' };
    var mo = reduce(p.mo), d = reduce(p.d), y = reduce(digitSum(p.y));
    var sum = mo.value + d.value + y.value, fin = reduce(sum);
    return { value: fin.value, work: mo.value + ' + ' + d.value + ' + (' + p.y + '→' + y.value + ') = ' + sum + ' → ' + fin.value };
  }
  function birthday(iso) {
    var p = parseDOB(iso); if (!p) return { value: null, work: 'invalid date' };
    var r = reduce(p.d);
    return { value: r.value, work: p.d + ' → ' + r.value };
  }
  // fixture N2: 7 + 2 + (2026→10→1) = 10 → 1
  function personalYear(iso, year) {
    var p = parseDOB(iso); if (!p) return { value: null, work: 'invalid date' };
    var mo = reduce(p.mo), d = reduce(p.d), uy = reduce(digitSum(+year));
    var sum = mo.value + d.value + uy.value, fin = reduce(sum);
    return { value: fin.value, work: mo.value + ' + ' + d.value + ' + (' + year + '→' + uy.value + ') = ' + sum + ' → ' + fin.value };
  }
  // fixture N3: PY 1 + month 7 = 8
  function personalMonth(py, month) {
    var sum = (+py || 0) + (+month || 0), fin = reduce(sum);
    return { value: fin.value, work: py + ' + ' + month + ' = ' + sum + (fin.value !== sum ? ' → ' + fin.value : '') };
  }
  function coreNumbers(profile, onDate) {
    var d = onDate instanceof Date ? onDate : new Date();
    var py = personalYear(profile.dob, d.getFullYear());
    return { lifePath: lifePath(profile.dob), birthday: birthday(profile.dob),
      expression: expression(profile.nameAtBirth, profile.yPolicy), soulUrge: soulUrge(profile.nameAtBirth, profile.yPolicy),
      personality: personality(profile.nameAtBirth, profile.yPolicy),
      personalYear: py, personalMonth: personalMonth(py.value, d.getMonth() + 1) };
  }

  /* ---------- angel numbers (mirrors V1 prototype semantics; fixtures A1, A3) ---------- */
  function angelAnalyze(raw) {
    raw = String(raw || '').trim();
    var clean = raw.replace(/[^0-9]/g, '').slice(0, 6);
    if (!clean) return { ok: false, reason: 'no digits' };
    var ds = clean.split('').map(Number);
    var sum = ds.reduce(function (a, b) { return a + b; }, 0);
    var r = reduce(sum);
    var root = r.value;
    var repeating = ds.length > 1 && ds.every(function (d) { return d === ds[0]; });
    return { ok: true, clean: clean, digits: ds, sum: sum, root: root, steps: r.steps,
      master: MASTERS.indexOf(root) !== -1, repeating: repeating,
      disp: raw.indexOf(':') !== -1 ? raw : clean };
  }

  /* ---------- dates (audit: hard-coded weekday/dates) ---------- */
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function fmtToday(d) { d = d || new Date(); return DAYS[d.getDay()] + ' · ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
  function fmtShort(d) { d = d || new Date(); return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }

  /* ---------- birth-time visibility (audit item: exact / window / unknown must change behavior) ---------- */
  function deriveVisibility(timeMode) {
    var m = (timeMode === 'window' || timeMode === 'approx') ? 'window' : timeMode === 'unknown' ? 'unknown' : 'exact';
    var W = m === 'window', U = m === 'unknown';
    return {
      timeMode: m,
      rising: U ? 'suppressed' : W ? 'window' : 'ok',
      houses: U ? 'suppressed' : W ? 'window' : 'ok',
      moonDegree: U ? 'suppressed' : 'ok',
      humanDesign: U ? 'suppressed' : W ? 'window' : 'ok',
      sabian: U ? 'suppressed' : W ? 'window' : 'ok',
      planetsBySign: 'ok', numerology: 'ok',
      note: U ? 'Birth time unknown. Rising, houses, Moon degree, Human Design, and Sabian degrees are suppressed rather than guessed.'
        : W ? 'Birth time approximate. Angle-dependent results shown as a range; verify time to narrow.' : null
    };
  }

  /* ---------- persistence (audit B1: delete must survive pending debounce + remount) ---------- */
  function createPersistence(storage, opts) {
    opts = opts || {};
    var key = opts.key || 'incommon_state_v1';
    var extraKeys = opts.extraKeys || ['incommon_theme'];
    var ms = opts.debounceMs == null ? 250 : opts.debounceMs;
    var setT = opts.setTimeout || setTimeout, clearT = opts.clearTimeout || clearTimeout;
    var tombstoneKey = key + '__tombstone';
    var timer = null, deleted = false;
    try { deleted = storage.getItem(tombstoneKey) === '1'; } catch (e) {}
    function cancel() { if (timer != null) { clearT(timer); timer = null; } }
    return {
      key: key,
      // Guard order matters: a load must check the tombstone before hydrating.
      hasTombstone: function () { try { return storage.getItem(tombstoneKey) === '1'; } catch (e) { return false; } },
      load: function () {
        try {
          if (storage.getItem(tombstoneKey) === '1') return null;
          var raw = storage.getItem(key); return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
      },
      schedule: function (getSnapshot) {
        if (deleted) return false; // B1 guard: no writes after deleteAll until reenable()
        cancel();
        timer = setT(function () {
          timer = null;
          if (deleted) return;
          try { storage.setItem(key, JSON.stringify(getSnapshot())); } catch (e) {}
        }, ms);
        return true;
      },
      cancel: cancel,
      isDeleted: function () { return deleted; },
      deleteAll: function () {
        cancel(); deleted = true;
        var removed = [];
        try {
          [key].concat(extraKeys).forEach(function (k) { storage.removeItem(k); removed.push(k); });
          storage.setItem(tombstoneKey, '1'); // survives remount; cleared only by reenable()
        } catch (e) {}
        var absent = true;
        try { [key].concat(extraKeys).forEach(function (k) { if (storage.getItem(k) != null) absent = false; }); } catch (e) { absent = false; }
        return { removed: removed, verifiedAbsent: absent };
      },
      reenable: function () { deleted = false; try { storage.removeItem(tombstoneKey); } catch (e) {} }
    };
  }

  /* ---------- consent events (audit B5: revocation must mutate state, not toast) ---------- */
  function consentReduce(events) {
    var st = {};
    (events || []).forEach(function (e) { if (e && e.scope) st[e.scope] = e.action === 'grant'; });
    return st;
  }
  function consentAppend(events, scope, action, via, ts) {
    var e = { scope: scope, action: action === 'grant' ? 'grant' : 'revoke', via: via || 'user', ts: ts || Date.now() };
    return (events || []).concat([e]);
  }
  function deriveLedger(events) {
    return (events || []).slice().sort(function (a, b) { return b.ts - a.ts; }).map(function (e) {
      return { scope: e.scope, action: e.action, via: e.via, ts: e.ts, date: fmtShort(new Date(e.ts)) };
    });
  }

  /* ---------- Oki grounding (audit B6 + amendment 5: chips resolve to real enabled source IDs) ---------- */
  // Source IDs are the okiCtx scope keys. 'scripted' and 'safety' are always legal.
  var SOURCE_REGISTRY = [
    { id: 'chart', label: 'Birth-calculated', match: /^(natal|chart|placement|numerolog|py\b|personal year|life path|human design|hd\b|sabian)/i },
    { id: 'transits', label: 'Timing & sky', match: /^(transit|timing|sky|moon(?!\s*·\s*journal)|lunar|retrograde|personal month)/i },
    { id: 'insights', label: 'Insight records', match: /^(insight|saved|record)/i, dated: true },
    { id: 'journal', label: 'Journal & sightings', match: /^(journal|sighting|angel|tarot|i ching|iching)/i },
    { id: 'assess', label: 'Assessments', match: /^(assess|enneagram|big five|big5)/i },
    { id: 'duo', label: 'Two-person data', match: /^(synastry|two-person|duo|jordan)/i },
    { id: 'scripted', label: 'Scripted', match: /^(scripted|guide)/i, always: true },
    { id: 'safety', label: 'Safety', match: /^(safety|crisis)/i, always: true }
  ];
  function resolveChip(rawChip) {
    var c = String(rawChip || '').trim();
    for (var i = 0; i < SOURCE_REGISTRY.length; i++) if (SOURCE_REGISTRY[i].match.test(c)) return SOURCE_REGISTRY[i];
    return null;
  }
  // Parse trailing "SOURCES: a | b | c" line. Returns {ok, text, chips, scopes, errors}.
  // ok=false when: no SOURCES line; a chip resolves to no registry id; a chip's id is not
  // enabled in `scopes`; a dated insight chip cites a date absent from `records`.
  function validateCitations(fullText, opts) {
    opts = opts || {}; var scopes = opts.scopes || {}; var records = opts.records || [];
    var text = String(fullText || '');
    var m = /(^|\n)\s*SOURCES\s*:\s*(.+)\s*$/i.exec(text.trim());
    if (!m) return { ok: false, text: text.trim(), chips: [], scopes: [], errors: ['missing SOURCES line'] };
    var body = text.trim().slice(0, m.index).trim();
    var chips = m[2].split(/\s*[|,]\s*/).filter(Boolean).map(function (raw) {
      var reg = resolveChip(raw);
      if (!reg) return { raw: raw, id: null, ok: false, reason: 'unknown source' };
      if (!reg.always && !scopes[reg.id]) return { raw: raw, id: reg.id, ok: false, reason: 'source "' + reg.id + '" is disabled' };
      if (reg.dated) {
        var dm = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/i.exec(raw);
        if (!dm) return { raw: raw, id: reg.id, ok: false, reason: 'insight citation missing date' };
        var found = records.some(function (r) { return String(r.date || '').toLowerCase().indexOf(dm[0].toLowerCase()) === 0; });
        if (!found) return { raw: raw, id: reg.id, ok: false, reason: 'cited insight date not in records' };
      }
      return { raw: raw, id: reg.id, ok: true };
    });
    var errors = chips.filter(function (c) { return !c.ok; }).map(function (c) { return c.raw + ': ' + c.reason; });
    if (!chips.length) errors.push('empty SOURCES line');
    return { ok: errors.length === 0, text: body, chips: chips,
      scopes: chips.filter(function (c) { return c.ok && !SOURCE_REGISTRY.some(function (r) { return r.id === c.id && r.always; }); })
        .map(function (c) { return c.id; }).filter(function (v, i, a) { return a.indexOf(v) === i; }),
      errors: errors };
  }
  function filterHistory(msgs, scopes) {
    return (msgs || []).filter(function (m) {
      if (m.who === 'u') return true;
      if (!m.scopes || !m.scopes.length) return true; // scripted/safety or pre-V1.2 messages
      return m.scopes.every(function (s) { return !!scopes[s]; });
    });
  }
  // Injection defense for user-authored text interpolated into prompts (audit B6).
  function sanitizeForPrompt(text, max) {
    var t = String(text || '').replace(/\s+/g, ' ').replace(/sources\s*:/gi, 'sources,')
      .replace(/[`{}<>]/g, '').trim().slice(0, max || 200);
    return '\u00AB' + t + '\u00BB';
  }
  var CRISIS_RE = /suicid|kill (myself|me)|self.?harm|hurt (myself|me)|want to die|end (it all|my life)|no reason to live|overdose/i;
  function crisisCheck(text) { return CRISIS_RE.test(String(text || '')); }
  function withTimeout(promise, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('timeout after ' + ms + 'ms')); }, ms);
      promise.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }

  return { VERSION: VERSION, MASTERS: MASTERS, LETTER: LETTER,
    digitSum: digitSum, reduce: reduce,
    lifePath: lifePath, birthday: birthday, expression: expression, soulUrge: soulUrge,
    personality: personality, personalYear: personalYear, personalMonth: personalMonth, coreNumbers: coreNumbers,
    angelAnalyze: angelAnalyze, fmtToday: fmtToday, fmtShort: fmtShort,
    deriveVisibility: deriveVisibility, createPersistence: createPersistence,
    consentReduce: consentReduce, consentAppend: consentAppend, deriveLedger: deriveLedger,
    SOURCE_REGISTRY: SOURCE_REGISTRY, resolveChip: resolveChip, validateCitations: validateCitations,
    filterHistory: filterHistory, sanitizeForPrompt: sanitizeForPrompt,
    crisisCheck: crisisCheck, withTimeout: withTimeout };
}));
