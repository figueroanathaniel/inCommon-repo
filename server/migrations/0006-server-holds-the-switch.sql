-- server/migrations/0006-server-holds-the-switch.sql
--
-- WHY. "Save my profile to my account" and "this profile is for someone else"
-- were held only by the app (data-contracts/HD-STUDY-MODEL.md, sections 13
-- and 14). A build older than either, still open on a second device, sends
-- the birth whatever the reader decided, and nothing on the server stopped
-- it, while the Privacy Policy says the account stops holding it (the
-- follow-up review's finding 4). And an Oracle reading is kept by the account
-- and carried no profile, so marking a profile for somebody else, or turning
-- saving off, left every reading written from it on the server (findings 5
-- and 9). The owner decided on 30 October 2026: the server holds both rules.
--
-- WHAT THIS DOES. The consent ledger already syncs whatever the switch says,
-- so the server reads it. For each profile it takes the latest event in three
-- scopes, which the app writes:
-- * forOther, a grant: the profile is somebody else's. Its row keeps only its
--  id, its account and its two flags; every other field is emptied, as the
--  app's own empty row is.
-- * birthData, a revoke: saving is off. The birth fields are emptied.
-- * birthCleared, a grant: the reader cleared the birth. The birth fields are
--  emptied, so an older build cannot upload the cleared birth.
-- A profile row is judged when it arrives, and judged again when one of
-- those events arrives. Never decided is not a revoke, so a profile with no
-- events keeps everything, exactly as before this file.
--
-- An Oracle reading now carries the profile it was written from
-- (profile_id, sent by the app and stored by server/oracle/index.ts). While
-- that profile is withheld in any of the three ways, a finished reading is
-- not kept: it is stored as 'served', with no content, after it has been
-- handed to the reader. When a profile becomes withheld, its kept readings
-- become 'withdrawn', with no content. Both rows stay, because the daily
-- limit counts them and nobody may lower it by deleting rows. Neither holds
-- the reading's key (oracle_readings_one_per_key covers pending and done
-- only), so asking again on another device writes a new reading, which costs
-- one of the day's six. Readings written before this file carry no profile
-- and cannot be found; deleting the account removes them.
--
-- A chart version (0004) is birth data too: a version that arrives for a
-- withheld profile is dropped, and a profile's versions are deleted when it
-- becomes withheld, so a clear or a switch turned off does not depend on the
-- app's own deletion reaching the server (the reviewer's gap 2, 30 October
-- 2026). A profile marked as somebody else's keeps nothing of its own on the
-- account either: a memory, a Throughline entry or an Oki message that
-- arrives for it is dropped, and the ones the account held are deleted when
-- the mark arrives, so an older build cannot land a journal for somebody
-- else (the owner, 30 October 2026: "yes, drop them too"). These three follow
-- the mark only: saving turned off or a clear governs the birth, and memories
-- keep their own consents.
--
-- THE LEDGER IS ORDERED BY THE TIME EACH EVENT CARRIES, which the device
-- wrote. A device whose clock runs ahead would outrank every later event for
-- good, so an event dated more than five minutes ahead of the server is stored
-- at the server's time (the reviewer's gap 3). An event replayed later keeps
-- its own time, so the push's conflict key still matches it.
--
-- NOTHING IS REFUSED. Every rule empties fields rather than raising, because
-- one refused upsert ends the whole push (migrations README).
--
-- THE ORDER THE APP SENDS IN. A row goes up before its events (an event needs
-- its row), so a row whose own switch or mark moved in that push is judged by
-- the old word. incommon-cloud.js sends each such row once more after its
-- events (resendMarked, module test K86), which is what lets turning saving
-- back on, or taking a profile back as the reader's own, put the birth back.
-- An older build does not resend, and does not need to: it never turns either
-- back on through a mark it does not know.
--
-- WHAT AN OLDER BUILD STILL DOES. It keeps the birth on its own device and
-- keeps sending it, and the server keeps none of it. Its next pull reads the
-- emptied row, and a device that had not changed the profile since its last
-- sync takes the server's copy, so the older build loses its local birth
-- until it reloads into this build. For a profile marked as somebody else's
-- the older build loses the name and the picture the same way, because the
-- whole row is emptied. That is the cost of the server holding the rule, and
-- everything is still on the device that set the switch or the mark.
--
-- WHO MAY CALL WHAT. profile_withheld() reads the ledger as its owner so the
-- triggers see every event; it is closed to anon and authenticated, so the
-- API cannot be asked about a profile by id. The trigger functions are
-- security definer for the same reason and touch only the row in hand, or,
-- for the ledger trigger, the profile the event names, which the ledger's own
-- policy has already checked the caller owns, and that profile's readings
-- under its own account.
--
-- No dollar sign appears outside a tagged function body: the dashboard's SQL
-- Editor splits a script on bare dollar signs (see server/support.sql).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run, after
-- server/oracle/schema.sql has been applied (oracle_readings must exist).
-- Safe to run again. Proven on a throwaway Postgres 16 by
-- tools/check-hd-study-rls.js (rows WH1 to WH18).
--
-- The DOWN below turns served and withdrawn readings into failed ones, which
-- the old check allows and the daily limit does not count.
--
-- DOWN (run to undo):
--   drop trigger if exists consent_marks_apply on public.consent_events;
--   drop trigger if exists consent_events_clamp on public.consent_events;
--   drop trigger if exists chart_versions_withhold on public.chart_versions;
--   drop function if exists public.consent_events_clamp();
--   drop trigger if exists memories_withhold on public.memories;
--   drop trigger if exists throughline_entries_withhold on public.throughline_entries;
--   drop trigger if exists oki_messages_withhold on public.oki_messages;
--   drop function if exists public.marked_rows_withhold();
--   drop function if exists public.chart_versions_withhold();
--   drop trigger if exists profiles_withhold on public.profiles;
--   drop trigger if exists oracle_readings_withhold on public.oracle_readings;
--   drop function if exists public.consent_marks_apply();
--   drop function if exists public.profiles_withhold();
--   drop function if exists public.oracle_readings_withhold();
--   drop function if exists public.profile_withheld(uuid);
--   update public.oracle_readings set status = 'failed' where status in ('served', 'withdrawn');
--   alter table public.oracle_readings drop constraint if exists oracle_readings_status_check;
--   alter table public.oracle_readings add constraint oracle_readings_status_check check (status in ('pending', 'done', 'failed'));
--   drop index if exists public.oracle_readings_by_profile;
--   alter table public.oracle_readings drop column if exists profile_id;

-- ---------- the readings: which profile, and two more states ----------

alter table public.oracle_readings add column if not exists profile_id uuid;

create index if not exists oracle_readings_by_profile
  on public.oracle_readings (profile_id) where profile_id is not null;

alter table public.oracle_readings drop constraint if exists oracle_readings_status_check;
alter table public.oracle_readings add constraint oracle_readings_status_check
  check (status in ('pending', 'done', 'failed', 'served', 'withdrawn'));

-- ---------- the rule ----------

create or replace function public.profile_withheld(pid uuid) returns text
language sql stable security definer set search_path = public as $withheld$
  select case
    when (select e.action from public.consent_events e where e.profile_id = pid and e.scope = 'forOther'
           order by e.ts desc, e.id desc limit 1) = 'grant' then 'other'
    when (select e.action from public.consent_events e where e.profile_id = pid and e.scope = 'birthData'
           order by e.ts desc, e.id desc limit 1) = 'revoke' then 'unsaved'
    when (select e.action from public.consent_events e where e.profile_id = pid and e.scope = 'birthCleared'
           order by e.ts desc, e.id desc limit 1) = 'grant' then 'cleared'
  end
$withheld$;

revoke execute on function public.profile_withheld(uuid) from public, anon, authenticated;

-- ---------- a profile row, as it arrives ----------

create or replace function public.profiles_withhold() returns trigger
language plpgsql security definer set search_path = public as $withhold$
declare
  w text := public.profile_withheld(new.id);
begin
  if w is null then return new; end if;
  new.birth_date := null;
  new.birth_time := null;
  new.birth_location := null;
  new.birth_lat := null;
  new.birth_lon := null;
  new.timezone := null;
  new.tz_offset := null;
  new.location_resolved := false;
  new.birth_time_unknown := false;
  if w = 'other' then
    new.name := null;
    new.avatar_color := null;
    new.avatar_kind := null;
    new.avatar_image := null;
    new.avatar_sign := null;
    new.pin_hash := null;
    new.pin_updated_at := null;
  end if;
  return new;
end $withhold$;

revoke execute on function public.profiles_withhold() from public, anon, authenticated;

drop trigger if exists profiles_withhold on public.profiles;
create trigger profiles_withhold
  before insert or update on public.profiles
  for each row execute function public.profiles_withhold();

-- ---------- a reading, as it is finished ----------

create or replace function public.oracle_readings_withhold() returns trigger
language plpgsql security definer set search_path = public as $oracle$
begin
  if new.status = 'done' and new.profile_id is not null
     and exists (select 1 from public.profiles p where p.id = new.profile_id and p.account_id = new.user_id)
     and public.profile_withheld(new.profile_id) is not null then
    new.status := 'served';
    new.content := null;
  end if;
  return new;
end $oracle$;

revoke execute on function public.oracle_readings_withhold() from public, anon, authenticated;

drop trigger if exists oracle_readings_withhold on public.oracle_readings;
create trigger oracle_readings_withhold
  before insert or update on public.oracle_readings
  for each row execute function public.oracle_readings_withhold();

-- ---------- an event, as it arrives ----------

create or replace function public.consent_marks_apply() returns trigger
language plpgsql security definer set search_path = public as $marks$
begin
  if public.profile_withheld(new.profile_id) is null then return null; end if;
  -- Judge the row again under the new word: profiles_withhold empties it.
  update public.profiles set updated_at = updated_at where id = new.profile_id;
  update public.oracle_readings r set status = 'withdrawn', content = null
   where r.profile_id = new.profile_id and r.status = 'done'
     and r.user_id = (select p.account_id from public.profiles p where p.id = new.profile_id);
  delete from public.chart_versions where profile_id = new.profile_id;
  if public.profile_withheld(new.profile_id) = 'other' then
    delete from public.memories where profile_id = new.profile_id;
    delete from public.throughline_entries where profile_id = new.profile_id;
    delete from public.oki_messages where profile_id = new.profile_id;
  end if;
  return null;
end $marks$;

revoke execute on function public.consent_marks_apply() from public, anon, authenticated;

drop trigger if exists consent_marks_apply on public.consent_events;
create trigger consent_marks_apply
  after insert or update on public.consent_events
  for each row when (new.scope in ('birthData', 'birthCleared', 'forOther'))
  execute function public.consent_marks_apply();

-- ---------- a chart version, as it arrives ----------

create or replace function public.chart_versions_withhold() returns trigger
language plpgsql security definer set search_path = public as $versions$
begin
  -- Dropped, not refused: returning nothing skips the row without an error.
  if public.profile_withheld(new.profile_id) is not null then return null; end if;
  return new;
end $versions$;

revoke execute on function public.chart_versions_withhold() from public, anon, authenticated;

drop trigger if exists chart_versions_withhold on public.chart_versions;
create trigger chart_versions_withhold
  before insert on public.chart_versions
  for each row execute function public.chart_versions_withhold();

-- ---------- a marked profile's own rows, as they arrive ----------

create or replace function public.marked_rows_withhold() returns trigger
language plpgsql security definer set search_path = public as $marked$
begin
  -- Dropped, not refused, as a chart version is.
  if public.profile_withheld(new.profile_id) = 'other' then return null; end if;
  return new;
end $marked$;

revoke execute on function public.marked_rows_withhold() from public, anon, authenticated;

drop trigger if exists memories_withhold on public.memories;
create trigger memories_withhold
  before insert or update on public.memories
  for each row execute function public.marked_rows_withhold();

drop trigger if exists throughline_entries_withhold on public.throughline_entries;
create trigger throughline_entries_withhold
  before insert or update on public.throughline_entries
  for each row execute function public.marked_rows_withhold();

drop trigger if exists oki_messages_withhold on public.oki_messages;
create trigger oki_messages_withhold
  before insert or update on public.oki_messages
  for each row execute function public.marked_rows_withhold();

-- ---------- an event's time, as it arrives ----------

create or replace function public.consent_events_clamp() returns trigger
language plpgsql set search_path = public as $clamp$
begin
  if new.ts > now() + interval '5 minutes' then new.ts := now(); end if;
  return new;
end $clamp$;

revoke execute on function public.consent_events_clamp() from public, anon, authenticated;

drop trigger if exists consent_events_clamp on public.consent_events;
create trigger consent_events_clamp
  before insert or update on public.consent_events
  for each row execute function public.consent_events_clamp();

-- To see that it took: eight triggers, and the function closed to the API.
--  select tgname from pg_trigger where tgname in ('profiles_withhold', 'oracle_readings_withhold', 'consent_marks_apply', 'chart_versions_withhold', 'consent_events_clamp', 'memories_withhold', 'throughline_entries_withhold', 'oki_messages_withhold');
--  select has_function_privilege('authenticated', 'public.profile_withheld(uuid)', 'execute');  -- false
