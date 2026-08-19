#!/usr/bin/env node
/* check-cache-bump.js: the service worker cache rule, enforced.
 *
 * THE RULE, from e. deploy/README.md and README-DEPLOY.md:
 *   bump CACHE in deploy/sw.js whenever deploy/index.html changes,
 *   and not when only a test changes.
 *
 * WHY IT IS A CHECK AND NOT A LINE IN A DOCUMENT. If index.html changes and
 * CACHE does not, an installed phone keeps serving the shell it already has
 * and the deploy never reaches the people who installed the app, which is the
 * failure that is hardest to notice because everything looks fine on a fresh
 * browser. The opposite mistake is cheaper but not free: bumping the cache for
 * a test-only change forces every installed copy to re-download 1.8 MB for
 * nothing.
 *
 * Usage:
 *   node tools/check-cache-bump.js                 compare HEAD to the working tree
 *   node tools/check-cache-bump.js <base>          compare <base> to the working tree
 *   node tools/check-cache-bump.js <base> <head>   compare two refs (CI on a PR)
 *
 * Exit 0 when the rule holds, 1 when it does not.
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const BUNDLE = 'deploy/index.html';
const SW = 'deploy/sw.js';

/* Changes that must NOT move the cache. The bundle does not contain any of
   these, so a change confined to them cannot alter what a phone downloads. */
const TEST_PATHS = [
  /^verification\//,
  /^app\/handoff\//,
  /^app\/Verification /,
  /^tools\/check-cache-bump\.js$/
];

const base = process.argv[2] || 'HEAD';
const head = process.argv[3] || null; // null means the working tree

function git(args) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
}

function changedFiles() {
  const args = head ? ['diff', '--name-only', base, head] : ['diff', '--name-only', base];
  const tracked = git(args).split('\n').map(s => s.trim()).filter(Boolean);
  if (head) return tracked;
  /* Without a head ref, staged and untracked files are part of "the working
     tree" too, or a bundle added but not yet committed would be invisible. */
  const staged = git(['diff', '--name-only', '--cached', base]).split('\n').map(s => s.trim()).filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').map(s => s.trim()).filter(Boolean);
  return [...new Set([...tracked, ...staged, ...untracked])];
}

function cacheAt(ref) {
  let text;
  if (ref === null) {
    const p = path.join(repo, SW);
    if (!fs.existsSync(p)) return null;
    text = fs.readFileSync(p, 'utf8');
  } else {
    try { text = git(['show', ref + ':' + SW]); } catch (e) { return null; }
  }
  const m = /var\s+CACHE\s*=\s*['"]([^'"]+)['"]/.exec(text);
  return m ? m[1] : null;
}

const changed = changedFiles();
const bundleChanged = changed.indexOf(BUNDLE) !== -1;

/* sw.js is where the bump lives, so it is always in the change set when the
   cache moves. Judging "was this a test-only change" has to ignore it, or the
   second half of the rule can never fire: the first version of this check
   passed a commit that touched one test file and bumped the cache, because
   sw.js counted as a non-test change and excused itself. */
const substantive = changed.filter(f => f !== SW);
const onlyTests = substantive.length > 0 &&
  substantive.every(f => TEST_PATHS.some(re => re.test(f)));

const before = cacheAt(base);
const after = cacheAt(head);
const cacheChanged = before !== after;

const problems = [];

if (before === null || after === null) {
  problems.push('could not read CACHE from ' + SW + ' on both sides (' + before + ' -> ' + after + ')');
}
if (bundleChanged && !cacheChanged) {
  problems.push(
    BUNDLE + ' changed but CACHE is still ' + before + '.\n' +
    '  Installed copies will keep serving the old shell. Bump CACHE in ' + SW + '.'
  );
}
if (onlyTests && cacheChanged) {
  problems.push(
    'only test files changed, but CACHE moved ' + before + ' -> ' + after + '.\n' +
    '  That forces every installed copy to re-download the bundle for a change it does not contain.'
  );
}

const summary = {
  base,
  head: head || '(working tree)',
  changedFileCount: changed.length,
  bundleChanged,
  onlyTestsChanged: onlyTests,
  cache: { before, after, changed: cacheChanged }
};

if (problems.length) {
  console.error('check-cache-bump: FAIL');
  console.error(JSON.stringify(summary, null, 2));
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}

console.log('check-cache-bump: ok');
console.log('  ' + BUNDLE + ' changed: ' + bundleChanged +
            ' | cache ' + before + (cacheChanged ? ' -> ' + after : ' (unchanged)') +
            ' | files compared: ' + changed.length);
