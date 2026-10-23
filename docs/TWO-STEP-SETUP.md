# Two-step sign in: the owner's half

Added 11 October 2026. Two-step sign in is optional for readers: off unless a
reader turns it on. A reader who turns it on adds inCommon to an authenticator
app (Google Authenticator, Microsoft Authenticator, 1Password, Authy and
others), and from then on the cover asks for the app's 6 digit code after the
password. The code is in the app and the cover; these steps are the parts that
live in the Supabase dashboard and nowhere else.

## 1. Check that authenticator apps are allowed (one minute)

Supabase dashboard, **Authentication**, **Multi-Factor** (on some projects it
is under **Sign In / Providers**). **TOTP (App Authenticator)** should be
enabled. It is on by default for every project, on every plan, at no cost. If
it is off, the app says "Two-step sign in is not switched on for inCommon
accounts yet" when a reader tries to turn it on.

Leave **Phone MFA** off. Text messages would need the SMS provider in
`docs/PHONE-SETUP.md`, and they cost money per code.

## 2. Run the database rules (two minutes, do not skip)

**SQL Editor**, paste all of `server/mfa-policies.sql`, **Run**.

This is the step that makes two-step sign in real. Without it, a password that
has passed is still enough to read that reader's data straight from the
database's web address, without the code, because the app and the server
functions are not the only way in. With it, every table refuses a session that
has not entered its code, for accounts that have two-step on, and nothing
changes for accounts that do not.

It is safe to run more than once, and safe to run before anyone has turned
two-step sign in on. To confirm it took, run the check at the bottom of that
file: every table should be listed.

## 3. Redeploy the two server functions

`server/oracle/index.ts` and `server/billing/index.ts` both refuse a session
that still owes its code (the answer is `MFA_REQUIRED`). Redeploy them the way
`docs/ORACLE-SETUP.md` and `docs/LUMINARY-SETUP.md` describe. This redeploy
also carries the confirmed address rule for `LUMINARY_ADMIN_EMAILS` from the
security review, if it has not gone out yet.

## 4. Deploy the site

The cover and the app changed together, and the cover asks for
`incommon-cloud.js?v=2.5.0`. Deploy `deploy/v6.4/` (git connected, or drag that
folder). Old copies of the cover will not show the code step, and the server
and database refuse their half finished sessions anyway.

## Try it yourself before telling readers

1. Sign in on the cover, open the profile menu, **Profile**, **Two-step sign in**.
2. **Turn on**, scan the QR code with an authenticator app, enter its code.
3. Keep the setup key it shows, in a password manager.
4. **Log Out**, sign in again: after the password, the cover asks for the code.
5. Turn it off from the same place (it asks for a current code first).

## When a reader has lost their phone

The setup key is the reader's own recovery: typed into an authenticator app on
a new phone, it shows the same codes. Supabase does not give backup codes, so
a reader who has lost both the phone and the key cannot sign in until you
remove their authenticator.

**Be sure it is really them first.** Removing the authenticator is exactly what
somebody holding only a stolen password would ask you to do. At the least, have
them write to you from the account's email address, and be wary of urgency.

Then, in the **SQL Editor**:

```sql
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'their@address');
```

They can sign in with the password again and turn two-step back on with a new
phone. The app has no contact address on it yet; readers will need one to ask
for this, so consider adding a support address to the Settings page or the
privacy policy.
