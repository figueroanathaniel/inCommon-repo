# Cloudflare Turnstile: the owner's half

Added 11 October 2026. Turnstile is the check that keeps scripted sign ups
out. The sign in page carries the widget (site key `0x4AAAAAAFTyLTEb-YanyrEh`,
action `signin`) and sends its token with the five calls that can be scripted:
password sign in, sign up, the reset email, a text code and a resend.

**There is no Turnstile code on a server of ours, and there should not be.**
Supabase Auth checks the token itself, against Cloudflare's siteverify, on
exactly those five requests, once CAPTCHA protection is switched on in the
project. So the secret key goes into the Supabase dashboard and nowhere else:
not this repository, not the server functions, not a chat.

## 1. Check the widget's domains (Cloudflare dashboard)

**Turnstile**, the inCommon widget, **Hostname Management**. It should list
every address the sign in page is served from: the live domain, and the
Netlify address (`something.netlify.app`) if readers can reach that too. A
domain missing here makes the widget refuse to issue tokens on it, which, once
step 3 is done, means nobody can sign in there.

Do not add `localhost` or `127.0.0.1` to the production widget. For testing on
your own machine, make a second widget, or use Cloudflare's test site key
`1x00000000000000000000AA` in a local copy only.

Widget mode **Managed** is the right one. The page shows the check to anybody
typing their email and password by hand (your request of 11 October 2026), and
keeps it out of sight for somebody whose browser or password manager filled the
form in, unless Cloudflare is unsure of them and wants a box ticked. Nothing is
written beside it. Choosing **Invisible** instead would hide it from everybody,
typed or not, because that mode never draws a box.

## 2. Deploy the site first

Deploy `deploy/v6.4/` (git connected, or drag that folder). The sign in page
now sends a token with every one of those calls. Supabase ignores the token
until step 3, so nothing changes for anybody yet.

**Do step 2 before step 3, never the other way round.** With CAPTCHA protection
on and an old copy of the page live, every sign in, sign up and reset is
refused.

## 3. Turn on CAPTCHA protection (Supabase dashboard)

**Authentication**, **Attack Protection** (on some projects under **Bot and
Abuse Protection**), **Enable CAPTCHA protection**, provider **Cloudflare
Turnstile**, and paste the widget's **secret key** (Cloudflare dashboard,
Turnstile, the widget, Settings). Save.

Paste it straight from Cloudflare into Supabase. It is the one value here that
must not be shared.

## 4. Try it

1. Open the live site in a private window.
2. Sign in with your own account. It should work as before.
3. Choose **Forgot password?** and send yourself a reset link. It should arrive.
4. If either says "The check that keeps automated sign ups out did not finish",
   the widget is not issuing tokens on that domain (step 1), or something in
   the browser is blocking `challenges.cloudflare.com`.

If sign in breaks for everyone after step 3, switch CAPTCHA protection back off
in Supabase; that restores it at once, and then look at step 1.

## What it covers, and what it does not

- **Covered:** making accounts, password sign in, reset emails and texted codes,
  which is where scripted abuse costs money (the Oracle's readings, Supabase's
  email quota, texts).
- **Not asked for a token, by Supabase's own design:** checking a code,
  refreshing a session, finishing an emailed link, and the two-step code.
- **Tokens are good once.** The page asks Cloudflare for a fresh one for each
  call and resets the widget after it.
- **Privacy:** Cloudflare's script is the one third party script on the sign in
  page, and it loads only once somebody starts using the form, never on a plain
  visit. Worth a line in the privacy policy.
