'use strict';
const fs = require('node:fs');
const vm = require('node:vm');

/* Drive the real init() seam; do not infer a header from a version string. */
module.exports = function cloudWriteContract(sourcePath, createClient) {
  let options;
  const context = { supabase: { createClient(url, key, opts) {
    options = opts;
    return createClient ? createClient(url, key, opts) : {
      auth: { onAuthStateChange() {} }
    };
  } } };
  context.self = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: sourcePath });
  const storage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  const api = context.InCommonCloud;
  if (!api.init({ url: 'https://contract-test.invalid', anonKey: 'contract-test-key',
    core: {}, storage, pm: { _store() { return { profiles: [] }; }, getMemory() { return []; }, subscribe() {} } })) {
    throw Error('Cloud init did not configure a client');
  }
  const header = options && options.global && options.global.headers &&
    options.global.headers['X-InCommon-Write-Contract'];
  if (header !== 'v2-composite-upsert') throw Error('Source does not declare the expected write contract');
  return { header, version: api.VERSION, options, api };
};
