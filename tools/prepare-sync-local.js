#!/usr/bin/env node
/* Bootstrap ONLY a fresh, named disposable CLI stack from canonical SQL.
   No remote DB URL is accepted. The full project's policies stay intact. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),workdir=process.argv[2];
if(!workdir){console.error('Usage: node tools/prepare-sync-local.js <isolated CLI workdir>');process.exit(2);}
const config=fs.readFileSync(path.join(workdir,'supabase/config.toml'),'utf8');
if(!/^project_id = "incommon-sync-local"$/m.test(config))throw Error('Requires project_id incommon-sync-local');
const dockerEnv={...process.env};
for(const k of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete dockerEnv[k];
function sql(text){
  const r=spawnSync('docker',['--host=unix:///var/run/docker.sock','exec','-i','supabase_db_incommon-sync-local',
    'psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-X','-q','-f','-'],{env:dockerEnv,input:text,encoding:'utf8',maxBuffer:8e6});
  if(r.status!==0)throw Error((r.stderr||r.error?.message||'Local PostgreSQL unavailable').slice(-2000));
}
const read=p=>fs.readFileSync(path.join(repo,p),'utf8');
sql("do $fresh$ begin if to_regclass('public.profiles') is not null then raise exception 'Use a fresh disposable stack, never reset an existing project here'; end if; end $fresh$;");
const base=read('server/cloud-schema.sql');const at=base.indexOf('-- ---------- v2 ----------');
if(at<0)throw Error('No canonical v2 schema');
sql(base.slice(at));
for(const f of ['server/support.sql','server/oracle/schema.sql','server/store/schema.sql'])sql(read(f));
for(const f of fs.readdirSync(path.join(repo,'server/migrations')).filter(x=>/^\d{4}-.*\.sql$/.test(x)).sort())sql(read('server/migrations/'+f));
sql(read('server/mfa-policies.sql'));
const migration=fs.readdirSync(path.join(repo,'supabase/migrations')).filter(x=>/_composite_deduplication\.sql$/.test(x));
if(migration.length!==1)throw Error('Expected one composite migration');
sql(read('supabase/migrations/'+migration[0]));
sql(read('supabase/migrations/'+migration[0])); // idempotency
sql("notify pgrst, 'reload schema';");
console.log('PASS local canonical schema, all server migrations and MFA policies; composite migration applied twice.');
