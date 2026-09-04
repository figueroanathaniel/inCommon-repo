#!/usr/bin/env node
/* check-chart-tone.js: the register follows the chart, and never the finding.
 *
 * WHAT THIS IS FOR. The app spoke to everybody in one voice. chartTone() reads
 * the element and modality signature of the chart on screen and toneVoice()
 * turns it into a way of moving a sentence. Two things can go wrong with that
 * and only one of them is visible by reading the code.
 *
 * The visible one is weighting. Element is counted over every placed body, but
 * the Sun, the Moon and the Ascendant carry three each, because an unweighted
 * count lets four asteroids in one element outvote the luminaries and hands a
 * Cancer Sun with a Pisces Moon a "fire chart". This sweeps 432 synthesised
 * charts and asserts the luminaries actually decide.
 *
 * The invisible one is collapse: a detector that technically varies but puts
 * 95% of real people in one bucket is not personalisation, it is a default with
 * extra steps. So this checks spread as well as correctness.
 *
 * WHY SYNTHETIC CHARTS. chartTone() needs placed(), which needs the ephemeris
 * and the app class, so it cannot run here. What CAN run here is the part that
 * can be wrong: the tables, the weighting, and the tie break. Those are lifted
 * out of the app so the gate and the app cannot disagree. Real charts were swept
 * in the browser instead, 177 of them across 1955 to 2009, every element
 * present and no errors, which is recorded in docs/worklog-v6.1.md.
 *
 * Usage: node tools/check-chart-tone.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
function die(m) { console.error('check-chart-tone: ' + m); process.exit(1); }
if (!fs.existsSync(APP)) die('cannot find ' + APP);
const src = fs.readFileSync(APP, 'utf8');

function liftArr(name) {
  const m = new RegExp('  ' + name + " = (\\[[^\\]]*\\]);").exec(src);
  if (!m) die(name + ' is not declared in the app');
  return eval(m[1]);
}
function liftObj(name) {
  const start = src.indexOf('  ' + name + ' = {');
  if (start === -1) die(name + ' is not declared in the app');
  let i = src.indexOf('{', start), d = 0, end = -1;
  for (; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}') { d--; if (!d) { end = i; break; } }
  }
  return eval('(' + src.slice(src.indexOf('{', start), end + 1) + ')');
}

const ELEM = liftArr('SIGN_ELEMENT');
const MODA = liftArr('SIGN_MODALITY');
const W = liftObj('TONE_WEIGHT');
const VOICE = liftObj('TONE_VOICE');

/* ---- the tables ---- */
if (ELEM.length !== 12) die('SIGN_ELEMENT has ' + ELEM.length + ' entries, expected 12');
if (MODA.length !== 12) die('SIGN_MODALITY has ' + MODA.length + ' entries, expected 12');
['fire', 'earth', 'air', 'water'].forEach(e => {
  const n = ELEM.filter(x => x === e).length;
  if (n !== 3) die('SIGN_ELEMENT gives ' + e + ' ' + n + ' signs; the zodiac gives it 3');
});
['cardinal', 'fixed', 'mutable'].forEach(m => {
  const n = MODA.filter(x => x === m).length;
  if (n !== 4) die('SIGN_MODALITY gives ' + m + ' ' + n + ' signs; the zodiac gives it 4');
});
['water', 'air', 'fire', 'earth'].forEach(e => {
  if (!VOICE[e]) die('TONE_VOICE has no entry for ' + e);
  ['join', 'turn', 'hold', 'pace'].forEach(k => { if (!VOICE[e][k]) die('TONE_VOICE.' + e + ' is missing ' + k); });
});
/* Four voices that say the same thing are one voice. */
['join', 'turn', 'hold', 'pace'].forEach(k => {
  const vals = ['water', 'air', 'fire', 'earth'].map(e => VOICE[e][k]);
  if (new Set(vals).size !== 4) die('TONE_VOICE.' + k + ' is not distinct across the four elements');
});
['Sun', 'Moon', 'Ascendant'].forEach(b => {
  if ((W[b] || 1) <= 1) die('TONE_WEIGHT.' + b + ' is ' + (W[b] || 1) + '; the luminaries and the rising sign must outweigh a minor body');
});

/* ---- the same arithmetic the app runs ---- */
const ORDER = ['water', 'air', 'fire', 'earth'];
const MORDER = ['cardinal', 'fixed', 'mutable'];
function tone(rows) {
  const c = { fire: 0, earth: 0, air: 0, water: 0 }, m = { cardinal: 0, fixed: 0, mutable: 0 };
  let n = 0;
  rows.forEach(r => {
    const w = W[r.name] || 1;
    c[ELEM[r.idx % 12]] += w; m[MODA[r.idx % 12]] += w; n += w;
  });
  const elemOf = nm => { const r = rows.find(x => x.name === nm); return r ? ELEM[r.idx % 12] : null; };
  const sunE = elemOf('Sun'), moonE = elemOf('Moon');
  const rank = e => (e === sunE ? -2 : e === moonE ? -1 : 0);
  return {
    element: ORDER.slice().sort((x, y) => c[y] - c[x] || rank(x) - rank(y) || ORDER.indexOf(x) - ORDER.indexOf(y))[0],
    modality: MORDER.slice().sort((x, y) => m[y] - m[x] || MORDER.indexOf(x) - MORDER.indexOf(y))[0],
    counts: c, n: n
  };
}

const BODIES = ['Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron'];

/* ---- 432 charts, deterministic ---- */
let n = 0;
const tally = { fire: 0, earth: 0, air: 0, water: 0 };
const mtally = { cardinal: 0, fixed: 0, mutable: 0 };
for (let seed = 0; seed < 432; seed++) {
  /* A weak LCG was used here first and its high bits correlate: 432 charts came
     out 60% fire and 2% earth, and the spread check correctly failed. The
     detector was fine; the fixture was not. This is a proper avalanche mix
     (splitmix64's finaliser, 32 bit), so a sign index is uniform per body. */
  const mix = x => {
    x = (x ^ (x >>> 16)) >>> 0;
    x = Math.imul(x, 0x7feb352d) >>> 0;
    x = (x ^ (x >>> 15)) >>> 0;
    x = Math.imul(x, 0x846ca68b) >>> 0;
    return (x ^ (x >>> 16)) >>> 0;
  };
  const rows = BODIES.map((name, i) => ({ name: name, idx: mix(seed * 977 + i * 61 + 1) % 12 }));
  const t = tone(rows);
  tally[t.element]++; mtally[t.modality]++; n++;
}
if (n < 400) die('swept only ' + n + ' charts; the brief asks for 400');
Object.keys(tally).forEach(e => { if (!tally[e]) die('no chart in ' + n + ' produced a ' + e + ' tone; the detector has collapsed'); });
Object.keys(mtally).forEach(m => { if (!mtally[m]) die('no chart produced a ' + m + ' modality'); });
const worst = Math.max(...Object.values(tally)) / n;
if (worst > 0.6) die('one element takes ' + Math.round(worst * 100) + '% of charts; that is a default, not a reading');

/* ---- the weighting is the point, so prove it decides ---- */
const stack = (lumIdx, restIdx) => BODIES.map(nm => ({ name: nm, idx: ['Sun', 'Moon', 'Ascendant'].indexOf(nm) > -1 ? lumIdx : restIdx }));
/* three water luminaries against nine fire everything-else */
const wLum = tone(stack(3, 0));           /* Cancer luminaries, Aries rest */
if (wLum.element !== 'water') die('three water luminaries lost to nine minor bodies; the weighting is not doing its job');
/* and the reverse, so it is weighting and not a water thumb on the scale */
const fLum = tone(stack(0, 3));
if (fLum.element !== 'fire') die('three fire luminaries lost to nine water minor bodies');

/* ---- the register may never carry a claim ---- */
const dash = new RegExp('[' + String.fromCharCode(8212, 8211) + ']');
Object.keys(VOICE).forEach(e => Object.keys(VOICE[e]).forEach(k => {
  const v = String(VOICE[e][k]);
  if (dash.test(v)) die('TONE_VOICE.' + e + '.' + k + ' contains an em or en dash');
  if (/\b(you are|you will|this means you|indicates that you)\b/i.test(v)) {
    die('TONE_VOICE.' + e + '.' + k + ' asserts something about the reader: "' + v + '". A register moves a sentence, it does not make a claim.');
  }
}));

console.log('check-chart-tone: ok');
console.log('  signs per element   3 3 3 3      modalities  4 4 4');
console.log('  voices              4  (join, turn, hold and pace all distinct)');
console.log('  charts swept        ' + n + '  (brief asks for 400)');
console.log('  element spread      fire ' + tally.fire + '  earth ' + tally.earth + '  air ' + tally.air + '  water ' + tally.water);
console.log('  modality spread     cardinal ' + mtally.cardinal + '  fixed ' + mtally.fixed + '  mutable ' + mtally.mutable);
console.log('  luminaries decide   yes, in both directions');
