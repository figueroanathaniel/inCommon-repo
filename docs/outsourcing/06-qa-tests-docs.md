# Brief 6: QA, Unit Testing & Documentation

Agents: named in the roster in 00-README.md, workstream 6.
Branch: qa/<topic> from current main.
Read 00-README.md and CLAUDE.md first.

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

**Secondary.** Reviews every new test and every rewritten document. While
the seat is held by an agent with about 100k tokens of context (see the
roster), its context cannot hold the app file (about 713k tokens),
CLAUDE.md in full (about 106k), app/handoff/tests-v6.0.js (about 44k) together
with tools/run-module-tests.js (about 54k), so it reviews one file per pass.
For each new test it confirms:
- the test fails against the fault it guards (the commit says how this was
  proven; the reviewer repeats it for at least one test per pull request);
- it fakes every outside service;
- its name and expected values say what the behaviour is, in plain words.
For documents it checks every command in them actually runs as written.

**Tertiary.** Assumed chat only, with no repo, unless the roster says
otherwise. Use it only to
proofread prose: a README paragraph, a section of docs, the wording of a
test name. Paste the paragraph, ask for plainer wording, and apply the result
by hand. Its suggestions must still follow the repo's rules: no em or en
dashes, no disclaimers, no explaining a screen before it is opened. Never
paste code from server/, data-contracts/, security findings, or anything
containing a key or an address that is not already public.
