#!/usr/bin/env node
/* build-bundle.js: produce the two pages of deploy/v6.2/ from app/.
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
 *   6. writes deploy/v6.2/app.html
 *   7. builds the cover into deploy/v6.2/index.html and copies the two
 *      vendored three.js files in beside it
 *
 * TWO PAGES, AND THE COVER IS THE ONE AT THE ROOT. The app used to be
 * index.html and is app.html now, because the cover is what a visitor meets.
 * Nothing about the app changed to make room: the cover forwards any inbound
 * hash, so an address written before it existed still lands on its screen.
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

/* ONE FOLDER PER BUNDLE, AND THE SITE IS ONE OF THEM.

   deploy/ is not the site. It holds a folder per shipped build, and that folder
   is what gets uploaded. This script wrote deploy/index.html for as long as the
   bundle sat at that level; after the move it wrote nothing at all, because the
   version it reads lives beside the output and neither path existed any more.
   Bump this when a new bundle folder is cut, or the build lands in the previous
   release. */
const BUNDLE = path.join(repo, 'deploy', 'v6.3');

const outFlag = process.argv.indexOf('--out');
const outPath = outFlag !== -1 && process.argv[outFlag + 1]
  ? path.resolve(process.argv[outFlag + 1])
  : path.join(BUNDLE, 'app.html');
const checkOnly = process.argv.indexOf('--check') !== -1;

/* The modules, in the order the helmet loads them. Several read globals set
   by earlier ones, so this order is part of the contract, not a preference. */
const MODULES = [
  /* Ephemeris architecture (V1.0.0): dual-backend system with fallback */
  'ephemeris-points.js',
  'ephemeris-backend-current.js',
  'ephemeris-backend-swiss.js',
  'ephemeris-router.js',
  'ephemeris-integration.js',
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
  /* The other half of Synchronicities. Reads nothing from the modules above,
     so its only ordering requirement is that it loads before the app. */
  'animal-symbolism.js',
  'dream-symbols.js',
  'hd-topology.js',
  'hd-atlas.js',
  'astropedia.js',
  'tarot.js',
  'iching.js',
  'crisis-directory.js',
  'hd-life.js',
  'hd-teachings.js',
  'gazetteer-us.js',
  /* Appends into the array gazetteer-us.js exports, so it must stay after it. */
  'gazetteer-world.js',
  /* Reads both of the above to derive a time zone, so it comes after both. */
  'geocode-online.js',
  /* The connection pass. birth-time.js depends on nothing. hd-composite.js
     reads the channel table out of hd-atlas.js above, so it has to follow it.
     analytics.js touches storage and nothing else. */
  'birth-time.js',
  /* Solves the design moment, so it has to be present before the first chart
     is drawn. Knows nothing about ephemerides: the app hands it a longitude
     function. */
  'arc-solver.js',
  'ephemeris-cache.js',
  /* The wheel order and the boundary rule, as data. */
  'hd-wheel.js',
  /* The gates the sky stands in at one instant. Reads the wheel above by
     name, so it has to follow it. */
  'hd-transit.js',
  'hd-circle.js',
  /* The store, then the cache that takes its digest from it. */
  'people-library.js',
  'pair-cache.js',
  'hd-composite.js',
  'analytics.js',
  /* Extension modules: synastry news, Sky Wire, and localization (Prompts A, B, C) */
  'forecast/newsEngine.js',
  'forecast/news/synastryTemplates.js',
  'forecast/news/multiChart.js',
  'forecast/news/lint.js',
  'forecast/news/skyWire.js',
  'forecast/feedBuilder.js',
  'i18n/index.js',
  'i18n/en.js',
  'i18n/es.js'
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
const swPath = path.join(BUNDLE, 'sw.js');
if (!fs.existsSync(swPath)) die('cannot find ' + swPath + ' to read the version from');
const verM = fs.readFileSync(swPath, 'utf8').match(/var CACHE = '([^']+)'/);
if (!verM) die(swPath + ' does not declare a CACHE version');
const VERSION = verM[1];

/* AND THE OTHER sw.js HAS TO AGREE ABOUT THE NUMBER.
   There are two service workers: this bundle's, which precaches one inlined
   page, and app/sw.js, which precaches every module separately. They are
   different programs and their cache NAMES must differ, or whichever activates
   last deletes the other's cache and then serves its files under the wrong
   fetch rules. What must not differ is the release they claim: app/sw.js sat
   at v2.4 against a shipped v6.0 for as long as nothing compared them, which
   is the same "two files declaring a version independently" this comment warns
   about, one file further out. Declared twice, asserted equal, which is how
   the channel table and the topology are held together too. */
const devSwPath = path.join(repo, 'app', 'sw.js');
if (fs.existsSync(devSwPath)) {
  const devM = fs.readFileSync(devSwPath, 'utf8').match(/var CACHE = '([^']+)'/);
  if (!devM) die('app/sw.js does not declare a CACHE version');
  const num = s => (String(s).match(/v[0-9][0-9.]*$/) || [null])[0];
  if (devM[1] === VERSION) {
    die('app/sw.js and the bundle sw.js share the cache name "' + VERSION + '".\n' +
        '  They precache different things, and activate() deletes every key that is not its own,\n' +
        '  so the two would take turns wiping each other. Give the source shell its own prefix.');
  }
  if (num(devM[1]) !== num(VERSION)) {
    die('version drift between the two service workers:\n' +
        '  app/sw.js         ' + devM[1] + '\n' +
        '  ' + path.relative(repo, swPath) + '   ' + VERSION + '\n' +
        '  The names are meant to differ and the release number is not. Fix app/sw.js.');
  }
}

let html = fs.readFileSync(srcPath, 'utf8');
const report = { react: [], support: false, modules: [], lang: false, style: false };

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

/* 4b. THE STYLESHEET IS CHECKED, NOT MOVED.

      The app declares one <style>, and it declares it in the outer <head>
      rather than in <helmet>. That is not a preference either: the runtime
      hoists helmet children by snapshotting them once and copying textContent,
      and in a document this size the snapshot is taken before 4KB of CSS has
      finished streaming, so what reaches the head is an empty stylesheet. The
      bundle then paints with the browser's own defaults, starting with an 8px
      margin on the body, which is why the shell sat inset and overflowed the
      viewport. The app source carries the whole story above the sheet itself.

      So this build does not lift anything. It refuses to ship a bundle whose
      head has no stylesheet in it, and refuses one that put the sheet back
      into the helmet, because both of those ship an app with no CSS. */
const headEnd = html.indexOf('</head>');
if (headEnd === -1) die('could not find the end of the head');
const headStyles = html.slice(0, headEnd).match(/<style>[\s\S]*?<\/style>/g) || [];
if (headStyles.length !== 1) {
  die('expected exactly one <style> in the outer head, found ' + headStyles.length +
      '\n  the app stylesheet belongs there, where the browser applies it at parse time');
}
if (headStyles[0].replace(/<\/?style>/g, '').trim().length < 200) {
  die('the head stylesheet is suspiciously short; refusing to ship a bundle with no CSS in it');
}
const helmetShut = html.indexOf('</helmet>');
const helmetOpen = helmetShut === -1 ? -1 : html.lastIndexOf('<helmet', helmetShut);
if (helmetOpen === -1 || helmetShut === -1) die('could not find the helmet');
if (/<style>/.test(html.slice(helmetOpen, helmetShut))) {
  die('the helmet declares a <style>; move it to the outer head\n' +
      '  a stylesheet hoisted out of the helmet arrives empty in a bundle this size');
}
report.style = Buffer.byteLength(headStyles[0], 'utf8') + ' bytes, in <head> where the browser reads it';

/* 5. Refuse to ship a partial bundle. The source invariant above guarantees
      every declared tag was found and replaced; this is the arithmetic check
      on top of it. */
if (report.modules.length !== MODULES.length) {
  die('expected ' + MODULES.length + ' modules, inlined ' + report.modules.length);
}
if (!report.style) {
  die('the helmet stylesheet was not lifted into the head; the bundle would paint unstyled');
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

/* WRITE BESIDE IT, THEN RENAME. A plain write to outPath truncates the shipped
   bundle to zero the instant it opens the file, so a write that fails part way
   through does not leave the previous bundle alone: it destroys it. That is not
   hypothetical. A full disk did exactly this, and the deploy folder was left
   holding a zero byte index.html that looks like a build and serves nothing.

   A temp file plus a rename cannot do that. The rename is atomic and happens
   only after the whole bundle is on disk, so a failure at any earlier point
   leaves the last good bundle exactly where it was. The temp file sits in the
   same folder on purpose, because a rename across volumes is a copy and would
   give the guarantee back. */
const tmpPath = outPath + '.building';
try {
  fs.writeFileSync(tmpPath, html, 'utf8');
  fs.renameSync(tmpPath, outPath);
} catch (e) {
  try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (e2) {}
  if (e && e.code === 'ENOSPC') {
    die('no space left on the device to write the bundle (' +
        Math.round(html.length / 1048576) + 'MB needed). The previous bundle at ' +
        outPath + ' is untouched. Free some space and run this again.');
  }
  die('could not write the bundle: ' + (e && e.message) +
      '. The previous bundle at ' + outPath + ' is untouched.');
}

/* THE COVER, AND THE TWO FILES IT WILL NOT LOAD WITHOUT.

   app/cover.html is the Event Horizon screen. Its shader half is the design
   and is copied through untouched; the only thing this build changes is the
   target of "enter here", because in the source shell it points at the app
   file and in the bundle the app is app.html.

   Both occurrences are rewritten and the count is asserted, because there are
   two: the href on the link and the hash forward in the head. Rewriting one
   and missing the other produces a cover whose link works and whose deep
   links go nowhere, which nothing on screen would report.

   three.module.js and three.core.js are copied rather than inlined. They are
   ES modules resolved through an import map, and an inlined module is not a
   module: the import specifier has to resolve to a URL. They sit beside
   index.html because the map names them ./three.module.js, and three.module.js
   imports ./three.core.js by that name in turn. */
const coverSrc = path.join(appDir, 'cover.html');
if (!fs.existsSync(coverSrc)) die('cannot find ' + coverSrc + '; the site has no cover to serve at /');
let cover = fs.readFileSync(coverSrc, 'utf8');

const APP_ADDR = './inCommonApp%20v2.dc.html';
const addrCount = cover.split(APP_ADDR).length - 1;
if (addrCount !== 2) {
  die('the cover names the app at ' + addrCount + ' places, expected 2\n' +
      '  One is the enter here href and one is the hash forward in the head.\n' +
      '  Rewriting one and missing the other ships a cover whose link works\n' +
      '  and whose deep links go nowhere, which nothing on screen would report.');
}
cover = cover.split(APP_ADDR).join('./app.html');

/* The cover is a canvas and one control. If either is gone, something has
   replaced the page rather than edited it. */
if (cover.indexOf('<canvas id="view">') === -1) {
  die('the cover has no canvas#view; refusing to ship a blank first screen');
}
/* The way in is named by its own text, so the check is for an enter anchor
   with an href and words inside it: an empty anchor is a control nobody can
   find by ear. */
if (!/<a class="enter" href="[^"]+">\s*\S[^<]*<\/a>/.test(cover)) {
  die('the cover has no labelled way into the app');
}

/* The detector is built from character codes rather than written out, for the
   same reason checkVoice() in oki-voice-v144.js builds its own that way: a
   file that enforces the no-dash rule by containing a dash fails the sweep it
   exists to serve. The escape spelling counts too, so neither may appear. */
const DASHES = new RegExp('[' + String.fromCharCode(8212, 8211) + ']');
if (DASHES.test(cover)) {
  die('the cover contains an em or en dash; this repo has none anywhere');
}

const THREE_FILES = ['three.module.js', 'three.core.js'];
for (const f of THREE_FILES) {
  const from = path.join(appDir, f);
  if (!fs.existsSync(from)) {
    die('missing ' + from + '\n' +
        '  The cover imports three from a local copy, so without it the first\n' +
        '  screen is the SIGNAL LOST message on a machine perfectly capable of\n' +
        '  drawing it. Both files are vendored in app/ beside the vendored React.');
  }
  fs.copyFileSync(from, path.join(BUNDLE, f));
}

const coverOut = path.join(BUNDLE, 'index.html');
const coverStamp = '<!-- inCommon ' + VERSION + ' cover  |  built ' +
  new Date().toISOString().slice(0, 10) + ' -->';
const coverTmp = coverOut + '.building';
try {
  fs.writeFileSync(coverTmp, coverStamp + '\n' + cover, 'utf8');
  fs.renameSync(coverTmp, coverOut);
} catch (e) {
  try { if (fs.existsSync(coverTmp)) fs.unlinkSync(coverTmp); } catch (e2) {}
  die('could not write the cover: ' + (e && e.message) + '. The previous one is untouched.');
}

/* The root _redirects, generated from what is actually in the bundle folder.

   Assets are listed by name rather than splatted because the app's own paths
   are relative: index.html asks for ./manifest.json, and if that resolves at
   the site root it has to be rewritten to the copy inside the bundle. The
   catch all at the end is the same rule the bundle folder carries, because the
   router is the hash and the server never sees it: any address the reader
   types has to arrive at the app rather than at a not found page. */
/* EVERY FOLDER SOMEBODY MIGHT DRAG HAS TO SERVE THE APP.

   The site is deploy/vN. Nobody drags that reliably: they drag the repository,
   because it is the thing on the desktop, or they drag deploy/, because it is
   the folder called deploy. Both of those have no index.html at their root, so
   the host serves a directory listing or a not found page. The deploy
   succeeds, a link comes back, and every address on it is broken, which is a
   failure with no error anywhere in it.

   So a _redirects is generated for each of those two roots, pointing at the
   bundle from where that root actually stands. They are generated rather than
   written by hand because each names the bundle folder, and the bundle folder
   is renamed at every version bump: a hand written copy points at the previous
   version the first time somebody forgets.

   Assets are listed by name rather than splatted because the app's own paths
   are relative. index.html asks for ./manifest.json, which resolves at the
   site root, and that has to be rewritten into the bundle or the manifest,
   the icons and the service worker all 404 while the page itself loads. */
const assets = fs.readdirSync(BUNDLE)
  .filter(f => f !== 'index.html' && f !== '_redirects' && f !== '_headers' && !/\.md$/i.test(f))
  .sort();

function writeRedirects(atDir, label, why) {
  /* The path from THIS root down to the bundle. From the repo that is
     deploy/vN; from inside deploy/ it is just vN. */
  const to = path.relative(atDir, BUNDLE).split(path.sep).join('/');
  const width = Math.max(34, ...assets.map(a => a.length + 1));
  const pad = t => t + ' '.repeat(Math.max(1, width - t.length));
  const rule = (from, target) => pad(from) + '/' + to + '/' + target + '   200';
  const out = [
    '# GENERATED by tools/build-bundle.js. Do not edit by hand.',
    '#',
    '# ' + why,
    '#',
    '# Regenerated on every build, so it always names the current bundle.',
    '',
    '# The bare address is the cover. Everything else is the app.',
    rule('/', 'index.html'),
    rule('/index.html', 'index.html')
  ].concat(assets.map(a => rule('/' + a, a)))
    .concat([
      '',
      '# Every other address is a hash route, so it resolves to the app rather',
      '# than to the cover: an address that names a screen goes to the screen.',
      '# The cover handles the one case the server cannot see, a hash on the',
      '# bare address, by forwarding it in the page.',
      rule('/*', 'app.html'),
      ''
    ]);
  fs.writeFileSync(path.join(atDir, '_redirects'), out.join('\n'), 'utf8');
  return { label: label, rules: assets.length + 3, to: to };
}

const redirectsWritten = [
  writeRedirects(repo, 'repo root',
    'Serves the app when the REPOSITORY itself is the deploy. The repo root has no index.html and never will: deploy/ is a shelf holding one folder per build.'),
  writeRedirects(path.join(repo, 'deploy'), 'deploy/',
    'Serves the app when deploy/ is the deploy. It is a shelf rather than a site, so without this the folder called deploy is the one thing that looks right to upload and is not.')
];

console.log('build-bundle: wrote ' + outPath);
console.log('  cover:           ' + coverOut + '  (+ ' + THREE_FILES.join(', ') + ')');
console.log('  version:         ' + VERSION + '   (line 1 of the bundle, taken from the sw.js beside it)');
console.log('  ' + bytes.toLocaleString() + ' bytes');
console.log('  react inlined:   ' + report.react.join(', '));
console.log('  support.js:      inlined');
console.log('  modules inlined: ' + report.modules.length + ' of ' + MODULES.length);
console.log('  html lang="en":  ' + report.lang);
console.log('  stylesheet:      ' + report.style);
redirectsWritten.forEach(r => console.log('  _redirects:      ' + r.rules + ' rules at ' + r.label + ', pointing at ' + r.to + '/'));
