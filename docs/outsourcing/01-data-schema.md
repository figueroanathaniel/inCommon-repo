# Brief 1: Data Mapping & Schema Architecture

Agents: named in the roster in 00-README.md, workstream 1.
Branch: schema/<topic> from current main.
Read 00-README.md and CLAUDE.md first.

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

**Secondary.** Reviews the pull request before it merges.
Specifically:
- Picks ten keys at random from the new data map and traces each through the
  code itself (grep for the key, read where it is written and read), to prove
  the map was built from the code and not from the old document.
- Runs every migration's up and down against a local or throwaway Postgres
  (never the production project) and confirms each is idempotent: running it
  twice changes nothing the second time.
- Confirms every new table ships with RLS enabled and no policies.
Takes the branch over if the primary stalls.

**Tertiary.** Assumed chat only, with no repo, unless the roster says
otherwise. Use it for public
documentation lookups: Postgres constraint and index syntax, Supabase
migration conventions, how supabase-js handles a given column type. Never
paste the schema, the data map or anything from server/ into it. Check every
answer against the official documentation it cites before using it.
