#!/usr/bin/env node
/* Exact, repository-pinned sandbox only. No substring or unsafe override.
   Real Auth sessions and successful owner seeding are mandatory. */
'use strict';
const env=process.env;
const required=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_TEST_USER_A_JWT','SUPABASE_TEST_USER_B_JWT'];
const missing=required.filter(k=>!env[k]);
if(missing.length){console.error('NOT RUN: missing '+missing.join(', '));process.exit(2);}
let origin;
try {
 if(env.ALLOW_UNSAFE_TARGET)throw Error('ALLOW_UNSAFE_TARGET is not supported.');
 origin=require('./lib/remote-sandbox-target.js')(env.SUPABASE_URL,require('./fixtures/remote-sync-sandbox.json'));
} catch(error){console.error('TARGET BLOCKED: '+error.message);process.exit(1);}
console.log('Testing exact sandbox origin: '+origin);
require('./lib/sync-race-suite.js')({origin,key:env.SUPABASE_ANON_KEY,
 a:env.SUPABASE_TEST_USER_A_JWT,b:env.SUPABASE_TEST_USER_B_JWT})
 .catch(()=>{process.exitCode=1;});
