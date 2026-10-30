# server/migrations

Changes to the live Supabase schema, one file per change, applied in number
order. Added 27 October 2026 with the data map (`data-contracts/DATA-MAP.md`).

**Why a folder.** `server/cloud-schema.sql` is the schema of record, and it
opens with the one-time v1 cleanup that drops `consent_events` and `profiles`,
so it must never be run whole against the live project (its own header says
so). A change to a table is written here instead, on its own, and applied on
its own.

**The rules every file keeps** (module test K73 checks them):

- It is named `NNNN-what-it-does.sql` and numbered one after the last.
- It is safe to run twice: `create ... if not exists`, `create or replace
  function`, and `drop trigger if exists` before every `create trigger`.
- It never changes a table in place in a way the app can trip on: no new
  constraint the sync module could be refused by, because one refused upsert
  ends the whole push.
- It carries its down migration in a comment headed `-- DOWN`, as runnable
  lines.
- No dollar sign outside a tagged function body (`$name$ ... $name$`): the
  dashboard's SQL Editor splits a script on bare dollar signs (see
  `server/support.sql`).
- A new table is created with row level security enabled and **no policies**
  (deny all), and its policies are written separately. Add it to the list in
  `server/mfa-policies.sql` and run that file again, or two-step sign in does
  not cover it.
- Zero em dashes or en dashes.

## Order to apply

Run each in the Supabase dashboard, SQL Editor, paste, Run, in this order:

1. `0001-sync-lookup-indexes.sql`: six indexes for lookups the sync module
   and the account function already make. Nothing reads them by name.
2. `0002-profiles-one-active-follows.sql`: a profile that arrives active makes
   the account's other profiles inactive first, so `profiles_one_active` no
   longer refuses a push after a profile switch (K72).
3. `0003-pairs-follow-profile-deletes.sql`: deleting a profile deletes the
   two-person consent records that name it, as the device already does.
   Needs 0001's `pairs (profile_b)` index to stay a lookup.

4. `0004-chart-versions.sql`: the chart version history (1.2,
   `data-contracts/HD-STUDY-MODEL.md` section 4), row level security on and
   no policy. **Do not apply until workstream 2's privacy review of the model
   (2.2 Task 1) is resolved**, and apply it with its policies, which are
   workstream 2's.

5. `0005-chart-versions-policies.sql`: who may touch a chart version
   (workstream 2, assignment 2.2): read, add and delete on the reader's own
   profiles, no update, nothing for anon. Then run `server/mfa-policies.sql`
   again, which lists `chart_versions`. Tested by
   `tools/check-hd-study-rls.js`.

6. `0006-server-holds-the-switch.sql`: the server holds "Save my profile to
   my account" and "this profile is for someone else" (the follow-up review's
   findings 4, 5 and 9, decided by the owner on 30 October 2026). A profile
   row is emptied of its birth while the account's latest `birthData` event
   is a revoke or its latest `birthCleared` a grant, and emptied whole while
   its latest `forOther` is a grant, so a build older than the switch cannot
   put the birth back. A chart version follows the same rule; a profile
   marked as somebody else's keeps no memory, Throughline entry or Oki
   message; and an event dated more than five minutes ahead of the server is
   stored at its time. An Oracle reading gains `profile_id`; one finished for
   such a profile is stored as `served` with no content, and the kept readings
   of a profile that becomes withheld turn `withdrawn`. Apply after
   `server/oracle/schema.sql`. **Deploy the Oracle function and the app that
   go with it (taskforce/02-security-rls) with this file, in the same window,
   once 0007 and 0008 are applied too (see 7)**: the app
   resends a row after its events so that turning saving back on keeps the
   birth (K86), and without that a reader who turns it back on loses the
   account copy until the next change to the profile. Tested by
   `tools/check-hd-study-rls.js`, rows WH1 to WH18. It also hangs a trigger
   on `chart_versions`, so it runs after 0004, and **if 0004 is ever undone
   and applied again, run 0006 again too**: dropping the table drops the
   trigger with it.

7. `0007-profiles-deleted-everywhere.sql`: a deleted profile stays deleted
   on every device (the owner, 30 October 2026: "if a profile is deleted,
   delete it everywhere"; the 2.2 review's RV3). `deleted_profiles` holds the
   account, the profile's id and the server's time, and nothing else. A record
   arriving deletes the profile's row (and by the cascades its journal,
   ledger, Throughline, Oki log, chart versions and two person records) and
   turns its kept Oracle readings `withdrawn`; anything that arrives for that
   profile afterwards is dropped, and a reading finished for it is stored as
   `served`. Every rule acts inside the record's own account. Row level
   security on, no policy. Apply after 0006. **The app from
   taskforce/02-security-rls ships after this file and 0008, never before**:
   it records deletions here, and its pull reads this table and fails without
   it. Tested by `tools/check-hd-study-rls.js`, rows DP1 to DP13.

8. `0008-deleted-profiles-policies.sql`: a signed in reader may read and add
   records for their own account, and nothing else: no update and no delete,
   because a record that could be removed would let a deleted profile come
   back. Then run `server/mfa-policies.sql` again, which lists
   `deleted_profiles`.

9. `0009-live-schema-reconcile.sql`: brings a project whose `pairs` and
   `luminary_unlocks` drifted from the repository back to its shape, and
   drops four policies no file here made. It changes nothing on a project
   already of the repository's shape. Found on the live project on 30 October
   2026: `pairs` had `profile_id` in place of `account_id` and an id with no
   identity, so every pull and every pair write failed; `luminary_unlocks`
   had `profile_id` in place of `user_id` and no key, so no payment could be
   recorded or recognised; and one stray policy would have let a reader write
   their own unlock the moment `user_id` existed, so it is dropped in the same
   file. **On the live project this file runs first, then 0001, 0002 and
   0003**, which were never applied there (0001 indexes `pairs.account_id`).
   Then run `server/mfa-policies.sql` again. Tested by
   `tools/check-hd-study-rls.js`, rows LV1 to LV9, against the live shape
   before and after.

0001 to 0003 create no table, so `server/mfa-policies.sql` did not need to be
run again for them. 0004 does, once its policies are in, and 0007 does, once
0008 is in.

Proven on 27 October 2026 against Postgres 16 with `server/cloud-schema.sql`
(from its v2 section), `server/oracle/schema.sql`, `server/store/schema.sql`,
`server/support.sql` and `server/mfa-policies.sql` applied over a stub of
Supabase's `auth` schema and roles: each file applied twice without error,
the profile switch that failed before succeeds after, one reader's trigger
never touched another reader's rows, a reader at aal1 with a verified factor
was still refused, the down migrations removed every index, trigger and
function, and the files applied cleanly again after them. That is a stub, not
the live project: the first run in the dashboard is the real test, and each
file ends with the query that shows it took.
