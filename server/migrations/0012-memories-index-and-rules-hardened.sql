-- server/migrations/0012-memories-index-and-rules-hardened.sql
--
-- WHY. Assignment 2.3 (the owner, 31 October 2026: the account copy becomes
-- the true copy for signed in readers, the device stays the copy for guests).
-- More of each reader's data will live in these tables, so two things the
-- older policies left implicit are made explicit, and the one per profile
-- table 0001 did not index gets its index.
--
-- WHAT THIS DOES.
-- * memories gets an index on (profile_id, memory_type, created_at desc),
--  the order the screens list a profile's memories in.
-- * The seven policies made by server/cloud-schema.sql and 0009 are made
--  again, each one the same rule, now naming the role it is for
--  (to authenticated) and reading the caller once per statement
--  ((select auth.uid()) rather than auth.uid() per row, as Supabase's row
--  level security guidance recommends). A visitor already reached nothing,
--  because a null auth.uid() matches no row; naming the role says so.
-- * owns_profile() is made again with the same test, a fixed search_path and
--  the same SECURITY INVOKER. It must stay invoker: it reads profiles under
--  that table's own rules, including the two-step rule, which is what
--  tools/check-hd-study-rls.js's nomfa_definer run proves.
--
-- NOTHING IS REFUSED that was allowed before: every rule admits exactly the
-- rows it admitted, for the role that could reach them.
--
-- IF 0009 IS EVER RUN AGAIN, run this file again after it: 0009 makes
-- "own pairs" in its older form.
--
-- To check no other permissive policy is left beside these (the live project
-- once carried copies no file made, see 0009):
--  select tablename, policyname, roles from pg_policies
--    where tablename in ('accounts', 'profiles', 'memories', 'throughline_entries',
--                        'oki_messages', 'consent_events', 'pairs')
--    order by 1, 2;
-- Expect one "own ..." policy per table, for {authenticated}, plus the
-- restrictive "two-step sign in, when turned on" from server/mfa-policies.sql.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
-- Proven on a throwaway Postgres 16 by tools/check-hd-study-rls.js (rows
-- HR1 to HR5).
--
-- DOWN (run to undo; puts back the earlier form of each rule):
--   drop index if exists public.memories_by_profile_type_time;
--   create or replace function public.owns_profile(p uuid) returns boolean language sql stable as $own$ select exists (select 1 from public.profiles where id = p and account_id = auth.uid()) $own$;
--   alter function public.owns_profile(uuid) reset search_path;
--   drop policy if exists "own account" on public.accounts;
--   create policy "own account" on public.accounts for all using (auth.uid() = id) with check (auth.uid() = id);
--   drop policy if exists "own profiles" on public.profiles;
--   create policy "own profiles" on public.profiles for all using (account_id = auth.uid()) with check (account_id = auth.uid());
--   drop policy if exists "own memories" on public.memories;
--   create policy "own memories" on public.memories for all using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));
--   drop policy if exists "own throughline" on public.throughline_entries;
--   create policy "own throughline" on public.throughline_entries for all using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));
--   drop policy if exists "own oki messages" on public.oki_messages;
--   create policy "own oki messages" on public.oki_messages for all using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));
--   drop policy if exists "own consent ledger" on public.consent_events;
--   create policy "own consent ledger" on public.consent_events for all using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));
--   drop policy if exists "own pairs" on public.pairs;
--   create policy "own pairs" on public.pairs for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create index if not exists memories_by_profile_type_time
  on public.memories (profile_id, memory_type, created_at desc);

create or replace function public.owns_profile(p uuid) returns boolean
language sql stable security invoker set search_path = public as $own$
  select exists (
    select 1 from public.profiles
    where id = p and account_id = (select auth.uid())
  )
$own$;

drop policy if exists "own account" on public.accounts;
create policy "own account" on public.accounts
  for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "own profiles" on public.profiles;
create policy "own profiles" on public.profiles
  for all to authenticated
  using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));

drop policy if exists "own memories" on public.memories;
create policy "own memories" on public.memories
  for all to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

drop policy if exists "own throughline" on public.throughline_entries;
create policy "own throughline" on public.throughline_entries
  for all to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

drop policy if exists "own oki messages" on public.oki_messages;
create policy "own oki messages" on public.oki_messages
  for all to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

drop policy if exists "own consent ledger" on public.consent_events;
create policy "own consent ledger" on public.consent_events
  for all to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

drop policy if exists "own pairs" on public.pairs;
create policy "own pairs" on public.pairs
  for all to authenticated
  using (account_id = (select auth.uid())) with check (account_id = (select auth.uid()));

-- To check it took: seven policies, each for {authenticated}.
--   select tablename, roles from pg_policies where policyname in ('own account', 'own profiles',
--     'own memories', 'own throughline', 'own oki messages', 'own consent ledger', 'own pairs');
