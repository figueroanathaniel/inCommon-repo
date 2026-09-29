# Newsletter setup

This is the start of the newsletter, not the whole of it. What is built is the
asking and the recording. Choosing a sender and sending issues are the owner's
steps below.

## What the app does now

The cover's email sign in has a box under the address field:

> Send me the inCommon newsletter

It starts ticked, and one press unticks it. When someone sends themselves a
sign in link, the answer goes to Supabase with the request, as user metadata on
the account:

| Key | Value |
|---|---|
| `newsletter` | `true` if the box was ticked, `false` if it was unticked |
| `newsletter_source` | `cover-signup` |
| `newsletter_decided_at` | the moment the link was asked for, ISO 8601 |

Supabase writes that metadata only when the request creates the account. So the
answer is recorded once, at account creation. A returning reader who unticks
the box changes nothing, which is why every issue needs its own unsubscribe
link (below).

Nothing is sent to any mailing service from the app. The list lives in your
Supabase project until you take it out.

## Reading the list out

In the Supabase dashboard, open SQL Editor and run:

```sql
select
  email,
  created_at,
  raw_user_meta_data->>'newsletter_decided_at' as decided_at
from auth.users
where (raw_user_meta_data->>'newsletter')::boolean is true
  and email_confirmed_at is not null
order by created_at;
```

`email_confirmed_at is not null` keeps only addresses that opened their link,
so nobody is on the list because somebody else typed their address.

Download the result as CSV and import it into the sender you choose. Do not
make this a public view or table: `auth.users` holds every account, and the
list should leave the project only through you.

## Choosing a sender

Any newsletter service that imports a CSV and handles unsubscribes will do.
Several have free tiers for small lists; check current pricing when you choose,
because it changes. Whichever you pick has to do two things for you:

- put an unsubscribe link in every issue and honour it, and
- keep its own record of who unsubscribed, so a later import does not add them
  back. Remove unsubscribed addresses before every re-import.

## Rules the box has to live with

This is information, not legal advice.

- **United States (CAN-SPAM).** Opt out is allowed. Every issue needs a working
  unsubscribe, a physical postal address, and honest subject lines.
- **EU and UK (GDPR, PECR).** A box that starts ticked does not count as
  consent there. If readers in the EU or UK sign up, either start the box
  unticked, or confirm by email before adding them (double opt in).

## Not built yet

- A switch in Settings to change the answer after sign up. Until then the
  sender's unsubscribe link is the way out.
- Google sign ups. Google sign in was taken off the cover on 29 September 2026.
  If it ever returns it will not pass through this box, so those accounts would
  carry no answer. Treat no answer as no.
- Sending from the app or syncing to a sender automatically.
