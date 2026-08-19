#!/usr/bin/env node
/* build-bundle.js: produce deploy/index.html from app/.
 *
 * WHAT THIS IS NOT. The index.html that shipped from the design environment was
 * made by a different tool: it boots an unpacking loader and stores its assets
 * compressed and UUID mapped, which is why the briefing warns that the bundle
 * cannot be grepped. That tool does not exist here and this script does not
 * imitate it. This produces a plainly inlined single file instead: every script
 * that the app loads by src becomes a script block with the same contents, in
 * the same order. The output is larger and completely readable, which for a
 * file people are asked to trust with their journals is the better trade.
 *
 * WHAT IT DOES, in order:
 *   1. reads app/inCommonApp v2.dc.html
 *   2. inlines React and ReactDOM ahead of support.js, because support.js
 *      short circuits on window.React and window.ReactDOM and only reaches for
 *      the CDN when they are absent
 *   3. inlines support.js
 *   4. inlines the module scripts in the order the helmet declares them
 *   5. adds lang="en" to the html tag
 *   6. writes deploy/index.html
 *
 * It refuses to write a partial bundle. If a module is missing, if the count is
 * wrong, or if any local script src survives into the output, it fails loudly
 * rather than shipping a file that boots most of an app.
 *
 * Usage:  node tools/build-bundle.js [--out <path>] [--check]
 *         --check writes nothing and reports what would be produced.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const appDir = path.join(repo, 'app');
const srcPath = path.join(appDir, 'inCommonApp v2.dc.html');

const outFlag = process.argv.indexOf('--out');
const outPath = outFlag !== -1 && process.argv[outFlag + 1]
  ? path.resolve(process.argv[outFlag + 1])
  : path.join(repo, 'deploy', 'index.html');
const checkOnly = process.argv.indexOf('--check') !== -1;

/* The modules, in the order the helmet loads them. Several read globals set
   by earlier ones, so this order is part of the contract, not a preference. */
const MODULES = [
  'incommon-core.js',
  'practice-library.js',
  'profile-manager.js',
  'sabian-symbols.js',
  'sabian-symbols-data.js',
  'minor-bodies-ephemeris.js',
  'placement-content.js',
  'numerology-content.js',
  'today-integration.js',
  'angel-numbers.js',
  'hd-atlas.js',
  'astropedia.js',
  'tarot.js',
  'crisis-directory.js',
  'hd-life.js',
  'hd-teachings.js',
  'gazetteer-us.js',
  /* Appends into the array gazetteer-us.js exports, so it must stay after it. */
  'gazetteer-world.js',
  /* Reads both of the above to derive a time zone, so it comes after both. */
  'geocode-online.js'
];

const REACT = ['react-18.3.1.production.min.js', 'react-dom-18.3.1.production.min.js'];

function die(msg) {
  console.error('build-bundle: ' + msg);
  process.exit(1);
}

function read(file) {
  const p = path.join(appDir, file);
  if (!fs.existsSync(p)) die('missing ' + p);
  return fs.readFileSync(p, 'utf8');
}

/* A closing script tag inside inlined JS would end the block early. It appears
   for real: minor-bodies-ephemeris.js documents its own script tag in a
   comment. Escaping the slash is inert in both comments and strings. */
function safeInline(js) {
  return js.replace(/<\/script/gi, '<\\/script');
}

/* A bare script tag, with no attributes of any kind.

   The first version tagged each block with data-inlined="<filename>" for
   provenance. That is not safe here: the DC runtime walks the template zone
   and reads element attributes, and a value like
   "react-18.3.1.production.min.js" was parsed as an expression, throwing
   "Unexpected token '-'" five times through support.js's template renderer.
   The app still booted, which is precisely why it needed the console check to
   find it. Provenance lives in the build report instead of in the markup. */
function block(label, js) {
  return '<script>\n' + safeInline(js) + '\n</script>';
}

/* String.replace expands $&, $`, $' and $1 inside a string replacement, and
   minified React contains those sequences. Passing a function switches that
   off entirely. Doing it any other way silently injects the matched tag and
   duplicates whole regions of the file: the first version of this script did
   exactly that, and the bundle rendered React's source as visible text. */
function replaceOnce(hay, needle, replacement) {
  if (hay.indexOf(needle) === -1) die('could not find: ' + needle);
  return hay.replace(needle, () => replacement);
}

/* THE VERSION IS READ, NOT RESTATED.

   sw.js decides what a browser is allowed to keep, so it owns the number and
   the bundle is stamped with whatever it says. Two files declaring a version
   independently is two files that can disagree, and a build labelled with a
   version it is not is worse than a build with no label at all. */
const swPath = path.join(repo, 'deploy', 'sw.js');
if (!fs.existsSync(swPath)) die('cannot find deploy/sw.js to read the version from');
const verM = fs.readFileSync(swPath, 'utf8').match(/var CACHE = '([^']+)'/);
if (!verM) die('deploy/sw.js does not declare a CACHE version');
const VERSION = verM[1];

let html = fs.readFileSync(srcPath, 'utf8');
const report = { react: [], support: false, modules: [], lang: false };

/* 0. Establish the invariant on the SOURCE, not on the output.
      Two of the files being inlined document their own script tag in a
      comment (support.js and minor-bodies-ephemeris.js), so scanning the
      finished bundle for a leftover src re-finds that inert text and reports
      a failure that is not one. The honest check is that the source declares
      exactly the scripts this build knows about, each exactly once. */
const declared = (html.match(/<script\s+src="\.\/[^"]+"><\/script>/g) || [])
  .map(t => t.replace(/^<script\s+src="\.\//, '').replace(/"><\/script>$/, ''));
const expected = ['support.js'].concat(MODULES);

for (const f of expected) {
  const n = declared.filter(d => d === f).length;
  if (n === 0) die('the source does not load ' + f + '; this script is out of date with the helmet');
  if (n > 1) die(f + ' is declared ' + n + ' times in the source; refusing to guess which to inline');
}
const unknown = declared.filter(d => expected.indexOf(d) === -1);
if (unknown.length) {
  die('the source loads scripts this build does not know about: ' + unknown.join(', ') +
      '\n  add them to MODULES in the right order rather than letting them drop out of the bundle');
}
if (declared.length !== expected.length) {
  die('expected ' + expected.length + ' local scripts in the source, found ' + declared.length);
}

/* 1. lang on the document element. The app sets it at runtime too, but the
      served file has to carry it before any script runs. */
if (/<html\s+lang=/i.test(html)) {
  report.lang = 'already present';
} else if (/<html>/i.test(html)) {
  html = html.replace(/<html>/i, () => '<html lang="en">');
  report.lang = 'added';
} else {
  die('could not find an <html> tag to add lang to');
}

/* 2 and 3. React, then support.js, in that order and in one replacement so the
      ordering cannot drift. */
const supportTag = '<script src="./support.js"></script>';
if (html.indexOf(supportTag) === -1) die('could not find the support.js script tag');

const reactBlocks = REACT.map(f => {
  report.react.push(f);
  return block(f, read(f));
}).join('\n');

/* 4. The modules go into the outer <head>, NOT where their tags stand.

      This is the one place the bundle deliberately differs in structure from
      the source, and it is not a preference. In the source the modules are
      declared inside <helmet>, which lives inside <x-dc>: the template zone.
      A src tag there is inert markup, but inlined JS is content, and the DC
      template renderer parses it. Inlining them in place boots an app that
      works and throws six uncaught SyntaxErrors out of support.js's renderer,
      which is how it survives a glance at the screen.

      Measured, by building three bundles and counting uncaught errors in an
      iframe: runtime inlined alone 0, modules inlined in the helmet 6, both 5.

      In the outer head they are ordinary scripts, outside any template, and
      they execute in the same relative order they are declared in. Nothing
      about the app source changes. */
const moduleBlocks = MODULES.map(m => {
  report.modules.push(m);
  return block(m, read(m));
}).join('\n');

html = replaceOnce(
  html,
  supportTag,
  reactBlocks + '\n' + block('support.js', read('support.js')) + '\n' + moduleBlocks
);
report.support = true;

/* Now remove the helmet's src tags, which the head blocks above have taken
   over. replaceOnce fails loudly if one is not where it was expected. */
for (const m of MODULES) {
  html = replaceOnce(html, '<script src="./' + m + '"></script>', '');
}

/* 5. Refuse to ship a partial bundle. The source invariant above guarantees
      every declared tag was found and replaced; this is the arithmetic check
      on top of it. */
if (report.modules.length !== MODULES.length) {
  die('expected ' + MODULES.length + ' modules, inlined ' + report.modules.length);
}
if (!report.support || report.react.length !== 2) {
  die('runtime not fully inlined: support=' + report.support + ' react=' + report.react.length);
}

/* Two output checks, both of which the first version of this script failed.

   A complete script tag cannot survive inlining: any that appears inside
   inlined JS has had its closing tag escaped, so it can no longer match. If a
   whole tag is still here, something reintroduced it, which is what $&
   expansion did. */
const survived = html.match(/<script\s+src="\.\/[^"]+"><\/script>/g);
if (survived) {
  die('a complete local script tag survived into the output: ' + survived.join(', ') +
      '\n  this usually means a replacement expanded $& or $\' instead of being literal');
}

/* And the arithmetic: two React files, support.js, and every module. Counted
   from MODULES rather than written out, because a hand written total is one
   more thing to forget when a module is added, and the point of this check is
   to catch exactly that. */
const inlinedCount = report.react.length + (report.support ? 1 : 0) + report.modules.length;
const expectCount = REACT.length + 1 + MODULES.length;
if (inlinedCount !== expectCount) {
  die('expected ' + expectCount + ' inlined scripts, accounted for ' + inlinedCount);
}

const bytes = Buffer.byteLength(html, 'utf8');

if (checkOnly) {
  console.log(JSON.stringify({ mode: 'check', wouldWrite: outPath, bytes, report }, null, 2));
  process.exit(0);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
/* Stamped on the first line, so it is the first thing in the file rather
   than something to go looking for. */
const STAMP = '<!-- inCommon ' + VERSION + '  |  built ' + new Date().toISOString().slice(0, 10) +
  '  |  deploy this together with a sw.js showing the same version -->';
html = STAMP + '\n' + html;

fs.writeFileSync(outPath, html, 'utf8');

console.log('build-bundle: wrote ' + outPath);
console.log('  version:         ' + VERSION + '   (line 1 of the bundle, taken from deploy/sw.js)');
console.log('  ' + bytes.toLocaleString() + ' bytes');
console.log('  react inlined:   ' + report.react.join(', '));
console.log('  support.js:      inlined');
console.log('  modules inlined: ');
console.log('  html lang="en":  ' + report.lang);
