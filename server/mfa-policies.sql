-- server/mfa-policies.sql: two-step sign in, held at the database.
--
-- Run once, in the Supabase dashboard: SQL Editor, paste, Run. It is safe to
-- run again, and safe to run before any reader has turned two-step sign in on:
-- for an account with no authenticator it allows exactly what was allowed
-- before.
--
-- WHY THIS FILE EXISTS. Two-step sign in is optional (11 October 2026). A
-- reader who turns it on signs in with the password and then a code from an
-- authenticator app. The password alone already makes a session, at assurance
-- level aal1, and the code lifts it to aal2. The app treats an aal1 session as
-- signed out and the two server functions refuse it, but neither of those is
-- the wall: anybody holding a stolen password can call the REST API directly
-- with that aal1 session and never meet the app at all. These policies are
-- what refuse it there.
--
-- WHAT THEY DO. Each is RESTRICTIVE, so it narrows the existing policies and
-- grants nothing of its own: a row a reader could not reach before stays out
-- of reach. It asks one question of every request by a signed in reader: does
-- this account have a verified authenticator? If not, aal1 and aal2 both
-- pass, which is today's behaviour. If so, only aal2 passes. This is the form
-- Supabase's own documentation gives for "enforce MFA for users who have it
-- enabled". FOR ALL with USING alone applies the same test to reads, writes
-- and deletes, because Postgres uses USING as the check for writes when no
-- WITH CHECK is given.
--
-- The list is every table the app or the two functions touch. A table that
-- does not exist in this project is skipped rather than failing the run. A
-- table added later needs adding here, or two-step sign in does not cover it.

-- THE GRANT THE POLICIES BELOW CANNOT RUN WITHOUT. Each policy counts the
-- caller's verified factors by reading auth.mfa_factors, and a policy
-- expression runs with the caller's own privileges. Without this grant every
-- signed-in query on the listed tables fails 42501 "permission denied for
-- table mfa_factors" instead of returning rows. Found on the live project
-- 13 October 2026, where it had been failing since the two-step sign-in
-- work of 11 October; fixed there with this same line. Keep it above the do
-- block so any re-apply of this file carries it. GRANT is idempotent.
grant select on auth.mfa_factors to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'accounts', 'profiles', 'memories', 'throughline_entries', 'oki_messages',
    'consent_events', 'pairs', 'oracle_readings', 'subscriptions', 'store_subscriptions',
    'cycle_unlocks', 'support_requests', 'cast_counters', 'entitlements'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "two-step sign in, when turned on" on public.%I', t);
      execute format($p$
        create policy "two-step sign in, when turned on" on public.%I
          as restrictive
          for all
          to authenticated
          using (
            array[(select auth.jwt() ->> 'aal')] <@ (
              select case when count(id) > 0 then array['aal2'] else array['aal1', 'aal2'] end
              from auth.mfa_factors
              where user_id = (select auth.uid()) and status = 'verified'
            )
          )
      $p$, t);
    end if;
  end loop;
end $$;

-- To check it took: every table above should list the policy.
--   select tablename, policyname, permissive from pg_policies
--   where policyname = 'two-step sign in, when turned on' order by 1;
--
-- A READER WHO HAS LOST THEIR AUTHENTICATOR AND THEIR SETUP KEY cannot sign in
-- again until the factor is removed. Do this only once you are sure the
-- request comes from the account's owner (they can receive email at the
-- address, for instance), because it is exactly the step an attacker with the
-- password alone would want taken:
--   delete from auth.mfa_factors
--   where user_id = (select id from auth.users where email = 'their@address');

-- To check it took, after applying: the policy should now list on 13 tables
-- (the eleven above plus cast_counters and entitlements, added 13 October
-- 2026 because both were created after this file was written):
--   select tablename, policyname, permissive from pg_policies
--   where policyname = 'two-step sign in, when turned on' order by 1;
-- And a signed-in reader must actually reach their own rows. A 403 whose
-- body names mfa_factors means the grant at the top of this file is
-- missing; that exact failure ran undetected on the live project from
-- 11 October to 13 October 2026:
--   select id from public.profiles;   -- signed in, expect 200 with rows
