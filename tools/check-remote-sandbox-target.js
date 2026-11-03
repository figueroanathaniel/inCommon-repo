#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
const validate=require('./lib/remote-sandbox-target'),config=require('./fixtures/remote-sync-sandbox.json');
assert.equal(validate(config.api_origin,config),config.api_origin);
for(const url of ['https://lkzcybzhjjxdqetwwdrx.supabase.co',
  'https://evil.test/?ref='+config.project_ref,config.api_origin+'.evil.test',
  config.api_origin+'/?ref='+config.project_ref,config.api_origin+'/rest/v1',
  config.api_origin.replace('https:','http:'),
  'https://user:password@'+config.project_ref+'.supabase.co'])assert.throws(()=>validate(url,config));
assert.throws(()=>validate('https://lkzcybzhjjxdqetwwdrx.supabase.co',{
  ...config,project_ref:'lkzcybzhjjxdqetwwdrx',api_origin:'https://lkzcybzhjjxdqetwwdrx.supabase.co'}));
assert.throws(()=>validate(config.api_origin,{...config,project_ref:null}));
for(const script of ['test-remote-sandbox-race.js','test-mixed-concurrency.js','test-contract-gate.mjs']) {
const run=spawnSync(process.execPath,[path.join(__dirname,script)],{
  env:{...process.env,SUPABASE_URL:config.api_origin,SUPABASE_ANON_KEY:'guard-only-not-a-key',
    SUPABASE_TEST_USER_A_JWT:'guard-only-not-a-token',SUPABASE_TEST_USER_B_JWT:'guard-only-not-a-token',ALLOW_UNSAFE_TARGET:'true'},encoding:'utf8'});
assert.equal(run.status,1);assert.match(run.stderr,/ALLOW_UNSAFE_TARGET is not supported/);
}
console.log('PASS exact target guard, seven invalid URLs, production pin denial, missing pin, and unsafe override denial.');
