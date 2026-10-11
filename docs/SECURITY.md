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
- **Attack Protection:** turn on CAPTCHA (Cloudflare Turnstile is free) once
  signups open. It stops scripted account creation, which is what would be used
  to run up the Oracle bill six readings per fake account per day.
- **Before turning on SMS** (`docs/PHONE-SETUP.md`): CAPTCHA first, and limit
  the SMS provider to the countries you serve. Open phone signup is a known
  target for "SMS pumping" fraud, which bills you for texts to premium numbers.
- **Rate Limits:** leave the defaults or tighten them; do not raise them for
  launch without CAPTCHA on.

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
   worth saying in the privacy policy.
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
