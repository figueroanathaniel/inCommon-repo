# Codex Luminary in the apps: RevenueCat setup

Started 12 October 2026, at the owner's request. Inside the iPhone and Android
apps Luminary is bought with **Apple's In-App Purchase** and **Google Play
Billing**, never Stripe, and **RevenueCat** sits between the apps and the two
stores. The code is built; nothing is sold until the steps below are done and
two public keys are filled in. Until then the apps say "Codex Luminary is not
available in the app yet", exactly as before.

## How it fits together

| Piece | Where | What it does |
|---|---|---|
| The RevenueCat plugin | `native/` (`@revenuecat/purchases-capacitor` 13.7.3, pinned) | Shows the store's own purchase sheet, restores purchases, reads what the reader holds |
| The app | `RC_KEYS` and the `rc...` methods in `app/inCommonApp v2.dc.html` | The Luminary gate in the apps: the store's prices, Become a Luminary, Restore purchases, Manage subscription |
| `server/store/index.ts` | a Supabase Edge Function named `store` | RevenueCat's webhook, and the app's "I just bought" call. Both read the reader's purchases from RevenueCat and write `store_subscriptions` |
| `server/store/schema.sql` | Supabase SQL | The `store_subscriptions` table: one row per reader with an app purchase |
| `server/billing` and `server/oracle` | already deployed | Read that table too, so the page sees one status and the paywall lets an app purchase through |

The reader's Supabase user id is their RevenueCat app user id, so RevenueCat
and Supabase name the same person and no mapping table is needed. A reader who
paid on the website is a Luminary in the app as well, and the other way round.

**Why a separate table** rather than a `source` column on `subscriptions`, as
`docs/APP-STORE-SETUP.md` first planned: that table's row is a Stripe customer
(its Stripe id cannot be empty), and one reader can hold both a website and an
app subscription, which are two things cancelled in two places.

**Taxes.** Apple and Google are the seller in a store purchase: they set the
local prices, charge the VAT or sales tax and pay it. None of the website's EU
and UK arrangements (`docs/LUMINARY-EU-UK.md`) apply in the apps, so the apps
can sell wherever they have a storefront. (Leaving the EU storefronts off for
now is still the simplest start, for the trader address reason in
`docs/APP-STORE-SETUP.md`.)

## Setting it up, in order

### 1. The products in each store

Both stores need a paid apps agreement, tax forms and a bank account first
(App Store Connect: Business; Play Console: Payments profile).

**App Store Connect** (your app, Monetization, Subscriptions):
- one subscription group, "Codex Luminary";
- two auto renewing subscriptions in it: `incommon_luminary_monthly` (1 month)
  and `incommon_luminary_annual` (1 year);
- prices: **US$12.99** and **US$119.99**, which are Apple price points, and let
  Apple set the other countries from them;
- a display name and description for each, and a review screenshot of the gate.

**Play Console** (your app, Monetize, Subscriptions):
- one subscription, `incommon_luminary`, with two base plans: `monthly`
  (monthly, auto renewing) and `annual` (yearly, auto renewing), or two
  subscriptions named as on Apple. Either works: the server reads "month" or
  "annual" out of whatever id RevenueCat reports;
- the same US prices, other countries set from them.

Ids are permanent once made. If you choose other ids, keep the words `monthly`
and `annual` (or `year`) in them, because that is how the plan is read.

### 2. RevenueCat

1. Make a free account at revenuecat.com and a project named inCommon.
2. Add the two apps: an **App Store** app (bundle id, plus an In-App Purchase
   key from App Store Connect, Users and Access, Integrations, In-App Purchase)
   and a **Play Store** app (package name, plus a service account JSON from
   Google Cloud with access in Play Console; RevenueCat's own guide walks
   through it and it takes up to a day to start working).
   Both ids must be the real app id, not the placeholder `com.incommon.app`
   (`docs/NATIVE-APP.md`, before the first upload, item 1).
3. **Products**: import the store products from step 1.
4. **Entitlement**: make one with the identifier **`luminary`** and attach all
   the products to it. The app and the server both look for exactly that name.
5. **Offering**: the `default` offering, marked current, with two packages:
   **Monthly** (`$rc_monthly`) holding the monthly products and **Annual**
   (`$rc_annual`) holding the annual ones. The app looks for the Monthly and
   Annual package types.
6. **API keys** (Project settings, API keys):
   - the two **public app keys**, `appl_...` and `goog_...`. These are made to
     ship inside an app. Put them in `RC_KEYS` in the app (step 5).
   - make a **secret key, v1**. This one is **never** put in the app or the
     repository: it goes only into Supabase (step 3).
7. **Webhook** (Integrations, Webhooks, Add): the address is
   `https://<your project>.supabase.co/functions/v1/store`. Set an
   **Authorization header value** of your own choosing, for example
   `Bearer ` followed by a long random string, and keep it for step 3.
   Send events for all apps and all environments (Apple's reviewers buy in the
   sandbox, so sandbox purchases must count).

### 3. Supabase

1. SQL editor: run `server/store/schema.sql`, then run
   `server/mfa-policies.sql` again (it now names the new table).
2. Edge Functions: deploy a new function named exactly **`store`** with all of
   `server/store/index.ts`, and turn **JWT verification OFF** for it, as for
   billing (RevenueCat cannot send a Supabase token; readers are still checked).
3. Secrets (Edge Functions, Secrets):
   - `REVENUECAT_SECRET_KEY`: the v1 secret key from step 2.6;
   - `REVENUECAT_WEBHOOK_AUTH`: exactly the header value from step 2.7,
     `Bearer ` included;
   - `REVENUECAT_ENTITLEMENT` only if you named the entitlement something other
     than `luminary`.
4. Redeploy **billing**, **oracle** and **account** with their current code:
   billing and oracle read the new table, and account deletes the reader's
   RevenueCat record and their row.

### 4. The legal pages, in the same change as the keys

The pages describe the build, so the change that fills in `RC_KEYS` also
updates them, with their dates:

- **Terms**: add the "Apps from Apple and Google" section drafted at the end of
  `docs/APP-STORE-SETUP.md`, including its last paragraph about store billing.
- **Privacy Policy**, section 7 (Codex Luminary payments), add:

  > In the iPhone and Android apps, Codex Luminary is bought through Apple's
  > App Store or Google Play, which take the payment under their own terms and
  > privacy policies. We use RevenueCat to check those purchases: RevenueCat
  > receives your account's user identifier and the purchase records the store
  > provides. From it we receive and keep which store sold the subscription,
  > your plan, whether it is active, when the current period ends, whether it
  > renews, and where you manage it.

- **Privacy Policy**, section 11 (Service providers), add a row: RevenueCat,
  "Checks Codex Luminary purchases made in the apps", "Your user identifier;
  purchase records from Apple or Google".
- **Privacy Policy**, sections 15 and 16, and `delete-account.html`: deleting
  the account also deletes the RevenueCat record, and a store subscription is
  cancelled in the store's settings, not by deleting the account.

### 5. The keys, and a test

1. In `app/inCommonApp v2.dc.html`, set
   `RC_KEYS = { ios: 'appl_...', android: 'goog_...' };`
2. `node tools/build-bundle.js`, then in `native/`: `npm run sync`.
3. **iPhone**: in Xcode, the App target, Signing & Capabilities, add
   **In-App Purchase**. Test with a Sandbox Apple Account (App Store Connect,
   Users and Access, Sandbox), signed in under Settings, Developer on the
   phone, or with a StoreKit configuration file in Xcode.
4. **Android**: upload a build to the internal testing track first (Play only
   sells to an app it has seen), add your Google account as a licence tester
   (Play Console, Settings, License testing), and install from the test link.
5. Sign in, open the Oracle, choose In-Depth: the gate shows the store's
   prices. Buy monthly. Within seconds the page should say you are a Luminary,
   with **Manage subscription** opening the store's own settings. In Supabase,
   `store_subscriptions` should hold a row for you with `sandbox` true, and
   RevenueCat's customer page should show the webhook delivered.
6. Delete the app, reinstall, sign in, press **Restore purchases**: the same.
7. Cancel in the store's settings; when the sandbox period lapses (minutes, in
   the sandbox) the row turns `expired` and the gate comes back.

## What the reader sees

- **Signed in, in the app, keys set**: the store's prices in their own currency,
  Become a Luminary, **Restore purchases**, the renewal terms naming their Apple
  or Google account, and the Terms and Privacy links (Apple requires both
  beside a subscription).
- **Bought in the app**: "You are a Luminary", the plan and renewal date with
  App Store or Google Play beside it, and **Manage subscription**, which opens
  the store's own subscription settings. On the website the same reader sees
  the plan line and no Manage billing, because Stripe's portal cannot cancel
  an app purchase.
- **Bought on the website**: a Luminary in the app too. The app never shows
  Stripe or links to the website to pay.
- **Deleting the account**: the dialog says an app subscription is not
  cancelled by it and to cancel it in the store's settings first. No seller can
  cancel an Apple subscription, so this is the honest answer.

## If something goes wrong

- **The gate says "not available in the app yet"**: `RC_KEYS` is empty for that
  platform, or the app was built before the keys went in.
- **"The App Store could not be reached"**, or Google Play: RevenueCat could not
  be configured or returned no offering. Check the public key, that the
  `default` offering is current, and that it holds Monthly and Annual packages.
- **"Codex Luminary is not available in the app yet" with keys set**: the
  offering is empty: the packages are missing or hold no products.
- **Bought, but no Luminary**: the store function is not deployed, its secrets
  are wrong, or the entitlement is not named `luminary`. The page said "Your
  purchase went through" and the webhook will still record it once the function
  works; RevenueCat's customer page shows each webhook and its answer.
  Pressing Restore purchases records it again.
