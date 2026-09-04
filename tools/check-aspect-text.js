#!/usr/bin/env node
/* check-aspect-text.js: the aspect panel may not end two readings the same way.
 *
 * WHAT WENT WRONG, so the gate is not mistaken for tidiness. The panel closed
 * every hard aspect with "usually as a cost before it becomes a strength" and
 * every soft one with "often so smoothly you stop noticing it". Two strings,
 * shared across every pair of bodies in the app. A reader who opened three
 * aspects read the same last line three times, and the only honest conclusion
 * from that is that nothing is being said. An identical closer is worse than a
 * short one: it tells the reader the text is generated and not meant.
 *
 * WHY THIS RUNS WITHOUT A BROWSER. The closing sentence is built by ASP_CLOSE
 * out of ASP_PULL, and both are plain data on the logic class. This lifts the
 * two declarations straight out of the app file and evaluates them over every
 * ordered pair of bodies at every aspect, which is 2100 sentences against the
 * 400 the brief asks for. It does NOT need a chart, because the property being
 * checked is a property of the generator: if two triples can produce the same
 * last sentence here, they can produce it in the app.
 *
 * The depth paragraph is checked in the app instead, by group N, because it
 * reads houses and orbs off a real chart and a fixture would only be testing
 * this file's idea of a chart.
 *
 * Usage: node tools/check-aspect-text.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');

function die(msg) { console.error('check-aspect-text: ' + msg); process.exit(1); }

if (!fs.existsSync(APP)) die('cannot find ' + APP);
const src = fs.readFileSync(APP, 'utf8');

/* Lift a `NAME = { ... };` class field by brace matching. A regex cannot do
   this: the ASP_CLOSE values are arrow functions containing braces. */
function lift(name) {
  const start = src.indexOf('  ' + name + ' = {');
  if (start === -1) die(name + ' is not declared in the app');
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) die(name + ' is not brace balanced');
  return src.slice(src.indexOf('{', start), end + 1);
}

let PULL, CLOSE, PLAY;
try {
  PULL = eval('(' + lift('ASP_PULL') + ')');
  CLOSE = eval('(' + lift('ASP_CLOSE') + ')');
  PLAY = eval('(' + lift('ASP_PLAY') + ')');
} catch (e) { die('could not evaluate the tables: ' + e.message); }

const bodies = Object.keys(PULL);
const aspects = Object.keys(CLOSE);

/* ---- the tables themselves ---- */
if (bodies.length < 15) die('ASP_PULL covers only ' + bodies.length + ' bodies; the chart draws more than that');
if (aspects.length !== 5) die('expected 5 aspects, found ' + aspects.length + ': ' + aspects.join(', '));
Object.keys(PLAY).forEach(k => { if (aspects.indexOf(k) === -1) die('ASP_PLAY has ' + k + ' but ASP_CLOSE does not'); });
aspects.forEach(k => { if (!PLAY[k]) die('ASP_CLOSE has ' + k + ' but ASP_PLAY does not'); });

/* A shared pull phrase would collapse two bodies into one closing sentence, so
   this is the single assumption the uniqueness proof rests on. */
const seenPull = new Map();
bodies.forEach(b => {
  const v = String(PULL[b]).trim().toLowerCase();
  if (seenPull.has(v)) die('ASP_PULL: ' + b + ' and ' + seenPull.get(v) + ' share the phrase "' + PULL[b] + '"');
  seenPull.set(v, b);
  if (v.split(/\s+/).length < 4) die('ASP_PULL: ' + b + ' is too thin to carry a sentence: "' + PULL[b] + '"');
});

/* ---- the sweep ---- */
const lastOf = s => {
  const parts = String(s).trim().match(/[^.!?]+[.!?]+/g);
  return (parts && parts.length ? parts[parts.length - 1] : String(s)).trim();
};

const seen = new Map();
let n = 0, collisions = [];
for (const asp of aspects) {
  for (const a of bodies) {
    for (const b of bodies) {
      if (a === b) continue;
      const sentence = CLOSE[asp](a, b, PULL[a], PULL[b]);
      n++;
      if (!/[.!?]$/.test(String(sentence).trim())) die(asp + ' ' + a + '/' + b + ': closer does not end a sentence');
      const last = lastOf(sentence);
      /* The closer must BE its last sentence: a trailing shared clause is
         exactly the failure this gate exists for. */
      if (last !== String(sentence).trim()) {
        die(asp + ' ' + a + '/' + b + ': the closer is more than one sentence, so the last one may be shared:\n    ' + last);
      }
      if (seen.has(last)) collisions.push({ last: last, first: seen.get(last), second: asp + ' ' + a + ' / ' + b });
      else seen.set(last, asp + ' ' + a + ' / ' + b);
    }
  }
}

if (n < 400) die('swept only ' + n + ' closers; the brief asks for at least 400');
if (collisions.length) {
  console.error('check-aspect-text: ' + collisions.length + ' closing sentences are shared by more than one aspect.');
  collisions.slice(0, 3).forEach(c => {
    console.error('  "' + c.last.slice(0, 90) + '"');
    console.error('    used by ' + c.first + '  and  ' + c.second);
  });
  process.exit(1);
}

/* Both bodies must actually appear, or "unique" is being carried by something
   the reader cannot see and the sentence is still generic to them. */
let missing = 0;
for (const asp of aspects) {
  for (const a of bodies.slice(0, 6)) {
    for (const b of bodies.slice(6, 12)) {
      const t = CLOSE[asp](a, b, PULL[a], PULL[b]);
      if (t.indexOf(a) === -1 || t.indexOf(b) === -1) missing++;
    }
  }
}
if (missing) die(missing + ' closers do not name both bodies');

/* The rule that has no exceptions anywhere in this project. */
const dash = new RegExp('[' + String.fromCharCode(8212, 8211) + ']');
[['ASP_PULL', PULL], ['ASP_PLAY', PLAY]].forEach(([nm, tbl]) => {
  Object.keys(tbl).forEach(k => { if (dash.test(String(tbl[k]))) die(nm + '.' + k + ' contains an em or en dash'); });
});
for (const asp of aspects) {
  const t = CLOSE[asp]('Sun', 'Moon', PULL.Sun, PULL.Moon);
  if (dash.test(t)) die('ASP_CLOSE.' + asp + ' contains an em or en dash');
}

/* ---------------------------------------------------------------------------
   SYNASTRY. Same property, harder requirement.

   The natal panel needs its closers distinct. The synastry panel needed that
   AND structural variety, because six contacts sit on one screen and six
   identical sentence shapes read as a catalogue however different the nouns
   are. So this checks two things a uniqueness test alone would miss: that the
   twenty frames are genuinely distinct shapes, and that real pairs actually
   spread across them rather than all hashing to the same one.
--------------------------------------------------------------------------- */
let SYN, ING;
try { SYN = eval('(' + lift('SYN_FRAME') + ')'); } catch (e) { die('could not evaluate SYN_FRAME: ' + e.message); }
try { ING = eval('(' + lift('ASP_PULL_ING') + ')'); } catch (e) { die('could not evaluate ASP_PULL_ING: ' + e.message); }
bodies.forEach(b => { if (!ING[b]) die('ASP_PULL_ING is missing ' + b + '; every pull needs its noun form'); });
Object.keys(ING).forEach(b => {
  if (/^to /.test(ING[b])) die('ASP_PULL_ING.' + b + ' is still an infinitive: "' + ING[b] + '"');
});

const synAspects = Object.keys(SYN);
if (synAspects.length !== 5) die('SYN_FRAME covers ' + synAspects.length + ' aspects, expected 5');
synAspects.forEach(k => {
  if (!Array.isArray(SYN[k])) die('SYN_FRAME.' + k + ' is not a list of frames');
  if (SYN[k].length < 4) die('SYN_FRAME.' + k + ' has only ' + SYN[k].length + ' shapes; four is the floor');
});

/* the app's own hash, restated: if these drift apart the sweep proves nothing */
const frameIdx = (a, b, n) => {
  const key = a + '|' + b;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % n;
};

const synSeen = new Map();
const shapeUse = {};
let synN = 0, synDupes = [];
for (const asp of synAspects) {
  for (const a of bodies) {
    for (const b of bodies) {
      if (a === b) continue;
      const idx = frameIdx(a, b, SYN[asp].length);
      const line = SYN[asp][idx](a, b, PULL[a], PULL[b], 'Robin', 'Sam', ING[a], ING[b]);
      synN++;
      shapeUse[asp + '#' + idx] = (shapeUse[asp + '#' + idx] || 0) + 1;
      if (line.indexOf(a) === -1 || line.indexOf(b) === -1) die('synastry ' + asp + ' ' + a + '/' + b + ': does not name both bodies');
      if (String(line).split(/\s+/).length < 25) die('synastry ' + asp + ' ' + a + '/' + b + ': too thin at ' + String(line).split(/\s+/).length + ' words');
      if (synSeen.has(line)) synDupes.push(asp + ' ' + a + '/' + b + ' == ' + synSeen.get(line));
      else synSeen.set(line, asp + ' ' + a + '/' + b);
    }
  }
}
/* GRAMMAR, NOT ONLY DISTINCTNESS.

   The first draft of these frames dropped the infinitive form into slots that
   needed a noun, and produced "agree by default about to be wanted without
   having to earn it" and "opens Sam's Mercury toward to get the thought said".
   Both rendered in the app. Both are unique. A sweep that only counts
   collisions calls that a pass, which is how nonsense ships past a green gate.
   These are the seams where a preposition or a transitive verb meets a pull. */
const SEAMS = [' about to ', ' toward to ', ' handles to ', ' offer to ', ' reads to ',
               ' reinforce to ', ' takes care of to ', ' with to ', ' as to ', ' Neither to ',
               ' nor to ', ' looks like to ', ' supplies to ', ' carries to '];
for (const asp of synAspects) {
  for (const a of bodies) {
    for (const b of bodies) {
      if (a === b) continue;
      const idx = frameIdx(a, b, SYN[asp].length);
      const t = ' ' + SYN[asp][idx](a, b, PULL[a], PULL[b], 'Robin', 'Sam', ING[a], ING[b]) + ' ';
      const hit = SEAMS.find(x => t.indexOf(x) > -1);
      if (hit) die('synastry ' + asp + ' ' + a + '/' + b + ' reads ungrammatically at "' + hit.trim() + '":\n    ' + t.trim().slice(0, 150));
    }
  }
}

if (synN < 400) die('swept only ' + synN + ' synastry lines; the brief asks for at least 400');
if (synDupes.length) die(synDupes.length + ' synastry lines are shared, first: ' + synDupes[0]);

/* every shape must actually get used, or the variety is theoretical */
const unused = [];
synAspects.forEach(asp => SYN[asp].forEach((_, i) => { if (!shapeUse[asp + '#' + i]) unused.push(asp + '#' + i); }));
if (unused.length) die('these frames are never selected by any pair: ' + unused.join(', '));

/* and no two frames may open the same way, which is what "repetitive" meant */
const openers = [];
synAspects.forEach(asp => SYN[asp].forEach((f, i) => {
  openers.push(f('Venus', 'Mars', PULL.Venus, PULL.Mars, 'Robin', 'Sam', ING.Venus, ING.Mars).slice(0, 24));
}));
const dupOpen = openers.filter((v, i) => openers.indexOf(v) !== i);
if (dupOpen.length) die('two synastry frames open identically: "' + dupOpen[0] + '"');

/* the sovereignty language item 1 removed must not come back */
const BANNED = ['yours to say, not the chart', 'the choice is yours', 'never an outcome, and it says nothing',
                'it does not settle who was right', 'that is yours to decide'];
const appSrc = src;
BANNED.forEach(b => { if (appSrc.split(b).length - 1 > 1) die('the removed sovereignty line is back in more than a comment: "' + b + '"'); });

/* ---------------------------------------------------------------------------
   SYNASTRY CLOSERS. The last sentence of every contact, one per triple.

   Item 2 of the third pass: no two synastry aspect descriptions may end the
   same way, and both synastry tabs did before this (the general tab on
   "carries ... carries ...", the For You Two tab on one of four tone strings).
   SYN_CLOSE embeds both names and both pulls, so it is unique per triple, and
   this sweeps all 2100 and proves it, plus the grammar seams the frames taught
   this gate to watch for.
--------------------------------------------------------------------------- */
let SC;
try { SC = eval('(' + lift('SYN_CLOSE') + ')'); } catch (e) { die('could not evaluate SYN_CLOSE: ' + e.message); }
const scAspects = Object.keys(SC);
if (scAspects.length !== 5) die('SYN_CLOSE covers ' + scAspects.length + ' aspects, expected 5');
scAspects.forEach(k => { if (typeof SC[k] !== 'function') die('SYN_CLOSE.' + k + ' is not a function'); });

const scSeen = new Map();
let scN = 0, scDupes = [];
for (const asp of scAspects) {
  for (const a of bodies) {
    for (const b of bodies) {
      if (a === b) continue;
      const line = SC[asp](a, b, PULL[a], PULL[b], 'Robin', 'Sam');
      scN++;
      if (!/[.!?]$/.test(String(line).trim())) die('synastry closer ' + asp + ' ' + a + '/' + b + ' does not end a sentence');
      if (line.indexOf(a) === -1 || line.indexOf(b) === -1) die('synastry closer ' + asp + ' ' + a + '/' + b + ' does not name both bodies');
      if (String(line).split(/\s+/).length < 25) die('synastry closer ' + asp + ' ' + a + '/' + b + ' is too thin');
      const t = ' ' + line + ' ';
      const hit = SEAMS.find(x => t.indexOf(x) > -1);
      if (hit) die('synastry closer ' + asp + ' ' + a + '/' + b + ' reads ungrammatically at "' + hit.trim() + '"');
      if (scSeen.has(line)) scDupes.push(asp + ' ' + a + '/' + b + ' == ' + scSeen.get(line));
      else scSeen.set(line, asp + ' ' + a + '/' + b);
    }
  }
}
if (scN < 400) die('swept only ' + scN + ' synastry closers; the brief asks for at least 400');
if (scDupes.length) die(scDupes.length + ' synastry closers are shared, first: ' + scDupes[0]);
/* no two aspects may share a closer opening, the "identical boilerplate" shape */
const scOpen = scAspects.map(asp => SC[asp]('Venus', 'Mars', PULL.Venus, PULL.Mars, 'Robin', 'Sam').slice(0, 20));
const scDupOpen = scOpen.filter((v, i) => scOpen.indexOf(v) !== i);
if (scDupOpen.length) die('two synastry closers open identically: "' + scDupOpen[0] + '"');

console.log('check-aspect-text: ok');
console.log('  bodies              ' + bodies.length + '  (all pull phrases distinct)');
console.log('  aspects             ' + aspects.length);
console.log('  closers swept       ' + n.toLocaleString() + '  (brief asks for 400)');
console.log('  distinct closers    ' + seen.size.toLocaleString());
console.log('  shared last lines   0');
console.log('  synastry frames     ' + synAspects.reduce((n, k) => n + SYN[k].length, 0) + '  (all distinct openers, all reachable)');
console.log('  synastry swept      ' + synN.toLocaleString() + '  (brief asks for 400)');
console.log('  synastry distinct   ' + synSeen.size.toLocaleString());
console.log('  syn closers swept   ' + scN.toLocaleString() + '  (brief asks for 400)');
console.log('  syn closers distinct ' + scSeen.size.toLocaleString() + '  (unique final sentence per triple)');
