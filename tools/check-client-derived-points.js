#!/usr/bin/env node
/* Independent Swiss/JPL full-kernel geometric references, never fit samples.
 * Legacy compressed/apparent comparisons are also retained as diagnostics.
 */
'use strict';
const assert=require('assert');
const {calculator,separation}=require('./lib/lift-client-calculator.js');
const L=require('../app/lunar-mean-points.js'),J=require('../app/jpl-derived-points.js');
const app=calculator(['RAD'],['norm360','lonRaw','meanLunarNodeOf','planetaryNodeOf','lilithMeanOf','expandedLonAt'],{LunarMeanPoints:L,JPLDerivedPoints:J});
const ref=require('./fixtures/precision-point-holdout.json');
assert.strictEqual(ref.ephemerisMode,'direct JPL DE441');
assert(ref.rows.length>=2050,'Missing independent century/date coverage');
const worst={meanApogee:0,meanNode:0,apogee:0};
const names=Object.keys(ref.rows[0].nodes);for(const n of names)worst[n]=0;
const check=(name,got,expected)=>{const e=separation(got,expected)*3600;worst[name]=Math.max(worst[name],e);assert(e<=1,`${name}: ${e} arcseconds`);};
const context={sun:0,moon:0};
for(const r of ref.rows){
 check('meanApogee',app.expandedLonAt({id:'lilithMean'},r.t,context).lon,r.meanApogee);
 check('apogee',app.expandedLonAt({id:'lilithOsc'},r.t,context).lon,r.apogee);
 check('meanNode',app.lonRaw('North Node',r.t),r.meanNode);
 assert(separation(app.lonRaw('South Node',r.t),(r.meanNode+180)%360)*3600<=1);
 assert(separation(app.expandedLonAt({id:'selena'},r.t,context).lon,(r.meanApogee+180)%360)*3600<=1);
 for(const n of names)check(n,app.expandedLonAt({id:n.toLowerCase()+'Node'},r.t,context).lon,r.nodes[n]);
}
for(const t of [NaN,Infinity,L.minT-1e-5,L.maxT+1e-5]){
 assert.strictEqual(L.meanNode(t),null);assert.strictEqual(L.meanApogee(t),null);
 assert.strictEqual(J.apogee(t),null);for(const n of names)assert.strictEqual(J.node(n,t),null);
 for(const id of ['lilithMean','lilithOsc','selena',...names.map(n=>n.toLowerCase()+'Node')])assert.strictEqual(app.expandedLonAt({id},t,context).status,'unavailable');
}
const missing=calculator([],['norm360','lilithMeanOf','planetaryNodeOf','expandedLonAt'],{});
for(const id of ['lilithMean','lilithOsc','selena','mercuryNode'])assert.strictEqual(missing.expandedLonAt({id},0,context).status,'unavailable');
console.log(`${ref.rows.length} independent dates; 8 geometric planetary nodes, both lunar nodes, mean/osculating Lilith and opposite-apogee Selena; all within 1 arcsecond.`);
console.log('Worst arcseconds: '+JSON.stringify(worst));
const legacy=require('./fixtures/precision-point-swiss-compressed.json').rows;
const legacyWorst={apogee:0};for(const n of names)legacyWorst[n]=0;
for(const r of legacy){legacyWorst.apogee=Math.max(legacyWorst.apogee,separation(J.apogee(r.t),r.apogee)*3600);for(const n of names)legacyWorst[n]=Math.max(legacyWorst[n],separation(J.node(n,r.t),r.nodes[n])*3600);}
console.log('DIAGNOSTIC previous Swiss compressed/apparent convention, arcseconds: '+JSON.stringify(legacyWorst));
console.log('These old convention/source differences are retained, not counted as geometric-reference passes. No extrapolation or mean-for-osculating substitution.');
