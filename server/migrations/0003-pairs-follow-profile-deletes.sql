-- server/migrations/0003-pairs-follow-profile-deletes.sql
--
-- WHY. A two-person consent record names two profiles, profile_a and
-- profile_b, with no foreign key to either. On the device, deleting a profile
-- removes every pair it was in (ProfileManager.deleteProfile and
-- importSynced both filter s.pairs). The deletion reaches the server as one
-- del-profile, which removes the profile and, by cascade, its memories,
-- Throughline, Oki log and consent ledger, but not its pairs, because nothing
-- ties them to it. The orphaned pair stays on the server, and a device's next
-- first pull brings it back into the store, naming a profile that is gone.
--
-- WHAT THIS DOES. When a profile row is deleted, the pairs that name it go in
-- the same statement, which is the device's own rule carried to the server.
-- It does not add a foreign key, so no pair the app sends today can be refused
-- for naming a profile the server has not seen yet.
--
-- It runs as the caller (security invoker, the default): under row level
-- security a reader's delete reaches only their own pairs. The account
-- function deletes pairs before profiles, so it finds nothing left to remove.
--
-- Pairs orphaned before this ran are left alone, because removing them is a
-- deletion and is the owner's to run. To see them, then remove them:
--   select * from public.pairs pr
--    where not exists (select 1 from public.profiles p where p.id = pr.profile_a)
--       or not exists (select 1 from public.profiles p where p.id = pr.profile_b);
--   delete from public.pairs pr
--    where not exists (select 1 from public.profiles p where p.id = pr.profile_a)
--       or not exists (select 1 from public.profiles p where p.id = pr.profile_b);
--
-- No dollar sign appears outside the one tagged function body (see 0002).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
-- Run 0001 first: its pairs (profile_b) index is what keeps this a lookup.
--
-- DOWN (run to undo):
--   drop trigger if exists pairs_follow_profile_deletes on public.profiles;
--   drop function if exists public.pairs_follow_profile_deletes();

create or replace function public.pairs_follow_profile_deletes() returns trigger
language plpgsql set search_path = public as $pairs_follow$
begin
  delete from public.pairs where profile_a = old.id or profile_b = old.id;
  return old;
end $pairs_follow$;

drop trigger if exists pairs_follow_profile_deletes on public.profiles;
create trigger pairs_follow_profile_deletes
  after delete on public.profiles
  for each row execute function public.pairs_follow_profile_deletes();

-- To check it took: one row, enabled ('O').
--   select tgname, tgenabled from pg_trigger where tgname = 'pairs_follow_profile_deletes';
