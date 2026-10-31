# Task Force 2: Security Hardening & RLS

Shared foundation: [FOUNDATION.md](../../FOUNDATION.md) and
[role prompts](../../BOT-PROMPTS.md), routed by the central roster.
Use their startup/completion receipts. Approval and delivery remain separate.

Constituted by the owner on 28 October 2026, when every workstream became a
task force (see `../README.md`). This folder and the branch below hold
everything to do with Delegation 2.

## The branch

| | |
|---|---|
| Branch | `taskforce/02-security-rls` |
| Standing pull request | none open at the instruction review; see Current values in ../../00-README.md and refresh GitHub before work |
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
| `2.2-security-hd-assignment.txt` | other people's charts: privacy review of 1.2's model, policies for what 1.2 adds, sharing and handouts | DONE | primary 29 Oct, pasted by the owner with 1.2 into the session that wrote 1.2's model. Tasks 2 and 3 done there at the owner's choice; Task 1 done by a fresh session on 30 Oct, because its author may not review the model. Merged as #129 to #136 |

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
- 30 October 2026: 2.2 Task 1 returned by a fresh session: not ready for
  migrations, fourteen findings, answered in HD-STUDY-MODEL.md section 12 by
  the 1.2 primary. On this branch: share-rules.js 1.1.0 (a card opens no
  handout, F7; the export carries no subject_consent, F6, and no birth key,
  F10), T4 and T9 changed and red on 1.0.0, the RLS harness on `birth_key`
  (16 of 16), SECURITY.md updated. F13 was already met. F2 and F9 wait on the
  owner. The review's own text is not in the repository; whether it is
  committed or posted is the owner's call.
- 30 October 2026: the owner decided F2 and F9 and asked for the review to be
  committed to this branch. The review's author session was asked to commit
  its own text; the 1.2 work for F2 and F9 (1b38223) is merged here and the
  owner's step 0 in SECURITY.md no longer waits on a decision.
- 30 October 2026: the reviewer's follow-up (sixteen findings) answered with
  the 1.2 primary: the 1.2 work merged here, share-rules.js 1.2.0 with T11
  (finding 3), SECURITY.md updated. Findings 4 (a server rule for older
  builds) and 5 (Oracle readings of a marked profile) wait on the owner.
- 30 October 2026: the owner decided findings 4 and 5 (yes to both) and 9 to
  12 (fix now). On this branch: migration 0006 (WH1 to WH12 on Postgres 16,
  28 of 28), the Oracle function storing `profile_id` and refusing
  `FOR_OTHER`, the app sending the profile and joining an unkept first half
  (K29d), share-rules.js 1.3.0 (T12 to T14), Privacy Policy sections 5 and 6.
  The schema branch's K85 fix (a push lost the mark) and K86 resend are merged
  here. Nothing applied to the live project.
- 30 October 2026: #129 opened as the standing pull request, at the owner's
  request. #117 had merged into main on 28 October at aab2c41; main is an
  ancestor of this branch. It is stacked on `taskforce/01-data-schema`, so
  until #128 lands its diff includes that branch's 1.2 commits, and it merges
  after #128.
- 30 October 2026: the 2.2 Task 1 privacy review committed at the owner's
  request, with its follow-up review of the answers, as
  `reviews/2.2-task1-privacy-review.md`. Written by a session that wrote
  none of the model; the answers to the follow-up are in model section 14 and
  were not checked by it.
- 30 October 2026: a second follow-up added to
  `reviews/2.2-task1-privacy-review.md` at the owner's request: the review
  session read and tested the answers in model section 14 at 101eb4b (module
  tests 502 of 502, the study RLS harness 28 of 28) and found seven gaps, two
  of them to fix before step 3.
- 30 October 2026: the seven gaps answered (model section 14). On this
  branch: 0006 covers chart versions and clamps event times dated ahead of
  the server (WH13 to WH16, the harness 32 of 32), the Oracle function's
  comment on an unsynced profile id corrected, share-rules.js's header says
  the restore trade-off, and 0006's note says an older build loses a marked
  profile's name and picture too. Covering memories, the Throughline and Oki
  messages for a marked profile is put to the owner.
- 30 October 2026: the owner decided the open part of gap 2 ("yes, drop them
  too"): 0006 drops a memory, Throughline entry or Oki message that arrives
  for a profile marked as somebody else's and deletes the ones held when the
  mark arrives (WH17, WH18, red without the file; the harness 34 of 34).
- 30 October 2026: the 2.2 reviewer reviewed the standing pull requests at
  7e317dd and fd745a1, at the owner's request: not ready on both, with RV1
  (marking a profile deleted the account's copy before a push that could
  fail, so another device dropped its copy and journal) and RV3 (a deleted
  profile came back; the owner decided in that session "if a profile is
  deleted, delete it everywhere", and confirmed here with saved people
  included). Both fixed on this branch, because both rest on its migrations:
  marking deletes nothing (K88, K92, K95); migration 0007 records a deletion
  in `deleted_profiles` and drops whatever arrives for it later, 0008 lets a
  reader read and add their own records only (DP1 to DP13, the harness 47 of
  47); every pull deletes a recorded profile, the first pull and local
  changes included (K89 to K91, K93); the people a profile saved go with it
  (people-library.js 1.1.0, profile-manager.js 1.8.0, P30, K94, O24); the
  ledger keeps the latest event of every consent past its cap of fifty (O23).
  Module tests 515 of 515. Model section 15, DATA-MAP.md, SECURITY.md and
  Privacy Policy section 5 updated. **Handed to workstream 3**: Delete account
  with "erase this device" still leaves the account's saved people, because
  the erase loop is in the app file; it needs `PM._forgetPeople(id)` for each
  of the account's profiles before `accountStorageKeys()` is removed. Nothing
  applied to the live project.
- 30 October 2026: #129 merged into main at e099aa4, and #128 closed with it,
  at the owner's decision ("merge #129 and close #128"). The live site was
  found serving that code. At the owner's request, this session applied to
  the live project (inCommon, lkzcybzhjjxdqetwwdrx) through the Supabase
  connector: 0004, 0005, `server/mfa-policies.sql`, 0006, 0007, 0008 and
  `server/mfa-policies.sql` again. 0004 and 0005 went first because 0006
  and 0007 hang triggers on `chart_versions`. The owner chose to run them
  ahead of the F12 wording, because `chart_versions` stays empty until
  version syncing is built. Checked afterwards: 0006's eight triggers and
  0007's ten, both tables with row level security on, their policies
  (DELETE, INSERT, SELECT and INSERT, SELECT), the two-step rule on 16
  tables, and neither rule function callable by authenticated. Not done: the
  Oracle and account functions were not redeployed. The six profile fix is
  #130.
- 30 October 2026: #130 (the six profile fix) reviewed "ready to merge" by
  the 2.2 reviewer and merged at the owner's decision. At the owner's
  request, this session then redeployed both functions from main to the live
  project through the Supabase connector, both with JWT verification on, as
  before. `account` is version 33, and its source read back byte for byte
  equal to `server/account/index.ts`. `oracle` is version 55: `index.ts` and
  `tarot-omni.js` read back byte for byte, and `tarot.js` read back with its
  21 `\u` escapes stored as the characters themselves (all inside string
  literals, so the same strings at runtime). The upload path did that;
  version 54, deployed another way, kept them. A byte exact copy needs the
  Supabase CLI. Before replacing either function, the live source was checked
  against git: both were the 9f237d4 versions, so nothing made in the
  dashboard was overwritten. This corrects the entry above that says neither
  function was redeployed.
  Merged into main in #131 at d38cd71.
- 30 October 2026: F12 of the 2.2 Task 1 privacy review. The Privacy
  Policy's section 3 says a profile's earlier birth details are kept on the
  device, and that a note stays matched to the birth details it was written
  against; the bundle's `privacy.html` was rebuilt with it. Sections 5 and 14
  describe version syncing, which is not built, so their wording is held in
  model section 15 for the step 3 change. `docs/LEGAL-SETUP.md` gains the
  operator path that section 14 needs: a `deleted_profiles` record removes
  another person's profile and its versions everywhere, found by birth date
  and a first name compared without case, confirmed as exactly one row
  before the insert and checked after it, with a proportionate identity
  check first and the answer kept on the `support_requests` row. By the
  owner's decision of 30 October 2026, the account holder is not told of
  such a deletion: the profile leaves their devices at the next sync. The
  review's two required changes and its re-review's note are in. Merged into
  main in #132 at b2779f4.
- 30 October 2026: `share-rules.js` is loaded by the app, at the owner's
  request ("load share-rules.js in the app"). The app file is workstream 3's;
  the change there is one script tag beside `people-library.js` and nothing
  else, with the module added to `app/sw.js`'s precache and to
  `tools/build-bundle.js`'s inline list. Driven in Chromium against both the
  source shell and the rebuilt bundle: each boots, `window.ShareRules` is
  there with its six functions, and the page throws nothing. Nothing calls it
  yet; the handout and export screens are still workstream 3's to build.
  Merged into main in #133 at f09ba8d.
- 30 October 2026: the saved people half of G6 that was handed to workstream
  3 is done here instead, at the owner's request ("fix the saved people erase
  in the app"). `profile-manager.js` 1.8.2 adds `forgetAccountPeople()`, which
  forgets the saved people of every profile in the signed in account's store
  and leaves another account's and the guest's (O26). The app's "erase this
  device" path calls it before it removes the account's keys; that is the
  only change in the app file. Driven in Chromium against the rebuilt bundle:
  the method forgets the account's profiles' people, keeps another key's, and
  the page throws nothing. The delete account flow itself was not driven end
  to end, because it needs the account function to answer.
  Merged into main in #134 at f9c385b.
- 30 October 2026: at the owner's request ("identify everything that needs
  to be addressed"), this session read the live project and found the pull
  failing on every device, payments unrecordable and a stray policy one
  column away from a free unlock (docs/SECURITY.md, "The live schema drifted
  from the repository"). The owner approved fixing A1 to A3 of that scope.
  The client fix, migration 0009 and the live shape runs of
  check-hd-study-rls.js are on this branch for review. Nothing has been
  applied to the live project for it yet: that waits on the review and the
  owner's merge.
- 31 October 2026: #135 (the client fix and 0009) merged at the owner's
  decision, and at the owner's request this session applied 0009, then 0001
  to 0003, to the live project. #136 followed, in three commits: 0009's
  description of live corrected (live `pairs.id` was already an identity),
  the module tests' column guard made to fail closed (K96); 0010, which drops
  the `cast_counters` insert, update and delete policies; and 0011, which
  drops `pairs.profile_id` and `luminary_unlocks.profile_id` and revokes the
  `cast_counters` write grants. The owner ran 0010 and 0011 in the SQL Editor,
  and both were verified as a signed in reader, the writes rolled back. #136
  merged into main at 2d35c82 at the owner's decision ("merge it"); its last
  commit, 93ecc43 (0011), was not reviewed. After the merge, a real device
  pull and push were confirmed in the live logs: the owner's phone pulled
  with every read answering 200, pushed a journal entry, and their laptop
  pulled it. Stripe was checked: no Luminary payment had ever been taken, so
  none went unrecorded.
- 31 October 2026: 2.2 moved to DONE by the owner ("move 2.2 to DONE on
  the board"), on the board, in this table and in the assignment's own
  status line.

- 31 October 2026: owner-requested alignment with the standing strategy.
  Linked the shared foundation and role prompts; the central roster records
  current labels and helper scopes. No new bot delivery is claimed.
  2.2 stays DONE; 2.1 stays READY/not started.
