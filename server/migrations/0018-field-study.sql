-- server/migrations/0018-field-study.sql
--
-- WHY. The Human Design Atlas's modern study (the owner, 4 November 2026):
-- a claim weighed below 70 is a field study, and a reader may add what they
-- noticed in their own life to it. The note and its words stay on the
-- device. What the reader's own press sends is four values: the claim's key,
-- how well it fit (0 not at all, 1 a little, 2 mostly, 3 exactly, null not
-- sure), how charged the moment was (0 quiet, 1 stirred, 2 electric), and
-- whether the reader's chart holds what the claim is about. The fit and the
-- charge are kept in separate columns on purpose: only the fit is read as
-- evidence, and the tally reports the quiet moments apart from the rest.
--
-- WHAT THIS DOES. One table, created with row level security ON and NO
-- policy, so nothing reaches it through the API directly. Two functions do
-- all the work: field_study_add, which only a signed in reader may call and
-- which keeps one note per reader per claim per day (a second note that day
-- replaces the first), and field_study_tally, which returns counts for one
-- claim and nothing about any reader. Both refuse an aal1 session on an
-- account with a verified authenticator, the rule server/mfa-policies.sql
-- holds for every table, because a SECURITY DEFINER function does not meet
-- that file's policies.
--
-- DELETING IS DELETING. user_id cascades from auth.users, so deleting an
-- account, which removes the auth user last (server/account), removes every
-- note it sent.
--
-- DO NOT APPLY before the Privacy Policy says field notes can be sent
-- (app/privacy.html, section 6), and run server/mfa-policies.sql again
-- afterwards (it lists field_study_notes).
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again.
--
-- DOWN (run to undo; this deletes every field note sent):
--   drop function if exists public.field_study_tally(text);
--   drop function if exists public.field_study_add(text, smallint, smallint, boolean);
--   drop table if exists public.field_study_notes;
--   drop function if exists public.field_study_two_step_ok();

create table if not exists public.field_study_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null,
  fit smallint,
  charge smallint not null,
  holds boolean,
  day date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  unique (user_id, item, day)
);

alter table public.field_study_notes enable row level security;

create index if not exists field_study_notes_item on public.field_study_notes (item);

create or replace function public.field_study_two_step_ok()
returns boolean
language sql stable security definer set search_path = ''
as $fs$
  select array[(select auth.jwt() ->> 'aal')] <@ (
    select case when count(id) > 0 then array['aal2'] else array['aal1', 'aal2'] end
    from auth.mfa_factors
    where user_id = (select auth.uid()) and status = 'verified'
  );
$fs$;

create or replace function public.field_study_add(p_item text, p_fit smallint, p_charge smallint, p_holds boolean)
returns void
language plpgsql security definer set search_path = ''
as $fs$
declare
  me uuid := auth.uid();
begin
  if me is null or not public.field_study_two_step_ok() then
    raise exception 'field_study_signin';
  end if;
  if p_item is null or length(p_item) not between 2 and 48 or p_item ~ '[^a-z0-9-]' then raise exception 'field_study_item'; end if;
  if p_fit is not null and (p_fit < 0 or p_fit > 3) then raise exception 'field_study_fit'; end if;
  if p_charge is null or p_charge < 0 or p_charge > 2 then raise exception 'field_study_charge'; end if;
  if (select count(*) from public.field_study_notes
      where user_id = me and day = (now() at time zone 'utc')::date) >= 40 then
    raise exception 'field_study_rate';
  end if;
  insert into public.field_study_notes (user_id, item, fit, charge, holds)
  values (me, p_item, p_fit, p_charge, p_holds)
  on conflict (user_id, item, day) do update
    set fit = excluded.fit, charge = excluded.charge, holds = excluded.holds, created_at = now();
end;
$fs$;

create or replace function public.field_study_tally(p_item text)
returns table (notes bigint, sure bigint, fit bigint, quiet_sure bigint, quiet_fit bigint, held_sure bigint, held_fit bigint)
language sql stable security definer set search_path = ''
as $fs$
  select count(*),
    count(*) filter (where f.fit is not null),
    count(*) filter (where f.fit >= 2),
    count(*) filter (where f.fit is not null and f.charge = 0),
    count(*) filter (where f.fit >= 2 and f.charge = 0),
    count(*) filter (where f.fit is not null and f.holds),
    count(*) filter (where f.fit >= 2 and f.holds)
  from public.field_study_notes f
  where f.item = p_item and (auth.uid() is null or public.field_study_two_step_ok());
$fs$;

revoke all on function public.field_study_two_step_ok() from public;
revoke all on function public.field_study_add(text, smallint, smallint, boolean) from public, anon;
revoke all on function public.field_study_tally(text) from public;
grant execute on function public.field_study_add(text, smallint, smallint, boolean) to authenticated;
grant execute on function public.field_study_tally(text) to anon, authenticated;

-- To check it took: the table exists with row level security on and no
-- policy, and the two functions exist.
--   select relname, relrowsecurity from pg_class where relname = 'field_study_notes';
--   select count(*) from pg_policies where tablename = 'field_study_notes';
--   select proname from pg_proc where proname like 'field_study%';
