#!/usr/bin/env node
/* check-deployed.js: is the file on the internet the file we built?
 *
 * WHY THIS EXISTS. v4.7 was deployed and the site crashed on every device with
 * React error 31, an object rendered where a string belonged. The source was
 * fine, the local build was fine, and the version stamp on the live file said
 * v4.7, which is what made it convincing.
 *
 * The file was 26,255,170 bytes. The build was 9,530,599. A Netlify build
 * plugin had re-serialised the document on the way out and duplicated every
 * inlined script block: 27 script tags became 79. React, the DC runtime and all
 * nineteen modules were executing three times over, each pass redefining the
 * globals the last one had set, and the app came apart in the middle of a
 * render.
 *
 * THE LESSON ABOUT THE VERSION STAMP. It survived the transformation intact,
 * because a rewriter has no reason to touch an HTML comment. A label proves
 * which build something CLAIMS to be. It cannot prove the bytes are that
 * build's bytes, and the two are different questions. So this asks the second
 * one: fetch what is actually being served and compare it to what is on disk.
 *
 * Byte length is the useful signal rather than a hash alone, because when it
 * differs the size tells you which direction the damage went. Something larger
 * has been injected into or duplicated; something smaller has been minified or
 * truncated.
 *
 * Usage: node tools/check-deployed.js [site origin | one page url]
 *   defaults to https://incommon.netlify.app, and checks BOTH pages there:
 *   index.html (the cover) and app.html (the app). Pass one page URL to check
 *   only that page.
 * Exit 0 when the deployed bytes are the built bytes, 1 otherwise.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repo = path.resolve(__dirname, '..');

/* THERE ARE TWO PAGES AND BOTH HAVE TO BE ASKED ABOUT.

   This compared index.html alone for as long as index.html was the app. It is
   the cover now, 31KB of it, and the app is app.html at ten megabytes. A check
   that reads only the cover is a check that cannot see the file this script was
   written about: the v4.7 failure was a rewriter duplicating inlined script
   blocks, and every inlined script block is in app.html. A green run against
   the cover while a mangled app sat on the CDN would be the same convincing
   nothing the version stamp was.

   Keep the folder in step with BUNDLE in build-bundle.js, which is what wrote
   the files being compared. */
const BUNDLE = path.join(repo, 'deploy', 'v6.2');
const PAGES = [
  { what: 'cover', file: 'index.html' },
  { what: 'app', file: 'app.html' }
];
const SITE = 'https://incommon.netlify.app';

/* An argument is either a site origin, in which case both pages are checked
   there, or one page's URL, in which case that page alone is. The second form
   is what the old signature did and scripts may still pass it. */
const arg = process.argv[2];
const single = arg && /\.html($|\?)/.test(arg);
const origin = (single ? arg.replace(/\/[^/]*$/, '') : (arg || SITE)).replace(/\/+$/, '');
const targets = single
  ? PAGES.filter(p => arg.indexOf(p.file) !== -1)
  : PAGES;

if (!targets.length) {
  console.error('check-deployed: ' + arg + ' does not name a page this bundle builds.');
  console.error('  It builds ' + PAGES.map(p => p.file).join(' and ') + '.');
  process.exit(1);
}

const ver = t => (String(t).match(/incommon-v[0-9.]+/) || ['unstamped'])[0];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const count = (b, re) => (b.toString('utf8').match(re) || []).length;

function checkOne(page) {
  const local = path.join(BUNDLE, page.file);
  if (!fs.existsSync(local)) {
    console.error('check-deployed: no local build at ' + local + '. Run tools/build-bundle.js first.');
    return Promise.resolve(false);
  }
  const buf = fs.readFileSync(local);
  const localHash = sha(buf);
  const url = origin + '/' + page.file;
  /* A query string, because the point is to see what a browser would be handed
     now and not what an edge cached an hour ago. */
  const bust = (url.indexOf('?') === -1 ? '?' : '&') + 'deploycheck=' + Date.now();

  return fetch(url + bust, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('the server answered ' + r.status);
      return r.arrayBuffer();
    })
    .then(ab => {
      const remote = Buffer.from(ab);
      const remoteHash = sha(remote);
      const same = localHash === remoteHash;
      const rows = [
        ['bytes', buf.length.toLocaleString(), remote.length.toLocaleString()],
        ['sha256', localHash.slice(0, 16), remoteHash.slice(0, 16)],
        ['version stamp', ver(buf), ver(remote)],
        ['script tags', count(buf, /<script[^>]*>/g), count(remote, /<script[^>]*>/g)],
        ['style tags', count(buf, /<style[^>]*>/g), count(remote, /<style[^>]*>/g)]
      ];
      const w = Math.max.apply(null, rows.map(r => String(r[1]).length).concat([8]));
      console.log('\ncheck-deployed [' + page.what + ']: ' + url);
      console.log('  ' + 'what'.padEnd(15) + 'built'.padEnd(w + 3) + 'served');
      rows.forEach(r => console.log('  ' + String(r[0]).padEnd(15) + String(r[1]).padEnd(w + 3) + String(r[2])));

      if (same) {
        console.log('  the bytes being served are the bytes that were built.');
        return true;
      }

      console.error('  FAIL. What is being served is not what was built.');
      const d = remote.length - buf.length;
      if (d > 0) {
        console.error('  It is ' + d.toLocaleString() + ' bytes LARGER. Something is injecting into the file');
        console.error('  or duplicating parts of it. A build plugin that rewrites HTML is the usual cause,');
        console.error('  and on a single file app that inlines its whole runtime, duplicated script blocks');
        console.error('  mean the runtime executes more than once and the app comes apart mid render.');
      } else {
        console.error('  It is ' + (-d).toLocaleString() + ' bytes SMALLER. Something is minifying, stripping');
        console.error('  or truncating the file. This build is already the finished artifact and nothing');
        console.error('  downstream should be editing it.');
      }
      if (ver(buf) === ver(remote)) {
        console.error('  Note that both files carry the same version stamp. A label says what a build');
        console.error('  claims to be; it cannot say the bytes are that build. That is what this checks.');
      }
      return false;
    })
    .catch(e => {
      console.error('\ncheck-deployed [' + page.what + ']: could not fetch ' + url);
      console.error('  ' + e.message);
      return false;
    });
}

/* Sequential rather than parallel: the app is ten megabytes and the point is a
   clean report, not a fast one. */
(async function () {
  let allOk = true;
  for (const p of targets) allOk = (await checkOne(p)) && allOk;
  if (allOk) {
    console.log('\ncheck-deployed: ' + targets.length + ' page(s) match what was built.');
    process.exit(0);
  }
  console.error('\ncheck-deployed: FAIL. Turn off whatever post processes the deploy, then deploy');
  console.error('  again: disabling a plugin does not repair the artifact it already produced');
  console.error('  and put on the CDN.');
  process.exit(1);
})();
