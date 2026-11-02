#!/usr/bin/env node
/* Explicit opt-in integration probe against the real profile contract.
   Requires two valid, disposable test-user sessions. Never accepts mock JWTs
   or a service-role fallback. No request failure counts as an isolation pass. */
'use strict';
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const env = process.env;
const required = ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_TEST_USER_A_JWT','SUPABASE_TEST_USER_B_JWT'];
const missing = required.filter(k => !env[k]);
if (missing.length) {
  console.error('NOT RUN: missing ' + missing.join(', '));
  process.exit(2);
}
const origin = new URL(env.SUPABASE_URL).origin;
if (!origin.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin)) {
  console.error('NOT RUN: use HTTPS or a local Supabase instance.'); process.exit(2);
}
async function request(route, token, method='GET', body, prefer) {
  const response = await fetch(origin + route, {
    method, signal: AbortSignal.timeout(20000),
    headers: {apikey:env.SUPABASE_ANON_KEY, ...(token ? {Authorization:'Bearer '+token} : {}),
      'Content-Type':'application/json', ...(prefer ? {Prefer:prefer} : {})},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  const raw = await response.text();
  let data; try {data=raw ? JSON.parse(raw) : null;} catch {throw Error('Non-JSON response; isolation not established');}
  return {ok:response.ok,status:response.status,data};
}
function success(result, label) {
  assert.ok(result.ok, label + ': HTTP ' + result.status + ', code ' + (result.data?.code || 'unknown'));
  return result.data;
}
async function user(token) {
  const data=success(await request('/auth/v1/user',token),'Validate test session');
  assert.ok(data.id,'Session has no user id'); return data.id;
}
const profileRoute=id=>'/rest/v1/profiles?id=eq.'+id+'&select=id,account_id,name';
let passes=0;
function pass(label) {passes++; console.log('PASS '+label);}
(async()=>{
  const a=env.SUPABASE_TEST_USER_A_JWT, b=env.SUPABASE_TEST_USER_B_JWT;
  const fixtures=[]; let failed=false;
  try {
    const aid=await user(a),bid=await user(b);
    assert.notEqual(aid,bid,'Two distinct test users are required');
    console.log('Validated two distinct real test sessions.');
    for(const [owner,token] of [[aid,a],[bid,b]]) {
      const id=randomUUID(); fixtures.push({id,token});
      const data=success(await request('/rest/v1/profiles?select=id,account_id,name',token,'POST',
        {id,account_id:owner,name:'RLS disposable fixture',is_active:false,is_default:false},'return=representation'),'Seed owner fixture');
      assert.equal(data?.[0]?.id,id,'Seed did not create the requested fixture');
      const own=success(await request(profileRoute(id),token),'Owner positive read');
      assert.equal(own.length,1); assert.equal(own[0].account_id,owner);
    }
    pass('Both owners can create and read their own fixtures');
    const id=fixtures[0].id;
    const replay=success(await request('/rest/v1/profiles?on_conflict=id&select=id',a,'POST',
      {id,account_id:aid,name:'RLS fixture updated',is_active:false,is_default:false},'resolution=merge-duplicates,return=representation'),'Owner idempotent upsert');
    assert.equal(replay?.[0]?.id,id);
    const own=success(await request(profileRoute(id),a),'Verify upsert');
    assert.equal(own.length,1); assert.equal(own[0].name,'RLS fixture updated');
    pass('Profile replay updates the same UUID row');
    for(const [label,token] of [['User B',b],['Anonymous',env.SUPABASE_ANON_KEY.startsWith('eyJ') ? env.SUPABASE_ANON_KEY : null]]) {
      const rows=success(await request(profileRoute(id),token),label+' cross-tenant read');
      assert.deepEqual(rows,[]); pass(label+' cannot read user A fixture');
    }
    for(const [method,body] of [['PATCH',{name:'Cross-tenant change'}],['DELETE',undefined]]) {
      const rows=success(await request(profileRoute(id),b,method,body,'return=representation'),'Cross-tenant '+method);
      assert.deepEqual(rows,[]);
      const remaining=success(await request(profileRoute(id),a),'Owner checks untouched fixture');
      assert.equal(remaining.length,1); assert.equal(remaining[0].name,'RLS fixture updated');
      pass('User B '+method+' touches no user A rows');
    }
    const reassigned=await request(profileRoute(id),a,'PATCH',{account_id:bid},'return=representation');
    assert.equal(reassigned.status,403,'Owner must not transfer a row to another account');
    assert.equal(reassigned.data?.code,'42501');
    assert.equal(success(await request(profileRoute(id),a),'Verify unchanged ownership')[0]?.account_id,aid);
    pass('Owner cannot reassign a profile to another account');
    const forgedId=randomUUID(); fixtures.push({id:forgedId,token:a});
    const forged=await request('/rest/v1/profiles',b,'POST',
      {id:forgedId,account_id:aid,name:'RLS forbidden fixture',is_active:false,is_default:false});
    assert.equal(forged.status,403,'Expected authenticated RLS denial, not an auth/network error');
    assert.equal(forged.data?.code,'42501','Expected Postgres insufficient-privilege denial');
    assert.deepEqual(success(await request(profileRoute(forgedId),a),'Check rejected insert'),[]);
    pass('Cross-owner INSERT is denied by PostgreSQL');
    console.log('PASS '+passes+' integration checks; profile isolation and UUID upsert only.');
  } catch(e) {failed=true;console.error('FAIL: '+e.message);}
  finally {
    for(const fixture of fixtures) {
      try {
        success(await request(profileRoute(fixture.id),fixture.token,'DELETE',undefined,'return=representation'),'Clean fixture');
        assert.deepEqual(success(await request(profileRoute(fixture.id),fixture.token),'Verify cleanup'),[]);
      } catch(e) {failed=true;console.error('FAIL cleanup for fixture '+fixture.id+': '+e.message);}
    }
  }
  if(failed) process.exitCode=1;
})();
