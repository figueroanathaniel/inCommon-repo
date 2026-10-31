#!/usr/bin/env node
/* check-hd-study-rls.js: the row level security of the Human Design study
 * tables (assignment 2.2, Task 2), proven on a throwaway Postgres.
 *
 * It never touches a real project. It makes a Postgres cluster in a temporary
 * folder, gives it a stub of Supabase's auth schema (auth.uid(), auth.jwt(),
 * auth.users, auth.mfa_factors and the anon, authenticated and service_role
 * roles), applies server/cloud-schema.sql from its v2 section,
 * server/support.sql (0001 indexes its table), every file in
 * server/migrations/ and server/mfa-policies.sql, then signs in as two readers
 * by setting the request's JWT claims the way PostgREST does, and asks what
 * each may do.
 *
 * Rows WH1 to WH18 are migration 0006, the server holding "Save my profile
 * to my account" and "this profile is for someone else" (the follow-up
 * review's findings 4, 5 and 9): an older build's birth is emptied while the
 * ledger says off, cleared or somebody else's, the right later word puts it
 * back, and an Oracle reading of a withheld profile is not kept. So this
 * applies server/oracle/schema.sql too.
 *
 * Rows DP1 to DP13 are migrations 0007 and 0008: a profile deleted on one
 * device stays deleted on every device (the owner, 30 October 2026; the 2.2
 * review's RV3). Recording the deletion removes everything of the profile on
 * the account, anything sent for it afterwards lands nothing, and the record
 * is the account's own: nobody else reads it, adds to it or reaches through
 * it, and nobody removes it.
 *
 * Row LV10 is migration 0010: cast_counters, a table only live has, took
 * writes from its readers through the API. Row LV11 is migration 0011: the
 * two old profile_id columns are dropped, and cast_counters loses its write
 * and truncate grants.
 *
 * Rows LV1 to LV9 are migration 0009: the live project's pairs and
 * luminary_unlocks had drifted from the repository (pairs keyed by profile_id
 * with no account_id, unlocks by profile_id with no user_id
 * and no key) and carried four policies no file made, one of which would hand
 * a reader a free unlock once user_id existed. Found 30 October 2026.
 *
 * Rows HR1 to HR5, BN1 to BN5, PL1 to PL10 and CN1 to CN6 are assignment
 * 2.3 (the owner, 31 October 2026: the account is the true copy for signed in
 * readers, and what the device alone held syncs): 0012 makes the seven own
 * rules again for authenticated with the caller read once; 0013 gives a
 * profile its birth name, withheld as its birth is; 0014 and 0015 give saved
 * people a table only a relationships grant fills; 0016 widens the
 * memory_type check for chart notes and tarot readings, and withholds a
 * note's "resolved" as birth data.
 *
 * It runs the cases eight times, in eight databases:
 *   live_before     the live project as it was read: the drift, the legacy
 *                   rows, 0004 to 0008, and none of 0001 to 0003 or 0009:
 *                   every LV row is red;
 *   live_after      the same, then 0009, 0001, 0002, 0003 and 0010 to 0016
 *                   in that order, as the README gives it for the live
 *                   project: all pass;
 *   before          without 0005 to 0009 and chart_versions in the two-step
 *                   list: the table must be unreachable, so the reader's own
 *                   writes fail, nothing withholds a birth, and a deleted
 *                   profile can come back;
 *   before_2_3      everything but 0012 to 0016: every 2.3 row but HR4 is
 *                   red, so each one tells the rule from its absence;
 *   nomfa           0005 without the two-step entry: an aal1 session is still
 *                   refused, because owns_profile() reads profiles under that
 *                   table's own two-step rule; only CV14 (the rule on the
 *                   table itself) goes red;
 *   nomfa_definer   the same with owns_profile() made SECURITY DEFINER: the
 *                   inherited refusal is gone and CV10a goes red, which is
 *                   what the list entry is for;
 *   full_definer    everything, with the definer function: all pass;
 *   full_schema     everything as the files stand: all pass.
 * A run that passes where it should fail is a failure of this gate, because
 * it would mean a case cannot tell the rule from its absence.
 *
 * Needs Postgres 16 binaries (initdb, pg_ctl, psql). Without them it says it
 * did not run and exits 2: a gate that did not run is never reported as
 * passed. As root it runs the cluster as the postgres user.
 *
 * No dash characters: the detector would be a dash itself.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const quiet = process.argv.includes('--quiet');

function pgBin() {
  const roots = ['/usr/lib/postgresql'];
  for (const r of roots) {
    let vers = [];
    try { vers = fs.readdirSync(r).filter(v => /^\d+$/.test(v)).sort((a, b) => b - a); } catch (e) {}
    for (const v of vers) {
      const bin = path.join(r, v, 'bin');
      if (fs.existsSync(path.join(bin, 'initdb'))) return bin;
    }
  }
  const w = spawnSync('which', ['initdb'], { encoding: 'utf8' });
  return w.status === 0 ? path.dirname(w.stdout.trim()) : null;
}

const BIN = pgBin();
if (!BIN) { console.log('check-hd-study-rls: NOT RUN, no Postgres binaries on this machine'); process.exit(2); }
const asRoot = typeof process.getuid === 'function' && process.getuid() === 0;
function run(cmd, args, input) {
  const full = asRoot ? ['runuser', ['-u', 'postgres', '--', path.join(BIN, cmd), ...args]] : [path.join(BIN, cmd), args];
  return spawnSync(full[0], full[1], { encoding: 'utf8', input: input || undefined });
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hdrls-'));
if (asRoot) spawnSync('chown', ['postgres:postgres', dir]);
const port = String(54000 + Math.floor(Math.random() * 900));
let started = false;
function cleanup() {
  if (started) run('pg_ctl', ['-D', path.join(dir, 'data'), '-m', 'immediate', 'stop']);
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}
process.on('exit', cleanup);

let r = run('initdb', ['-D', path.join(dir, 'data'), '-A', 'trust', '-U', 'postgres', '--no-instructions']);
if (r.status !== 0) { console.log('check-hd-study-rls: NOT RUN, initdb failed: ' + (r.stderr || '').trim()); process.exit(2); }
r = run('pg_ctl', ['-D', path.join(dir, 'data'), '-w', '-l', path.join(dir, 'log'),
  '-o', `-p ${port} -k ${dir} -c listen_addresses=`, 'start']);
if (r.status !== 0) { console.log('check-hd-study-rls: NOT RUN, Postgres would not start: ' + (r.stderr || '').trim()); process.exit(2); }
started = true;

function psql(db, sql) {
  const res = run('psql', ['-h', dir, '-p', port, '-U', 'postgres', '-d', db, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-f', '-'], sql);
  return { ok: res.status === 0, out: (res.stdout || '').trim(), err: (res.stderr || '').trim() };
}

/* ---------- the schema ------------------------------------------------- */

const STUB = `
do $roles$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $roles$;
create schema auth;
create table auth.users (id uuid primary key, email text);
create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid not null, status text not null);
create function auth.jwt() returns jsonb language sql stable as $j$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $j$;
create function auth.uid() returns uuid language sql stable as $u$
  select nullif(auth.jwt() ->> 'sub', '')::uuid $u$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

function cloudV2() {
  const src = fs.readFileSync(path.join(repo, 'server', 'cloud-schema.sql'), 'utf8');
  const at = src.indexOf('-- ---------- v2 ----------');
  if (at === -1) throw new Error('cloud-schema.sql has no v2 section');
  return src.slice(at);
}
function migrations(skip) {
  const d = path.join(repo, 'server', 'migrations');
  return fs.readdirSync(d).filter(f => /^\d{4}-.*\.sql$/.test(f)).sort()
    .filter(f => !skip.some(s => f.indexOf(s) === 0))
    .map(f => '-- ' + f + '\n' + fs.readFileSync(path.join(d, f), 'utf8'));
}
function mfa(withChartVersions) {
  let s = fs.readFileSync(path.join(repo, 'server', 'mfa-policies.sql'), 'utf8');
  if (!withChartVersions) s = s.replace(/,\s*'chart_versions'/, '');
  return s;
}

/* ---------- the readers ------------------------------------------------ */

const A = 'aaaaaaaa-0000-4000-8000-00000000000a', B = 'bbbbbbbb-0000-4000-8000-00000000000b';
const PA = 'a0000000-0000-4000-8000-0000000000a1', PB = 'b0000000-0000-4000-8000-0000000000b1';
const BIRTH = `'{"date":"1985-03-10","time":"06:30","time_state":"known","place":"Chicago","lat":41.88,"lon":-87.63,"zone":"America/Chicago","offset_used":-6}'::jsonb`;
const SEED = `
insert into auth.users (id, email) values ('${A}', 'a@test.invalid'), ('${B}', 'b@test.invalid');
insert into public.accounts (id) values ('${A}'), ('${B}');
insert into public.profiles (id, account_id, name) values ('${PA}', '${A}', 'Ana'), ('${PB}', '${B}', 'Bea');
`;
/* The live project's shape as it was read on 30 October 2026, made from the
   repository's: pairs keyed by a profile_id with no account_id (its id is an
   identity, as live has it), luminary_unlocks keyed by a profile_id with no
   user_id and no key, cast_counters (a table only live has) with write rules
   for its readers, and four policies no file in the repository made. Applied before any
   migration in the live runs, with 0001 to 0003 absent, as they were there. */
const DRIFT = `
drop policy if exists "own pairs" on public.pairs;
alter table public.pairs drop column account_id;
alter table public.pairs add column profile_id uuid not null references public.profiles(id) on delete cascade;
create policy "own pairs" on public.pairs for all to authenticated
  using (profile_id in (select id from public.profiles where account_id = auth.uid()));
drop policy if exists "read own luminary unlock" on public.luminary_unlocks;
alter table public.luminary_unlocks drop column user_id;
alter table public.luminary_unlocks add column profile_id uuid not null references public.profiles(id) on delete cascade;
create policy "Users can manage luminary unlocks of their profiles." on public.luminary_unlocks for all to authenticated
  using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));
create policy "Users can manage their own oracle readings." on public.oracle_readings for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage their own profiles." on public.profiles for all to authenticated
  using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "Users can manage memories of their profiles." on public.memories for all to authenticated
  using (profile_id in (select id from public.profiles where account_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where account_id = auth.uid()));
create table public.cast_counters (profile_id uuid not null references public.profiles(id) on delete cascade, cast_day date not null, casts integer not null default 0);
alter table public.cast_counters enable row level security;
create policy "own counter select" on public.cast_counters for select to authenticated
  using (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));
create policy "own counter insert" on public.cast_counters for insert to authenticated
  with check (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));
create policy "own counter update" on public.cast_counters for update to authenticated
  using (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));
create policy "own counter delete" on public.cast_counters for delete to authenticated
  using (profile_id in (select profiles.id from public.profiles where profiles.account_id = auth.uid()));
`;
/* A pair and an unlock written in the drifted shape, so 0009's fill is proven
   on rows rather than on an empty table. */
const PX = 'c0000000-0000-4000-8000-0000000000c1';
const LEGACY = `
insert into public.pairs (profile_id, profile_a, profile_b, enabled) values ('${PA}', '${PA}', '${PX}', true);
insert into public.luminary_unlocks (profile_id, stripe_session_id, amount, currency) values ('${PB}', 'cs_legacy', 300, 'usd');
`;
function as(user, aal, body) {
  const claims = user ? JSON.stringify({ sub: user, role: 'authenticated', aal: aal || 'aal1' }) : JSON.stringify({ role: 'anon' });
  return `begin;\nset local role ${user ? 'authenticated' : 'anon'};\nset local request.jwt.claims = '${claims}';\n${body}\ncommit;\n`;
}
const COUNT_ALL = `select count(*) from public.chart_versions;`;
function superCount(db) { return psql(db, COUNT_ALL).out; }
function ins(local, profile) {
  return `insert into public.chart_versions (profile_id, local_id, seq, reason, birth, birth_key, created_at)
    values ('${profile || PA}', '${local}', 1, 'initial', ${BIRTH}, 'h1', now());`;
}

const PC = 'c0000000-0000-4000-8000-0000000000c1';
function upP(name, date) {
  return `insert into public.profiles (id, account_id, name, birth_date, birth_lat, location_resolved)
    values ('${PC}', '${A}', '${name}', '${date}', 41.88, true)
    on conflict (id) do update set name = excluded.name, birth_date = excluded.birth_date,
      birth_lat = excluded.birth_lat, location_resolved = excluded.location_resolved;`;
}
function rowP(db) { return psql(db, `select coalesce(name, '') || '|' || coalesce(birth_date, '') from public.profiles where id = '${PC}';`).out; }
function ev(scope, action, n) {
  return `insert into public.consent_events (profile_id, scope, action, ts) values ('${PC}', '${scope}', '${action}', '2026-10-30T10:00:0${n}Z');`;
}
/* As the Oracle function writes it, with the service role: claimed, then finished. */
function reading(user, key, profile) {
  return `insert into public.oracle_readings (user_id, period, period_key, depth, chart_key, status, profile_id)
      values ('${user}', 'daily', '2026-10-30', 'standard', '${key}', 'pending', '${profile}');
    update public.oracle_readings set status = 'done', content = '{"x": 1}'::jsonb where chart_key = '${key}';`;
}
const PD = 'c0000000-0000-4000-8000-0000000000d1';
function evAt(pid, scope, action, tsExpr) {
  return `insert into public.consent_events (profile_id, scope, action, ts) values ('${pid}', '${scope}', '${action}', ${tsExpr});`;
}
const PE = 'c0000000-0000-4000-8000-0000000000e1';
function childRows(pid, tag) {
  return `insert into public.memories (profile_id, local_id, memory_type, content, created_at) values ('${pid}', '${tag}', 'journal', '{"t": "x"}'::jsonb, now());
    insert into public.throughline_entries (profile_id, local_id, payload) values ('${pid}', '${tag}', '{"t": "x"}'::jsonb);
    insert into public.oki_messages (profile_id, local_id, payload) values ('${pid}', '${tag}', '{"t": "x"}'::jsonb);`;
}
function childCount(db, pid) {
  return psql(db, `select (select count(*) from public.memories where profile_id = '${pid}') || '|' ||
    (select count(*) from public.throughline_entries where profile_id = '${pid}') || '|' ||
    (select count(*) from public.oki_messages where profile_id = '${pid}');`).out;
}
const PF = 'c0000000-0000-4000-8000-0000000000f1', PG = 'c0000000-0000-4000-8000-0000000000f2', PH = 'c0000000-0000-4000-8000-0000000000f3';
function rec(user, pid, extra) {
  return `insert into public.deleted_profiles (account_id, profile_id${extra ? ', deleted_at' : ''}) values ('${user}', '${pid}'${extra ? ', ' + extra : ''})
    on conflict (account_id, profile_id) do nothing;`;
}
function recCount(db, where) { return psql(db, `select count(*) from public.deleted_profiles${where ? ' where ' + where : ''};`).out; }
function allOf(db, pid) {
  return psql(db, `select (select count(*) from public.profiles where id = '${pid}') || '|' ||
    (select count(*) from public.memories where profile_id = '${pid}') || '|' ||
    (select count(*) from public.throughline_entries where profile_id = '${pid}') || '|' ||
    (select count(*) from public.oki_messages where profile_id = '${pid}') || '|' ||
    (select count(*) from public.consent_events where profile_id = '${pid}') || '|' ||
    (select count(*) from public.chart_versions where profile_id = '${pid}') || '|' ||
    (select count(*) from public.pairs where profile_a = '${pid}' or profile_b = '${pid}');`).out;
}
function everything(pid, tag) {
  return childRows(pid, tag) + `
    insert into public.consent_events (profile_id, scope, action, ts) values ('${pid}', 'journal', 'grant', '2026-10-30T11:00:0${tag.slice(-1)}Z');
    ${ins(tag, pid)}
    insert into public.pairs (account_id, profile_a, profile_b, enabled) values ('${A}', '${pid}', '${PA}', true);`;
}
function versionsOf(db, pid) { return psql(db, `select count(*) from public.chart_versions where profile_id = '${pid}';`).out; }
function readingOf(db, key) { return psql(db, `select status || '|' || coalesce(content::text, '') from public.oracle_readings where chart_key = '${key}';`).out; }

/* ---------- assignment 2.3 (0012 to 0016) ------------------------------- */
const PN = '90000000-0000-4000-8000-000000000091', PP = '90000000-0000-4000-8000-000000000092',
  PP2 = '90000000-0000-4000-8000-000000000093', PQ = '90000000-0000-4000-8000-000000000094';
function mfile(n) { const d = path.join(repo, 'server', 'migrations');
  return fs.readFileSync(path.join(d, fs.readdirSync(d).filter(x => x.indexOf(n + '-') === 0)[0]), 'utf8'); }
/* Only the DOWN block: the runnable lines under "-- DOWN" (its heading may run on). */
function downOf(file) { const ls = file.split('\n'), at = ls.findIndex(l => /^-- DOWN/.test(l)); const out = [];
  let i = at + 1; while (i < ls.length && /^--/.test(ls[i]) && !/^--   \S/.test(ls[i])) i++;
  for (; i < ls.length && /^--   \S/.test(ls[i]); i++) out.push(ls[i].slice(5));
  return out.join('\n'); }
function trigs(db, names) { return psql(db, `select count(*) from pg_trigger where not tgisinternal and tgname in (${names.map(n => `'${n}'`).join(', ')});`).out; }
function polShape(db) { return psql(db, `select string_agg(tablename || ':' || policyname || ':' || array_to_string(roles, ',') || ':' || coalesce(qual, '') || ':' || coalesce(with_check, ''), ' ' order by tablename, policyname)
  from pg_policies where tablename in ('accounts', 'profiles', 'memories', 'throughline_entries', 'oki_messages', 'consent_events', 'pairs');`).out; }
function upN(name) {
  return `insert into public.profiles (id, account_id, name, birth_date, birth_name) values ('${PN}', '${A}', 'Ana', '1985-03-10', '${name}')
    on conflict (id) do update set name = excluded.name, birth_date = excluded.birth_date, birth_name = excluded.birth_name;`;
}
function nameOf(db) { return psql(db, `select coalesce(birth_name, '') from public.profiles where id = '${PN}';`).out; }
function person(pid, local, name) {
  return `insert into public.people (profile_id, local_id, record) values ('${pid}', '${local}',
    '{"id": "${local}", "display_name": "${name}", "birth_date": "1990-05-01", "notes_enabled": false}'::jsonb)
    on conflict (profile_id, local_id) do update set record = excluded.record;`;
}
function peopleOf(db, pid) { return psql(db, `select count(*) from public.people where profile_id = '${pid}';`).out; }
function note(local, type) {
  return `insert into public.memories (profile_id, local_id, memory_type, content, created_at) values ('${PQ}', '${local}', '${type}',
    '{"text": "kept words", "address": "gate 41.3", "resolved": {"gate": 41, "line": 3}}'::jsonb, now());`;
}
function resolvedOf(db, local) { return psql(db, `select content -> 'resolved' from public.memories where profile_id = '${PQ}' and local_id = '${local}';`).out; }

/* Each case: a name, what it checks, and a function of the database that
   answers true when the rule holds. The cases run in order on one database,
   so a later case sees what an earlier one wrote, as a reader would. */
const CASES = [
  /* ---- LV: the live shape (migration 0009). Each holds on the repository's
     own shape and on the live one once 0009 has run, and fails on the live
     one before it. ---- */
  ['LV1', 'the pull\'s reads answer as the reader: pairs by account and deleted profiles in profile order',
    db => psql(db, as(A, 'aal1', `select count(*) from public.pairs where account_id = '${A}';
      select count(*) from (select profile_id from public.deleted_profiles where account_id = '${A}' order by profile_id) d;`)).ok],
  ['LV2', 'a pair lands exactly as the push sends it, and again as an update, without an id',
    db => { const up = `insert into public.pairs (account_id, profile_a, profile_b, enabled, enabled_by, enabled_at)
      values ('${A}', '${PA}', 'd0000000-0000-4000-8000-0000000000d1', false, null, null)
      on conflict (profile_a, profile_b) do update set enabled = excluded.enabled;`;
      return psql(db, as(A, 'aal1', up)).ok && psql(db, as(A, 'aal1', up.replace('false', 'true'))).ok
        && psql(db, `select count(*) || '|' || bool_and(enabled) from public.pairs where profile_b = 'd0000000-0000-4000-8000-0000000000d1';`).out === '1|true'; }],
  ['LV3', 'another reader neither reads the account\'s pairs nor writes one in its name',
    db => { const r1 = psql(db, as(B, 'aal1', `select count(*) from public.pairs where account_id = '${A}';`));
      const w = psql(db, as(B, 'aal1', `insert into public.pairs (account_id, profile_a, profile_b) values ('${A}', '${PA}', 'd0000000-0000-4000-8000-0000000000d2');`));
      return r1.ok && r1.out === '0' && !w.ok
        && psql(db, `select count(*) from public.pairs where profile_b = 'd0000000-0000-4000-8000-0000000000d2';`).out === '0'; }],
  ['LV4', 'every pair has its account and every unlock its reader, both not null, and the pair id is an identity',
    db => psql(db, `select (select is_nullable from information_schema.columns where table_name = 'pairs' and column_name = 'account_id')
        || '|' || (select is_identity from information_schema.columns where table_name = 'pairs' and column_name = 'id')
        || '|' || (select is_nullable from information_schema.columns where table_name = 'luminary_unlocks' and column_name = 'user_id')
        || '|' || (select count(*) from public.pairs where account_id is null)
        || '|' || (select count(*) from public.luminary_unlocks where user_id is null);`).out === 'NO|YES|NO|0|0'],
  ['LV5', 'the billing function records an unlock by user, once, and finds it by user',
    db => { const w = sid => `begin; set local role service_role;
      insert into public.luminary_unlocks (user_id, stripe_session_id, amount, currency) values ('${A}', '${sid}', 300, 'usd')
      on conflict (user_id) do nothing; commit;`;
      return psql(db, w('cs_lv5a')).ok && psql(db, w('cs_lv5b')).ok
        && psql(db, `select count(*) || '|' || min(stripe_session_id) from public.luminary_unlocks where user_id = '${A}';`).out === '1|cs_lv5a'; }],
  ['LV6', 'a reader cannot write an unlock for themselves, in whichever shape the table has',
    db => { const has = c => psql(db, `select count(*) from information_schema.columns where table_name = 'luminary_unlocks' and column_name = '${c}';`).out === '1';
      /* A reader who holds no unlock, so no key can refuse the row before a
         policy is asked. */
      const C = 'cccccccc-0000-4000-8000-00000000000c', PCC = 'c0000000-0000-4000-8000-0000000000cc';
      psql(db, `insert into auth.users (id, email) values ('${C}', 'c@test.invalid') on conflict do nothing;
        insert into public.accounts (id) values ('${C}') on conflict do nothing;
        insert into public.profiles (id, account_id, name) values ('${PCC}', '${C}', 'Cy') on conflict do nothing;`);
      const cols = [], vals = [];
      if (has('user_id')) { cols.push('user_id'); vals.push(`'${C}'`); }
      if (has('profile_id')) { cols.push('profile_id'); vals.push(`'${PCC}'`); }
      const w = psql(db, as(C, 'aal1', `insert into public.luminary_unlocks (${cols.join(', ')}, stripe_session_id, amount, currency)
        values (${vals.join(', ')}, 'cs_free', 0, 'usd');`));
      return !w.ok && psql(db, `select count(*) from public.luminary_unlocks where stripe_session_id = 'cs_free';`).out === '0'; }],
  ['LV7', 'a reader reads their own unlock and nobody else\'s',
    db => { const a = psql(db, as(A, 'aal1', `select count(*) from public.luminary_unlocks where user_id = '${A}';`));
      const b = psql(db, as(B, 'aal1', `select count(*) from public.luminary_unlocks where user_id = '${A}';`));
      return a.ok && a.out === '1' && b.ok && b.out === '0'; }],
  ['LV8', 'the four policies no file made are gone, and nothing but the two-step rule lets a reader write a reading or an unlock',
    db => psql(db, `select count(*) from pg_policies where policyname in ('Users can manage luminary unlocks of their profiles.',
        'Users can manage their own oracle readings.', 'Users can manage their own profiles.', 'Users can manage memories of their profiles.')
        or (tablename in ('oracle_readings', 'luminary_unlocks') and cmd <> 'SELECT' and permissive = 'PERMISSIVE');`).out === '0'],
  ['CV1', 'a reader adds a version to a profile their account holds',
    db => psql(db, as(A, 'aal1', ins('v1'))).ok],
  ['CV2', 'a reader reads back their own version',
    db => psql(db, as(A, 'aal1', COUNT_ALL)).out === '1'],
  ['CV3', 'another reader sees none of it',
    db => { const x = psql(db, as(B, 'aal1', COUNT_ALL)); return x.ok && x.out === '0'; }],
  ['CV4', 'another reader cannot add a version to a profile that is not theirs',
    db => !psql(db, as(B, 'aal1', ins('vB', PA))).ok && superCount(db) === '1'],
  ['CV5', 'another reader cannot delete it',
    db => { psql(db, as(B, 'aal1', `delete from public.chart_versions;`)); return superCount(db) === '1'; }],
  ['CV6', 'the owner cannot rewrite a version: there is no update rule, so an update changes nothing',
    db => { psql(db, as(A, 'aal1', `update public.chart_versions set reason = 'rewritten';`));
      return psql(db, `select reason from public.chart_versions where local_id = 'v1';`).out === 'initial'; }],
  ['CV7', 'the push sends a version twice with on conflict do nothing (ignoreDuplicates) and it is accepted without a second row',
    db => psql(db, as(A, 'aal1', ins('v1').replace(/;\s*$/, ' on conflict (profile_id, local_id) do nothing;'))).ok && superCount(db) === '1'],
  ['CV8', 'an upsert that would rewrite a version is refused',
    db => !psql(db, as(A, 'aal1', ins('v1').replace(/;\s*$/, " on conflict (profile_id, local_id) do update set reason = 'rewritten';"))).ok
      && psql(db, `select reason from public.chart_versions where local_id = 'v1';`).out === 'initial'],
  ['CV9', 'a visitor with no session reads nothing and writes nothing',
    db => { const r1 = psql(db, as(null, null, COUNT_ALL)); const w = psql(db, as(null, null, ins('vAnon')));
      return (!r1.ok || r1.out === '0') && !w.ok && superCount(db) === '1'; }],
  ['CV10a', 'with a verified authenticator on the account, a password only (aal1) session reads nothing',
    db => { psql(db, `insert into auth.mfa_factors (user_id, status) values ('${A}', 'verified');`);
      const x = psql(db, as(A, 'aal1', COUNT_ALL)); return !x.ok || x.out === '0'; }],
  ['CV10b', 'and the same reader with the code (aal2) reads their version',
    db => { const x = psql(db, as(A, 'aal2', COUNT_ALL)); psql(db, `delete from auth.mfa_factors;`); return x.ok && x.out === '1'; }],
  ['CV11', 'the owner deletes their own versions, as Clear birth data does',
    db => psql(db, as(A, 'aal1', `delete from public.chart_versions where profile_id = '${PA}';`)).ok && superCount(db) === '0'],
  ['CV12', 'deleting the profile deletes its versions',
    db => { psql(db, as(A, 'aal1', ins('v2'))); const before = superCount(db);
      psql(db, as(A, 'aal1', `delete from public.profiles where id = '${PA}';`));
      return before === '1' && superCount(db) === '0'; }],
  ['CV14', 'the two-step rule sits on chart_versions itself, not only inherited through owns_profile()',
    db => psql(db, `select count(*) from pg_policies where tablename = 'chart_versions'
      and policyname = 'two-step sign in, when turned on' and permissive = 'RESTRICTIVE';`).out === '1'],
  ['CV13', 'the table carries exactly three rules, none for update, all for authenticated',
    db => psql(db, `select string_agg(cmd || ':' || array_to_string(roles, ','), ' ' order by cmd)
      from pg_policies where tablename = 'chart_versions' and policyname like 'own chart versions%';`).out
      === 'DELETE:authenticated INSERT:authenticated SELECT:authenticated'],
  ['CV15', 'applying 0004 and 0005 again changes nothing, the DOWN of 0005 removes its rules and 0004 its table, and both apply cleanly after, with 0006 and 0007 put back on the new table',
    db => {
      const file = n => fs.readFileSync(path.join(repo, 'server', 'migrations', n), 'utf8');
      const down = n => file(n).split('\n').filter(l => /^--   \S/.test(l)).map(l => l.slice(5)).join('\n');
      const pol = () => psql(db, `select count(*) from pg_policies where tablename = 'chart_versions' and policyname like 'own chart versions%';`).out;
      const had6 = psql(db, `select to_regprocedure('public.chart_versions_withhold()') is not null;`).out === 't';
      const again = psql(db, file('0004-chart-versions.sql')).ok && psql(db, file('0005-chart-versions-policies.sql')).ok && pol() === '3';
      const d5 = psql(db, down('0005-chart-versions-policies.sql')).ok && pol() === '0';
      const d4 = psql(db, down('0004-chart-versions.sql')).ok && psql(db, `select to_regclass('public.chart_versions') is null;`).out === 't';
      // 0006 and 0007 hang triggers on chart_versions, which 0004's DOWN
      // drops with the table, so they are applied again with the other two.
      const had7 = psql(db, `select to_regclass('public.deleted_profiles') is not null;`).out === 't';
      const back = psql(db, file('0004-chart-versions.sql')).ok && psql(db, file('0005-chart-versions-policies.sql')).ok && pol() === '3'
        && (!had6 || psql(db, file('0006-server-holds-the-switch.sql')).ok)
        && (!had7 || psql(db, file('0007-profiles-deleted-everywhere.sql')).ok);
      return again && d5 && d4 && back;
    }],

  /* ---- migration 0006: the server holds the switch and the mark ---- */
  ['WH1', 'a profile with no switch or mark keeps its birth, as before 0006',
    db => { psql(db, as(A, 'aal1', upP('Cal', '1985-03-10')));
      return rowP(db) === 'Cal|1985-03-10'; }],
  ['WH2', 'saving turned off (a birthData revoke) empties the birth the account held, and keeps the name',
    db => psql(db, as(A, 'aal1', ev('birthData', 'revoke', 1))).ok && rowP(db) === 'Cal|'],
  ['WH3', 'an older build sending the birth again while saving is off is stored without it',
    db => psql(db, as(A, 'aal1', upP('Cal', '1985-03-10'))).ok && rowP(db) === 'Cal|'],
  ['WH4', 'saving turned back on, and the row sent again after the event as the app does, keeps the birth',
    db => psql(db, as(A, 'aal1', ev('birthData', 'grant', 2) + upP('Cal', '1985-03-10'))).ok && rowP(db) === 'Cal|1985-03-10'],
  ['WH5', 'a profile marked for somebody else (a forOther grant) is emptied whole, name and PIN included',
    db => { psql(db, `update public.profiles set pin_hash = 'p1' where id = '${PC}';`);
      return psql(db, as(A, 'aal1', ev('forOther', 'grant', 3))).ok && rowP(db) === '|'
        && psql(db, `select pin_hash is null from public.profiles where id = '${PC}';`).out === 't'; }],
  ['WH6', 'an older build sending the whole profile while it is marked is stored empty',
    db => psql(db, as(A, 'aal1', upP('Cal', '1985-03-10'))).ok && rowP(db) === '|'],
  ['WH7', 'taken back as the reader\'s own and sent again after the event, the profile is whole',
    db => psql(db, as(A, 'aal1', ev('forOther', 'revoke', 4) + upP('Cal', '1985-03-10'))).ok && rowP(db) === 'Cal|1985-03-10'],
  ['WH8', 'Clear birth data (a birthCleared grant) empties the birth and an older build cannot put it back, and a birth given after the clear stands',
    db => { const a = psql(db, as(A, 'aal1', ev('birthCleared', 'grant', 5))).ok && rowP(db) === 'Cal|';
      const b = psql(db, as(A, 'aal1', upP('Cal', '1985-03-10'))).ok && rowP(db) === 'Cal|';
      const c = psql(db, as(A, 'aal1', ev('birthCleared', 'revoke', 6) + upP('Cal', '1986-04-11'))).ok && rowP(db) === 'Cal|1986-04-11';
      return a && b && c; }],
  ['WH9', 'an Oracle reading finished for a withheld profile is stored as served with no content, and for a saved one is kept',
    db => { psql(db, as(A, 'aal1', ev('birthData', 'revoke', 7)));
      psql(db, reading(A, 'k9', PC));
      const off = readingOf(db, 'k9') === 'served|';
      psql(db, as(A, 'aal1', ev('birthData', 'grant', 8) + upP('Cal', '1986-04-11')));
      psql(db, reading(A, 'k9b', PC));
      return off && readingOf(db, 'k9b') === 'done|{"x": 1}'; }],
  ['WH10', 'marking the profile withdraws its kept readings, and leaves another reader\'s reading that names the same profile id untouched',
    db => { psql(db, reading(B, 'kB', PC));
      const ok = psql(db, as(A, 'aal1', ev('forOther', 'grant', 9))).ok;
      return ok && readingOf(db, 'k9b') === 'withdrawn|' && readingOf(db, 'kB') === 'done|{"x": 1}'; }],
  ['WH11', 'nobody signed in or not can ask the API whether a profile is withheld',
    db => psql(db, `select to_regprocedure('public.profile_withheld(uuid)') is not null;`).out === 't'
      && !psql(db, as(A, 'aal1', `select public.profile_withheld('${PC}');`)).ok
      && !psql(db, as(null, null, `select public.profile_withheld('${PC}');`)).ok],
  /* ---- the reviewer's review of section 14 (30 October 2026): gap 2, chart
     versions follow the switch and the mark on the server too; gap 3, an
     event from a fast clock cannot outrank later ones. A fresh profile, set
     up as the service would, so each row tests the rule alone. ---- */
  ['WH13', 'a chart version that arrives for a profile whose saving is off is dropped without an error, and one for a saved profile is kept',
    db => { psql(db, `insert into public.profiles (id, account_id, name, birth_date) values ('${PD}', '${A}', 'Dee', '1972-07-04');`);
      const kept = psql(db, ins('d1', PD)).ok && versionsOf(db, PD) === '1';
      psql(db, evAt(PD, 'birthData', 'revoke', "'2026-10-30T10:00:20Z'"));
      const dropped = psql(db, ins('d2', PD)).ok && versionsOf(db, PD) === '0';
      return kept && dropped; }],
  ['WH14', 'a profile\'s versions are deleted when it becomes withheld, whether by a clear or by a mark, so the history goes even if the app\'s own deletion is lost',
    db => { psql(db, evAt(PD, 'birthData', 'grant', "'2026-10-30T10:00:21Z'"));
      psql(db, ins('d3', PD));
      const before = versionsOf(db, PD);
      psql(db, evAt(PD, 'birthCleared', 'grant', "'2026-10-30T10:00:22Z'"));
      const cleared = versionsOf(db, PD);
      psql(db, evAt(PD, 'birthCleared', 'revoke', "'2026-10-30T10:00:23Z'"));
      psql(db, ins('d4', PD));
      psql(db, evAt(PD, 'forOther', 'grant', "'2026-10-30T10:00:24Z'"));
      return before === '1' && cleared === '0' && versionsOf(db, PD) === '0'; }],
  ['WH15', 'an event dated more than five minutes ahead of the server is stored at the server\'s time, and one a minute ahead keeps its own',
    db => { psql(db, evAt(PD, 'forOther', 'revoke', `'2099-01-01T00:00:00Z'`) + evAt(PD, 'journal', 'grant', `now() + interval '1 minute'`));
      return psql(db, `select (select max(ts) < now() + interval '5 minutes' from public.consent_events where profile_id = '${PD}' and scope = 'forOther')
        and (select max(ts) > now() + interval '30 seconds' from public.consent_events where profile_id = '${PD}' and scope = 'journal');`).out === 't'; }],
  ['WH16', 'so a saving on dated years ahead does not outrank a later true saving off: the birth is emptied',
    db => { psql(db, `update public.profiles set birth_date = '1972-07-04' where id = '${PD}';`);
      psql(db, evAt(PD, 'birthData', 'grant', `'2099-01-01T00:00:00Z'`));
      psql(db, evAt(PD, 'birthData', 'revoke', `now() + interval '1 minute'`));
      return psql(db, `select coalesce(birth_date, '') from public.profiles where id = '${PD}';`).out === ''; }],
  /* ---- the owner's yes of 30 October 2026: a profile marked as somebody
     else's keeps no memory, Throughline entry or Oki message on the account,
     whichever build sends one. A fresh profile again. ---- */
  ['WH17', 'once a profile is marked as somebody else\'s, the journal, Throughline and Oki rows it held are deleted, and saving off alone deletes none of them',
    db => { psql(db, `insert into public.profiles (id, account_id, name) values ('${PE}', '${A}', 'Eli');`);
      psql(db, childRows(PE, 'e1'));
      const before = childCount(db, PE);
      psql(db, evAt(PE, 'birthData', 'revoke', "'2026-10-30T10:00:30Z'"));
      const unsaved = childCount(db, PE);
      psql(db, evAt(PE, 'forOther', 'grant', "'2026-10-30T10:00:31Z'"));
      return before === '1|1|1' && unsaved === '1|1|1' && childCount(db, PE) === '0|0|0'; }],
  ['WH18', 'and an older build sending them for the marked profile lands nothing, without an error; taken back as the reader\'s own, they land again',
    db => { const sent = psql(db, childRows(PE, 'e2')).ok && childCount(db, PE) === '0|0|0';
      psql(db, evAt(PE, 'forOther', 'revoke', "'2026-10-30T10:00:32Z'"));
      const back = psql(db, childRows(PE, 'e3')).ok && childCount(db, PE) === '1|1|1';
      return sent && back; }],
  /* ---- migrations 0007 and 0008: a deleted profile is deleted
     everywhere (the owner, 30 October 2026; the 2.2 review's RV3). A fresh
     profile with something in every table that names it. ---- */
  ['DP1', 'a reader recording that their profile was deleted removes its row, journal, Throughline, Oki log, ledger, chart versions and two person records, and withdraws its kept readings',
    db => { psql(db, `insert into public.profiles (id, account_id, name, birth_date) values ('${PF}', '${A}', 'Fay', '1990-01-01');`);
      psql(db, everything(PF, 'f1'));
      psql(db, reading(A, 'kF', PF));
      const before = allOf(db, PF);
      const ok = psql(db, as(A, 'aal1', rec(A, PF))).ok;
      return before === '1|1|1|1|1|1|1' && ok && allOf(db, PF) === '0|0|0|0|0|0|0' && readingOf(db, 'kF') === 'withdrawn|'; }],
  ['DP2', 'the record holds the server\'s time, whatever the device sends, and recording it twice is accepted without a second row',
    db => psql(db, as(A, 'aal1', rec(A, PG, "'2099-01-01T00:00:00Z'"))).ok && psql(db, as(A, 'aal1', rec(A, PF))).ok
      && recCount(db, `account_id = '${A}'`) === '2'
      && psql(db, `select bool_and(deleted_at <= now()) from public.deleted_profiles;`).out === 't'],
  ['DP3', 'an older build sending the deleted profile again lands nothing, without an error',
    db => psql(db, as(A, 'aal1', `insert into public.profiles (id, account_id, name, birth_date) values ('${PF}', '${A}', 'Fay', '1990-01-01')
      on conflict (id) do update set name = excluded.name;`)).ok && allOf(db, PF) === '0|0|0|0|0|0|0'],
  ['DP4', 'and its journal, Throughline, Oki log, ledger, chart versions and two person records land nothing either, without an error',
    db => psql(db, as(A, 'aal1', everything(PF, 'f2'))).ok && allOf(db, PF) === '0|0|0|0|0|0|0'],
  ['DP5', 'a reading finished for the deleted profile afterwards is stored as served with no content',
    db => { psql(db, reading(A, 'kF2', PF)); return readingOf(db, 'kF2') === 'served|'; }],
  ['DP6', 'the owner cannot remove or rewrite a record: there is no update or delete rule',
    db => { psql(db, as(A, 'aal1', `delete from public.deleted_profiles;`));
      psql(db, as(A, 'aal1', `update public.deleted_profiles set profile_id = '${PH}';`));
      return recCount(db, `account_id = '${A}' and profile_id in ('${PF}', '${PG}')`) === '2'; }],
  ['DP7', 'another reader sees none of the records and cannot add one for this account',
    db => { const r1 = psql(db, as(B, 'aal1', `select count(*) from public.deleted_profiles;`));
      const w = psql(db, as(B, 'aal1', rec(A, PH)));
      return r1.ok && r1.out === '0' && !w.ok && recCount(db, `profile_id = '${PH}'`) === '0'; }],
  ['DP8', 'a record another reader writes under their own account for this account\'s profile id removes nothing of it, and drops nothing this account sends for it',
    db => { psql(db, `insert into public.profiles (id, account_id, name) values ('${PH}', '${A}', 'Hal');`);
      const w = psql(db, as(B, 'aal1', rec(B, PH))).ok;
      const sent = psql(db, as(A, 'aal1', childRows(PH, 'h1'))).ok;
      return w && allOf(db, PH).indexOf('1|1|1|1|') === 0; }],
  ['DP9', 'a visitor with no session reads no record and writes none',
    db => { const r1 = psql(db, as(null, null, `select count(*) from public.deleted_profiles;`)); const w = psql(db, as(null, null, rec(A, PH)));
      return (!r1.ok || r1.out === '0') && !w.ok && recCount(db, `account_id = '${A}' and profile_id = '${PH}'`) === '0'; }],
  ['DP10', 'with a verified authenticator on the account, a password only (aal1) session reads no record, and with the code it reads them',
    db => { psql(db, `insert into auth.mfa_factors (user_id, status) values ('${A}', 'verified');`);
      const x = psql(db, as(A, 'aal1', `select count(*) from public.deleted_profiles;`));
      const y = psql(db, as(A, 'aal2', `select count(*) from public.deleted_profiles;`));
      psql(db, `delete from auth.mfa_factors;`);
      return (!x.ok || x.out === '0') && y.ok && y.out === '2'; }],
  ['DP11', 'a record carries the account, the profile id and the time, and nothing else, and the table carries exactly two rules, both for authenticated',
    db => psql(db, `select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_name = 'deleted_profiles';`).out
        === 'account_id,profile_id,deleted_at'
      && psql(db, `select string_agg(cmd || ':' || array_to_string(roles, ','), ' ' order by cmd)
        from pg_policies where tablename = 'deleted_profiles' and policyname like 'own deleted profiles%';`).out === 'INSERT:authenticated SELECT:authenticated'],
  ['DP12', 'nobody signed in or not can ask the API whether a profile id was deleted',
    db => psql(db, `select to_regprocedure('public.profile_deleted(uuid, uuid)') is not null;`).out === 't'
      && !psql(db, as(A, 'aal1', `select public.profile_deleted('${A}', '${PF}');`)).ok
      && !psql(db, as(null, null, `select public.profile_deleted('${A}', '${PF}');`)).ok],
  ['WH12', 'applying 0006 again changes nothing, its DOWN removes it and turns served and withdrawn rows to failed, and it applies cleanly after',
    db => {
      const file = fs.readFileSync(path.join(repo, 'server', 'migrations', '0006-server-holds-the-switch.sql'), 'utf8');
      const down = file.split('\n').filter(l => /^--   \S/.test(l)).map(l => l.slice(5)).join('\n');
      const trig = () => psql(db, `select count(*) from pg_trigger where tgname in ('profiles_withhold', 'oracle_readings_withhold', 'consent_marks_apply', 'chart_versions_withhold', 'consent_events_clamp', 'memories_withhold', 'throughline_entries_withhold', 'oki_messages_withhold');`).out;
      const again = psql(db, file).ok && trig() === '8';
      const d = psql(db, down).ok && trig() === '0'
        && psql(db, `select count(*) from public.oracle_readings where status in ('served', 'withdrawn');`).out === '0'
        && psql(db, `select count(*) from information_schema.columns where table_name = 'oracle_readings' and column_name = 'profile_id';`).out === '0';
      const back = psql(db, file).ok && trig() === '8';
      return again && d && back;
    }],
  ['DP13', 'applying 0007 and 0008 again changes nothing, their DOWN removes the record and every rule, and both apply cleanly after',
    db => {
      const file = n => fs.readFileSync(path.join(repo, 'server', 'migrations', n), 'utf8');
      const down = n => file(n).split('\n').filter(l => /^--   \S/.test(l)).map(l => l.slice(5)).join('\n');
      const trig = () => psql(db, `select count(*) from pg_trigger where not tgisinternal and tgname in ('deleted_profiles_stamp', 'deleted_profiles_apply', 'profiles_deleted_drop', 'memories_deleted_drop', 'throughline_entries_deleted_drop', 'oki_messages_deleted_drop', 'consent_events_deleted_drop', 'chart_versions_deleted_drop', 'pairs_deleted_drop', 'oracle_readings_deleted');`).out;
      const n7 = '0007-profiles-deleted-everywhere.sql', n8 = '0008-deleted-profiles-policies.sql';
      const kept = recCount(db);
      const again = psql(db, file(n7)).ok && psql(db, file(n8)).ok && trig() === '10' && recCount(db) === kept;
      /* 0015 hangs a trigger on 0007's function, so where it is in, its DOWN
         goes first and it is applied again last, as the README says. */
      const has15 = trigs(db, ['people_deleted_drop']) === '1';
      const d = (!has15 || psql(db, downOf(mfile('0015'))).ok) && psql(db, down(n8)).ok && psql(db, down(n7)).ok && trig() === '0'
        && psql(db, `select to_regclass('public.deleted_profiles') is null;`).out === 't';
      const back = psql(db, file(n7)).ok && psql(db, file(n8)).ok && trig() === '10'
        && (!has15 || psql(db, mfile('0015')).ok);
      return again && d && back;
    }],
  ['LV10', 'a reader cannot add, change or remove a cast counter, and still reads their own, where the table exists (0010)',
    db => {
      if (psql(db, `select to_regclass('public.cast_counters') is null;`).out === 't') return true;
      /* A profile of its own: earlier cases delete PA, and a counter on a
         profile the reader no longer owns is refused for the wrong reason. */
      const PK = 'e0000000-0000-4000-8000-0000000000e1', day = '2026-01-02';
      psql(db, `insert into public.profiles (id, account_id, name) values ('${PK}', '${A}', 'Kit') on conflict (id) do nothing;
        delete from public.cast_counters where profile_id = '${PK}';
        insert into public.cast_counters (profile_id, cast_day, casts) values ('${PK}', '${day}', 1);`);
      const ins = psql(db, as(A, 'aal1', `insert into public.cast_counters (profile_id, cast_day, casts) values ('${PK}', '2026-01-03', 1);`));
      psql(db, as(A, 'aal1', `update public.cast_counters set casts = 99 where profile_id = '${PK}';`));
      psql(db, as(A, 'aal1', `delete from public.cast_counters where profile_id = '${PK}';`));
      const own = psql(db, as(A, 'aal1', `select count(*) from public.cast_counters where profile_id = '${PK}';`));
      const kept = psql(db, `select count(*) || '|' || coalesce(max(casts), 0) from public.cast_counters where profile_id = '${PK}';`).out;
      psql(db, `delete from public.cast_counters where profile_id = '${PK}'; delete from public.profiles where id = '${PK}';`);
      return !ins.ok && own.ok && own.out === '1' && kept === '1|1';
    }],
  ['LV11', 'neither old profile_id column is left, and nobody may insert, update, delete or truncate cast_counters by privilege, where the table exists (0011)',
    db => {
      const cols = psql(db, `select count(*) from information_schema.columns where table_schema = 'public'
        and table_name in ('pairs', 'luminary_unlocks') and column_name = 'profile_id';`).out;
      if (cols !== '0') return false;
      if (psql(db, `select to_regclass('public.cast_counters') is null;`).out === 't') return true;
      return psql(db, `select count(*) from (values ('anon'), ('authenticated')) r(role), unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) p(priv)
        where has_table_privilege(r.role, 'public.cast_counters', p.priv)
           or not has_table_privilege(r.role, 'public.cast_counters', 'SELECT');`).out === '0';
    }],
  ['LV9', 'applying 0009 again changes no column, key or policy on the two tables, and its DOWN applies',
    db => {
      const f = fs.readFileSync(path.join(repo, 'server', 'migrations', '0009-live-schema-reconcile.sql'), 'utf8');
      const down = f.split('\n').filter(l => /^--   \S/.test(l)).map(l => l.slice(5)).join('\n');
      const shape = () => psql(db, `select string_agg(x, ' ' order by x) from (
        select table_name || '.' || column_name || ':' || is_nullable || ':' || is_identity x from information_schema.columns
         where table_schema = 'public' and table_name in ('pairs', 'luminary_unlocks')
        union all select conrelid::regclass || ':' || conname from pg_constraint where conrelid in ('public.pairs'::regclass, 'public.luminary_unlocks'::regclass)
        union all select indexname from pg_indexes where tablename in ('pairs', 'luminary_unlocks')
        union all select tablename || ':' || policyname from pg_policies where tablename in ('pairs', 'luminary_unlocks', 'oracle_readings', 'profiles', 'memories')) s;`).out;
      const was = shape();
      /* 0009 makes "own pairs" in its older form, so where 0012 is in, it is
         run again after, as 0012's header says. */
      const has12 = psql(db, `select to_regclass('public.memories_by_profile_type_time') is not null;`).out === 't';
      return psql(db, f).ok && shape() === was && psql(db, down).ok && psql(db, f).ok && (!has12 || psql(db, mfile('0012')).ok);
    }],

  /* ---- assignment 2.3: migrations 0012 to 0016 ---- */
  ['HR1', 'each of the seven own rules is for authenticated alone, one per table, and reads the caller once per statement (0012)',
    db => psql(db, `select count(*) || '|' || count(*) filter (where roles = '{authenticated}')
        || '|' || count(*) filter (where policyname in ('own account', 'own profiles', 'own pairs') and qual ilike '%select auth.uid()%' and with_check ilike '%select auth.uid()%')
      from pg_policies where policyname in ('own account', 'own profiles', 'own memories', 'own throughline',
        'own oki messages', 'own consent ledger', 'own pairs');`).out === '7|7|3'],
  ['HR2', 'owns_profile() keeps a fixed search_path (0012)',
    db => psql(db, `select array_to_string(proconfig, ',') from pg_proc where proname = 'owns_profile';`).out === 'search_path=public'],
  ['HR3', 'memories has its index on profile, type and time, newest first (0012)',
    db => /\(profile_id, memory_type, created_at DESC\)/.test(psql(db, `select indexdef from pg_indexes where indexname = 'memories_by_profile_type_time';`).out)],
  ['HR4', 'under the rules as made again, a reader reads their own memories, another reader and a visitor read none of them',
    db => { psql(db, `insert into public.profiles (id, account_id, name) values ('${PQ}', '${A}', 'Quin') on conflict (id) do nothing;
        insert into public.memories (profile_id, local_id, memory_type, content, created_at) values ('${PQ}', 'hr4', 'journal', '{"t": "x"}'::jsonb, now()) on conflict do nothing;`);
      const q = `select count(*) from public.memories where profile_id = '${PQ}';`;
      const a = psql(db, as(A, 'aal1', q)), b = psql(db, as(B, 'aal1', q)), v = psql(db, as(null, null, q));
      return a.ok && a.out === '1' && b.ok && b.out === '0' && (!v.ok || v.out === '0'); }],
  ['HR5', 'applying 0012 again changes no rule, its DOWN applies, and it applies cleanly after',
    db => { const f = mfile('0012'); const was = polShape(db);
      return psql(db, f).ok && polShape(db) === was && psql(db, downOf(f)).ok && psql(db, f).ok && polShape(db) === was; }],

  ['BN1', 'a profile with no switch or mark keeps the birth name its reader sends (0013)',
    db => psql(db, as(A, 'aal1', upN('Ana Maria Lopez'))).ok && nameOf(db) === 'Ana Maria Lopez'],
  ['BN2', 'saving turned off (a birthData revoke) empties the birth name the account held',
    db => psql(db, as(A, 'aal1', evAt(PN, 'birthData', 'revoke', `'2026-10-31T10:00:01Z'`))).ok && nameOf(db) === ''],
  ['BN3', 'an older build sending the birth name while saving is off is stored without it, without an error',
    db => psql(db, as(A, 'aal1', upN('Ana Maria Lopez'))).ok && nameOf(db) === ''],
  ['BN4', 'saving back on keeps it, Clear birth data and a mark for somebody else each empty it, and another reader never reads it',
    db => { const on = psql(db, as(A, 'aal1', evAt(PN, 'birthData', 'grant', `'2026-10-31T10:00:02Z'`) + upN('Ana Maria Lopez'))).ok && nameOf(db) === 'Ana Maria Lopez';
      const cl = psql(db, as(A, 'aal1', evAt(PN, 'birthCleared', 'grant', `'2026-10-31T10:00:03Z'`))).ok && nameOf(db) === '';
      const back = psql(db, as(A, 'aal1', evAt(PN, 'birthCleared', 'revoke', `'2026-10-31T10:00:04Z'`) + upN('Ana Maria Lopez'))).ok && nameOf(db) === 'Ana Maria Lopez';
      const b = psql(db, as(B, 'aal1', `select count(*) from public.profiles where birth_name is not null;`));
      const ot = psql(db, as(A, 'aal1', evAt(PN, 'forOther', 'grant', `'2026-10-31T10:00:05Z'`))).ok && nameOf(db) === '';
      return on && cl && back && b.ok && b.out === '0' && ot; }],
  ['BN5', 'the trigger function is closed to the API, and applying 0013 again, its DOWN, and 0013 again all apply',
    db => { const f = mfile('0013');
      return psql(db, `select bool_or(has_function_privilege(r, 'public.profiles_withhold_birth_name()', 'execute')) from unnest(array['anon', 'authenticated']) r;`).out === 'f'
        && psql(db, f).ok && psql(db, downOf(f)).ok
        && psql(db, `select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'birth_name';`).out === '0'
        && psql(db, f).ok && trigs(db, ['profiles_withhold_birth_name']) === '1'; }],

  ['PL1', 'with no relationships decision on the profile, a saved person sent for it lands nothing, without an error (0015: silence is not consent)',
    db => { psql(db, `insert into public.profiles (id, account_id, name) values ('${PP}', '${A}', 'Pat'), ('${PP2}', '${A}', 'Pip') on conflict (id) do nothing;`);
      return psql(db, as(A, 'aal1', person(PP, 'p0000000000000001', 'Rae'))).ok && peopleOf(db, PP) === '0'; }],
  ['PL2', 'after a relationships grant, the reader adds a saved person and reads it back as sent',
    db => psql(db, as(A, 'aal1', evAt(PP, 'relationships', 'grant', `'2026-10-31T11:00:01Z'`) + person(PP, 'p0000000000000001', 'Rae'))).ok
      && psql(db, as(A, 'aal1', `select record ->> 'display_name' from public.people where profile_id = '${PP}';`)).out === 'Rae'],
  ['PL3', 'the reader changes a record in place, with the server\'s time, and deletes one',
    db => { const ch = psql(db, as(A, 'aal1', person(PP, 'p0000000000000001', 'Rae Ann') + person(PP, 'p0000000000000002', 'Sol'))).ok;
      const del = psql(db, as(A, 'aal1', `delete from public.people where profile_id = '${PP}' and local_id = 'p0000000000000002';`)).ok;
      return ch && del && psql(db, `select count(*) || '|' || min(record ->> 'display_name') || '|' || bool_and(updated_at <= now()) from public.people where profile_id = '${PP}';`).out === '1|Rae Ann|true'; }],
  ['PL4', 'another reader reads none of them, and cannot add, change or delete one',
    db => { const r1 = psql(db, as(B, 'aal1', `select count(*) from public.people;`));
      const w = psql(db, as(B, 'aal1', person(PP, 'p00000000000000b1', 'Eve')));
      psql(db, as(B, 'aal1', `update public.people set record = '{}'::jsonb; delete from public.people;`));
      return r1.ok && r1.out === '0' && !w.ok && peopleOf(db, PP) === '1'
        && psql(db, `select record ->> 'display_name' from public.people where profile_id = '${PP}';`).out === 'Rae Ann'; }],
  ['PL5', 'a visitor with no session reads none and writes none',
    db => { const r1 = psql(db, as(null, null, `select count(*) from public.people;`)); const w = psql(db, as(null, null, person(PP, 'p00000000000000a1', 'Ann')));
      return (!r1.ok || r1.out === '0') && !w.ok && peopleOf(db, PP) === '1'; }],
  ['PL6', 'with a verified authenticator on the account, a password only (aal1) session reads none, and with the code it reads them',
    db => { psql(db, `insert into auth.mfa_factors (user_id, status) values ('${A}', 'verified');`);
      const x = psql(db, as(A, 'aal1', `select count(*) from public.people;`));
      const y = psql(db, as(A, 'aal1', person(PP, 'p00000000000000c1', 'Cy')));
      const z = psql(db, as(A, 'aal2', `select count(*) from public.people;`));
      psql(db, `delete from auth.mfa_factors;`);
      return (!x.ok || x.out === '0') && !y.ok && z.ok && z.out === '1'; }],
  ['PL7', 'a relationships revoke deletes every saved person of the profile, and one sent while it stands lands nothing',
    db => psql(db, as(A, 'aal1', evAt(PP, 'relationships', 'revoke', `'2026-10-31T11:00:02Z'`))).ok && peopleOf(db, PP) === '0'
      && psql(db, as(A, 'aal1', person(PP, 'p0000000000000001', 'Rae'))).ok && peopleOf(db, PP) === '0'],
  ['PL8', 'a profile marked for somebody else keeps no saved person even with relationships granted, and taken back it may again',
    db => { const g = psql(db, as(A, 'aal1', evAt(PP, 'relationships', 'grant', `'2026-10-31T11:00:03Z'`) + person(PP, 'p0000000000000001', 'Rae'))).ok && peopleOf(db, PP) === '1';
      const m = psql(db, as(A, 'aal1', evAt(PP, 'forOther', 'grant', `'2026-10-31T11:00:04Z'`))).ok && peopleOf(db, PP) === '0';
      const s = psql(db, as(A, 'aal1', person(PP, 'p0000000000000001', 'Rae'))).ok && peopleOf(db, PP) === '0';
      const t = psql(db, as(A, 'aal1', evAt(PP, 'forOther', 'revoke', `'2026-10-31T11:00:05Z'`) + person(PP, 'p0000000000000001', 'Rae'))).ok && peopleOf(db, PP) === '1';
      return g && m && s && t; }],
  ['PL9', 'deleting a profile everywhere deletes its saved people, and one sent for it afterwards lands nothing, without an error',
    db => { const g = psql(db, as(A, 'aal1', evAt(PP2, 'relationships', 'grant', `'2026-10-31T11:00:06Z'`) + person(PP2, 'p0000000000000009', 'Ida'))).ok && peopleOf(db, PP2) === '1';
      const d = psql(db, as(A, 'aal1', rec(A, PP2))).ok && peopleOf(db, PP2) === '0';
      const s = psql(db, as(A, 'aal1', person(PP2, 'p0000000000000009', 'Ida'))).ok && peopleOf(db, PP2) === '0';
      return g && d && s; }],
  ['PL10', 'four rules for authenticated, the rule closed to the API, and 0014 and 0015 apply again, undo by their DOWN, and apply cleanly after',
    db => { const f14 = mfile('0014'), f15 = mfile('0015');
      const rules = psql(db, `select string_agg(cmd || ':' || array_to_string(roles, ','), ' ' order by cmd) from pg_policies where tablename = 'people' and policyname like 'own people%';`).out
        === 'DELETE:authenticated INSERT:authenticated SELECT:authenticated UPDATE:authenticated';
      const closed = psql(db, `select count(*) from unnest(array['anon', 'authenticated']) r, unnest(array['public.people_consented(uuid)', 'public.people_withhold()', 'public.consent_people_apply()']) f(fn)
        where has_function_privilege(r, f.fn, 'execute');`).out === '0';
      const kept = peopleOf(db, PP);
      const again = psql(db, f14).ok && psql(db, f15).ok && peopleOf(db, PP) === kept && trigs(db, ['people_withhold', 'people_deleted_drop', 'consent_people_apply']) === '3';
      const d = psql(db, downOf(f15)).ok && psql(db, downOf(f14)).ok && psql(db, `select to_regclass('public.people') is null;`).out === 't'
        && trigs(db, ['people_withhold', 'people_deleted_drop', 'consent_people_apply']) === '0';
      /* The table's DOWN takes its two-step rule with it; mfa-policies.sql is run again after, as the README says. */
      const back = psql(db, f14).ok && psql(db, f15).ok && psql(db, mfa(true).replace(/array\[[\s\S]*?\] loop/, "array['people'] loop")).ok
        && psql(db, `select count(*) from pg_policies where tablename = 'people';`).out === '5';
      return rules && closed && again && d && back; }],

  ['CN1', 'the memory_type check admits a chart note and a tarot reading beside the four types it named, and still refuses a type nobody named (0016)',
    db => { const d = psql(db, `select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.memories'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%memory_type%';`).out;
      return ['journal', 'mood', 'practice_completion', 'stella_conversation', 'chart_note', 'tarot_reading'].every(t => d.includes(`'${t}'`))
        && !psql(db, as(A, 'aal1', note('x1', 'made_up'))).ok; }],
  ['CN2', 'a chart note for a saved profile keeps what its address resolved to (0016)',
    db => psql(db, as(A, 'aal1', note('n1', 'chart_note'))).ok && resolvedOf(db, 'n1') === '{"gate": 41, "line": 3}'],
  ['CN3', 'saving turned off empties "resolved" on the notes the account held, keeps their words and address, and touches no other memory type',
    db => { psql(db, as(A, 'aal1', note('j1', 'journal')));
      return psql(db, as(A, 'aal1', evAt(PQ, 'birthData', 'revoke', `'2026-10-31T12:00:01Z'`))).ok
        && resolvedOf(db, 'n1') === 'null' && resolvedOf(db, 'j1') === '{"gate": 41, "line": 3}'
        && psql(db, `select content ->> 'text' || '|' || (content ->> 'address') from public.memories where profile_id = '${PQ}' and local_id = 'n1';`).out === 'kept words|gate 41.3'; }],
  ['CN4', 'a note sent while saving is off is stored unresolved, without an error; saving back on keeps the next one; Clear birth data empties it again',
    db => { const off = psql(db, as(A, 'aal1', note('n2', 'chart_note'))).ok && resolvedOf(db, 'n2') === 'null';
      const on = psql(db, as(A, 'aal1', evAt(PQ, 'birthData', 'grant', `'2026-10-31T12:00:02Z'`) + note('n3', 'chart_note'))).ok && resolvedOf(db, 'n3') === '{"gate": 41, "line": 3}';
      const cl = psql(db, as(A, 'aal1', evAt(PQ, 'birthCleared', 'grant', `'2026-10-31T12:00:03Z'`))).ok && resolvedOf(db, 'n3') === 'null';
      return off && on && cl; }],
  ['CN5', 'a kept tarot reading lands as structured content and reads back card by card, for its reader only',
    db => { const t = `insert into public.memories (profile_id, local_id, memory_type, content, consent_required, created_at) values ('${PQ}', 't1', 'tarot_reading',
        '{"title": "Morning", "spread": "three", "cards": [{"name": "The Star", "position": "past", "reversed": false}, {"name": "Two of Cups", "position": "present", "reversed": true}], "passages": ["x"]}'::jsonb, 'journal', now());`;
      const w = psql(db, as(A, 'aal1', t)).ok;
      const a = psql(db, as(A, 'aal1', `select jsonb_array_length(content -> 'cards') || '|' || (content -> 'cards' -> 1 ->> 'reversed') from public.memories where local_id = 't1';`));
      const b = psql(db, as(B, 'aal1', `select count(*) from public.memories where local_id = 't1';`));
      return w && a.out === '2|true' && b.ok && b.out === '0'; }],
  ['CN6', 'both trigger functions are closed to the API, and 0016 applies again, undoes by its DOWN, and applies cleanly after',
    db => { const f = mfile('0016'), names = ['memories_notes_withhold', 'consent_notes_apply'];
      const closed = psql(db, `select count(*) from unnest(array['anon', 'authenticated']) r, unnest(array['public.memories_notes_withhold()', 'public.consent_notes_apply()']) f(fn)
        where has_function_privilege(r, f.fn, 'execute');`).out === '0';
      return closed && psql(db, f).ok && trigs(db, names) === '2' && psql(db, downOf(f)).ok && trigs(db, names) === '0'
        && psql(db, f).ok && trigs(db, names) === '2'; }],
];

/* owns_profile() runs as the caller, so it reads profiles under that table's
   own two-step rule, and a child table inherits the refusal without being on
   the list. That holds only while the function stays SECURITY INVOKER. The
   definer runs make it SECURITY DEFINER, as a later performance change might,
   to show the list entry is the wall that still stands then. */
const DEFINER = `alter function public.owns_profile(uuid) security definer;`;
function prepare(name, skipMig, mfaWith, definer, live) {
  const made = psql('postgres', `create database ${name};`);
  if (!made.ok) throw new Error('create database ' + name + ': ' + made.err);
  const mig = n => { const f = fs.readdirSync(path.join(repo, 'server', 'migrations')).filter(x => x.indexOf(n) === 0)[0];
    return [f, fs.readFileSync(path.join(repo, 'server', 'migrations', f), 'utf8')]; };
  const base = [['stub', STUB], ['cloud-schema v2', cloudV2()],
    ['support.sql', fs.readFileSync(path.join(repo, 'server', 'support.sql'), 'utf8')],
    ['oracle schema', fs.readFileSync(path.join(repo, 'server', 'oracle', 'schema.sql'), 'utf8')]];
  /* live: the drift, its rows, the five migrations the live project had,
     then (after) 0009 and the three it never had, in the order the README
     gives for it. */
  const steps = live
    ? base.concat([['drift', DRIFT], ['seed', SEED], ['legacy rows', LEGACY]],
        ['0004', '0005', '0006', '0007', '0008'].map(mig),
        live === 'after' ? ['0009', '0001', '0002', '0003', '0010', '0011', '0012', '0013', '0014', '0015', '0016'].map(mig) : [],
        [['mfa-policies', mfa(true)]])
    : base
    .concat(migrations(skipMig).map(s => [s.split('\n')[0].slice(3), s]))
    .concat([['mfa-policies', mfa(mfaWith)], ['seed', SEED]])
    .concat(definer ? [['definer', DEFINER]] : []);
  for (const [label, sql] of steps) {
    const x = psql(name, sql);
    if (!x.ok) throw new Error(name + ', ' + label + ': ' + x.err);
  }
}
function runCases(db) {
  return CASES.map(([id, desc, fn]) => {
    let pass = false;
    try { pass = !!fn(db); } catch (e) { pass = false; }
    return { id, desc, pass };
  });
}

const RUNS = [
  /* The live project as it was: every LV row red, and the shape broken
     enough that much else is red too, which is not what this run asserts. */
  { name: 'live_before', live: 'before', mustFail: ['LV1', 'LV2', 'LV3', 'LV4', 'LV5', 'LV6', 'LV7', 'LV8', 'LV9', 'LV10', 'LV11'] },
  /* The live project once 0009, 0001, 0002, 0003 and 0010 to 0016 have run: everything. */
  { name: 'live_after', live: 'after', mustFail: [] },
  { name: 'before', skip: ['0005', '0006', '0007', '0008', '0009', '0013', '0015', '0016'], mfa: false,
    mustFail: ['CV1', 'CV2', 'CV7', 'CV10b', 'CV13', 'CV14',
      'WH2', 'WH3', 'WH5', 'WH6', 'WH8', 'WH9', 'WH10', 'WH11', 'WH13', 'WH14', 'WH15', 'WH16', 'WH17', 'WH18',
      'DP1', 'DP2', 'DP3', 'DP4', 'DP5', 'DP6', 'DP7', 'DP8', 'DP9', 'DP10', 'DP11', 'DP12'] },
  /* Everything but assignment 2.3's five files: each of its rows that tests
     something those files add must go red. HR4 holds on the older rules too,
     which is its point: 0012 refuses nothing that was allowed. */
  { name: 'before_2_3', skip: ['0012', '0013', '0014', '0015', '0016'], mfa: true,
    mustFail: ['HR1', 'HR2', 'HR3', 'HR5', 'BN1', 'BN2', 'BN3', 'BN4', 'BN5',
      'PL1', 'PL2', 'PL3', 'PL4', 'PL5', 'PL6', 'PL7', 'PL8', 'PL9', 'PL10',
      'CN1', 'CN2', 'CN3', 'CN4', 'CN5', 'CN6'] },
  { name: 'nomfa', skip: [], mfa: false, mustFail: ['CV14'] },
  { name: 'nomfa_definer', skip: [], mfa: false, definer: true, mustFail: ['CV10a', 'CV14'] },
  { name: 'full_definer', skip: [], mfa: true, definer: true, mustFail: [] },
  { name: 'full_schema', skip: [], mfa: true, mustFail: [] },
];

let bad = 0;
for (const R of RUNS) {
  try { prepare(R.name, R.skip, R.mfa, R.definer, R.live); } catch (e) {
    console.log('check-hd-study-rls: NOT RUN, the schema would not apply: ' + e.message); process.exit(2);
  }
  const rows = runCases(R.name);
  const failed = rows.filter(x => !x.pass).map(x => x.id);
  const expected = R.mustFail.slice().sort().join(',');
  const got = failed.slice().sort().join(',');
  const ok = !R.mustFail.length ? failed.length === 0 : R.mustFail.every(id => failed.indexOf(id) !== -1);
  if (!ok) bad++;
  if (!quiet || !ok) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'} run ${R.name}: red ${got || 'none'}${!R.mustFail.length ? '' : ' (must include ' + expected + ')'}`);
    if (R.name === 'full_schema') rows.forEach(x => console.log(`    ${x.pass ? 'PASS' : 'FAIL'} ${x.id}  ${x.desc}`));
  }
}
console.log(`check-hd-study-rls: ${bad ? bad + ' of ' + RUNS.length + ' runs FAILED' : RUNS.length + ' of ' + RUNS.length + ' runs as expected, ' + CASES.length + ' of ' + CASES.length + ' cases on the full schema'}`);
process.exit(bad ? 1 : 0);
