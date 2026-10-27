-- server/migrations/0001-sync-lookup-indexes.sql
--
-- Indexes for the lookups the sync module and the account function already
-- make, which the schema of record (server/cloud-schema.sql) never gave one.
-- Nothing here changes a column, a constraint or a policy, so no write the app
-- makes today can be refused because of it.
--
-- What reads each one:
--   profiles (account_id)            pull() fetches the account's profiles by
--                                    account_id, server/account/index.ts
--                                    selects and deletes by it, and the "own
--                                    profiles" policy and owns_profile() test
--                                    it on every row of every table below.
--   pairs (account_id)               pull() fetches by it, the account
--                                    function deletes by it, and the "own
--                                    pairs" policy tests it.
--   pairs (profile_b)                0003 deletes the pairs a deleted profile
--                                    was in. profile_a is already the leading
--                                    column of unique (profile_a, profile_b).
--   throughline_entries (profile_id) pull() reads with profile_id in (...) and
--   oki_messages (profile_id)        the account function deletes the same
--                                    way; the foreign key cascade from
--                                    profiles walks it too. memories and
--                                    consent_events lead their unique keys
--                                    with profile_id, so they have one.
--   support_requests (user_id)       deleting an auth user sets this column
--                                    to null (on delete set null), which
--                                    scans the table without one.
--
-- Run in the Supabase dashboard: SQL Editor, paste, Run. Safe to run again:
-- every statement checks before it creates. The tables are small, so a plain
-- create index is used rather than concurrently, which cannot run inside the
-- transaction the SQL Editor wraps a script in.
--
-- DOWN (run to undo; nothing reads these by name):
--   drop index if exists public.profiles_by_account;
--   drop index if exists public.pairs_by_account;
--   drop index if exists public.pairs_by_profile_b;
--   drop index if exists public.throughline_entries_by_profile;
--   drop index if exists public.oki_messages_by_profile;
--   drop index if exists public.support_requests_by_user;

create index if not exists profiles_by_account on public.profiles (account_id);
create index if not exists pairs_by_account on public.pairs (account_id);
create index if not exists pairs_by_profile_b on public.pairs (profile_b);
create index if not exists throughline_entries_by_profile on public.throughline_entries (profile_id);
create index if not exists oki_messages_by_profile on public.oki_messages (profile_id);
create index if not exists support_requests_by_user on public.support_requests (user_id);

-- To check it took: six rows.
--   select indexname from pg_indexes where schemaname = 'public' and indexname in
--     ('profiles_by_account', 'pairs_by_account', 'pairs_by_profile_b',
--      'throughline_entries_by_profile', 'oki_messages_by_profile', 'support_requests_by_user');
