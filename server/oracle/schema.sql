-- server/oracle/schema.sql: the three tables behind the Oracle. oracle_readings
-- is written by the Oracle function, and subscriptions and cycle_unlocks by the
-- billing function (server/billing): the first keeps each reader's Luminary
-- subscription as Stripe reports it, the second records who has opened the
-- Cycle Audit with a payment of their own choosing.
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
  period      text not null check (period in ('daily', 'weekly', 'monthly', 'cycle')),
  period_key  text not null,
  depth       text not null check (depth in ('standard', 'deep')),
  chart_key   text not null,
  status      text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  content     jsonb,
  model       text,
  created_at  timestamptz not null default now()
);

-- The Cycle Audit (18 October 2026) is a fourth period. A table made before it
-- holds the three period check, which create table above does not touch, so
-- the check is replaced here under the name Postgres gave it.
alter table public.oracle_readings drop constraint if exists oracle_readings_period_check;
alter table public.oracle_readings add constraint oracle_readings_period_check
  check (period in ('daily', 'weekly', 'monthly', 'cycle'));

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

-- ---------------------------------------------------------------------------
-- subscriptions: one row per reader who has ever opened a checkout, the
-- Codex's own record of a Stripe customer, ported. It holds the Stripe
-- customer and subscription ids, the subscription's status and plan, and when
-- the paid period ends. No card, no address, no amount: Stripe keeps those.
--
-- The billing function writes it with the service role, from Stripe's own
-- answer, both when Stripe calls the webhook and when a reader's row has gone
-- stale. The Oracle function reads it to decide whether an in-depth reading
-- may be written. A reader may read their own row and nothing else, and
-- nobody can make themselves a Luminary by writing one.

create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id      text not null unique,
  stripe_subscription_id  text,
  status                  text not null default 'none',
  plan                    text check (plan in ('monthly', 'annual')),
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- No insert, update or delete policy here either, for the same reason.

-- ---------------------------------------------------------------------------
-- cycle_unlocks: one row per reader who has paid for the Cycle Audit, the
-- owner's pay what you want unlock of 18 October 2026. One payment, of any
-- amount from the floor up, opens the audit for the account for good, so a
-- reader has one row or none. It holds the Stripe Checkout session that paid,
-- the amount and currency the reader chose, and when. No card and no address.
--
-- The billing function writes it with the service role, from Stripe's own
-- answer: on the checkout.session.completed webhook, and again when a reader
-- asks for their status with a sync and the webhook has not landed. The
-- Oracle function reads it before it writes a Cycle Audit on the website. A
-- reader may read their own row and nothing else, so nobody unlocks the audit
-- by writing one.

create table if not exists public.cycle_unlocks (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  stripe_session_id  text not null unique,
  amount             integer not null check (amount >= 0),
  currency           text not null,
  created_at         timestamptz not null default now()
);

alter table public.cycle_unlocks enable row level security;

drop policy if exists "read own cycle unlock" on public.cycle_unlocks;
create policy "read own cycle unlock" on public.cycle_unlocks
  for select to authenticated using ((select auth.uid()) = user_id);

-- No insert, update or delete policy, for the same reason as the two above.
