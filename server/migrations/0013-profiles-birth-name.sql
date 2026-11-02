-- server/migrations/0013-profiles-birth-name.sql
--
-- WHY. Assignment 2.3 (the owner, 31 October 2026: data kept only on the
-- device syncs). The birth name the Numbers page reads lives in
-- incommon.p.<pid>.birthName and has no cloud home (data-contracts/DATA-MAP.md,
-- G10). Numerology reads every letter of it, and a full birth name identifies
-- a person as surely as a birth date, so on the account it is birth data.
--
-- WHAT THIS DOES. profiles gains birth_name (text, nullable, no check: a
-- refused upsert ends the whole push). A second trigger beside 0006's
-- profiles_withhold empties it whenever 0006's rule withholds the profile:
-- saving turned off, the birth cleared, or the profile marked as somebody
-- else's. It is a separate trigger rather than a change to 0006's function so
-- that running 0006 again cannot undo it. 0006's consent_marks_apply already
-- touches the profile row when such an event arrives, which fires this
-- trigger too, so a name the account held is emptied when the switch goes off.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run, after 0006. Safe to
-- run again. Proven on a throwaway Postgres 16 by tools/check-hd-study-rls.js
-- (rows BN1 to BN5).
--
-- The app does not send birth_name yet. Until it does, the column stays empty.
--
-- DOWN (run to undo; this deletes every stored birth name):
--   drop trigger if exists profiles_withhold_birth_name on public.profiles;
--   drop function if exists public.profiles_withhold_birth_name();
--   alter table public.profiles drop column if exists birth_name;

alter table public.profiles add column if not exists birth_name text;

create or replace function public.profiles_withhold_birth_name() returns trigger
language plpgsql security definer set search_path = public as $bname$
begin
  if public.profile_withheld(new.id) is not null then new.birth_name := null; end if;
  return new;
end $bname$;

revoke execute on function public.profiles_withhold_birth_name() from public, anon, authenticated;

drop trigger if exists profiles_withhold_birth_name on public.profiles;
create trigger profiles_withhold_birth_name
  before insert or update on public.profiles
  for each row execute function public.profiles_withhold_birth_name();

-- To check it took: the column, and the trigger beside profiles_withhold.
--   select column_name from information_schema.columns where table_name = 'profiles' and column_name = 'birth_name';
--   select tgname from pg_trigger where tgname = 'profiles_withhold_birth_name';
