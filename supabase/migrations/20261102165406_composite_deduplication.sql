-- Coordinated with incommon-cloud.js 2.9.6. Review before production use.
-- No rows are deleted. Existing keyed duplicates abort the whole transaction.
-- NULL local_id rows remain distinct and have no race-deduplication guarantee.
begin;
lock table public.throughline_entries, public.oki_messages in share row exclusive mode;
do $dedup$
declare
  tbl text;
  constraint_name text;
  keys smallint[];
begin
  foreach tbl in array array['throughline_entries', 'oki_messages'] loop
    if exists (
      select 1 from pg_catalog.pg_class c
      where c.oid = format('public.%I', tbl)::regclass and not c.relrowsecurity
    ) then
      raise exception 'RLS must remain enabled on %', tbl;
    end if;
    execute format('select array_agg(attnum::smallint order by case attname when ''profile_id'' then 1 else 2 end) from pg_catalog.pg_attribute where attrelid = %L::regclass and attname in (''profile_id'', ''local_id'') and not attisdropped', 'public.' || tbl) into keys;
    if array_length(keys, 1) is distinct from 2 then
      raise exception 'Expected profile_id and local_id on %', tbl;
    end if;
    constraint_name := case tbl when 'throughline_entries' then 'unique_profile_local_throughline' else 'unique_profile_local_oki' end;
    if exists (select 1 from pg_catalog.pg_constraint where conrelid = format('public.%I', tbl)::regclass and conname = constraint_name) then
      if not exists (select 1 from pg_catalog.pg_constraint where conrelid = format('public.%I', tbl)::regclass and conname = constraint_name and contype = 'u' and conkey = keys and not (select indnullsnotdistinct from pg_catalog.pg_index where indexrelid = conindid)) then
        raise exception 'Existing constraint % has unexpected definition', constraint_name;
      end if;
    else
      -- A duplicate raises 23505 and rolls back both tables. Reconcile with
      -- the data owner; never choose and delete a historical row implicitly.
      execute format('alter table public.%I add constraint %I unique (profile_id, local_id)', tbl, constraint_name);
    end if;
  end loop;
end
$dedup$;
commit;

-- DOWN
-- Roll back the client to its legacy contract in the same maintenance window.
-- alter table public.throughline_entries drop constraint if exists unique_profile_local_throughline;
-- alter table public.oki_messages drop constraint if exists unique_profile_local_oki;
