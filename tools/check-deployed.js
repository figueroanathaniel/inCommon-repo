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
 * Usage: node tools/check-deployed.js [url]
 *   defaults to https://incommon.netlify.app/index.html
 * Exit 0 when the deployed bytes are the built bytes, 1 otherwise.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repo = path.resolve(__dirname, '..');
const LOCAL = path.join(repo, 'deploy', 'index.html');
const URL_ = process.argv[2] || 'https://incommon.netlify.app/index.html';

if (!fs.existsSync(LOCAL)) {
  console.error('check-deployed: no local build at ' + LOCAL + '. Run tools/build-bundle.js first.');
  process.exit(1);
}
const local = fs.readFileSync(LOCAL);
const localHash = crypto.createHash('sha256').update(local).digest('hex');
const ver = t => (String(t).match(/incommon-v[0-9.]+/) || ['unstamped'])[0];

/* A query string, because the point is to see what a browser would be handed
   now and not what an edge cached an hour ago. */
const bust = (URL_.indexOf('?') === -1 ? '?' : '&') + 'deploycheck=' + Date.now();

fetch(URL_ + bust, { cache: 'no-store' })
  .then(r => {
    if (!r.ok) throw new Error('the server answered ' + r.status);
    return r.arrayBuffer();
  })
  .then(buf => {
    const remote = Buffer.from(buf);
    const remoteHash = crypto.createHash('sha256').update(remote).digest('hex');
    const same = localHash === remoteHash;

    const count = (b, re) => (b.toString('utf8').match(re) || []).length;
    const rows = [
      ['bytes', local.length.toLocaleString(), remote.length.toLocaleString()],
      ['sha256', localHash.slice(0, 16), remoteHash.slice(0, 16)],
      ['version stamp', ver(local), ver(remote)],
      ['script tags', count(local, /<script[^>]*>/g), count(remote, /<script[^>]*>/g)],
      ['style tags', count(local, /<style[^>]*>/g), count(remote, /<style[^>]*>/g)]
    ];
    const w = Math.max.apply(null, rows.map(r => String(r[1]).length).concat([8]));
    console.log('check-deployed: ' + URL_);
    console.log('  ' + 'what'.padEnd(15) + 'built'.padEnd(w + 3) + 'served');
    rows.forEach(r => console.log('  ' + String(r[0]).padEnd(15) + String(r[1]).padEnd(w + 3) + String(r[2])));

    if (same) {
      console.log('\n  the bytes being served are the bytes that were built.');
      process.exit(0);
    }

    console.error('\ncheck-deployed: FAIL. What is being served is not what was built.');
    const d = remote.length - local.length;
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
    if (ver(local) === ver(remote)) {
      console.error('\n  Note that both files carry the same version stamp. A label says what a build');
      console.error('  claims to be; it cannot say the bytes are that build. That is what this checks.');
    }
    console.error('\n  Turn off whatever post processes the deploy, then deploy again: disabling a plugin');
    console.error('  does not repair the artifact it already produced and put on the CDN.');
    process.exit(1);
  })
  .catch(e => {
    console.error('check-deployed: could not fetch ' + URL_);
    console.error('  ' + e.message);
    process.exit(1);
  });
