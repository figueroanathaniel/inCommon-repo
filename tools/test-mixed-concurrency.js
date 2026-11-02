#!/usr/bin/env node
/* Deterministic mixed-version request-shape simulation, exact sandbox only.
   Exit 0 means expected legacy failures were reproduced, not safe coexistence.
   Both request paths use the SAME authenticated owner to isolate conflict
   behavior from RLS. No server id or profile foreign key is invented. */
'use strict';
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const env=process.env;
const missing=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_TEST_USER_A_JWT'].filter(k=>!env[k]);
if(missing.length){console.error('NOT RUN: missing '+missing.join(', '));process.exit(2);}
let origin;
try {
 if(env.ALLOW_UNSAFE_TARGET)throw Error('ALLOW_UNSAFE_TARGET is not supported.');
 origin=require('./lib/remote-sandbox-target')(env.SUPABASE_URL,require('./fixtures/remote-sync-sandbox.json'));
}catch(e){console.error('TARGET BLOCKED: '+e.message);process.exit(1);}
const token=env.SUPABASE_TEST_USER_A_JWT;
async function request(route,method='GET',body,prefer){
 const response=await fetch(origin+route,{method,redirect:'error',signal:AbortSignal.timeout(20000),
  headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)})});
 const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{throw Error('Non-JSON response, HTTP '+response.status);}
 return {ok:response.ok,status:response.status,data};
}
function success(r,label){assert.ok(r.ok,label+': HTTP '+r.status+', code '+(r.data?.code||'unknown'));return r.data;}
(async()=>{
 const profile=randomUUID();let cleanup=false,failed=false;
 try {
  const user=success(await request('/auth/v1/user'),'Authenticate owner');assert.ok(user.id);
  cleanup=true;
  const created=success(await request('/rest/v1/profiles?select=id','POST',
   {id:profile,account_id:user.id,name:'Mixed-version disposable fixture',is_active:false},'return=representation'),'Create owner profile');
  assert.equal(created?.[0]?.id,profile);
  console.log('Validated real owner session and profile; target '+origin);
  for(const table of ['throughline_entries','oki_messages']){
   const endpoint='/rest/v1/'+table;
   const rows=(key)=>endpoint+'?profile_id=eq.'+profile+'&local_id=eq.'+key+'&select=id,payload';
   const upsert=(key,writer,conflict='profile_id,local_id',id)=>request(endpoint+'?on_conflict='+conflict+'&select=id,payload','POST',
    {profile_id:profile,local_id:key,payload:{writer},...(id===undefined?{}:{id})},'resolution=merge-duplicates,return=representation');
   console.log('TABLE '+table);
   const key='stale-read';
   const preflight=success(await request(rows(key)),'Legacy preflight');assert.deepEqual(preflight,[]);
   console.log('STEP 1 legacy preflight: 0 matching rows');
   const modern=await upsert(key,'modern');const modernRows=success(modern,'Modern write');assert.equal(modernRows.length,1);
   console.log('STEP 2 modern composite upsert: HTTP '+modern.status);
   const stale=await upsert(key,'stale-legacy','id');
   assert.equal(stale.status,409,'Legacy stale write must conflict on composite key');assert.equal(stale.data?.code,'23505');
   console.log('STEP 3 legacy stale upsert on id: HTTP '+stale.status+', PostgreSQL '+stale.data.code);
   console.log('Database message: '+stale.data.message);
   const after=success(await request(rows(key)),'Audit winner');
   assert.equal(after.length,1);assert.equal(after[0].id,modernRows[0].id);assert.equal(after[0].payload.writer,'modern');
   console.log('PASS modern row retained; no duplicate after rejected legacy write');
   const explicit=await upsert(key,'legacy-matched-id','id',after[0].id);
   assert.equal(explicit.status,400);assert.equal(explicit.data?.code,'428C9');
   console.log('MATCHED-ID legacy upsert: HTTP '+explicit.status+', PostgreSQL '+explicit.data.code);
   console.log('Database message: '+explicit.data.message);
   assert.equal(success(await request(rows(key)),'Verify unchanged after identity rejection')[0].payload.writer,'modern');
   const omitted=await upsert('uncontested-legacy','legacy-no-id','id');
   assert.ok(success(omitted,'Legacy insert with omitted identity')[0]?.id!=null);
   console.log('CONTROL legacy insert WITHOUT server id: HTTP '+omitted.status+', allocated identity successfully');
   const legacyKey='legacy-pair';
   const reads=await Promise.all([request(rows(legacyKey)),request(rows(legacyKey))]);
   for(const r of reads)assert.deepEqual(success(r,'Twin legacy preflight'),[]);
   const pair=await Promise.all([upsert(legacyKey,'old-A','id'),upsert(legacyKey,'old-B','id')]);
   assert.equal(pair.filter(r=>r.ok).length,1);
   const loser=pair.find(r=>!r.ok);assert.equal(loser.status,409);assert.equal(loser.data?.code,'23505');
   assert.equal(success(await request(rows(legacyKey)),'Legacy pair count').length,1);
   console.log('LEGACY/LEGACY race: one success, one HTTP 409 / 23505, one stored row');
   const newPair=await Promise.all([upsert('modern-pair','new-A'),upsert('modern-pair','new-B')]);
   const ids=newPair.map(r=>success(r,'Twin modern upsert')[0]?.id);assert.ok(ids[0]!=null);assert.equal(ids[0],ids[1]);
   assert.equal(success(await request(rows('modern-pair')),'Modern pair count').length,1);
   console.log('MODERN/MODERN race: both succeed, same server id, one stored row');
  }
  console.log('PASS expected mixed-version failure matrix reproduced on both tables; coexistence is NOT safe.');
 }catch(e){failed=true;console.error('FAIL '+e.message);}
 finally {
  if(cleanup)try {
   success(await request('/rest/v1/profiles?id=eq.'+profile,'DELETE'),'Clean fixture profile');
   assert.deepEqual(success(await request('/rest/v1/profiles?id=eq.'+profile+'&select=id'),'Verify cleanup'),[]);
   console.log('PASS fixture profile and cascading rows cleaned up');
  }catch(e){failed=true;console.error('FAIL cleanup '+profile+': '+e.message);}
 }
 process.exitCode=failed?1:0;
})();
