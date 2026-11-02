-- server/migrations/0017-accounts-tier.sql
--
-- WHY. The owner, 31 October 2026: the account row carries the reader's tier,
-- so it can be read in one place, for reporting among other things. The
-- model stays as it is: Codex Luminary is the one paid level, opened by a
-- one time unlock (luminary_unlocks), or by a subscription taken before it
-- was retired (subscriptions), or by an app store subscription
-- (store_subscriptions, dormant). Those tables stay the record of what was
-- paid, and only the billing and store functions write them.
--
-- WHAT THIS DOES. accounts gains four columns:
--   tier             'free' or 'luminary'
--   tier_source      'unlock', 'subscription', 'store', or null when free
--   tier_until       when a subscription's paid period ends; null for an
--                    unlock, which does not end, and for free
--   tier_updated_at  when the tier was last worked out
-- They are never taken from a request. A trigger on accounts works them out
-- from the three payment tables on every insert and update, whatever the
-- request sent, so a reader who writes tier = 'luminary' to their own row
-- (the "own account" rule lets them write it) gets the true value back. A
-- trigger on each payment table works the account's tier out again whenever
-- that table changes.
--
-- WHAT IT IS NOT. It is a label for reading, not the paywall. The Oracle
-- function's opened() still decides what a reader may have, and it also lets
-- in the listed admin addresses and the store apps, which this label does
-- not see. A subscription whose period ends with no write from Stripe keeps
-- reading 'luminary' until something touches it; tier_until says when it
-- ends, and account_tier_refresh_all() below works every account out again.
--
-- No check constraint: the trigger only ever writes the two values, and a
-- check is one more way for the app's push to be refused (K69).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run, after
-- server/oracle/schema.sql (and server/store/schema.sql, where it was run).
-- Safe to run again; the last line works every existing account out once.
-- server/mfa-policies.sql need not be run again: no table is made.
-- Proven on a throwaway Postgres 16 by tools/check-hd-study-rls.js (rows AT1
-- to AT8).
--
-- DOWN (run to undo; this removes the four columns):
--   drop trigger if exists accounts_tier on public.accounts;
--   drop trigger if exists luminary_unlocks_tier on public.luminary_unlocks;
--   drop trigger if exists subscriptions_tier on public.subscriptions;
--   do $tierdown$ begin if to_regclass('public.store_subscriptions') is not null then drop trigger if exists store_subscriptions_tier on public.store_subscriptions; end if; end $tierdown$;
--   drop function if exists public.account_tier_refresh_all();
--   drop function if exists public.account_tier_touch();
--   drop function if exists public.accounts_tier();
--   alter table public.accounts drop column if exists tier, drop column if exists tier_source, drop column if exists tier_until, drop column if exists tier_updated_at;

alter table public.accounts add column if not exists tier text not null default 'free';
alter table public.accounts add column if not exists tier_source text;
alter table public.accounts add column if not exists tier_until timestamptz;
alter table public.accounts add column if not exists tier_updated_at timestamptz;

-- ---------- the account row, as it is written ----------

create or replace function public.accounts_tier() returns trigger
language plpgsql security definer set search_path = public as $tier$
declare
  st text;
  ends timestamptz;
begin
  new.tier := 'free';
  new.tier_source := null;
  new.tier_until := null;
  new.tier_updated_at := now();
  if exists (select 1 from public.luminary_unlocks u where u.user_id = new.id) then
    new.tier := 'luminary';
    new.tier_source := 'unlock';
    return new;
  end if;
  select s.status, s.current_period_end into st, ends from public.subscriptions s where s.user_id = new.id;
  if st in ('active', 'trialing') and (ends is null or ends > now()) then
    new.tier := 'luminary';
    new.tier_source := 'subscription';
    new.tier_until := ends;
    return new;
  end if;
  st := null;
  ends := null;
  if to_regclass('public.store_subscriptions') is not null then
    -- Planned only when reached, so a project without the table never
    -- reads it.
    select a.status, a.current_period_end into st, ends
      from public.store_subscriptions a where a.user_id = new.id;
    if st = 'active' and (ends is null or ends > now()) then
      new.tier := 'luminary';
      new.tier_source := 'store';
      new.tier_until := ends;
    end if;
  end if;
  return new;
end $tier$;

revoke execute on function public.accounts_tier() from public, anon, authenticated;

drop trigger if exists accounts_tier on public.accounts;
create trigger accounts_tier
  before insert or update on public.accounts
  for each row execute function public.accounts_tier();

-- ---------- a payment table, as it changes ----------

-- Touching the account row runs accounts_tier() above, which reads the
-- tables as they now stand. A row whose account is already gone (an account
-- being deleted takes both) touches nothing.
create or replace function public.account_tier_touch() returns trigger
language plpgsql security definer set search_path = public as $touch$
begin
  if tg_op <> 'DELETE' then
    update public.accounts set tier_updated_at = now() where id = new.user_id;
  end if;
  if tg_op <> 'INSERT' then
    update public.accounts set tier_updated_at = now() where id = old.user_id;
  end if;
  return null;
end $touch$;

revoke execute on function public.account_tier_touch() from public, anon, authenticated;

drop trigger if exists luminary_unlocks_tier on public.luminary_unlocks;
create trigger luminary_unlocks_tier
  after insert or update or delete on public.luminary_unlocks
  for each row execute function public.account_tier_touch();

drop trigger if exists subscriptions_tier on public.subscriptions;
create trigger subscriptions_tier
  after insert or update or delete on public.subscriptions
  for each row execute function public.account_tier_touch();

do $storetier$
begin
  if to_regclass('public.store_subscriptions') is not null then
    drop trigger if exists store_subscriptions_tier on public.store_subscriptions;
    create trigger store_subscriptions_tier
      after insert or update or delete on public.store_subscriptions
      for each row execute function public.account_tier_touch();
  end if;
end $storetier$;

-- ---------- every account at once ----------

-- For the SQL Editor, before reading tiers for a report, so a subscription
-- that ended with no write from Stripe reads as free. Closed to the API.
create or replace function public.account_tier_refresh_all() returns integer
language plpgsql security definer set search_path = public as $refresh$
declare n integer;
begin
  update public.accounts set tier_updated_at = now();
  get diagnostics n = row_count;
  return n;
end $refresh$;

revoke execute on function public.account_tier_refresh_all() from public, anon, authenticated;

select public.account_tier_refresh_all();

-- To check it took: every account has a tier, and the functions are closed.
--   select tier, tier_source, count(*) from public.accounts group by 1, 2 order by 1, 2;
--   select has_function_privilege('authenticated', 'public.account_tier_refresh_all()', 'execute');  -- false
-- To report, work every account out first:
--   select public.account_tier_refresh_all();
--   select tier, count(*) from public.accounts group by 1;
