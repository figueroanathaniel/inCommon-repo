#!/usr/bin/env python3
"""Build compact integrated comet tables; validate against unfitted Horizons times."""
import json,pathlib,sys,math
root=pathlib.Path(__file__).resolve().parent.parent;cache=pathlib.Path(sys.argv[1]);bodies={};fixtures={};summary={}
def sample(s,t):
 k=math.floor((t-s['start'])/s['step']);u=(t-s['start'])/s['step']-k;v=s['values']
 if k<1 or k+2>=len(v):return None
 p1=v[k];near=lambda a,b:a-round((a-b)/360)*360;p0=near(v[k-1],p1);p2=near(v[k+1],p1);p3=near(v[k+2],p2)
 return (p0*(-u*(u-1)*(u-2)/6)+p1*((u+1)*(u-1)*(u-2)/2)+p2*(-(u+1)*u*(u-2)/2)+p3*((u+1)*u*(u-1)/6))%360
def predict(series,t):
 for s in sorted(series,key=lambda s:s['step']):
  got=sample(s,t)
  if got is not None:return got
 return None
for body in ('halley','halebopp'):
 series=[];tests=[];sources=[]
 for p in sorted(cache.glob(body+'_*.json')):
  d=json.loads(p.read_text());label=p.stem[len(body)+1:];rows=d['rows']
  if label.startswith(('coarse','near','fast')):
   number,unit=d['parameters']['STEP_SIZE'].strip("'").split();step=float(number)*({'d':1,'h':1/24,'m':1/1440}[unit]);series.append({'start':rows[0][0],'step':step,'values':[r[1] for r in rows]});sources.append({'label':label,'parameters':d['parameters'],'header':d['header']})
  else:tests.extend(rows)
 # Keep unique times genuinely off the selected composite grid. A coarse
 # holdout can coincide with a finer patch's support point. Do not count it.
 unique={}
 for row in tests:
  t=row[0]
  if not -36524.5<=t<=36524.5:continue
  chosen=next((s for s in sorted(series,key=lambda s:s['step']) if sample(s,t) is not None),None)
  if chosen is None:raise RuntimeError('Missing grid coverage')
  u=(t-chosen['start'])/chosen['step']
  if abs(u-round(u))<1e-6:continue
  if t in unique and abs((row[1]-unique[t][1]+180)%360-180)>1e-5:raise RuntimeError('Inconsistent duplicate Horizons result')
  unique[t]=row
 tests=list(unique.values())
 worst=(0,None);count=0;outliers=[]
 for t,expected,sigma in tests:
  if t< -36524.5 or t>36524.5:continue
  got=predict(series,t)
  if got is None:raise RuntimeError('No comet interpolation at '+str(t))
  error=abs((got-expected+180)%360-180)*3600;count+=1
  if error>worst[0]:worst=(error,t)
  if error>0.9:outliers.append((error,t))
 bodies[body]={'series':series,'source':'NASA/JPL Horizons observer quantity 31, Earth geocenter, apparent tropical ecliptic of date','sampledWorstArcsec':worst[0]}
 fixtures[body]={'sources':sources,'rows':[r for r in tests if -36524.5<=r[0]<=36524.5]}
 if outliers:print(body,'largest misses',sorted(outliers,reverse=True)[:20],flush=True)
 summary[body]={'comparisons':count,'worstArcsec':worst[0],'worstT':worst[1]}
print(json.dumps(summary,indent=2),flush=True)
if max(x['worstArcsec'] for x in summary.values())>0.9:raise SystemExit('Refine the comet grid before publishing')
text='''/*! Integrated comet observer longitudes. Generated and independently
 * checked by tools/build-comet-integrations.py. Interpolation agreement
 * does not bound orbital uncertainty. No out-of-span extrapolation.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CometIntegratedJPL=factory();})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const data = '''+json.dumps(bodies,separators=(',',':'))+''';
const minT=-36524.5,maxT=36524.5,norm=x=>((x%360)+360)%360;
function sample(s,t){
 const k=Math.floor((t-s.start)/s.step),u=(t-s.start)/s.step-k,v=s.values;
 if(k<1||k+2>=v.length)return null;
 const p1=v[k],near=(a,b)=>a-Math.round((a-b)/360)*360;
 const p0=near(v[k-1],p1),p2=near(v[k+1],p1),p3=near(v[k+2],p2);
 return norm(p0*(-u*(u-1)*(u-2)/6)+p1*((u+1)*(u-1)*(u-2)/2)+p2*(-(u+1)*u*(u-2)/2)+p3*((u+1)*u*(u-1)/6));
}
for(const b of Object.values(data))b.series.sort((a,b)=>a.step-b.step);
function lon(id,t){
 if(!Number.isFinite(t)||t<minT||t>maxT||!data[id])return null;
 for(const s of data[id].series){const value=sample(s,t);if(value!==null)return value;}
 return null;
}
return Object.freeze({lon,minT,maxT,source:id=>data[id]?data[id].source:null,sampledWorstArcsec:id=>data[id]?data[id].sampledWorstArcsec:null});
});
'''
(root/'app/comet-integrated-jpl.js').write_text(text)
(root/'tools/fixtures/comet-integrations-reference.json').write_text(json.dumps({'source':'Independent Horizons off-grid checks; not used to fit the runtime tables','bodies':fixtures},separators=(',',':'))+'\n')
(root/'reports/COMET_INTERPOLATION_RESULTS.json').write_text(json.dumps(summary,indent=2)+'\n')
print('Module bytes',len(text.encode()),flush=True)
