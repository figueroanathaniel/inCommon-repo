# Brief 2: Security Hardening & RLS Setup

Agents: named in the roster in 00-README.md, workstream 2 (Task Force 2).
Branch: the Task Force 2 branch named in CHARTER.md (since 28 October 2026).
Read 00-README.md, CHARTER.md and CLAUDE.md first. Start after workstream 1 has merged,
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

Approved by the owner on 27 October 2026. "Helpers" in 00-README.md applies
to every block below: the browser runner, shared seats, and the helper log
every pull request ends with. Who holds each seat is in the roster.

**Secondary** (repo access, full context; while the roster gives this seat
the same model as the primary, independence is its whole value). A blind
review, and it does NOT receive the private addendum first:

1. A fresh session with no access to the primary's notes, chat, PR
   descriptions or the private addendum. Give it this brief, 00-README.md
   and the branch names only.
2. It audits from scratch and writes its findings to a private file, never
   the PR, before reading anything else:
   - every policy in server/*.sql;
   - all five server/*/index.ts edge functions. For each: auth (getUser plus
     the aal2 rule), entitlement, limits, input sizes, which values the
     client controls, CORS, and every outside call it makes;
   - deploy/<current>/_headers, and sw.js scope.
3. Only then does the owner give it the addendum and the primary's PRs.
   Every finding on one list and not the other is resolved on the PR: fixed,
   or explained. Whether its blind list found the addendum's first finding
   is reported to the owner. Either way, it is the measure of the blind
   pass.
4. For each fix PR, it confirms the test fails without the fix: check out
   the parent commit, run the test, see red.
5. After any policy change, it reruns server/mfa-policies.sql's own checks.

Its private findings file goes to the owner, not into the repository. It
never pushes to the primary's branch unless it has taken it over.

**Tertiary** (chat only, no repo). General public questions only, and none
that hints at an unfixed weakness. Allowed:

- "In a Deno edge function, how do you answer CORS for a list of allowed
  origins, given that Access-Control-Allow-Origin takes one value?"
- "What search_path should a SECURITY DEFINER function set in Postgres, and
  why?"

Until a fix is deployed, never mention its subject: no named function, no
outside service, nothing like "a function anyone can call". Every answer is
checked against official documentation before use, and the check is
recorded in the helper log.
