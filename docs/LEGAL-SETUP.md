# The Terms, the Privacy Policy and Contact Support: the owner's half

Added 11 October 2026. The site now carries two legal pages and a support form:

- `app/terms.html`: Terms & Conditions, opening with the About section.
- `app/privacy.html`: Privacy Policy, with section 6 on exactly what the
  Oracle sends and keeps.
- `app/accessibility.html`: the accessibility statement (added 12 October
  2026), linked under the Privacy Policy. It promises a reply within 10 working
  days to anything sent under "Something is not working".
- Contact Support: Settings, Support & legal, in both shells, and at the
  address `#/support`. It works signed out. The two pages name it as the way
  to reach you, cancel, ask for a copy of data, or have an account deleted.

They are linked, always with the Terms directly above the Privacy Policy, from
the cover's sign in form (with a line on Create New Account saying that making
an account agrees to both), from Settings, and beside the Luminary purchase
(with the automatic renewal sentence).

**These pages were written carefully against what the code actually does, and
they are not a substitute for a lawyer.** Have a lawyer licensed in Florida
read both before you rely on them, and especially the points listed under
"Before launch" below.

## 1. Switch on Contact Support (Supabase dashboard)

1. **SQL Editor**: run `server/support.sql`. It makes `support_requests`, lets
   anybody send a request, lets nobody read one back through the API, and
   throttles a flood (five per email address per day, two hundred an hour in
   all).
2. Run `server/mfa-policies.sql` again, so the two-step rule covers the new
   table. Both files are safe to run more than once.
3. Check: `select policyname, cmd, roles from pg_policies where tablename = 'support_requests';`
   should list one policy, `INSERT`, for `anon` and `authenticated`.

Until step 1 is done the form tells readers support is not available right
now, and nothing is lost: what they typed stays in the form.

## 2. Answering requests

Table Editor, `support_requests`, filter `status` is `open`. Reply by email to
the address in the row, then set `status` to `answered`.

- **Privacy requests and account deletion: answer within 30 days.** The Privacy
  Policy promises that, and it is the legal deadline in the EU and UK.
- **Deleting an account**: readers can do this themselves now, in the app's
  profile card (`docs/ACCOUNT-DELETION.md`). For a request that arrives here
  instead: Authentication, Users, delete the user. Then check
  that their rows in `accounts`, `profiles`, `memories`, `throughline_entries`,
  `consent_events`, `pairs` and `oki_messages` are gone; `oracle_readings` and
  `subscriptions` delete themselves with the user. If they subscribed, cancel
  the subscription in Stripe first, and delete the Stripe customer if they asked
  for everything to go (Stripe keeps payment records it is required to keep).
- **Somebody whose details another reader added** (Privacy Policy section
  14). The deletion cannot be undone: `deleted_profiles` has no delete rule,
  so a record once written keeps the profile deleted on every device.
  1. Answer through the request's `support_requests` row, so there is a
     record of what was asked and done.
  2. Confirm, in proportion, that the requester is the person the profile
     describes, and not somebody acting against the account holder.
  3. Find the profile from what they tell you, by birth date first. A profile
     is usually named by a first name or whatever the person who added it
     chose ("Mom"), so the name is compared loosely and never exactly:
     ```sql
     select id, account_id, name, birth_date from public.profiles
     where birth_date = '<YYYY-MM-DD>' and name ilike '<first name>%';
     ```
     Go on only when exactly one row comes back. No rows, or more than one,
     is a reason to ask the requester for more (a birth time or a place), not
     to pick one.
  4. Record the deletion for that one id:
     ```sql
     insert into public.deleted_profiles (account_id, profile_id)
     select account_id, id from public.profiles where id = '<profile id>';
     ```
     That is migration 0007's record. It removes the profile and everything
     under it on the server (its journal, consents, Throughline, Oki log,
     chart versions and two person records) and withdraws its kept Oracle
     readings. Every device signed in to that account deletes the profile at
     its next sync, and nothing an older app sends for it afterwards is kept.
     The record holds only the two ids and the time.
  5. Confirm it took: the record exists and the row is gone. A mistyped id in
     step 4 writes nothing and raises nothing, so checking only that the row
     is gone would pass on a profile that was never touched.
     ```sql
     select (select count(*) from public.deleted_profiles where profile_id = '<profile id>') as recorded,
            (select count(*) from public.profiles where id = '<profile id>') as remaining;
     ```
     Expect `recorded` 1 and `remaining` 0.
  6. **The account holder is not told** (the owner, 30 October 2026). The
     profile goes from their devices at the next sync with nothing said, and
     nothing about the requester is passed on.
  7. **When nothing matches**, say so plainly. A profile marked as made for
     somebody else is stored as an empty row, with no name and no birth, and
     a profile whose saving is off keeps its name but no birth, so neither can
     be found by the person's details. Tell the requester that we hold
     nothing that identifies them, and that a copy kept on somebody else's
     device, or saved there as a person, is that person's and is not ours to
     reach.
- **A copy of their data**: export their rows from those tables as CSV or JSON
  and send them. Data that only ever lived on their device is not yours to
  export; Settings, Export gives them that themselves.
- **Cancelling**: Stripe dashboard, the customer, cancel at period end.

## 3. Keep the pages true

The pages describe the build as it is. Change them in the same change as any
of these, and move the "Effective and last updated" date on both:

- a new outside service (it goes in the Privacy Policy's provider table and,
  for the browser, in `deploy/v6.4/_headers`);
- anything new sent to the Oracle, or a different AI provider or model;
- a price, a plan, or what Luminary includes (Terms section 7, and Stripe);
- signing in by phone being switched on (the SMS provider's name can then be
  named in the provider table);
- the LLC (next section) or the domain (the one after).

A material change to the Terms needs 14 days' notice in the app or by email
before it applies (Terms section 19).

## 4. When the LLC is formed

Both pages name "Nathaniel J. Figueroa, an individual based in the State of
Florida". When the company exists:

1. Replace that with the company's exact registered name and state in both
   pages (search for `an individual based in`), and in the contact sections.
2. Update the date and tell readers in the app: the Terms already allow the
   transfer (section 20, Assignment), and the Privacy Policy says the company
   becomes the controller.
3. Point Stripe's account and payout details at the company.

## 5. When the domain is live

Add a support email address to the Contact sections of both pages, beside
Contact Support. Several privacy laws expect an email address, and a form alone
is the weakest position. A postal address is also expected in the EU and UK;
add one (a registered agent or mailbox service is fine) when you have it.

## Before launch: what a lawyer should look at

1. **The newsletter box starts ticked.** In the EU and UK that is not valid
   consent for marketing email. Either start it unticked, or only send the
   newsletter to readers outside the EU and UK until you do. This is your
   decision (see `docs/NEWSLETTER-SETUP.md`); the Privacy Policy describes the
   box honestly either way.
2. **The EU and UK 14 day withdrawal right.** The Terms ask the subscriber to
   give it up for immediate access to in-depth readings. To be valid that has
   to be an explicit tick at checkout. Stripe Checkout can collect a custom
   consent checkbox; ask whether you need it.
3. **Florida's automatic renewal law (Fla. Stat. 501.165)** asks for clear
   renewal terms before purchase, which the Luminary panel and Terms section 7
   now give, and a way to cancel. Turn on Stripe's subscription emails
   (receipts and upcoming renewal reminders) so the terms reach the subscriber
   in writing too.
4. **Moonshot AI.** Confirm from Moonshot's current terms where it processes
   API requests and whether it uses them to train its models, and adjust
   Privacy Policy sections 6 and 18 if anything there differs. They currently
   say only that Moonshot is headquartered in China and processes the summary
   under its own terms.
5. **Contact details**: sections 4 and 5 above.
6. **Age 16**: readers 16 and 17 can use the app; the Terms require a parent's
   permission for them to subscribe.
7. **Limitation of liability and governing law**: Florida courts and Florida
   law, with consumer rights elsewhere preserved. A lawyer may want an
   arbitration clause; it was left out on purpose, because a badly drafted one
   is worse than none.
8. **Selling outside the US, the app stores and the business name** have pages
   of their own: `docs/LUMINARY-EU-UK.md`, `docs/APP-STORE-SETUP.md` and
   `docs/BUSINESS-SETUP.md`.
