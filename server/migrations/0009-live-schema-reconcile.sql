-- server/migrations/0009-live-schema-reconcile.sql
--
-- WHY. The live project was not the schema of record. Read on 30 October
-- 2026 (information_schema and pg_policies), two tables had another shape
-- and five policies were there that no file in this repository made, and the
-- server logs showed what it cost:
-- * public.pairs had profile_id (not null) in place of account_id, and an id
--  with no identity. Every pull failed asking for pairs.account_id (11 times
--  in a day), and every pair a device sent was refused, three times over:
--  no account_id column, a profile_id the client never sends, and no id.
--  0007's pairs_deleted_drop trigger reads new.account_id, so it failed too.
-- * public.luminary_unlocks had profile_id (not null) in place of user_id,
--  and no primary key. The billing function writes and reads by user_id, so
--  no payment could be recorded and no reader could be found to have paid
--  (6 refusals in a day), and the Oracle function's check failed the same way.
-- * "Users can manage luminary unlocks of their profiles." let a signed in
--  reader write their own unlock row. Harmless only while user_id was
--  missing: with the column added it would be Codex Luminary for nothing, so
--  it is dropped in this file, before the column is added, never after.
-- * "Users can manage their own oracle readings." let a reader write and
--  delete their own readings, which is how a reader lowers the daily limit
--  the server counts, or writes a reading the Oracle never wrote.
-- * "Users can manage their own profiles." and "Users can manage memories of
--  their profiles." repeated "own profiles" and "own memories" word for word
--  in effect. Dropped so the policies on a table are the ones this
--  repository states.
--
-- WHAT THIS DOES. It brings a project of that shape to the repository's, and
-- on a project already of the repository's shape it changes nothing (proven
-- both ways by tools/check-hd-study-rls.js, the live_before and live_after
-- runs, rows LV1 to LV9).
-- * pairs: adds account_id (to accounts, on delete cascade), filled from the
--  profile each row names, the old profile_id first and profile_a after it;
--  makes it not null once no row lacks it; lets profile_id be null, since no
--  build sends it; gives id its identity; and states "own pairs" on
--  account_id, as cloud-schema.sql does.
-- * luminary_unlocks: adds user_id (to auth.users, on delete cascade), filled
--  from the account the old profile_id names; lets profile_id be null; and
--  makes user_id the primary key when the table has none and no row lacks
--  it, or a unique index otherwise, which is what the billing function's
--  upsert on user_id needs. Adds "read own luminary unlock", as
--  server/oracle/schema.sql does.
-- * drops the four policies named above.
--
-- Nothing here adds a constraint the sync module could be refused by: the
-- push always sends account_id for a pair (incommon-cloud.js buildPlan), and
-- luminary_unlocks is written by the billing function alone.
--
-- ORDER ON THE LIVE PROJECT: this file first, then 0001, 0002 and 0003, which
-- were never applied there (0001 indexes pairs.account_id, which this file
-- adds). Then server/mfa-policies.sql again, so the two-step rule still
-- covers both tables. Safe to run again.
--
-- No dollar sign appears outside a tagged function body: the dashboard's SQL
-- Editor splits a script on bare dollar signs (see server/support.sql).
--
-- DOWN (the one index it may add; nothing else is undone, see below):
--   drop index if exists public.luminary_unlocks_user_id_key;
-- The columns, the keys and "read own luminary unlock" are the repository's
-- own shape, so they stay. The four dropped policies are not put back,
-- because one of them gives Codex Luminary away.

-- ---------- the stray policies, first ----------

drop policy if exists "Users can manage luminary unlocks of their profiles." on public.luminary_unlocks;
drop policy if exists "Users can manage their own oracle readings." on public.oracle_readings;
drop policy if exists "Users can manage their own profiles." on public.profiles;
drop policy if exists "Users can manage memories of their profiles." on public.memories;

-- ---------- pairs ----------

do $pairs$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'pairs' and column_name = 'account_id') then
    alter table public.pairs add column account_id uuid references public.accounts(id) on delete cascade;
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'pairs' and column_name = 'profile_id') then
    execute 'update public.pairs p set account_id = pr.account_id from public.profiles pr
              where p.account_id is null and pr.id = p.profile_id';
    alter table public.pairs alter column profile_id drop not null;
  end if;
  update public.pairs p set account_id = pr.account_id from public.profiles pr
   where p.account_id is null and pr.id = p.profile_a;
  if not exists (select 1 from public.pairs where account_id is null) then
    alter table public.pairs alter column account_id set not null;
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'pairs' and column_name = 'id'
                and is_identity = 'NO' and column_default is null) then
    alter table public.pairs alter column id add generated always as identity;
    perform setval(pg_get_serial_sequence('public.pairs', 'id'), coalesce(max(id), 0) + 1, false) from public.pairs;
  end if;
end $pairs$;

drop policy if exists "own pairs" on public.pairs;
create policy "own pairs" on public.pairs
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ---------- luminary_unlocks ----------

do $unlocks$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'luminary_unlocks' and column_name = 'user_id') then
    alter table public.luminary_unlocks add column user_id uuid references auth.users(id) on delete cascade;
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'luminary_unlocks' and column_name = 'profile_id') then
    execute 'update public.luminary_unlocks u set user_id = pr.account_id from public.profiles pr
              where u.user_id is null and pr.id = u.profile_id';
    alter table public.luminary_unlocks alter column profile_id drop not null;
  end if;
  -- A key on user_id alone, unless the table already has one.
  if not exists (
    select 1 from pg_index i
     where i.indrelid = 'public.luminary_unlocks'::regclass and i.indisunique and i.indnatts = 1
       and i.indkey[0] = (select attnum from pg_attribute
                           where attrelid = 'public.luminary_unlocks'::regclass and attname = 'user_id')
  ) then
    if not exists (select 1 from pg_constraint where conrelid = 'public.luminary_unlocks'::regclass and contype = 'p')
       and not exists (select 1 from public.luminary_unlocks where user_id is null) then
      alter table public.luminary_unlocks add primary key (user_id);
    else
      create unique index if not exists luminary_unlocks_user_id_key on public.luminary_unlocks (user_id);
    end if;
  end if;
end $unlocks$;

drop policy if exists "read own luminary unlock" on public.luminary_unlocks;
create policy "read own luminary unlock" on public.luminary_unlocks
  for select to authenticated using ((select auth.uid()) = user_id);

-- To check it took: no column missing, a key on user_id, and on these four
-- tables only the policies this repository states (plus the two-step rule).
--    select table_name, column_name from information_schema.columns
--     where table_schema = 'public' and table_name in ('pairs', 'luminary_unlocks') order by 1, 2;
--    select tablename, policyname, cmd from pg_policies
--     where tablename in ('pairs', 'luminary_unlocks', 'oracle_readings', 'profiles', 'memories') order by 1, 2;
