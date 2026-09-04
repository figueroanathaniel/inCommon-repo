/*! oki-post-processor.js: inCommon OkiPostProcessor V1.0 (UMD, pure JS, no deps).
 * Validates raw Claude API responses BEFORE they reach the user.
 * postProcess(rawResponse, mode) -> { clean, response, violations, fallback, segments }
 *   rawResponse: string | {text|content|completion} | Claude API shape {content:[{type:'text',text}]}
 *   mode: 'quick' | 'standard' | 'deep' (defaults to rawResponse.mode or 'standard')
 * If violations: logs them (capped ring buffer + console.warn), returns response:null
 * with a safe fallback and flags the entry for human review.
 * If clean: returns the trimmed response plus segments parsed for UI tag display.
 * Runs in browser (window.OkiPostProcessor) and Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.OkiPostProcessor = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0';

  // Canonical taxonomy (Core API Audit) + guide-era tags still in circulation.
  var KNOWN_TAGS = ['CALCULATED', 'REPORTED', 'TRADITIONAL', 'POSSIBILITY', 'SYNTHESIS', 'OBSERVED', 'PRACTICE', 'SAFETY'];

  var LIMITS = {
    quick:    { maxSentences: 2, maxWords: 60,  label: 'quick = 1 to 2 sentences' },
    standard: { maxSentences: 5, maxWords: 140, label: 'standard = 3 to 5 sentences' },
    deep:     { maxSentences: 14, maxWords: 198, label: 'deep = structured, \u2264180 words (+10% grace)' }
  };

  var BOUNDARY_PATTERNS = [
    { code: 'diagnosis', label: 'Names or confirms a condition', re: /(\byou (probably |clearly |definitely |might )?(have|are suffering from) (depression|anxiety|adhd|bipolar|ocd|ptsd|bpd|an eating disorder|autism)|sounds like (depression|anxiety|adhd|bipolar|ocd|ptsd|a disorder)|\byou('re| are) (clinically )?(depressed|bipolar|autistic|manic)|i('d| would) diagnose)/i },
    { code: 'destiny', label: 'Destiny declaration / certainty about fate', re: /(meant to be\b|written in the stars|destined (to|for)|your destiny|\binevitable\b|fate has (decided|chosen)|the universe (wants|has decided|is telling you to)|this will (definitely|certainly) happen|no matter what you do)/i },
    { code: 'feelings-claim', label: 'Claims feelings (Oki is software)', re: /(\bi feel\b|\bi('m| am) (so |really )?(sad|happy|lonely|hurt|proud of you|excited)\b|\bit hurts me\b|\bi miss(ed)? you\b)/i },
    { code: 'parasocial', label: 'Parasocial bonding / dependency language', re: /(i need you|special bond|only you understand|only i understand|our (bond|connection|secret)|just between us|don'?t tell anyone|i('ll| will) always be here for you|you don'?t need anyone else|come back soon)/i },
    { code: 'fear', label: 'Fear-based claim / omen', re: /(\bcursed\b|\bdoomed\b|bad omen|dark omen|something (bad|terrible|dark) (is coming|will happen)|i('m| am) warning you|beware\b)/i },
    { code: 'medical', label: 'Medical / medication advice', re: /(you should (stop|start|double|increase|skip) [^.?!]{0,24}?(medication|meds|dose|antidepressant)|don'?t take your (meds|medication)|you don'?t need (your |the )?(meds|medication|therapy))/i }
  ];

  // Only GroundingLibrary's five exercises are approved for Oki to suggest.
  var APPROVED_EXERCISES = ['5-4-3-2-1 senses', 'box breathing', 'body scan', 'cold water / cold object', 'safe place visualization'];
  var EXERCISE_PATTERNS = [
    { code: 'unapproved-exercise', label: 'Unapproved psychological exercise', re: /(\bemdr\b|eye.?movement (desensiti[sz]|technique)|holotropic|rebirthing|hypnosis|hypnotherapy|past.?life regression|regression therapy|inner.?child (work|healing)|trauma (processing|release|work)\b|exposure (therapy|hierarchy|exercise)|cognitive restructuring|\beft\b|tapping (points|sequence|meridian)|somatic experiencing|breath.?hold|wim hof|primal scream|rage room)/i }
  ];

  var FALLBACK = 'The reply I drafted for you didn\u2019t meet inCommon\u2019s standards, so I stopped it before it reached you. That\u2019s the system working, not you asking wrong. Ask again, or ask differently, and I\u2019ll try to do better. And if tonight needs more than a reading, the Get help button is always there.';

  var LOG = []; // ring buffer of flagged responses, newest last, capped
  var LOG_CAP = 100;

  function extractText(raw) {
    if (raw == null) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw.content)) { // Claude API shape
      return raw.content.filter(function (b) { return b && b.type === 'text'; })
        .map(function (b) { return b.text || ''; }).join('\n');
    }
    return String(raw.text || raw.content || raw.completion || '');
  }

  function stripTags(text) { return text.replace(/\[[A-Z][A-Z_ ]{1,20}\]/g, ' '); }
  // Defensive markdown strip: the chat renders raw text, so **bold**, headers,
  // backticks, and bullet markers must not survive to the UI.
  function stripMarkdown(text) {
    return String(text)
      .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
      .replace(/(^|\s)\*([^*\n]+)\*(?=[\s.,;:!?)]|$)/g, '$1$2')
      .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
      .replace(/^#{1,4}\s+/gm, '').replace(/^\s*[-*•]\s+/gm, '')
      .replace(/[ \t]+\n/g, '\n');
  }
  function words(text) { return (stripTags(text).match(/[^\s]+/g) || []).length; }
  function sentences(text) {
    return stripTags(text).split(/[.!?]+(?:\s+|$)/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 1; }).length;
  }

  function parseSegments(text) {
    var re = /\[([A-Z][A-Z_ ]{1,20})\]/g, segs = [], last = 0, lastTag = null, m;
    while ((m = re.exec(text))) {
      var chunk = text.slice(last, m.index).trim();
      if (chunk) segs.push({ tag: lastTag, text: chunk });
      lastTag = KNOWN_TAGS.indexOf(m[1]) >= 0 ? m[1] : null;
      last = re.lastIndex;
    }
    var tail = text.slice(last).trim();
    if (tail) segs.push({ tag: lastTag, text: tail });
    return segs;
  }

  function check(text, mode) {
    var v = [];
    // 1. Epistemic tags present, and every bracketed tag is known
    var bracketed = text.match(/\[([A-Z][A-Z_ ]{1,20})\]/g) || [];
    var known = bracketed.filter(function (t) { return KNOWN_TAGS.indexOf(t.slice(1, -1)) >= 0; });
    if (known.length === 0) v.push({ code: 'no-tags', label: 'No epistemic tags', detail: 'Every substantive reply must carry at least one tag (' + KNOWN_TAGS.slice(0, 5).join(', ') + '\u2026).' });
    bracketed.forEach(function (t) {
      var name = t.slice(1, -1);
      if (KNOWN_TAGS.indexOf(name) < 0) v.push({ code: 'unknown-tag', label: 'Unknown tag', detail: '[' + name + '] is not in the taxonomy, so the model is inventing epistemic categories.' });
    });
    // 2. Boundary violations
    BOUNDARY_PATTERNS.forEach(function (p) {
      var m = p.re.exec(text);
      if (m) v.push({ code: p.code, label: p.label, detail: 'Matched: \u201C' + m[0].trim().slice(0, 80) + '\u201D' });
    });
    // 3. Unapproved exercises
    EXERCISE_PATTERNS.forEach(function (p) {
      var m = p.re.exec(text);
      if (m) v.push({ code: p.code, label: p.label, detail: 'Matched: \u201C' + m[0].trim().slice(0, 60) + '\u201D. Approved set: ' + APPROVED_EXERCISES.join(', ') + '.' });
    });
    // 4. Length matches mode
    var lim = LIMITS[mode], sc = sentences(text), wc = words(text);
    if (sc > lim.maxSentences || wc > lim.maxWords) {
      v.push({ code: 'length', label: 'Length breaks mode contract', detail: sc + ' sentences / ' + wc + ' words against ' + lim.label + '.' });
    }
    return v;
  }

  function logViolation(text, mode, violations) {
    var entry = { ts: new Date().toISOString(), mode: mode, flaggedForReview: true,
      codes: violations.map(function (x) { return x.code; }),
      excerpt: text.slice(0, 240) };
    LOG.push(entry);
    if (LOG.length > LOG_CAP) LOG.shift();
    try { console.warn('[OkiPostProcessor] response rejected:', entry.codes.join(', '), entry); } catch (e) {}
    return entry;
  }

  function postProcess(rawResponse, mode) {
    var text = stripMarkdown(extractText(rawResponse)).trim();
    var m = LIMITS[mode] ? mode : (rawResponse && LIMITS[rawResponse.mode] ? rawResponse.mode : 'standard');
    if (!text) {
      var v0 = [{ code: 'empty', label: 'Empty response', detail: 'The model returned no text.' }];
      logViolation('', m, v0);
      return { clean: false, response: null, violations: v0, fallback: FALLBACK, segments: [] };
    }
    var violations = check(text, m);
    if (violations.length) {
      logViolation(text, m, violations);
      return { clean: false, response: null, violations: violations, fallback: FALLBACK, segments: [] };
    }
    return { clean: true, response: text, violations: [], fallback: FALLBACK, segments: parseSegments(text) };
  }

  function violationLog() { return LOG.slice(); }
  function clearViolationLog() { LOG.length = 0; }

  return { postProcess: postProcess, parseSegments: parseSegments, KNOWN_TAGS: KNOWN_TAGS, LIMITS: LIMITS,
    BOUNDARY_PATTERNS: BOUNDARY_PATTERNS, EXERCISE_PATTERNS: EXERCISE_PATTERNS, APPROVED_EXERCISES: APPROVED_EXERCISES,
    FALLBACK: FALLBACK, violationLog: violationLog, clearViolationLog: clearViolationLog, VERSION: VERSION };
}));
