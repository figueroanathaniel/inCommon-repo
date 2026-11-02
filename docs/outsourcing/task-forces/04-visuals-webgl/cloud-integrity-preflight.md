# Cloud deduplication and RLS preflight

Date: 2026-11-02 UTC
Scope: owner-requested cloud security follow-up after the visual deployment.
No migration, policy change or production fixture write was executed.

## Phase 1: proposed migration is incompatible

Live profiles has id (UUID primary key), account_id and name. It has no
user_id, profile_name or payload columns. CREATE TABLE IF NOT EXISTS cannot
reshape that existing table. The supplied DELETE would therefore error,
and deduplicating by a person's display name is not an established identity
contract. Profile pushes already name onConflict: id.

AS PRIVILEGED is not PostgreSQL CREATE POLICY syntax. Existing profiles
policies already require authenticated ownership through account_id and
include a restrictive optional-MFA rule. Replacing them with a generic
ownership rule is not the requested data model.

The v2.9.5 append repair targets throughline_entries and oki_messages.
It looks up existing rows by profile/local identity or timestamp and updates
by server id. It is not a database uniqueness guarantee against racing
clients. The live schema has primary keys on id but no unique profile/local
key on those tables. A read-only aggregate query found zero duplicate groups
for non-null (profile_id, local_id) in each table at inspection time. This
says nothing about null-key duplicates, semantic duplicates or future races.

A correct follow-up migration must agree a stable entry identity with the
sync contract, reconcile legacy/null identities, and adjust conflict handling
before enforcing a new key. Schema and security owners should review that
change under the existing standing programme. No arbitrary profile-name
constraint or historical-row deletion was substituted for that design.

## Phase 2: fail-closed integration probe

Added tools/test-rls-integrity.js using native Node fetch against the Auth
and PostgREST endpoints, with no new dependency. It uses real profile fields.
Required environment variables:

- SUPABASE_URL
- SUPABASE_ANON_KEY (public API key)
- SUPABASE_TEST_USER_A_JWT (valid disposable-user session)
- SUPABASE_TEST_USER_B_JWT (different valid disposable-user session)

Configure session tokens through the execution environment's secret facility,
not repository files or chat. Sessions must satisfy MFA requirements where
applicable. The users must have provisioned accounts in the selected project.
Prefer a disposable test project with the reviewed production policies.

The probe verifies both sessions with Auth, requires successful seeding and
owner reads for both users, proves UUID replay updates the same profile,
checks cross-owner and anonymous reads, cross-owner update/delete isolation,
owner reassignment denial and cross-owner insert denial. It requires explicit
Postgres 42501 denial for forbidden inserts/reassignment. Network failures,
invalid JWTs, missing grants, failed seeding and unexpected responses fail.
Randomly generated fixture ids are cleaned up through their owner's session,
and cleanup failures make the run fail. No service-role fallback is used.
These checks cover profiles only, not every table or the full sync pipeline.

Executed:

node --check tools/test-rls-integrity.js
Exit 0, syntax valid.

node tools/test-rls-integrity.js
Exit 2:
NOT RUN: missing SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_TEST_USER_A_JWT, SUPABASE_TEST_USER_B_JWT

No isolation assertion ran. No security sign-off or zero-leakage claim is made.
No new helper review occurred. This follow-up changes neither the deployed
bundle nor the production database. The read-only schema/policy/duplicate
inspection does not substitute for an authenticated RLS integration run.
