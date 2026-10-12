# Publishing inCommon on the App Store and Google Play

Written 12 October 2026, when the owner confirmed that inCommon will ship as an
app on Apple's App Store and on Google Play as well as on the web. Nothing here is
built yet. This page is what the stores require, what inCommon already meets,
and what has to be built or decided first. Rules were checked against the
stores' published guidelines on that date; both change often, so read the
current versions when you submit.

## The EULA question

**Apple.** Every App Store app is covered by an end user licence agreement.
If you do not upload one, Apple applies its **Standard EULA** automatically. You
may instead upload your own, and if you do, Apple requires it to contain ten
minimum terms (Apple is not a party, Apple has no support or warranty
obligations, and so on).

**Recommendation: keep Apple's Standard EULA, and add an "Apps from Apple and
Google" section to the Terms** with Apple's ten minimum terms in it. The Terms
are what a reader agrees to on sign up, on every platform, so they stay the
agreement that matters; the section makes them safe to use with either EULA and
covers the day you upload a custom one. The text is drafted at the end of this
page. Add it to `app/terms.html` in the same change that ships the first app
build, with the date moved, because the pages describe the build as it is.

**Google Play** has no EULA requirement. The Terms apply as they are, with the
same section added.

## What inCommon already meets

- A privacy policy at a public address (`privacy.html`), and Terms.
- Accessibility: the statement at `accessibility.html`, and the build itself.
- A minimum age (16) and crisis resources on every screen.
- No tracking, no advertising identifiers, no third party analytics, which makes
  Apple's App Tracking Transparency prompt unnecessary and the privacy forms short.
- Sign in with email or phone and a password. Apple only requires **Sign in with
  Apple** when an app offers another company's sign in (Google, Facebook), and
  inCommon offers none, so it is not needed.
- Encryption is HTTPS only, which is exempt from export paperwork: answer "No" to
  non exempt encryption (`ITSAppUsesNonExemptEncryption` false).

## What has to be built before the first submission

### 1. Deleting an account from inside the app (both stores): BUILT

Built on 12 October 2026: **Delete account** in the profile card while signed in,
and the public page `delete-account.html` for Google's web link. The function
has to be deployed before it works: `docs/ACCOUNT-DELETION.md`.

### 2. Telling the reader, on screen, before the Oracle sends anything (Apple, required)

**The disclosure is in the Privacy Policy, section 6, and that is not enough for
Apple.** Guideline 5.1.2(i), tightened in November 2025, asks for three things
before personal data goes to a third party AI: say what is sent, say who it goes
to, and get permission first, **on screen**. Reviewers have rejected apps whose
only disclosure was in their privacy policy. The press of Consult the Oracle is
the permission; what is missing is the sentence beside it, which was removed on
11 October 2026 under the "no disclaimers" rule.

The panel it sat in still exists (the first Consult the Oracle press, shown once
per profile), so putting a sentence back is small: for example, "Consulting the
Oracle sends your first name and a summary of your chart to Moonshot AI, which
writes the reading. Your birth date, time, place and journal are not sent," with
a link to Privacy Policy section 6. It could appear in the store apps only, or
everywhere. **Not done: it reverses the owner's rule for this one screen, so it
waits for the owner's word.**

### 3. How Luminary is paid for inside the apps: the stores' own billing

**Decided by the owner on 12 October 2026: in-app purchases**, Apple's In-App
Purchase on iPhone and Google Play Billing on Android, with Stripe staying on the
web. Each store takes 15% under its small developer programme, and each charges
and pays the VAT itself, so the apps can sell Luminary in the EU and the UK even
while the web cannot (`docs/LUMINARY-EU-UK.md`).

The plan, for when the wrapper (item 4) exists to build it in:

- **RevenueCat** between the apps and the stores, rather than talking to StoreKit
  and the Play Developer API directly. It verifies receipts for both stores and
  sends one kind of webhook for both, and it is free until a few thousand
  dollars a month of app revenue, which is the stage inCommon is at.
- **One table, three sources.** `subscriptions` gains a `source` column (`stripe`,
  `apple`, `google`); RevenueCat's webhook writes apple and google rows the way
  Stripe's writes stripe rows, so the Oracle's paywall check does not change.
- **Manage billing points at the right place.** A reader who bought on an iPhone
  cancels in their Apple account, not in Stripe's portal; the page shows the
  store's subscription settings for those rows instead.
- **The same products in both stores**: monthly and yearly, priced to match the
  US $12.99 and $119.99 as closely as each store's price points allow, with the
  stores' own local prices elsewhere.
- **The Terms** take the last paragraph of the draft below once this ships.

**Not built yet**, because a purchase flow can only be built and tested inside a
real app build, and none exists until item 4 does.

### 4. Wrapping the app (both stores)

The web app is already self contained, offline capable and installable, so the
practical route is **Capacitor**, which puts the built `app.html` and its files
inside a native shell for both platforms. Three things to get right:

- **Ship the files inside the app, do not load the website.** An app that only
  shows a remote website is rejected by Apple as "minimum functionality"
  (guideline 4.2). Bundled files also keep the app working offline.
- **Start the app on the app, not the cover.** The cover's WebGL animation is
  for the web; in a store app the first screen should be sign in or the app.
- **Sign in inside the app.** Password sign in works anywhere. The emailed links
  (confirming an address, choosing a new password) open in the phone's browser,
  so those finish on the website and the reader then signs in in the app.
  Cloudflare Turnstile has to have the app's origins added to its allowed
  hostnames, and Supabase's Redirect URLs may need the app's address too.
  Service workers do not run inside the iPhone app shell; the app does not need
  one there, but check it fails quietly.

### 5. Apple's view of astrology apps

Apple's guideline 4.3(b) names fortune telling as a category the store already
has too many of, and says it rejects new ones **unless they provide a unique,
high quality experience.** Expect that question. The case to make in the review
notes: Human Design, astrology and numerology computed on the device from
measured ephemeris data, a private journal and record, the Library, and crisis
resources, which no single app in that category combines.

## Accounts and listing details

| | Apple | Google Play |
|---|---|---|
| Developer account | US$99 a year | US$25 once |
| As a person | Your own name shows as the seller | Your name, and your address if the app sells anything |
| As a company | Needs the LLC and a D-U-N-S number (free from Dun & Bradstreet, takes days) | Needs the LLC and a D-U-N-S number |
| Before release | App Review | A new personal account must run a closed test with at least 12 testers for 14 days before it can publish |
| Must provide | Privacy policy URL, support URL, privacy "nutrition label", age rating answers | Privacy policy URL, developer contact email (public), Data safety form, account deletion web link, content rating |

The support URL and the public contact email both want the **domain** to be live
(`docs/LEGAL-SETUP.md`, section 5). Publishing as the LLC keeps your own name and
home address off both stores (`docs/BUSINESS-SETUP.md`).

**The EU.** Apple and Google both ask whether you are a "trader" under the EU's
Digital Services Act before an app can be listed in EU storefronts. Anyone who
sells anything is a trader, and a trader's address, phone number and email are
shown publicly in the EU. While Luminary is held back in the EU, the simplest
start is to leave the EU storefronts off and add them when that decision changes.

**Age rating.** Apple's questionnaire now has 13+, 16+ and 18+ ratings. The
Terms require 16, so choose answers that land on 16+ or above.

## Privacy forms, drafted from the Privacy Policy

Both stores ask what data the app collects. Answers as the build stands, for
data that leaves the device:

| Data | Collected | Linked to the reader | Purpose | Notes |
|---|---|---|---|---|
| Email address or phone number | Yes, with an account | Yes | Account | |
| User ID | Yes, with an account | Yes | Account | |
| Birth date, time, place, profile name and photo | Yes, when signed in | Yes | App functionality | Synced profiles |
| Journal and other user content | Only kinds the reader switches on | Yes | App functionality | May contain health or belief data: answer "sensitive info" yes |
| Purchase history | Yes, for Luminary | Yes | App functionality | Plan and status only, from Stripe |
| Chart summary sent to Moonshot AI | Yes, when the Oracle is used | Yes | App functionality | Shared with a third party (Google's form: "shared") |
| Support messages and their email | Yes, when sent | Yes | Customer support | |
| Usage data | No | | | The usage count stays on the device |
| Location | No | | | A birth place is typed, not read from the device |
| Advertising or tracking | No | | | |

Encrypted in transit: yes. Deletion can be requested: yes, in the app and at
`delete-account.html` (item 1).

## Draft section for the Terms

To add to `app/terms.html` when the first app build ships, as its own section
before "Changes to these Terms", with the table of contents and the date
updated. Fill in the address once there is one: Apple requires the developer's
name and address in it.

> **Apps from Apple and Google**
>
> If you downloaded inCommon from Apple's App Store, the following also applies.
> These Terms are between you and us only, not Apple, and we, not Apple, are
> solely responsible for the app and its content. Your licence to use the app is
> limited to a non-transferable licence to use it on Apple branded products that
> you own or control, as permitted by the Usage Rules in Apple's Media Services
> Terms and Conditions, except that it may also be accessed by other accounts
> associated with you through Family Sharing or volume purchasing. Apple has no
> obligation to provide any maintenance or support for the app. If the app fails
> to conform to any warranty that applies, you may notify Apple and Apple will
> refund the purchase price, if any, of the app to you; to the maximum extent
> permitted by law Apple has no other warranty obligation for the app. We, not
> Apple, are responsible for addressing any claims by you or any third party
> relating to the app or your use of it, including product liability claims,
> claims that the app fails to conform to any legal or regulatory requirement,
> and claims under consumer protection, privacy or similar laws, and for the
> investigation, defence, settlement and discharge of any claim that the app or
> your use of it infringes a third party's intellectual property rights. You
> confirm that you are not located in a country subject to a United States
> Government embargo or designated by it as a terrorist supporting country, and
> that you are not on any United States Government list of prohibited or
> restricted parties. You must comply with any third party terms that apply when
> you use the app, such as your mobile data provider's. Apple and its
> subsidiaries are third party beneficiaries of these Terms and, once you accept
> them, Apple will have the right to enforce them against you as a third party
> beneficiary. Questions, complaints or claims about the app go to us, not Apple:
> Nathaniel J. Figueroa, [address], through Contact Support in the app.
>
> If you downloaded inCommon from Google Play, Google's terms for Google Play
> also apply to your download, and these Terms are between you and us only, not
> Google.
>
> If you buy Codex Luminary through the App Store or Google Play, that store
> takes the payment, and its own terms decide billing, renewal, cancellation and
> refunds for that purchase. You manage and cancel it in your Apple or Google
> account settings, not in Manage billing.

The last paragraph only belongs once the stores' billing is used (item 3).
