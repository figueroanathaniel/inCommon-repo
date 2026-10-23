#!/usr/bin/env node
/* build-native.js: make native/www, the files the iPhone and Android apps carry.

   The store apps are a Capacitor shell (native/) around the web app, and they
   carry the app's files rather than loading the website: Apple rejects an app
   that only shows a remote site (guideline 4.2), and files on the device are
   what keep it working offline. So this copies the bundle tools/build-bundle.js
   already made, deploy/<version>/, with three changes and no more:

   1. THE APP IS index.html, THE COVER IS cover.html. Capacitor opens
      index.html, and the store app should open on the app, not on the cover's
      raytracer: the cover is where signing in lives, so the app sends a signed
      out reader there (coverHref() answers ./cover.html inside the shell).
   2. EVERY LINK BACK TO THE APP is rewritten from ./app.html to ./index.html:
      the cover's way in and its hash forward, and the "Back to inCommon" and
      Contact Support links on the four plain pages. The count is asserted,
      because a link missed here is a page in the app with no way back.
   3. LEFT OUT: the service worker (the app does not register one inside the
      shell, and its files are already on the device), the host's _redirects
      and _headers (there is no host), robots.txt and the deploy README.

   It builds nothing itself. Run tools/build-bundle.js first; this refuses a
   bundle older than the app source, because an app store build of last
   week's bytes is the one mistake nobody would notice until a reader did.

   Usage, from native/:  npm run build   (or npm run sync, which also copies
   the files into both platform projects). docs/NATIVE-APP.md is the how to. */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const builder = fs.readFileSync(path.join(repo, 'tools', 'build-bundle.js'), 'utf8');
const m = /const BUNDLE = path\.join\(repo, 'deploy', '([^']+)'\)/.exec(builder);
if (!m) die('cannot read the bundle folder out of tools/build-bundle.js');
const BUNDLE = path.join(repo, 'deploy', m[1]);
const OUT = path.join(repo, 'native', 'www');

function die(msg) { console.error('build-native: ' + msg); process.exit(1); }

const appSrc = path.join(repo, 'app', 'inCommonApp v2.dc.html');
const appBuilt = path.join(BUNDLE, 'app.html');
if (!fs.existsSync(appBuilt)) die('no ' + path.relative(repo, appBuilt) + '; run node tools/build-bundle.js first');
if (fs.statSync(appSrc).mtimeMs > fs.statSync(appBuilt).mtimeMs + 1000) {
  die('the app source is newer than ' + path.relative(repo, appBuilt) + '; run node tools/build-bundle.js first');
}

const SKIP = new Set(['sw.js', '_redirects', '_headers', 'robots.txt']);
const RENAME = { 'app.html': 'index.html', 'index.html': 'cover.html' };
const PAGES = ['terms.html', 'privacy.html', 'accessibility.html', 'delete-account.html'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const f of fs.readdirSync(BUNDLE)) {
  const from = path.join(BUNDLE, f);
  if (SKIP.has(f) || /^README/i.test(f) || /\.building$/.test(f)) continue;
  if (fs.statSync(from).isDirectory()) {
    fs.cpSync(from, path.join(OUT, f), { recursive: true });
    copied++;
    continue;
  }
  const to = path.join(OUT, RENAME[f] || f);
  if (f === 'index.html' || PAGES.indexOf(f) !== -1) {
    let text = fs.readFileSync(from, 'utf8');
    const n = text.split('./app.html').length - 1;
    const need = f === 'index.html' ? 2 : 1;
    if (n < need) die(f + ' names ./app.html ' + n + ' times, expected at least ' + need + '; the links back to the app would break');
    text = text.split('./app.html').join('./index.html');
    fs.writeFileSync(to, text, 'utf8');
  } else {
    fs.copyFileSync(from, to);
  }
  copied++;
}
for (const need of ['index.html', 'cover.html', 'manifest.json'].concat(PAGES)) {
  if (!fs.existsSync(path.join(OUT, need))) die('native/www has no ' + need + ' after the copy');
}
/* The app has to know it is inside the shell, by asking Capacitor, and has to
   skip the service worker there. If either check is gone from the bundle the
   store app registers a worker it cannot use and sells through Stripe. */
const app = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
if (app.indexOf('nativeApp()') === -1 || app.indexOf('isNativePlatform') === -1) {
  die('the bundled app has no nativeApp() check; the store app would behave as the website does');
}

console.log('build-native: wrote ' + path.relative(repo, OUT) + '/ from ' + path.relative(repo, BUNDLE) + '/ (' + copied + ' entries)');
console.log('  index.html is the app, cover.html is the cover; links back rewritten to ./index.html');
console.log('  left out: ' + Array.from(SKIP).join(', ') + ', README');
