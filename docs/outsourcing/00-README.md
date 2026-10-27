# inCommon outsourcing: index, shared rules, ownership

Six workstreams run in parallel on figueroanathaniel/inCommon-repo.
Every agent reads THIS FILE first, then its own brief.

## The roster

**This table is the only place an agent is named.** The briefs speak of
"the primary", "the secondary" and "the tertiary" and never name a model, so
reassigning a seat is a one cell edit here and nothing else. See "Changing
these docs" at the end.

| # | Workstream | Primary | Secondary | Tertiary | Brief |
|---|---|---|---|---|---|
| 1 | Data Mapping & Schema Architecture | Claude Opus 5.5 | Gemini Argon 4 | Free Perplexity | 01-data-schema.md |
| 2 | Security Hardening & RLS | Claude Opus 5.5 | Claude Opus 5.5 (separate session) | Meta AI | 02-security-rls.md |
| 3 | Refactoring & Feature Additions | DeepSeek V4.0 Flash | Kimi K3 | Nemotron 3.5 Lightening | 03-refactor-features.md |
| 4 | Interactive Visuals (WebGL / three.js) | GPT Sol 6.1 | Haiku 5.5 | Nemotron 3.5 Lightening | 04-visuals-webgl.md |
| 5 | Load Time & Performance Tuning | MiMo v2.6 Flash Slow | DeepSeek V4.1 Flash Bot | none | 05-performance.md |
| 6 | QA, Unit Testing & Documentation | Nemotron 3.5 Lightening | Haiku 5.5 | Free Gemini / WhatsApp Bot | 06-qa-tests-docs.md |

### What each agent can do

The briefs decide how a helper is used from these traits, not from its name,
so a new agent only needs a row here. An agent with no row is treated as
repo access, full context, no limit on use.

| Agent | Repo access | Context | Use |
|---|---|---|---|
| Claude Opus 5.5 | yes | full | normal |
| Gemini Argon 4 | yes | full | normal |
| DeepSeek V4.0 Flash | yes | full | normal |
| DeepSeek V4.1 Flash Bot | yes | full | normal |
| GPT Sol 6.1 | yes | full | normal |
| MiMo v2.6 Flash Slow | yes | full | normal |
| Nemotron 3.5 Lightening | yes | full | normal |
| Kimi K3 | yes | full | sparingly: see brief 3's trigger list |
| Haiku 5.5 | yes | about 100k tokens | normal |
| Free Perplexity | no, chat only | n/a | lookups only |
| Meta AI | no, chat only | n/a | lookups only |
| Free Gemini / WhatsApp Bot | no, chat only | n/a | proofreading only |

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
| `<current>` deploy folder | deploy/v6.4/ (so `deploy/<current>/` is deploy/v6.4/) |
| Last full gate run on main | c259e80, 27 October 2026: every README gate green (drift-check M, E, F, G, T, R, N; drive-cover 3/3, drive-routes 2/2, drive-swipe 4/4; run-module-tests 435/435), plus the 23 other check-*.js gates. H not run. |
| Browser gate runner (Helpers, item 1) | the owner's Claude Code cloud session, which has Chromium and Playwright; ask the owner to start one |
| Workstream 4's merged work so far | PR #92, PR #93, PR #97 |
| Merged fixes since the briefs were written | PR #94 (H11 untimed), PR #98 (Back after a routed arrival), PR #99 (swipes mid move) |

File sizes and token counts quoted in the briefs and below are a snapshot
from 27 October 2026. Measure again before relying on one.

## Assignments and their status

A brief says how a workstream works; an assignment says what to do next.
Assignments live in `assignments/`, one plain text file each, numbered
`<workstream>.<round>` (1.1 is workstream 1's first). Each file carries its
own status line, and this board mirrors it.

| # | Primary assignment | Status | Secondary and tertiary instructions | Status | Workstream reported |
|---|---|---|---|---|---|
| 1 | assignments/01-schema-first-assignment.txt (1.1) | READY | in its brief, "Secondary and tertiary" | READY | first round done, PR #96 open |
| 2 | assignments/02-security-first-assignment.txt (2.1) | READY | in its brief, "Secondary and tertiary" | READY | not started |
| 3 | assignments/03-refactor-first-assignment.txt (3.1) | READY | in its brief, "Secondary and tertiary" | READY | ready to work |
| 4 | assignments/04-visuals-first-assignment.txt (4.1) | READY | in its brief, "Secondary and tertiary" | READY | large graphics update in flight |
| 5 | assignments/05-performance-first-assignment.txt (5.1) | READY | in its brief, "Secondary and tertiary" | READY | reviewing |
| 6 | assignments/06-qa-first-assignment.txt (6.1) | READY | in its brief, "Secondary and tertiary" | READY | running |

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

1. **Who runs the browser gates.** Every helper confirms on its first task
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
   run.
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
2. Never commit to main. Work on your own branch from current main:
   schema/..., security/..., feature/..., visuals/..., perf/..., qa/...
   One pull request per piece of work.
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
| tools/build-bundle.js inlining, sw.js precache list, module loaders | 5 Performance | yes |
| tools/measure-load.js, docs/PERF-BASELINE.md | 5 Performance | yes |
| tools/run-*.js, tools/check-*.js (except check-three-lifecycle.js), verification/, app/handoff/ | 6 QA | others ADD rows for their own work, never remove |
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
line in the change log at the end of this file.

**Reassign a seat.** Edit the cell in "The roster". If the new agent is not
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

**Add a workstream.** Copy the shape of an existing brief: a title, a line
saying the agents are named in the roster, "What exists today", the work,
the files it owns, and "Secondary and tertiary". Number it 07 and onward,
add its row to the roster, add its files to "Who owns which files", and
place it in "Merge order". Retiring a workstream is the reverse; keep its
number unused rather than renumbering the others, because pull requests and
commits refer to briefs by number.

**Issue a new assignment.** Copy the shape of an existing one in
`assignments/`: the number, a status line, the commit it was written
against, who (by role), what to read, the tasks, hard rules and "Done
means". Name it like the others, workstream number, workstream and round
(`01-schema-second-assignment.txt`), add its row to
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
- 27 October 2026: secondary and tertiary instructions approved by the
  owner and written into each brief; "Helpers" added; every cell on the
  status board READY.
- 27 October 2026: round 1 assignments added under assignments/, with the
  status board; main c259e80 recorded as the last green run.
- 27 October 2026: committed to the repo under docs/outsourcing/. Model
  names gathered into the roster, facts that move gathered into "Current
  values", and "Changing these docs" added.
