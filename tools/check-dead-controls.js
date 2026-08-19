#!/usr/bin/env node
/* check-dead-controls.js: every control that looks clickable does something.
 *
 * THE FAILURE THIS CATCHES. The template paints handlers through holes:
 * onClick="{{ formClose }}". The logic class supplies formClose from a
 * renderVals branch. Neither half is wrong on its own, and if the key is
 * misspelled, renamed, or lives in a branch that this screen never reaches,
 * the button still renders, still highlights on hover, still takes a press,
 * and does nothing at all. That is the worst kind of defect in an app someone
 * is asked to trust with their birth data: it does not look broken.
 *
 * WHAT IT CHECKS
 *   1. every onClick / onKeyDown / onChange hole in the template zone names a
 *      key that the logic class actually produces
 *   2. every <sc-for> alias field used as a handler is produced on the rows of
 *      the array it loops (g.go, c.go, and so on)
 *   3. no control renders a handler hole that is only ever set to a constant
 *   4. every dialog sits at the same structural level in both shells
 *   5. no control opens a dialog that cannot render from where the control is
 *
 * WHAT IT CANNOT CHECK. Whether the handler does the right thing. That is what
 * the runtime walk is for. This only proves nothing is wired to nothing.
 *
 * Usage: node tools/check-dead-controls.js [--verbose]
 * Exit 0 clean, 1 if any control is wired to nothing.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const APP = path.join(repo, 'app', 'inCommonApp v2.dc.html');
const verbose = process.argv.indexOf('--verbose') !== -1;

const src = fs.readFileSync(APP, 'utf8');
const lineAt = i => src.slice(0, i).split('\n').length;

const helmetEnd = src.indexOf('</helmet>');
const logicStart = src.indexOf('<script type="text/x-dc"');
if (helmetEnd === -1 || logicStart === -1 || logicStart < helmetEnd) {
  console.error('check-dead-controls: file shape changed, cannot find the zones');
  process.exit(1);
}
const zone = src.slice(helmetEnd, logicStart);
const zoneOff = helmetEnd;

/* Comments blanked, offsets preserved, so prose about a handler is not read as
   a definition of one. */
const logic = src.slice(logicStart)
  .replace(/\/\*[\s\S]*?\*\//g, c => ' '.repeat(c.length))
  .replace(/(^|[^:])\/\/[^\n]*/g, (c, p) => p + ' '.repeat(c.length - p.length));

const EVENTS = ['onClick', 'onKeyDown', 'onChange', 'onInput', 'onSubmit',
  'onMouseDown', 'onTouchStart', 'onFocus', 'onBlur'];

/* ---------- which keys does the logic class produce? ---------- */
/* A key counts as produced if it appears as an object property anywhere in the
   logic class: `foo: () => ...`, `foo,` shorthand, or spread into a literal.
   Deliberately generous. The point is to find keys produced NOWHERE, which is
   an unambiguous defect, not to police where they come from. */
const produced = new Set();
for (const m of logic.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) produced.add(m[1]);
for (const m of logic.matchAll(/\b([A-Za-z_$][\w$]*)\s*[,}]/g)) produced.add(m[1]);
for (const m of logic.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) produced.add(m[1]);

/* ---------- sc-for scopes, so alias fields resolve to their array ---------- */
function loops() {
  const out = [];
  const re = /<sc-for\s+list="\{\{\s*([A-Za-z0-9_.]+)\s*\}\}"\s+as="([A-Za-z0-9_]+)"/g;
  let m;
  while ((m = re.exec(zone))) {
    let depth = 0;
    const tag = /<sc-for\b|<\/sc-for>/g;
    tag.lastIndex = m.index;
    let t, end = zone.length;
    while ((t = tag.exec(zone))) {
      if (t[0] === '</sc-for>') { depth--; if (depth === 0) { end = t.index; break; } }
      else depth++;
    }
    out.push({ list: m[1], alias: m[2], start: m.index, end });
  }
  return out;
}
const LOOPS = loops();
const aliasAt = idx => {
  /* innermost loop containing this offset */
  let best = null;
  for (const l of LOOPS) if (idx >= l.start && idx < l.end) {
    if (!best || l.start > best.start) best = l;
  }
  return best;
};

const dead = [];
const constant = [];
let checked = 0;

for (const ev of EVENTS) {
  const re = new RegExp(ev + '="\\{\\{\\s*([A-Za-z0-9_.]+)\\s*\\}\\}"', 'g');
  let m;
  while ((m = re.exec(zone))) {
    checked++;
    const expr = m[1];
    const abs = zoneOff + m.index;
    const head = expr.split('.')[0];
    const tail = expr.split('.').slice(1).join('.');

    const lp = aliasAt(m.index);
    if (lp && head === lp.alias) {
      /* g.go inside <sc-for list="{{ geoHits }}" as="g"> : the field must be
         produced on the rows of geoHits, so just check the field name exists
         as a property somewhere in the logic class. */
      if (!tail) { dead.push({ line: lineAt(abs), ev, expr, why: 'loop alias used as a handler with no field' }); continue; }
      if (!produced.has(tail.split('.')[0])) {
        dead.push({ line: lineAt(abs), ev, expr, why: 'no row of ' + lp.list + ' is given a "' + tail + '"' });
      }
      continue;
    }

    /* A dotted expression outside a loop, like lexCard.seeGo, is a field on an
       object the logic class builds. The handler is the field, so that is what
       has to exist. Testing the object instead reported every one of them
       broken while all six worked. */
    const wanted = tail ? tail.split('.').pop() : head;
    if (!produced.has(wanted)) {
      dead.push({ line: lineAt(abs), ev, expr, why: 'the logic class never produces "' + wanted + '"' });
      continue;
    }

    /* Produced, but is it ever anything other than a literal? A handler set to
       a string or a boolean renders a control that swallows the press.

       Every assignment is examined, and the key is cleared as soon as one of
       them is not a literal. Matching "callable" shapes directly does not work:
       handlers here are routinely built by a factory, `hpPrev: go(i - 1)`,
       which is a call expression and perfectly callable. Asking what a value is
       NOT is the answerable question. */
    const asg = [...logic.matchAll(new RegExp('\\b' + wanted + '\\s*:\\s*([^,;}\\n]+)', 'g'))];
    const shorthand = new RegExp('[,{(]\\s*' + wanted + '\\s*[,})]').test(logic);
    if (!shorthand && asg.length) {
      const allLiteral = asg.every(a => /^\s*(['"`]|\d|true\b|false\b|null\b|undefined\b)/.test(a[1]));
      if (allLiteral) {
        constant.push({ line: lineAt(abs), ev, expr,
          why: '"' + wanted + '" is only ever a literal (' + asg[0][1].trim().slice(0, 40) + ')' });
      }
    }
  }
}

/* ---------- can the panel a control opens actually render there? ----------
 *
 * THE SECOND FAILURE, AND WHY EVERYTHING ABOVE IS BLIND TO IT. The passes above
 * prove a handler is wired. They say nothing about whether the panel that
 * handler opens can render from where the handler was pressed.
 *
 * On Today, the "Gate N" and "Personal Day N" buttons set dpSel and rendered
 * nothing at all. The handler was wired, the state was set, the sc-if was
 * correct: the drawer lived inside isSpirit and the button lived inside
 * isToday, so a reader on Today pressed a live control and the app did nothing.
 * It worked on mobile, where the same drawer sat at shell level, which is what
 * kept it hidden. Three sibling links papered over the same hole by forcing tab
 * to spirit first, relocating the reader to My Charts to answer a question they
 * had asked on Today.
 *
 * Two structural questions, then.
 *
 *   A. SHELL DIVERGENCE. A dialog must sit at the same level in both shells.
 *      One codebase, one breakpoint: a sheet that is shell level below 820px
 *      and screen nested above it means the shells have forked, and one side is
 *      going to strand a control. This is the check that catches the cause.
 *
 *   B. TRIGGER REACH. A dialog nested inside a screen can only be opened from
 *      inside that screen. A handler that opens it while rendering under a
 *      different screen is a button pressed into nothing. This catches the
 *      symptom directly, for the day a divergence is deliberate.
 */
const zoneLines = zone.split('\n');
const zoneLineOff = [];
{
  let off = 0;
  for (const L of zoneLines) { zoneLineOff.push(off); off += L.length + 1; }
}

/* Depth 0 is the shell, depth 1 is ready, depth 2 is the screen.

   A panel's own condition is filtered out of its chain first. The vertical
   shell wraps a sheet in an outer sc-if on the same condition, one for the
   sheet chrome and one for the dialog, so the innermost block sits a level
   deeper than its desktop twin and would otherwise be read as living inside a
   screen called dpOpen. */
const screenOf = (p, self) => {
  const q = p.filter(c => c !== 'ready' && c !== self);
  return q.length > 1 ? q[1] : null;
};
const shellOf = p => p[0] === 'shellVertical' ? 'vertical'
  : p[0] === 'shellDesktop' ? 'desktop' : null;

const panels = [], triggers = [];
{
  const stack = [];
  const claimed = new Set();
  const evRe = new RegExp('(?:' + EVENTS.join('|') + ')="\\{\\{\\s*([A-Za-z0-9_.]+)\\s*\\}\\}"', 'g');
  const openRe = /<sc-(?:if|for)\b/g;
  const closeRe = /<\/sc-(?:if|for)>/g;
  const condRe = /<sc-(?:if|for)\b[^>]*?(?:value|list)="\{\{\s*([A-Za-z0-9_.]+)\s*\}\}"/;

  for (let i = 0; i < zoneLines.length; i++) {
    const L = zoneLines[i];

    evRe.lastIndex = 0;
    let h;
    while ((h = evRe.exec(L))) {
      triggers.push({ expr: h[1], path: stack.map(x => x.cond),
        line: lineAt(zoneOff + zoneLineOff[i]) });
    }

    /* A dialog belongs to the INNERMOST sc-if enclosing it, and to nothing
       else. Crediting every block that merely contains one somewhere inside
       also credits the screen wrappers, which inflates the count and reports a
       divergence about isSpirit rather than about the sheet inside it. */
    if (L.indexOf('role="dialog"') !== -1 && stack.length) {
      const top = stack[stack.length - 1];
      if (!claimed.has(top)) {
        claimed.add(top);
        panels.push({ cond: top.cond, path: top.path,
          line: lineAt(zoneOff + zoneLineOff[top.at]) });
      }
    }

    openRe.lastIndex = 0;
    let o;
    while ((o = openRe.exec(L))) {
      const m = condRe.exec(L.slice(o.index));
      stack.push({ cond: m ? m[1] : '?', at: i, path: stack.map(x => x.cond) });
    }
    closeRe.lastIndex = 0;
    while (closeRe.exec(L)) stack.pop();
  }
}

const diverged = [], stranded = [];

/* A. the same dialog at two different levels */
const byCond = {};
for (const p of panels) {
  const sh = shellOf(p.path);
  if (!sh) continue;
  (byCond[p.cond] = byCond[p.cond] || {})[sh] = screenOf(p.path, p.cond);
}
for (const c of Object.keys(byCond)) {
  const v = byCond[c];
  if (!('vertical' in v) || !('desktop' in v)) continue;
  const lv = v.vertical === null ? 'shell level' : 'inside ' + v.vertical;
  const ld = v.desktop === null ? 'shell level' : 'inside ' + v.desktop;
  if (lv !== ld) diverged.push({ cond: c, vertical: lv, desktop: ld });
}

/* B. a screen nested dialog, opened from somewhere it cannot reach */
for (const p of panels) {
  const sc = screenOf(p.path, p.cond), sh = shellOf(p.path);
  if (!sc || !sh) continue;
  for (const t of triggers) {
    if (shellOf(t.path) !== sh) continue;
    const tsc = screenOf(t.path, null);
    if (tsc === sc) continue;
    /* Does this handler open that panel? A vals key whose definition names the
       panel's own condition, or the state key behind it, is opening it. */
    const key = t.expr.split('.').pop();
    const def = new RegExp('\\b' + key + '\\s*:\\s*([^,;\\n]*)').exec(logic);
    if (!def) continue;
    if (new RegExp('\\b' + p.cond + '\\b').test(def[1])) {
      stranded.push({ trigger: t.expr, triggerLine: t.line,
        triggerScreen: tsc || 'shell level', panel: p.cond, panelScreen: sc, shell: sh });
    }
  }
}

/* This pass is only worth trusting if it looked at a plausible number of
   things. A tokeniser that silently stops matching reports a clean build. */
if (panels.length < 20 || triggers.length < 100) {
  console.error('check-dead-controls: FAIL');
  console.error('  dialogs seen ' + panels.length + ', handler holes seen ' + triggers.length);
  console.error('  both should be large in this build. The reachability pass is not parsing what it thinks it is.');
  process.exit(1);
}

/* ---------- plausibility, so a broken parse cannot read as a pass ---------- */
if (checked < 100 || LOOPS.length < 20 || produced.size < 200) {
  console.error('check-dead-controls: FAIL');
  console.error('  handlers seen ' + checked + ', loops ' + LOOPS.length + ', keys produced ' + produced.size);
  console.error('  all three should be large in this build. This gate is not looking at what it thinks it is.');
  process.exit(1);
}

const summary = { handlersChecked: checked, scForLoops: LOOPS.length,
  keysProduced: produced.size, wiredToNothing: dead.length, notCallable: constant.length,
  dialogsFound: panels.length, shellsDiverged: diverged.length, strandedTriggers: stranded.length };

if (dead.length || constant.length || diverged.length || stranded.length) {
  console.error('check-dead-controls: FAIL');
  console.error(JSON.stringify(summary, null, 2));
  if (diverged.length) {
    console.error('');
    console.error('  the same dialog sits at different levels in the two shells (' + diverged.length + '):');
    diverged.forEach(d => {
      console.error('    ' + d.cond + '   vertical: ' + d.vertical + '   |   desktop: ' + d.desktop);
      console.error('      One codebase, one breakpoint. Put it at the same level in both,');
      console.error('      or a control on one side opens nothing at all.');
    });
  }
  if (stranded.length) {
    console.error('');
    console.error('  a control opens a dialog that cannot render where the control is (' + stranded.length + '):');
    stranded.forEach(x => {
      console.error('    ' + x.shell + ' shell, line ' + x.triggerLine + '   ' + x.trigger);
      console.error('      pressed inside ' + x.triggerScreen + ', opens ' + x.panel +
                    ', which only renders inside ' + x.panelScreen);
    });
  }
  [['wired to nothing', dead], ['never callable', constant]].forEach(([title, list]) => {
    if (!list.length) return;
    console.error('\n  ' + title + ' (' + list.length + '):');
    list.forEach(d => console.error('    line ' + d.line + '  ' + d.ev + '="{{ ' + d.expr + ' }}"\n      ' + d.why));
  });
  process.exit(1);
}

console.log('check-dead-controls: ok');
console.log('  ' + checked + ' handler holes across ' + LOOPS.length + ' loops, every one of them wired');
console.log('  ' + panels.length + ' dialogs, level-matched across both shells, each reachable from every control that opens it');
if (verbose) console.log('  ' + produced.size + ' keys produced by the logic class');
