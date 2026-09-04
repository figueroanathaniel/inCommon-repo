#!/usr/bin/env node
/* check-hd-atlas-map.js: Learn from Atlas points every HD tab at a real shelf.
 *
 * HD_ATLAS_SEC maps a Human Design teachings tab to the atlas section that
 * answers it, so "Learn from Atlas" lands on Authorities from the mood tab
 * rather than on the atlas root. Two lists it depends on live in other files:
 * the tab keys come from hd-teachings.js TAB_META, and the section keys from
 * hd-atlas.js SECTIONS. Either can be renamed without anyone touching this map,
 * and the failure is silent: a cross-link that resolves to a section no shell
 * draws is the same blank screen a bad libView is. This asserts both ends.
 *
 * Usage: node tools/check-hd-atlas-map.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const repo = path.resolve(__dirname, '..');
function die(m) { console.error('check-hd-atlas-map: ' + m); process.exit(1); }
function read(f) { const p = path.join(repo, f); if (!fs.existsSync(p)) die('cannot find ' + f); return fs.readFileSync(p, 'utf8'); }

const app = read('app/inCommonApp v2.dc.html');
const teach = read('app/hd-teachings.js');
const atlas = read('app/hd-atlas.js');

/* the map, lifted by brace matching */
const start = app.indexOf('  HD_ATLAS_SEC = {');
if (start === -1) die('HD_ATLAS_SEC is not declared in the app');
let i = app.indexOf('{', start), d = 0, end = -1;
for (; i < app.length; i++) { if (app[i] === '{') d++; else if (app[i] === '}') { d--; if (!d) { end = i; break; } } }
let MAP;
try { MAP = eval('(' + app.slice(app.indexOf('{', start), end + 1) + ')'); } catch (e) { die('could not evaluate HD_ATLAS_SEC: ' + e.message); }

/* the two source-of-truth lists */
const tabKeys = [];
const tm = teach.match(/var TAB_META = \{([\s\S]*?)\n {2}\};/);
if (!tm) die('could not find TAB_META in hd-teachings.js');
tm[1].replace(/^\s*([a-z]+):\s*\{/gim, (_, k) => { tabKeys.push(k); return _; });
if (tabKeys.length < 8) die('found only ' + tabKeys.length + ' teaching tabs; the extractor is not seeing TAB_META');

const secKeys = [];
const sm = atlas.match(/var SECTIONS = \[([\s\S]*?)\];/);
if (!sm) die('could not find SECTIONS in hd-atlas.js');
sm[1].replace(/\['([a-z]+)',/g, (_, k) => { secKeys.push(k); return _; });
if (secKeys.length < 8) die('found only ' + secKeys.length + ' atlas sections; the extractor is not seeing SECTIONS');

/* every key is a real tab, every value is a real section */
Object.keys(MAP).forEach(k => {
  if (tabKeys.indexOf(k) === -1) die('HD_ATLAS_SEC has key "' + k + '", which is not a teachings tab (' + tabKeys.join(', ') + ')');
  if (secKeys.indexOf(MAP[k]) === -1) die('HD_ATLAS_SEC.' + k + ' points at "' + MAP[k] + '", which is not an atlas section (' + secKeys.join(', ') + ')');
});
/* and every tab is mapped, so a new tab cannot fall through to the root unseen */
tabKeys.forEach(k => { if (!MAP[k]) die('teachings tab "' + k + '" has no atlas section; add it to HD_ATLAS_SEC'); });

console.log('check-hd-atlas-map: ok');
console.log('  teaching tabs       ' + tabKeys.length + '  (all mapped)');
console.log('  atlas sections      ' + secKeys.length);
console.log('  every value resolves to a real section');
