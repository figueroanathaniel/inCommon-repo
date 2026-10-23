-- server/cloud-schema.sql: the cloud schema of record.
--
-- Exported from the dashboard saved query "schema v2" on 13 October 2026.
-- The security pass of 12-13 October found that this schema lived only in
-- the Supabase dashboard, which is why the memories column list had to be
-- discovered live (PGRST204) during the pass. The saved query stays as the
-- applying copy; this file is the reviewed, diffed, and restorable record.
-- When the schema changes, change it here first and apply from here.
--
-- DO NOT RUN THIS FILE WHOLE AGAINST THE LIVE PROJECT. The saved query below
-- opens with its v1 cleanup, which DROPS consent_events and profiles. Nothing
-- references consent_events, so that drop succeeds and empties the consent
-- ledger; the profiles drop then removes its policy before failing on the
-- tables that depend on it. Those lines were for the one time v1 was replaced
-- on 20 September 2026. To change the schema, write the change on its own and
-- apply that, then record it here.
--
-- Not in this query: oracle_readings and subscriptions (server/oracle/
-- schema.sql), store_subscriptions (server/store/schema.sql), support_requests
-- (server/support.sql), and cast_counters and entitlements, which exist only
-- as the dashboard saved queries of those names.
--
-- The saved query "schema v2", verbatim (last saved 20 September 2026):

-- inCommon cloud schema v2, written against profile-manager.js as the source
-- of truth (V1.3.0 header contract), not the older single-blob prototype doc.
-- Run the drops first if schema v1 was applied; then the creates; then the
-- RLS block from RLS policies v2. Everything here is idempotent where the
-- database allows it.

-- ---------- v1 cleanup: tables the real data layer never writes ----------
drop policy if exists "own journal" on journal_entries;
drop table if exists journal_entries;
drop policy if exists "own insight records" on insight_records;
drop table if exists insight_records;
drop policy if exists "own throughline" on throughline_events;
drop table if exists throughline_events;
drop policy if exists "own instruments" on instrument_states;
drop table if exists instrument_states;
drop policy if exists "own invites" on invites;
drop table if exists invites;
drop policy if exists "own messages" on messages;
drop table if exists messages;
drop policy if exists "own consent ledger" on consent_events;
drop table if exists consent_events;
-- v1 profiles carried columns the real layer does not have (oki_ctx,
-- provider_consent, notifs, resonance, theme). Recreate rather than alter.
drop policy if exists "own profiles" on profiles;
drop table if exists profiles;

-- ---------- v2 ----------
create table if not exists accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- The local ProfileManager id IS the primary key. No remote id mapping.
create table if not exists profiles (
  id uuid primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  is_active boolean not null default false,
  is_default boolean not null default false,
  name text,
  avatar_color text,
  avatar_kind text,
  avatar_image text,
  avatar_sign text,
  birth_date text,
  birth_time text,
  birth_location text,
  birth_lat double precision,
  birth_lon double precision,
  timezone text,
  tz_offset double precision,
  location_resolved boolean not null default false,
  birth_time_unknown boolean not null default false,
  -- pm.pinHash(pin, id); the profile id is the salt, so no salt column.
  -- Non-cryptographic by stated design: a courtesy lock, not a boundary.
  pin_hash text,
  pin_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_one_active
  on profiles (account_id) where is_active;

-- One table for everything ProfileManager remembers: journals, moods,
-- practice completions, Oki conversations. consent_required mirrors the local
-- binding so the remote copy can say which consent governed each row.
create table if not exists memories (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  local_id text not null,
  memory_type text not null check (memory_type in
    ('journal', 'mood', 'practice_completion', 'stella_conversation')),
  content jsonb not null,
  created_at timestamptz not null,
  is_private boolean not null default false,
  consent_required text,
  kept boolean not null default false,
  unique (profile_id, local_id)
);

create table if not exists throughline_entries (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  local_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists oki_messages (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  local_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Append-mostly ledger, seeded from each profile consent record's events and
-- extended by two-person consent changes (scope 'pair:<a>::<b>').
create table if not exists consent_events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  scope text not null,
  action text not null check (action in ('grant', 'revoke')),
  via text not null default 'user',
  ts timestamptz not null,
  unique (profile_id, scope, ts)
);

-- Two-person consent, account scoped because it binds two of the account's
-- profiles (or a profile and a card that arrived from outside).
create table if not exists pairs (
  id bigint generated always as identity primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  profile_a uuid not null,
  profile_b uuid not null,
  enabled boolean not null default false,
  enabled_by uuid,
  enabled_at timestamptz,
  unique (profile_a, profile_b)
);

-- ---------- RLS policies v2 ----------
-- Save as "RLS policies v2" in the SQL Editor; rerun-safe.
create or replace function owns_profile(p uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from profiles
    where id = p and account_id = auth.uid()
  );
$$;

alter table accounts enable row level security;
drop policy if exists "own account" on accounts;
create policy "own account" on accounts
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter table profiles enable row level security;
drop policy if exists "own profiles" on profiles;
create policy "own profiles" on profiles
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

alter table memories enable row level security;
drop policy if exists "own memories" on memories;
create policy "own memories" on memories
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

alter table throughline_entries enable row level security;
drop policy if exists "own throughline" on throughline_entries;
create policy "own throughline" on throughline_entries
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

alter table oki_messages enable row level security;
drop policy if exists "own oki messages" on oki_messages;
create policy "own oki messages" on oki_messages
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

alter table consent_events enable row level security;
drop policy if exists "own consent ledger" on consent_events;
create policy "own consent ledger" on consent_events
  for all using (owns_profile(profile_id)) with check (owns_profile(profile_id));

alter table pairs enable row level security;
drop policy if exists "own pairs" on pairs;
create policy "own pairs" on pairs
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
-- ---------------------------------------------------------------------------
-- Verified live on 13 October 2026 (information_schema), kept here as the
-- reconciliation anchor. Delete this block once the saved query is pasted
-- above, or keep it commented as the audit trail; both are fine.
--
-- public.memories:
--   id            bigint  GENERATED ALWAYS AS IDENTITY (never supply it)
--   profile_id    uuid    not null
--   local_id      text    not null
--   memory_type   text    not null
--   content       jsonb   not null
--   created_at    timestamptz not null, no default, must be supplied
--   is_private    boolean not null default false
--   consent_required text  nullable
--   kept          boolean not null default false
--
-- create table public.memories (
--   id         bigint generated always as identity primary key,
--   profile_id uuid not null references public.profiles(id),
--   local_id   text not null,
--   memory_type text not null,
--   content    jsonb not null,
--   created_at timestamptz not null,
--   is_private boolean not null default false,
--   consent_required text,
--   kept       boolean not null default false
-- );
-- ---------------------------------------------------------------------------
