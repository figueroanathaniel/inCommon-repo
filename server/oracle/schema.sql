-- server/oracle/schema.sql: the one table the Oracle function writes.
--
-- Run once, in the Supabase dashboard: SQL Editor, paste, Run. It is safe to
-- run again; every statement checks before it creates.
--
-- What a row holds: whose reading it is, which period it covers, how deep it
-- went, a short hash of the chart facts it was written from, and the reading
-- itself. It does NOT hold the chart, a birth date, time or place, or a name:
-- the hash is enough to know when a chart changed and a reading is stale.
--
-- Who may do what: a signed in reader may read their own rows and nothing else.
-- Nobody may insert, change or delete a row from the app. Only the Oracle
-- function writes, with the service role, which is how the daily limit cannot
-- be dodged by deleting rows or raised by anybody but you.

create table if not exists public.oracle_readings (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  period      text not null check (period in ('daily', 'weekly', 'monthly')),
  period_key  text not null,
  depth       text not null check (depth in ('standard', 'deep')),
  chart_key   text not null,
  status      text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  content     jsonb,
  model       text,
  created_at  timestamptz not null default now()
);

-- One reading per reader, period, depth and chart, and one being written at a
-- time. A failed row does not hold the key, so asking again after a failure
-- writes a new one.
create unique index if not exists oracle_readings_one_per_key
  on public.oracle_readings (user_id, period, period_key, depth, chart_key)
  where status in ('pending', 'done');

-- The daily limit counts a reader's rows over the last day.
create index if not exists oracle_readings_by_day
  on public.oracle_readings (user_id, created_at);

alter table public.oracle_readings enable row level security;

drop policy if exists "read own oracle readings" on public.oracle_readings;
create policy "read own oracle readings" on public.oracle_readings
  for select to authenticated using ((select auth.uid()) = user_id);

-- No insert, update or delete policy, on purpose. With row level security on
-- and no policy for them, those are refused for every app user.
