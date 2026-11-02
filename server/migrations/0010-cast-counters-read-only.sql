-- server/migrations/0010-cast-counters-read-only.sql
--
-- WHY. public.cast_counters exists only on the live project: it was made in
-- the dashboard, no file in this repository creates it, and nothing in the
-- app or in any deployed function reads or writes it (the app, server/ and
-- the five deployed functions' source were searched on 31 October 2026). Live
-- it carried four policies, "own counter select", "own counter insert",
-- "own counter update" and "own counter delete", so a signed in reader could
-- add, change and delete counter rows for any profile of theirs. A counter a
-- reader can write is not a counter anything can trust, and a table nothing
-- uses has no reason to accept writes from the API. The owner decided on 31
-- October 2026 to remove the three write rules.
--
-- WHAT THIS DOES. Drops the insert, update and delete policies on
-- cast_counters, where that table exists. The select policy stays, so a
-- reader still sees their own rows. With row level security on and no write
-- policy, every write through the API is refused; the service role (the
-- server functions) is unaffected, because it bypasses row level security.
-- On a project without the table (the repository's own schema) it does
-- nothing. The two-step rule from server/mfa-policies.sql is untouched.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
-- Tested by tools/check-hd-study-rls.js, row LV10, against the live shape
-- before and after.
--
-- No dollar sign appears outside a tagged function body: the dashboard's SQL
-- Editor splits a script on bare dollar signs (see server/support.sql).
--
-- DOWN (the three write rules as live had them; this reopens writes):
--   create policy "own counter insert" on public.cast_counters for insert to authenticated with check (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));
--   create policy "own counter update" on public.cast_counters for update to authenticated using (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));
--   create policy "own counter delete" on public.cast_counters for delete to authenticated using (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));

do $cc$
begin
  if to_regclass('public.cast_counters') is not null then
    execute 'drop policy if exists "own counter insert" on public.cast_counters';
    execute 'drop policy if exists "own counter update" on public.cast_counters';
    execute 'drop policy if exists "own counter delete" on public.cast_counters';
  end if;
end $cc$;

-- To check it took: one policy of its own left (select), plus the two-step
-- rule.
--    select policyname, cmd from pg_policies where tablename = 'cast_counters' order by 1;
