# Coordinated sync 2.9.6 draft and local verification receipt

Date: 2026-11-02 UTC
Branch: taskforce/04-visuals-webgl
Start SHA: bebaa0a0ca4dc28d51489a632a1c9c2bce576f94
Delivery: the commit containing this receipt.
Status: draft implemented, local stack BLOCKED, not approved for production.

## Client and database contract

app/incommon-cloud.js is version 2.9.6. Non-null local IDs on both
throughline_entries and oki_messages upsert on profile_id,local_id without
sending id. Sending the server identity could otherwise overwrite an id or
be rejected by GENERATED ALWAYS. Writes stay sequential to preserve cache
acknowledgments and stop on error; no parallel batch hides partial failures.
Missing composite constraints fail closed, without falling back to append.

Null-key entries retain the timestamp lookup. Matching timestamps normalize
Z and +00:00 to the same instant. A match updates by server id, preserving
any stable local key already attached to it. Unmatched unkeyed entries insert
without an id. That legacy path is explicitly NOT race-deduplicated. A new
keyed identity never steals another row just because their timestamps match.

The CLI-generated migration is:
supabase/migrations/20261102165406_composite_deduplication.sql

It adds standard unique constraints on both profile/local keys, permits
multiple NULL keys, requires RLS enabled, locks both tables while applying,
and never deletes rows. Existing keyed duplicates abort and roll back the
transaction. Reapplying verifies the named constraint shape rather than
dropping/recreating it. A DOWN comment is included. It changes no RLS policy,
MFA requirement or auth function. Existing historical duplicates require a
separate data-owner reconciliation, never implicit deletion.

This is a coordinated DRAFT, not a production migration history baseline.
The repo's schema authority remains server/cloud-schema.sql and numbered
server/migrations/. The local preparation tool reads those canonical files
and the new timestamped patch, rather than making another schema copy.
Do not run db push against the linked project or treat an otherwise empty
supabase/migrations folder as a complete bootstrap.

## Reproduce on a healthy Docker machine

Supabase CLI 2.81.3 was selected for this run. Create an isolated directory
whose config project_id is incommon-sync-local. Do not link it to production.

```bash
mkdir -p /tmp/incommon-sync-local
supabase init --workdir /tmp/incommon-sync-local
supabase start --workdir /tmp/incommon-sync-local \
  -x studio,postgres-meta,realtime,storage-api,imgproxy,mailpit,edge-runtime,logflare,vector,supavisor
node tools/prepare-sync-local.js /tmp/incommon-sync-local
SUPABASE_CLI=supabase node tools/run-sync-local.js /tmp/incommon-sync-local
```

prepare-sync-local refuses an existing profiles table, loads the canonical
v2 schema, support/oracle/store schemas, every numbered migration and MFA
policies, then applies the proposed constraint patch twice. It operates only
through the named local Docker container; no remote DB URL is accepted.

run-sync-local captures local CLI credentials in memory, requires localhost,
creates two disposable Auth users with the local admin API, signs them in by
password, provisions accounts, and runs both tests with their real sessions.
Local admin privileges are only used for fixture creation/deletion. Test
assertions use ordinary authenticated tokens; no mock JWT or MFA bypass.
Local users have no enrolled MFA factors, so this is not a claim to test
AAL2 enrollment or verified-factor denial. The runner deletes the users in
finally. Credentials are not logged or written into the repository.

The race test uses bigint server IDs and JSONB payload, not UUID id/content.
For EACH table it attempts ten simultaneous twin-client upserts, asserts one
row per local key and a stable server id across replay/edit, checks user B
cannot read user A's rows, preserves two null-key legacy rows, and requires
Postgres 42501 on cross-owner insert. It fails on any request/assertion error.
The separate RLS probe checks profile owner positive controls, cross-owner
reads/updates/deletes/inserts and reassignment. These scripts are not a full
end-to-end browser sync or every-table security audit.

## Actual environment results

The managed Docker socket is reachable with sandbox network access.
The latest CLI (3.0.0) failed trying to write its runtime home directory on
the read-only filesystem. CLI 2.81.3 was downloaded through the configured
proxy and verified against its published SHA-256 checksum; init succeeded
in the isolated workdir. The repo's existing Supabase connection was not
changed or used for start/reset/push.

supabase start did NOT initialize cleanly. Docker twice failed registering
the database image layers with no space left on device. The retrying CLI
process was stopped. No DB container or usable test sessions were created.
See local-start-errors.txt. No Docker daemon storage settings were changed,
no unrelated images were pruned and no remote resources were provisioned.

SUPABASE_CLI=/tmp/incommon-supabase-bin/supabase node tools/run-sync-local.js /tmp/incommon-sync-local
Exit 2: NOT RUN: local supabase status failed; start the disposable stack first.

node tools/test-concurrent-race.js
Exit 2: NOT RUN: configure local URL, API key and two real test-user JWTs.

node tools/test-rls-integrity.js
Exit 2: NOT RUN: missing SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_TEST_USER_A_JWT, SUPABASE_TEST_USER_B_JWT

Therefore no authenticated concurrency or RLS pass logs exist. The proposed
SQL was NOT executed on PostgreSQL. Bootstrap/provisioning helpers pass Node
syntax checks but have not completed an integration run. More Docker backing
storage or a recovered local environment is required before retrying.

## Checks that did run

run-module-tests: 522/522 passed. New cases exercise null-key legacy edits,
Postgres timestamp formatting, missing-constraint refusal/retry and distinct
keys with identical timestamps. The mock models GENERATED ALWAYS rejection.
These are client tests, not proof that a real database resolved a race.

Also passed: run-tests-node, run-fixtures, check-layer-boundary,
check-dead-controls, token-compare, check-purple-text, check-three-lifecycle.
Node syntax checks passed for the client and three new test/setup scripts.
Full browser gates, PostgreSQL migration/advisors, authenticated tests, and
independent review remain unrun. No new helper review occurred.

## Build and rollout boundary

node tools/build-bundle.js: exit 0, 63/63 modules inlined. Cover now requests
incommon-cloud.js?v=2.9.6, and generated artifacts are committed with source.
app.html: 11,948,750 bytes; SHA-256:
f9d158b70cf22a3596cda4f813607e55642d69a4361b7cfcb23fe4c6c60cfe3a

Production remains the previously deployed 2.9.5 bundle. No Supabase write,
Netlify deploy, merge to main or release approval was performed in this pass.
Do not release this client before its matching constraints exist. Old 2.9.5
clients can still hit 23505 after constraints are added; a maintenance window
or reviewed compatibility strategy is required, with schema/security owner
review and real local tests passing before deciding the production sequence.
