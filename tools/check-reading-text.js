#!/usr/bin/env node
/* check-reading-text.js: no program code may reach a reading.
 *
 * WHAT THIS IS FOR. On 7 November 2026 the Today horoscope printed
 *   (A, B, pa, pb) => 'A thread runs from ' + A + ' in ' + pa + ...
 * in the middle of a sentence. Two closers written as functions for
 * ASP_MOOD were pasted into HORO_TONE.Sun.h as well, an array of plain
 * phrases. toneOf() picks a phrase and concatenates it, and concatenating a
 * function prints its source. Nothing failed, because the row only showed on
 * the days the variant cycle landed on one of those two slots.
 *
 * Two rules, over every phrase table declared as a class field in the app:
 *   1. An array holds phrases or templates, never both. A mixed array is the
 *      shape of this bug whichever way round the consumer reads it: a string
 *      called as a template throws, and a template concatenated as a string
 *      prints code.
 *   2. No string leaf contains code: "=>", "function(" or "function (".
 * And one rule named for the tables the horoscope reads by concatenation:
 *   3. Every leaf of HORO_TONE, HORO_EVENT and HORO_POINT is a string.
 *
 * Tables are lifted out of the app source with a quote aware bracket matcher
 * and evaluated in an empty context. A table that cannot be evaluated on its
 * own (it refers to this, or to another table) is skipped and counted, so a
 * large skip count is visible rather than silent.
 *
 * Usage: node tools/check-reading-text.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
function die(m) { console.error('check-reading-text: ' + m); process.exit(1); }
if (!fs.existsSync(APP)) die('cannot find ' + APP);
const src = fs.readFileSync(APP, 'utf8');

/* Index of the bracket that closes the one at `open`, skipping string,
   template and comment contents. Template ${} nesting is not needed for the
   tables this reads; a table that defeats it fails to evaluate and is counted
   as skipped. */
function closeOf(s, open) {
  let d = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < s.length && s[i] !== c; i++) if (s[i] === '\\') i++;
      continue;
    }
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i < 0) return -1; continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i + 2) + 1; if (i <= 0) return -1; continue; }
    if (c === '{' || c === '[' || c === '(') d++;
    else if (c === '}' || c === ']' || c === ')') { d--; if (!d) return i; }
  }
  return -1;
}

const FIELD = /^  ([A-Za-z_$][\w$]*) = ([{[])/gm;
const tables = {};
let skipped = 0, m;
while ((m = FIELD.exec(src))) {
  const open = m.index + m[0].length - 1, end = closeOf(src, open);
  if (end < 0) { skipped++; continue; }
  try {
    tables[m[1]] = vm.runInNewContext('(' + src.slice(open, end + 1) + ')', {}, { timeout: 1000 });
  } catch (e) { skipped++; }
}

const fails = [];
const CODE = /=>|\bfunction\s*\(/;
function walk(v, where, seen) {
  if (v === null || typeof v !== 'object' || seen.has(v)) {
    if (typeof v === 'string' && CODE.test(v)) fails.push(where + ' is a string holding code: ' + v.slice(0, 80));
    return;
  }
  seen.add(v);
  if (Array.isArray(v)) {
    const nStr = v.filter(x => typeof x === 'string').length;
    const nFn = v.filter(x => typeof x === 'function').length;
    if (nStr && nFn) fails.push(where + ' mixes ' + nStr + ' phrases with ' + nFn + ' templates');
  }
  for (const k of Object.keys(v)) walk(v[k], where + (Array.isArray(v) ? '[' + k + ']' : '.' + k), seen);
}
for (const name of Object.keys(tables)) walk(tables[name], name, new Set());

for (const name of ['HORO_TONE', 'HORO_EVENT', 'HORO_POINT']) {
  if (!tables[name]) { fails.push(name + ' could not be lifted from the app'); continue; }
  (function leaves(v, where) {
    if (typeof v === 'string') return;
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) leaves(v[k], where + '.' + k); return; }
    fails.push(where + ' is a ' + typeof v + ', and the horoscope concatenates it as text');
  })(tables[name], name);
}

if (fails.length) {
  console.error('check-reading-text: ' + fails.length + ' problem' + (fails.length === 1 ? '' : 's'));
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log('check-reading-text: ok (' + Object.keys(tables).length + ' tables read, ' + skipped + ' skipped)');
