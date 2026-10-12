# Deleting an account from inside the app

Added 12 October 2026, at the owner's request. The App Store (guideline
5.1.1(v)) and Google Play both require an app that lets people make an account
to let them delete it from inside the app, and Google also wants a public web
page for anyone who no longer has the app. Both are built:

- **In the app:** profile menu, Profile, **Delete account**. It appears only
  while signed in. The reader types `delete`, and may also choose to erase what
  is on the device. Then they land on the cover, signed out.
- **On the web:** `delete-account.html`, beside the Terms and the Privacy
  Policy. It says how to delete in the app and how to ask through Contact
  Support without it. Give its address to Google Play (below).

**`server/account/index.ts` does the work**, as a Supabase Edge Function named
`account`. Until it is deployed, the dialog tells the reader that deleting
from here is not switched on yet and points them at Contact Support, so
nothing breaks in the meantime.

## What it deletes, in order

1. **Codex Luminary, at Stripe.** Every live subscription is cancelled now
   (no refund for the rest of the period, as Terms section 7 says), and the
   Stripe customer is deleted. This goes first because it is the one step that
   can keep charging: if Stripe cannot be reached, **nothing is deleted** and
   the reader is told to try again.
2. **RevenueCat's record of the reader**, when RevenueCat is set up
   (`docs/REVENUECAT-SETUP.md`): their customer is deleted. A subscription bought
   in the iPhone or Android app is **not** cancelled: no seller can cancel an
   Apple subscription, so the dialog tells the reader to cancel it in their
   Apple or Google settings first. If RevenueCat cannot be reached, no row is
   deleted and the reader is told to try again.
3. **Every row**, children before parents: `memories`, `throughline_entries`,
   `oki_messages` and `consent_events` for the account's profiles, then
   `pairs`, `profiles`, `oracle_readings`, `subscriptions`,
   `store_subscriptions` and `accounts`.
4. **The sign in itself** (the auth user), last, so a failure above leaves the
   reader able to sign in and try again. Every step is safe to run twice.

Support requests are kept, unlinked from the account, as the Privacy Policy
says. A table this project never created is skipped; any other database error
stops the run and is reported.

On the device, a successful deletion forgets the account (the sync map, the
outbox and the remembered login) and signs out. What the reader wrote on the
device stays unless they turned on "Also erase everything on this device".

## Setting it up

1. In the Supabase dashboard, **Edge Functions**, deploy a new function named
   exactly `account`, with all of `server/account/index.ts` as its code.
2. **Leave JWT verification ON** for this one. (Billing has it off because
   Stripe calls it; nothing but the app calls this.)
3. Secrets: nothing new. It uses `SUPABASE_SERVICE_ROLE_KEY`, which Supabase
   provides, `STRIPE_SECRET_KEY`, which billing already set, and
   `REVENUECAT_SECRET_KEY`, which the store function uses. Without either key
   it skips that step.
4. **Test it on a throwaway account**: make one on the cover, sign in, add a
   profile so something syncs, then delete it from the profile card. In
   Supabase, Authentication, Users, the user should be gone, and the Table
   Editor should show none of its rows. If it bought Luminary in Stripe's test
   mode, the subscription should show as cancelled and the customer as deleted.
5. **Google Play:** in Play Console, App content, Data safety, give
   `https://<your domain>/delete-account.html` as the account deletion link.

## When someone asks instead

A request through Contact Support (topic "Delete my account") still arrives as
a row in `support_requests`, for readers who cannot sign in. Confirm it is them
(reply to the address on the account), then delete the user in Authentication,
Users. That removes the sign in; the rows go with it where the project's
foreign keys cascade, and `docs/LEGAL-SETUP.md` section 2 lists what to check.
Cancel their Luminary in Stripe first. The Privacy Policy promises this within
30 days.
