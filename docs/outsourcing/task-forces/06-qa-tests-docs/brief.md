# Brief 6: QA, Unit Testing & Documentation

Shared entry: [FOUNDATION.md](../../FOUNDATION.md) and the current
[role prompts](../../BOT-PROMPTS.md), with the central roster and programme.
Use the same startup and completion receipts as every other role.

## Current handoff

Preserve the unique sleep commits named in Current values. Reconcile main
without resetting them, rerun their checks and retain historical limits.
Complete 6.1 Task 1 before new 6.2 reference work. Counts below are historical.
Reuse the study RLS harness; distinguish remaining 2.1 from completed 2.2.

Agents: named in the roster in 00-README.md, workstream 6 (Task Force 6).
Branch: the Task Force 6 branch named in CHARTER.md (since 28 October 2026).
Read 00-README.md, CHARTER.md and CLAUDE.md first.

## What exists today

Node gates (fast, no browser), all in tools/:
- run-tests-node.js: 43 pure assertions from the V1.2 suite.
- run-fixtures.js: the per-commit calculation gate (numerology and angel
  number vectors).
- run-module-tests.js: 435 assertions over the modules, lettered by module
  (B birth-time, C hd-composite, K incommon-cloud, and so on).
- check-dead-controls.js, check-purple-text.js, token-compare.js,
  check-layer-boundary.js, check-three-lifecycle.js, and more check-*.js.

Browser checks:
- verification/: the harness. Phases M (acceptance matrix, 90), E
  (breakpoint crossing, 5), F (functional sweep, 16), G (accessibility, 35),
  T (themes, 64), R (removal, 14), N (new surfaces, 58), H (the cover, 17).
  The rows live in app/handoff/tests-v6.0.js.
- tools/drift-check.js runs M, E, F, G, T, R and N against the built bundle
  (add --with-h for H; add --record-baseline only after a green --force run).
- tools/drive-cover.js: P13 and P15, the cover's Continue paths.

The last full run on main is recorded under "Current values" in
00-README.md.

## The job

1. Coverage. List which screens, modules and server functions have no test.
   Rank by risk (reader data, money, safety controls first). Write the
   missing tests, highest risk first. Known gaps to start with:
   - the registration card's submit path (regSubmit in the app): validation,
     the profile cutover, the two settings switched on. Drive it with
     Supabase faked, the way tools/drive-cover.js and the K rows fake it.
   - the ring handoff overlay: present after the cover's exit, gone after
     incommon:ready, never replayed on reload.
   - server/*/index.ts edge functions: no tests exist. Add a Deno or Node
     harness that runs each with a faked Supabase client.
2. Flakiness. Run the full sweep five times. Any row that changes result
   between runs gets investigated to its cause and fixed at the cause. E5
   (an uncaught three.js error during resize) was a real bug, not a flaky
   test; assume the same until proven otherwise. CLAUDE.md: "A test that
   fails on a slow machine and passes on a fast one is worse than no test."
3. Documentation.
   - README.md describes V1.7 and deploy/v6.2; bring it up to date with
     deploy/<current>/, the gates above, and how to run each.
   - docs/README-RUN-LOCALLY.md is from August; rewrite it from what actually
     works today.
   - data-contracts/local-storage-schema.md is being rewritten by workstream
     1; link to it, do not duplicate it.
   - Keep CLAUDE.md in its own voice: each section says what was decided, why,
     and what fault it prevents. Do not shorten or delete existing sections;
     consolidating is fine only where two sections say the same thing.

## Rules specific to this work

- Never weaken an assertion to make it pass. An expected value changes only
  when the behaviour was changed on purpose, and the commit says which change.
  (Example done right: drift-check expected 33 G rows; main produced 35 with
  the same row ids on both branches, so the count was corrected with that
  evidence in the commit.)
- A test must fail against the bug it guards. Prove each new test by running
  it against code with the fault put back, and say so in the commit.
- Every new browser test serves the repo itself and fakes every outside
  service: Supabase, Stripe, Cloudflare. No test touches production.
- No em or en dashes, including in test names and docs. The detector in
  oki-voice-v144.js builds its pattern from String.fromCharCode for a reason;
  never put the characters in a fixture that does not test for them.
- Other workstreams add rows for their own work. You own the harness
  structure; do not remove their rows.

## Done means

- A coverage table in docs/TEST-COVERAGE.md: what is tested, by which gate,
  and what is not, ranked by risk.
- New tests for the top gaps, each proven to fail against the fault.
- README.md and docs/README-RUN-LOCALLY.md current.
- Every gate in 00-README.md passes, five sweeps in a row.

## Secondary and tertiary

Approved by the owner on 27 October 2026. "Helpers" in 00-README.md applies
to every block below: the browser runner, shared seats, and the helper log
every pull request ends with. Who holds each seat is in the roster.

**Secondary** (repo access). Reviews every new test and every rewritten
document. If its context is under about 150k tokens it cannot hold the app
file (about 713k tokens), CLAUDE.md in full (about 106k), or
app/handoff/tests-v6.0.js (about 44k) together with tools/run-module-tests.js
(about 54k), so it reviews one file per pass. For assignment 6.1:

1. tools/run-gates.js
   - runs every tools/check-*.js except check-deployed.js, and every drive:
     compare its list with "ls tools/check-*.js tools/drive-*.js";
   - exits non-zero when a gate fails: prove it with a throwaway gate that
     exits 1;
   - runs no browser under --fast.
2. The CI workflow
   - triggers on "pull_request", never "pull_request_target";
   - has "permissions: contents: read" and no secrets;
   - pins its actions to a version, and runs only --fast.
3. For at least one new test per PR, put the fault back and see red.
4. The edge function harness holds no real key. Grep the PR for "eyJ",
   "sk_", "service_role" and "re_", and post the counts.
5. Every command in README.md and docs/README-RUN-LOCALLY.md is run as
   written, with the output attached.

Each new test must also fake every outside service, and its name and
expected values must say what the behaviour is, in plain words.

**Tertiary** (chat only, no repo). Draft learning documentation and
proofread approved public or sanitized prose, under the standing strategy.
Supply actual labels and confirmed behavior. Keep planned features separate;
the repository owner verifies each claim against the build before applying it. The result must still follow the repository's rules: no em or en
dashes, no disclaimers, and nothing that explains a screen before it is
opened. Never paste test code, server/ code, data-contracts/, anything about
workstream 2's work, or any address or key.
