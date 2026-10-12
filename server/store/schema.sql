-- server/store/schema.sql: Codex Luminary bought inside the iPhone and Android
-- apps. Run once in the Supabase SQL editor, after server/oracle/schema.sql.
-- Setup: docs/REVENUECAT-SETUP.md.
--
-- store_subscriptions: one row per reader whose app purchase RevenueCat has
-- told us about. It is a table of its own rather than a source column on
-- `subscriptions`, because that table's row is a Stripe customer
-- (stripe_customer_id is not null and unique) and a reader can hold both: a
-- yearly plan bought on the website and a monthly one bought on a phone are two
-- subscriptions with two places to cancel them, and one row could only
-- remember one of them.
--
-- It holds which store sold it, the entitlement's status and plan, when the
-- paid period ends, whether it renews, and the address where the reader manages
-- it (Apple's or Google's own subscription settings). No receipt, no price, no
-- payment detail: Apple, Google and RevenueCat keep those.
--
-- The store function (server/store) writes it with the service role, always
-- from RevenueCat's own answer about the reader, never from what a request
-- says. The billing function reads it so the page sees one status, and the
-- Oracle function reads it to decide whether an in-depth reading may be
-- written. A reader may read their own row and nothing else, and nobody can
-- make themselves a Luminary by writing one.

create table if not exists public.store_subscriptions (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  source              text not null check (source in ('apple', 'google', 'promotional')),
  status              text not null default 'none' check (status in ('active', 'expired', 'none')),
  product_id          text,
  plan                text check (plan in ('monthly', 'annual')),
  current_period_end  timestamptz,
  will_renew          boolean not null default false,
  billing_issue       boolean not null default false,
  sandbox             boolean not null default false,
  management_url      text,
  updated_at          timestamptz not null default now()
);

alter table public.store_subscriptions enable row level security;

drop policy if exists "read own store subscription" on public.store_subscriptions;
create policy "read own store subscription" on public.store_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- No insert, update or delete policy: only the store function writes, with the
-- service role, which row level security does not apply to.
--
-- Then run server/mfa-policies.sql again: it names this table, and two-step
-- sign in covers a table only once that file has been run with it there.
