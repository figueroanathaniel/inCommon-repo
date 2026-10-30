-- server/migrations/0005-chart-versions-policies.sql
--
-- WHY. 0004 made public.chart_versions with row level security on and no
-- policy, so nothing can reach it. A version is a birth record, and a birth
-- date, time and place together identify a person, sometimes a person who is
-- not the reader (a profile made for a partner or a child). These are the
-- rules for who may touch one (assignment 2.2, Task 2).
--
-- WHAT THIS DOES. A signed in reader may read, add and delete the versions of
-- profiles their own account holds, and nothing else. owns_profile() is the
-- same test every other profile child table uses.
--
-- THERE IS NO UPDATE POLICY, ON PURPOSE. A version is history: what a birth
-- was before it was corrected. Rewriting one would let a note's "written
-- against" point at a birth that was never given. So an update matches no
-- row, and an upsert that reaches its update branch is refused. The sync
-- module (1.2 step 3) pushes versions with ignoreDuplicates, which is
-- INSERT ... ON CONFLICT DO NOTHING and needs only the insert policy; Clear
-- birth data deletes them, which the delete policy allows.
--
-- anon gets nothing: every policy is for authenticated. The two-step rule in
-- server/mfa-policies.sql lists chart_versions, so run that file again after
-- this one, or an aal1 session on an account with a verified authenticator
-- could still reach the table.
--
-- Proven on a throwaway Postgres 16 with a stub of Supabase's auth schema by
-- tools/check-hd-study-rls.js, which also shows the table unreachable without
-- this file.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
-- Run 0004 first, then this, then server/mfa-policies.sql.
--
-- DOWN (run to undo; the table goes back to reachable by nobody):
--   drop policy if exists "own chart versions, read" on public.chart_versions;
--   drop policy if exists "own chart versions, add" on public.chart_versions;
--   drop policy if exists "own chart versions, delete" on public.chart_versions;

drop policy if exists "own chart versions, read" on public.chart_versions;
create policy "own chart versions, read" on public.chart_versions
  for select to authenticated using (public.owns_profile(profile_id));

drop policy if exists "own chart versions, add" on public.chart_versions;
create policy "own chart versions, add" on public.chart_versions
  for insert to authenticated with check (public.owns_profile(profile_id));

drop policy if exists "own chart versions, delete" on public.chart_versions;
create policy "own chart versions, delete" on public.chart_versions
  for delete to authenticated using (public.owns_profile(profile_id));

-- To check it took: three policies, none of them for update, all for
-- authenticated.
--   select policyname, cmd, roles from pg_policies
--    where tablename = 'chart_versions' order by 1;
