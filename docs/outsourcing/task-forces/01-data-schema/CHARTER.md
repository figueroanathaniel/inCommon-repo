# Task Force 1: Data Mapping & Schema Architecture

Constituted by the owner on 28 October 2026. This folder and the branch below
hold everything to do with Delegation 1. The shape is the one every task
force follows: see `../README.md`.

## The branch

| | |
|---|---|
| Branch | `claude/delegation-1-instructions-bhpilx` |
| Standing pull request | #106 (later ones recorded under "History" below) |
| Folder | `docs/outsourcing/task-forces/01-data-schema/` |

Every commit for Delegation 1 lands on this branch: documents, data model,
migrations, client storage changes and the vault. No Delegation 1 work goes
on any other branch. The branch name is kept as it is; a rename needs the
owner's approval and is then recorded here and under "History".

## The seats

The three seats are held by the agents in the **workstream 1 row of the
roster** in `../../00-README.md`, which is the only place an agent is named.

| Seat | Duty |
|---|---|
| Primary | does the work, commits to the branch, keeps this charter's board current |
| Secondary | reviews each assignment independently, takes the branch over only as `brief.md` says |
| Tertiary | chat only, public lookups only, as its own file says |

**Substitution is the owner's decision and nobody else's.** A seat changes
only when the owner approves it in writing. Then, in one commit on this
branch: the roster cell in `00-README.md` changes, a line is added to
"History" below ("secondary seat substituted, approved by the owner on
<date>"), and the new agent receives this charter, `brief.md` and its
current assignment file. If the new agent is chat only or has a smaller
context, check its duties still fit ("What each agent can do" in
`00-README.md`) before handing over.

## What is in this folder

| File | What it is | Status |
|---|---|---|
| `CHARTER.md` | this page | |
| `brief.md` | how the workstream works (was `docs/outsourcing/01-data-schema.md`) | approved |
| `1.1-schema-first-assignment.txt` | round 1: the data map (PR #96, merged) and the follow-ups in its Task 4 | READY |
| `1.2-schema-hd-assignment.txt` | the Human Design study model: notes, chart versions, other people's charts, import and export | READY |
| `1.3-hd-mapping-primary.txt` | the Human Design logic map: research, reconcile, map into the vault, cross verify | READY |
| `1.3-hd-mapping-secondary.txt` | the independent review of 1.3 | READY |
| `1.3-hd-mapping-tertiary.txt` | the lookups the tertiary answers for 1.3, pasted into its chat | READY |

Statuses move DRAFT, AWAITING OWNER APPROVAL, READY, ISSUED, DONE, and only
the owner moves a file to READY. The same statuses appear on the board in
`00-README.md`; this table is the one kept current, and the board mirrors it.

Work this task force produces lives where its brief puts it, not in this
folder: `data-contracts/` (the data map and the Human Design vault,
`data-contracts/hd-vault/`), `server/migrations/`, and the files the brief
lists under "Who owns which files". This folder holds the instructions and
the record.

## How work moves on the branch

1. Before the first commit of an assignment, its primary posts on the
   standing pull request: "<n> starts at <sha>".
2. Every commit for it is prefixed with its number ("1.3: ...").
3. When it is done, the primary posts "<n> ready for review, <start sha> to
   <end sha>", with the gate output.
4. The secondary reviews that range as one comment on the standing pull
   request, ending "ready to merge" or "not ready", and the helper log goes
   in the same thread.
5. The branch merges into main when the owner says so, with every gate in
   `00-README.md` green and every assignment in the range reviewed. After a
   merge, the branch is restarted from main under the same name and a new
   standing pull request is opened; its number goes under "History".

Earlier assignments name branches of their own (1.1 named
`schema/data-map-20261027`, 1.2 names `schema/hd-study-model`). From 28
October 2026 that work is committed to this branch instead; the assignment
texts are left as they were approved.

`docs/hd-upgrade/02-delegation-plan.txt` still lists 1.2 under
`docs/outsourcing/assignments/`. It is the approved plan as written on 27
October 2026, so it is left alone; the file is here now.

## History

- 28 October 2026: Task Force 1 constituted by the owner. Branch dedicated,
  this folder made, the workstream 1 brief and assignments 1.1 to 1.3 moved
  into it. Seats as in the roster, subject to substitution on the owner's
  approval. Standing pull request opened: #106.
- 28 October 2026: 1.3 (all three files) approved by the owner, READY.
