#!/usr/bin/env node
/* check-competitor-surface.js: the competitor's marks never become ours.
 *
 * THE RULE, from docs/reference/jovian-archive/trademarks.md and from
 * CLAUDE.md, "Terminology: what gets replaced, and the test that decides":
 *
 *   A trademark reaches NAMES and SOURCE IDENTIFIERS. It does not reach
 *   ordinary description. So a term is a finding when it FUNCTIONS AS A NAME
 *   and reaches a reader, and it is not a finding when it is the field's
 *   plain vocabulary used descriptively. That is the same test that kept
 *   transit and composite and renamed the bodygraph heading to The Wiring.
 *
 * WHY THIS IS NOT A LIST OF BANNED SUBSTRINGS. It was specified as one, and a
 * substring gate over this list fails the build on the app's own data:
 *
 *   Penta   hits Penta-di-Casinca and Lancusi-Penta-Bolano, real towns in the
 *           birth-place gazetteer, and Pentacles, the tarot suit.
 *   WA      hits Washington. 402 rows of gazetteer-world.js, 5 of
 *           gazetteer-us.js, the Seattle, WA fixture in four component pages
 *           and in calculation-fixtures.json, and every two-letter identifier
 *           in minified React.
 *   Jovian  hits docs/reference/jovian-archive/, which is the competitive
 *           research this rule was written from. The gate would fail on its
 *           own evidence.
 *   compatibility
 *           hits astropedia.js and hd-teachings.js, where both sentences
 *           exist to say synastry is NOT compatibility. Banning the substring
 *           bans the disclaimer.
 *
 * So each term carries its shape rather than only its spelling:
 *
 *   mark        the name itself. Banned in scope, case as written.
 *   label       banned where it NAMES a surface: aria-label,
 *               aria-roledescription, alt, title, placeholder, a heading, or
 *               a *Label / *Heading / *Title / *Name / *Summary string in the
 *               logic class. Allowed in descriptive prose, which is the
 *               ratified position for lowercase bodygraph and is what the
 *               gloss "the wiring, which the field calls a bodygraph" rests on.
 *   identifier  banned as a field name, object key or declared binding, which
 *               is where a value becomes a thing the product returns. This is
 *               the machine-checkable half of "there is no score": a schema
 *               cannot carry compatibility if nothing may be named it.
 *   phrase      banned as text anywhere. Reserved for compounds that can only
 *               name a scored object.
 *
 * OVERRIDES REQUIRE A REASON. Every entry in ALLOW carries a `why`, and this
 * gate refuses to run if one does not. It also reports overrides that matched
 * nothing, because a stale exemption is a rule nobody is reading any more.
 *
 * Usage: node tools/check-competitor-surface.js [--verbose]
 * Exit 0 clean, 1 on any finding or on a walk it cannot trust.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const verbose = process.argv.indexOf('--verbose') !== -1;

/* ---------- what counts as a project surface ---------- */

const EXTS = new Set(['.js', '.jsx', '.html', '.json', '.md', '.css', '.txt', '.webmanifest']);

/* CLAUDE.md, "Zero em dash", names the same four out of scope for its own
   sweep, for the same reasons: two are build output that regenerates from
   source, one is the reader's own file, and the rest are vendored. */
const SKIP_DIRS = new Set(['.git', 'node_modules', 'deploy', 'deploy1.1', 'uploads']);
const VENDORED = new Set([
  'app/support.js',
  'app/doc-page.js',
  'app/ios-frame.jsx',
  'app/react-18.3.1.production.min.js',
  'app/react-dom-18.3.1.production.min.js',
]);

/* ---------- the terms ---------- */

const TERMS = [
  { id: 'MyBodyGraph', kind: 'mark', re: () => /MyBodyGraph/gi,
    note: 'USPTO 97606650. The mark, in any casing. Our term is Chart.' },

  { id: 'BodyGraph', kind: 'mark', re: () => /\bBodyGraph\b/g,
    note: 'The camel-cased styling is the mark. Lowercase bodygraph is descriptive and is checked as a label term instead.' },

  { id: 'The Human Design System', kind: 'mark', re: () => /the\s+human\s+design\s+system/gi,
    note: 'USPTO 97642294 and 98217560. Lowercase generic "human design" is not this and is not checked here.' },

  /* Case-insensitive on purpose. The mark is capitalised, but lowercase jovian
     in running prose is still the company being named, and the only lowercase
     uses in this repo are folder paths, which ALLOW covers by file. */
  { id: 'Jovian', kind: 'mark', re: () => /\bJovian\b/gi,
    note: 'USPTO 97639098 and the company name. Naming it implies affiliation.' },

  { id: 'BG5', kind: 'mark', re: () => /\bBG5\b/g,
    note: 'Certification-adjacent naming. Highest-risk ground in the field.' },

  { id: 'OC16', kind: 'mark', re: () => /\bOC16\b/g,
    note: 'Certification-adjacent naming. Barred by Founder direction.' },

  /* Compound place names in the gazetteers are handled by ALLOW rather than by
     a hyphen exemption, because a hyphen exemption is a wider hole than the two
     rows it would close. */
  { id: 'Penta', kind: 'mark', re: () => /\bPenta\b/g,
    note: 'Barred by Founder direction. Case-sensitive and word-bounded so it does not reach Pentacles, the tarot suit.' },

  /* The state abbreviation reaches this gate 400+ times. A hit is exempt when
     it sits in address or table position: preceded by a comma and an optional
     quote (", WA" and the gazetteer CSV ",WA,"), preceded by a dot (US.WA), or
     followed by a colon or equals (WA:'Washington', WA=Washington). */
  { id: 'WA', kind: 'mark', re: () => /\bWA\b/g,
    note: 'Barred by Founder direction. Washington State is exempted by position.',
    unless: (before, after) => /,\s*['"]?$/.test(before) || /\.$/.test(before) || /^\s*[:=]/.test(after) },

  { id: 'bodygraph', kind: 'label', re: () => /bodygraph/gi,
    note: 'Ratified: renamed where it names, kept where it describes. The heading is The Wiring. The prose may still say bodygraph.' },

  { id: 'compatibility', kind: 'identifier', re: () => /\bcompat(?:ibility)?\b/g,
    note: 'A field nothing may be named. The prose that denies compatibility is not a finding.' },

  { id: 'bestMatch', kind: 'identifier', re: () => /\bbest_?[Mm]atch\b/g,
    note: 'An ordering of people against each other, whatever it is spelled.' },

  { id: 'matchScore', kind: 'identifier', re: () => /\b(?:match|compat|compatibility)_?[Ss]core\b|\bscore_?[Mm]atch\b/g,
    note: 'Bare score is legitimate here: detect() scores how sure it is a word is present. Only the scored-relationship compounds are barred.' },

  /* "figure" is in the alternation because that is what the removed thing was
     actually called: CLAUDE.md heads the section "There is no compatibility
     figure anywhere", and a list that bars score but not figure would pass the
     ring straight back in under the name it already had. */
  { id: 'compatibility score', kind: 'phrase', re: () => /\b(?:compatibility|match)\s+(?:score|rating|percentage|figure|rank(?:ing)?)\b/gi,
    note: 'Names a scored object in any position. There is no such object and there will not be one.' },
];

/* ---------- documented overrides, each with its reason ---------- */
/* `path` is a repo-relative file or directory prefix, forward slashes. */

const ALLOW = [
  { term: 'Penta', path: 'app/gazetteer-world.js',
    why: 'Penta-di-Casinca (Corsica) and Lancusi-Penta-Bolano (Campania) are real towns. A reader born in one has to be able to find it.' },
  { term: 'WA', path: 'data-contracts/calculation-fixtures.json',
    why: 'The TZ1 fixture reads "Seattle WA" with no comma, so it falls outside the address-position exemption. It is a calculation contract and its input string is the assertion: editing it to please this gate would change what the fixture tests.' },

  { term: '*', path: 'docs/reference/',
    why: 'The competitive research folder. Its job is to name the marks and record what they reach. A gate that fails here fails on its own evidence base.' },
  { term: '*', path: 'docs/source/',
    why: 'Historical source documents. CLAUDE.md holds that a record of what was written on a date is not a pointer to be maintained, and editing it to keep a grep tidy falsifies the record.' },

  { term: '*', path: 'CLAUDE.md',
    why: 'States this rule and has to name the terms it bars.' },
  { term: '*', path: 'tools/check-competitor-surface.js',
    why: 'This gate. Same reason.' },

  { term: '*', path: 'docs/CROSS-CHECK-2026-08-28.md',
    why: 'The record of the 28 August terminology audit. It names the five terms it weighed and the counts it found.' },

  { term: '*', path: 'verification/Verification Report.dc.html',
    why: 'A run record from before the rename. Historical, same rule as docs/source.' },
  { term: '*', path: 'verification/Verification Report V1.1.dc.html',
    why: 'As above.' },
  { term: '*', path: 'verification/Verification Report V1.2.dc.html',
    why: 'As above.' },

  { term: 'compatibility score', path: 'app/handoff/tests-v6.0.js',
    why: 'G9b is named for the thing it asserts is absent. A suite has to be able to say what it removed.' },
  { term: 'compatibility score', path: 'app/inCommonApp v2.dc.html',
    why: 'The WHERE THE NUMBER WAS comment explains why the ring is gone. Removing the explanation is how it gets added back.' },

  { term: 'Jovian', path: 'app/people-library.js',
    why: 'One comment citing the research file by path. A citation is not a claim of affiliation, and a path that cannot be written is a citation that goes missing.' },
];

for (const a of ALLOW) {
  if (!a.why || !a.why.trim()) {
    console.error('check-competitor-surface: FAIL');
    console.error('  override for "' + a.term + '" at ' + a.path + ' carries no justification.');
    console.error('  Every entry in ALLOW requires a why. An unexplained exemption is how a rule stops being one.');
    process.exit(1);
  }
  a.used = 0;
}

/* ---------- walk ---------- */

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(abs, out);
    } else if (EXTS.has(path.extname(e.name).toLowerCase())) {
      const rel = path.relative(repo, abs).split(path.sep).join('/');
      if (!VENDORED.has(rel)) out.push(rel);
    }
  }
  return out;
}
const files = walk(repo, []);

/* ---------- label positions ---------- */
/* A label term is a finding only inside one of these. Ranges are computed per
   file and a hit is tested for containment. */

function labelRanges(src) {
  const out = [];
  const push = (m, gi) => {
    if (m[gi] == null) return;
    const s = m.index + m[0].indexOf(m[gi]);
    out.push([s, s + m[gi].length]);
  };

  /* attributes whose value IS the accessible or visible name */
  for (const m of src.matchAll(/\b(aria-label|aria-roledescription|aria-describedby|alt|title|placeholder)\s*=\s*"([^"]*)"/g)) push(m, 2);

  /* headings */
  for (const m of src.matchAll(/<h[1-6]\b[^>]*>([\s\S]{0,400}?)<\/h[1-6]>/g)) push(m, 1);

  /* strings the logic class hands to a label hole */
  for (const m of src.matchAll(/\b\w*(?:Label|Heading|Title|Name|Summary|Roledesc)\s*:\s*'((?:[^'\\]|\\.){0,400})'/g)) push(m, 1);
  for (const m of src.matchAll(/\b\w*(?:Label|Heading|Title|Name|Summary|Roledesc)\s*:\s*"((?:[^"\\]|\\.){0,400})"/g)) push(m, 1);

  return out;
}

/* ---------- identifier positions ---------- */
/* A value becomes a thing the product returns when something is named it. */

function isIdentifierPosition(src, start, end) {
  const after = src.slice(end, end + 24);
  const before = src.slice(Math.max(0, start - 24), start);
  if (/^\s*:/.test(after)) return true;                         /* object key or type field */
  if (/^\s*=[^=]/.test(after)) return true;                     /* assignment */
  if (/\.\s*$/.test(before)) return true;                       /* property access */
  if (/\b(?:const|let|var|function|class)\s+$/.test(before)) return true;
  if (/['"]\s*$/.test(before) && /^['"]\s*:/.test(after)) return true; /* quoted key */
  return false;
}

/* ---------- scan ---------- */

const findings = [];
const allowedHits = [];
let filesScanned = 0, bytesScanned = 0;

for (const rel of files) {
  const abs = path.join(repo, rel);
  let src;
  try { src = fs.readFileSync(abs, 'utf8'); } catch (e) { continue; }
  filesScanned++; bytesScanned += src.length;

  const labels = labelRanges(src);
  const inLabel = i => labels.some(([a, b]) => i >= a && i < b);
  const lineAt = i => src.slice(0, i).split('\n').length;

  for (const term of TERMS) {
    const re = term.re();
    let m;
    while ((m = re.exec(src))) {
      const start = m.index, end = start + m[0].length;
      const before = src.slice(Math.max(0, start - 40), start);
      const after = src.slice(end, end + 40);

      if (term.unless && term.unless(before, after)) continue;
      if (term.kind === 'label' && !inLabel(start)) continue;
      if (term.kind === 'identifier' && !isIdentifierPosition(src, start, end)) continue;

      const ov = ALLOW.find(a => (a.term === term.id || a.term === '*') &&
        (rel === a.path || rel.startsWith(a.path)));
      const rec = {
        term: term.id, kind: term.kind, file: rel, line: lineAt(start), text: m[0],
        ctx: src.slice(Math.max(0, start - 55), end + 45).replace(/\s+/g, ' ').trim(),
      };
      if (ov) { ov.used++; allowedHits.push(rec); } else findings.push(rec);
    }
  }
}

/* ---------- plausibility ---------- */
/* CLAUDE.md: if a check reports green, confirm it examined a plausible number
   of things before believing it. Three ways this gate can be quietly blind:
   the walk found nothing, the marks are unfindable because a regex broke, and
   the label machinery found no label positions in the app at all. */

const APP = 'app/inCommonApp v2.dc.html';
const appPresent = files.indexOf(APP) !== -1;
const appLabels = appPresent ? labelRanges(fs.readFileSync(path.join(repo, APP), 'utf8')).length : 0;
const sawKnownMark = allowedHits.some(h => h.file.startsWith('docs/reference/'));

const blind = [];
if (filesScanned < 40) blind.push('walked only ' + filesScanned + ' files');
if (!appPresent) blind.push('did not reach ' + APP);
if (appLabels < 20) blind.push('found ' + appLabels + ' label positions in the app, expected many more');
if (!sawKnownMark) blind.push('found no mark inside docs/reference/, where they are known to be');

if (blind.length) {
  console.error('check-competitor-surface: FAIL');
  console.error('  this gate is not looking at what it thinks it is:');
  blind.forEach(b => console.error('    ' + b));
  process.exit(1);
}

/* ---------- report ---------- */

const stale = ALLOW.filter(a => !a.used);
const summary = {
  filesScanned,
  kbScanned: Math.round(bytesScanned / 1024),
  termsChecked: TERMS.length,
  findings: findings.length,
  allowedByOverride: allowedHits.length,
  labelPositionsInApp: appLabels,
  staleOverrides: stale.length,
};

if (findings.length || stale.length) {
  console.error('check-competitor-surface: FAIL');
  console.error(JSON.stringify(summary, null, 2));
  if (findings.length) {
    const byTerm = {};
    findings.forEach(f => (byTerm[f.term] = byTerm[f.term] || []).push(f));
    for (const id of Object.keys(byTerm)) {
      const t = TERMS.find(x => x.id === id);
      console.error('\n  ' + id + '  (' + t.kind + ', ' + byTerm[id].length + ')');
      console.error('    ' + t.note);
      byTerm[id].forEach(f => console.error('    ' + f.file + ':' + f.line + '\n      ' + f.ctx));
    }
    console.error('\n  Each is either a rename or an ALLOW entry with a reason. There is no third option.');
  }
  if (stale.length) {
    console.error('\n  overrides that matched nothing (' + stale.length + '):');
    stale.forEach(a => console.error('    ' + a.term + ' at ' + a.path + '\n      ' + a.why));
    console.error('\n  Remove them. A stale exemption is a rule nobody is reading any more.');
  }
  process.exit(1);
}

console.log('check-competitor-surface: ok');
console.log('  ' + filesScanned + ' files, ' + summary.kbScanned + 'KB, ' + TERMS.length + ' terms');
console.log('  ' + appLabels + ' label positions resolved in the app; 0 carry a barred name');
console.log('  ' + allowedHits.length + ' hits inside documented overrides, ' + ALLOW.length + ' entries, all justified, none stale');
console.log('  0 findings');
if (verbose) {
  const byFile = {};
  allowedHits.forEach(h => (byFile[h.file] = byFile[h.file] || []).push(h.term));
  Object.keys(byFile).sort().forEach(f => {
    const c = {}; byFile[f].forEach(t => c[t] = (c[t] || 0) + 1);
    console.log('    allowed: ' + f + '  ' + Object.keys(c).map(k => k + ' x' + c[k]).join(', '));
  });
}
