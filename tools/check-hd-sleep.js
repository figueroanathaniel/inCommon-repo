#!/usr/bin/env node
/* check-hd-sleep.js: the Sleep reading, on the eight charts the tradition
 * separates.
 *
 * WHAT THIS IS FOR. The correction of 28 October 2026 gave a design with a
 * defined Sacral a different sleep instruction from every other design, and
 * that distinction is about a defined centre rather than about authority: an
 * emotional Generator holds Emotional authority and a defined Sacral, and the
 * tradition still gives it the post-spending instruction. The fault it repaired
 * was selection, so these rows read the assembled tab and ask what was chosen:
 *
 *   - the type and the authority the chart holds are the two the reading names;
 *   - every centre the sleep tab discusses is named in the state the chart
 *     holds it, defined or open, and never in the other state;
 *   - the closing paragraph is the one for that chart's Sacral state;
 *   - nothing from the other design's instruction appears anywhere in the tab,
 *     the four bullet lists included, because a padded list is where the
 *     defined-Sacral advice reached a design that does not have one.
 *
 * These are selections and their consistency, not snapshots of every
 * paragraph. Whether the instruction itself is faithful to the tradition is a
 * source review, and it is recorded in the task record rather than asserted
 * here.
 *
 * RED BEFORE, GREEN AFTER. Point INCOMMON_APP_DIR at a directory holding the
 * four modules as they stood before the correction and the same rows fail:
 *
 *   node tools/check-hd-sleep.js
 *   INCOMMON_APP_DIR=/path/to/before node tools/check-hd-sleep.js
 *
 * Usage:  node tools/check-hd-sleep.js [--quiet]
 * Exit:   0 all passed, 1 any failure.
 */
'use strict';

const path = require('path');

const repo = path.resolve(__dirname, '..');
const appDir = process.env.INCOMMON_APP_DIR
  ? path.resolve(process.env.INCOMMON_APP_DIR)
  : path.join(repo, 'app');
const quiet = process.argv.indexOf('--quiet') !== -1;

/* Helmet order, as the app loads them: topology first, then the atlas that
   reads it, then the two teaching modules. */
const TOPO = require(path.join(appDir, 'hd-topology.js'));
globalThis.HDTopology = TOPO;
const ATLAS = require(path.join(appDir, 'hd-atlas.js'));
globalThis.HDAtlas = ATLAS;
const LIFE = require(path.join(appDir, 'hd-life.js'));
const TEACH = require(path.join(appDir, 'hd-teachings.js'));

const rows = [];
function row(id, desc, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  rows.push({ id, desc, pass: a === e, actual: a, expected: e });
}

/* The nine centres, and the five the sleep tab speaks about. The sleep list is
   hd-teachings' own RELEVANT.sleep entry; a centre outside it is not the sleep
   tab's subject and is not asserted here. */
const CENTERS = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Spleen', 'Solar Plexus', 'Sacral', 'Root'];
const SLEEP_CENTERS = ['Head', 'Ajna', 'Sacral', 'Root', 'Solar Plexus'];

/* The four sentences that say which design is being read. Each is quoted from
   the corrected copy and each is a claim the other design cannot make. */
const SPENT = 'has been spent, not before it';
const HORIZONTAL = 'horizontal position long before sleep';
const DEFINED_SACRAL = 'a defined Sacral goes to bed once';
const OPEN_SACRAL = 'You need more rest than the people around you';
const SACRAL_ROWS = ['engine still running', 'energy spent on something the gut said yes to'];

const chart = o => ({
  type: o.type, strategy: o.type, authority: o.authority,
  profileKey: '3/5', profileName: 'Martyr / Heretic',
  profileHow: 'Trial and error, then a life read through other people.',
  cLine: 3, uLine: 5,
  defined: o.defined,
  open: CENTERS.filter(n => o.defined.indexOf(n) === -1),
  channelNames: [], channelCount: 0,
  gateCount: 12, designCount: 13, personalityCount: 13,
  hangingNames: [], hangingCount: 0
});

const sleepOf = c => TEACH.build(chart(c), ATLAS, LIFE).filter(tab => tab.key === 'sleep')[0];
const paraStarting = (tab, prefix) => tab.paragraphs.filter(p => p.indexOf(prefix) === 0)[0] || '';
const joined = tab => tab.paragraphs.join(' ') + ' ' + tab.quads.map(q => q.items.join(' ')).join(' ');

/* The eight cases the assignment names. Each is a chart the tradition treats
   differently, built here rather than taken from a reader. */
const CASES = [
  { id: 'S1', label: 'Generator with Sacral authority',
    type: 'Generator', authority: 'Sacral', defined: ['Sacral', 'Root', 'Spleen'], sacral: true },
  { id: 'S2', label: 'Generator with Emotional authority, and a defined Sacral',
    type: 'Generator', authority: 'Emotional', defined: ['Sacral', 'Solar Plexus', 'Root'], sacral: true },
  { id: 'S3', label: 'Manifesting Generator with Sacral authority',
    type: 'Manifesting Generator', authority: 'Sacral', defined: ['Sacral', 'Root', 'Throat', 'G'], sacral: true },
  { id: 'S4', label: 'Manifesting Generator with Emotional authority, and a defined Sacral',
    type: 'Manifesting Generator', authority: 'Emotional', defined: ['Sacral', 'Solar Plexus', 'Throat', 'G'], sacral: true },
  { id: 'S5', label: 'Manifestor with Emotional authority',
    type: 'Manifestor', authority: 'Emotional', defined: ['Solar Plexus', 'Throat', 'Heart'], sacral: false },
  { id: 'S6', label: 'Projector with Emotional authority',
    type: 'Projector', authority: 'Emotional', defined: ['Solar Plexus', 'Ajna'], sacral: false },
  { id: 'S7', label: 'Projector with Splenic authority',
    type: 'Projector', authority: 'Splenic', defined: ['Spleen', 'Ajna'], sacral: false },
  { id: 'S8', label: 'Reflector with Lunar authority',
    type: 'Reflector', authority: 'Lunar', defined: [], sacral: false }
];

/* The five things each reading is asked, gathered into one row per case so a
   failure names the chart and the field in the same line. */
const readings = CASES.map(c => {
  const tab = sleepOf(c);
  const text = joined(tab);
  const definedParas = paraStarting(tab, 'Now the centers that carry this in you');
  const openParas = paraStarting(tab, 'And what is open');
  const openSacral = paraStarting(tab, 'Every center the tradition associates');
  const close = tab.paragraphs[tab.paragraphs.length - 1] || '';
  const namedDefined = SLEEP_CENTERS.filter(n => c.defined.indexOf(n) !== -1 && definedParas.indexOf('Your defined ' + n + ' center.') !== -1);
  const namedOpen = SLEEP_CENTERS.filter(n => c.defined.indexOf(n) === -1 && openParas.indexOf('Your open ' + n + ' center.') !== -1);
  const wantDefined = SLEEP_CENTERS.filter(n => c.defined.indexOf(n) !== -1);
  const wantOpen = SLEEP_CENTERS.filter(n => c.defined.indexOf(n) === -1);
  return {
    c: c, tab: tab, text: text, close: close,
    summary: {
      type: tab.paragraphs[0].indexOf('You are a ' + c.type + '.') !== -1,
      authority: tab.paragraphs[1].indexOf('Your chart gives ' + c.authority + ' ' + LIFE.authorityFor(c.authority).sleep) !== -1,
      defined: wantDefined.filter(n => namedDefined.indexOf(n) === -1),
      open: wantOpen.filter(n => namedOpen.indexOf(n) === -1),
      closing: close.indexOf(c.sacral ? SPENT : HORIZONTAL) !== -1 ? (c.sacral ? 'spent' : 'horizontal') : 'wrong closing',
      otherDesign: (c.sacral
        ? [HORIZONTAL]
        : [DEFINED_SACRAL]).concat(SACRAL_ROWS.filter(r => c.sacral ? false : text.indexOf(r) !== -1))
        .concat(openSacral && c.sacral && text.indexOf(OPEN_SACRAL) !== -1 ? [OPEN_SACRAL] : [])
        .filter(m => text.indexOf(m) !== -1)
    }
  };
});

/* S1 to S8: each case, read as the page assembles it. */
readings.forEach(r => {
  row(r.c.id, r.c.label + ': the reading names its type and its authority, names every centre in the state the chart holds it, closes on the ' + (r.c.sacral ? 'post-spending' : 'horizontal') + ' instruction, and carries nothing from the other design',
    r.summary,
    { type: true, authority: true, defined: [], open: [], closing: r.c.sacral ? 'spent' : 'horizontal', otherDesign: [] });
});

/* S9: the centre sentence and the centre state agree for all eight at once. A
   reading that names a centre it does not have is the shape of the original
   fault one level down. */
row('S9', 'across the eight charts no reading names a centre in a state the chart does not hold it, defined or open',
  readings.map(r => {
    const wrong = [];
    SLEEP_CENTERS.forEach(n => {
      const inDefined = r.tab.paragraphs.slice(0, 4).join(' ').indexOf('Your defined ' + n + ' center.') !== -1;
      const inOpen = r.text.indexOf('Your open ' + n + ' center.') !== -1;
      if (inDefined && r.c.defined.indexOf(n) === -1) wrong.push('defined ' + n);
      if (inOpen && r.c.defined.indexOf(n) !== -1) wrong.push('open ' + n);
    });
    return [r.c.id, wrong];
  }).filter(x => x[1].length), []);

/* S10: the defined-Sacral sentence, which is the instruction the fault handed
   to designs without one. Four charts hold a defined Sacral and four do not. */
row('S10', 'the defined-Sacral sleep instruction appears in the four readings whose chart defines Sacral and in none of the other four',
  readings.map(r => [r.c.id, r.text.indexOf(DEFINED_SACRAL) !== -1]),
  readings.map(r => [r.c.id, r.c.sacral]));

/* S11: the two bullet rows the correction marked strict. They are the padding
   route, because pick() fills a short list from rows whose condition did not
   match unless the row refuses it. */
row('S11', 'the two Sacral bullet rows appear in the four defined-Sacral readings and in none of the other four',
  readings.map(r => [r.c.id, SACRAL_ROWS.filter(s => r.text.indexOf(s) !== -1).length]),
  readings.map(r => [r.c.id, r.c.sacral ? 2 : 0]));

/* S12: the open-Sacral entry keeps its meaning and stays where it belongs. It
   is the correct teaching for a design without a defined Sacral, so removing
   it would be the overcorrection this row exists to catch. */
row('S12', 'the open-Sacral sentence is unchanged and appears in the four readings without a defined Sacral, and in none of the four with one',
  {
    unchanged: LIFE.CENTERS.Sacral.open.sleep === OPEN_SACRAL +
      ', and often need to lie down before they do. That is not a weakness to be trained out.',
    inOpenParagraph: readings.map(r => [r.c.id, r.c.defined.indexOf('Sacral') === -1
      ? paraStarting(r.tab, 'And what is open').indexOf(OPEN_SACRAL) !== -1 : null]),
    anywhere: readings.map(r => [r.c.id, r.text.indexOf(OPEN_SACRAL) !== -1])
  },
  {
    unchanged: true,
    inOpenParagraph: readings.map(r => [r.c.id, r.c.defined.indexOf('Sacral') === -1 ? true : null]),
    anywhere: readings.map(r => [r.c.id, r.c.defined.indexOf('Sacral') === -1])
  });

/* S13: the fallback. A chart that arrives without a defined list is not a chart
   the app builds, and the reading still has to choose the honest closing
   rather than a Sacral one, and must not throw on the way. The two guards that
   return no tabs at all are here too, because a missing atlas is a real state
   during boot. */
(() => {
  let absent = null, threw = '';
  try { absent = TEACH.build({ type: 'Generator', authority: 'Sacral' }, ATLAS, LIFE).filter(t => t.key === 'sleep')[0]; }
  catch (e) { threw = String(e && e.message); }
  const close = absent ? absent.paragraphs[absent.paragraphs.length - 1] || '' : '';
  const text = absent ? joined(absent) : '';
  row('S13', 'a chart with no defined list still composes, closes on the horizontal instruction, claims no defined Sacral, and does not throw; a missing chart or atlas returns no tabs',
    { threw: threw, tabs: absent ? 1 : 0, closing: close.indexOf(HORIZONTAL) !== -1 ? 'horizontal' : (close.indexOf(SPENT) !== -1 ? 'spent' : 'none'),
      claimsSacral: text.indexOf(DEFINED_SACRAL) !== -1,
      nullChart: TEACH.build(null, ATLAS, LIFE).length, nullAtlas: TEACH.build({ type: 'Generator' }, ATLAS).length },
    { threw: '', tabs: 1, closing: 'horizontal', claimsSacral: false, nullChart: 0, nullAtlas: 0 });
})();

/* ---- report ---- */
const failed = rows.filter(r => !r.pass);
if (!quiet) {
  rows.forEach(r => { if (!r.pass) console.log('FAIL ' + r.id + ' ' + r.desc + '\n  got      ' + r.actual + '\n  expected ' + r.expected); });
}
console.log('Sleep reading (' + path.basename(appDir) + '): ' + (rows.length - failed.length) + ' of ' + rows.length + ' passed');
if (failed.length) {
  console.log('Failed: ' + failed.map(r => r.id).join(' '));
  process.exitCode = 1;
}
