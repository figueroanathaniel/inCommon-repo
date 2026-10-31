# Task Force 6: QA, Unit Testing & Documentation

Shared foundation: [FOUNDATION.md](../../FOUNDATION.md) and
[role prompts](../../BOT-PROMPTS.md), routed by the central roster.
Use their startup/completion receipts. Approval and delivery remain separate.

Constituted by the owner on 28 October 2026, when every workstream became a
task force (see `../README.md`). This folder and the branch below hold
everything to do with Delegation 6.

## The branch

| | |
|---|---|
| Branch | `taskforce/06-qa-tests-docs` |
| Standing pull request | none open at the instruction review; see Current values in ../../00-README.md and refresh GitHub before work |
| Folder | `docs/outsourcing/task-forces/06-qa-tests-docs/` |

Every commit for Delegation 6 lands on this branch. Work that was already
open on a branch of the old pattern (`qa/<topic>` (6.2 names `qa/hd-reference` and `qa/hd-benchmark`)) when this charter was
written may finish there; everything started after goes here. A rename needs
the owner's approval and is then recorded here and under "History".

## The seats

The seats are held by the agents in the **workstream 6 row of the roster**
in `../../00-README.md`, which is the only place an agent is named.

| Seat | Duty |
|---|---|
| Primary | does the work, commits to the branch, keeps this charter's table current |
| Secondary | reviews each assignment independently, takes the branch over only as `brief.md` says |
| Tertiary | narrow, bounded help when asked, as `brief.md` says |

**Substitution is the owner's decision and nobody else's.** A seat changes
only when the owner approves it in writing. Then, in one commit on this
branch: the roster cell in `00-README.md` changes, a line is added to
"History" below, and the new agent receives this charter, `brief.md` and its
current assignment. If the new agent is chat only or has a smaller context,
check its duties still fit ("What each agent can do" in `00-README.md`)
before handing over.

Its final documentation pass merges last, after every other task force (Merge order in `00-README.md`).

## What is in this folder

| File | What it is | Status | Delivered |
|---|---|---|---|
| `CHARTER.md` | this page | | |
| `brief.md` | how the workstream works (was `docs/outsourcing/06-qa-tests-docs.md`) | approved | |
| `6.1-qa-first-assignment.txt` | round 1: one command for every gate (this task force's first job), CI for the gates that need no browser, the coverage table and the edge function harness, the render dump tool | READY | not recorded |
| `6.2-qa-hd-assignment.txt` | reference charts (also 1.3's fixed cases), honesty rows as 3.2 lands, the benchmark protocol | READY | not recorded |
| `6.3-integration-validation-assignment.txt` | programme priority 9: each integrated change validated on main, browser gates every time and H when the cover or a scene changes, device gaps recorded | READY | not recorded |
| ~~`6.4-webgl-engine-doc-assignment.txt`~~ | moved to Task Force 4 as 4.3 (E16); this task force reviews it | retired | |

Approval and delivery are recorded separately. **Status** is the owner's
decision (DRAFT, AWAITING OWNER APPROVAL, READY, ISSUED, DONE; only the owner
moves a file to READY). **Delivered** is when the file actually reached each
seat, by whom and how, written as it happens: "primary 29 Oct, pasted by the
owner". An assignment is ISSUED only once its primary has it. The board in
`00-README.md` mirrors this table.

Work this task force produces lives where its brief puts it, not in this
folder: `tools/run-*.js` and `tools/check-*.js` (apart from `check-three-lifecycle.js`), `verification/`, `app/handoff/`, and the consolidation of `docs/` and CLAUDE.md. This folder holds the instructions and the record.

## How work moves on the branch

1. Before the first commit of an assignment, its primary posts on the
   standing pull request: "<n> starts at <sha>".
2. Every commit for it is prefixed with its number ("6.2: ...").
3. When it is done, the primary posts "<n> ready for review, <start sha> to
   <end sha>", with the gate output.
4. The secondary reviews that range as one comment on the standing pull
   request, ending "ready to merge" or "not ready", and the helper log goes
   in the same thread.
5. The branch merges into main when the owner says so, in the order "Merge
   order" in `00-README.md` sets, with every gate green and every assignment
   in the range reviewed. After a merge the branch restarts from main under
   the same name and a new standing pull request is opened; its number goes
   under "History".

The assignment texts name branches of the old pattern. They are left as they
were approved; from 28 October 2026 that work is committed here.

## History

- 28 October 2026: Task Force 6 constituted by the owner. This folder made,
  the workstream 6 brief and assignments moved into it from
  `docs/outsourcing/`. Seats as in the roster, subject to substitution on
  the owner's approval.
- 28 October 2026: branch created from main at 9356d04, after #109 made this folder, and #115 opened as the standing pull request.
- 28 October 2026: 6.3 and 6.4 approved by the owner, READY. WEBGL_ENGINE.md
  had never been committed, so by the owner's choice the primary drafted
  `docs/WEBGL_ENGINE.md` from the code with the corrections built in; the
  workstream 4 secondary reviews it.
- 28 October 2026: #115 merged into main by the owner, carrying the 6.4
  draft of `docs/WEBGL_ENGINE.md`. The branch restarted from main under the
  same name.
- 28 October 2026: efficiency edits approved by the owner. E6: 6.1 builds
  the edge function harness and workstream 2 writes on it. E13: 6.1 Task 1
  is this task force's first job, before 6.2. E14: 6.1 Task 5, the render
  dump tool, shared by 3.1, 3.2 and 4.2. E2: 6.2's reference charts are
  also 1.3's fixed cases and cite 1.3's convention notes. E15: 6.3 runs H
  only when the cover or a scene changes. E16: 6.4 moved to Task Force 4 as
  4.3, with this task force reviewing. E10: commits on this branch.
- 28 October 2026: #121 opened as the standing pull request.

- 31 October 2026: owner-requested alignment with the standing strategy.
  Linked the shared foundation and role prompts; the central roster records
  current labels and helper scopes. No new bot delivery is claimed.
  Preserve this branch's unique sleep-test work named in Current values.
