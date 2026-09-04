#!/usr/bin/env node
/* bench-ephemeris.js: measure the cache, and prove it did not change an answer.
 *
 * WHY A BENCHMARK IS CHECKED IN. ephemeris-cache.js is shaped the way it is
 * because of numbers rather than taste: a number key instead of a string, no
 * LRU, no TTL, and eleven bodies rather than sixteen. Every one of those is a
 * departure from how a cache is normally written, and a departure argued from
 * a measurement nobody can reproduce is a departure argued from nothing. This
 * runs the measurement.
 *
 * It also runs the part that matters more than the speed. A cache that is fast
 * and wrong is worse than no cache, and the two ways this one could be wrong
 * are both checked: a cached position must equal the uncached one bit for bit
 * across the whole range the app asks for, and the bodies whose answer depends
 * on window.MinorBodies must never be cached at all.
 *
 * It lifts lonRaw() and its tables straight out of the app file rather than
 * copying the arithmetic, because a benchmark against a second copy of the
 * ephemeris measures the second copy.
 *
 * Usage: node tools/bench-ephemeris.js [--verbose]
 * Exit 0 when the correctness assertions pass, 1 when one fails.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const verbose = process.argv.indexOf('--verbose') !== -1;
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');

const src = fs.readFileSync(APP, 'utf8');
const lines = src.split('\n');

/* ---------- lift the ephemeris out of the app class ---------- */

function lineOf(re) {
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return -1;
}
function blockAt(startLine) {
  const anchor = src.indexOf(lines[startLine - 1]);
  let depth = 0, j = src.indexOf('{', anchor);
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(anchor, j + 1);
}

const WANT = {
  RAD: /^\s{2}RAD = Math\.PI/,
  PL_EL: /^\s{2}PL_EL = \{/,
  EARTH_EL: /^\s{2}EARTH_EL = \[/,
  ASTEROIDS: /^\s{2}ASTEROIDS = \[/,
};
const BLOCKS = {
  norm360: /^\s{2}norm360\(x\)/,
  t2000: /^\s{2}t2000\(d\)/,
  lonRaw: /^\s{2}lonRaw\(name, t\)/,
  minorLon: /^\s{2}minorLon\(el, t\)/,
};

const pieces = [];
const missing = [];
for (const k of Object.keys(WANT)) {
  const n = lineOf(WANT[k]);
  if (n === -1) { missing.push(k); continue; }
  pieces.push(lines[n - 1]);
}
for (const k of Object.keys(BLOCKS)) {
  const n = lineOf(BLOCKS[k]);
  if (n === -1) { missing.push(k); continue; }
  pieces.push(blockAt(n));
}

if (missing.length) {
  console.error('bench-ephemeris: FAIL');
  console.error('  could not lift out of the app file: ' + missing.join(', '));
  console.error('  The shape of the class changed. If lonOf() was renamed again, rename it here too.');
  process.exit(1);
}

global.window = { MinorBodies: null };
let Eph;
try {
  Eph = eval('(class Eph {\n' + pieces.join('\n') + '\n})');
} catch (e) {
  console.error('bench-ephemeris: FAIL');
  console.error('  the lifted ephemeris does not parse: ' + e.message);
  process.exit(1);
}
const e = new Eph();
const cache = require(path.join(repo, 'app', 'ephemeris-cache.js'));

const PLNS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto', 'North Node'];
const MOVERS = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const t0 = e.t2000(new Date('2026-09-02T12:00:00Z'));

const raw = (n, t) => e.lonRaw(n, t);
cache.source((n, t) => e.lonRaw(n, t));
const cached = (n, t) => cache.get(n, t);

/* ---------- plausibility: is the lifted code actually computing? ---------- */
/* Every one of these has been an actual failure mode of an eval-lift: a class
   that parses, runs, and returns NaN or 0 for everything while every timing
   below looks perfectly healthy. */
const sun = raw('Sun', t0), sat = raw('Saturn', t0), moon = raw('Moon', t0);
const sane = [sun, sat, moon].every(v => typeof v === 'number' && isFinite(v) && v >= 0 && v < 360);
const distinct = new Set(PLNS.map(n => Math.round(raw(n, t0)))).size;
if (!sane || distinct < 8) {
  console.error('bench-ephemeris: FAIL');
  console.error('  the lifted ephemeris is not computing: Sun=' + sun + ' Saturn=' + sat + ' Moon=' + moon +
    ', ' + distinct + ' distinct longitudes across ' + PLNS.length + ' bodies');
  process.exit(1);
}

/* ---------- correctness ---------- */

const failures = [];

/* 1. cached equals uncached, bit for bit, over the range the app walks */
let compared = 0, drift = 0;
for (let i = -400; i <= 400; i += 1) {
  const t = t0 + i * 0.37;                     /* not day aligned, on purpose */
  for (const n of PLNS) {
    const a = raw(n, t), b = cached(n, t), c = cached(n, t);   /* miss then hit */
    compared += 2;
    if (a !== b || a !== c) drift++;
  }
}
if (drift) failures.push(drift + ' of ' + compared + ' cached reads differ from the uncached answer');

/* 2. the bodies that depend on window.MinorBodies are never cached */
const MUTABLE = ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'];
const wrongly = MUTABLE.filter(n => cache.cacheable(n));
if (wrongly.length) failures.push('mutable bodies are cacheable: ' + wrongly.join(', '));

/* The failure this prevents, driven rather than asserted: a null read before
   minor-bodies-ephemeris.js installs must not survive the install. */
const beforeInstall = cached('Chiron', t0);
global.window.MinorBodies = { Chiron: [1, 2, 3] };
const afterInstall = cached('Chiron', t0);
global.window.MinorBodies = null;
if (beforeInstall === afterInstall && beforeInstall === null) {
  failures.push('a pre-install null for Chiron survived the install');
}

/* 3. nothing is persisted */
const rep = cache.report();
if (rep.persisted !== false) failures.push('report() claims the cache persists');
if (typeof localStorage !== 'undefined') failures.push('a storage API is reachable from this process');
/* Comments first. The header explains why this cache does NOT persist and why
   pair-cache.js does, so it names localStorage in prose; scanning the raw file
   reports the explanation as the violation. */
const modSrc = fs.readFileSync(path.join(repo, 'app', 'ephemeris-cache.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
for (const banned of ['localStorage', 'sessionStorage', 'indexedDB', 'setItem']) {
  if (modSrc.indexOf(banned) !== -1) failures.push('ephemeris-cache.js references ' + banned + ' in code');
}

/* 4. the ceiling holds */
cache.reset();
for (let i = 0; i < cache.MAX_ENTRIES + 500; i++) cached('Mars', t0 + i * 0.011);
const after = cache.report();
if (after.entries > cache.MAX_ENTRIES) failures.push('entries ' + after.entries + ' exceeded the ceiling ' + cache.MAX_ENTRIES);
if (after.clears < 1) failures.push('the ceiling was passed and nothing cleared');

/* ---------- measurement ---------- */

function time(fn, iters) {
  fn();
  const s = process.hrtime.bigint();
  for (let i = 0; i < iters; i++) fn();
  return Number(process.hrtime.bigint() - s) / iters;
}

let sink = 0;
let spin = 0;
const perCall = time(() => { sink += raw('Saturn', t0 + (spin++ % 331)); }, 100000);

const walkRaw = () => { for (let i = -210; i <= 120; i++) { const t = t0 + i; for (let m = 0; m < 6; m++) sink += raw(MOVERS[m], t); } };
const perWalk = time(walkRaw, 200);

cache.reset();
const walkCached = () => { for (let i = -210; i <= 120; i++) { const t = t0 + i; for (let m = 0; m < 6; m++) sink += cached(MOVERS[m], t); } };
const perWalkCached = time(walkCached, 200);

/* The cache Prompt 3 specified, built and run like for like: one global Map,
   keyed on the body and the UTC instant rounded to the nearest minute. This is
   the comparison the design rests on, so it is measured rather than reasoned
   about. */
const strMap = new Map();
const strCached = (n, t) => {
  const k = n + '|' + Math.round(t * 1440);
  let v = strMap.get(k);
  if (v === undefined) { v = raw(n, t); strMap.set(k, v); }
  return v;
};
strMap.clear();
const walkString = () => { for (let i = -210; i <= 120; i++) { const t = t0 + i; for (let m = 0; m < 6; m++) sink += strCached(MOVERS[m], t); } };
const perWalkString = time(walkString, 200);

/* THE COST, NOT ONLY THE SAVING. Filling a cache is not free, and a walk that
   never repeats an instant pays the fill and collects nothing. transitWindows
   is exactly that walk: it memoises its own result per day per profile, so it
   only ever runs cold. A benchmark that reported only the wins would hide the
   one place this cache is a net loss. */
let coldOff = 0;
const coldRaw = () => { const base = t0 + (coldOff++) * 1000; for (let i = -210; i <= 120; i++) { const t = base + i; for (let m = 0; m < 6; m++) sink += raw(MOVERS[m], t); } };
let coldOff2 = 0;
const coldCached = () => { cache.reset(); const base = t0 + (coldOff2++) * 1000; for (let i = -210; i <= 120; i++) { const t = base + i; for (let m = 0; m < 6; m++) sink += cached(MOVERS[m], t); } };
const perColdRaw = time(coldRaw, 300);
const perColdCached = time(coldCached, 300);

const chartRaw = () => { for (const n of PLNS) sink += raw(n, t0) || 0; };
const perChart = time(chartRaw, 20000);
cache.reset();
const chartCached = () => { for (const n of PLNS) sink += cached(n, t0) || 0; };
const perChartCached = time(chartCached, 20000);

const NATAL_SITES = 10;   /* chartAt(natalDate()) call sites with no memo of their own */

/* ---------- report ---------- */

const us = ns => (ns / 1000).toFixed(2) + ' us';
const ms = ns => (ns / 1e6).toFixed(3) + ' ms';

if (failures.length) {
  console.error('bench-ephemeris: FAIL');
  failures.forEach(f => console.error('  ' + f));
  console.error('\n  A cache that is fast and wrong is worse than no cache.');
  process.exit(1);
}

console.log('bench-ephemeris: ok');
console.log('  ' + compared + ' cached reads compared against uncached, 0 differ');
console.log('  ' + MUTABLE.length + ' window.MinorBodies bodies, none cacheable, pre-install null does not survive');
console.log('  nothing persisted, ceiling of ' + cache.MAX_ENTRIES + ' holds and clears wholesale');
console.log('');
console.log('  one lonRaw call, planet branch                 ' + us(perCall));
console.log('  transitWindows walk, 1986 calls               ' + ms(perWalk));
console.log('    the same walk, cached                       ' + ms(perWalkCached) +
            '   (' + (100 * (perWalk - perWalkCached) / perWalk).toFixed(0) + '% faster)');
console.log('    the same walk, STRING key as specified      ' + ms(perWalkString) +
            '   (' + (100 * (perWalk - perWalkString) / perWalk).toFixed(0) + '% faster)');
console.log('    number key vs string key                    ' +
            (perWalkString / perWalkCached).toFixed(1) + 'x');
console.log('  COLD walk, every instant new, no cache      ' + ms(perColdRaw));
console.log('    the same walk cold, through the cache       ' + ms(perColdCached) + '   (' + (100 * (perColdCached - perColdRaw) / perColdRaw).toFixed(0) + '% SLOWER: this is the fill, and transitWindows only ever runs cold)');
console.log('  chartAt(natal), 11 bodies                     ' + us(perChart));
console.log('    the same, cached                            ' + us(perChartCached));
console.log('  ' + NATAL_SITES + ' unmemoized natal sites per render         ' + us(perChart * NATAL_SITES));
console.log('    the same, cached                            ' + us(perChartCached * NATAL_SITES));
console.log('    saved per render                            ' + us((perChart - perChartCached) * NATAL_SITES) +
            ' desktop, ' + ms((perChart - perChartCached) * NATAL_SITES * 8) + ' at an 8x phone penalty');
if (verbose) console.log('\n  ' + JSON.stringify(cache.report()));
