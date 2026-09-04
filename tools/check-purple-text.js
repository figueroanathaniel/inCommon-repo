#!/usr/bin/env node
/* check-purple-text.js: #8b5cf6 is never a text colour.
 *
 * THE RULE, from CLAUDE.md, "Colour rules that are not negotiable":
 *   #8b5cf6 (--ac2) measures about 4.2:1 on the app's own surfaces. It is for
 *   fills, borders, accent bars and chart glyphs. Never text, at any size.
 *   Purple text is #b79bff (--ac2-hi), which measures 7.93:1.
 *
 * WHY IT GREPS THE HEX AND THE TOKEN. The deep violet was once used as a text
 * colour in 46 places. A sweep for var(--ac2) afterwards reported "0
 * remaining", which was true about the token and told nobody anything: nine
 * sites had written the literal instead. So this checks both.
 *
 * WHY IT FOLLOWS THE DATA. Grepping `color:#8b5cf6` is not enough either.
 * This app hands colours out of the logic class as data and paints them
 * through a hole: `color:{{ r.edge }}`. Neither half looks wrong alone. So
 * for every violet assigned in the logic class this resolves:
 *
 *     which array is it part of  ->  which <sc-for> renders that array
 *     ->  does that loop paint the field as text  ->  is that site inside a
 *         [data-chart], which the rule allows
 *
 * The chart step matters. The natal wheel paints planet glyphs #8b5cf6
 * through exactly this path, and that is permitted: charts are the documented
 * exemption. A gate that cannot tell a wheel glyph from a card icon is a gate
 * that gets switched off.
 *
 * Usage: node tools/check-purple-text.js [--verbose]
 * Exit 0 clean, 1 on text use or on anything it cannot resolve.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
const verbose = process.argv.indexOf('--verbose') !== -1;

const DEEP = '#8b5cf6';
const TOKEN = 'var(--ac2)';
const SAFE = '#b79bff';
const NEEDLES = [DEEP, TOKEN];
const TEXT_PROPS = ['color', '-webkit-text-fill-color', 'caret-color',
  'text-decoration-color', 'text-emphasis-color'];

const src = fs.readFileSync(APP, 'utf8');
const lineAt = i => src.slice(0, i).split('\n').length;
const esc = s => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

const helmetEnd = src.indexOf('</helmet>');
const logicStart = src.indexOf('<script type="text/x-dc"');
if (helmetEnd === -1 || logicStart === -1 || logicStart < helmetEnd) {
  console.error('check-purple-text: file shape changed, cannot find the zones');
  process.exit(1);
}
const zone = src.slice(helmetEnd, logicStart);
const zoneOff = helmetEnd;

/* ---------- chart ranges, so the documented exemption can be applied ---------- */
/* Balance <div ... </div> from each data-chart opening. Charts in this build
   are div wrapped, and the harness makes the same call at runtime with
   closest('[data-chart]'). */
function chartRanges() {
  const out = [];
  const re = /data-chart\s*=/g;
  let m;
  while ((m = re.exec(zone))) {
    let start = zone.lastIndexOf('<div', m.index);
    if (start === -1) continue;
    let depth = 0, i = start;
    const tag = /<div\b|<\/div>/g;
    tag.lastIndex = start;
    let t;
    while ((t = tag.exec(zone))) {
      if (t[0] === '</div>') { depth--; if (depth === 0) { i = t.index + 6; break; } }
      else depth++;
    }
    out.push([start, i]);
  }
  return out;
}
const CHARTS = chartRanges();
const inChart = idx => CHARTS.some(([a, b]) => idx >= a && idx < b);

/* ---------- sc-for loops: array name -> [{alias, bodyStart, bodyEnd}] ---------- */
function loopsFor(arrayName) {
  const out = [];
  const re = new RegExp('<sc-for\\s+list="\\{\\{\\s*' + esc(arrayName) + '\\s*\\}\\}"\\s+as="([A-Za-z0-9_]+)"', 'g');
  let m;
  while ((m = re.exec(zone))) {
    const alias = m[1];
    let depth = 0, i = m.index, end = zone.length;
    const tag = /<sc-for\b|<\/sc-for>/g;
    tag.lastIndex = m.index;
    let t;
    while ((t = tag.exec(zone))) {
      if (t[0] === '</sc-for>') { depth--; if (depth === 0) { end = t.index; break; } }
      else depth++;
    }
    out.push({ alias, start: m.index, end });
  }
  return out;
}

/* ---------- walk every violet in the logic class ---------- */
/* Comments are blanked, offsets preserved. The build documents its own
   contrast arithmetic in comments ("#eef0f8 on #8b5cf6 measures 3.72:1"), and
   reading those as code invents fields like ".ink" and ".63". */
const rawLogic = src.slice(logicStart);
const logic = rawLogic
  .replace(/\/\*[\s\S]*?\*\//g, c => ' '.repeat(c.length))
  .replace(/(^|[^:])\/\/[^\n]*/g, (c, p) => p + ' '.repeat(c.length - p.length));
const failures = [];
const exempt = [];
const unresolved = [];
let logicHits = 0;

for (const needle of NEEDLES) {
  let i = -1;
  while ((i = logic.indexOf(needle, i + 1)) !== -1) {
    logicHits++;
    const abs = logicStart + i;
    const near = logic.slice(Math.max(0, i - 200), i);

    /* field name this value is assigned to */
    const fm = /([A-Za-z0-9_]+)\s*:\s*[^,;{}]*$/.exec(near);
    const field = fm ? fm[1] : null;

    /* Nearest enclosing renderVals property that opens an array or an IIFE.
       This has to look back over the whole logic class, not a fixed window:
       the array that owns a value can be declared hundreds of lines above it,
       and a short window silently reports every one of them unresolved. */
    /* Candidates, nearest last. The innermost one is often a nested helper
       (`meta: (() => ...)`) that nothing renders directly, so walk outwards
       to the nearest owner the template actually loops over. Without this,
       a real violation is reported as "unresolved" and reads like gate noise
       rather than the finding it is. */
    const cands = [...logic.slice(0, i).matchAll(/\n\s{4,}([A-Za-z0-9_]+)\s*:\s*(?:\[|\(\(\)|\(function|\(\s*\()/g)]
      .map(m => m[1]);
    let array = null;
    for (let k = cands.length - 1; k >= 0 && k >= cands.length - 8; k--) {
      if (loopsFor(cands[k]).length) { array = cands[k]; break; }
    }
    if (!array) array = cands.length ? cands[cands.length - 1] : null;

    const ctx = logic.slice(Math.max(0, i - 90), i + 40).replace(/\s+/g, ' ').trim();

    if (!field) { continue; } /* not an assignment: a comment or a bare value */

    if (!array) {
      unresolved.push({ line: lineAt(abs), field, ctx, why: 'could not resolve the array this belongs to' });
      continue;
    }

    const loops = loopsFor(array);
    if (!loops.length) {
      unresolved.push({ line: lineAt(abs), field, array, ctx, why: 'no <sc-for> renders ' + array });
      continue;
    }

    for (const lp of loops) {
      const body = zone.slice(lp.start, lp.end);
      const tre = new RegExp('(' + TEXT_PROPS.map(esc).join('|') + ')\\s*:\\s*\\{\\{\\s*' +
        esc(lp.alias) + '\\.' + esc(field) + '\\s*\\}\\}', 'g');
      let t;
      while ((t = tre.exec(body))) {
        const siteAbs = zoneOff + lp.start + t.index;
        const rec = { logicLine: lineAt(abs), field, array, siteLine: lineAt(siteAbs), ctx };
        if (inChart(lp.start + t.index)) exempt.push(rec);
        else failures.push(rec);
      }
    }
  }
}

/* ---------- direct literal text use, anywhere ---------- */
for (const prop of TEXT_PROPS) {
  for (const needle of NEEDLES) {
    const re = new RegExp(esc(prop) + '\\s*:\\s*' + esc(needle), 'gi');
    let m;
    while ((m = re.exec(src))) {
      failures.push({ direct: true, siteLine: lineAt(m.index), field: prop, array: '(literal)',
        ctx: src.slice(Math.max(0, m.index - 60), m.index + 50).replace(/\s+/g, ' ').trim() });
    }
  }
}

/* ---------- plausibility ---------- */
const totalSeen = NEEDLES.reduce((n, x) => n + src.split(x).length - 1, 0);
if (totalSeen === 0 || CHARTS.length === 0) {
  console.error('check-purple-text: FAIL');
  console.error('  violet occurrences: ' + totalSeen + ', chart regions found: ' + CHARTS.length);
  console.error('  both should be non-zero in this build. This gate is not looking at what it thinks it is.');
  process.exit(1);
}

const summary = {
  violetOccurrences: totalSeen,
  inLogicClass: logicHits,
  chartRegions: CHARTS.length,
  paintedAsTextOutsideCharts: failures.length,
  paintedAsTextInsideCharts_allowed: exempt.length,
  unresolved: unresolved.length,
  safePurpleUses: src.split(SAFE).length - 1
};

if (failures.length || unresolved.length) {
  console.error('check-purple-text: FAIL');
  console.error(JSON.stringify(summary, null, 2));
  if (failures.length) {
    console.error('\n  ' + DEEP + ' painting text OUTSIDE a chart (' + failures.length + '):');
    failures.forEach(f => console.error(
      '    template line ' + f.siteLine + '  <-  ' + f.array + '.' + f.field +
      (f.direct ? '' : ' assigned at logic line ' + f.logicLine) + '\n      ' + f.ctx));
  }
  if (unresolved.length) {
    console.error('\n  could not resolve (' + unresolved.length + '), read each one:');
    unresolved.forEach(u => console.error('    line ' + u.line + '  .' + u.field + '  ' + u.why + '\n      ' + u.ctx));
  }
  console.error('\n  purple that carries glyphs must be ' + SAFE + '. Charts are the only exemption.');
  process.exit(1);
}

console.log('check-purple-text: ok');
console.log('  ' + totalSeen + ' violet occurrences examined, ' + logicHits + ' of them in the logic class');
console.log('  ' + CHARTS.length + ' chart regions resolved; ' + exempt.length +
            ' violet text sites inside them (allowed: chart glyphs)');
console.log('  0 violet text sites outside charts');
console.log('  ' + SAFE + ' used ' + summary.safePurpleUses + ' times');
if (verbose) exempt.forEach(e => console.log('    allowed: ' + e.array + '.' + e.field + ' at template line ' + e.siteLine));
