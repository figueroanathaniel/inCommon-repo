'use strict';
const PRODUCTION_REF='lkzcybzhjjxdqetwwdrx';
module.exports=function validateTarget(raw,config) {
  if(config.purpose!=='incommon-sync-2.9.6-validation' || !/^[a-z]{20}$/.test(config.project_ref || '') || config.project_ref===PRODUCTION_REF)
    throw Error('Sandbox reference is not provisioned and pinned; production is forbidden.');
  const expected='https://'+config.project_ref+'.supabase.co';
  if(config.api_origin!==expected)throw Error('Pinned sandbox origin does not match its project reference.');
  const url=new URL(raw);
  if(url.origin!==expected || url.username || url.password || url.pathname!=='/' || url.search || url.hash)
    throw Error('Exact sandbox HTTPS origin required; credentials, paths, queries and fragments are forbidden.');
  return expected;
};
