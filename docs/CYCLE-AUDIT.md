# The Cycle Audit: what you need to do

Built 18 October 2026 from the "Cosmic Tax Ledger" brief. The Cycle Audit is the
Oracle's fourth period. The dates of a reader's long passages (Saturn, Uranus,
Neptune and Pluto across the chart, twenty years ahead) are free and worked out
on the device. The reading the Oracle writes from them is opened on the website
by one payment of the reader's choosing, at least $3 with $12 filled in, and
stays open on that account. In the iPhone and Android apps the reading is free,
and the apps offer **Support inCommon**, a gift, instead.

Until the steps below are done, the website's gate says "Payments are being set
up" (the billing function sends no floor yet) and the apps' gift says the same.
A Cycle Audit asked for in the apps before the Oracle function is redeployed
comes back as "The stars clouded over", with Ask again.

## 1. Run the SQL again

In the Supabase dashboard, SQL Editor, paste and run each file. Both are safe to
run again.

1. `server/oracle/schema.sql`. It adds the `cycle_unlocks` table and widens the
   `oracle_readings.period` check to allow `cycle`. **Without the second part
   every Cycle Audit fails as a store error**, because the row the Oracle claims
   before writing would break the old check.
2. `server/mfa-policies.sql`. It adds `cycle_unlocks` to the two-step sign in
   rule, like every other table.

## 2. Redeploy three functions

Paste each over the one already in the dashboard, or deploy them with the CLI
the way `docs/ORACLE-SETUP.md` describes. Keep each function's existing setting
for JWT verification (billing stays **off**).

- `server/oracle/index.ts`: the cycle period, its instructions, and the paywall.
- `server/billing/index.ts`: the `unlock` and `support` actions, recording the
  unlock from the webhook, **and the fix for incommonspace.com.** Until this is
  deployed, every Luminary checkout started on incommonspace.com is refused,
  because the function only accepted incommon.netlify.app as an address to
  return to. This is worth deploying today on its own.
- `server/account/index.ts`: deleting an account also deletes its unlock.

No new secrets. The Stripe product and the two custom amount prices ("The Cycle
Audit" and "Support inCommon") are made by the function the first time somebody
uses each.

## 3. Check the Stripe webhook

Stripe dashboard, Developers, Webhooks, the endpoint pointing at the billing
function. It must send `checkout.session.completed`, which Luminary already
needs, so it almost certainly does. That event is what records an unlock. If it
were missing, the page would still recover the unlock by asking Stripe on the
reader's return, but the webhook is the reliable path.

Stripe sends a receipt for each payment when customer emails are on (Settings,
Customer emails, Successful payments). Keep that on: the Terms say the amount
paid is confirmed by receipt.

## 4. Publish the site

The bundle in `deploy/v6.4/` is rebuilt. It includes `thanks.html`, the page a
gift returns to.

## 5. The apps, and one risk to know about

The gift opens Stripe's checkout in the phone's browser. **Apple and Google may
refuse that at review.** Apple allows payment links in apps on the United States
storefront and treats a tip to a developer as an in-app purchase elsewhere
(guideline 3.1.1). Google allows outside payment for donations only to
registered charities. If either store refuses the build, open
`app/inCommonApp v2.dc.html`, find `GIFT_IN_APP = true`, set it to `false`,
rebuild the bundle and the native app, and resubmit. Nothing else changes. The
other route is a set of fixed "tip" products sold through RevenueCat.

The Cycle Audit itself is free in the apps, so it needs nothing from the stores.

## 6. Legal pages

Changed and dated 18 October 2026: Terms section 7 (renamed "Payments", with
"The Cycle Audit" and "Gifts"), Privacy Policy sections 6, 7, 11 and 15, and
`delete-account.html`. Two points are worth a lawyer's eye before launch:
pay-what-you-want pricing with a floor, and accepting gifts as an individual
in Florida. The pages call them gifts rather than donations and say they are
not tax deductible, because inCommon is not a charity.

## What the brief asked for, and what changed

The brief asked for a `pwyw_unlocked` flag on `profiles`, row level security
over "psychological content strings", and positions from the database. Built
otherwise, for these reasons:

- **A flag on `profiles` could be set by the reader.** Readers write their own
  profile rows, and an account has several profiles. The unlock is its own
  table that only the billing function writes, the same way `subscriptions` is.
- **Row level security cannot hide text that ships in the app.** The reading is
  written on the server and sent only to a reader the server lets through, which
  is what makes the payment mean something.
- **Positions never come from the database.** Every chart is computed on the
  device, and no birth data lives on the server.
- **The dates were wrong.** Pluto reaches 15 Aquarius in April 2032, not 2029,
  and 28 Aquarius in April 2041. The app computes these; the copy never names a
  year it did not compute.
- **The copy could not diagnose the reader.** "Verbal aggression" and
  "weaponizing logic" are claims about a person, which the app's writing rules
  do not allow. The Oracle is told to write what a passage asks and offers, as a
  possibility the reader can recognise or set aside.

## Reference copy

What is on the gate (both shells):

> **What the long passages ask, and what they build**
>
> The slowest astral bodies stay on a point of your chart for years, not days.
> Each passage asks for something to be set down, and builds something in its
> place. The audit reads every passage ahead of you in both directions: what it
> asks you to surrender, what it gives back, and three questions to carry while
> it lasts.
>
> *This is an exchange rather than a wall. Pay what it is worth to you, once,
> and the audit stays open on this account as new passages arrive.*
>
> **Unlock the Cycle Audit**
>
> One payment, not a subscription. You choose the amount, from $3, on Stripe's
> secure checkout.

The brief's case, written to the same rules as an example of the voice the
Oracle is asked for. The Oracle writes its own for each reader; this is not
shipped anywhere.

> **Pluto conjunct natal Mars** (Mars at 15° Aquarius, 3rd house)
> In orb from early 2031 to late 2034, exact on 14 April 2032, 16 June 2032,
> 10 February 2033, 3 September 2033 and 18 December 2033.
>
> **Surrender · The Tax.** Pluto settling on Mars in the third house presses on
> the way words are used to move things: the quick reply, the argument carried
> to its end, the sense that the clearest mind in the room should prevail. A
> passage like this traditionally asks for some of that to be set down. Not the
> intelligence, but the habit of using it as a blade, and the need for the last
> word that can come with it. It may show up in the daily round, with siblings,
> neighbours and the people met every week, as conversations that stop yielding
> to force.
>
> **Build · The Dividend.** What it builds in that place is a voice that does
> not need to win to be heard. Mars in Aquarius thinks on behalf of the group;
> under Pluto that can deepen into listening that reaches what sits under an
> argument, and speech that carries weight because it is unhurried. By the last
> pass in December 2033 the work of these years may read less as ground lost
> than as finding where authority actually lives.
>
> **For the Journal**
> - When a conversation turns into a contest, what feels at stake?
> - Is there someone in your daily circle whose voice is hard to take in, and
>   what happens in you when they speak?
> - What would you say differently if being right were already settled?
>
> **The Long View.** This passage comes about eight years before Pluto reaches
> your Sun at 28° Aquarius in the 4th house, from April 2041 to December 2042.
> The work on the voice in the early 2030s prepares the ground for the larger
> one later: what home is, and who lives there.
