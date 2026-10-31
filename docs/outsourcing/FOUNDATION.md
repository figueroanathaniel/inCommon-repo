# Shared foundation for every inCommon bot

Revision: 2026-10-31.1. The owner requested this alignment on 31 October 2026,
using the standing strategy of 30 October. The current roster, moving facts
and prompt routing live in [00-README.md](00-README.md). The nine priorities
live in [PROGRAMME.md](PROGRAMME.md). This file defines the common process,
not a second status board or roster.

## The product we are building

inCommon is one application for studying charts, readings and personal
records. The Human Design goal is a comprehensive interactive study
experience, with calculation accuracy, understandable learning, accessibility,
privacy and responsive interaction all measured. More code, more effects or
more tests alone do not prove better quality. The approved benchmark protocol
decides how the comparison is measured.

Use the existing codebase and its two responsive shells. There is one chart
calculation model and multiple presentations of it. A scene draws that model;
it does not become a separate calculator or a database client. Existing
source/build boundaries and product design rules remain in force.

## Where each fact belongs

| Question | Authority to read |
|---|---|
| What did the owner authorize? | Latest explicit owner direction and its dated decision record |
| What technical and product rules apply? | Applicable repository instructions and CLAUDE.md |
| Which bot holds the role and where does a fact currently point? | 00-README.md, roster and Current values |
| What is next, and what is blocked? | PROGRAMME.md and the task-force charter |
| What does this assignment require? | Its brief and numbered assignment, with later recorded owner decisions |
| What is implemented? | Source at the named commit, with reproducible tests |
| What was actually reviewed or deployed? | The exact review or deployment receipt, never a status label alone |

A later approved owner decision wins over an older brief. CLAUDE.md governs
technical rules where documents disagree. If a current implementation claim
is stale, cite the source and correct the claim; do not silently change an
intended product rule to match a bug. Keep history as history.

## The same startup for every repository session

1. Read 00-README.md, this file, PROGRAMME.md, the task-force CHARTER.md and
   brief.md, and the numbered assignment. Read CLAUDE.md under the README's
   context rules. Search the large app file and read targeted ranges.
2. Inspect local changes and fetch current main. Record main SHA, working
   branch/head and the exact assignment. Do not reset or overwrite another
   session's uncommitted work.
3. Find the actual open PR for that branch. A charter's older number is not
   proof a PR is still open. If none exists, prepare the next PR under the
   established workflow. Do not force-update a shared branch. Inspect any
   work ahead of main before bringing the branch forward.
4. Compare the task with completed work and named dependencies. Do not redo
   a closed mapping, merged fix or completed security assignment because a
   pasted prompt is old. Recheck tools before creating replacements.
5. State the exact scope, owned files, prerequisite evidence, checks and
   independent reviewer. Continue unblocked work while naming a blocked
   dependency precisely.
6. Confirm actual tool access and budget. Model labels do not guarantee repo
   access, a browser, database, context size or free/unlimited usage.

Return this startup receipt before implementation:

```text
Foundation revision:
Assignment / role:
Fetched main SHA:
Working branch / head:
Open PR or none:
Already complete in this scope:
Next bounded change and owned files:
Dependency evidence or blocker:
Checks available / unavailable:
Independent reviewer and authorship conflict, if any:
```

## Ownership, changes and review

Use the task-force branch for its work. Cross-workstream instruction alignment
uses a docs/outsourcing-<topic> branch under "Changing these docs" in the README.
Use assignment prefixes for assignment commits. Do not edit another owner's
files without the recorded authorization or coordinated handoff.

Do not commit to main, force-push shared history, merge, deploy or change
production merely because these instructions were supplied. Earlier owner-
authorized production actions are history, not recurring permission. Build
generated output through the canonical build tool when its sources change.
Keep vendored files unchanged.

Primary authorship, independent review and execution evidence are separate.
A bot cannot independently approve its own code, policy draft or tests. A
same-model blind review follows the security brief's isolation rules. Record
owner exceptions as exceptions; never turn them into independent sign-off.

Protect the limited precision-review allowance. Supply one compact decision
packet, not the entire repository, and retain the assignment's consultation
limit. Broad iteration belongs to the assigned primary. A fallback receives
the exact checkpoint and continues the same work; it does not start a rival
implementation or take over without a recorded handoff.

## The technical boundaries every role preserves

- The canonical app contains both shells; do not fork a device-specific app.
- The application builds chart results. Scenes handle drawing, selection,
  geometry and camera behavior using the supplied model.
- The browser's existing cloud module owns cloud access. Graphics code never
  writes chart state directly to a table.
- Preserve accurate time/zone conversion, the solved solar arc, cache
  invalidation, multi-line activations and documented convention choices.
- Treat source-backed uncertainty and unavailable values as real states.
  Do not normalize incorrect data into a confident-looking answer.
- Reuse approved chart addresses, storage and consent interfaces from the
  model. A table or module existing does not mean its UI or sync is built.
- Respect the existing accessibility, color, 44px touch-target, reduced-
  motion and wording rules. No em or en dashes.
- Human Design teaching review is separate from software review. Preserve
  any outstanding specialist-review marker.
- Keep feature accuracy when optimizing. Measure before and after under
  comparable conditions and preserve failure/offline behavior.

## Verification means evidence from the named version

Use the current README gates and the assignment's checks. New checks should
catch a meaningful defect. Use the existing Node/browser infrastructure;
a new test framework needs a demonstrated gap, not a volume target.

Do not claim a check passed if it was skipped, blocked, timed out or not run.
Report the command, commit, environment, result and limitations. A previously
green PR does not certify a newer integrated main. Independent astronomical
sources support expected values; the implementation under test cannot
manufacture its own expected answers.

Reuse the existing study RLS harness for database policy evidence. Without
its required local/test database, say NOT RUN. Keep database, mocked browser,
real-browser and physical-device evidence separate. A software GPU or emulated
phone does not establish performance or correctness on physical devices.

Keep Visuals and Performance's H requirement and integration QA's conditional
H requirement. This foundation grants no waiver of required gates. For a
documentation-only change, report the checks actually run and any remaining
required checks; do not label an incomplete check set merge-ready.

## Safe handoffs for chat-only helpers

Chat-only helpers get a narrowly scoped public question, approved sanitized
screen description, public code snippet or draft paragraph. Never forward
private reader data, credentials, server or data-contract contents, project
connection details, or unresolved security findings.

The common principles still apply: verify claims, label unknowns, preserve
the product's language and report what was not checked. A chat-only helper
does not claim repository access or update a charter. Its repository owner
checks the answer and records the handoff. Public descriptions require
actual supplied visual evidence; filenames are not evidence of appearance.

## Completion and the next assignment

```text
Assignment / role:
Foundation revision:
What changed, in plain English:
Original programme priority:
Branch and start/end commits:
Exact tested commit and environment:
Evidence: commands, results and source/review links:
Independent reviewer and verdict:
Passed / failed / blocked / not run:
Formal status / actual delivery / implementation progress:
Remaining uncertainty or physical-device gaps:
Records updated:
Strategy reread:
Next unblocked task, owner and satisfied prerequisite:
Owner decision still needed, if any:
```

Update the affected charter and programme facts together. Preserve all nine
priorities, completed work, actual delivery dates and owner status decisions.
If an assignment spans several parts, do not mark all DONE because one part
merged. Conversely, an open verification gap does not silently undo a formal
owner decision.

Reread this foundation, the roster and programme after completion. Continue
only inside the current authorized scope; hand off another role's work.
Updating files is not evidence that another bot received or adopted them.
