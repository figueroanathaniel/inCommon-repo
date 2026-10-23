Append to docs/SECURITY.md:

## Review of 12 to 13 October 2026

A full adversarial pass ran against the live project and site, recorded end
to end in `docs/SECURITY-TESTPLAN-2026-10-12.md`. Every runnable test
passed: keyless refusal and anonymous silence on all twelve data tables,
RLS enabled on all thirteen public tables, every policy scoped to its
caller, insert-only support, anonymous refusal on both Edge Functions,
forged webhook signatures rejected (400), and two-reader isolation proven
on both the read and the write path. The secrets sweep across the whole
tree and history came back clean.

One live finding: every signed-in query on the MFA-governed tables had been
failing 42501 since 11 October because `server/mfa-policies.sql` never
granted SELECT on `auth.mfa_factors` to `authenticated`. Fixed on the live
project the day it was found; the file now carries the grant, so the failure
cannot recur on re-apply. The same commit extends the restrictive policy to
`cast_counters` and `entitlements`, exports the dashboard-only schema to
`server/cloud-schema.sql`, restricts the billing `returnTo` to our own
origins, and pins the Edge Function dependencies (stripe 17.7.0,
supabase-js 2.117.2). Known risk 4 above is thereby closed; risk 3 is
bounded by the daily reading limit and Turnstile at signup and remains the
accepted design.
