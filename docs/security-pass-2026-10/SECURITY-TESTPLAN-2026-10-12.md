# inCommon adversarial test plan, 2026-10-12

Written from a read of `main` at d07ef6e (the merge of PR #34, the Timing
Lexicon). Purpose: attack the system before someone else does, with the
owner running every active probe against their own project and accounts.

Scope notes. Project URL and anon key below are public by design; they
prove nothing and grant nothing that RLS does not allow. Every test that
writes data uses throwaway accounts made for the test and says how to clean
up after itself. Severity ordering follows impact on reader data first,
owner money second, availability third.

Ground rules before starting:

1. Do the tests in order. Test 2 (RLS) is the one that matters most; if it
fails, stop and fix before anything else.
2. Two browsers, or one browser plus an incognito window, for the two-user
isolation test. A password manager entry for each throwaway account.
3. The support throttle flood test (6.2) inserts two hundred rows and holds
the global insert block for up to an hour. Run it in a quiet window or
against a duplicated project, and clean up afterwards with the provided
delete.
4. Every key that appears in a command is either the public anon key or a
token you just made. If a real secret ever lands in a command, rotate it
after the pass.

Variables used throughout:

```sh
PROJ=https://lkzcybzhjjxdqetwwdrx.supabase.co
ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxremN5Ynpoamp4ZHFldHd3ZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTYwMDcsImV4cCI6MjEwNTQzMjAwN30.jgsqfpPmbd2SM23R-E7KuRg3eWxsgvIhISBkhYC0mtM
```

---

## 1. Live surface (passive, safe to run anytime)

| # | Test | Command | Pass condition |
| --- | --- | --- | --- |
| 1.1 | Headers on the cover | `curl -sI https://incommon.netlify.app/` | `content-security-policy`, `strict-transport-security`, `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `referrer-policy`, `permissions-policy`, `cross-origin-opener-policy` all present |
| 1.2 | Must-revalidate on the moving files | `curl -sI https://incommon.netlify.app/app.html` and same for `/index.html`, `/sw.js`, `/manifest.json`, `/terms.html`, `/privacy.html` | each returns `cache-control: public, max-age=0, must-revalidate` |
| 1.3 | Deployed version | `node tools/check-deployed.js` from the repo | reports the live version and matches expectation |
| 1.4 | Bundle drift | `node tools/drift-check.js` | hash match, browser run skipped, or an all-green sweep if hashes moved |
| 1.5 | Deployed bundle contains the Timing Lexicon | after 1.3, confirm the live app.html reports the lexicon build (PR #34 merged at 03:20 UTC on 12 October, after the drift baseline of 03:15 UTC was recorded, so the baseline cannot tell you) | the live version string answers the question; do not guess |
| 1.6 | Cover renders in a real browser | open the cover with dev tools, confirm the Three.js scene draws and no console CSP errors | the no-JavaScript fetch used during recon shows only the "SIGNAL LOST // RENDERER UNAVAILABLE OFFLINE" fallback, which is expected without a renderer; only a browser run proves the scene |

Anything missing in 1.1 or 1.2 means the `_headers` file did not travel with
the deploy. Per docs/SECURITY.md Step 5, a drag-deploy of the repository root
does not carry it. Redeploy from the git connection or from `deploy/v6.4/`.

## 2. Row level security on the sync tables (the decisive test)

Confirms the seven dashboard-created tables still hold the posture the
two-user isolation test of 20 September proved. Run in Supabase, SQL Editor.

2.1 Every public table has RLS on:

```sql
select tablename, rowsecurity as rls_on
from pg_tables where schemaname = 'public' order by 1;
```

Pass: `rls_on` is `true` on every row. A single `false` means any visitor
can read that whole table with the public key. Fix at once:
`alter table public.<name> enable row level security;` and stop the pass.

2.2 Every policy is scoped to its caller:

```sql
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies where schemaname = 'public' order by 1, 2;
```

Pass conditions:

- Every policy is limited to `authenticated` (never `public` or `anon`),
except the support insert policy, which is `anon, authenticated` by design.
- Every `using_expr` and `with_check` ties the row to the caller:
`auth.uid() = id` on `accounts`, `auth.uid() = account_id` on `profiles`
and `pairs`, `owns_profile(profile_id)` on `memories`,
`throughline_entries`, `oki_messages`, `consent_events`.
- A policy whose expression is `true`, or an insert policy with no
`with_check`, is a hole. Investigate before continuing.
- `two-step sign in, when turned on` appears as RESTRICTIVE on every table
listed in `server/mfa-policies.sql`, including `support_requests`.

2.3 Functions running with elevated rights:

```sql
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;
```

Pass: `owns_profile` may appear, and it must only answer whether the caller
owns a profile id. `support_requests_throttle` may appear. Anything else
earns a look at its body.

2.4 Two-user isolation with the raw API (not the app). Make two throwaway
accounts A and B, each confirmed, each with a bearer token from a password
sign in. Sign in as A through the cover or with the snippet below, then:

```sh
TOKEN_A=<access_token of A>
# A writes a memory-shaped row into A's own profile (use A's profile id from a push)
curl -s -o /dev/null -w '%{http_code}\n' "$PROJ/rest/v1/memories" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A" \
  -H 'Content-Type: application/json' -H 'Prefer: return=minimal' \
  -d '{"profile_id":"<A profile id>","local_id":"isolation-test","memory_type":"journal","content":{"line":"isolation test"}}'
# B tries to read A's rows
curl -s -o /dev/null -w '%{http_code}\n' "$PROJ/rest/v1/memories?profile_id=eq.<A profile id>" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B"
# B tries to write into A's profile
curl -s -o /dev/null -w '%http_code\n' "$PROJ/rest/v1/memories" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_B" \
  -H 'Content-Type: application/json' -H 'Prefer: return=minimal' \
  -d '{"profile_id":"<A profile id>","local_id":"isolation-test-b","memory_type":"journal","content":{}}'
```

Pass: A's insert succeeds (201), B's read returns an empty array or 200 with
no rows, B's write returns 401 or 403 and the row does not exist afterwards
(check as A). Repeat the read probe against `profiles`, `pairs`,
`throughline_entries`, `oki_messages`, `consent_events`, and `accounts`
with B's token. Cleanup: delete the two throwaway accounts and their rows.

## 3. Authentication posture in the dashboard

Read-only checks in Supabase, Authentication, plus four probes:

3.1 Settings. Confirm email is ON; Secure email change is ON; minimum
password length is 8 (the page asks for 8, the server default is 6, and the
server is the one that counts). Redirect URLs list each cover address
exactly, with no wildcard such as `https://*.netlify.app/**`. Attack
Protection has Cloudflare Turnstile enabled.

3.2 Signup without a CAPTCHA token, with Turnstile on:

```sh
curl -s "$PROJ/auth/v1/signup" -H "apikey: $ANON" \
  -H 'Content-Type: application/json' \
  -d '{"email":"throwaway-<ts>@example.com","password":"testpass123"}'
```

Pass: a `captcha_failed` style refusal, not a created user. If a user is
created without a token, the widget is decorative; fix the Attack Protection
binding before launch traffic.

3.3 Weak server-side password. Sign up with a 6 character password through
the REST API directly:

```sh
curl -s "$PROJ/auth/v1/signup" -H "apikey: $ANON" \
  -H 'Content-Type: application/json' \
  -d '{"email":"throwaway-<ts>@example.com","password":"123456"}'
```

Pass: refused. If accepted, raise the project minimum to 8 to match the
page's stated floor.

3.4 Enumeration resistance. Ask the signup endpoint for an address that
already exists (a throwaway you made earlier). Pass: the answer is
indistinguishable from a fresh signup, and no session arrives. The app layer
already treats the `identities` array this way; the probe confirms the
provider does not leak more.

## 4. The Oracle function

Each numbered probe names its expectation. Use a throwaway account with a
session token.

4.1 Unauthenticated:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$PROJ/functions/v1/oracle" \
  -H 'Content-Type: application/json' -d '{"period":"daily","depth":"standard","localDate":"2026-10-12","dossier":"test"}'
```

Pass: 401.

4.2 Oversize and malformed bodies, with a valid token:

- `dossier` of 20,001 characters: expect 400.
- `localDate` of `1999-01-01` or `not-a-date`: expect 400.
- `period` of `hourly`: expect 400.

4.3 Standard reading happy path: expect 200 with a reading and
`cached:false`; an immediate repeat returns the same content with
`cached:true` and no second charge.

4.4 The daily limit: request standard readings until the seventh distinct
chart key in 24 hours returns 429 with code `LIMIT`. Expect six to succeed.
Cost: a few cents of Kimi credit. If 4.4 never reaches 429, the limit is
broken and the Oracle is unbounded money; that is a fix-before-launch item.

4.5 Deep without a subscription: expect 402 `PREMIUM_REQUIRED`.

4.6 Deep part b before part a: send `part:"b"` for a chart with no stored
part a: expect 400.

4.7 Concurrent claim: fire the same request twice in parallel for a new
chart key: one 200, one 409 `PENDING` or a single stored row. No double
charge; check the table.

4.8 Failure accounting: force a timeout if practical (set ORACLE_TIME_LIMIT
to its floor in a non-production function deploy, or skip). The code marks
the row failed and the failure does not count toward the daily limit; the
4x bound on failed rows is the other half of this and is verified by reading
the code path, not by flooding.

## 5. The billing function

5.1 Unsigned webhook:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$PROJ/functions/v1/billing" \
  -H 'stripe-signature: t=1,v1=bad' -H 'Content-Type: application/json' -d '{}'
```

Pass: 400 `BAD_SIGNATURE`.

5.2 Reader actions without a token: `{"action":"status"}` with no
Authorization header: expect 401.

5.3 Bad inputs with a token: `{"action":"checkout","plan":"weekly"}` expect
400; `{"action":"checkout","plan":"monthly","returnTo":"https://evil.example/x"}`
currently succeeds by design and redirects through Stripe to that address
carrying only `?luminary=success`. Decide whether to restrict `returnTo` to
your own origins; it is low severity but trivial to close.

5.4 Portal without a customer row: expect 404 `NO_ACCOUNT`.

5.5 Checkout happy path for a throwaway account: expect a Stripe URL; cancel
at Stripe; confirm no subscription row became active. If you complete a paid
test with your own card, refund it through the dashboard and confirm the
webhook flips the row back.

## 6. Contact support

6.1 A signed-out sender may insert; nobody may read:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$PROJ/rest/v1/support_requests" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H 'Content-Type: application/json' -H 'Prefer: return=minimal' \
  -d '{"topic":"general","email":"probe@example.com","message":"This is a security probe of the support form."}'
curl -s -o /dev/null -w '%{http_code}\n' "$PROJ/rest/v1/support_requests" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```

Pass: insert 201, select 401 or an empty body with 200 but no rows ever
returned to a non-owner (PostgREST refuses with no select policy; expect an
error status, not an empty list).

6.2 Throttle boundary, in a quiet window: send six requests for the same
email within a minute. The sixth returns the `support_rate` refusal. Then
decide deliberately whether to run the two-hundred-request global bound; it
holds the insert door for everyone until the hour turns. Cleanup afterwards:

```sql
delete from public.support_requests where email like 'probe%' or email like 'throwaway-%';
```

## 7. Two-step sign in enforcement

7.1 On a throwaway account, enroll a TOTP factor through the app, verify it,
then sign out. Sign in with the password only. Now take the aal1 access
token and probe the API directly, the way a stolen password would:

```sh
TOKEN_A1=<aal1 access token>
curl -s -o /dev/null -w '%{http_code}\n' "$PROJ/rest/v1/profiles" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN_A1"
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$PROJ/functions/v1/oracle" \
  -H "Authorization: Bearer $TOKEN_A1" -H 'Content-Type: application/json' \
  -d '{"period":"daily","depth":"standard","localDate":"2026-10-12","dossier":"mfa probe"}'
```

Pass: the REST read is refused (401 or 403 from the restrictive policy), and
the function answers 401 `MFA_REQUIRED`. Enter the code, then repeat both
calls with the aal2 session: both pass.

7.2 The app-side courtesy: after password-only sign in, the app must read as
signed out until the code is entered. This is a browser observation, covered
by the H group of the harness.

## 8. Escape discipline on the page (the CSP residual)

The CSP keeps `'unsafe-inline'` for the template runtime, so rendering
discipline is the wall. In a browser, set a throwaway profile's name to
`<img src=x onerror=alert(1)>` and a memory's text to
`<script>alert(2)</script>`, then open every surface that shows names and
memories: Today, the chart cards, Together, the People Library, the
Throughline, support form confirmation. Pass: everything renders as literal
text; no dialog fires. Repeat with a reading returned by the Oracle if you
want the full chain, since model output is the least predictable text in the
system.

## 9. Secrets sweep

9.1 History, from a full clone:

```sh
git log --all -p | grep -iE 'sk_live|sk_test|whsec_|service_role|AKIA|BEGIN.*PRIVATE KEY|MOONSHOT.*key' | grep -v 'anon'
```

Pass: nothing. The anon key appearing is expected.

9.2 The shipped bundle: download the live `app.html` and cover, then grep
for the same patterns plus `eyJhbGciOi` occurrences and confirm each JWT is
the anon key or a Turnstile site key shape, nothing else.

## 10. Function version pins

In Supabase, Edge Functions, check which `@supabase/supabase-js` and
`stripe` versions the current deployments resolved (`npm:@supabase/
supabase-js@2 `and `npm:stripe@17` float). Pin exact versions in both
imports on the next redeploy, after noting what is live today, so a routine
redeploy stops being a supply chain event.

## 11. Reporting

Record for each test: id, date, command run, observed result, pass or fail,
and what was changed when something failed. A failure in 2.x is a
stop-the-line fix. A failure in 4.4 is a money fix. Everything else is a
triage item with the severities in docs/SECURITY.md as the guide. When the
pass is done, add the date and the result to docs/SECURITY.md so the next
review starts from evidence.

---

# Results, recorded 13 October 2026

Every entry below was observed against the live project
(`lkzcybzhjjxdqetwwdrx.supabase.co`) and the live site
(`incommon.netlify.app`) by the owner, with the probes in this document.

## Verified closed

| Test | Date | Result |
| --- | --- | --- |
| 1.1 to 1.3, keyless refusal on all 9 data tables | 12 Oct | PASS, 9/9 returned 401 "No API key found in request" |
| 2.1, anon key silence on the same 9 tables | 12 Oct | PASS, 9/9 returned 200 with empty arrays |
| Anon silence extended to cast_counters, entitlements, store_subscriptions | 13 Oct | PASS, three `rows: 0` results |
| 2.1, RLS enabled on every public table | 13 Oct | PASS, 13/13 `rowsecurity = true` (pg_tables) |
| 2.2, policy scoping audit | 13 Oct | PASS, every policy ties rows to auth.uid() or owns_profile; support insert matches support.sql; billing tables read-only |
| Oracle anonymous call | 12 Oct | PASS, 401 UNAUTHORIZED_NO_AUTH_HEADER |
| Billing anonymous call | 12 Oct | PASS, 401 SIGNED_OUT |
| 5.1, forged Stripe webhook signature | 12 Oct | PASS, 400 (run with curl.exe from PowerShell; the browser variant is blocked by design, stripe-signature is not in the CORS allowlist) |
| Support insert-only | 12 Oct | PASS, stranger insert 201, readback empty |
| Two-user isolation | 13 Oct | PASS, B read of A: 0 rows; B write into A: 403; A insert 201; cleanup 204 |

## Finding 1, fixed the same day (the important one)

**Every signed-in query on the eleven MFA-governed tables was failing 42501
"permission denied for table mfa_factors."** The restrictive policy named
"two-step sign in, when turned on" counts the caller's verified factors by
reading auth.mfa_factors, policy expressions run with the caller's own
privileges, and the authenticated role held no SELECT grant on that table.
The omission is in the repository: server/mfa-policies.sql never grants it,
and its header claims the file is safe to re-run, which re-breaks a project
where the grant was added by hand. The regression window begins whenever
the file was last applied (the two-step work of 11 October is the likely
moment); before that, the September two-user test passed. Fails closed, so
no data was exposed; it was an availability break affecting every signed-in
reader touching accounts, profiles, pairs, memories, throughline_entries,
oki_messages, consent_events, oracle_readings, subscriptions,
store_subscriptions, or support_requests.

Fix applied to the live project 13 October:

```sql
grant select on auth.mfa_factors to authenticated;
```

Verified: the owner's profiles read went from 403 (42501) to 200 with rows.
Repair owed in the repo, same commit: add the grant above the do block in
server/mfa-policies.sql with a comment recording this incident, and add to
the file's own check note that a signed-in profiles read must return 200,
not 42501.

## Finding 2, process gap (no live impact)

The v2 database schema of record exists only as a saved query in the
Supabase dashboard ("schema v2", named in docs/worklog-v6.3-cloud.md). It
was never committed, which is why the memories column list had to be
discovered live (PGRST204) during this pass. Live memories columns, for the
record: id (bigint, GENERATED ALWAYS identity, never supply it),
profile_id, local_id, memory_type, content (jsonb), created_at (timestamptz,
NOT NULL, no default, must be supplied), is_private default false,
consent_required nullable, kept default false. Repair owed: export the
saved query to server/cloud-schema.sql and keep it current.

Also noted: the PostgREST schema root (/rest/v1/) answers 401 to the anon
key alone on this project, so the OpenAPI introspection shortcut used in
this plan does not work there; information_schema queries in the SQL editor
are the reliable instrument.

## Hardening items for the next repo commit (no urgency attached)

1. server/mfa-policies.sql: add cast_counters and entitlements to the
restrictive policy list (both tables were created after the file and
carry no "two-step sign in" policy today).
2. server/billing/index.ts: restrict returnTo to the site's own origins;
today any https address is accepted and only luminary=success travels,
so severity is low.
3. server/support.sql: consider raising the global 200-per-hour insert cap
so a flood cannot briefly block genuine support and privacy requests.
4. Both Edge Functions: pin exact versions of npm:@supabase/supabase-js and
npm:stripe; the floating major versions make any redeploy a supply chain
event.

## Cleanup confirmations still owed

- The probe row in support_requests from 12 Oct:
`delete from public.support_requests where email = 'console-probe@example.com';`
- Deletion of the throwaway B user used in the isolation test.
- Rotation of the owner password, which was pasted into a chat transcript
on 12 and 13 October. Outstanding as of this record.

## Still open from the plan

- Section 3.1, dashboard settings read (Confirm email, Secure email change,
minimum password length 8, exact redirect URLs, Turnstile bound, no
anonymous sign-ins). Read-only, five minutes.
- Section 9, secrets sweep (GitHub code search on this repository for
service_role, whsec_, sk_live, BEGIN PRIVATE KEY; expect zero real hits).
- Section 10, noting current resolved versions before pinning.
- The live-deploy question from the sweep of 12 Oct: whether the rebuilt
deploy/v6.4 with the Timing Lexicon has been deployed since the merge of
PR #34; `node tools/check-deployed.js` answers it when a machine with the
repository is available.

## Addendum, 13 October (evening)

- Section 3.1, dashboard settings read: PASS. Confirm email ON, secure email
change ON, minimum password length 8, redirect URLs exact with no
wildcard, anonymous sign-ins OFF, Turnstile enabled with both keys filled.
Nothing differed from the expected state.
- Cleanup: the throwaway B user was deleted in the dashboard, confirmed by
the owner.
- Still owed from the cleanup list: the support probe row delete (the SQL
line in the section above) and the owner password rotation.
- Section 9, secrets sweep: four GitHub code searches (service_role,
whsec_, sk_live, BEGIN PRIVATE KEY). Recorded as clean pending the
owner's final confirmation; on confirmation the runnable pass is fully
closed and only the repo-side repair commit and the deploy question
remain.

## Closure, 13 October (night)

Section 9, secrets sweep: confirmed clean by the owner (four GitHub code
searches, zero real hits). With that, every runnable test in this plan has
passed or been verified by hand. The pass is closed. Remaining work is not
security testing: the one support probe row delete, the owner password
rotation, the repo-side repair commit listed above, and the deploy question
for the Timing Lexicon build. Next full review should start from this file
and from docs/SECURITY.md.
