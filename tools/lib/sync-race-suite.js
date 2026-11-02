/* Shared assertions. Only guarded local/remote entrypoints choose a target. */
'use strict';
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
module.exports=async function runRaceSuite({origin,key,a,b}) {
async function call(route,token,method='GET',body,prefer) {
  const r=await fetch(origin+route,{method,signal:AbortSignal.timeout(20000),redirect:'error',headers:{apikey:key,
    Authorization:'Bearer '+token,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
  const raw=await r.text();let data;try{data=raw?JSON.parse(raw):null;}catch{throw Error('Invalid JSON, HTTP '+r.status);}
  return {ok:r.ok,status:r.status,data};
}
function ok(r,label){assert.ok(r.ok,label+': HTTP '+r.status+', code '+(r.data?.code||'unknown'));return r.data;}

return (async()=>{
  const profile=randomUUID();let failed=false,seeded=false;
  try {
    const ua=ok(await call('/auth/v1/user',a),'User A authentication');
    const ub=ok(await call('/auth/v1/user',b),'User B authentication');
    assert.ok(ua.id&&ub.id);assert.notEqual(ua.id,ub.id);
    seeded=true;
    const created=ok(await call('/rest/v1/profiles?select=id',a,'POST',
      {id:profile,account_id:ua.id,name:'Disposable sync race',is_active:false},'return=representation'),'Seed profile');
    assert.equal(created?.[0]?.id,profile);
    for(const table of ['throughline_entries','oki_messages']) {
      for(let i=0;i<10;i++) {
        const key='race-'+i;
        const route='/rest/v1/'+table+'?on_conflict=profile_id,local_id&select=id,payload';
        const body={profile_id:profile,local_id:key,created_at:'2026-10-01T00:00:00Z'};
        const responses=await Promise.all([
          call(route,a,'POST',{...body,payload:{writer:'A'}},'resolution=merge-duplicates,return=representation'),
          call(route,a,'POST',{...body,payload:{writer:'B'}},'resolution=merge-duplicates,return=representation')]);
        const ids=responses.map((r,n)=>ok(r,table+' concurrent writer '+n)?.[0]?.id);
        assert.ok(ids[0]!=null);assert.equal(ids[0],ids[1]);
        const query='/rest/v1/'+table+'?profile_id=eq.'+profile+'&local_id=eq.'+key+'&select=id,payload';
        const rows=ok(await call(query,a),table+' count after race');assert.equal(rows.length,1);
        assert.ok(['A','B'].includes(rows[0].payload.writer));
        const replay=ok(await call(route,a,'POST',{...body,payload:{writer:'edited'}},'resolution=merge-duplicates,return=representation'),'Replay');
        assert.equal(replay[0].id,ids[0]);assert.equal(replay[0].payload.writer,'edited');
        assert.deepEqual(ok(await call(query,b),'Cross-tenant read'),[]);
      }
      console.log('PASS '+table+': 10 races, one stable row per key; replay and tenant isolation.');
      const legacy={profile_id:profile,local_id:null,payload:{legacy:true}};
      for(let i=0;i<2;i++) ok(await call('/rest/v1/'+table,a,'POST',legacy),'Legacy insert');
      const legacyRows=ok(await call('/rest/v1/'+table+'?profile_id=eq.'+profile+'&local_id=is.null&select=id',a),'Legacy count');
      assert.equal(legacyRows.length,2);console.log('PASS '+table+': two NULL-key legacy rows preserved.');
      const bad=await call('/rest/v1/'+table,b,'POST',{...legacy,local_id:'forbidden'});
      assert.equal(bad.status,403);assert.equal(bad.data?.code,'42501');
      console.log('PASS '+table+': cross-owner insert rejected with PostgreSQL 42501.');
    }
  } catch(err){failed=true;console.error('FAIL '+err.message);}
  finally {
    if(seeded)try {
      ok(await call('/rest/v1/profiles?id=eq.'+profile,a,'DELETE'),'Cleanup profile');
      assert.deepEqual(ok(await call('/rest/v1/profiles?id=eq.'+profile+'&select=id',a),'Verify cleanup'),[]);
    }catch(err){failed=true;console.error('FAIL cleanup fixture '+profile+': '+err.message);}
  }
  if(failed)throw Error('Concurrent race suite failed; see failures above.');
  console.log('PASS concurrent race suite, both tables.');
})();

};
