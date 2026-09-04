#!/usr/bin/env node
/* check-prose-repeats.js: the app may not keep saying the same thing.
 *
 * WHAT THIS MEASURES. Every prose string literal in the app, reduced to its
 * six word sequences, counted across DIFFERENT strings. A phrase that appears
 * in one sentence is writing. The same phrase appearing in nine sentences is a
 * habit, and a reader meets it as the app running out of things to say.
 *
 * WHY SIX WORDS. Four catches ordinary English ("at the same time as") and
 * would fail on any corpus. Eight is long enough that only near duplicate
 * sentences trip it, which is the failure people already notice. Six is where
 * a distinctive turn of phrase starts, and it is the length at which the
 * app's actual repeats showed up.
 *
 * WHAT IS EXEMPT, and why each one is deliberate.
 *
 *   The safety strings. Every crisis surface says the same numbers and the
 *   same instructions on purpose. Varying them for freshness would be the
 *   worst possible reason to vary them.
 *
 *   CONFIG_CAUTION and GROUP_CAUTION. Both exist BECAUSE they are repeated:
 *   one sentence, returned from the module, rendered wherever the row is, so
 *   it cannot drift between two shells. C11 to C15 assert their presence.
 *
 *   The three part shape. "what the tradition holds / where it came from /
 *   what it may be doing" repeats as a STRUCTURE across the registries, and
 *   the headings that carry it are supposed to match.
 *
 * Usage: node tools/check-prose-repeats.js [--list]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
function die(m) { console.error('check-prose-repeats: ' + m); process.exit(1); }
if (!fs.existsSync(APP)) die('cannot find ' + APP);

const src = fs.readFileSync(APP, 'utf8');
/* The logic class only: the template zone above it is markup, and its text
   nodes are headings and labels that are supposed to recur. */
const zoneStart = src.indexOf('class ');
const zone = zoneStart > -1 ? src.slice(zoneStart) : src;

/* Same prose heuristic check-layer-boundary uses: enough words, real sentence
   punctuation, ordinary function words, and no record separator. */
const FUNC = [' the ', ' a ', ' and ', ' to ', ' of ', ' it ', ' is ', ' that ', ' in ', ' you '];
function isProse(t) {
  if (t.length < 40 || t.indexOf('|') > -1) return false;
  if (!/[.!?]/.test(t)) return false;
  if (t.split(/\s+/).length < 8) return false;
  return FUNC.filter(f => (' ' + t.toLowerCase() + ' ').indexOf(f) > -1).length >= 3;
}

/* Single quoted literals, unescaped. Good enough: the app writes prose in
   single quotes throughout and a missed string only makes this gate laxer. */
const lits = [];
const re = /'((?:[^'\\\n]|\\.){40,})'/g;
let m;
while ((m = re.exec(zone))) {
  const t = m[1].replace(/\\u2019/g, "'").replace(/\\u00b7/g, '.').replace(/\\'/g, "'");
  if (isProse(t)) lits.push(t);
}
if (lits.length < 200) die('only ' + lits.length + ' prose strings found; the extractor is not seeing the app');

const EXEMPT = [
  /988|741741|crisis|lifeline|samhsa|trevor|emergency/i,
  /this describes what a group of charts holds/i,
  /read carelessly next to a real relationship/i,
  /what the tradition holds|where that reading came from/i
];

const norm = t => t.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const N = 6;
const grams = new Map();
lits.forEach((t, i) => {
  if (EXEMPT.some(x => x.test(t))) return;
  const w = norm(t).split(' ');
  const seen = new Set();
  for (let k = 0; k + N <= w.length; k++) {
    const g = w.slice(k, k + N).join(' ');
    if (seen.has(g)) continue;           /* twice in ONE sentence is style */
    seen.add(g);
    if (!grams.has(g)) grams.set(g, []);
    grams.get(g).push(i);
  }
});

const CAP = 3;   /* a phrase may appear in at most three separate strings */
const bad = [];
grams.forEach((where, g) => { if (where.length > CAP) bad.push({ g: g, n: where.length }); });
bad.sort((a, b) => b.n - a.n);

if (process.argv.indexOf('--list') > -1) {
  bad.slice(0, 40).forEach(b => console.log('  ' + String(b.n).padStart(3) + '  ' + b.g));
  console.log('\n  ' + bad.length + ' phrases over the cap of ' + CAP);
  process.exit(0);
}

if (bad.length) {
  console.error('check-prose-repeats: ' + bad.length + ' phrases appear in more than ' + CAP + ' separate strings.');
  bad.slice(0, 8).forEach(b => console.error('  ' + b.n + 'x  "' + b.g + '"'));
  console.error('\n  Run with --list to see them all.');
  process.exit(1);
}

console.log('check-prose-repeats: ok');
console.log('  prose strings       ' + lits.length.toLocaleString());
console.log('  six word phrases    ' + grams.size.toLocaleString());
console.log('  over the cap of ' + CAP + '   0');
