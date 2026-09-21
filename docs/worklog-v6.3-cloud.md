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