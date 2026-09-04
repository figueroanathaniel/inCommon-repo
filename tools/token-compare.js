#!/usr/bin/env node
/* Three-way token compare.
 *
 *   usage:  node tools/token-compare.js            (from the repo root)
 *
 * Tokens are declared in three places: the app root, [data-vt] (the vertical
 * shell), and the desktop shell. Only --bg, --sf, --sf2, --bd and --rad may
 * differ between them, plus --nav / --hdr / --dock which the desktop shell
 * does not declare at all. Everything else must match in all three.
 *
 * --mut, --crisis and --ac2-hi have each silently diverged before. Nothing in
 * the app reports it: a shell simply paints a slightly different colour and
 * no assertion is looking. Run this when adding or changing a token.
 *
 * Exits non-zero on any divergence outside the allowed set.
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'app', 'inCommonApp v2.dc.html');
const MAY_DIFFER = new Set([
  '--bg', '--sf', '--sf2', '--bd', '--rad',
  // the reading scale is a function of viewport, and CLAUDE.md says so:
  // --rdd is deliberately 13.5px on the phone roots, 15.5px on the desktop shell
  '--rd', '--rdlh', '--rd2', '--rdlh2', '--rdd', '--rddlh',
]);
const DESKTOP_OMITS = new Set(['--nav', '--hdr', '--dock']);

const src = fs.readFileSync(APP, 'utf8');

// A declaration site is a style attribute that sets --bg. Parse the whole
// attribute rather than a run of pairs: font values carry quotes and commas
// (--fd:'Marcellus',serif) and a pair-by-pair regex stops dead at the first
// one, which is how you end up comparing two thirds of a shell and calling it
// clean.
const sites = [];
for (const m of src.matchAll(/style="([^"]*--bg\s*:[^"]*)"/g)) {
  const decls = {};
  for (const part of m[1].split(';')) {
    const c = part.indexOf(':');
    if (c < 0) continue;
    const name = part.slice(0, c).trim();
    if (!name.startsWith('--')) continue;
    decls[name] = part.slice(c + 1).trim();
  }
  sites.push({ index: m.index, line: src.slice(0, m.index).split('\n').length, decls });
}

if (sites.length !== 3) {
  console.error(`expected 3 token declaration sites, found ${sites.length}`);
  console.error(sites.map(s => `  line ${s.line}: ${Object.keys(s.decls).length} tokens`).join('\n'));
  console.error('If a shell was added or removed, this tool needs updating with it.');
  process.exit(2);
}

const [root, vertical, desktop] = sites;
const label = ['app root', '[data-vt] vertical shell', 'desktop shell'];
sites.forEach((s, i) => console.log(`${label[i]}: line ${s.line}, ${Object.keys(s.decls).length} tokens`));
console.log();

const all = new Set(sites.flatMap(s => Object.keys(s.decls)));
let problems = 0;

for (const t of [...all].sort()) {
  const vals = sites.map(s => s.decls[t]);
  const present = sites.map(s => t in s.decls);

  if (DESKTOP_OMITS.has(t)) {
    if (present[2]) {
      console.log(`DECLARED   ${t} — the desktop shell is not supposed to declare this`);
      problems++;
    }
    continue;
  }

  const missing = present.map((p, i) => (p ? null : label[i])).filter(Boolean);
  if (missing.length) {
    console.log(`MISSING    ${t} — absent from ${missing.join(', ')}`);
    problems++;
    continue;
  }

  if (MAY_DIFFER.has(t)) continue;

  if (new Set(vals).size > 1) {
    console.log(`DIVERGED   ${t}`);
    vals.forEach((v, i) => console.log(`             ${label[i].padEnd(26)} ${v}`));
    problems++;
  }
}

console.log();
console.log(problems === 0
  ? `${all.size} tokens, all three sites agree where they must`
  : `${problems} problem${problems === 1 ? '' : 's'} across ${all.size} tokens`);
process.exit(problems ? 1 : 0);
