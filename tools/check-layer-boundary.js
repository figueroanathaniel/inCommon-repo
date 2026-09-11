#!/usr/bin/env node
/* check-layer-boundary.js: mechanics never depend on interpretation.
 *
 * THE RULE. Two layers, and the direction between them is one way:
 *
 *   mechanics       ephemeris and birth data in, structured data out. Gate
 *                   numbers, line numbers, centre states, channel
 *                   connectivity, positions, places, dates. It is the only
 *                   layer permitted to touch the ephemeris, and it may not
 *                   read anything from the interpretation layer.
 *   interpretation  inCommon's own writing, keyed by what mechanics returned.
 *                   It computes no positions and calls no ephemeris.
 *   shell           storage, profiles, network, safety routing, analytics and
 *                   the dormant Oki modules. Outside the boundary, listed so
 *                   the manifest is complete.
 *
 * WHY THIS IS A tools/ GATE AND NOT A LINT RULE. It was specified as an import
 * check that fails the build when mechanics imports from interpretation. There
 * is no import graph to check. CLAUDE.md: one canonical file, inline styles
 * only, app/ stays flat, and every module loads as a plain `./module.js` script
 * tag in helmet order. Dependency here is a UMD factory reading a global that
 * an earlier script tag defined, so that is what this reads: the exported
 * global name of every module, looked for by name inside every other module.
 *
 * WHY THERE IS NO 32-CHARACTER STRING CAP. It was specified as one and it bars
 * the thing the safety rules require. hd-composite.js returns CONFIG_CAUTION,
 * a 158-character sentence, deliberately from the module rather than from the
 * template, so it cannot drift between the two shells and so a screen that
 * forgets it fails a test instead of shipping quietly. Rows C11 to C15 assert
 * it is present. A cap that length would delete it.
 *
 * So prose in mechanics is measured rather than capped. A string literal of six
 * or more words is prose, and prose in a mechanics module is a finding unless
 * it is a declared entry in PROSE with a reason. That keeps the pressure in the
 * right place: a module may carry the few sentences it is required to own, and
 * cannot quietly grow a content store.
 *
 * WHAT IT CANNOT SEE. Direction, not separation. Prompt 1 asked for two layers
 * with no shared module; the shell loads both by design and always will, so
 * "no shared module" is not a property this build can have. One way dependency
 * is, and it is the half that carries the legal weight: mechanics stays
 * publishable as facts, interpretation stays ours.
 *
 * Usage: node tools/check-layer-boundary.js [--verbose] [--graph]
 * Exit 0 clean, 1 on a crossing, an unclassified module, or a walk it cannot
 * trust.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const appDir = path.join(repo, 'app');
const verbose = process.argv.indexOf('--verbose') !== -1;
const graph = process.argv.indexOf('--graph') !== -1;

/* ---------- the manifest ---------- */
/* Every app/*.js is classified here. An unclassified module is a FAILURE, not
   a default: the whole value of this gate is that a new module cannot arrive
   unlabelled and sit on the wrong side of the boundary without anybody saying
   so. */

const LAYERS = {
  mechanics: [
    'incommon-core.js',            /* the shared core both the app and the Node suites execute */
    'minor-bodies-ephemeris.js',   /* the ephemeris itself */
    'ephemeris-cache.js',      /* in memory memo, positions only, never persisted */
    'arc-solver.js',               /* bisects a longitude function the caller supplies */
    'birth-time.js',               /* known / unknown / unanswered, and the offset for the birth date */
    'hd-topology.js',            /* the wiring as facts: channel pairs, gate to centre */
    'hd-wheel.js',                 /* gate order and the boundary rule, as data */
    'hd-transit.js',               /* every body's gate and line at an instant the caller names */
    'hd-composite.js',             /* two bodygraphs overlaid, six states, no score */
    'hd-circle.js',                /* Circle and Ground: structure only, one caution, no seat */
    'gazetteer-us.js',             /* place coordinates */
    'gazetteer-world.js',          /* place coordinates */
  ],
  interpretation: [
    'hd-atlas.js',
    'hd-life.js',
    'hd-teachings.js',
    'placement-content.js',
    'numerology-content.js',
    'angel-numbers.js',
    'animal-symbolism.js',
    'dream-symbols.js',
    'astropedia.js',
    'tarot.js',
    'iching.js',
    'practice-library.js',
    'sabian-symbols.js',
    'sabian-symbols-data.js',
    'crisis-directory.js',
    'today-integration.js',        /* takes structured elements and writes the passage */
  ],
  shell: [
    'profile-manager.js', 'memory-store.js', 'people-library.js', 'pair-cache.js',
    'analytics.js', 'geocode-online.js', 'safety-router.js', 'evaluation-suite.js',
    'oki-api.js', 'oki-post-processor.js', 'oki-prompt-builder.js', 'oki-voice-v144.js',
    'sw.js',
  ],
  vendored: [
    'support.js',
    'react-18.3.1.production.min.js',
    'react-dom-18.3.1.production.min.js',
    /* The renderer behind the cover. Vendored for the same reason React above
       it is: the cover is the first screen a visitor meets, and a landing page
       that calls a CDN hands a third party an IP address before the reader has
       clicked anything. Both files were downloaded from the pinned
       three@0.184.0 URLs and checked against the SRI hashes the design shipped
       with before they were committed. three.module.js imports three.core.js by
       name, which is why the upstream filenames are kept. */
    'three.module.js',
    'three.core.js',
  ],
};

/* ---------- allowed crossings, each with its reason ---------- */

/* ---------- allowed crossings ----------
   EMPTY, AND THAT IS THE RESULT OF THE ATLAS SPLIT. Both entries that used to
   sit here were hd-composite and hd-circle reading hd-atlas for the channel
   table, which was mechanics reaching into an interpretation module because
   that module happened to hold the wiring as well as the writing. hd-topology.js
   holds the wiring now. Do not add an entry back without the reason, and prefer
   inverting the dependency to declaring it. */
const EDGES = [];

/* ---------- prose a mechanics module is allowed to own ---------- */

const PROSE = [
  { file: 'hd-circle.js', name: 'GROUP_CAUTION',
    why: 'Rendered beside every Ground, not behind a tap. Returned from the module for the same reason CONFIG_CAUTION is: it cannot drift between the two shells, and a screen that drops it fails G28 rather than shipping quietly. It is the ONLY sentence hd-circle owns.' },

  { file: 'hd-composite.js', name: 'CONFIG_CAUTION',
    why: 'Required beside every dominance and compromise row. Returned from the module so it cannot drift between the two shells; C11 to C15 assert it is present where it belongs and absent where it is not.' },
  { file: 'hd-composite.js', name: 'PRIVACY_NOTICE',
    why: 'Sits beside the switch that keeps a typed person, not in a policy nobody opens. Same drift argument as CONFIG_CAUTION.' },
  { file: 'hd-composite.js', name: 'consentNote',
    why: 'Says whether the reading is mutual or one sided. A card that dropped this line would be the app claiming an agreement on the reader behalf.' },
  { file: 'birth-time.js', name: 'availability',
    why: 'Names what a chart cannot compute when the birth time is unknown. CLAUDE.md: the assumption is returned, never hidden, and a wheel with no houses and no explanation reads as a chart that does not have any.' },
  { file: 'hd-composite.js', name: 'precision',
    why: 'Same class as availability(): says which of two birth times is missing and what that does to the gates below. The sentence has to come from the arithmetic that knows, or it goes stale against it.' },
  { file: 'incommon-core.js', name: 'deriveVisibility',
    why: 'Same class again: names the placements suppressed rather than guessed. This is the sentence beside the gap, and the gap is computed here.' },

];

/* ---------- module surface ---------- */

const EPHEMERIS_GLOBALS = ['MinorBodies', 'MinorBodiesEphemeris'];
/* A proxy for "calls no ephemeris": spherical trigonometry and Julian day
   arithmetic. An interpretation module has no business with either. */
const ORBITAL_MARKERS = [/\bMath\.atan2\s*\(/, /\bMath\.asin\s*\(/, /\bjulian/i, /\b2451545\b/, /\bobliquity\b/i];

const strip = src => src
  .replace(/\/\*[\s\S]*?\*\//g, c => ' '.repeat(c.length))
  .replace(/(^|[^:\\])\/\/[^\n]*/g, (c, p) => p + ' '.repeat(c.length - p.length));

function globalNameOf(src) {
  let m = /root\.([A-Za-z0-9_$]+)\s*=\s*factory/.exec(src);
  if (m) return m[1];
  m = /window\.([A-Za-z0-9_$]+)\s*=/.exec(src);
  if (m) return m[1];
  return null;
}

function stringLiterals(code) {
  const out = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g;
  let m;
  while ((m = re.exec(code))) {
    const text = m[1] != null ? m[1] : m[2];
    out.push({ text, index: m.index });
  }
  return out;
}

/* Is this literal a sentence, or a delimited data record that happens to have
   spaces in it? A plain word count says the gazetteers are 266 pages of prose,
   because "Little Rock,34.7465,-92.2896,202591|Fort Smith,..." counts as words.
   Three things separate writing from data, and all three have to hold:
   no record separator, real sentence punctuation, and enough lowercase function
   words that it reads as English rather than as Title Case place names. Five is
   the floor because four lets a diagnostic through, and a module saying
   "Gazetteer not present. Load gazetteer-us.js first." is not carrying content. */
function isProse(text) {
  if (text.indexOf('|') !== -1) return false;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  if (!/[.?!](\s|$)/.test(text)) return false;
  const fnWords = words.filter(w => /^[a-z]/.test(w) && /^[a-z]{2,}$/.test(w.replace(/[^A-Za-z]/g, ''))).length;
  return fnWords >= 5;
}

/* The nearest thing that named this literal, so a finding can be read against
   the PROSE list and so a reviewer is told WHICH constant grew. The window is
   trimmed to a line boundary first: starting it mid-identifier is how
   "dominance" gets reported as "inance". */
function ownerOf(code, index) {
  let win = code.slice(Math.max(0, index - 600), index);
  const nl = win.indexOf('\n');
  if (nl !== -1) win = win.slice(nl + 1);
  const names = [...win.matchAll(/([A-Za-z0-9_$]+)\s*[:=]/g)];
  if (names.length) return names[names.length - 1][1];
  const fn = /function\s+([A-Za-z0-9_$]+)\s*\(/.exec(win);
  return fn ? fn[1] : null;
}

/* The function the literal sits in. This is what PROSE matches on, because the
   nearest assignment is unstable across the branches of a ternary: the three
   birth-time sentences are one `note:` and report as `state`, `state` and `12`.
   A function name is what a reviewer would name anyway. */
function fnOf(code, index) {
  const before = code.slice(0, index);
  const all = [...before.matchAll(/function\s+([A-Za-z0-9_$]+)\s*\(/g)];
  return all.length ? all[all.length - 1][1] : null;
}

/* ---------- read every module ---------- */

const declared = new Map();
for (const layer of Object.keys(LAYERS)) {
  for (const f of LAYERS[layer]) {
    if (declared.has(f)) {
      console.error('check-layer-boundary: FAIL');
      console.error('  ' + f + ' is classified twice. A module has one layer.');
      process.exit(1);
    }
    declared.set(f, layer);
  }
}

for (const e of EDGES.concat(PROSE)) {
  if (!e.why || !e.why.trim()) {
    console.error('check-layer-boundary: FAIL');
    console.error('  an EDGES or PROSE entry carries no justification. Every exemption states its reason.');
    process.exit(1);
  }
  e.used = 0;
}

const onDisk = fs.readdirSync(appDir).filter(f => f.endsWith('.js')).sort();
const mods = new Map();
for (const f of onDisk) {
  const src = fs.readFileSync(path.join(appDir, f), 'utf8');
  mods.set(f, { file: f, layer: declared.get(f) || null, src, code: strip(src), global: globalNameOf(src) });
}

/* ---------- 1. the manifest is complete and current ---------- */

const unclassified = onDisk.filter(f => !declared.has(f));
const missing = [...declared.keys()].filter(f => onDisk.indexOf(f) === -1);

/* ---------- 2. the dependency graph ---------- */

const byGlobal = new Map();
for (const m of mods.values()) if (m.global && m.layer !== 'vendored') byGlobal.set(m.global, m);

const edges = [];
for (const m of mods.values()) {
  if (m.layer === 'vendored') continue;
  for (const [name, target] of byGlobal) {
    if (target.file === m.file) continue;
    const re = new RegExp('\\b' + name + '\\b', 'g');
    let hit = null, x;
    while ((x = re.exec(m.code))) {
      /* the module's own UMD export line names its own global, not a dep */
      const line = m.code.slice(m.code.lastIndexOf('\n', x.index) + 1, m.code.indexOf('\n', x.index));
      if (/factory\s*\(/.test(line) && /root\./.test(line)) continue;
      hit = { line: m.src.slice(0, x.index).split('\n').length, ctx: line.trim().slice(0, 110) };
      break;
    }
    if (hit) edges.push({ from: m.file, fromLayer: m.layer, to: target.file, toLayer: target.layer, via: name, ...hit });
  }
}

const crossings = [];
for (const e of edges) {
  if (e.fromLayer !== 'mechanics' || e.toLayer !== 'interpretation') continue;
  const ok = EDGES.find(a => a.from === e.from && a.to === e.to);
  if (ok) { ok.used++; e.allowed = true; } else crossings.push(e);
}

/* ---------- 3. only mechanics touch the ephemeris ---------- */

const ephemerisTouches = [];
for (const m of mods.values()) {
  if (m.layer !== 'interpretation') continue;
  for (const g of EPHEMERIS_GLOBALS) {
    const re = new RegExp('\\b' + g + '\\b');
    const x = re.exec(m.code);
    if (x) ephemerisTouches.push({ file: m.file, why: 'reads ' + g, line: m.src.slice(0, x.index).split('\n').length });
  }
  for (const marker of ORBITAL_MARKERS) {
    const x = marker.exec(m.code);
    if (x) ephemerisTouches.push({ file: m.file, why: 'computes positions (' + marker.source + ')', line: m.src.slice(0, x.index).split('\n').length });
  }
}

/* ---------- 4. prose in mechanics ---------- */

const proseFindings = [];
let literalsSeen = 0;
for (const m of mods.values()) {
  if (m.layer !== 'mechanics') continue;
  for (const lit of stringLiterals(m.code)) {
    literalsSeen++;
    if (!isProse(lit.text)) continue;
    const words = lit.text.trim().split(/\s+/).filter(Boolean);
    const owner = ownerOf(m.code, lit.index);
    const fn = fnOf(m.code, lit.index);
    const ok = PROSE.find(p => p.file === m.file && (p.name === fn || p.name === owner));
    if (ok) { ok.used++; continue; }
    proseFindings.push({
      file: m.file, line: m.src.slice(0, lit.index).split('\n').length,
      owner: (fn ? fn + '()' : owner || '(unnamed)'), words: words.length,
      text: lit.text.slice(0, 110) + (lit.text.length > 110 ? '...' : ''),
    });
  }
}

/* ---------- plausibility ---------- */
/* CLAUDE.md: confirm a green result examined a plausible number of things.
   Four ways this gate can be blind: it read no modules, it resolved no global
   names so no dependency can ever be found, it found no edges at all in a build
   that certainly has them, and it extracted no string literals so the prose
   check is measuring nothing. */

const blind = [];
if (mods.size < 30) blind.push('read only ' + mods.size + ' modules');
if (byGlobal.size < 20) blind.push('resolved only ' + byGlobal.size + ' exported globals, so most dependencies are invisible');
if (edges.length < 5) blind.push('found ' + edges.length + ' dependency edges in the whole build, which cannot be right');
if (literalsSeen < 100) blind.push('extracted ' + literalsSeen + ' string literals from the mechanics layer, so the prose check is measuring nothing');

if (blind.length) {
  console.error('check-layer-boundary: FAIL');
  console.error('  this gate is not looking at what it thinks it is:');
  blind.forEach(b => console.error('    ' + b));
  process.exit(1);
}

/* ---------- report ---------- */

const staleEdges = EDGES.filter(e => !e.used);
const staleProse = PROSE.filter(p => !p.used);
const counts = {};
for (const m of mods.values()) counts[m.layer || 'UNCLASSIFIED'] = (counts[m.layer || 'UNCLASSIFIED'] || 0) + 1;

const summary = {
  modules: mods.size,
  byLayer: counts,
  exportedGlobalsResolved: byGlobal.size,
  dependencyEdges: edges.length,
  mechanicsToInterpretation: edges.filter(e => e.fromLayer === 'mechanics' && e.toLayer === 'interpretation').length,
  unlistedCrossings: crossings.length,
  ephemerisOutsideMechanics: ephemerisTouches.length,
  mechanicsStringLiterals: literalsSeen,
  undeclaredProseInMechanics: proseFindings.length,
  unclassifiedModules: unclassified.length,
  manifestEntriesWithNoFile: missing.length,
  staleExemptions: staleEdges.length + staleProse.length,
};

if (graph) {
  console.log('dependency graph (' + edges.length + ' edges):');
  edges.slice().sort((a, b) => (a.fromLayer + a.from).localeCompare(b.fromLayer + b.from))
    .forEach(e => console.log('  [' + e.fromLayer.slice(0, 4) + '] ' + e.from + '  ->  [' + e.toLayer.slice(0, 4) + '] ' + e.to + '  via ' + e.via + ':' + e.line));
  console.log('');
}

const bad = unclassified.length || missing.length || crossings.length ||
  ephemerisTouches.length || proseFindings.length || staleEdges.length || staleProse.length;

if (bad) {
  console.error('check-layer-boundary: FAIL');
  console.error(JSON.stringify(summary, null, 2));

  if (unclassified.length) {
    console.error('\n  unclassified modules (' + unclassified.length + '):');
    unclassified.forEach(f => console.error('    app/' + f));
    console.error('    Add each to LAYERS. A module with no declared layer is a module on no side of the boundary.');
  }
  if (missing.length) {
    console.error('\n  manifest entries with no file (' + missing.length + '):');
    missing.forEach(f => console.error('    app/' + f));
  }
  if (crossings.length) {
    console.error('\n  mechanics reading interpretation (' + crossings.length + '):');
    crossings.forEach(e => console.error('    app/' + e.from + ':' + e.line + '  ->  ' + e.to + '  via ' + e.via + '\n      ' + e.ctx));
    console.error('    Either invert the dependency or add an EDGES entry with a reason.');
  }
  if (ephemerisTouches.length) {
    console.error('\n  interpretation touching the ephemeris (' + ephemerisTouches.length + '):');
    ephemerisTouches.forEach(e => console.error('    app/' + e.file + ':' + e.line + '  ' + e.why));
    console.error('    Interpretation is keyed by what mechanics returned. It does not compute.');
  }
  if (proseFindings.length) {
    console.error('\n  undeclared prose in mechanics (' + proseFindings.length + '):');
    proseFindings.forEach(p => console.error('    app/' + p.file + ':' + p.line + '  ' + p.owner + '  (' + p.words + ' words)\n      ' + p.text));
    console.error('    Move it to the interpretation layer, or declare it in PROSE with the reason it must live here.');
  }
  if (staleEdges.length || staleProse.length) {
    console.error('\n  exemptions that matched nothing (' + (staleEdges.length + staleProse.length) + '):');
    staleEdges.forEach(e => console.error('    edge ' + e.from + ' -> ' + e.to));
    staleProse.forEach(p => console.error('    prose ' + p.file + ' ' + p.name));
    console.error('    Remove them. A stale exemption is a rule nobody is reading any more.');
  }
  process.exit(1);
}

console.log('check-layer-boundary: ok');
console.log('  ' + mods.size + ' modules classified: ' +
  Object.keys(counts).map(k => counts[k] + ' ' + k).join(', '));
console.log('  ' + byGlobal.size + ' exported globals resolved, ' + edges.length + ' dependency edges read');
console.log('  ' + summary.mechanicsToInterpretation + ' mechanics to interpretation, all declared in EDGES with a reason');
console.log('  0 interpretation modules touch the ephemeris');
console.log('  ' + literalsSeen + ' string literals in mechanics; prose only where PROSE declares it');
if (verbose) {
  EDGES.forEach(e => console.log('    allowed edge: ' + e.from + ' -> ' + e.to + ' (x' + e.used + ')'));
  PROSE.forEach(p => console.log('    allowed prose: ' + p.file + ' ' + p.name + ' (x' + p.used + ')'));
}
