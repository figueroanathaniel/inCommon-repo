#!/usr/bin/env node
/* Local-only provisioning runner; keeps all generated credentials in memory.
   Uses real GoTrue sessions. Admin privileges are only for local user setup
   and cleanup, never for the RLS/race assertions. */
'use strict';
const {spawnSync}=require('node:child_process'),{randomUUID}=require('node:crypto');
const path=require('node:path');
const cli=process.env.SUPABASE_CLI||'supabase',workdir=process.argv[2];
if(!workdir){console.error('Usage: node tools/run-sync-local.js <isolated CLI workdir>');process.exit(2);}
const status=spawnSync(cli,['status','--workdir',workdir,'-o','json'],{encoding:'utf8'});
if(status.status!==0){console.error('NOT RUN: local supabase status failed; start the disposable stack first.');process.exit(2);}
let s;try{s=JSON.parse(status.stdout);}catch{console.error('NOT RUN: invalid local status JSON.');process.exit(2);}
const base=s.API_URL||s.api_url,key=s.ANON_KEY||s.anon_key,admin=s.SERVICE_ROLE_KEY||s.service_role_key;
if(!base||!key||!admin||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base)){
 console.error('NOT RUN: expected localhost API and local credentials.');process.exit(2);
}
async function req(route,token,method='GET',body){
 const r=await fetch(base+route,{method,signal:AbortSignal.timeout(20000),headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const raw=await r.text();let d;try{d=raw?JSON.parse(raw):null;}catch{throw Error('Non-JSON response');}
 if(!r.ok)throw Error('Local fixture request HTTP '+r.status+', code '+(d?.code||'unknown'));return d;
}
(async()=>{
 const users=[],tokens=[];let failed=false;
 try{
  for(let i=0;i<2;i++){
   const email='sync-'+randomUUID()+'@example.test',password=randomUUID()+'aB1!';
   const user=await req('/auth/v1/admin/users',admin,'POST',{email,password,email_confirm:true});
   if(!user.id)throw Error('No local test-user id');users.push(user.id);
   const login=await req('/auth/v1/token?grant_type=password',key,'POST',{email,password});
   if(!login.access_token)throw Error('Local password login returned no session');tokens.push(login.access_token);
   await req('/rest/v1/accounts',login.access_token,'POST',{id:user.id});
  }
  const env={...process.env,SUPABASE_URL:base,SUPABASE_ANON_KEY:key,
   SUPABASE_TEST_USER_A_JWT:tokens[0],SUPABASE_TEST_USER_B_JWT:tokens[1]};
  console.log('Created two disposable Auth users and valid password sessions on localhost.');
  for(const name of ['test-concurrent-race.js','test-rls-integrity.js']){
   const r=spawnSync(process.execPath,[path.join(__dirname,name)],{env,stdio:'inherit'});
   if(r.status!==0)throw Error(name+' exit '+r.status);
  }
 }catch(err){failed=true;console.error('FAIL '+err.message);}
 finally{
  for(const id of users)try{await req('/auth/v1/admin/users/'+id,admin,'DELETE');}
  catch(err){failed=true;console.error('FAIL local-user cleanup '+id+': '+err.message);}
 }
 process.exitCode=failed?1:0;
})();
