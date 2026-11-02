# Mixed-version sandbox concurrency receipt

Date: 2026-11-02 UTC
Branch: taskforce/04-visuals-webgl
Starting SHA: 70a37b1c224fd3a1172f21849c31eed520f59b28
Delivery: the commit containing this receipt.
Target: https://taejnlrhfitqhqmijvxa.supabase.co only.
Production was not queried or changed in this test pass.

## What ran

Added tools/test-mixed-concurrency.js using the repository's exact sandbox
origin guard. It rejects production, arbitrary origins, paths, URL credentials
and unsafe override. Node syntax and target guard checks passed, including
unsafe override rejection for both remote test entrypoints.

The sandbox was ACTIVE_HEALTHY on PostgreSQL 17.11.0.011. Read-back confirmed
standard UNIQUE (profile_id, local_id) on both tables and GENERATED ALWAYS
identity id columns. One disposable confirmed Auth/email fixture and account
were seeded using a bcrypt password hash. Supabase Auth minted a real password
session. The test created and read its real owner profile before any write.
No mock JWT or administrator token was used in assertions, and no MFA policy
was changed. The user had no enrolled MFA factor.

Executed node tools/test-mixed-concurrency.js with private environment values
and NODE_USE_ENV_PROXY=1 for this managed executor. Exit 0: all EXPECTED
failure/control assertions passed. This means legacy incompatibility was
reproduced, not that mixed-version coexistence is safe.

The script reproduces 2.9.5/2.9.6 PostgREST request shapes. It is not an
execution of two full historical browser apps or their complete sync modules.
The deterministic barrier orders legacy empty SELECT, modern composite write,
then the legacy id-targeted write based on stale information. Separate tests
send real concurrent legacy/legacy and modern/modern HTTP write pairs.

## Results, identical on Throughline and Oki

| Case | Result |
|---|---|
| Legacy preflight | 0 matching rows |
| Modern composite upsert | HTTP 201 |
| Legacy stale upsert on id, omitting id | HTTP 409, PostgreSQL 23505 |
| Legacy matched-row upsert explicitly supplying server id | HTTP 400, PostgreSQL 428C9 |
| Uncontested legacy insert omitting server id | HTTP 201, identity allocated |
| Two legacy writes after empty reads | one success, one 409/23505, one stored row |
| Two modern composite writes | both succeed, same server id, one stored row |

The stale legacy request left the modern payload and id unchanged. The
matched-id rejection also left the stored row unchanged. Full sanitized
terminal output is in output.txt; no passwords, JWTs, user IDs or payload
contents are included.

Important correction: an omitted GENERATED ALWAYS id is accepted and allocated
by PostgreSQL. Supplying a non-default id is what produced 428C9. Lookup plus
upsert is not an atomic UPDATE, even when a preceding lookup found a row.

## Cleanup and boundary

The script deleted its owner profile and cascading test entries in finally.
The session was signed out globally and the disposable Auth user deleted.
Read-back counts were zero for auth.users, auth.sessions, accounts, profiles,
throughline_entries and oki_messages. Private temporary fixture/session files
were removed. Access-token cryptographic expiry is distinct from sign-out;
no claim is made that issued access tokens are invalidated before expiry.

No schema changes, constraint removal, production deployment, backfill or
compatibility shim were performed. The production rollout remains blocked
pending a reviewed compatibility layer or controlled maintenance approach.
No blanket zero-downtime or full security sign-off is supported by this run.
Full browser/client journeys, server translation-layer design, historical data
reconciliation and independent review remain outside this test. Existing
sandbox advisor warnings remain as recorded in remote-sync-validation.
