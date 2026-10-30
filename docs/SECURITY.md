# Security: where inCommon stands, and the owner's checklist

Reviewed 11 October 2026, before launch. This is the record of what was checked,
what was fixed in the code, and what can only be checked or set in the
Supabase, Stripe, Netlify and Moonshot dashboards, because none of it lives in
this repository.

## What a customer's data is, and where it sits

| Data | Where | Who can read it |
|---|---|---|
| Birth date, time, place, name, journal entries | the reader's device (localStorage), always | anybody holding the unlocked device, and any script running on the site |
| The same, for a signed in reader with sync consent | Supabase tables `profiles`, `memories`, `throughline_entries`, `oki_messages`, `consent_events`, `pairs`, `accounts` | the reader, if row level security holds (see Step 1) |
| Email or phone, password | Supabase Auth | Supabase; the password is stored hashed and never by this app |
| Oracle readings | Supabase `oracle_readings` | the reader (policy in `server/oracle/schema.sql`) |
| Subscription status, Stripe ids | Supabase `subscriptions` | the reader (same file) |
| Card numbers, billing address | Stripe only | nobody here; the app never sees a card |
| The chart summary sent for an Oracle reading | Moonshot (Kimi), per reading | Moonshot, under its terms |

## What was checked and held

- **No secret is in the repository or its history.** All 113 commits were
  searched for Stripe keys, webhook secrets, Supabase service role keys, model
  API keys, cloud keys and private keys. The only key present is the Supabase
  `anon` key, which is designed to be public: it grants nothing that row level
  security does not allow.
- **The two server functions check who is asking.** Both ask the auth server
  for the user behind the token and refuse without one. The Stripe webhook is
  believed only when its signature verifies. The paywall is enforced on the
  server, not only on the page. Nothing a reader sends can choose which user's
  rows are read or written.
- **`oracle_readings` and `subscriptions` are locked.** Row level security is
  on, a reader may read only their own rows, and no reader may write any.
- **No script injection path was found.** Every value is rendered through the
  template runtime, which escapes it as text; there is no raw HTML anywhere in
  the app. The model's reading, a shared chart card, a name and a journal entry
  all reach the page as text. The only links built from data are the crisis
  lines, which come from a fixed directory.
- **Sign in tokens are not trusted from the address bar.** A token arriving in
  an emailed link is checked with the auth server before anything is stored.
- **Passwords are never kept by the app.** Remember me keeps the login and the
  session, and leaves the password to the browser's password manager.

## What was fixed in the code (11 October 2026)

1. **Security headers on every page** (`deploy/v6.4/_headers`). Before this
   none were sent. Now:
   - **Content-Security-Policy.** If script ever did get into a page, the
     browser refuses to let it send data anywhere except this site, the
     project's Supabase and the place search. Driven in Chromium before and
     after: without the policy a test request to an outside site left the
     browser (only its reply was blocked); with it, the request never left.
     The cover, the password sign in, the app and every main screen behaved
     identically under the policy.
   - **frame-ancestors / X-Frame-Options.** Another site can no longer show
     the sign in form inside a frame of its own to trick clicks.
   - **nosniff, Referrer-Policy, Permissions-Policy, HSTS,
     Cross-Origin-Opener-Policy**: the standard set.
2. **The free Luminary list needs a confirmed address**
   (`server/oracle/index.ts`, `server/billing/index.ts`). Addresses in
   `LUMINARY_ADMIN_EMAILS` passed the paywall on the address alone. If Confirm
   email were ever off, or a listed address had not yet signed up, anybody
   registering it got paid readings free. Both functions now also require
   `email_confirmed_at`. **Redeploy both functions** for this to take effect
   (see `docs/ORACLE-SETUP.md` and `docs/LUMINARY-SETUP.md`).
3. **Two-step sign in, optional for readers** (11 October 2026). A reader can
   turn it on in the profile card; from then on the cover asks for a 6 digit
   code from an authenticator app after the password. A stolen password alone
   is refused in three places: the app treats that session as signed out, the
   two server functions answer `MFA_REQUIRED`, and `server/mfa-policies.sql`
   refuses it at every table. The last of those is the one that counts, and it
   is the owner's to run: see `docs/TWO-STEP-SETUP.md`. Tested against a real
   Postgres with Supabase's own `auth.uid()` and `auth.jwt()`: an account with
   two-step on and a password only reads nothing and writes nothing; with the
   code it reads and writes its own rows; accounts without it are unchanged.

## The owner's checklist

These cannot be seen or changed from the repository. Do them in order; the
first is the one that decides whether a stranger can read customer data.

### Step 1. Prove row level security on the sync tables (most important)

The seven sync tables were created in the dashboard and their rules are not in
this repository. The two person isolation test of 20 September 2026 passed, so
they were right then; confirm they still are. In Supabase, **SQL Editor**, run:

```sql
-- 1. Every table in public, and whether row level security is on.
select tablename, rowsecurity as rls_on
from pg_tables where schemaname = 'public' order by 1;

-- 2. Every policy, what it allows, and to whom.
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies where schemaname = 'public' order by 1, 2;

-- 3. Functions that run with elevated rights, which RLS does not cover.
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;
```

What correct looks like:

- **Query 1:** `rls_on` is `true` on every row. A single `false` means any
  visitor can read that whole table with the public key. Fix it at once with
  `alter table public.<name> enable row level security;`.
- **Query 2:** every policy is limited to `authenticated` (not `public` or
  `anon`), and every `using_expr` and `with_check` ties the row to the caller:
  `auth.uid() = id` on `accounts`, `auth.uid() = account_id` on `profiles` and
  `pairs`, `owns_profile(profile_id)` on the child tables. A policy whose
  expression is `true`, or that has no `with_check` on an insert, is a hole.
- **Query 3:** `owns_profile` may appear here. It must only answer whether the
  caller owns a profile id, and must not return rows. Any other function listed
  is worth a look.

Then repeat the September test with two throwaway accounts: sign in as A, add a
journal entry; sign in as B in another browser; B must see nothing of A's and
must fail to write into A's profile.

### Step 2. Supabase Authentication settings

- **Sign In / Providers, Email:** Confirm email **on**, Secure email change
  **on**, minimum password length **8** (the page asks for 8, the server
  default is 6, and the server is the one that counts). Turn on leaked password
  protection if the plan has it.
- **URL Configuration, Redirect URLs:** list each cover address **exactly**.
  Do not use a broad wildcard such as `https://*.netlify.app/**`: emailed reset
  and confirmation links carry the session to whatever address is allowed
  there, so a wildcard lets another site's owner receive a customer's session.
- **Attack Protection:** turn on CAPTCHA with Cloudflare Turnstile, following
  `docs/TURNSTILE-SETUP.md`: the sign in page already carries the widget, so
  deploy first, then paste the secret key in Supabase. It stops scripted
  account creation, which is what would be used to run up the Oracle bill six
  readings per fake account per day.
- **Before turning on SMS** (`docs/PHONE-SETUP.md`): CAPTCHA first, and limit
  the SMS provider to the countries you serve. Open phone signup is a known
  target for "SMS pumping" fraud, which bills you for texts to premium numbers.
- **Rate Limits:** leave the defaults or tighten them; do not raise them for
  launch without CAPTCHA on.

### Step 2b. Two-step sign in for readers

Follow `docs/TWO-STEP-SETUP.md`: check authenticator apps are allowed, run
`server/mfa-policies.sql`, redeploy both functions. Until the SQL is run,
two-step sign in protects the app and the functions but not the database.

### Step 2c. Contact Support and the legal pages

Follow `docs/LEGAL-SETUP.md`: run `server/support.sql` (then
`server/mfa-policies.sql` again), and have a lawyer read the Terms and the
Privacy Policy before launch. The two pages name Contact Support as the way to
make a privacy or deletion request, so it has to be switched on before they go
live.

### Step 3. The accounts that own everything

The likeliest real breach for a small app is not the code, it is someone
signing in as the owner. Turn on two factor authentication for: Supabase,
Stripe, Netlify, GitHub, Moonshot, and the email account all of them reset to.
Use a password manager and a different password for each.

### Step 4. Keys and secrets

- **Stripe:** use a **restricted key** for `STRIPE_SECRET_KEY` with only what
  the billing function uses (Customers, Checkout Sessions, Billing Portal,
  Subscriptions read, Prices and Products write), not the full secret key.
  Turn on Radar.
- **Moonshot:** keep the prepaid balance modest; it is the hard ceiling on
  what abuse of the Oracle can cost.
- **Supabase service role key:** it lives only in the functions' environment,
  which Supabase supplies. Never paste it into the app, a chat, or a ticket. If
  it ever is, rotate it (Project Settings, API).
- If any secret has ever been pasted somewhere outside its dashboard, rotate it.

### Step 5. Deploy the way the headers travel

The headers live in `deploy/v6.4/_headers`. They are served by a git connected
Netlify deploy and by dragging the `deploy/v6.4/` folder. **Dragging the whole
repository does not carry them**, because the repository root has no
`_headers` file. Deploy one of the first two ways.

After deploying, open the live site, then the browser's developer tools,
Network tab, click the page request, and check that
`content-security-policy` is in the response headers. Or paste the address
into securityheaders.com.

## Known remaining risks, in order of size

1. **Customer data on the device is unencrypted.** Anyone with an unlocked
   phone can read a reader's birth data and journal. The profile PIN is a
   courtesy gate, not encryption. This is a design choice of an on device app,
   and Privacy Policy section 3 says it.
2. **The policy still allows inline script and eval**, because the template
   runtime compiles with `new Function`. It limits where data can go, not
   which script can run. Removing that would mean a build step.
3. **The Oracle accepts free text as the dossier.** A signed in reader could
   send other text and get a model answer in the reading's shape. The daily
   limit (six) bounds it per account, and CAPTCHA (Step 2) bounds the accounts.
4. **The server functions import `npm:stripe@17` and
   `npm:@supabase/supabase-js@2` by major version.** A redeploy can pick up a
   newer release. Pin exact versions when next redeploying, after checking
   which ones the current deploy runs.
5. **`status` with `sync: true` asks Stripe each time.** A signed in reader
   could call it repeatedly; Stripe's own rate limits are the cap today.
6. **Customer requests are not logged for security review.** Supabase keeps
   API and auth logs for a limited time on the free plan; check them after
   launch, and set up log retention if the plan allows.

## Review of 12 to 13 October 2026

A full adversarial pass ran against the live project and site, recorded end
to end in `docs/security-pass-2026-10/SECURITY-TESTPLAN-2026-10-12.md`. Every runnable test
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

## Other people's charts: chart versions, handouts and exports (assignment 2.2, 29 October 2026)

Assignment 2.2, Tasks 2 and 3, against the model in
`data-contracts/HD-STUDY-MODEL.md` (the owner approved its decisions O1 to O9
on 29 October 2026). **Task 1, the privacy review of that model, is not done
here**: the model was written in the same session, and nobody reviews their
own work (Helpers, item 2). It goes to a fresh session, and nothing below is
applied to the live project until it is resolved.

**That review came back on 30 October 2026: not ready for migrations,
fourteen findings.** The model answers each in its section 12. What it changed
here: `card` no longer opens a handout and the export carries no consent
record and no birth key (F6, F7, F10, share-rules.js 1.1.0); 0004's column is
`birth_key` now, and the harness below inserts into it. F13 (the two-step list
and the account function) was already met by Task 2. The owner decided F2 and
F9 the same day (model section 13): "Save my profile to my account" now
governs the birth fields the push sends, and a profile made for somebody else
sends nothing. Both are the sync module's, which 1.2 owns, and hold through
K75 to K81.

**A follow-up review of those answers (30 October 2026)** found the marks
reached only the device that set them. Both travel in the consent ledger now
(model section 14, K82 to K84), and `share-rules.js` 1.2.0 shapes a profile
made for somebody else as that person's chart (T11).

**The owner decided the rest the same day: the server holds the switch, the
readings follow it, and findings 9 to 12 are fixed rather than accepted.**

- **`server/migrations/0006-server-holds-the-switch.sql`** (finding 4) reads
  the consent ledger, which syncs whatever the switch says: a profile row is
  emptied of its birth while its latest `birthData` event is a revoke or its
  latest `birthCleared` a grant, and emptied whole while its latest
  `forOther` is a grant, when the row arrives and again when an event
  arrives. Nothing is refused, because one refused upsert ends the push.
  `profile_withheld()` and the three trigger functions are SECURITY DEFINER
  with a fixed search_path and closed to anon and authenticated, so the API
  cannot be asked about a profile by id; the ledger trigger touches only the
  profile its event names, which the ledger's own policy has already checked,
  and that profile's readings under its own account.
- **Oracle readings carry `profile_id`** (findings 5 and 9). The Oracle
  function stores it only for a profile of the reader's account, refuses a
  profile marked for somebody else with `FOR_OTHER` before anything is
  claimed, counted or sent to Kimi, and 0006 keeps no reading of a withheld
  profile (`served`, no content) and withdraws the kept ones (`withdrawn`).
  Both states still count toward the daily limit, so nobody lowers it by
  turning a switch. Readings stored before carry no profile and are not
  found; the Privacy Policy says so.
- **`share-rules.js` 1.3.0** (findings 10 to 12): another person's notes and
  first name need their word; a word counts only with its day, never dated
  after the handout and for a year (`WORD_DAYS`), and a handout made without a
  moment honours none; a backup notes each person's scope and day with no
  basis, and a restore keeps the record and notes and asks again.
  **`stated` is still a record, not a proof**: the app cannot verify it, and
  these rules make it say more, not prove more.

Proven by `tools/check-hd-study-rls.js` (now 28 cases: WH1 to WH12 are 0006,
and the eight that test the rule are red without it), module rows K29d, K85,
K86 and T12 to T14 (each red on the code before), and the Oracle function
driven under Node against a fake Supabase and a fake Kimi for ten cases (OR1
to OR10, the five core ones red on the function before). That harness was
run, not committed; the function was typechecked strict only against a shim
of the Supabase client, not its real types.

**The reviewer reviewed those answers too** (30 October 2026, at 101eb4b).
Points 2 to 16 held; seven gaps came back, recorded in model section 14. On
this branch: 0006 now drops a chart version for a withheld profile and deletes
a profile's versions when it becomes withheld (gap 2), and stores an event
dated more than five minutes ahead of the server at the server's time, so a
fast device clock cannot outrank later events (gap 3). WH13 to WH16 hold both,
and each is red without the file; `check-hd-study-rls.js` is 32 of 32 now.
CV15 applies 0006 again after it rebuilds `chart_versions`, because dropping
the table drops 0006's trigger with it. The owner then decided (30 October
2026, "yes, drop them too") that a profile marked as somebody else's keeps no
memory, Throughline entry or Oki message either: 0006 drops one that arrives
for it and deletes the ones the account held when the mark arrives (WH17,
WH18). Saving turned off or a clear does not touch them, because memories keep
their own consents. The harness is 34 of 34.

**Apply order for the owner**: deploy the Oracle function and the app from
this branch, then run 0006 after `server/oracle/schema.sql`. 0006 before the
app means a reader who turns saving back on keeps no account copy until the
profile next changes (the migration says why).

### Who may touch a chart version (Task 2)

`server/migrations/0004-chart-versions.sql` (workstream 1) makes
`public.chart_versions`, row level security on, no policy.
`server/migrations/0005-chart-versions-policies.sql` gives it three rules, all
for `authenticated`, all through `owns_profile(profile_id)`: read, add and
delete the versions of the reader's own profiles. **There is no update rule**:
a version is history, so an update matches nothing and an upsert that would
rewrite one is refused. The sync module (1.2 step 3) must push versions with
`ignoreDuplicates` (insert, on conflict do nothing), which needs only the add
rule. `chart_versions` is on the two-step list in `server/mfa-policies.sql`,
and the account function deletes it with the other profile tables.

**Proven, not assumed**, by `node tools/check-hd-study-rls.js`, which makes a
throwaway Postgres 16 cluster in a temporary folder, stubs Supabase's auth
schema, applies the schema of record, every migration and the two-step file,
and signs in as two readers. It needs the Postgres binaries and says NOT RUN
(exit 2) without them; it never touches a real project. 16 of 16 cases on the
full schema: own rows readable and writable, another reader's neither, no
rewrite, ignoreDuplicates accepted, anon refused, aal1 refused with a verified
authenticator and aal2 allowed, Clear birth data and profile deletion remove
the versions, and both files apply twice and undo cleanly. It also runs the
same cases without the rules (the reader's own writes fail) and without the
two-step entry.

**A finding from that second run, kept as a rule.** With `chart_versions` off
the two-step list, an aal1 session was still refused, because
`owns_profile()` runs as the caller and reads `profiles`, which carries its own
two-step rule: a child table inherits the refusal. That protection lasts only
while `owns_profile()` stays SECURITY INVOKER. The gate makes it SECURITY
DEFINER in a further run and the aal1 read gets through unless the table is
on the list. So **every new table goes on the two-step list even when it looks
covered, and `owns_profile()` must not be made SECURITY DEFINER** without
re-running this gate. K74 in `tools/run-module-tests.js` fails if a table a
migration adds is missing from the two-step list, or a table keyed by
`profile_id` is missing from the account function's deletion. (The
`owns_profile()` search_path noted in `DATA-MAP.md` is still open and is
2.1's.)

### What a handout and an export may carry (Task 3)

**Measured first.** `node tools/measure-handout-identifiability.js` (fixed
seed, about 30 seconds) asks how much of a birth a "no birth data" Human Design
handout gives back. Over 3,000 random births from 1950 to 2010:

| A handout carrying | Births alone in their crowd of 3,000 | Days 1900 to 2100 that fit | Time window around the birth |
|---|---|---|---|
| Type, Authority, Profile, Definition | 2.4% (median crowd 23) | | median 13.5 h |
| and the defined centres | 39% | | median 10.3 h |
| and the defined channels | 88% | | median 8.8 h |
| and every gate held | 97% | median 58 | median 5.4 h |
| every activation with its line | 99.5% | exactly 1 | median 59 min |

Type, Authority and Definition there are this tool's own implementation of the
standard rules, enough for a measurement and not a check of the app. The
conclusion does not depend on their details: from the defined centres on, a
handout is a fingerprint, and the full activation list is the birth date and
hour by another route.

**So the rules, all in `app/share-rules.js`** (`ShareRules`, shell layer), the
one place a handout or an export file is shaped. Workstream 3's handout screen
and 1.2's export (step 5) call it; neither builds a payload of its own.

1. **Nothing is sent.** There is no share link (the owner's decision O6) and no
   server function for sharing. A handout or an export leaves the device only
   through the reader's own download or share sheet.
2. **A handout carries, by default, Type, Strategy, Authority, Profile,
   Definition and the notes the reader picked**, and on the reader's own chart
   their first name. Never more than a first name.
3. **The defined centres, the channels, the gates, the activations, the birth
   date, the birth time and the birth place are each off until the reader turns
   it on**, because the measurement puts all of them on the identifying side.
   The place is a place name, never coordinates or a zone.
4. **Another person's chart needs their recorded word** for anything in rule 3:
   `subject_consent` with basis `stated`, `handout` in its scope, not
   withdrawn. **A card is not a word** (privacy review F7): it is sent from the
   sender's active profile, which may be somebody else's chart, so `card`
   records where a chart came from and opens nothing. **A client's chart needs it for any handout at all.** The name is
   off by default for anybody but the reader. (The model said off for a client;
   this is stricter, for any other person, and is the owner's to relax.)
5. **A note travels as its words.** What its address resolved to never
   travels, and its address goes only beside the part of the chart it names.
6. **The export is the reader's backup**: their own birth, versions and notes by
   default, other people only on the separate tick (O5), and an `includes`
   header that says what the file holds. Without birth data it carries no
   birth, no version and no resolved value for anybody. It never carries
   `subject_consent` (F6: an import resets it, and in a file it reads like a
   consent record) or any hash or key of a birth (F10: one links a person
   across files, and a hash of a birth is the birth to anybody who can
   enumerate days and places).
7. **Nothing is spread.** Every field is named and copied one at a time, and an
   unknown option is refused rather than ignored, so a misspelled option fails
   loudly instead of shipping what it meant to leave out.

T1 to T10 in `tools/run-module-tests.js` hold it (T4 and T9 changed for F6,
F7 and F10 on 30 October 2026, and both are red on share-rules.js 1.0.0), against a chart object
stuffed with everything a screen's chart carries (coordinates, zone, stored
hash, email, record id, full name, raw longitudes), and search the serialised
payload for each value. All ten are red without the module; spreading the chart
into the payload turns T1 to T5 red, skipping the consent check T4 and T5, and
ignoring an unknown option T6.

**The synastry card is the precedent and stays different.** A card carries a
birth moment on purpose, and the reader chose to send it. That is the sender's
act, not proof that the person in the chart agreed, which is why rule 4 does
not count it; a handout is the reader's summary of a chart and carries no
birth moment unless rule 3 is turned on.

**If a share link is ever wanted** (O6 reversed), it is a server table and its
own review: a random token of at least 128 bits, only its SHA-256 stored, an
expiry, revocation by deleting the row, a payload that is exactly what
`ShareRules.handout()` returns and nothing else, the owner's rows readable and
deletable only by them, and the public read through one function that takes
the token. Not built.

### The owner's steps, in this order, once 2.2 Task 1 is resolved

0. Privacy Policy sections 5 and 14 name the version history, with the date
   moved (F12), in the change that ships 1.2 step 3. Not before.
1. SQL Editor: run `server/migrations/0004-chart-versions.sql`.
2. SQL Editor: run `server/migrations/0005-chart-versions-policies.sql`.
3. SQL Editor: run `server/mfa-policies.sql` again; its check query should now
   list `chart_versions`.
4. Redeploy the `account` function (it now deletes `chart_versions`; deploying
   it first is harmless, because it skips a table that does not exist yet).
5. Nothing syncs to the table until 1.2 step 3 ships, so there is no order
   between these and the app.
