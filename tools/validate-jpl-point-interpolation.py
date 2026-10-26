#!/usr/bin/env python3
"""Check every regular-grid midpoint against directly evaluated JPL vectors.
This measures interpolation separately from cross-ephemeris agreement.
"""
import importlib.util,json,sys,re
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('geometry',root/'tools/lib/jpl-point-geometry.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);g=m.Geometry(sys.argv[1])
text=(root/'app/jpl-derived-points.js').read_text();data=json.loads(text.split('const series = ',1)[1].split(';\nconst norm',1)[0]);delta=np.array(json.loads((root/'tools/fixtures/ut1-tt-reference.json').read_text())['rows']);out={}
for name,s in data.items():
 y=np.array(s['values']);k=np.arange(1,len(y)-2);t=s['start']+(k+.5)*s['step'];keep=(t>=-36524.5)&(t<=36524.5);k=k[keep];t=t[keep]
 near=lambda a,b:a-np.round((a-b)/360)*360
 p1=y[k];p0=near(y[k-1],p1);p2=near(y[k+1],p1);p3=near(y[k+2],p2)
 value=(-p0+9*p1+9*p2-p3)/16%360
 tt=t+2451545+np.interp(t,delta[:,0],delta[:,1])/86400
 direct=g.apogee(tt) if name=='apogee' else g.node(name,tt)
 error=np.abs((value-direct+180)%360-180)*3600
 out[name]={'midpoints':len(t),'worstArcsec':float(error.max()),'worstT':float(t[error.argmax()])}
 print(name,out[name],flush=True)
 if error.max()>(0.35 if name=='apogee' else 0.25):raise SystemExit('Interpolation must be refined')
(root/'reports/JPL_POINT_INTERPOLATION_RESULTS.json').write_text(json.dumps(out,indent=2)+'\n')
