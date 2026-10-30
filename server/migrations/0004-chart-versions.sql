-- server/migrations/0004-chart-versions.sql
--
-- WHY. A corrected birth is a new chart version, never an overwrite
-- (data-contracts/HD-STUDY-MODEL.md, section 4, approved by the owner on 29
-- October 2026). The device keeps the history under
-- incommon.p.<pid>.chartVersions.v1, and the owner's decision O2 is that it
-- syncs with the profile, so a second device can show which birth a note was
-- written against.
--
-- WHAT THIS DOES. One table, one row per version, shaped like the device's
-- version (section 4): the profile it belongs to, the device's own id for it,
-- its place in the history, why it was made, and the birth record (section
-- 2.2) as JSON. A version stores the birth and never the chart.
--
-- It is created with row level security ON and NO policy, so nothing can read
-- or write it until workstream 2's policies are applied (assignment 2.2). No
-- CHECK is added on reason or seq: a refused upsert ends the whole push, and
-- the device is what decides those values.
--
-- Deleting a profile deletes its versions (the foreign key cascades).
-- Clear birth data deletes them too, by an outbox operation the sync module
-- gains in 1.2 step 3.
--
-- DO NOT APPLY until workstream 2's privacy review of the model (2.2 Task 1)
-- is resolved, and apply it together with its policies (0005).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
--
-- DOWN (run to undo; this deletes every stored version):
--   drop table if exists public.chart_versions;

create table if not exists public.chart_versions (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  local_id text not null,
  seq integer not null,
  reason text not null,
  birth jsonb not null,
  birth_key text not null,
  created_at timestamptz not null,
  unique (profile_id, local_id)
);

alter table public.chart_versions enable row level security;

-- To check it took: the table exists, row level security is on, and it has no
-- policy until 0005 is applied.
--   select relname, relrowsecurity from pg_class where relname = 'chart_versions';
--   select count(*) from pg_policies where tablename = 'chart_versions';
