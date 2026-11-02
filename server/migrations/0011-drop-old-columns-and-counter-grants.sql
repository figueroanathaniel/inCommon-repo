-- server/migrations/0011-drop-old-columns-and-counter-grants.sql
--
-- WHY. Two things 0009 and 0010 left behind on the live project, both
-- decided by the owner on 31 October 2026.
-- * pairs.profile_id and luminary_unlocks.profile_id were the live tables'
--  old keys. After 0009 they are nullable and written by nothing, and each
--  still carried a foreign key to profiles with on delete cascade, so deleting
--  a profile could in principle have taken an unlock with it. The repository
--  has neither column. Checked before dropping them, on 31 October 2026: the
--  only thing in the live database depending on either column was its own
--  foreign key; no row held a value in either; the app reads pairs by
--  profile_a and profile_b; and the deployed billing, oracle and account
--  functions read and write luminary_unlocks by user_id and pairs by
--  account_id, while store and oracle-voice touch neither table.
-- * cast_counters (a table only live has, see 0010) still carried Supabase's
--  default table grants for anon and authenticated, insert, update, delete
--  and truncate among them. Row level security already refuses every write
--  through the API since 0010; revoking the grants refuses them a second
--  time, at the privilege level, which also covers truncate, which row level
--  security does not govern.
--
-- WHAT THIS DOES. Drops the two columns where they exist (their foreign keys
-- go with them). Where cast_counters exists, revokes insert, update, delete
-- and truncate on it from anon and authenticated; select stays, so a reader
-- still reads their own rows through the select policy. On a project of the
-- repository's own shape it does nothing.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
-- Tested by tools/check-hd-study-rls.js, row LV11, against the live shape
-- before and after.
--
-- No dollar sign appears outside a tagged function body: the dashboard's SQL
-- Editor splits a script on bare dollar signs (see server/support.sql).
--
-- DOWN (the columns come back empty, nullable, with their old foreign keys):
--   alter table public.pairs add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
--   alter table public.luminary_unlocks add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
--   grant insert, update, delete, truncate on public.cast_counters to anon, authenticated;

alter table public.pairs drop column if exists profile_id;
alter table public.luminary_unlocks drop column if exists profile_id;

do $cc$
begin
  if to_regclass('public.cast_counters') is not null then
    execute 'revoke insert, update, delete, truncate on public.cast_counters from anon, authenticated';
  end if;
end $cc$;

-- To check it took: neither column listed, and only SELECT (with REFERENCES
-- and TRIGGER) left on cast_counters for anon and authenticated.
--    select table_name, column_name from information_schema.columns
--     where table_schema = 'public' and table_name in ('pairs', 'luminary_unlocks') and column_name = 'profile_id';
--    select grantee, privilege_type from information_schema.role_table_grants
--     where table_name = 'cast_counters' and grantee in ('anon', 'authenticated') order by 1, 2;
