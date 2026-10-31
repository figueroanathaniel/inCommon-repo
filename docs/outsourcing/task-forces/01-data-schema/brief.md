# Brief 1: Data Mapping & Schema Architecture

Shared entry: [FOUNDATION.md](../../FOUNDATION.md) and the current
[role prompts](../../BOT-PROMPTS.md), with the central roster and programme.
Use the same startup and completion receipts as every other role.

## Current handoff

1.3 is concluded. 1.2 remains READY with partial implementation in main;
2.2 is DONE. Reconcile remaining rollout and later owner decisions. Keep
1.4 separate. The PR #96 checklist below is a historical review method.

Agents: named in the roster in 00-README.md, workstream 1 (Task Force 1).
Branch: the Task Force 1 branch named in CHARTER.md (since 28 October 2026).
Read 00-README.md, CHARTER.md and CLAUDE.md first.

## What exists today

inCommon is offline first. Every reader's data lives on the device in
localStorage, and a signed in reader with consent also syncs to Supabase.

- Device: app/profile-manager.js (ProfileManager) owns profiles, memories and
  consent on the device. Keys are namespaced per account through acctKey()
  and PM.accountKey(); per profile keys look like incommon.p.<id>.birthName.
  About 47 distinct incommon.* keys appear across the app and its modules.
- Sync: app/incommon-cloud.js is the ONLY code allowed to talk to Supabase.
  Its header states the sync model: push is idempotent and consent gated,
  pull brings the whole account down and merges three ways using a hash
  cache as the common base. Local ids are the remote primary keys.
- Server tables: server/cloud-schema.sql (accounts, profiles, memories,
  throughline_entries, oki_messages, consent_events, pairs),
  server/oracle/schema.sql (oracle_readings, subscriptions, luminary_unlocks),
  server/store/schema.sql (store_subscriptions), server/support.sql
  (support_requests).
- Contracts: data-contracts/ holds local-storage-schema.md, the storage audit
  and STORAGE-MIGRATION-POLICY.md. local-storage-schema.md describes the V1.2
  prototype (key incommon_state_v1) and is badly out of date.

## The job

1. Map every piece of data the app keeps, end to end. For each item: the
   localStorage key or keys, the ProfileManager field, the cloud table and
   column, the consent category that gates it (CATS in the app: birthData,
   journal, relationships, assessments, mood), and whether it syncs at all.
   Find every key by searching the code, not by reading the old document.
2. Replace data-contracts/local-storage-schema.md with that map. Mark each
   key that is device only, account scoped or profile scoped.
3. Find gaps and mismatches, and list them before fixing anything:
   - device data with no cloud home, or cloud columns nothing writes
   - names or shapes that differ between device and server
   - columns missing NOT NULL, CHECK constraints or indexes their queries need
   - anything a sign out, an account delete (server/account/index.ts) or
     "Clear birth data" fails to remove
4. Fix what is safe, as new migration files. Never edit a table in place;
   write server/migrations/<YYYYMMDD>-<name>.sql that is idempotent
   (if not exists) and reversible (include the down migration in a comment).
5. Every new table is created with row level security ENABLED and NO
   policies (deny all). Workstream 2 writes its policies. Say which tables in
   your pull request.

## Rules specific to this work

- The sync rules in the incommon-cloud.js header are not negotiable: never
  send a memory whose consent gate is closed, never resurrect a deletion,
  never mint ids, never hold the service key.
- Read data-contracts/STORAGE-MIGRATION-POLICY.md before changing any
  device key. A renamed key needs a migration that reads the old one, or
  readers lose their data on update.
- The registration card (26 October 2026) writes birth data into the active
  profile, removes the sample marker, and stores a phone number as
  contact_phone in Supabase user metadata. Map those too.
- Module tests K1 to K79 cover incommon-cloud.js. Add rows for anything you
  change, in tools/run-module-tests.js, following the existing style.

## Done means

- data-contracts/local-storage-schema.md rewritten from the code.
- A data map table (device, server, consent, sync) in data-contracts/.
- Migrations in server/migrations/, each with a down migration.
- Every gate in 00-README.md passes.
- Pull request lists the tables that need policies from workstream 2, and the
  exact order the owner applies the migrations in.

## Secondary and tertiary

Approved by the owner on 27 October 2026. "Helpers" in 00-README.md applies
to every block below: the browser runner, shared seats, and the helper log
every pull request ends with. Who holds each seat is in the roster.

**Secondary** (repo access, full context). Reviews current follow-up ranges.
The checklist for PR #96 below is the historical 1.1 method; 1.1 is DONE.
Reuse relevant checks for new changes without repeating that assignment:

1. Rebase hygiene. deploy/ was rebuilt, not hand-merged: run
   "node tools/build-bundle.js" and confirm git shows no diff afterwards.
   CLAUDE.md lost no section from main: compare the output of
   "grep -n '^## ' CLAUDE.md" with main's.
2. The map is built from the code. Pick ten keys from DATA-MAP.md at random
   and list them in the review. Trace each by grep to where it is written
   and read, and confirm the map's writer, scope and consent gate.
3. The migrations, on a local Postgres 16 with cloud-schema.sql and the
   stubbed auth schema:
   a. Reproduce G1 before 0002: switch the active profile, push, and see
      "profiles_one_active" refuse it. Apply 0002 and see it pass.
   b. Apply each of 0001 to 0003 twice, run its DOWN, apply it again. Every
      run is clean, and the second apply changes nothing.
   c. Confirm server/mfa-policies.sql still refuses an aal1 session with a
      verified factor after all three.
4. The client fix (G8). Put the old memoryAllowed() back and run K71: red.
   Restore the fix: green.
5. Nothing touches another workstream's files, apart from the CLAUDE.md
   pointer and the rebuilt bundle.

Verdict: "ready to merge" or "not ready", with findings ranked, each with a
file and line. It takes the branch over only if the primary fails the same
gate twice or goes silent for a working day.

**Tertiary** (chat only, no repo). Public documentation lookups only.
Allowed questions look like:

- "In Postgres 16, can a BEFORE INSERT trigger update another row of the
  same table without deadlocking under concurrent inserts?"
- "How does supabase-js upsert behave when onConflict names a partial unique
  index?"

Never paste the schema, DATA-MAP.md, a migration, any table or column name
from server/, or the project ref. Each answer must cite official Postgres or
Supabase documentation. The primary checks the citation and records the
check in the helper log.
