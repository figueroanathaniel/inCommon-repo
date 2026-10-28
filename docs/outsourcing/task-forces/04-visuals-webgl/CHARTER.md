# Task Force 4: Interactive Visuals (WebGL / three.js)

Constituted by the owner on 28 October 2026, when every workstream became a
task force (see `../README.md`). This folder and the branch below hold
everything to do with Delegation 4.

## The branch

| | |
|---|---|
| Branch | `taskforce/04-visuals-webgl` |
| Standing pull request | PENDING (earlier ones under "History" below) |
| Folder | `docs/outsourcing/task-forces/04-visuals-webgl/` |

Every commit for Delegation 4 lands on this branch. Work that was already
open on a branch of the old pattern (`visuals/<topic>`) when this charter was
written may finish there; everything started after goes here. A rename needs
the owner's approval and is then recorded here and under "History".

## The seats

The seats are held by the agents in the **workstream 4 row of the roster**
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

Its merged work so far is listed under "Current values" in `00-README.md`; build on it.

Every change here also runs `node tools/drift-check.js --force --with-h`.

## What is in this folder

| File | What it is | Status | Delivered |
|---|---|---|---|
| `CHARTER.md` | this page | | |
| `brief.md` | how the workstream works (was `docs/outsourcing/04-visuals-webgl.md`) | approved | |
| `4.1-visuals-first-assignment.txt` | round 1: land the graphics update in reviewable pieces, resolve #95 and #64, two latency findings | READY | not recorded |
| `4.2-visuals-hd-assignment.txt` | the chart as a study workspace: selection kept across views, readings lit on the chart, the readable view one tap away, a text alternative for every graphic | READY (starts after 4.1's graphics update merges) | not recorded |

Approval and delivery are recorded separately. **Status** is the owner's
decision (DRAFT, AWAITING OWNER APPROVAL, READY, ISSUED, DONE; only the owner
moves a file to READY). **Delivered** is when the file actually reached each
seat, by whom and how, written as it happens: "primary 29 Oct, pasted by the
owner". An assignment is ISSUED only once its primary has it. The board in
`00-README.md` mirrors this table.

Work this task force produces lives where its brief puts it, not in this
folder: the cover's renderer and shaders, the ring, `app/chart-scene.js`, `cycle-scene.js`, `hd-scene.js`, `body-globes.js`, `flight.js` and `tools/check-three-lifecycle.js`. This folder holds the instructions and the record.

## How work moves on the branch

1. Before the first commit of an assignment, its primary posts on the
   standing pull request: "<n> starts at <sha>".
2. Every commit for it is prefixed with its number ("4.2: ...").
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

- 28 October 2026: Task Force 4 constituted by the owner. This folder made,
  the workstream 4 brief and assignments moved into it from
  `docs/outsourcing/`. Seats as in the roster, subject to substitution on
  the owner's approval.
- 28 October 2026: branch created from main at 9356d04, after #109 made this folder, and PENDING opened as the standing pull request.
