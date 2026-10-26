#!/usr/bin/env node
'use strict';
const assert=require('assert');
const C=require('../app/comet-integrated-jpl.js');
const {calculator,separation}=require('./lib/lift-client-calculator.js');
const app=calculator([],['cometLonOf','expandedLonAt'],{CometIntegratedJPL:C});
const fixture=require('./fixtures/comet-integrations-reference.json');
let total=0;
for(const id of ['halley','halebopp']){
 const rows=fixture.bodies[id].rows;assert.strictEqual(rows.length,id==='halley'?39387:22283,'Independent unique comet reference count changed');
 assert(Number.isFinite(C.lon(id,C.minT))&&Number.isFinite(C.lon(id,C.maxT)));
 assert.strictEqual(new Set(rows.map(r=>r[0])).size,rows.length,'Duplicate comet reference epochs');
 let max=0,at=null,uncertaintyUnavailable=0;
 for(const [t,reference,sigma3] of rows){
  const got=app.expandedLonAt({id},t,{});assert.strictEqual(got.status,'ok');
  const error=separation(got.lon,reference)*3600;
  if(error>max){max=error;at=t;}assert(error<=0.9,`${id} t=${t}: ${error} arcseconds`);
  if(sigma3===null)uncertaintyUnavailable++;else assert(Number.isFinite(sigma3)&&sigma3>=0);
 }
 for(const t of [NaN,Infinity,C.minT-1e-5,C.maxT+1e-5])assert.strictEqual(app.expandedLonAt({id},t,{}).status,'unavailable');
 console.log(`${id}: ${rows.length} off-grid Horizons references; worst ${max.toFixed(6)} arcseconds at J2000 UT day ${at}; ${uncertaintyUnavailable} without reported formal uncertainty.`);
 assert(max<=C.sampledWorstArcsec(id)+1e-7);total+=rows.length;
}
assert.strictEqual(C.lon('unknown',0),null);
const missing=calculator([],['cometLonOf','expandedLonAt'],{});
for(const id of ['halley','halebopp'])assert.strictEqual(missing.expandedLonAt({id},0,{}).status,'unavailable');
console.log(`${total} comparisons; no legacy two-body fallback or out-of-span extrapolation. Orbit uncertainty is separate from interpolation error.`);
