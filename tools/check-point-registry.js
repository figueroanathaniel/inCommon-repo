#!/usr/bin/env node
/* check-point-registry.js: the gate for ephemeris/pointRegistry.ts.
 *
 * WHY THIS DOES NOT JUST CALL validateRegistry(). The registry module
 * exports its own validateRegistry(), and calling it here would ask the
 * registry whether it agrees with itself: a bug in the checks would pass
 * every row it was never written to catch. Y4 in run-module-tests.js holds
 * the same line for the Human Design channel table, and the reason is the
 * same reason: the row that finds a real defect is the one built from an
 * independent copy of the rule, not from calling the thing under test.
 * This file re-derives every assertion (unique ids, non-empty tooltip and
 * reference within 120 chars, a category from the declared union, no two
 * points sharing a glyph) from the raw arrays.
 *
 * WHY A GLYPH COLLISION IS ITS OWN CHECK, not folded into "non-empty
 * glyph". Two points sharing a glyph passed silently once already: the
 * Hamburg School hypothetical Cupido and the unrelated MPC asteroid
 * Cupido both wanted 'Cup', and nothing before this file would have
 * noticed, because both glyphs were individually present and individually
 * short. The failure is a relationship between two rows, not a property
 * of either row alone.
 *
 * Node's native TypeScript support (stable since Node 23.6, this repo
 * runs Node 24) strips the type-only syntax this file uses, so it is
 * required exactly the way every other tools/*.js script requires a
 * plain .js module: same call, no build step, no separate transform to
 * keep in sync with the source it is checking.
 *
 * Usage: node tools/check-point-registry.js
 */
'use strict';

const path = require('path');

const repo = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(repo, 'app', 'ephemeris', 'pointRegistry.ts');

function die(m) { console.error('check-point-registry: ' + m); process.exit(1); }

let R;
try {
  R = require(REGISTRY_PATH);
} catch (e) {
  die('pointRegistry.ts does not compile: ' + e.message);
}

const VALID_CATEGORIES = new Set([
  'angle', 'body', 'node', 'asteroid', 'centaur', 'tno', 'comet', 'hypothetical', 'derived'
]);

const basic = R.basicPoints();
const expanded = R.expandedPoints();
const all = R.allPoints();

const errors = [];

if (!Array.isArray(basic) || basic.length === 0) errors.push('basicPoints() returned no points');
if (!Array.isArray(expanded) || expanded.length === 0) errors.push('expandedPoints() returned no points');
if (all.length !== basic.length + expanded.length) {
  errors.push('allPoints() (' + all.length + ') is not basic (' + basic.length + ') + expanded (' + expanded.length + ')');
}

const seenIds = new Set();
const byGlyph = new Map();

for (const p of all) {
  const where = p.id || '(no id)';

  if (!p.id) errors.push(where + ': missing id');
  else if (seenIds.has(p.id)) errors.push('duplicate id: ' + p.id);
  seenIds.add(p.id);

  if (!p.tooltip) errors.push(where + ': empty tooltip');
  else if (p.tooltip.length > 120) errors.push(where + ': tooltip exceeds 120 chars (' + p.tooltip.length + ')');

  if (!p.reference) errors.push(where + ': empty reference');
  else if (p.reference.length > 120) errors.push(where + ': reference exceeds 120 chars (' + p.reference.length + ')');

  if (!p.category || !VALID_CATEGORIES.has(p.category)) {
    errors.push(where + ": category '" + p.category + "' is not in the declared union");
  }

  if (!p.glyph) {
    errors.push(where + ': empty glyph');
  } else {
    const ids = byGlyph.get(p.glyph) || [];
    ids.push(p.id);
    byGlyph.set(p.glyph, ids);
  }
}

for (const [glyph, ids] of byGlyph) {
  if (ids.length > 1) errors.push("glyph '" + glyph + "' shared by: " + ids.join(', '));
}

/* SYMBOLISM must name the same points the registry does: reused in
   tooltips and the expanded panels, so a point missing here is a point
   whose panel silently shows nothing where symbolism should be. */
if (!R.SYMBOLISM || typeof R.SYMBOLISM !== 'object') {
  errors.push('SYMBOLISM export is missing');
} else {
  for (const p of all) {
    const entry = R.SYMBOLISM[p.id];
    if (!entry) { errors.push('SYMBOLISM missing entry for ' + p.id); continue; }
    if (!entry.symbolism) errors.push('SYMBOLISM.' + p.id + ': empty symbolism');
    if (!entry.reference) errors.push('SYMBOLISM.' + p.id + ': empty reference');
  }
  const extra = Object.keys(R.SYMBOLISM).filter(id => !seenIds.has(id));
  if (extra.length) errors.push('SYMBOLISM has entries for unknown ids: ' + extra.join(', '));
}

if (errors.length) {
  console.error('check-point-registry: ' + errors.length + ' problem(s)');
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}

console.log('check-point-registry: ok');
console.log('  basic points        ' + basic.length);
console.log('  expanded points     ' + expanded.length);
console.log('  total points        ' + all.length);
console.log('  unique glyphs       ' + byGlyph.size);
console.log('  SYMBOLISM coverage  ' + Object.keys(R.SYMBOLISM).length + ' of ' + all.length);
