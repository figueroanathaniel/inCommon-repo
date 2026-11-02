#!/usr/bin/env node
/* Local-only PostgREST contract test. IDs are allocated by PostgreSQL, not
   random UUIDs. Two concurrent HTTP clients use the same real user's session. */
'use strict';
const e=process.env;
if(!e.SUPABASE_URL || !e.SUPABASE_ANON_KEY || !e.SUPABASE_TEST_USER_A_JWT || !e.SUPABASE_TEST_USER_B_JWT) {
  console.error('NOT RUN: configure local URL, API key and two real test-user JWTs.');process.exit(2);
}
const origin=new URL(e.SUPABASE_URL).origin;
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
  console.error('NOT RUN: race probe requires a disposable localhost stack.');process.exit(2);
}
require('./lib/sync-race-suite.js')({origin,key:e.SUPABASE_ANON_KEY,a:e.SUPABASE_TEST_USER_A_JWT,b:e.SUPABASE_TEST_USER_B_JWT})
  .catch(()=>{process.exitCode=1;});
