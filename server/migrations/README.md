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

None of them creates a table, so `server/mfa-policies.sql` does not need to be
run again for them.

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
