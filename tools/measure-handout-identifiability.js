#!/usr/bin/env node
/* measure-handout-identifiability.js: how close a "no birth data" Human
 * Design handout is to birth data (assignment 2.2, Task 3; the question in
 * data-contracts/HD-STUDY-MODEL.md section 9, item 6).
 *
 * A handout leaves out the birth date, time and place. What it may carry is
 * the chart's mechanics, and the mechanics are a function of the birth
 * moment. This measures how much of the moment they give back, at four
 * depths a handout might be drawn at:
 *
 *   T0  Type, Authority, Profile, Definition
 *   Tc  T0 and the defined centres (no channels)
 *   T1  T0 and the defined centres and defined channels
 *   T2  T1 and every gate held (no lines, nobody named as holding it)
 *   T3  every activation: side, astral body, gate and line
 *
 * For each sample birth it measures two things.
 *
 *   The window: the stretch of time around the birth over which that depth
 *   reads exactly the same. Someone who knows roughly when a person was born
 *   learns the moment to within this window.
 *
 *   The crowd: among a population of random births from 1950 to 2010, how
 *   many share the same reading. A crowd of one is an identifying handout;
 *   a crowd of hundreds hides the person in it.
 *
 *   The days: for T2 and T3, how many days from 1900 to 2100 are consistent
 *   with the personality side's Sun and slow astral bodies (and node) as the
 *   handout gives them, read at noon UT. One day means the handout names the
 *   date; together with the window it names the hour too.
 *
 * Positions come from the vendored astronomy-engine and the mean node from
 * app/lunar-mean-points.js, as the app draws them; gates and lines from
 * app/hd-wheel.js; channels and centres from app/hd-topology.js. The design
 * moment is solved here by bisection to the Sun 88 degrees earlier. Type,
 * Authority and Definition are worked out here by the standard rules, not by
 * the app's code, which is enough for a measurement and is not a
 * verification of the app.
 *
 * Deterministic: the sample births come from a fixed seed. Takes about two
 * minutes. Prints the numbers; writes nothing.
 */
'use strict';
const path = require('path');
const repo = path.resolve(__dirname, '..');
const A = require(path.join(repo, 'app', 'astronomy-engine-2.1.19.min.js'));
const LMP = require(path.join(repo, 'app', 'lunar-mean-points.js'));
const HW = require(path.join(repo, 'app', 'hd-wheel.js'));
const TOP = require(path.join(repo, 'app', 'hd-topology.js'));

const N = +(process.argv.find(a => /^--n=/.test(a)) || '--n=40').slice(4);
const POP = +(process.argv.find(a => /^--pop=/.test(a)) || '--pop=3000').slice(6);
const MIN = 60000, HOUR = 3600000, DAY = 86400000;
const BODIES = ['Sun', 'Earth', 'Moon', 'North Node', 'South Node', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

function norm(x) { return ((x % 360) + 360) % 360; }
function lon(body, ms) {
  const d = new Date(ms);
  if (body === 'Sun') return A.SunPosition(d).elon;
  if (body === 'Earth') return norm(A.SunPosition(d).elon + 180);
  if (body === 'Moon') return A.EclipticGeoMoon(d).lon;
  if (body === 'North Node') return LMP.meanNode(ms / DAY - 10957.5);
  if (body === 'South Node') return norm(LMP.meanNode(ms / DAY - 10957.5) + 180);
  return A.Ecliptic(A.GeoVector(body, d, true)).elon;
}
function designMs(ms) {
  const target = norm(lon('Sun', ms) - 88);
  let lo = ms - 95 * DAY, hi = ms - 82 * DAY;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2, d = norm(lon('Sun', mid) - target);
    if (d > 180) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
function activations(ms) {
  const dms = designMs(ms), out = [];
  for (const [side, t] of [['p', ms], ['d', dms]]) {
    for (const b of BODIES) { const g = HW.gateLine(lon(b, t)); out.push({ side, body: b, gate: g.gate, line: g.line }); }
  }
  return out;
}

const MOTORS = ['Heart', 'Solar Plexus', 'Sacral', 'Root'];
function mechanics(acts) {
  const held = new Set(acts.map(a => a.gate));
  const chans = TOP.pairs().filter(c => held.has(c.a) && held.has(c.b));
  const adj = {}; const defined = new Set();
  chans.forEach(c => {
    const x = TOP.centerOf(c.a), y = TOP.centerOf(c.b);
    defined.add(x); defined.add(y);
    (adj[x] = adj[x] || new Set()).add(y); (adj[y] = adj[y] || new Set()).add(x);
  });
  const reach = (from) => { const seen = new Set([from]), q = [from];
    while (q.length) { const c = q.shift(); (adj[c] || []).forEach(n => { if (!seen.has(n)) { seen.add(n); q.push(n); } }); }
    return seen; };
  const throatReach = defined.has('Throat') ? reach('Throat') : new Set();
  const motorThroat = MOTORS.some(m => throatReach.has(m));
  let type;
  if (!defined.size) type = 'Reflector';
  else if (defined.has('Sacral')) type = motorThroat ? 'Manifesting Generator' : 'Generator';
  else type = motorThroat ? 'Manifestor' : 'Projector';
  let auth = 'none';
  if (defined.has('Solar Plexus')) auth = 'Emotional';
  else if (defined.has('Sacral')) auth = 'Sacral';
  else if (defined.has('Spleen')) auth = 'Splenic';
  else if (defined.has('Heart')) auth = throatReach.has('Heart') ? 'Ego manifested' : 'Ego projected';
  else if (defined.has('G')) auth = 'Self projected';
  const comps = []; const left = new Set(defined);
  while (left.size) { const s = reach([...left][0]); s.forEach(c => left.delete(c)); comps.push(s); }
  const ps = acts.find(a => a.side === 'p' && a.body === 'Sun'), ds = acts.find(a => a.side === 'd' && a.body === 'Sun');
  const T0 = [type, auth, ps.line + '/' + ds.line, comps.length].join('|');
  const Tc = T0 + '|' + [...defined].sort().join(',');
  const T1 = Tc + '|' + chans.map(c => c.key).sort().join(',');
  const T2 = T1 + '|' + [...held].sort((a, b) => a - b).join(',');
  const T3 = acts.map(a => a.side + a.body + ':' + a.gate + '.' + a.line).join(',');
  return { T0, Tc, T1, T2, T3, held };
}
function tierAt(ms, tier) { return mechanics(activations(ms))[tier]; }

/* The edge of the window on one side: step out until the reading changes,
   then halve the step down to a minute. */
function edge(ms, tier, dir, step, cap) {
  const want = tierAt(ms, tier);
  let inside = ms, t = ms;
  while (Math.abs(t - ms) < cap) {
    t = inside + dir * step;
    if (tierAt(t, tier) !== want) break;
    inside = t;
  }
  if (Math.abs(t - ms) >= cap) return { at: inside, capped: true };
  let out = t;
  while (Math.abs(out - inside) > MIN) {
    const mid = (inside + out) / 2;
    if (tierAt(mid, tier) === want) inside = mid; else out = mid;
  }
  return { at: inside, capped: false };
}
const STEP = { T0: 2 * HOUR, Tc: 2 * HOUR, T1: 2 * HOUR, T2: 15 * MIN, T3: 3 * MIN };
const CAP = { T0: 60 * DAY, Tc: 60 * DAY, T1: 60 * DAY, T2: 10 * DAY, T3: 2 * DAY };

/* The daily table: the personality side's Sun and the slow movers and node at
   noon UT, every day 1900 to 2100. */
const SLOW = ['Sun', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node'];
function dailyTable() {
  const start = Date.UTC(1900, 0, 2, 12), end = Date.UTC(2099, 11, 30, 12), rows = [];
  for (let t = start; t <= end; t += DAY) {
    rows.push(SLOW.map(b => { const g = HW.gateLine(lon(b, t)); return [g.gate, g.line]; }));
  }
  return rows;
}

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function quant(xs, q) { const s = xs.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]; }
function fmt(ms) { return ms >= DAY ? (ms / DAY).toFixed(1) + ' days' : ms >= HOUR ? (ms / HOUR).toFixed(1) + ' h' : Math.round(ms / MIN) + ' min'; }

const t0 = Date.now();
const r = rng(20261029), births = [];
for (let i = 0; i < N; i++) births.push(Math.floor(Date.UTC(1950, 0, 1) + r() * (Date.UTC(2010, 0, 1) - Date.UTC(1950, 0, 1))));
const win = { T0: [], Tc: [], T1: [], T2: [], T3: [] }, capped = { T0: 0, Tc: 0, T1: 0, T2: 0, T3: 0 };
births.forEach(ms => {
  for (const tier of ['T0', 'Tc', 'T1', 'T2', 'T3']) {
    const a = edge(ms, tier, -1, STEP[tier], CAP[tier]), b = edge(ms, tier, +1, STEP[tier], CAP[tier]);
    win[tier].push(b.at - a.at);
    if (a.capped || b.capped) capped[tier]++;
  }
});
const table = dailyTable();
const days = { T2: [], T3: [] };
births.forEach(ms => {
  const acts = activations(ms), held = mechanics(acts).held;
  const p = SLOW.map(b => acts.find(x => x.side === 'p' && x.body === b));
  let n3 = 0, n2 = 0;
  table.forEach(row => {
    if (row.every((gl, i) => gl[0] === p[i].gate && gl[1] === p[i].line)) n3++;
    if (row.every(gl => held.has(gl[0]))) n2++;
  });
  days.T3.push(n3); days.T2.push(n2);
});

/* The crowd: the same four readings over a population of births. */
const pr = rng(7), crowd = { T0: {}, Tc: {}, T1: {}, T2: {}, T3: {} }, popRows = [];
for (let i = 0; i < POP; i++) {
  const ms = Math.floor(Date.UTC(1950, 0, 1) + pr() * (Date.UTC(2010, 0, 1) - Date.UTC(1950, 0, 1)));
  const m = mechanics(activations(ms)); popRows.push(m);
  for (const tier of ['T0', 'Tc', 'T1', 'T2', 'T3']) crowd[tier][m[tier]] = (crowd[tier][m[tier]] || 0) + 1;
}
const crowdOf = { T0: [], Tc: [], T1: [], T2: [], T3: [] };
popRows.forEach(m => { for (const tier of ['T0', 'Tc', 'T1', 'T2', 'T3']) crowdOf[tier].push(crowd[tier][m[tier]]); });

console.log('measure-handout-identifiability: ' + N + ' births, 1950 to 2010, seed 20261029, ' + ((Date.now() - t0) / 1000).toFixed(0) + 's');
console.log('  window: the stretch around the birth over which the handout reads the same (median, 90th percentile, how many reached the search cap)');
for (const tier of ['T0', 'Tc', 'T1', 'T2', 'T3']) {
  console.log(`    ${tier}  median ${fmt(quant(win[tier], 0.5))}, p90 ${fmt(quant(win[tier], 0.9))}, capped ${capped[tier]} of ${N} (cap ${fmt(2 * CAP[tier])})`);
}
console.log('  crowd: of ' + POP + ' random births 1950 to 2010, how many share a birth\'s reading (median, 10th percentile, share of births alone in their crowd)');
for (const tier of ['T0', 'Tc', 'T1', 'T2', 'T3']) {
  const alone = crowdOf[tier].filter(c => c === 1).length;
  console.log(`    ${tier}  median ${quant(crowdOf[tier], 0.5)}, p10 ${quant(crowdOf[tier], 0.1)}, alone ${(100 * alone / POP).toFixed(1)}%`);
}
console.log('  days 1900 to 2100 consistent with the personality Sun and slow bodies as the handout gives them (median, 90th percentile, largest)');
for (const tier of ['T2', 'T3']) {
  console.log(`    ${tier}  median ${quant(days[tier], 0.5)}, p90 ${quant(days[tier], 0.9)}, max ${Math.max(...days[tier])}`);
}
