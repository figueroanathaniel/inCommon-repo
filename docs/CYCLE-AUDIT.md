# Codex Luminary, the Cycle Audit and Omni: what you need to do

Built 18 October 2026. Three decisions in one change:

- **The Cycle Audit** is the Oracle's fourth period: the dates of a reader's long
  passages (Saturn, Uranus, Neptune and Pluto across the chart, twenty years
  ahead) are free and worked out on the device, and the Oracle writes a reading
  from them.
- **Codex Luminary is now one payment, of an amount the reader chooses** (at
  least $3, with $12 filled in), and it opens every add-on for the account for
  good: in-depth readings, **Omni tarot** and the Cycle Audit's readings, and
  any add-on after them. The subscription is no longer sold. Anybody who holds
  one keeps it until they cancel, and it opens the same add-ons while it lasts.
- **In the iPhone and Android apps every add-on is free**, and the apps offer
  **Support inCommon**, a gift, instead.

Until the steps below are done, the website's gates say "Payments are being set
up", the apps' gift says the same, and Omni cannot be read anywhere, because its
writer now lives in the Oracle function.

## 1. Run the SQL again

In the Supabase dashboard, SQL Editor, paste and run each file. Both are safe to
run again.

1. `server/oracle/schema.sql`. It adds the `luminary_unlocks` table and widens
   the `oracle_readings.period` check to allow `cycle`. **Without the second
   part every Cycle Audit fails as a store error.**
2. `server/mfa-policies.sql`. It adds `luminary_unlocks` to the two-step sign in
   rule, like every other table.

## 2. Redeploy three functions

Keep each function's existing setting for JWT verification (billing stays
**off**).

- **oracle**: `server/oracle/index.ts` **and the two files beside it,
  `tarot.js` and `tarot-omni.js`**, which it imports. With the CLI, deploying
  the folder carries all three. In the dashboard editor, add the two files to
  the function beside `index.ts`. Without them Omni answers a store error.
- **billing**: `server/billing/index.ts`. The one time unlock, the gift, the
  retired subscription, **and the fix for incommonspace.com**: until this is
  deployed, every checkout started on incommonspace.com is refused, because the
  function only accepted incommon.netlify.app as an address to return to.
- **account**: `server/account/index.ts`. Deleting an account also deletes its
  unlock.

No new secrets. The Stripe products and the two custom amount prices ("Codex
Luminary" and "Support inCommon") are made by the function the first time each
is used.

## 3. Stripe

- The webhook must send `checkout.session.completed`, which it already does for
  Luminary. That is what records a payment. Keep `customer.subscription.*` and
  `invoice.*` too, for the subscribers you still have.
- Keep customer receipts on (Settings, Customer emails, Successful payments):
  the Terms say the amount is confirmed by receipt.
- **Existing subscribers.** They keep their subscription until they cancel, and
  Manage billing still works for them. If you would rather end them, cancel them
  in the Stripe dashboard; the Terms promise a refund of the unused part of the
  period if you discontinue it. Either is consistent with the Terms as written.
- The old Luminary products and prices can be archived in Stripe once nobody
  holds a subscription on them. Nothing in the code creates them any more.

## 4. Publish the site

The bundle in `deploy/v6.4/` is rebuilt, including `thanks.html`, the page a
gift returns to.

## 5. The apps

- **The RevenueCat plugin is already out of `native/`**, because nothing is
  sold in the apps now and an in-app purchase plugin with no purchases is a
  question at review. Run `npm install` in `native/` once so your copy of
  `node_modules` matches, then build as usual. If you added the In-App Purchase
  capability in Xcode, remove it. The App Store Connect and Play Console
  subscription products can be removed too, once nobody holds one.
- **Existing subscribers keep everything.** A Stripe subscription from before
  keeps opening every add-on and Manage billing, as above. A store subscription,
  if one was ever bought, is still read from `store_subscriptions`, so leave the
  `store` function and its secrets in place until the last one has lapsed.
- **The gift may be refused at review.** Apple allows payment links on the
  United States storefront and treats a tip to a developer as an in-app
  purchase elsewhere (guideline 3.1.1); Google allows outside payment for
  donations only to registered charities. If either refuses the build, set
  `GIFT_IN_APP = false` in `app/inCommonApp v2.dc.html`, rebuild the bundle and
  the native app, and resubmit.
- Every add-on in the apps is free and counts toward the Oracle's daily limit of
  six readings, which is what bounds what the apps can cost you.

## 6. Legal pages

Changed and dated 18 October 2026: Terms section 7 (now "Payments: Codex
Luminary and gifts": the one time payment, subscriptions from before, refunds,
gifts) and section 22; Privacy Policy sections 6, 7, 11 and 15 (RevenueCat and
Apple and Google as sellers are gone); and `delete-account.html`. Worth a
lawyer's eye before launch: pay what you want pricing with a floor, changing
from a subscription to a one time payment while subscribers remain, and
accepting gifts as an individual in Florida.

## What the brief asked for, and what changed

The brief asked for a `pwyw_unlocked` flag on `profiles`, row level security
over "psychological content strings", and positions from the database. Built
otherwise, for these reasons:

- **A flag on `profiles` could be set by the reader.** Readers write their own
  profile rows, and an account has several profiles. The unlock is its own
  table, `luminary_unlocks`, that only the billing function writes.
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

What is on the gate when it stands in front of the Cycle Audit (the same gate is
worded for In-Depth and for Omni):

> **Codex Luminary**
>
> **What the long passages ask, and what they build**
>
> The slowest astral bodies stay on a point of your chart for years, not days.
> Each passage asks for something to be set down, and builds something in its
> place. The audit reads every passage ahead of you in both directions: what it
> asks you to surrender, what it gives back, and three questions to carry while
> it lasts.
>
> *This is an exchange rather than a wall. Pay what it is worth to you, once,
> and every add-on opens on this account: in-depth readings, Omni tarot, the
> Cycle Audit, and whatever comes after them.*
>
> **Become a Luminary**
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
