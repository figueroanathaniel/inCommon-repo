# Phone sign in setup

The app side of signing in by phone is built: the cover takes an email or a
phone number in one field, a sign up by phone asks for the code a text brings,
Forgot password with a number texts a code that leads to choosing a new
password, and the profile card (Profile, in the profile icon's menu) has a Phone number item that adds or changes the
number on an account. None of it works until Supabase can send a text, and
that is the owner's half, below.

Until it is done, a reader who types a number is told plainly that signing in by
phone is not switched on yet and to use their email address. Nothing breaks and
no email account is affected.

## What each reader sees

| Where | What happens |
|---|---|
| Cover, Sign in | "Email or phone" takes either. A US or Canadian number can be typed any usual way, `(555) 123-4567`; any other needs `+` and its country code. |
| Cover, Create New Account | With a number, the newsletter box goes away (the list is read by email), Supabase texts a six digit code, and the cover asks for it. The right code signs the reader in. |
| Cover, Forgot password? | With a number, the button reads "Text me a code". The code signs the reader in and the cover asks for a new password. A number with no account is answered in exactly the same words, so nobody can use the page to find out whose number is registered. |
| App, profile icon, Profile, Phone number | For a signed in reader: the number, then the code texted to it, then it is on the account. Readers who made their account by email add a number here, and from then on can sign in with it and recover by text. |

## Your half

### 1. An SMS provider

Supabase sends texts through a provider you pay directly. **Twilio Verify** is
the recommendation for a small app, for two reasons:

- **No US carrier registration.** Sending ordinary texts to US numbers from
  your own Twilio number needs A2P 10DLC registration: a brand, a campaign,
  vetting and monthly fees, and weeks of waiting. Verify sends from Twilio's
  own registered senders, so none of that applies.
- **You pay per success.** At the time of writing Twilio charges about
  **$0.05 per successful verification** plus the text itself (under a cent in
  the US; more abroad). A failed or abandoned code costs the text only. Check
  twilio.com/verify/pricing before you rely on these numbers.

Steps:

1. Make a Twilio account and add a payment method (a trial only texts numbers
   you have verified yourself).
2. In the Twilio Console, open **Verify, Services**, create a service named
   inCommon, and copy its **Service SID** (starts `VA`).
3. From the Console's front page, copy the **Account SID** (starts `AC`) and the
   **Auth Token**.
4. **Limit the countries.** In Verify, Geo permissions (and Messaging, Geo
   permissions), switch off every country your readers are not in. Text
   pumping fraud, where bots request codes to expensive foreign numbers, is the
   main way an SMS bill runs away, and this is the switch that stops it.

### 2. Supabase

1. Dashboard, **Authentication, Sign In / Providers, Phone**: switch it on.
2. SMS provider: **Twilio Verify**. Paste the Account SID, the Auth Token and
   the Verify Service SID. These live in Supabase only: never in this
   repository, which is public.
3. Make sure **Enable phone confirmations** is on. It is what makes a sign up by phone
   prove the number with a code before the account can sign in, and the cover
   is built for it. With it off, a sign up by phone signs in at once and the
   cover goes straight into the app, which also works.
4. **Authentication, Rate Limits**: the SMS limit is project wide, per hour.
   Set it to what you are willing to pay for in an hour at worst.
5. Optional and worth it once you have traffic: **Authentication, Attack
   Protection, CAPTCHA**. The cover does not send a CAPTCHA token yet, so
   turning this on today would refuse every sign in; it needs a small change on
   the cover first. Ask for it when you want it.

### 3. Check it

On the published site, Create New Account with your own number and a password.
A code should arrive within a minute. Enter it and you land in the app signed
in. Then log out, choose Forgot password? with the number, and set a new
password from the code.

## Limits the reader meets

- **One code a minute per number.** Supabase refuses a second request inside
  60 seconds; the cover says to wait and try again.
- **A code lasts an hour** at most, and each new code replaces the last.
- **Six digits** by default. The cover and the app accept four to ten, so a
  change in Supabase's OTP length needs nothing here.

## Remember me

The cover's Remember me box (ticked by default) is not a Supabase setting and
needs nothing from you. It keeps the login on the device and the session signed
in; the password is kept by the browser's own password manager, never by the
page. Unticked, the login is forgotten and the session ends when the browser is
closed. CLAUDE.md, "Remember me and the phone", has the detail.
