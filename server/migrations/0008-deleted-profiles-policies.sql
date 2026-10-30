-- server/migrations/0008-deleted-profiles-policies.sql
--
-- WHY. 0007 made public.deleted_profiles with row level security on and no
-- policy, so nothing can reach it. These are the rules for who may touch a
-- record that a profile was deleted (assignment 2.2).
--
-- WHAT THIS DOES. A signed in reader may read their own account's records,
-- which is what every device's pull reads, and add records for their own
-- account, which is what deleting a profile writes. A record for somebody
-- else's account is refused, and 0007's triggers only ever act inside the
-- record's own account, so a record cannot reach anybody else's profile.
--
-- THERE IS NO UPDATE OR DELETE POLICY, ON PURPOSE. A record is what makes a
-- deletion hold on every device; one that could be removed would let a
-- deleted profile come back. The app adds records with ignoreDuplicates,
-- which is INSERT ... ON CONFLICT DO NOTHING and needs only the insert
-- policy. Deleting the account removes them (server/account/index.ts, and
-- the cascade from accounts).
--
-- anon gets nothing: every policy is for authenticated. The two-step rule in
-- server/mfa-policies.sql lists deleted_profiles, so run that file again after
-- this one, or an aal1 session on an account with a verified authenticator
-- could still reach the table.
--
-- Proven on a throwaway Postgres 16 with a stub of Supabase's auth schema by
-- tools/check-hd-study-rls.js.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
-- Run 0007 first, then this, then server/mfa-policies.sql.
--
-- DOWN (run to undo; the table goes back to reachable by nobody):
--   drop policy if exists "own deleted profiles, read" on public.deleted_profiles;
--   drop policy if exists "own deleted profiles, add" on public.deleted_profiles;

drop policy if exists "own deleted profiles, read" on public.deleted_profiles;
create policy "own deleted profiles, read" on public.deleted_profiles
  for select to authenticated using (account_id = (select auth.uid()));

drop policy if exists "own deleted profiles, add" on public.deleted_profiles;
create policy "own deleted profiles, add" on public.deleted_profiles
  for insert to authenticated with check (account_id = (select auth.uid()));

-- To check it took: two policies, neither for update or delete, both for
-- authenticated.
--    select policyname, cmd, roles from pg_policies
--    where tablename = 'deleted_profiles' order by 1;
