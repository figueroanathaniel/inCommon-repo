inCommon repair commit kit, 13 October 2026
============================================

Prepared from the security pass of 12-13 October (record:
SECURITY-TESTPLAN-2026-10-12.md). Apply in the order below, then commit once.

I could not push these changes for you: this environment has no write access
to your GitHub repository, and I will not ask for a credential that grants it.
Everything is reduced to search-and-replace so the handoff is mechanical.

------------------------------------------------------------
1. server/mfa-policies.sql   (see mfa-policies-edits.txt)
   - Edit A: grant block, inserted before the line that reads `do $$`
   - Edit B: add two tables to the policy array
   - Edit C: append the extended check note at the end of the file

2. server/cloud-schema.sql   (see cloud-schema.sql, a starter file)
   - New file. Keep the header, paste the dashboard saved query
     "schema v2" where marked, keep the memories DDL comment.
   - The dashboard saved query is the authority; the starter file
     records what the live pass verified on 13 October.

3. server/billing/index.ts   (see billing-edits.txt)
   - Edit A: pin the Stripe import to 17.7.0
   - Edit B: pin the supabase-js import to 2.117.2
   - Edit C: replace the returnAddress function with returnAddress.ts

4. server/oracle/index.ts
   - Edit: pin the supabase-js import to 2.117.2
     (find `npm:@supabase/supabase-js@2`, replace with
      `npm:@supabase/supabase-js@2.117.2`)

5. docs/SECURITY.md            (see SECURITY-md-addendum.md)
   - Append the addendum paragraph at the end.

Suggested commit message:
  Security pass of 12-13 Oct: mfa grant + table list, schema export,
  returnTo allowlist, version pins

------------------------------------------------------------
After the commit:

1. Re-apply server/mfa-policies.sql in the Supabase SQL editor. It is now
   genuinely safe to re-run: the grant rides inside the file, and the two
   new tables get their restrictive policy. Success. No rows returned.
2. Redeploy both Edge Functions (dashboard, Edge Functions, deploy from
   the GitHub integration or paste per docs/ORACLE-SETUP.md), so the pins
   and the returnTo allowlist take effect.
3. Run the file's own check: the pg_policies query should now list the
   policy on 13 tables, and a signed-in profiles read should return 200.
4. Sanity: one Luminary checkout in test mode still completes and cancels
   cleanly (returnAddress change), and one Oracle standard reading returns
   200 (pins).

Nothing here touches app.html: no bundle rebuild, no Netlify deploy, no
harness run. Drift-check stays untouched.
