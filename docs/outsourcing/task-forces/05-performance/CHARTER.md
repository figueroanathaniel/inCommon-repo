# Task Force 5: Load Time & Performance Tuning

Constituted by the owner on 28 October 2026, when every workstream became a
task force (see `../README.md`). This folder and the branch below hold
everything to do with Delegation 5.

## The branch

| | |
|---|---|
| Branch | `taskforce/05-performance` |
| Standing pull request | #114 (earlier ones under "History" below) |
| Folder | `docs/outsourcing/task-forces/05-performance/` |

Every commit for Delegation 5 lands on this branch. Work that was already
open on a branch of the old pattern (`perf/load-time`) when this charter was
written may finish there; everything started after goes here. A rename needs
the owner's approval and is then recorded here and under "History".

## The seats

The seats are held by the agents in the **workstream 5 row of the roster**
in `../../00-README.md`, which is the only place an agent is named.

| Seat | Duty |
|---|---|
| Primary | does the work, commits to the branch, keeps this charter's table current |
| Secondary | reviews each assignment independently, takes the branch over only as `brief.md` says |
| Tertiary | none: nobody holds this seat (Helpers, item 4) |

**Substitution is the owner's decision and nobody else's.** A seat changes
only when the owner approves it in writing. Then, in one commit on this
branch: the roster cell in `00-README.md` changes, a line is added to
"History" below, and the new agent receives this charter, `brief.md` and its
current assignment. If the new agent is chat only or has a smaller context,
check its duties still fit ("What each agent can do" in `00-README.md`)
before handing over.

This task force has no tertiary (Helpers, item 4). Its secondary re-measures independently, and the browser runner covers any gate its agents cannot run.

Every change here also runs `node tools/drift-check.js --force --with-h`.

## What is in this folder

| File | What it is | Status | Delivered |
|---|---|---|---|
| `CHARTER.md` | this page | | |
| `brief.md` | how the workstream works (was `docs/outsourcing/05-performance.md`) | approved | |
| `5.1-performance-first-assignment.txt` | round 1: `tools/measure-load.js` and baseline A, the leads from the 27 October analysis, the known 3D latency measured | READY | not recorded |
| `5.2-performance-hd-assignment.txt` | budgets for Color and the scanner before they are built, the scanner off the render path, module weight | READY (starts after 5.1's JPL deferral merges) | not recorded |

Approval and delivery are recorded separately. **Status** is the owner's
decision (DRAFT, AWAITING OWNER APPROVAL, READY, ISSUED, DONE; only the owner
moves a file to READY). **Delivered** is when the file actually reached each
seat, by whom and how, written as it happens: "primary 29 Oct, pasted by the
owner". An assignment is ISSUED only once its primary has it. The board in
`00-README.md` mirrors this table.

Work this task force produces lives where its brief puts it, not in this
folder: `tools/build-bundle.js` inlining, the `sw.js` precache list, module loaders, `tools/measure-load.js` and `docs/PERF-BASELINE.md`. This folder holds the instructions and the record.

## How work moves on the branch

1. Before the first commit of an assignment, its primary posts on the
   standing pull request: "<n> starts at <sha>".
2. Every commit for it is prefixed with its number ("5.2: ...").
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

- 28 October 2026: Task Force 5 constituted by the owner. This folder made,
  the workstream 5 brief and assignments moved into it from
  `docs/outsourcing/`. Seats as in the roster, subject to substitution on
  the owner's approval.
- 28 October 2026: branch created from main at 9356d04, after #109 made this folder, and #114 opened as the standing pull request.
- 28 October 2026: #114 merged into main by the owner. The branch restarted
  from main under the same name.
- 28 October 2026: efficiency edits approved by the owner. E12: a deferred
  module is cached on first use like the gazetteer, never precached at
  install. E11: "after graphics" means after workstream 4 posts that the
  graphics update has merged. E10: commits on this branch.
