# Task Force 1: Data Mapping & Schema Architecture

Constituted by the owner on 28 October 2026. This folder and the branch below
hold everything to do with Delegation 1. The shape is the one every task
force follows: see `../README.md`.

## The branch

| | |
|---|---|
| Branch | `taskforce/01-data-schema` |
| Standing pull request | #128 (earlier ones under "History" below) |
| Folder | `docs/outsourcing/task-forces/01-data-schema/` |

Every commit for Delegation 1 lands on this branch: documents, data model,
migrations, client storage changes and the vault. No Delegation 1 work goes
on any other branch. A rename needs the owner's approval and is then
recorded here and under "History".

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

| File | What it is | Status | Delivered |
|---|---|---|---|
| `CHARTER.md` | this page | | |
| `brief.md` | how the workstream works (was `docs/outsourcing/01-data-schema.md`) | approved | |
| `1.1-schema-first-assignment.txt` | round 1: the data map (PR #96, merged); its Task 4 continues as 1.4 | DONE | not recorded |
| `1.2-schema-hd-assignment.txt` | the Human Design study model: notes, chart versions, other people's charts, import and export | READY | primary 29 Oct, pasted by the owner into a Claude Code session; Task 1 drafted as `data-contracts/HD-STUDY-MODEL.md`; model approved by the owner 29 Oct, awaiting 2.2 Task 1 |
| `1.3-hd-mapping-primary.txt` | the Human Design logic map: research, reconcile, map into the vault, cross verify | DONE | primary, pasted by the owner (date not recorded); delivered as #124 |
| `1.3-hd-mapping-secondary.txt` | the independent review of 1.3 | DONE | secondary 29 Oct, pasted by the owner; that pass was sent back, and the primary's evidence on #125 was accepted in its place |
| `1.3-hd-mapping-tertiary.txt` | the lookups the tertiary answers for 1.3, pasted into its chat | DONE | not delivered; closed without a consult (the vault's Tertiary log) |
| `1.4-schema-followups-assignment.txt` | 1.1's Task 4 reissued: G3, G5, G6, G7, G11, and the owner's G2 and G10 | READY | not recorded |

Approval and delivery are recorded separately. **Status** is the owner's
decision (DRAFT, AWAITING OWNER APPROVAL, READY, ISSUED, DONE; only the owner
moves a file to READY). **Delivered** is when the file actually reached each
seat, by whom and how, written as it happens: "primary 29 Oct, pasted by the
owner". An assignment is ISSUED only once its primary has it. The board in
`00-README.md` mirrors the Status column.

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
- 28 October 2026: branch renamed by the owner's approval, from
  `claude/delegation-1-instructions-bhpilx` to `taskforce/01-data-schema`.
  GitHub cannot move an open pull request to a new branch, so #106 was
  closed and #107 became the standing pull request.
- 28 October 2026: #107 merged into main by the owner's approval (merge
  commit d9ea6ab). The branch restarted from main under the same name, and
  #108 opened as the new standing pull request.
- 28 October 2026: a Delivered column added beside Status (the owner's
  programme board, priority 2). 1.3 is approved; its delivery to the three
  seats is not recorded yet.
- 28 October 2026: #108 merged into main by the owner's approval. The branch restarted from main at 9356d04 and #110 opened as the standing pull request.
- 28 October 2026: #110 merged into main by the owner. The branch restarted
  from main under the same name.
- 28 October 2026: efficiency edits approved by the owner. E1: the tertiary
  asks no bulk positions, only boundary cases and the conventions. E2: the
  secondary reruns the primary's script and re-implements only Definition,
  Type and Authority; 6.2's reference charts become 1.3's fixed cases. E3:
  the three faults 3.2 Task 2 owns are listed as known. E4: the Pipeline
  notes are the inspection panel's field list. E5: synGatesOf is recorded as
  unused. E7: 1.1 DONE, its Task 4 reissued as 1.4. E10: 1.2 commits on this
  branch.
- 28 October 2026: #116 opened as the standing pull request.
- 28 October 2026: #116 merged into main by the owner. The branch was not
  restarted from main.
- 29 October 2026: by the owner's approval, the branch fast forwarded to main
  at 1c02c7c (no merge commit, no history rewritten). 1.3 merged into it by
  the owner through #124 (merge commit 2adf5dd), before the secondary's
  review. #125 opened as the standing pull request.
- 29 October 2026: #125 recorded as the standing pull request. It carries the
  1.3 fixes (D-03, D-04, D-09 in f6b38fd; G15 in cfdb5d3) and the review
  evidence the primary ran at the owner's instruction.
- 29 October 2026: 1.3 concluded by the owner, all three files DONE. The
  secondary's pass was sent back as not independent, and the owner accepted
  the primary's evidence on #125 in its place. The tertiary was not
  consulted. Open items are listed in the vault's `00 Index`, under Outcome.
- 29 October 2026: 1.2 Task 1, `data-contracts/HD-STUDY-MODEL.md`, approved by
  the owner: O1 to O9 as recommended. No migration until workstream 2's
  privacy review (2.2 Task 1) is resolved. G2 stays open under 1.4. The draft
  was committed on `claude/peaceful-ptolemy-w2y3jt`, the branch that session
  was given, not on this branch; moving it is the owner's call.
- 29 October 2026: by the owner's approval, this branch fast forwarded from
  640111c to ce0d153, carrying the two 1.2 commits made on
  `claude/peaceful-ptolemy-w2y3jt`; no history rewritten. 1.2 continues here.
- 29 October 2026: G2 decided by the owner: a saved profile keeps syncing
  ("syncing remains constant when profile is saved"), so the push is
  unchanged. Recorded in DATA-MAP.md G2.
- 29 October 2026: the owner asked for 1.2 step 1 (the device half) to start
  before 2.2's review; built as profile-manager.js 1.6.0 with rows O9 to O18.
- 30 October 2026: 2.2 Task 1, the privacy review, returned by a session that
  did not write the model: not ready for migrations, fourteen findings. The
  primary answered them in HD-STUDY-MODEL.md section 12: F4, F5 and F14 built
  in profile-manager.js 1.6.1 (rows O19 to O21, each red on 1.6.0); F1, F6,
  F7, F8, F10, F11 and F3 fixed or specified in the model; 0004's hash column
  renamed `birth_key` before anything was applied. F2 and F9 wait on the
  owner. The review's own text is not in the repository.
- 30 October 2026: the owner decided F2 ("no, and absolutely fix that. it
  serves no purpose if it defaults with no option") and F9 ("(b), with the
  privacy policy wording from (a). Also, introduce (c). Separate the primary
  profiles from the friends."). Built in incommon-cloud.js buildPlan and pull
  and profile-manager.js 1.7.0, rows K75 to K81; Privacy Policy section 5
  dated 30 October 2026. The screens, the Oracle and card refusals and the
  section 14 sentence are workstream 3's, specified in the model's section 13.
- 30 October 2026: the reviewing session sent a follow-up of sixteen findings
  on the answers, passed on at the owner's request. Findings 1 and 2 built
  (both marks travel in the consent ledger; rows K79, K80, K82 to K84, each red
  before), 13 to 16 fixed in the model, 3 fixed on the security branch, and 4,
  5 and 9 to 12 put to the owner. HD-STUDY-MODEL.md section 14.
- 30 October 2026: the owner decided findings 4 and 5 (yes, the server check;
  yes, the readings) and 9 to 12 (fix now). This branch: a marked profile
  kept its mark only through a sync, because a push flushed the deletion that
  takes the ledger after sending the mark; fixed, with the fake database made
  to cascade (K85, red before), and a row whose switch or mark moved is resent
  after its events for 0006 (K86). 0006, the Oracle function and the sharing
  rules are on the security branch. Section 14 and DATA-MAP.md record it.
- 30 October 2026: the owner decided finding 6: the Privacy Policy section 14
  sentence is held until workstream 3's screens exist, and ships with them
  (model section 13, item 6).
- 30 October 2026: #128 opened as the standing pull request, at the owner's
  request. #125 had merged into main on 29 October; the branch was not
  restarted, and main is an ancestor of it, so #128 carries only the ten 1.2
  commits after that merge.
- 30 October 2026: the reviewer checked the answers to the seven gaps and
  then gap 8's fix, at the owner's request in its session. Gap 8 (a withheld
  history comes back) specified as section 4 rule 5 (d) and (e); gap 9 (rule
  (d) too broad) fixed in the text; gap 10, a defect in built code (a clear
  followed by a new birth was skipped on a device that missed both), fixed in
  profile-manager.js 1.7.1 with K87, red on 1.7.0.
