-- server/migrations/0016-memories-chart-notes-and-tarot.sql
--
-- WHY. Assignment 2.3 (the owner, 31 October 2026: chart notes sync, and kept
-- tarot readings become structured memories). Both are memories rows, of type
-- chart_note and tarot_reading, and server/cloud-schema.sql's CHECK on
-- memories.memory_type names neither, so today the server refuses both, and
-- one refused upsert ends the whole push (K69). data-contracts/HD-STUDY-MODEL.md
-- section 7.2 already says the check is widened first, then the app's
-- SYNC_MEMORY_TYPES and K69 change together, never the other way round.
--
-- A chart note's content follows HD-STUDY-MODEL.md section 3.1. Its
-- "resolved" field is what the address resolved to when the note was written,
-- and the privacy review counted it as birth data (F4): a set of gate and line
-- values names the birth day, often the hour. The model says the app sends it
-- only while the profile holds a birth. This makes the server hold that rule
-- as well, the way 0006 holds the birth itself.
--
-- WHAT THIS DOES.
-- * The memory_type check is made again with the four types it named and the
--  two new ones. It only admits more, so no row the app sends today is
--  refused that was accepted before. Whatever the live check is called, any
--  CHECK on memories that names memory_type is replaced.
-- * A chart_note row that arrives while 0006's rule withholds the profile
--  (saving off, birth cleared) keeps its words and its address, and its
--  content's "resolved" is set to null, which the model reads as
--  unresolved. A profile marked as somebody else's keeps no memory at all,
--  which 0006's memories_withhold already does.
-- * When such an event arrives, the chart notes the account held for that
--  profile lose their "resolved" the same way.
-- Nothing is refused, and no other memory type is touched.
--
-- TAROT. A kept tarot reading is content { title, spread, cards: [{ name,
-- position, reversed }], passages }, with consent_required 'journal'. Its
-- words are the reader's own, not birth data, so nothing is withheld. The app
-- change that writes it is Features' work.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run, after 0006. Safe to
-- run again. Proven on a throwaway Postgres 16 by
-- tools/check-hd-study-rls.js (rows CN1 to CN6).
--
-- The DOWN puts the narrow check back NOT VALID: chart notes and tarot
-- readings already stored stay, and new ones are refused again.
--
-- DOWN (run to undo):
--   drop trigger if exists memories_notes_withhold on public.memories;
--   drop trigger if exists consent_notes_apply on public.consent_events;
--   drop function if exists public.memories_notes_withhold();
--   drop function if exists public.consent_notes_apply();
--   alter table public.memories drop constraint if exists memories_memory_type_check;
--   alter table public.memories add constraint memories_memory_type_check check (memory_type in ('journal', 'mood', 'practice_completion', 'stella_conversation')) not valid;

-- ---------- the types ----------

do $types$
declare c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.memories'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) like '%memory_type%' loop
    execute format('alter table public.memories drop constraint %I', c);
  end loop;
end $types$;

alter table public.memories add constraint memories_memory_type_check
  check (memory_type in ('journal', 'mood', 'practice_completion', 'stella_conversation',
                         'chart_note', 'tarot_reading'));

-- ---------- a chart note, as it arrives ----------

create or replace function public.memories_notes_withhold() returns trigger
language plpgsql security definer set search_path = public as $nwithhold$
begin
  if new.memory_type = 'chart_note' and jsonb_typeof(new.content) = 'object'
     and new.content ? 'resolved'
     and public.profile_withheld(new.profile_id) in ('unsaved', 'cleared') then
    new.content := jsonb_set(new.content, '{resolved}', 'null'::jsonb);
  end if;
  return new;
end $nwithhold$;

revoke execute on function public.memories_notes_withhold() from public, anon, authenticated;

drop trigger if exists memories_notes_withhold on public.memories;
create trigger memories_notes_withhold
  before insert or update on public.memories
  for each row execute function public.memories_notes_withhold();

-- ---------- an event, as it arrives ----------

create or replace function public.consent_notes_apply() returns trigger
language plpgsql security definer set search_path = public as $napply$
begin
  if public.profile_withheld(new.profile_id) in ('unsaved', 'cleared') then
    update public.memories m set content = jsonb_set(m.content, '{resolved}', 'null'::jsonb)
     where m.profile_id = new.profile_id and m.memory_type = 'chart_note'
       and jsonb_typeof(m.content) = 'object' and m.content ? 'resolved'
       and m.content -> 'resolved' <> 'null'::jsonb;
  end if;
  return null;
end $napply$;

revoke execute on function public.consent_notes_apply() from public, anon, authenticated;

drop trigger if exists consent_notes_apply on public.consent_events;
create trigger consent_notes_apply
  after insert or update on public.consent_events
  for each row when (new.scope in ('birthData', 'birthCleared'))
  execute function public.consent_notes_apply();

-- To check it took: the wider check, and two triggers.
--  select pg_get_constraintdef(oid) from pg_constraint where conname = 'memories_memory_type_check';
--  select tgname from pg_trigger where tgname in ('memories_notes_withhold', 'consent_notes_apply');
