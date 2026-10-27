# Brief 2: Security Hardening & RLS Setup

Agents: named in the roster in 00-README.md, workstream 2.
Branch: security/<topic> from current main.
Read 00-README.md and CLAUDE.md first. Start after workstream 1 has merged,
or work only on tables that already exist and say so.

## What exists today

Read these before anything else:
- docs/SECURITY.md: the 11 October 2026 review, what was checked, what was
  fixed, and the owner's dashboard checklist.
- docs/security-pass-2026-10/SECURITY-TESTPLAN-2026-10-12.md: the
  adversarial test plan. Test 2, row level security, matters most.
- docs/TURNSTILE-SETUP.md and docs/TWO-STEP-SETUP.md.

Current state:
- RLS is enabled on the seven sync tables in server/cloud-schema.sql, each
  with an "own rows" policy, and on oracle_readings, subscriptions,
  luminary_unlocks, store_subscriptions and support_requests.
  server/mfa-policies.sql adds the two-step rules.
- Edge functions in server/account, billing, oracle, oracle-voice and store
  ask the auth server who the caller is and refuse without a session. The
  Stripe webhook is trusted only when its signature verifies.
- deploy/<current>/_headers sends a Content-Security-Policy, frame-ancestors,
  nosniff, Referrer-Policy, Permissions-Policy, HSTS and COOP.
  'unsafe-eval' and 'unsafe-inline' remain because the template runtime
  compiles with new Function and the pages carry inline scripts and styles.
- Cloudflare Turnstile is wired but switched OFF (TURNSTILE_SITE_KEY is ''
  in app/cover.html) since a Cloudflare outage on 12 October 2026.

## The job

1. Audit every table in server/ for: RLS enabled, a policy for each of
   select, insert, update and delete, policies that test auth.uid() against
   the row's owner column, no policy that trusts a value the client sends,
   and no grant to anon beyond what the app needs.
2. Write policies for every table workstream 1 added (they ship deny all).
3. Write an automated two-user isolation test: tools/check-rls.js. It reads
   SUPABASE_URL and two throwaway test accounts from environment variables,
   never from the repo, signs in as A, writes rows, signs in as B, and proves
   B can neither read, update nor delete A's rows in every table. It must
   refuse to run against the production project unless an explicit flag is
   passed. Document how to run it in docs/SECURITY.md.
4. Audit each edge function for: a session check before any work, input
   validation (types, lengths, enums), no service role key returned or
   logged, and rate limits where a call costs money (Oracle, SMS, email).
5. Review the CSP in deploy/<current>/_headers. Tighten connect-src, img-src and
   frame-src to exactly what the app uses. Do not remove 'unsafe-eval' or
   'unsafe-inline' without proving the app still runs; the runtime needs them.
6. Write the steps to switch Turnstile back on, in the order
   docs/TURNSTILE-SETUP.md requires (page first, then Supabase), as a
   checklist for the owner. Do not switch it on yourself.
7. Check the account delete path (server/account/index.ts) removes every row
   in every table, including anything workstream 1 added.

## Rules specific to this work

- Policies and migrations are files; the owner applies them. Never run SQL
  against the production project.
- Never print, log or commit a token, key or password, even a test one.
- Every finding gets a severity (reader data first, owner money second,
  availability third, the test plan's order) and either a fix or an owner
  action.
- K15 to K79 in tools/run-module-tests.js cover the auth paths in
  incommon-cloud.js. Add rows for anything you change.

## Done means

- Policies for every table, as migration files, with a down migration each.
- tools/check-rls.js, documented, refusing production by default.
- docs/SECURITY.md updated with every finding, fix and owner action.
- Every gate in 00-README.md passes.
- Pull request lists the owner's dashboard steps in the order to do them.

## Secondary and tertiary

**Secondary.** Always a blind review. Independence is the point of this
seat, and never more than while the roster gives it the same model as the
primary, which brings no different perspective of its own:
1. Start a fresh session with no access to the primary's notes, chat or pull
   request description. Give it this brief and the branch name only.
2. It audits the branch's policies and edge functions from scratch, writing
   its own findings list before reading the primary's.
3. Then it compares the two lists. Every finding on one list and not the
   other gets resolved in the pull request: fixed, or explained.
It also runs tools/check-rls.js itself against the throwaway test project.

**Tertiary.** Assumed chat only, with no repo, unless the roster says
otherwise. Use it only for general, public
questions: how a CSP directive behaves in a given browser, what a Postgres
policy keyword means, the published steps for a Supabase setting. Never give
it a policy, a finding, a table name, the project URL, or anything that
describes a weakness that is not fixed yet. Verify every answer against the
official documentation before relying on it.
