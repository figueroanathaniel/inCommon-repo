-- server/migrations/0002-profiles-one-active-follows.sql
--
-- WHY. The schema of record holds an account to one active profile with a
-- partial unique index, profiles_one_active on (account_id) where is_active.
-- The sync module sends is_active on every profile row it upserts, but it only
-- upserts a profile whose own fields changed: the row's hash is taken over the
-- profile object, and which profile is active is kept beside the profiles, not
-- in them. So switching profiles sends nothing, the server goes on saying the
-- old one is active, and the next edit to the new one sends it with
-- is_active true while the old row still says true. The index refuses that
-- upsert (23505), and one refused upsert ends the push: consent events, pairs,
-- memories, the Throughline and the deletion outbox stop going up, on that
-- push and on every one after it, until the old profile happens to change too.
--
-- Reproduced on 27 October 2026 against Postgres 16 with server/cloud-schema.sql
-- applied as written: profile A active and B not, both pushed; B then upserted
-- with is_active true; "duplicate key value violates unique constraint
-- profiles_one_active". Module test K72 drives the same sequence through
-- incommon-cloud.js.
--
-- WHAT THIS DOES. A row that arrives active makes the account's other profiles
-- inactive first, inside the same statement, so the index is satisfied rather
-- than broken and the newest word on which profile is active wins, which is
-- what the device that sent it believes. The index stays: it is still the
-- rule. Nothing is refused that was accepted before.
--
-- It runs as the caller (security invoker, the default), so under row level
-- security it can only reach the caller's own profiles, and the restrictive
-- two-step policy applies to it as to any other write. The service role, which
-- the account function uses, bypasses RLS as it already does.
--
-- Two devices that each make a different profile active in the same instant
-- can deadlock; Postgres then cancels one, that push reports an error, and the
-- next push sends it again. That is a retry, not a stall.
--
-- No dollar sign appears outside the one tagged function body: the dashboard's
-- SQL Editor splits a script on bare dollar signs (see server/support.sql).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
--
-- DOWN (run to undo; the index is untouched either way):
--   drop trigger if exists profiles_one_active_follows on public.profiles;
--   drop function if exists public.profiles_one_active_follows();

create or replace function public.profiles_one_active_follows() returns trigger
language plpgsql set search_path = public as $one_active$
begin
  update public.profiles
     set is_active = false
   where account_id = new.account_id
     and id <> new.id
     and is_active;
  return new;
end $one_active$;

drop trigger if exists profiles_one_active_follows on public.profiles;
create trigger profiles_one_active_follows
  before insert or update of is_active on public.profiles
  for each row when (new.is_active)
  execute function public.profiles_one_active_follows();

-- To check it took: one row, enabled ('O').
--   select tgname, tgenabled from pg_trigger where tgname = 'profiles_one_active_follows';
