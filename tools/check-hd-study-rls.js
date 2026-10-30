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
 * It runs the cases five times, in five databases:
 *   before          without 0005 and without chart_versions in the two-step
 *                   list: the table must be unreachable, so the reader's own
 *                   writes fail;
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

/* Each case: a name, what it checks, and a function of the database that
   answers true when the rule holds. The cases run in order on one database,
   so a later case sees what an earlier one wrote, as a reader would. */
const CASES = [
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
  ['CV15', 'applying 0004 and 0005 again changes nothing, the DOWN of 0005 removes its rules and 0004 its table, and both apply cleanly after',
    db => {
      const file = n => fs.readFileSync(path.join(repo, 'server', 'migrations', n), 'utf8');
      const down = n => file(n).split('\n').filter(l => /^--   \S/.test(l)).map(l => l.slice(5)).join('\n');
      const pol = () => psql(db, `select count(*) from pg_policies where tablename = 'chart_versions' and policyname like 'own chart versions%';`).out;
      const again = psql(db, file('0004-chart-versions.sql')).ok && psql(db, file('0005-chart-versions-policies.sql')).ok && pol() === '3';
      const d5 = psql(db, down('0005-chart-versions-policies.sql')).ok && pol() === '0';
      const d4 = psql(db, down('0004-chart-versions.sql')).ok && psql(db, `select to_regclass('public.chart_versions') is null;`).out === 't';
      const back = psql(db, file('0004-chart-versions.sql')).ok && psql(db, file('0005-chart-versions-policies.sql')).ok && pol() === '3';
      return again && d5 && d4 && back;
    }],
];

/* owns_profile() runs as the caller, so it reads profiles under that table's
   own two-step rule, and a child table inherits the refusal without being on
   the list. That holds only while the function stays SECURITY INVOKER. The
   definer runs make it SECURITY DEFINER, as a later performance change might,
   to show the list entry is the wall that still stands then. */
const DEFINER = `alter function public.owns_profile(uuid) security definer;`;
function prepare(name, skipMig, mfaWith, definer) {
  const made = psql('postgres', `create database ${name};`);
  if (!made.ok) throw new Error('create database ' + name + ': ' + made.err);
  const steps = [['stub', STUB], ['cloud-schema v2', cloudV2()],
    ['support.sql', fs.readFileSync(path.join(repo, 'server', 'support.sql'), 'utf8')]]
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
  { name: 'before', skip: ['0005'], mfa: false,
    mustFail: ['CV1', 'CV2', 'CV7', 'CV10b', 'CV13', 'CV14'] },
  { name: 'nomfa', skip: [], mfa: false, mustFail: ['CV14'] },
  { name: 'nomfa_definer', skip: [], mfa: false, definer: true, mustFail: ['CV10a', 'CV14'] },
  { name: 'full_definer', skip: [], mfa: true, definer: true, mustFail: [] },
  { name: 'full_schema', skip: [], mfa: true, mustFail: [] },
];

let bad = 0;
for (const R of RUNS) {
  try { prepare(R.name, R.skip, R.mfa, R.definer); } catch (e) {
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
