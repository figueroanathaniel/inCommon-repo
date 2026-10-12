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

### 1. Deleting an account from inside the app (both stores, required)

Apple (guideline 5.1.1(v)) and Google both require an app that lets people make
an account to let them **start deleting it inside the app**. Today deletion is a
Contact Support request that the owner carries out by hand
(`docs/LEGAL-SETUP.md`), and a "contact us to delete" route is the commonest
reason apps are rejected under this rule. Google also wants a **public web page**
where someone who has uninstalled the app can ask for deletion, linked from the
Play Console's Data safety form.

What it takes: a server function that, for the signed in reader, cancels any
Luminary subscription, deletes their rows and their auth user, plus a "Delete
account" control in the profile card, and a small public page explaining how to
ask for deletion without the app. **This is the biggest piece of work on this
list.**

### 2. Telling the reader, on screen, before the Oracle sends anything (Apple, required)

Apple's guideline 5.1.2(i), tightened in November 2025, requires an app to
**disclose on screen what personal data goes to a third party AI, and to whom,
and to get explicit permission before sending it.** A privacy policy paragraph
is not enough. The Oracle sends a chart summary and the first name to Moonshot
AI. The press of Consult the Oracle is the permission, but the sentence beside it
that said what is sent and to whom was removed on 11 October 2026 under the "no
disclaimers" rule. For the iPhone app it has to come back, at least once, before
the first reading: one short panel naming Moonshot AI and what is and is not
sent, with the button under it. **This is a product decision for the owner**,
because it reverses that rule for this one screen.

### 3. How Luminary is paid for inside the apps (both stores, a decision)

Selling a digital unlock inside an app normally has to go through the store's
own billing (Apple's In-App Purchase, Google Play Billing), which takes 15% for
a small developer. The current Stripe checkout cannot simply be reused. The
choices:

- **Use the stores' billing in the apps** and Stripe on the web, with both
  feeding the same `subscriptions` table. Most work, works everywhere, and the
  stores collect and pay VAT themselves, which also opens the EU and the UK in
  the apps without a VAT registration (`docs/LUMINARY-EU-UK.md`).
- **In the United States only, link out to the web checkout.** Court orders in
  2025 made both stores allow a link or button to an outside purchase for US
  users (Apple from May 2025, Google from 29 October 2025, the Google order
  running to November 2027). Both are still being appealed and the commission
  terms have been moving, so confirm the current position before relying on it.
  Outside the US the link is not allowed.
- **Ship the apps without selling Luminary in them** at first. In depth readings
  would show as unavailable in the app. The simplest start, but Apple does not
  allow the app to tell readers to go and buy it on the web, outside the US.

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

Encrypted in transit: yes. Deletion can be requested: yes, once item 1 above is
built.

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
