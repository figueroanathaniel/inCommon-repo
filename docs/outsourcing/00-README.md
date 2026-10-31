# inCommon outsourcing: index, shared rules, ownership

Six workstreams run in parallel on figueroanathaniel/inCommon-repo, each as a
task force with its own branch and folder (`task-forces/`). Every agent reads
THIS FILE, FOUNDATION.md and PROGRAMME.md first, then its task force's
CHARTER.md, brief.md and numbered assignment. BOT-PROMPTS.md supplies the
role prompts and FOUNDATION.md supplies the common startup/completion receipts. What comes
next across all six is `PROGRAMME.md`.

## The roster

**This file is the only place agent names are mapped to roles.** The briefs speak of
"the primary", "the secondary" and "the tertiary" and never name a model, so
reassigning a seat is a one cell edit here and nothing else. See "Changing
these docs" at the end.

| # | Workstream | Primary | Secondary | Tertiary | Bounded support / fallback | Brief |
|---|---|---|---|---|---|---|
| 1 | Data Mapping & Schema Architecture | Claude Opus 5.5 | Gemini Argon 4 | Free Perplexity | none | task-forces/01-data-schema/brief.md |
| 2 | Security Hardening & RLS | Claude Opus 5.5 | Claude Opus 5.5 (separate blind session) | Meta AI (public questions only) | Haiku 5.5 or Nemotron 3.5 Lightning: policy drafts under the primary | task-forces/02-security-rls/brief.md |
| 3 | Refactoring & Feature Additions | DeepSeek V4.1 Flash | Kimi (Instant) | Nemotron 3.5 Lightning | GPT-6.1 Sol: bounded mathematics through the file owner | task-forces/03-refactor-features/brief.md |
| 4 | Interactive Visuals (WebGL / three.js) | GPT-6.1 Sol | Haiku 5.5 | Meta AI (descriptions only) | Claude Opus 5.5: cap fallback; Nemotron 3.5 Lightning: execution evidence | task-forces/04-visuals-webgl/brief.md |
| 5 | Load Time & Performance Tuning | MiMo Slow | DeepSeek V4.1 Flash | none | Merlin basic models: bounded optimization suggestions | task-forces/05-performance/brief.md |
| 6 | QA, Unit Testing & Documentation | Nemotron 3.5 Lightning | Haiku 5.5 | Free Gemini | none | task-forces/06-qa-tests-docs/brief.md |

Owner direction: standing strategy of 30 October 2026, synchronized on
31 October. Support does not acquire file ownership or independent sign-off.
Preserve the repository-capable schema secondary and the visual secondary;
the named visual fallback takes over only with an actual handoff.


### What each agent can do

The briefs use roles and access limits, not capability assumed from a model
name. Confirm the actual session's tools and budget. An unlisted agent receives
no repository or private-data access by default.

| Agent | Repo access | Context / budget handling | Use |
|---|---|---|---|
| Claude Opus 5.5 | authorized repo session; verify tools | verify actual limit | architecture, security, approved fallback |
| Gemini Argon 4 | authorized repo session; verify tools | verify actual limit | independent schema review |
| DeepSeek V4.1 Flash | authorized repo session; verify tools | bounded ranges | features; independent performance re-measurement when not its author |
| GPT-6.1 Sol | authorized repo session; verify tools | targeted reads; checkpoint at caps | visuals and mathematical implementation |
| MiMo Slow | authorized repo session; verify tools | checkpoint within reported allowance | measured performance audits |
| Nemotron 3.5 Lightning | authorized repo session; verify tools | actual limits checked | QA, structural review, execution evidence |
| Kimi (Instant) | authorized repo session; verify tools | sparingly; existing consult limits apply | bounded precision decisions |
| Haiku 5.5 | authorized repo session; verify tools | one file per pass when needed | independent QA/visual review, short edits, policy drafts |
| Free Perplexity | no, chat only | public questions only | source and convention research |
| Meta AI | no, chat only | public or sanitized packet | visual descriptions; public documentation questions |
| Free Gemini | no, chat only | approved sanitized prose | draft learning documentation and editorial QA |
| Merlin basic models | chat only unless separately authorized | one measured hotspot | optimization suggestions |

Free/unlimited access and the reported 30-hour allowance are owner budgeting
assumptions, not verified platform guarantees. Listing a role does not
schedule it, dispatch it or record delivery.

### Prompt routing

Every repository prompt inherits FOUNDATION.md and the current programme.
Prompt bodies use roles; this is the only model-to-prompt mapping.

| Agent / use | Prompt IDs in BOT-PROMPTS.md |
|---|---|
| GPT-6.1 Sol | V1; scoped mathematics from Features |
| Claude Opus 5.5 | A1, S1, H1; blind security secondary under brief 2 |
| Gemini Argon 4 | A3 |
| DeepSeek V4.1 Flash | F1; performance secondary under brief 5 |
| Kimi (Instant) | F2 |
| Nemotron 3.5 Lightning | F3, Q1, S2; bounded visual execution support |
| Haiku 5.5 | Q2, S2 |
| MiMo Slow | P1 |
| Merlin basic models | P2 |
| Meta AI | V2; public questions under brief 2 |
| Free Perplexity | A2 |
| Free Gemini | Q3 |


"Chat only" puts an agent under the second row of "What may be shared with
whom". A context under about 150k tokens puts it under "Working inside a
context limit".

## Current values

Facts that change as the project moves. The briefs refer to these by name
(for example `deploy/<current>/`) rather than writing them out, so updating
this block updates every brief.

| Name | Value |
|---|---|
| Base branch | main |
| Shared foundation | FOUNDATION.md, revision 2026-10-31.1; role prompts in BOT-PROMPTS.md |
| Instruction review baseline | main 7ccc5e0be88e53061147eb4a1a16ef8fb2789012, 31 October 2026, after #141; refresh before work |
| Standing PR lookup | No task-force PR open at this review. Refresh GitHub; prior charter numbers are history |
| Remote branch check | Task Forces 1 to 5 are behind main with no unique commits at this review. Task Force 6 is diverged: two unique commits, bc43557 and 07f97a2. Preserve them and reconcile main; do not reset |
| QA work outside main | tools/check-hd-sleep.js and 6.2-task1-sleep-qa-record.md on taskforce/06-qa-tests-docs at 07f97a2. Old-tree Node/module evidence is recorded; current integration/browser and secondary review are owed |
| Existing study policy harness | tools/check-hd-study-rls.js; requires its local/test database for actual policy evidence |
| Shared tools absent from reviewed main | tools/run-gates.js, tools/dump-render-vals.js, tools/measure-load.js, tools/check-hd-reference.js, tools/fixtures/hd-reference.json; recheck before creating |
| Scope of instruction review | Repository/branch/document evidence; no new full application gate run or production audit |
| `<current>` deploy folder | deploy/v6.4/ (so `deploy/<current>/` is deploy/v6.4/) |
| Last recorded full gate run on main (historical) | c259e80, 27 October 2026: every README gate green (drift-check M, E, F, G, T, R, N; drive-cover 3/3, drive-routes 2/2, drive-swipe 4/4; run-module-tests 435/435), plus the 23 other check-*.js gates. H not run. |
| Browser gate runner (Helpers, item 1) | the owner's Claude Code cloud session, which has Chromium and Playwright; ask the owner to start one |
| Workstream 4's merged work so far | PR #92, PR #93, PR #97 |
| Workstream 2's merged work so far | PR #129 to PR #136, the last merged into main at 2d35c82 on 31 October 2026 |
| Merged fixes since the briefs were written | PR #94 (H11 untimed), PR #98 (Back after a routed arrival), PR #99 (swipes mid move) |

File sizes and token counts quoted in the briefs and below are a snapshot
from 27 October 2026. Measure again before relying on one.

## Assignments and their status

A brief says how a workstream works; an assignment says what to do next.
Assignments live in each task force's folder, one plain text file each,
numbered `<workstream>.<round>` (1.1 is workstream 1's first). Each file
carries its own status line; the task force's CHARTER.md keeps the status and
the delivery record, and this board mirrors the status.

| # | Primary assignment | Status | Secondary and tertiary instructions | Status | Workstream reported |
|---|---|---|---|---|---|
| 1 | task-forces/01-data-schema/1.1-schema-first-assignment.txt (1.1) | DONE | in its brief, "Secondary and tertiary" | DONE | first round done, PR #96 merged; Task 4 continues as 1.4 |
| 2 | task-forces/02-security-rls/2.1-security-first-assignment.txt (2.1) | READY | in its brief, "Secondary and tertiary" | READY | 2.1 not started; 2.2 separately DONE by the owner, with #129 to #136 merged |
| 3 | task-forces/03-refactor-features/3.1-refactor-first-assignment.txt (3.1) | READY | in its brief, "Secondary and tertiary" | READY | ready to work |
| 4 | task-forces/04-visuals-webgl/4.1-visuals-first-assignment.txt (4.1) | READY | in its brief, "Secondary and tertiary" | READY | large graphics update in flight |
| 5 | task-forces/05-performance/5.1-performance-first-assignment.txt (5.1) | READY | in its brief, "Secondary and tertiary" | READY | reviewing |
| 6 | task-forces/06-qa-tests-docs/6.1-qa-first-assignment.txt (6.1) | READY | in its brief, "Secondary and tertiary" | READY | running |

### Round 2: the Human Design upgrade

The study and the routing are in `docs/hd-upgrade/` (01, the competitive
study; 02, the delegation plan and the owner's decisions D1 to D6).

| # | Assignment | Status | Can start |
|---|---|---|---|
| 3 | task-forces/03-refactor-features/3.2-features-hd-assignment.txt (3.2) | READY | now, beside 3.1 |
| 6 | task-forces/06-qa-tests-docs/6.2-qa-hd-assignment.txt (6.2) | READY | after 6.1 Task 1; preserve existing sleep QA work in Current values |
| 1 | task-forces/01-data-schema/1.2-schema-hd-assignment.txt (1.2) | READY | partial implementation merged through #129; reconcile remaining rollout; 2.2 is DONE |
| 2 | task-forces/02-security-rls/2.2-security-hd-assignment.txt (2.2) | DONE | done; PR #129 to #136 merged |
| 4 | task-forces/04-visuals-webgl/4.2-visuals-hd-assignment.txt (4.2) | READY | once 4.1 posts that the graphics update has merged |
| 5 | task-forces/05-performance/5.2-performance-hd-assignment.txt (5.2) | READY | after the JPL deferral (5.1) merges |

Their secondaries and tertiaries work as each brief's "Secondary and
tertiary" section says, with the additions written into each assignment.

### Task forces

From 28 October 2026 each workstream is a task force with its own branch
and its own folder under `task-forces/`, holding its charter, its brief and
every assignment. `task-forces/README.md` is the shape and the list. A task
force's charter keeps its own status and delivery table, and the rows here
mirror the status.

| # | Seat | Assignment | Status |
|---|---|---|---|
| 1 | Primary | task-forces/01-data-schema/1.3-hd-mapping-primary.txt (1.3) | DONE |
| 1 | Secondary | task-forces/01-data-schema/1.3-hd-mapping-secondary.txt | DONE |
| 1 | Tertiary | task-forces/01-data-schema/1.3-hd-mapping-tertiary.txt | DONE |
| 1 | Primary | task-forces/01-data-schema/1.4-schema-followups-assignment.txt (1.4) | READY |
| 4 | Primary | task-forces/04-visuals-webgl/4.3-webgl-engine-doc-assignment.txt (4.3) | READY |
| 6 | Primary | task-forces/06-qa-tests-docs/6.3-integration-validation-assignment.txt (6.3) | READY |

1.3 is the Human Design logic map, asked for by the owner on 28 October
2026: research, reconcile and map the Human Design logic end to end, keep the
schema definitions as an Obsidian vault (data-contracts/hd-vault/), and
cross verify the positions through the tertiary.

1.3 is concluded by the owner; its Chart address note is what 1.2's notes
attach to. Preserve its review exception and named follow-ups; do not repeat
the completed mapping. 1.4 is 1.1's Task 4, reissued. 6.3 is priority 9 on
`PROGRAMME.md` and 4.3 (6.4 until E16 moved it) is priority 1; their
secondaries and tertiaries work as each brief's "Secondary and tertiary"
says, and 4.3 is reviewed by the workstream 6 secondary.

The statuses are DRAFT, AWAITING OWNER APPROVAL, READY (approved and safe
to hand over), ISSUED (handed to the agent) and DONE. The helper
instructions were approved by the owner on 27 October 2026. **This branch does
not merge until every cell in both status columns reads READY or later.**
An assignment that depends on a private addendum (2.1) says so in its own
text; the addendum itself never enters this public repository.

## What each role does

- **Primary** does the work. It owns the branch and opens the pull request.
- **Secondary** reviews the primary's pull request before it merges, as an
  independent second pass, and takes the branch over if the primary stalls
  or fails twice on the same problem. It gets the same brief and the same
  rules. Its review is a comment on the pull request: findings, each with a
  file and line, ranked by severity, and a clear "ready to merge" or "not
  ready". It does not push to the primary's branch unless it has taken over.
- **Tertiary** gives narrow, bounded help when the primary or secondary asks
  for it: a documentation lookup, a check of one function, a proofread, a
  rerun of the gates. It never owns a branch, never merges, and only sees
  what the rules below allow.

Each brief ends with a section saying exactly how its secondary and tertiary
are used.

## Helpers

Decided by the owner on 27 October 2026. These apply to every workstream
and every brief's "Secondary and tertiary" section.

1. **Who runs the browser gates.** Every repository-capable helper confirms on its first task
   that "node tools/drive-swipe.js" runs on its machine. When none of a
   workstream's agents can run the browser gates (drive-*.js, drift-check,
   the H phase), the PR is labelled "needs browser gates" and goes to the
   browser runner named under "Current values". A browser gate that did not
   run is never reported as passed.
2. **Agents that hold more than one seat.** An agent may hold seats in
   several workstreams (the roster shows which). Its own workstream comes
   first, and helper requests from the others are answered within the same
   working session they arrive in. Holding two seats never means reviewing
   your own work: an agent never reviews a PR it wrote.
3. **A secondary that is the same model as its primary reviews blind.** It
   starts from the brief and the branch only, writes its own findings before
   seeing the primary's, and then compares. For workstream 2, it does not
   receive the private addendum until its own list is written.
4. **Workstream 5 has no tertiary.** Its secondary re-measures
   independently, and the browser runner covers any gate its agents cannot
   run. The support-column optimization helper is bounded assistance, not
   a new tertiary or independent approval seat.
5. **Every PR ends with a "Helpers" section, the helper log.** It lists
   each secondary review and each tertiary consult: who, when, the question
   as asked (word for word for a chat only helper), the answer's source,
   and how the answer was checked against the code. A chat only consult
   with no recorded check counts as not having happened.

## What may be shared with whom

| Agent kind | Repo access | May be shown | Must never be shown |
|---|---|---|---|
| Primaries and secondaries working in the repo | yes | the repo, its docs, test output | secrets of any kind |
| Chat only agents ("no, chat only" in the roster) | no | a general question, a pasted snippet of public code, a draft paragraph of docs | secrets, the contents of server/ or data-contracts/, any unfixed security finding, any reader's data, the Supabase project's ref or URL |

A chat-only tertiary answers questions; its answer is checked against the
code before anything is built on it. Ask it things like "what is the correct
Postgres syntax for a policy that ...", never "here is our schema, find the
holes".

## Working inside a context limit

Two files are bigger than most of these models can hold:

| File | Size | Rough tokens |
|---|---|---|
| app/inCommonApp v2.dc.html | 2.85 MB | about 713k |
| CLAUDE.md | 425 KB | about 106k |

So no agent loads the app file whole. Search it (grep or ripgrep) and read
line ranges around what you need. Every value bag is a method on the logic
class (authVals, regVals, supportVals, ...), and every screen has a
data-screen-label, so both are easy to find by name.

An agent whose context is under about 150k tokens (see the roster) does
not read CLAUDE.md in full either. It lists the headings
("grep -n '^## ' CLAUDE.md") and reads the sections its brief names, plus
"Zero em dash", "Style", "Colour rules that are not negotiable" and
"Touch targets". Every other agent reads it in full, as rule 1 says.
Everything else in the repo fits comfortably: the 3D stages are 25k to 30k
tokens each, app/cover.html about 31k, app/incommon-cloud.js about 24k.

## Rules for every agent

1. Read CLAUDE.md before changing anything, in full unless your context is
   too small (see "Working inside a context limit"). It is long because every
   rule in it was paid for. Where this file and CLAUDE.md disagree, CLAUDE.md
   wins, and you say so in your pull request.
2. Never commit to main. Work on your task force's branch
   (`taskforce/<nn>-<slug>`, named in its CHARTER.md), under its standing
   pull request, as "How work moves on the branch" in the charter says.
3. Never put a secret in the repository or in a chat: no service role key,
   Stripe key, webhook secret, model API key or password. Secrets live in the
   Supabase, Stripe and Netlify dashboards. The Supabase anon key and the
   Turnstile site key are public by design and already in the code.
4. Never run anything against the production Supabase project, Stripe or
   Netlify. Write migrations, policies and setup steps as files; the owner
   applies them. If a step can only be done in a dashboard, write it as a
   numbered instruction in your pull request.
5. No em dashes or en dashes anywhere: code, comments, copy, docs. Use a
   comma, a colon or a full stop.
6. Never edit vendored files: three.module.js, three.core.js,
   react-18.3.1.production.min.js, react-dom-18.3.1.production.min.js,
   supabase-js-2.57.1.umd.min.js, support.js, ios-frame.jsx, doc-page.js.
7. deploy/ is generated. After changing anything in app/, run
   "node tools/build-bundle.js" and commit the rebuilt deploy/<current>/ files
   with your change. Never edit deploy/ by hand.
8. Never weaken a test to make it pass. A test's expected value changes only
   when the behaviour was changed on purpose, and the commit says why.
9. Stay inside the files your workstream owns (table below). If you need a
   change in a file another workstream owns, describe it in your pull
   request instead of making it.

10. Use FOUNDATION.md's startup and completion receipts. Reconcile current
    main, branch work, delivery and owner status. BOT-PROMPTS.md is the role
    prompt set; older pasted prompts are historical.

## The gates (all must pass before any pull request)

Run from the repo root. If require('playwright') fails, set NODE_PATH to the
output of "npm root -g".

    node tools/build-bundle.js
    node tools/run-tests-node.js
    node tools/run-fixtures.js
    node tools/run-module-tests.js
    node tools/check-dead-controls.js
    node tools/check-purple-text.js
    node tools/token-compare.js
    node tools/check-layer-boundary.js
    node tools/check-three-lifecycle.js
    node tools/drive-cover.js
    node tools/drive-routes.js
    node tools/drive-swipe.js
    node tools/drive-register.js
    node tools/drift-check.js --force

Workstreams 4 and 5, and anyone touching app/cover.html, also run
"node tools/drift-check.js --force --with-h". The H phase can take over ten
minutes under software rendering.

The last full run on main is recorded under "Current values".

## Who owns which files

| Area | Owner | Others may not edit |
|---|---|---|
| server/*.sql, server/*/schema.sql (tables, columns, indexes, migrations) | 1 Schema | yes |
| data-contracts/ | 1 Schema | yes |
| app/profile-manager.js | 1 Schema | yes |
| app/incommon-cloud.js: buildPlan, push, pull, merge, row mapping | 1 Schema | yes |
| RLS policies, server/mfa-policies.sql, grants | 2 Security | yes |
| server/*/index.ts (edge functions: auth checks, input validation) | 2 Security | yes |
| app/incommon-cloud.js: auth, session, sign in, Turnstile | 2 Security | yes |
| deploy/<current>/_headers, the root _redirects security rules, sw.js scope rules | 2 Security | yes |
| app/inCommonApp v2.dc.html (screens, logic, markup) | 3 Features | coordinate with 5 on boot() |
| content modules (placement-content.js, timing-lexicon.js, tarot.js, ...) | 3 Features | yes |
| app/cover.html renderer module and shaders, the ring | 4 Visuals | yes |
| app/chart-scene.js, cycle-scene.js, hd-scene.js, body-globes.js, flight.js | 4 Visuals | yes |
| tools/check-three-lifecycle.js | 4 Visuals | yes |
| docs/WEBGL_ENGINE.md | 4 Visuals | yes; workstream 6 reviews it |
| tools/build-bundle.js inlining, sw.js precache list, module loaders | 5 Performance | yes |
| tools/measure-load.js, docs/PERF-BASELINE.md | 5 Performance | yes |
| tools/run-*.js, tools/check-*.js (except check-three-lifecycle.js), tools/dump-render-vals.js, verification/, app/handoff/ | 6 QA | others ADD rows for their own work, never remove |
| docs/ and CLAUDE.md | 6 QA consolidates | everyone adds a section for their own work |

## Merge order

Merge in this order, rebasing each branch on main after the one before it
lands. Run every gate again after each merge.

1. Schema (1): everything else reads the data model.
2. Security (2): writes the policies for whatever (1) added.
3. Features (3).
4. Visuals (4).
5. Performance (5): measures the app as it will ship, so it goes after the
   features and visuals that change its weight.
6. QA (6): continuous, but its final documentation pass merges last.

## What every pull request contains

- What changed and why, in plain words.
- The output of every gate.
- Anything the owner must do in a dashboard, as numbered steps.
- Anything left undone or uncertain, stated plainly.

## Changing these docs

These files are working documents, not a contract. Change them whenever the
plan changes, and keep them in the shape below so the next change stays
small. Commit each change on its own branch (docs/outsourcing-<topic>) with a
line in the change log at the end of this file; a change that belongs to
one task force goes on that task force's branch instead.

**Reassign a seat.** Only with the owner's approval. Edit the cell in "The
roster", and for a workstream that is a task force add a line to its
charter's "History". If the new agent is not
in "What each agent can do", add its row with its repo access, context and
any limit on use. Nothing in the briefs changes, because the briefs ask what
an agent can do rather than who it is. If the new agent is chat only, check
the brief still makes sense for a helper with no repo (for example a
secondary that has to run gates cannot be chat only) and move the seat or the
duty if it does not.

**Change how a helper is used.** Edit the "Secondary and tertiary" section at
the end of that workstream's brief. Write the duty in terms of the role and
its traits ("if the secondary's context is under about 150k tokens, review
one file per pass"), never in terms of a model name, so the duty survives the
next reassignment.

**Drop or add a helper.** To drop one, write "none" in its roster cell and
replace its paragraph in the brief with one line saying no one holds the
seat. To add a fourth kind of help, add a column to the roster and a
paragraph to the brief; do not add a second roster.

**Add a workstream.** Stand it up as a task force (`task-forces/README.md`,
"Standing up the next task force"): a folder with a charter and a brief in
the shape of the others (a title, a line saying the agents are named in the
roster, "What exists today", the work, the files it owns, and "Secondary and
tertiary"). Number it 07 and onward, add its row to the roster, add its
files to "Who owns which files", and place it in "Merge order". Retiring a workstream is the reverse; keep its
number unused rather than renumbering the others, because pull requests and
commits refer to briefs by number.

**Issue a new assignment.** Copy the shape of an existing one in the task
force's folder: the number, a status line, the commit it was written
against, who (by role), what to read, the tasks, hard rules and "Done
means". Name it like the others, `<workstream>.<round>-<topic>.txt`
(`1.4-schema-something-assignment.txt`), add its row to the charter and to
"Assignments and their status" at DRAFT, and move it to READY only once the
owner has approved it. An assignment that names a security weakness not yet
fixed stays out of the repository.

**Update a fact.** Paths, versions, commits and pull request numbers that
move belong in "Current values" and nowhere else. If a brief needs one, it
names the value (`deploy/<current>/`) instead of writing it out.

**When these docs and CLAUDE.md disagree, CLAUDE.md wins** (rule 1). Fix the
doc here rather than working around the difference.

## Change log

- 27 October 2026: written. Six workstreams, primaries, secondaries and
  tertiaries assigned by the owner.
- 27 October 2026: round 2 approved by the owner, all six READY; D2
  decided, the tradition is followed.
- 27 October 2026: round 2 drafted, the Human Design upgrade: the study and
  delegation plan in docs/hd-upgrade/, six assignments awaiting approval.
- 27 October 2026: secondary and tertiary instructions approved by the
  owner and written into each brief; "Helpers" added; every cell on the
  status board READY.
- 27 October 2026: round 1 assignments added under assignments/, with the
  status board; main c259e80 recorded as the last green run.
- 27 October 2026: committed to the repo under docs/outsourcing/. Model
  names gathered into the roster, facts that move gathered into "Current
  values", and "Changing these docs" added.
- 28 October 2026: Delegation 1 drafted, the Human Design logic map: one
  instruction file each for the primary, secondary and tertiary of
  workstream 1, at DRAFT until the owner approves them.
- 28 October 2026: Task Force 1 constituted by the owner. Its branch is
  dedicated to Delegation 1, and its brief and assignments 1.1 to 1.3 moved
  into task-forces/01-data-schema/ with a charter; task-forces/README.md
  sets the shape the other five repeat. Seats unchanged, subject to
  substitution on the owner's approval.
- 28 October 2026: assignment 1.3 approved by the owner, all three files
  READY.
- 28 October 2026: every workstream is a task force. Briefs 2 to 6 and
  their assignments moved into task-forces/<nn>-<slug>/ with a charter
  each, assignments/ retired, rule 2 points at the task force branches,
  PROGRAMME.md holds the owner's nine priorities, and 6.3 and 6.4 were
  drafted for priorities 9 and 1.
- 28 October 2026: 6.3 and 6.4 approved by the owner, READY.
  docs/WEBGL_ENGINE.md drafted from the code on the Task Force 6 branch,
  for review by the workstream 4 secondary.
- 28 October 2026: #110 to #115 merged; every task force branch restarted
  from main. The owner approved efficiency edits E1 to E16: the tertiary
  asks no bulk positions (E1); 1.3, 6.2 and 3.2 share their checks rather
  than repeating them (E2 to E5); workstream 6 builds the one edge function
  harness (E6) and the render dump tool (E14), and run-gates.js comes first
  (E13); 1.1 is DONE and its Task 4 is 1.4 (E7); #95 is struck from 4.1
  (E8); stale facts updated (E9); every assignment commits on its task
  force branch (E10); workstream 4 declares the graphics update and posts
  its end (E11); deferred modules are cached on first use (E12); 6.3 runs
  H only when the cover or a scene changes (E15); 6.4 moved to workstream 4
  as 4.3, and docs/WEBGL_ENGINE.md with it (E16).
- 31 October 2026: #136 merged at the owner's decision; Workstream 2's
  merged work recorded under "Current values".
- 31 October 2026: row 2's "Workstream reported" notes that the workstream
  has been on 2.2, at the owner's request.
- 31 October 2026: 2.2 moved to DONE by the owner.

- 31 October 2026: owner-requested alignment with the standing bot strategy.
  Added FOUNDATION.md and BOT-PROMPTS.md; synchronized labels/helper scopes;
  preserved the schema secondary and visual reviewer; linked all six briefs
  and charters; reconciled the nine priorities and 2.2 DONE versus 2.1 READY.
  Preserved the QA branch's two unmerged sleep commits. Publication is not
  delivery to bots.
