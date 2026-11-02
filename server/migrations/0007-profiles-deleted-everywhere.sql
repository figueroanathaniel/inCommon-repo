-- server/migrations/0007-profiles-deleted-everywhere.sql
--
-- WHY. The owner decided on 30 October 2026: "if a profile is deleted, delete
-- it everywhere". It did not hold (the 2.2 review's RV3). Deleting a profile
-- deleted its row, and the row's cascade took its ledger, so nothing on the
-- server said the profile had ever been deleted. A device that had changed the
-- profile since its last sync kept it and sent it back, and a device on its
-- first pull for the account sent it back with its journal, by the rule that
-- repairs an older build's wiped history. The only record of the deletion was
-- the outbox of the device it was made on.
--
-- WHAT THIS DOES. public.deleted_profiles holds one row per deleted profile:
-- the account, the profile's id and when. Nothing else: no name, no birth, no
-- hash of either. It outlives the profile's row, and so it is what every
-- device's pull reads to drop the profile, the first pull included and over
-- changes made there since (incommon-cloud.js, module tests K88 to K95).
-- * When a record arrives, the profile's row goes (its journal, ledger,
--  Throughline, Oki log, chart versions and two person records with it, by
--  the cascades and 0003), and its kept Oracle readings turn 'withdrawn', with
--  no content, as 0006 does for a withheld profile. They stay as rows because
--  the daily limit counts them and nobody may lower it by deleting.
-- * Anything that arrives for that profile afterwards, from any build on any
--  device, is dropped: the row, its journal, its ledger, its Throughline and
--  Oki rows, its chart versions and any two person record naming it. A
--  reading finished for it is stored as 'served', with no content.
-- * deleted_at is the server's time, whatever the device sent.
--
-- A RECORD COUNTS ONLY FOR ITS OWN ACCOUNT. The profile row a record removes
-- is the one with that id under that account; the rows a record drops are the
-- ones its account sends (auth.uid(), or the account the row names). So a
-- record written for somebody else's profile id removes nothing of theirs.
-- 0008 allows a reader to add records for their own account only.
--
-- NOTHING IS REFUSED. Every rule drops a row rather than raising, because one
-- refused upsert ends the whole push (migrations README). A dropped row also
-- skips its row level security check and its foreign key check, which is what
-- lets a device that still holds a deleted profile finish its push.
--
-- Row level security is on and this file adds no policy: 0008 holds them.
-- Add deleted_profiles to server/mfa-policies.sql (done in the same change)
-- and run that file again after 0008.
--
-- WHO MAY CALL WHAT. profile_deleted() reads the records as its owner so the
-- triggers see them; it is closed to anon and authenticated, so the API cannot
-- be asked whether an id was deleted. The trigger functions are security
-- definer for the same reason and touch only the row in hand, or, for a new
-- record, the profile it names under its own account and that profile's
-- readings under the same account.
--
-- THE APP THAT GOES WITH IT. A build without the record keeps deleting the row
-- only, and a pull that cannot read deleted_profiles fails and applies
-- nothing, so the app from taskforce/02-security-rls ships after this file and
-- 0008 are applied, never before.
--
-- No dollar sign appears outside a tagged function body: the dashboard's SQL
-- Editor splits a script on bare dollar signs (see server/support.sql).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run, after 0006 (it hangs
-- triggers on chart_versions and oracle_readings.profile_id, which 0004 and
-- 0006 made). Safe to run again. Proven on a throwaway Postgres 16 by
-- tools/check-hd-study-rls.js (rows DP1 to DP13).
--
-- DOWN (run to undo; deleted profiles can then come back as before):
--   drop trigger if exists deleted_profiles_stamp on public.deleted_profiles;
--   drop trigger if exists deleted_profiles_apply on public.deleted_profiles;
--   drop trigger if exists profiles_deleted_drop on public.profiles;
--   drop trigger if exists memories_deleted_drop on public.memories;
--   drop trigger if exists throughline_entries_deleted_drop on public.throughline_entries;
--   drop trigger if exists oki_messages_deleted_drop on public.oki_messages;
--   drop trigger if exists consent_events_deleted_drop on public.consent_events;
--   drop trigger if exists chart_versions_deleted_drop on public.chart_versions;
--   drop trigger if exists pairs_deleted_drop on public.pairs;
--   drop trigger if exists oracle_readings_deleted on public.oracle_readings;
--   drop function if exists public.deleted_profiles_stamp();
--   drop function if exists public.deleted_profiles_apply();
--   drop function if exists public.profiles_deleted_drop();
--   drop function if exists public.deleted_rows_drop();
--   drop function if exists public.pairs_deleted_drop();
--   drop function if exists public.oracle_readings_deleted();
--   drop function if exists public.profile_deleted(uuid, uuid);
--   drop table if exists public.deleted_profiles;

-- ---------- the record ----------

create table if not exists public.deleted_profiles (
  account_id uuid not null references public.accounts(id) on delete cascade,
  profile_id uuid not null,
  deleted_at timestamptz not null default now(),
  primary key (account_id, profile_id)
);

alter table public.deleted_profiles enable row level security;

-- ---------- the rule ----------

create or replace function public.profile_deleted(acct uuid, pid uuid) returns boolean
language sql stable security definer set search_path = public as $deleted$
  select acct is not null and pid is not null and exists (
    select 1 from public.deleted_profiles d where d.account_id = acct and d.profile_id = pid
  )
$deleted$;

revoke execute on function public.profile_deleted(uuid, uuid) from public, anon, authenticated;

-- ---------- a record, as it arrives ----------

create or replace function public.deleted_profiles_stamp() returns trigger
language plpgsql set search_path = public as $stamp$
begin
  new.deleted_at := now();
  return new;
end $stamp$;

revoke execute on function public.deleted_profiles_stamp() from public, anon, authenticated;

drop trigger if exists deleted_profiles_stamp on public.deleted_profiles;
create trigger deleted_profiles_stamp
  before insert on public.deleted_profiles
  for each row execute function public.deleted_profiles_stamp();

create or replace function public.deleted_profiles_apply() returns trigger
language plpgsql security definer set search_path = public as $apply$
begin
  update public.oracle_readings r set status = 'withdrawn', content = null
   where r.profile_id = new.profile_id and r.user_id = new.account_id and r.status = 'done';
  delete from public.profiles p where p.id = new.profile_id and p.account_id = new.account_id;
  return null;
end $apply$;

revoke execute on function public.deleted_profiles_apply() from public, anon, authenticated;

drop trigger if exists deleted_profiles_apply on public.deleted_profiles;
create trigger deleted_profiles_apply
  after insert on public.deleted_profiles
  for each row execute function public.deleted_profiles_apply();

-- ---------- a deleted profile's row, as it arrives again ----------

create or replace function public.profiles_deleted_drop() returns trigger
language plpgsql security definer set search_path = public as $profdrop$
begin
  -- Dropped, not refused: returning nothing skips the row without an error.
  if public.profile_deleted(new.account_id, new.id) then return null; end if;
  return new;
end $profdrop$;

revoke execute on function public.profiles_deleted_drop() from public, anon, authenticated;

drop trigger if exists profiles_deleted_drop on public.profiles;
create trigger profiles_deleted_drop
  before insert on public.profiles
  for each row execute function public.profiles_deleted_drop();

-- ---------- its own rows, as they arrive again ----------

create or replace function public.deleted_rows_drop() returns trigger
language plpgsql security definer set search_path = public as $rowsdrop$
begin
  -- The account sending the row, which for these tables is the caller: the
  -- row names only its profile, and that profile's row is already gone.
  if public.profile_deleted((select auth.uid()), new.profile_id) then return null; end if;
  return new;
end $rowsdrop$;

revoke execute on function public.deleted_rows_drop() from public, anon, authenticated;

drop trigger if exists memories_deleted_drop on public.memories;
create trigger memories_deleted_drop
  before insert on public.memories
  for each row execute function public.deleted_rows_drop();

drop trigger if exists throughline_entries_deleted_drop on public.throughline_entries;
create trigger throughline_entries_deleted_drop
  before insert on public.throughline_entries
  for each row execute function public.deleted_rows_drop();

drop trigger if exists oki_messages_deleted_drop on public.oki_messages;
create trigger oki_messages_deleted_drop
  before insert on public.oki_messages
  for each row execute function public.deleted_rows_drop();

drop trigger if exists consent_events_deleted_drop on public.consent_events;
create trigger consent_events_deleted_drop
  before insert on public.consent_events
  for each row execute function public.deleted_rows_drop();

drop trigger if exists chart_versions_deleted_drop on public.chart_versions;
create trigger chart_versions_deleted_drop
  before insert on public.chart_versions
  for each row execute function public.deleted_rows_drop();

create or replace function public.pairs_deleted_drop() returns trigger
language plpgsql security definer set search_path = public as $pairsdrop$
begin
  if public.profile_deleted(new.account_id, new.profile_a)
     or public.profile_deleted(new.account_id, new.profile_b) then return null; end if;
  return new;
end $pairsdrop$;

revoke execute on function public.pairs_deleted_drop() from public, anon, authenticated;

drop trigger if exists pairs_deleted_drop on public.pairs;
create trigger pairs_deleted_drop
  before insert on public.pairs
  for each row execute function public.pairs_deleted_drop();

-- ---------- a reading, as it is finished ----------

create or replace function public.oracle_readings_deleted() returns trigger
language plpgsql security definer set search_path = public as $readdel$
begin
  if new.status = 'done' and public.profile_deleted(new.user_id, new.profile_id) then
    new.status := 'served';
    new.content := null;
  end if;
  return new;
end $readdel$;

revoke execute on function public.oracle_readings_deleted() from public, anon, authenticated;

drop trigger if exists oracle_readings_deleted on public.oracle_readings;
create trigger oracle_readings_deleted
  before insert or update on public.oracle_readings
  for each row execute function public.oracle_readings_deleted();

-- To check it took: the table, its two triggers, and eight drops.
--    select tgname, tgrelid::regclass from pg_trigger
--    where tgname like '%deleted%' and not tgisinternal order by 2, 1;
