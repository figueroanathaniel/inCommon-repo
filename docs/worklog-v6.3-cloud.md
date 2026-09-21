# v6.3 worklog: the cloud pass

Run 20 September 2026, against `incommon-v6.3`. This pass added consent-gated
sync with Supabase end to end: schema, builder, module, verification, and the
git and hosting plumbing around them. Everything below is recorded as it happened; the open items at writing
close in the order listed at the end.

---

## What was built

**The sync layer.** `app/incommon-cloud.js` (v2.0.1) is the only file allowed
to move local state off the device. It reads `ProfileManager` as its single
source of truth, self-initializes in the browser after `profile-manager.js`
and the vendored client load, and stays inert under Node and in any context
where its dependencies are absent. It subscribes to ProfileManager events,
debounces, and pushes a consent-gated mirror: a memory syncs only when the
consent it names is granted, `kept` rows stay local by design, the consent
ledger and pairs always sync because they are governance rather than content,
and `providerConsent` never syncs at all. Deletions ride an outbox so a wipe
cannot be re-uploaded by the debounce that follows it. PIN recovery re-proves
ownership through the account email and recomputes the same `pinHash` the
store keeps; the PIN itself never travels. The anon key ships in the file by
design; RLS is the wall, and the wall was tested, not trusted.

**The vendored client.** `app/supabase-js-2.57.1.umd.min.js` (218,610 bytes)
is inlined ahead of the modules for the same reason React is: the app must
boot without a third-party network call. Pinned by filename the way the React
filenames carry their versions.

**The builder.** `tools/build-bundle.js` gained the `VENDORED` group, the
cloud module entry after `analytics.js`, and the count arithmetic to match.
The helmet and the manifest are asserted in both directions exactly as
before; the byte count below is the post-rebase baseline.

**The schema, in Supabase.** `schema v2` (saved query) was written against
the ProfileManager contract after v1 turned out to describe the older
single-blob prototype: `accounts`, `profiles` (the local profile id is the
primary key; no id mapping), `memories` (one table for journals, moods,
practice completions, and Oki conversations), `throughline_entries`,
`oki_messages`, `consent_events`, and `pairs`. The unused v1 tables were
dropped by the v2 preamble. Every table carries RLS, with the
`owns_profile` helper behind the child-table policies.

**Proven through the API, not assumed.** The two-user isolation test ran
against v2 through the REST API with PowerShell: user A sees A's memory,
authenticated user B sees an empty world, and B's attempt to write into A's
profile is refused by the database. A's read-back showing exactly one row
after B's attempt is the proof the write failed rather than being hidden.

---

## The branch migration

Local `main` had been tracking `origin/v1.7`, and the two had diverged:
`origin/main` held nine commits of real work this line never got, including
the astral-body rename, the Ceres/Pallas/Juno/Vesta fix (wrong by up to 169
degrees), the Part of Fortune and Vertex work, and a generated publish
pointer. The local hand-edit of `netlify.toml` was rebased onto the remote
line and dropped as redundant, "patch contents already upstream", because
the other line had already made the builder the pointer's author. The cloud
work was stashed, the rebase run clean, and the stash popped with two clean
auto-merges. `main` is now the branch in name and in fact, up to date with
`origin/main`, and the production branch going forward.

---

## Verification, pre- and post-rebase

The board was earned against the older base and re-earned against the new
one. Totals that changed are the upstream line's own additions.

| layer | pre-rebase | post-rebase |
|---|---|---|
| `run-tests-node` | 43/43 | 43/43 |
| `run-module-tests` | 305/305 | 306/306 (minor bodies 11 to 12, the upstream Ceres test) |
| `check-layer-boundary` | green after the two LAYERS entries | green; 2,166 literals, the rename's footprint |
| remaining gates | all green | unchanged files; not re-run |
| `build-bundle --check` | 11,138,759 bytes | 11,206,915 bytes, the new baseline |

The two LAYERS entries place `incommon-cloud.js` in shell (it moves data and
interprets nothing) and the vendored client in vendored. Adding them was the
gate's own demanded maintenance: the boundary counts did not move.

Browser layer, recorded 21 September: the pure suite ran 43/43 in a real
browser through `verification/Test Runner V1.2.dc.html`, sources hashed
against the post-rebase tree. The integration phase is ENV-SKIPPED: the
documented `window.__incommon` hook no longer exists in the app, and the IT
tests target the retired single-blob storage, not ProfileManager. Restoring
integration coverage is a scheduled harness task: rewrite the IT tests
against the current architecture or expose a deliberate test seam, and fix
the runner's fallback paths while there. The runner also referenced the
retired prototype filename; it was pointed at the real app for this pass,
revertible with `git checkout`, and the scaffolding copies under
`verification/` stay until that task retires them. The runner's waiter
behaved: it timed out, printed a clean IT-ERR, and stayed responsive.

---

## What is actually deployed

Recorded 21 September. `main` is the production branch, up to date with
`origin/main`; the local branch was renamed to match after the rebase, so
branch and upstream agree by construction. `netlify.toml` publishes
`deploy/v6.3` and is generated by the builder, so the pointer cannot drift
again; the hand-edited pointer commit from this pass was rebased away as
redundant, "patch contents already upstream". The site therefore serves the
pre-cloud v6.3 build until the closing sequence runs: the real build of this
tree, the harness once more against the built artifact, the commit and push,
the two Netlify dashboard toggles (asset optimization off, hosting snippet
removed), a fresh deploy, and `check-deployed` re-read. The carried finding
from the v6.2 worklog still governs that gate: Netlify injects a hosting
comment and meta tags and rewrites the cover's href, and until the toggles
are off the served file will not match the built one. The checker was not
weakened in either pass, and should not be.

---

## Open items, in order

1. The closing sequence above: real build, harness re-run, commit and push,
   Netlify toggles, deploy, `check-deployed` green.
2. Step 4 of the cloud build: sign-in surface, `InCommonCloud.inspect()`
   against a real session, the first consent-gated sync, PIN recovery
   through the account email.
3. The consent-language pass: the first-run line "stays on it" and the icon
   or splash artwork if it carries words. The headline change ("Everybody
   has something", "works offline" retired, done globally in source and
   manifest) was the first move of this pass, made deliberately in one pass.
4. `app/memory-store.js` is dormant: not in the module list, reads a legacy
   consent key, sees nothing since the migration moved that key. Revisit or
   remove; build nothing on it.

Recorded 21 September, gate maintenance. check-competitor-surface fired on the scaffolding copy at verification/handoff/calculation-fixtures.json; the canonical fixture in data-contracts was already ALLOWed with reason, because its input string is the assertion. The override was extended to the copy's path rather than the fixture renamed, and the push at 2142782 briefly stood over the red gate until this commit closed it.
## Closing sequence, recorded 21 September

The closing sequence ran and is done. Real build, harness re-run, commit and
push, both Netlify toggles (asset optimization off, hosting snippet removed),
fresh deploy, and check-deployed green. The site serves the cloud build:
cover 57,062 bytes, sha 101b75; app 11,207,031 bytes, sha 327ac5; version
stamp incommon-v6.3 on both; script and style tag counts matching. This is
the first clean deploy in the project's life, and it confirms the carried
v6.2 finding is closed: nothing is injected and nothing is rewritten.

Gate note: check-competitor-surface fired on the scaffolding copy of
calculation-fixtures.json on the day of the close; the canonical fixture was
already ALLOWed because its input string is the assertion, so the override
was extended to the copy's path rather than the fixture renamed. Recorded in
the gate maintenance entry above.

Open item 1 of the previous list is struck by this entry. The list now reads:
1. Step 4 of the cloud build: sign-in surface, InCommonCloud.inspect()
   against a real session, the first consent-gated sync, PIN recovery through
   the account email.
2. The consent-language pass.
3. memory-store.js is dormant; revisit or remove.
4. The integration harness rewrite, which this entry schedules as the next
   move.

## The integration harness rewrite, recorded 21 September

Item 4 above is done. Full account in `docs/integration-harness-design.md`,
written before any test code changed, per the standing rule that
verification precedes the build. Summary:

The V1.2 integration phase drove a retired single-blob prototype
(`window.__incommon`, `?test=1` namespaced storage) that no longer exists;
every one of its twelve `IT*` rows was asserting facts about a program that
doesn't run. Rewritten to cover the actual risk this app carries now:
consent gating, the deletion outbox, PIN gating and profile switching in
`incommon-cloud.js`, the one file this build lets move data off the device.

No new test seam was added. `window.__incommonApp`, `ProfileManager`,
`InCommonCore` and `InCommonCloud` are already unconditional globals, and
`InCommonCloud` already carried `_setConfigForTests` / `_setClientForTests`
for exactly this purpose. Pure consent/outbox logic moved to Node
(`tools/run-module-tests.js`, group K, 12/12) against a hand-built
ProfileManager fixture and a fake Supabase query builder; the browser phase
(`app/handoff/tests.js`, `verification/Test Runner V1.2.dc.html`) boots the
real app in a live iframe, the same pattern `handoff/tests-v6.0.js` already
uses, and drives the real ProfileManager through the real InCommonCloud —
proving the actual wiring, which the Node fixture cannot. 53/53 in the
browser: 43 pure, 10 integration.

**A real bug came out of the first honest run.** `incommon-cloud.js`'s
`factory()` never actually closed over the UMD wrapper's `root` parameter —
it is a separate function expression, evaluated where it is written, not
inside the wrapper's body — so every `root.*` reference (PIN recovery's
session flag, and `lib()`, which `init()` needs to find the vendored
Supabase client) threw `ReferenceError`, silently caught by the module's own
try/catches. PIN recovery has done nothing since it shipped, and `init()`
itself would have thrown the instant anything called it, which would have
hit step 4 above the moment it started. Confirmed with an isolated two-line
Node repro before touching anything. This pass's own instruction was not to
touch the cloud module; asked whether a one-line scoping fix counted, and
the answer was yes. Fixed: `var root = typeof self !== 'undefined' ? self :
this;`, the one line now added at the top of `factory()`, identical to the
outer wrapper's own definition. Nothing that already worked touched `root`
(`push`, `inspect`, the outbox all read `cfg`/`client`/`session`), so group
K stayed 12/12 before and after, and this is the only line changed in
`incommon-cloud.js`. That is not the same claim as "no behavior changed,"
and should not be summarized that way: `lib()` and `init()` go from
throwing the instant anything calls them to actually running, and PIN
recovery goes from silently doing nothing to silently doing nothing no
longer. That is the intended, correct change, and the entry below re-proves
the property that change puts within reach for the first time — unsigned-in
stays inert — rather than assuming it from the fact that nothing else moved.

**A second, smaller bug was in profile-manager.js, not the cloud module**:
`pinHash()` was a private closure function, called internally by
`setProfilePin`/`verifyProfilePin` but never exposed on the `PM` object
`incommon-cloud.js`'s `completePinRecovery()` expects (`pm.pinHash(pin,
profileId)`, documented in that function's own comment). Added `pinHash:
pinHash` to the `PM` object literal. profile-manager.js is not the cloud
module, so this one was not a judgment call.

**Scaffolding retired in the same pass, one commit**: `verification/
incommon-core.js` and `verification/handoff/tests.js` (byte-identical
copies of the `app/` originals, existed only for the offline single-file
runner), `verification/handoff/calculation-fixtures.json` (byte-identical
copy of `data-contracts/calculation-fixtures.json`; the runner now fetches
the canonical path directly), and the two `inCommon Test Runner V1.2
(offline …).html` standalone bundles, whose only reason to exist was
exercising the retired prototype's integration phase offline. The
`check-competitor-surface.js` override for the scaffolding fixture copy
(added during the closing-sequence pass, "kept until the integration harness
rewrite retires it") is removed with it: 14 override entries now, all
justified, none stale. `verification/Test Runner V1.2.dc.html` itself is
kept, same filename — it names the core module suite's own version, not the
app's, and CLAUDE.md's rule against unnecessary renames applies. Its target
pointer to the real app (`../app/inCommonApp v2.dc.html`, no `?test=1`) is
now the actual file content, not a locally-carried edit reverted by `git
checkout`.

Verification for this pass: `run-tests-node` 43/43, `run-module-tests`
318/318 (306 + group K's 12), the full `check-*.js` loop green (excluding
`check-deployed.js`, which compares against the live site and is unrelated
to this pass), `run-fixtures` and `build-bundle --check` both clean,
`check-layer-boundary` green at 2,166 literals (unchanged; nothing here
moved a module across the boundary). The browser phase ran to completion
twice, once finding the two real bugs above and once confirming the fix
(53/53), against a fresh server (a stale `Cache-Control: max-age=3600`
response cached from earlier in this same debugging session masked the fix
on first re-check; not a build issue, recorded here so the next person
doesn't lose an hour to it the way this pass nearly did).

Open items, in order, unchanged by this pass except as struck above:
1. Step 4 of the cloud build: sign-in surface, InCommonCloud.inspect()
   against a real session, the first consent-gated sync, PIN recovery
   through the account email. This item can now actually be built on: PIN
   recovery and init()'s Supabase-client detection both work for the first
   time.
2. The consent-language pass.
3. memory-store.js is dormant; revisit or remove.

<<<<<<< HEAD
## Step 4 built, and the PIN-recovery gap the walk found, recorded 23 September

Step 4 is done: the sign-in surface, `InCommonCloud.inspect()` rendered as
the three grouped counts, Sync now, and PIN recovery, in Settings in both
shells. `PROJECT_URL` and `PROJECT_ANON_KEY` landed in incommon-cloud.js as
the project's own config values, exactly the decision already recorded
above: no environment file, no build-time injection, `init()` falls back to
them when the real app does not supply its own, and the Node test hooks
bypass `init()` entirely so group K stayed 12/12 through the change.
Verified before committing rather than assumed: the key decodes to role
`anon` against the project's own ref, and `grep -r service_role` across the
repo returns only the comment naming the forbidden term.

The acceptance walk ran against the live project, not a fixture. Sign in,
toggle Journal Entries consent through three full cycles, and the would
sync / would stay on this device counts moved 0 to 1 and back in lockstep
with the switch, live, through the real UI. Sync now landed the row;
confirmed independently through the REST API rather than trusting the
UI's own report, `memories` carried the journal entry, `profiles` carried
the profile row, and `consent_events` carried exactly the three events the
walk actually performed. A second account, queried with its own token, saw
an empty `memories` and an empty `profiles`: RLS held at the database, not
only in application code that happens to respect it. "The second account
sees an empty world" was proven through the API rather than through the UI,
because nothing in this pass's own scope pulls and displays remote data
anywhere; a pull-and-display surface is a later pass, not a gap in this
one.

**The walk found a real defect, not a theoretical one.** Signed in,
clicking "Email me a recovery code" made `isRecoverySession()` read true
immediately, before the email was ever sent, let alone opened, because the
check was "the flag is set" and "uid() is truthy," and a session that
already existed satisfied the second half on its own. Anyone holding the
account password could reset the PIN without touching the inbox at all.
`startPinRecovery()` now clears the session synchronously, before the flag
is set, and calls `signOut()` before sending the email, so the check can
only pass again once a fresh sign-in actually happens through the link
this sends. A new `isRecoveryPending()` names the state in between, flag
set, no session yet, so the screen can tell "waiting for the email" from
"the email was opened" instead of guessing from one boolean.

Recovery moved out of the signed-in block on the strength of that fix: it
now signs the reader out the instant it starts, so nesting it inside
"signed in" would have made the UI vanish under its own hand the moment it
was used. It is its own top-level state in Settings now, in both shells,
gated on `cloudRecoveryPending` rather than on being signed in at all.

**IT1's own premise went stale and was caught rather than shipped wrong.**
It asserted `InCommonCloud` stays `off` because "no sign-in surface exists
yet"; step 4 is that surface, so the assertion now is that `init()` runs at
boot and reports `local`, signed into nothing. IT8b is new and permanent:
it signs a fake session in, calls the real `startPinRecovery()`, and
asserts the exact shape of the fix, that the session is cleared, that
`isRecoverySession()` reads false and `isRecoveryPending()` reads true
immediately after, not after some later poll. `fakeClient()` gained a
minimal `auth.signOut`/`auth.signInWithOtp` stub for exactly this row;
every other browser-phase test still reaches a session through
`_setClientForTests`'s own argument, never through these.

Full battery green: run-tests-node, run-module-tests (318/318, group K
unchanged at 12/12), check-layer-boundary, check-purple-text,
check-dead-controls, check-competitor-surface, check-prose-repeats,
build-bundle --check.

Two test Supabase accounts carried this walk, and a live recovery email
actually went to one of them; both are the project owner's to delete once
this pass is read.

Open item 1 of the previous list is struck by this entry. The list now
reads:
1. The consent-language pass.
2. memory-store.js is dormant; revisit or remove.
3. The deploy: rebuild, commit, and `check-deployed`, once this pass is
   merged.

## The deploy, recorded 23 September

Open item 3 above is done. The PIN-recovery fix merged, the branch was
restarted from `origin/main`, and `deploy/v6.3/app.html` and its `index.html`
were rebuilt for real, not `--check`, so the shipped bundle actually carries
what the previous two entries describe: the sign-in surface, `inspect()`,
Sync now, and the corrected recovery flow. Verified before committing:
`grep -rn service_role` on the rebuilt file returns only the comment naming
the forbidden term, and the `InCommonCloud` markup and handlers are present.
The commit touched exactly the two generated files, 258 insertions and 7
deletions; nothing in `app/` or `tools/` moved.

`check-deployed.js` failed on the first read right after the merge, both
pages smaller than the build by the same 20,652 bytes and carrying the
previous version's byte count under the same `incommon-v6.3` stamp, which is
what a deploy still in flight looks like rather than a post-processing
injection: the stamp agreed on both sides, only the bytes lagged. A poll
every 15 seconds against the live site found the match on the eighth
attempt, about two minutes after the merge. Both pages now read identical:
cover 57,062 bytes sha 506ce4, app 11,229,465 bytes sha 950de1,
`incommon-v6.3` on both, script and style tag counts matching.

The two Supabase test accounts from the acceptance walk are still the
project owner's to delete; nothing in this entry touches that.

Open item 3 of the previous list is struck by this entry. The list now
reads:
1. The consent-language pass.
2. memory-store.js is dormant; revisit or remove.
=======
## Re-verification, and re-proving unsigned-in inertness, same day

Follow-up to the entry above, same 21 September. Two things were owed and
had not been done yet: a full re-run of every gate after the `root` fix
(the entry above ran the gates before the fix; the browser confirmation ran
after, but the Node gate loop, `run-fixtures`, `build-bundle --check` and
`check-layer-boundary` had not been re-run against the post-fix tree as a
single pass), and a proper accounting of whether `root` was the only leak
rather than the one this session happened to trip over.

**Full re-run, post-fix.** `run-tests-node` 43/43, `run-module-tests`
321/321 (see below for the +3), the full `check-*.js` loop green, `run-
fixtures` and `build-bundle --check` clean, `check-layer-boundary` green at
2,166 literals, unchanged. Also confirmed directly in a real browser, not
assumed from the Node repro: `window.supabase.createClient` now resolves
inside `lib()`, and a real `InCommonCloud.init()` call returns a working api
and moves `status().mode` from `'off'` to `'local'` — the first time that
path has ever completed anywhere. No network request beyond the same-origin
vendored script, nothing left in localStorage.

**Every other identifier `factory()` touches, checked against the wrapper's
scope.** Full account in `docs/integration-harness-design.md`. Two passes:
a static read of all 38 names `factory()` declares against every free
reference in its body (parameters, real JS built-ins, or those 38 — nothing
else), and a dynamic trace, a `vm` context whose global object is a `Proxy`
recording every name that falls through to it, driven through every
exported method including paths this harness does not otherwise exercise
(`pullAll`, `signUp`/`signIn`/`signOut`, the real `onAuthStateChange`
callback firing, the real `pm.subscribe` callback firing for both event
types, and the real debounce timer actually elapsing). One name was caught,
`module`, in the *outer* wrapper's own `typeof module === 'object'` UMD
guard, which is deliberate and correct. Nothing else. `root` was the only
leak; the fix was not widened.

**The property most worth re-proving was the module's own header claim**:
"if this module is absent, inert, or unsigned-in, the app is exactly the
offline-first program it was yesterday." Before the fix, "unsigned-in" was
unreachable through `init()` at all, so that clause had never actually been
checked, only assumed true because nothing could reach the code that would
disprove it. Checked now, against the real path, in both harnesses:

- `tools/run-module-tests.js` K12-K14 (group K is now 15/15): a second,
  isolated instance of the module in its own `vm` context with a fake
  `self.supabase.createClient`, driven through the real `init()` rather
  than the test-seam bypass. `init()` returns a working api, `status().mode`
  reads `'local'` (K12). Unsigned, `push()` refuses before the fake client
  is ever touched (K13), and letting the real 1200ms debounce timer actually
  fire produces the same zero (K14) — proof that nothing downstream of a
  live ProfileManager event reaches the client while unsigned, not only
  that `push()` guards its own entry.
- `verification/Test Runner V1.2.dc.html` IT1c/IT1d (integration is now
  55/55, 12 IT rows): a real `init()` call against the real vendored
  `window.supabase`, unsigned, in its own throwaway iframe — separate from
  the one IT2-IT9 share, because `init()` wires `pm.subscribe()` with no
  unsubscribe, and running this against the same ProfileManager instance
  would leave every later profile/memory write in the main flow also
  scheduling a debounced push against whatever fake client happens to be
  active several steps later. Returns a working api (IT1c);
  `performance.getEntriesByType('resource')` shows nothing reaching
  Supabase or the fake test URL, checked again after `push()` and after the
  real debounce fires (IT1d) — the same network-timeline evidence IT1b
  already uses for "before `init()` is ever called," now applied to "after
  a real `init()` call, still unsigned."

Totals after this entry: `run-tests-node` 43/43 (unchanged), `run-module-
tests` 321/321, browser phase 55/55 (43 pure + 12 integration). Committed
separately from the fix itself, since the fix landed first and this is the
re-proof the fix's own commit message should have carried instead of "zero
behavioral change."
>>>>>>> 9a2209d (re-prove unsigned-in inertness through the real init() path, not the bypass)
