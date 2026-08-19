#!/usr/bin/env node
/* check-template-hexes.js: no literal colours in the template zone.
 *
 * THE RULE, from CLAUDE.md, "The theme boundary":
 *   the ONLY hexes allowed between </helmet> and the logic class are
 *   #2fff8f, #8b5cf6, #e5534d, #000, #fff, and the three token-declaration
 *   roots themselves. Everything else must be a token.
 *
 * WHY. A theme is a set of token deltas. A literal hex written into a style
 * attribute cannot be overridden by a delta, so it stays midnight coloured
 * under dawn and gold. The first theme pass shipped with 186 such literals
 * still in the markup, and every surface they painted silently ignored two of
 * the three identities. Nothing about that is visible in a screenshot of the
 * default theme, which is the whole problem.
 *
 * The three token-declaration roots are exempt because they are where the
 * literal midnight values are supposed to live: they are what paints the app
 * from the first streamed character, before any theme override is appended.
 * A root is recognised by its style attribute declaring --bg, and there must
 * be exactly three. A fourth would mean a new root nobody told the harness
 * about, so that is a failure too.
 *
 * Usage: node tools/check-template-hexes.js [--verbose]
 * Exit 0 clean, 1 on any disallowed literal.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
const verbose = process.argv.indexOf('--verbose') !== -1;

const ALLOWED = ['#2fff8f', '#8b5cf6', '#e5534d', '#000', '#fff'];

const src = fs.readFileSync(APP, 'utf8');

/* ---- the zone ---- */
const helmetEnd = src.indexOf('</helmet>');
if (helmetEnd === -1) { console.error('check-template-hexes: no </helmet> found'); process.exit(1); }
const logicStart = src.indexOf('<script type="text/x-dc"');
if (logicStart === -1) { console.error('check-template-hexes: no logic class script found'); process.exit(1); }
if (logicStart < helmetEnd) { console.error('check-template-hexes: logic class before </helmet>, file shape changed'); process.exit(1); }

const zoneStart = helmetEnd + '</helmet>'.length;
let zone = src.slice(zoneStart, logicStart);

/* Line numbers in the real file, for anything reported. */
const lineOfIndex = idx => src.slice(0, zoneStart + idx).split('\n').length;

/* ---- exempt the three token-declaration roots ----
   Identified by the style attribute declaring --bg. Blanked rather than cut,
   so every reported offset still maps to the right line. */
const roots = [];
zone = zone.replace(/style="([^"]*)"/g, (whole, body, offset) => {
  if (body.indexOf('--bg:') === -1) return whole;
  roots.push({ line: lineOfIndex(offset), tokens: (body.match(/--[a-z0-9-]+\s*:/g) || []).length });
  return 'style="' + ' '.repeat(body.length) + '"';
});

if (roots.length !== 3) {
  console.error('check-template-hexes: FAIL');
  console.error('  expected exactly 3 token-declaration roots in the template zone, found ' + roots.length);
  roots.forEach(r => console.error('    line ' + r.line + ', ' + r.tokens + ' tokens'));
  console.error('  a new root has to be added to the three-way compare before this gate can pass');
  process.exit(1);
}

/* ---- scan ---- */
const found = [];
const re = /#[0-9a-fA-F]{3,8}\b/g;
let m;
while ((m = re.exec(zone))) {
  const hex = m[0].toLowerCase();
  if (ALLOWED.indexOf(hex) !== -1) continue;
  const line = lineOfIndex(m.index);
  const ctxStart = Math.max(0, m.index - 60);
  found.push({ hex: m[0], line, context: zone.slice(ctxStart, m.index + 40).replace(/\s+/g, ' ').trim() });
}

/* ---- census, so a green result is believable ---- */
const scanned = (zone.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
const allowedCount = scanned - found.length;

const summary = {
  zoneLines: zone.split('\n').length,
  tokenRoots: roots.map(r => 'line ' + r.line + ' (' + r.tokens + ' tokens)'),
  hexesSeenInZone: scanned,
  allowedLiterals: allowedCount,
  disallowed: found.length
};

if (found.length) {
  console.error('check-template-hexes: FAIL');
  console.error(JSON.stringify(summary, null, 2));
  const byHex = {};
  found.forEach(f => { (byHex[f.hex.toLowerCase()] = byHex[f.hex.toLowerCase()] || []).push(f.line); });
  console.error('\n  disallowed literals, by value:');
  Object.keys(byHex).sort().forEach(h => {
    console.error('    ' + h + '  x' + byHex[h].length + '  lines ' + byHex[h].slice(0, 12).join(', ') +
      (byHex[h].length > 12 ? ' ...' : ''));
  });
  if (verbose) {
    console.error('\n  with context:');
    found.slice(0, 40).forEach(f => console.error('    ' + f.line + ': ' + f.context));
  }
  console.error('\n  each of these must become a token, or the surface it paints will stay');
  console.error('  midnight under dawn and gold.');
  process.exit(1);
}

console.log('check-template-hexes: ok');
console.log('  zone: ' + summary.zoneLines + ' lines between </helmet> and the logic class');
console.log('  token roots: ' + summary.tokenRoots.join(', '));
console.log('  hexes examined: ' + scanned + ', all of them on the allowlist (' + ALLOWED.join(' ') + ')');
