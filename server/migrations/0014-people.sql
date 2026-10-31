-- server/migrations/0014-people.sql
--
-- WHY. Assignment 2.3 (the owner, 31 October 2026: data kept only on the
-- device syncs, saved people included, and the Privacy Policy changes to say
-- so). Saved people live in incommon.people.v1 (app/people-library.js) and
-- have had no cloud home on purpose. They are the most sensitive records in
-- the product: other people's birth details, people who never agreed to be in
-- an app, including minors.
--
-- WHAT THIS DOES. One table, one row per saved person: the profile that saved
-- them, the device's own id for the record (people-library.js mints 'p' and
-- sixteen hex characters), the record as JSON, and its times. The record is
-- stored as the device holds it, so the server never has to know its fields.
--
-- It is created with row level security ON and NO policy, so nothing can read
-- or write it until 0015 is applied. No CHECK is added: a refused upsert ends
-- the whole push, and the device decides the record's shape.
--
-- DELETING IS DELETING (people-library.js rule 2). The foreign key cascades,
-- so deleting a profile deletes its people, and there is no tombstone. The
-- account function (server/account) deletes this table's rows with the
-- account's other profile rows.
--
-- DO NOT APPLY before the Privacy Policy says saved people can go to the
-- account (assignment 2.3), and apply it together with 0015, then run
-- server/mfa-policies.sql again (it lists people).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
--
-- DOWN (run to undo; this deletes every saved person on every account):
--   drop table if exists public.people;

create table if not exists public.people (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  local_id text not null,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, local_id)
);

alter table public.people enable row level security;

-- To check it took: the table exists, row level security is on, and it has no
-- policy until 0015 is applied.
--   select relname, relrowsecurity from pg_class where relname = 'people';
--   select count(*) from pg_policies where tablename = 'people';
