#!/usr/bin/env node
/* check-timing-lexicon.js: the Timing Lexicon covers what the app can ask for,
 * says it once, and keeps the house rules.
 *
 * WHAT IT HOLDS. app/timing-lexicon.js reads a transit as three pieces written
 * for it, a gate as four, and a number by the role it plays. A corpus like that
 * fails in two quiet ways. It can fall out of step with the app, so a body or
 * an angle the app starts producing has no entry and the reading falls back to
 * the old wording without anybody seeing it. And it can drift into a template,
 * where the same sentence frame turns up in forty entries with one word swapped,
 * which is the exact fault it was written to remove from the Together slide.
 *
 * So the key sets are read OUT of the app and the topology module rather than
 * typed here (TL1 to TL3), every one of the 960 transit readings and the 384
 * gate and line readings is checked for distinctness (TL5, TL6), and the six
 * word phrase cap the app holds itself to applies here too (TL11).
 *
 * The detectors are tested on planted fixtures before they are trusted (TL0),
 * so a check that cannot see a dash, a repeat or a missing key fails rather
 * than reporting green.
 *
 * Usage: node tools/check-timing-lexicon.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const LEX = path.join(repo, 'app', 'timing-lexicon.js');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
const TOPO = path.join(repo, 'app', 'hd-topology.js');
const ICHING = path.join(repo, 'app', 'iching.js');
const MODTESTS = path.join(repo, 'tools', 'run-module-tests.js');

let fails = 0, passes = 0;
function row(id, label, ok, detail) {
  if (ok) { passes++; console.log('  ok   ' + id + '  ' + label); }
  else { fails++; console.log('  FAIL ' + id + '  ' + label + (detail ? '\n         ' + detail : '')); }
}

const L = require(LEX);
const T = require(TOPO);
const app = fs.readFileSync(APP, 'utf8');
const src = fs.readFileSync(LEX, 'utf8');

/* Every string the lexicon holds, with where it lives. */
function strings() {
  const out = [];
  const walk = (o, at) => {
    if (typeof o === 'string') out.push({ at: at, s: o });
    else if (o && typeof o === 'object') Object.keys(o).forEach(k => walk(o[k], at + '.' + k));
  };
  ['PACE', 'MOVE', 'MEET', 'PLACE', 'SKY', 'GATE', 'LINE', 'GATE_LINE', 'CHANNEL', 'NUMBER'].forEach(k => walk(L[k], k));
  return out;
}

/* The detectors, built from char codes so this file obeys the rule it enforces. */
const DASH = new RegExp('[' + String.fromCharCode(8211, 8212) + ']|\\\\u201[34]|&[mn]dash;|&#821[12];|&#x201[34];', 'i');
const WHO = /\byou are\b|\byou’re\b|\byou're\b/i;
const PLANET = /\bplanets?\b/i;
const RATING = /\bscores?\b|\bcompatib|\bpercent|%|\bratings?\b|\branked\b|\bbest match\b/i;
function repeats(list, cap) {
  const cnt = {};
  list.forEach(s => {
    const w = s.toLowerCase().replace(/\\u2019/g, '’').replace(/[^a-z0-9’' ]+/g, ' ').split(/\s+/).filter(Boolean);
    const seen = new Set();
    for (let j = 0; j + 6 <= w.length; j++) {
      const k = w.slice(j, j + 6).join(' ');
      if (!seen.has(k)) { seen.add(k); cnt[k] = (cnt[k] || 0) + 1; }
    }
  });
  return Object.keys(cnt).filter(k => cnt[k] > cap).map(k => cnt[k] + 'x ' + k);
}

console.log('check-timing-lexicon');

/* TL0: the detectors can see what they are for. */
const planted = 'The first line ' + String.fromCharCode(8212) + ' a dash.';
const plantedRep = ['one two three four five six seven', 'one two three four five six eight', 'one two three four five six nine', 'zero one two three four five six'];
row('TL0', 'every detector fires on a planted fixture',
  DASH.test(planted) && WHO.test('you are steady') && PLANET.test('a planet') && RATING.test('a 78% match') &&
  repeats(plantedRep, 3).length === 1 && !DASH.test('a comma, a colon: a full stop.'));

/* TL1: the movers and the aspects are the app's own. */
const plns = (app.match(/\n {2}PLNS = (\[[^\n]+\]);/) || [])[1];
const appBodies = plns ? JSON.parse(plns.replace(/'/g, '"').replace(/\\u[0-9A-Fa-f]{4}/g, 'x')).map(r => r[0]) : [];
const asps = (app.match(/\n {2}ASPECTS = (\[[^\n]+\]);/) || [])[1];
const appAsps = asps ? JSON.parse(asps.replace(/'/g, '"')).map(r => r[1]) : [];
row('TL1', 'movers equal the app’s PLNS and aspects equal its ASPECTS',
  appBodies.length === 12 && JSON.stringify(appBodies) === JSON.stringify(L.MOVERS) &&
  appAsps.length === 5 && JSON.stringify(appAsps) === JSON.stringify(L.ASPECTS),
  'app ' + JSON.stringify(appBodies) + ' ' + JSON.stringify(appAsps));

/* TL2: the natal points are PLNS plus the four angles anglePoints() draws. */
const ang = (app.match(/anglePoints\(\) \{[\s\S]*?return \[(\[[^\n]+\])\]/) || [])[1] || '';
const appAngles = (ang.match(/\['([A-Za-z ]+)', '[A-Z]{2}'/g) || []).map(x => x.match(/'([^']+)'/)[1]);
const wantTargets = appBodies.concat(appAngles);
row('TL2', 'natal points equal PLNS plus the angles anglePoints() returns',
  appAngles.length === 4 && JSON.stringify(wantTargets) === JSON.stringify(L.TARGETS),
  'app ' + JSON.stringify(wantTargets));

/* TL3: the channels are the topology's thirty six, keyed the same way. */
const chans = Object.keys(L.CHANNEL).sort();
const topo = T.PAIRS.slice().sort();
row('TL3', 'channels equal hd-topology’s 36 pairs', JSON.stringify(chans) === JSON.stringify(topo),
  'missing ' + topo.filter(k => chans.indexOf(k) === -1).join(',') + ' extra ' + chans.filter(k => topo.indexOf(k) === -1).join(','));

/* TL4: coverage, every combination resolves. */
const cov = L.coverage();
let numOk = true;
for (const r of L.ROLES) {
  const values = r === 'challenge' ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
  for (const v of values) { const n = L.number(v, r); if (!n || n.value !== v) numOk = false; }
}
for (const r of ['day', 'month', 'year', 'lp', 'pinnacle']) for (const v of [11, 22, 33]) if (!L.NUMBER[v][r]) numOk = false;
row('TL4', 'all 960 transits, 384 gate lines, 36 channels and every number by role resolve',
  cov.transits === 960 && cov.gateLines === 384 && cov.channels === 36 && numOk, JSON.stringify(cov));

/* TL5: no two transit readings are the same, and no piece is reused. */
const tset = new Set(), moves = new Set(), meets = new Set();
let moveN = 0, meetN = 0;
L.MOVERS.forEach(m => {
  L.ASPECTS.forEach(a => { moves.add(L.MOVE[m][a]); moveN++; L.TARGETS.forEach(t => { const r = L.transit(m, a, t); tset.add(r.move + r.meet + r.ask); }); });
  L.TARGETS.forEach(t => { meets.add(L.MEET[m][t]); meetN++; });
});
row('TL5', '960 distinct transit readings from 60 distinct moves and 192 distinct meetings',
  tset.size === 960 && moves.size === moveN && moveN === 60 && meets.size === meetN && meetN === 192,
  tset.size + ' / ' + moves.size + ' / ' + meets.size);

/* TL16: the sky's own contacts. Every pair of the eleven movers that are not
   the South Node has a conjunction, an easy and a hard reading and a question,
   all distinct; every mover pair the app's sky can produce resolves for all five
   aspects, the South Node read as the North Node turned round; and the two nodes
   with each other answer null, because that pair is always exactly opposite. */
const skyMovers = L.MOVERS.filter(m => m !== 'South Node');
const skyKeys = [];
skyMovers.forEach((a, i) => skyMovers.forEach((b, j) => { if (j > i) skyKeys.push(a + '|' + b); }));
const skyParts = [];
let skyOk = JSON.stringify(Object.keys(L.SKY).sort()) === JSON.stringify(skyKeys.slice().sort());
skyKeys.forEach(k => ['c', 'e', 'h', 'ask'].forEach(p => { const v = L.SKY[k] && L.SKY[k][p]; if (typeof v !== 'string' || v.split(/\s+/).length < 8) skyOk = false; else skyParts.push(v); }));
let skyRes = 0;
L.MOVERS.forEach((a, i) => L.MOVERS.forEach((b, j) => { if (j <= i) return; L.ASPECTS.forEach(asp => {
  const r = L.sky(a, asp, b), nodes = a.indexOf('Node') !== -1 && b.indexOf('Node') !== -1;
  if (nodes ? r !== null : !(r && r.text && r.ask && L.sky(b, asp, a).text === r.text)) skyOk = false; else if (!nodes) skyRes++;
}); }));
const snFlip = L.sky('South Node', 'conjunct', 'Saturn').text === L.sky('North Node', 'opposite', 'Saturn').text;
row('TL16', skyKeys.length + ' sky pairs, ' + skyParts.length + ' distinct readings and questions, ' + skyRes + ' contacts resolve, the South Node mirrored',
  skyOk && skyKeys.length === 55 && new Set(skyParts).size === skyParts.length && skyRes === 325 && snFlip);

/* TL6: every gate says its own thing in every part. */
const parts = { sky: new Set(), held: new Set(), open: new Set(), ask: new Set() };
let gOk = true;
for (let g = 1; g <= 64; g++) {
  const e = L.GATE[g];
  if (!e) { gOk = false; continue; }
  Object.keys(parts).forEach(k => parts[k].add(e[k]));
  if (e.held === e.open || e.sky === e.held) gOk = false;
}
const lines = new Set(Object.values(L.LINE));
row('TL6', '64 gates, each with a distinct sky, held, open and question, and six distinct lines',
  gOk && Object.keys(parts).every(k => parts[k].size === 64) && lines.size === 6);

/* TL6b: every gate has six lines of its own, and the reading returns them. */
let glOk = true;
const glAll = [];
for (let g = 1; g <= 64; g++) {
  const ls = L.GATE_LINE[g];
  if (!Array.isArray(ls) || ls.length !== 6 || ls.some(x => typeof x !== 'string' || x.split(/\s+/).length < 8)) { glOk = false; continue; }
  for (let l = 1; l <= 6; l++) { glAll.push(ls[l - 1]); if (L.gate(g, l, {}).line !== ls[l - 1]) glOk = false; }
}
const TIMEBOUND = /\b(this week|today|tonight|these days|the days)\b/i;
row('TL6b', '384 gate lines, six per gate, all distinct, each returned for its own gate and line, none tied to a span',
  glOk && glAll.length === 384 && new Set(glAll).size === 384 && !glAll.some(x => TIMEBOUND.test(x)),
  glAll.filter(x => TIMEBOUND.test(x)).slice(0, 3).join(' | '));

/* TL7: the held and open readings are what the caller asked for. */
const g34 = L.gate(34, 2, { held: true }), g34o = L.gate(34, 2, { held: false, partner: 20 });
row('TL7', 'a held gate reads held, an open one reads open, and a partner names its channel',
  g34.personal === L.GATE[34].held && g34o.personal === L.GATE[34].open && g34o.channelKey === '20-34' && g34.channel === '' &&
  L.gate(99, 1) === null && L.transit('Sun', 'quincunx', 'Moon') === null && L.number(5, 'decade') === null);

const all = strings();
/* TL8 to TL10: the house rules. */
const dashed = all.filter(x => DASH.test(x.s)).concat(DASH.test(src) ? [{ at: 'source', s: '' }] : []);
row('TL8', 'no dash of either kind, in any encoding, anywhere in the file', dashed.length === 0, dashed.map(x => x.at).slice(0, 5).join(', '));
const who = all.filter(x => WHO.test(x.s));
row('TL9', 'no sentence tells the reader who they are', who.length === 0, who.map(x => x.at + ': ' + x.s).slice(0, 3).join('\n         '));
const bad = all.filter(x => PLANET.test(x.s) || RATING.test(x.s));
row('TL10', 'astral body, never planet, and nothing that rates or ranks', bad.length === 0, bad.map(x => x.at).slice(0, 5).join(', '));

/* TL11: the phrase cap the app holds itself to. */
const prose = all.map(x => x.s).filter(s => s.split(/\s+/).length >= 6);
const rep = repeats(prose, 3);
row('TL11', 'no six word phrase in more than three entries (' + prose.length + ' entries)', rep.length === 0, rep.slice(0, 5).join('; '));

/* TL12: questions are questions, and none repeats. */
const asks = [];
L.TARGETS.forEach(t => ['c', 'e', 'h'].forEach(k => asks.push(L.PLACE[t][k])));
for (let g = 1; g <= 64; g++) asks.push(L.GATE[g].ask);
Object.keys(L.NUMBER).forEach(k => asks.push(L.NUMBER[k].ask));
Object.keys(L.SKY).forEach(k => asks.push(L.SKY[k].ask));
row('TL12', asks.length + ' questions, each ending in a question mark, none repeated',
  asks.every(q => /\?$/.test(q)) && new Set(asks).size === asks.length);

/* TL15: nothing borrowed. The phrasing distinctive to the Wilhelm and Baynes
   translation, and the sentences the Book of Changes room had to rewrite, are
   read out of run-module-tests.js (rows I11 and I12) rather than retyped, so the
   two lists cannot drift. Then no six word run may be shared with any of the
   app's own hexagram line readings: hexagram N is gate N, and a gate line that
   leaned on the hexagram line beside it would be one text wearing two names. */
const mt = fs.readFileSync(MODTESTS, 'utf8');
const listOf = name => { const m = mt.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\];')); return m ? (m[1].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)) : []; };
const barred = listOf('WILHELM').concat(listOf('RESTORED'));
const lexLow = all.map(x => x.s.toLowerCase()).join(' \n ');
const borrowed = barred.filter(q => lexLow.indexOf(q) !== -1);
const IC = require(ICHING);
const six = s => { const w = s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean); const out = new Set(); for (let j = 0; j + 6 <= w.length; j++) out.add(w.slice(j, j + 6).join(' ')); return out; };
const icSix = new Set();
IC.all().forEach(h => (h.lines || []).forEach(t => six(String(t)).forEach(k => icSix.add(k))));
const shared = [];
glAll.forEach(t => six(t).forEach(k => { if (icSix.has(k)) shared.push(k); }));
row('TL15', 'no translation phrasing (' + barred.length + ' fixtures from I11 and I12) and no six word run shared with the ' + icSix.size + ' in the hexagram lines',
  barred.length >= 15 && icSix.size > 1000 && borrowed.length === 0 && shared.length === 0, borrowed.concat(shared).slice(0, 5).join(' | '));

/* TL13: interpretation reads nothing. No ephemeris, no clock, no storage, no network. */
const reach = ['lonOf', 'Astronomy', 'MinorBodies', 'localStorage', 'sessionStorage', 'indexedDB', 'Date.now', 'new Date', 'fetch(', 'XMLHttpRequest']
  .filter(w => src.indexOf(w) !== -1);
row('TL13', 'the module reaches no ephemeris, clock, storage or network', reach.length === 0, reach.join(', '));

/* TL14: the app loads it, the worker precaches it, the bundle inlines it. */
const sw = fs.readFileSync(path.join(repo, 'app', 'sw.js'), 'utf8');
const bb = fs.readFileSync(path.join(repo, 'tools', 'build-bundle.js'), 'utf8');
row('TL14', 'the app loads it, app/sw.js precaches it, build-bundle inlines it',
  app.indexOf('<script src="./timing-lexicon.js"></script>') !== -1 && sw.indexOf("'./timing-lexicon.js'") !== -1 && bb.indexOf("'timing-lexicon.js'") !== -1);

console.log('');
console.log('  transits          ' + cov.transits + '  (12 movers x 5 aspects x 16 natal points)');
console.log('  gate lines        ' + cov.gateLines + '  (64 gates x 6 lines, each written for its gate), ' + cov.channels + ' channels');
console.log('  number readings   ' + cov.numbers);
console.log('  entries walked    ' + all.length);
if (fails) { console.log('check-timing-lexicon: ' + fails + ' failed, ' + passes + ' passed'); process.exit(1); }
console.log('check-timing-lexicon: ok, ' + passes + ' assertions');
