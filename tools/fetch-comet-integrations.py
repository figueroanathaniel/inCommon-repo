#!/usr/bin/env python3
"""Fetch reproducible Horizons observer longitude grids and independent tests.
Requests are sequential, cached outside git, and include formal uncertainty.
Usage: python tools/fetch-comet-integrations.py <cache-dir>
"""
import csv,datetime as dt,json,pathlib,sys,urllib.parse,urllib.request
CACHE=pathlib.Path(sys.argv[1]);CACHE.mkdir(parents=True,exist_ok=True)
COMMANDS={'halley':'DES=1P;CAP <1994;NOFRAG','halebopp':'DES=1995 O1;CAP <1997;NOFRAG'}
EPOCH=dt.datetime(2000,1,1,12)
def fetch(body,label,start,stop,step):
 p=CACHE/f'{body}_{label}.json'
 params={'format':'text','COMMAND':"'"+COMMANDS[body]+"'",'MAKE_EPHEM':'YES','EPHEM_TYPE':'OBSERVER','CENTER':"'500@399'",'START_TIME':"'"+start+"'",'STOP_TIME':"'"+stop+"'",'STEP_SIZE':"'"+step+"'",'QUANTITIES':"'31,38'",'CSV_FORMAT':'YES','ANG_FORMAT':'DEG','TIME_TYPE':'UT','TIME_DIGITS':'MINUTES'}
 if p.exists():return json.loads(p.read_text())
 url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urllib.parse.urlencode(params)
 rawfile=CACHE/f'{body}_{label}.txt'
 raw=rawfile.read_text() if rawfile.exists() else urllib.request.urlopen(url,timeout=60).read().decode()
 if '$$SOE' in raw:rawfile.write_text(raw)
 if '$$SOE' not in raw:raise RuntimeError(raw[:1200])
 head,data=raw.split('$$SOE',1);data=data.split('$$EOE',1)[0];rows=[]
 for r in csv.reader(data.strip().splitlines()):
  date=dt.datetime.strptime(r[0].strip(),'%Y-%b-%d %H:%M');t=(date-EPOCH).total_seconds()/86400
  rows.append([t,float(r[3]),None if r[-2].strip()=='n.a.' else float(r[-2])])
 result={'body':body,'command':COMMANDS[body],'parameters':params,'header':head,'rows':rows}
 p.write_text(json.dumps(result,separators=(',',':'))+'\n');print(body,label,len(rows),flush=True)
 return result
if __name__=='__main__':
 for body in COMMANDS:
  fetch(body,'coarse7','1899-12-01','2100-02-01','7 d')
  fetch(body,'holdout7','1899-12-04 12:00','2100-01-28','7 d')
  years=[1910,1986,2061] if body=='halley' else [1997,2000,2004]
  for year in years:
   fetch(body,f'near{year}',f'{year-2}-01-01',f'{year+2}-01-01','1 d')
   fetch(body,f'holdoutNear{year}',f'{year-2}-01-01 12:00',f'{year+2}-01-01','1 d')
   if body=='halley':
    fetch(body,f'fast{year}',f'{year-1}-10-01',f'{year}-10-01','1 h')
    fetch(body,f'holdoutFast{year}',f'{year-1}-10-01 00:30',f'{year}-10-01','1 h')
  if body=='halebopp':
   fetch(body,'fast1998','1997-07-01','1998-07-01','1 h')
   fetch(body,'holdoutFast1998','1997-07-01 00:30','1998-07-01','1 h')
  for label,date in [('natal','1994-02-17 05:37'),('random1975','1975-07-15 12:13'),('random2008','2008-05-22 03:47'),('random2026','2026-10-26 14:13')]:
   end=(dt.datetime.strptime(date,'%Y-%m-%d %H:%M')+dt.timedelta(minutes=1)).strftime('%Y-%m-%d %H:%M')
   fetch(body,label,date,end,'1 m')
