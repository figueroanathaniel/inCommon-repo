# Remote sandbox validation receipt, sync 2.9.6

Date: 2026-11-02 UTC
Branch: taskforce/04-visuals-webgl
Starting source: b16e38f4e53fa75f28e038a45d932c43506a84bf
Delivery: the commit containing this receipt.
Status: scoped remote race and RLS checks passed; production approval separate.

## Provisioning and schema

Owner selected figueroanathaniel's Org, akeidbcubkqkstobwvpz, at $0 only.
The organization reports Free; get_cost quoted amount 0, recurring monthly.
Created incommon-sandbox-2026 in us-east-1; status ACTIVE_HEALTHY.
Actual project reference: taejnlrhfitqhqmijvxa
API origin: https://taejnlrhfitqhqmijvxa.supabase.co
Dashboard: https://supabase.com/dashboard/project/taejnlrhfitqhqmijvxa
The display name is not an API project reference.

Verified an empty public schema before applying:
- server/cloud-schema.sql from its v2 marker only, without v1 cleanup;
- server/support.sql, server/oracle/schema.sql, server/store/schema.sql;
- numbered server migrations 0001 through 0017 in order;
- server/mfa-policies.sql;
- supabase/migrations/20261102165406_composite_deduplication.sql.

All 23 migration steps succeeded. Read-back confirmed each target table has
UNIQUE (profile_id, local_id). Reapplying the composite patch also succeeded.
No production data was copied and no production database or deployment was
changed. The sandbox remains available; it has not been deleted.

## Target protection and test harness

tools/test-remote-sandbox-race.js uses the exact project reference and origin
pinned in tools/fixtures/remote-sync-sandbox.json. Production is explicitly
forbidden, even if someone tries pinning it. HTTPS, a clean root origin,
no URL credentials, and no query/path/fragment are required. There is no
substring match and ALLOW_UNSAFE_TARGET is rejected. HTTP redirects are
rejected so credentials cannot follow a redirected target.

The local-only entrypoint retains its localhost restriction. Both wrappers
share assertions in tools/lib/sync-race-suite.js. This tests the real SQL/
PostgREST contract, not the full browser sync loop. Keyed races are two
concurrent requests under one owner's valid session. User B's writes are
separate negative assertions; rejecting B cannot prove a race succeeded.

node tools/check-remote-sandbox-target.js: exit 0. Exact target allowed;
seven invalid URLs, a production pin, a missing pin, and unsafe override
rejected. The subprocess assertion required sandbox network permission here.
Node syntax checks passed. Client module suite remains 522/522 passing.

## Real sessions and results

Two disposable confirmed email fixtures were seeded in the sandbox's auth
users/identities and account rows with bcrypt password hashes. Supabase Auth
then minted real session JWTs through two successful password logins. The
assertions used only ordinary user tokens and a public publishable API key,
not an admin/service-role token or a fabricated JWT. No MFA policy was changed;
users had no enrolled MFA factors, so the existing rule legitimately allowed
AAL1. Verified-factor/AAL2 behavior is not covered by this run.

Secrets stayed in mode-0600 temporary files and child-process environment;
no passwords, hashes, API keys or tokens were committed or printed in receipts.
Node's configured proxy was enabled with NODE_USE_ENV_PROXY=1. Executed:

node tools/test-remote-sandbox-race.js
Exit 0. See race.txt.

For BOTH throughline_entries and oki_messages:
- Ten concurrent write pairs, each resolving to one row and the same server id.
- Replay/edit kept that id and updated the payload.
- User B saw no user A rows after each race.
- Two null-key legacy rows remained distinct, as designed.
- Cross-owner inserts failed with HTTP 403 and PostgreSQL 42501.

node tools/test-rls-integrity.js
Exit 0, eight integration checks. See rls.txt.
Both users had successful owner create/read controls. Profile UUID replay,
B/anonymous read isolation, B update/delete isolation, owner reassignment
denial and B insert denial all passed. Auth, seed or network failures would
fail the suite rather than count as an isolation pass.

## Cleanup

Both suites deleted their own profile fixtures. Both sessions were signed out
globally; the two sandbox auth users were then deleted. Read-back counts:
auth.users 0, auth.sessions 0, accounts 0, profiles 0, throughline_entries 0,
oki_messages 0. Temporary password/session files were removed. Signing out
and deleting a user is not a claim that an already issued access JWT is
cryptographically invalid before expiry; its test data and users are gone.

## Remaining limits and security notices

Security advisors still report inherited support_requests_throttle()
SECURITY DEFINER execution grants to anon and authenticated, plus disabled
leaked-password protection. See the official remediation guides:
https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

These findings were not hidden or changed to make this run green. They need
their own review; scoped passing tests are not a blanket security sign-off.

No full browser sync, verified-MFA negative cases, historical duplicate repair,
full-table audit, old-client rollout compatibility or independent helper review
was performed. Old 2.9.5 clients remain a rollout consideration after new
constraints, and null-key legacy concurrency is deliberately not deduplicated.
Production remains version 2.9.5. No merge to main, production migration or
Netlify deployment occurred. Coordinate the maintenance/compatibility plan
and schema/security review before approving production 2.9.6.
