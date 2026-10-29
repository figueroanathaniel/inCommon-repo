# Task Force 2: Security Hardening & RLS

Constituted by the owner on 28 October 2026, when every workstream became a
task force (see `../README.md`). This folder and the branch below hold
everything to do with Delegation 2.

## The branch

| | |
|---|---|
| Branch | `taskforce/02-security-rls` |
| Standing pull request | #117 (earlier ones under "History" below) |
| Folder | `docs/outsourcing/task-forces/02-security-rls/` |

Every commit for Delegation 2 lands on this branch. Work that was already
open on a branch of the old pattern (`security/<topic>`) when this charter was
written may finish there; everything started after goes here. A rename needs
the owner's approval and is then recorded here and under "History".

## The seats

The seats are held by the agents in the **workstream 2 row of the roster**
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

The private addendum 2.1 works from never enters this repository, its branch or its pull request. Nothing about an unfixed weakness is written here.

Its secondary is the same model as its primary, so it reviews blind (Helpers, item 3) and does not receive the addendum until its own list is written.

## What is in this folder

| File | What it is | Status | Delivered |
|---|---|---|---|
| `CHARTER.md` | this page | | |
| `brief.md` | how the workstream works (was `docs/outsourcing/02-security-rls.md`) | approved | |
| `2.1-security-first-assignment.txt` | round 1: the private addendum (kept out of this repository), the policies workstream 1 handed over in PR #96, two housekeeping items | READY | not recorded |
| `2.2-security-hd-assignment.txt` | other people's charts: privacy review of 1.2's model, policies for what 1.2 adds, sharing and handouts | READY (starts after 1.2's model is agreed) | primary 29 Oct, pasted by the owner with 1.2 into the session that wrote 1.2's model. Tasks 2 and 3 done there at the owner's choice; Task 1 owed by a fresh session, because its author may not review the model |

Approval and delivery are recorded separately. **Status** is the owner's
decision (DRAFT, AWAITING OWNER APPROVAL, READY, ISSUED, DONE; only the owner
moves a file to READY). **Delivered** is when the file actually reached each
seat, by whom and how, written as it happens: "primary 29 Oct, pasted by the
owner". An assignment is ISSUED only once its primary has it. The board in
`00-README.md` mirrors this table.

Work this task force produces lives where its brief puts it, not in this
folder: RLS policies, `server/mfa-policies.sql` and grants, the edge functions' auth checks and input validation (`server/*/index.ts`), the auth half of `app/incommon-cloud.js`, and the security rules in `deploy/<current>/_headers`. This folder holds the instructions and the record.

## How work moves on the branch

1. Before the first commit of an assignment, its primary posts on the
   standing pull request: "<n> starts at <sha>".
2. Every commit for it is prefixed with its number ("2.2: ...").
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

- 28 October 2026: Task Force 2 constituted by the owner. This folder made,
  the workstream 2 brief and assignments moved into it from
  `docs/outsourcing/`. Seats as in the roster, subject to substitution on
  the owner's approval.
- 28 October 2026: branch created from main at 9356d04, after #109 made this folder, and #111 opened as the standing pull request.
- 28 October 2026: #111 merged into main by the owner. The branch restarted
  from main under the same name.
- 28 October 2026: efficiency edits approved by the owner. E6: workstream 6
  builds the edge function harness and 2.1 writes its tests on it. E10: each
  finding is a commit series on this branch. E11: 2.1 no longer waits on the
  graphics update.
- 28 October 2026: #117 opened as the standing pull request.
- 29 October 2026: 1.2's model approved by the owner, so 2.2 can start. Its
  Task 1 (the privacy review of `data-contracts/HD-STUDY-MODEL.md`) goes to a
  session that did not write the model (Helpers, item 2).
- 29 October 2026: by the owner's choice, the session that wrote 1.2's model
  did 2.2 Tasks 2 and 3 and not Task 1, which reviews that model and goes to a
  fresh session. This branch fast forwarded from aab2c41 onto
  `taskforce/01-data-schema` at b40444d (1.2's 0004 table), so the policies
  stack on the table they are for; it merges after Task Force 1, as the merge
  order says.
