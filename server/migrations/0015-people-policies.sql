-- server/migrations/0015-people-policies.sql
--
-- WHY. 0014 made public.people with row level security on and no policy. A
-- saved person is somebody else's birth, so these are the rules for who may
-- touch one, and when the account may keep one at all (assignment 2.3).
--
-- WHO. A signed in reader may read, add, change and delete the people of
-- profiles their own account holds, and nothing else, through owns_profile(),
-- the test every other profile child table uses. A record changes as the
-- reader edits it, so unlike a chart version there is an update policy.
-- anon gets nothing: every policy is for authenticated.
--
-- WHEN. The account keeps a saved person only while the profile's latest
-- "relationships" consent is a grant. This is stricter than the birth rule in
-- 0006, where never decided reads as saved: these records are about people
-- who never decided anything, so silence is not consent. Concretely:
-- * A record that arrives while the latest relationships event is not a
--  grant, or for a profile marked as somebody else's (0006's 'other'), or
--  for a profile recorded as deleted (0007), is dropped without an error,
--  as every withheld row is, because one refused upsert ends the whole push.
-- * When a relationships revoke arrives, or a profile is marked as somebody
--  else's, every saved person of that profile is deleted. There is no
--  tombstone (people-library.js rule 2).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run, after 0014 and after
-- 0006 and 0007 (it calls profile_withheld() and deleted_rows_drop()). Then
-- run server/mfa-policies.sql again, which lists people. Safe to run again.
-- Its trigger uses 0007's deleted_rows_drop(), so to undo 0007, run this
-- file's DOWN first.
-- Proven on a throwaway Postgres 16 by tools/check-hd-study-rls.js (rows PL1
-- to PL10).
--
-- DOWN (run to undo; the table goes back to reachable by nobody):
--   drop trigger if exists people_withhold on public.people;
--   drop trigger if exists people_deleted_drop on public.people;
--   drop trigger if exists consent_people_apply on public.consent_events;
--   drop function if exists public.people_withhold();
--   drop function if exists public.consent_people_apply();
--   drop function if exists public.people_consented(uuid);
--   drop policy if exists "own people, read" on public.people;
--   drop policy if exists "own people, add" on public.people;
--   drop policy if exists "own people, change" on public.people;
--   drop policy if exists "own people, delete" on public.people;

-- ---------- who ----------

drop policy if exists "own people, read" on public.people;
create policy "own people, read" on public.people
  for select to authenticated using (public.owns_profile(profile_id));

drop policy if exists "own people, add" on public.people;
create policy "own people, add" on public.people
  for insert to authenticated with check (public.owns_profile(profile_id));

drop policy if exists "own people, change" on public.people;
create policy "own people, change" on public.people
  for update to authenticated
  using (public.owns_profile(profile_id)) with check (public.owns_profile(profile_id));

drop policy if exists "own people, delete" on public.people;
create policy "own people, delete" on public.people
  for delete to authenticated using (public.owns_profile(profile_id));

-- ---------- when: the rule ----------

create or replace function public.people_consented(pid uuid) returns boolean
language sql stable security definer set search_path = public as $consented$
  select coalesce((select e.action = 'grant' from public.consent_events e
                    where e.profile_id = pid and e.scope = 'relationships'
                    order by e.ts desc, e.id desc limit 1), false)
     and coalesce(public.profile_withheld(pid), '') <> 'other'
$consented$;

revoke execute on function public.people_consented(uuid) from public, anon, authenticated;

-- ---------- a saved person, as it arrives ----------

create or replace function public.people_withhold() returns trigger
language plpgsql security definer set search_path = public as $pwithhold$
begin
  -- Dropped, not refused: returning nothing skips the row without an error.
  if not public.people_consented(new.profile_id) then return null; end if;
  new.updated_at := now();
  return new;
end $pwithhold$;

revoke execute on function public.people_withhold() from public, anon, authenticated;

drop trigger if exists people_withhold on public.people;
create trigger people_withhold
  before insert or update on public.people
  for each row execute function public.people_withhold();

-- A deleted profile's people land nothing, as its other rows do (0007).
drop trigger if exists people_deleted_drop on public.people;
create trigger people_deleted_drop
  before insert on public.people
  for each row execute function public.deleted_rows_drop();

-- ---------- an event, as it arrives ----------

create or replace function public.consent_people_apply() returns trigger
language plpgsql security definer set search_path = public as $papply$
begin
  if not public.people_consented(new.profile_id) then
    delete from public.people where profile_id = new.profile_id;
  end if;
  return null;
end $papply$;

revoke execute on function public.consent_people_apply() from public, anon, authenticated;

drop trigger if exists consent_people_apply on public.consent_events;
create trigger consent_people_apply
  after insert or update on public.consent_events
  for each row when (new.scope in ('relationships', 'forOther'))
  execute function public.consent_people_apply();

-- To check it took: four policies, all for authenticated, none for anon; three
-- triggers; and the rule closed to the API.
--   select policyname, cmd, roles from pg_policies where tablename = 'people' order by 1;
--   select tgname from pg_trigger where tgname in ('people_withhold', 'people_deleted_drop', 'consent_people_apply');
--   select has_function_privilege('authenticated', 'public.people_consented(uuid)', 'execute');  -- false
