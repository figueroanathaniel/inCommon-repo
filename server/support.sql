-- Contact Support: the table the app's support form writes to.
--
-- Run this once in Supabase, SQL Editor, then run server/mfa-policies.sql
-- again so the two-step rule covers this table too. Re-running either file is
-- safe.
--
-- Anybody may send a request, signed in or not, because a reader who never
-- made an account is exactly the reader who most needs a way to reach us, and
-- the Privacy Policy and the Terms name this form as the way to make a privacy
-- request, ask for an account to be deleted, or cancel. Nobody can read the
-- table back through the API: there is no select, update or delete policy, so
-- only the dashboard (and the service role) sees it. Read new requests in
-- Table Editor, support_requests, filtered on status = 'open', answer each by
-- email from the address the reader gave, and set status to 'answered'.
--
-- No dollar sign appears outside the one tagged function body, because the
-- dashboard's SQL Editor splits a script on dollar signs before it runs it:
-- an email pattern ending in one cut the table definition short there.
--
-- A request is throttled by a trigger rather than by the page, because the
-- page can be bypassed: five per email address per day, and two hundred across
-- everybody per hour, which is far above real use and well below a flood.

create table if not exists public.support_requests (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid default auth.uid() references auth.users (id) on delete set null,
  topic       text not null check (topic in ('general', 'account', 'billing', 'privacy', 'delete', 'problem')),
  email       text not null check (char_length(email) between 3 and 254 and email like '%_@_%._%' and email !~ '[[:space:]]'),
  message     text not null check (char_length(message) between 10 and 5000),
  status      text not null default 'open' check (status in ('open', 'answered', 'closed'))
);

create index if not exists support_requests_by_email on public.support_requests (lower(email), created_at);
create index if not exists support_requests_by_time on public.support_requests (created_at);

alter table public.support_requests enable row level security;

-- Sending is the only thing the API may do. A signed in sender may stamp their
-- own id or none; nobody may stamp somebody else's, and every request arrives
-- open.
drop policy if exists "anyone may send a support request" on public.support_requests;
create policy "anyone may send a support request" on public.support_requests
  for insert to anon, authenticated
  with check (status = 'open' and (user_id is null or user_id = (select auth.uid())));

create or replace function public.support_requests_throttle() returns trigger
language plpgsql security definer set search_path = public as $throttle$
begin
  if (select count(*) from public.support_requests
      where lower(email) = lower(new.email) and created_at > now() - interval '1 day') >= 5 then
    raise exception 'support_rate' using errcode = 'P0001';
  end if;
  if (select count(*) from public.support_requests where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'support_rate' using errcode = 'P0001';
  end if;
  return new;
end $throttle$;

drop trigger if exists support_requests_throttle on public.support_requests;
create trigger support_requests_throttle before insert on public.support_requests
  for each row execute function public.support_requests_throttle();

-- Check: this should list one policy, for insert, to anon and authenticated.
-- select policyname, cmd, roles from pg_policies where tablename = 'support_requests';
