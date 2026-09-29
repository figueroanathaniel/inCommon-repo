# Codex Luminary: charging for in-depth readings

Luminary is the Celestial Codex's paid tier, ported with its Stripe code:
$12.99 a month or $119.99 a year. In inCommon the one thing it unlocks is the
in-depth Oracle reading. Every chart, the wiring, the numbers and standard
readings stay free, and the gate says so.

How it fits together:

- **`server/billing/index.ts`** is a Supabase Edge Function named `billing`. It
  holds the Stripe keys, opens Stripe Checkout and the billing portal, answers
  whether a reader is a Luminary, and receives Stripe's webhook.
- **The `subscriptions` table** (in `server/oracle/schema.sql`) keeps each
  reader's subscription as Stripe reports it. No card, address or amount is
  stored; Stripe keeps those.
- **The Oracle function** reads that table before it writes an in-depth
  reading, and refuses anybody who is not a Luminary. The page's gate is
  courtesy; the refusal is the paywall.
- **The page** shows the Codex's gate on In-Depth, with the two plans, and sends
  the reader to Stripe's own checkout page. Stripe brings them back to the
  Oracle, and the page confirms the payment with Stripe before it opens In-Depth.

Until these steps are done, In-Depth says "Payments are being set up. Check
back soon." and nothing can be bought.

## What it costs

Stripe takes a fee on each payment, and nothing otherwise. At the time of
writing, for a US card, that is 2.9% plus 30 cents: about 68 cents of a $12.99
month and $3.78 of a $119.99 year. Check Stripe's pricing page for your
country. An in-depth reading costs about 3 to 5 cents to write (see
`docs/ORACLE-SETUP.md`), and the daily limit holds any one reader to 6 attempts
a day.

## Steps

Do all of this in Stripe's **test mode** first (the toggle at the top of the
Stripe dashboard). Nothing in test mode moves money.

### 1. The Stripe key

1. Sign in at dashboard.stripe.com. The account the Codex used is fine:
   inCommon's prices are made under their own lookup keys
   (`incommon_luminary_monthly`, `incommon_luminary_annual`), so the Codex's
   product is never picked up or changed.
2. Developers, API keys: copy the secret key (`sk_test_...`).

**Never put it in the repository.** It goes into Supabase in step 3 and
nowhere else.

### 2. The table

If you already ran `server/oracle/schema.sql` for the Oracle, run it again: it
now creates `subscriptions` as well, and is safe to run twice.

### 3. The function

1. In the Supabase dashboard, Edge Functions, deploy a new function named
   exactly `billing`, with all of `server/billing/index.ts` as its code.
2. **Turn JWT verification OFF for this function.** Stripe cannot send a
   Supabase token, so with verification on, its webhook would be refused
   before the function saw it. The function still names every reader from
   their token and refuses anybody without one; it believes a webhook only
   when its Stripe signature checks.
3. Under Edge Functions, Secrets, add `STRIPE_SECRET_KEY` with the key from
   step 1.

### 4. The webhook

1. In Stripe, Developers, Webhooks, add an endpoint:
   `https://<your project ref>.supabase.co/functions/v1/billing`
2. Choose these events: `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`,
   `invoice.payment_failed`.
3. Copy its signing secret (`whsec_...`) into a Supabase secret named
   `STRIPE_WEBHOOK_SECRET`.

The webhook is what tells the app about a renewal, a cancellation or a failed
card without anybody opening the Oracle. If it is missing, the function still
asks Stripe directly whenever a reader's record is more than six hours old or
past its paid period, which is the Codex's own fallback, so nothing breaks; it
is just slower to notice.

### 5. The billing portal

In Stripe, Settings, Billing, Customer portal: choose what a customer may do
(cancel, change plan, update their card) and **save**. "Manage billing" on the
Oracle opens this portal, and Stripe refuses to open one that has never been
saved.

### 6. Try it

1. Sign in on the cover, open The Oracle, and press In-Depth. The gate shows the
   two plans.
2. Press Become a Luminary. Stripe's checkout opens. Pay with the test card
   `4242 4242 4242 4242`, any future date, any three digits.
3. Stripe brings you back to the Oracle, which says "Confirming your payment
   with Stripe", then "Welcome to Codex Luminary. The whole sky is yours.", and
   the in-depth reading begins.
4. "Manage billing" opens the portal. Cancel there, and the page stops offering
   In-Depth at the end of the paid period.

The first checkout creates the product ("Codex Luminary") and its two prices in
Stripe by itself. Rename the product in Stripe if you want a different name on
the checkout page and receipts; the app finds the prices by lookup key, not by
name.

### 7. Going live

1. Switch Stripe to live mode and repeat steps 1, 4 and 5 there: a live
   secret key (`sk_live_...`), a live webhook endpoint with its own signing
   secret, and a saved live portal.
2. Replace both Supabase secrets with the live values.
3. Turn on email receipts (Settings, Customer emails) and decide on tax
   (Stripe Tax) with whoever does your accounts.

## The knob

| Secret | Where | What it does |
|---|---|---|
| `LUMINARY_ADMIN_EMAILS` | both `billing` and `oracle` | Comma separated addresses that are Luminaries without paying, for you to read and test in depth. |

## Before you delete a reader's account

Deleting a user in Supabase deletes their `subscriptions` row, and Stripe keeps
charging them. Cancel the subscription in Stripe first (Customers, the
customer, the subscription, Cancel).
