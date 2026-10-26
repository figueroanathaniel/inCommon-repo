#!/usr/bin/env python3
"""Generate independent Swiss references, preserving both source/convention modes.

Canonical: python tools/generate-precision-holdout.py <ephe-dir> --jpl-kernel <de441-client.eph>
Legacy diagnostic: python tools/generate-precision-holdout.py <ephe-dir> --legacy-compressed-apparent
Swiss is a reference generator only; the application does not execute its code.
"""
import argparse, hashlib, json, random
from pathlib import Path
import swisseph as swe
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('ephe_dir')
mode=parser.add_mutually_exclusive_group(required=True);mode.add_argument('--jpl-kernel');mode.add_argument('--legacy-compressed-apparent',action='store_true');args=parser.parse_args()
if swe.version!='2.10.03':raise RuntimeError('Review changed Swiss reference version: '+swe.version)
swe.set_ephe_path(args.ephe_dir);flag=swe.FLG_SWIEPH
if args.jpl_kernel:
    kernel=Path(args.jpl_kernel).resolve();swe.set_ephe_path(str(kernel.parent)+':'+args.ephe_dir);swe.set_jpl_file(kernel.name);flag=swe.FLG_JPLEPH
node_flags=flag|swe.FLG_HELCTR|(0 if args.legacy_compressed_apparent else swe.FLG_TRUEPOS)
start=swe.julday(1900,1,1,0);stop=swe.julday(2100,1,1,0);rng=random.Random(862026)
epochs=[start,stop]+[start+rng.random()*(stop-start) for _ in range(2048)];rows=[]
for jd in epochs:
    ap,flags=swe.calc_ut(jd,swe.OSCU_APOG,flag)
    if not flags & flag:raise RuntimeError('Refusing osculating lunar fallback')
    rows.append({'t':jd-2451545,'meanApogee':swe.calc_ut(jd,swe.MEAN_APOG,flag)[0][0],
      'meanNode':swe.calc_ut(jd,swe.MEAN_NODE,flag)[0][0], 'apogee':ap[0],
      'nodes':{name:swe.nod_aps_ut(jd,getattr(swe,name.upper()),swe.NODBIT_OSCU,node_flags)[0][0] for name in ('Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto')}})
filename='precision-point-swiss-compressed.json' if args.legacy_compressed_apparent else 'precision-point-holdout.json'
out=Path(__file__).parent/'fixtures'/filename
out.write_text(json.dumps({'source':'Swiss Ephemeris '+swe.version,'ephemerisMode':'direct JPL DE441' if flag==swe.FLG_JPLEPH else 'Swiss compressed DE441',
 'nodeFlags':node_flags,'nodeConvention':'heliocentric osculating ascending, apparent' if args.legacy_compressed_apparent else 'heliocentric osculating ascending, geometric TRUEPOS',
 'kernelSha256':hashlib.sha256(kernel.read_bytes()).hexdigest() if args.jpl_kernel else None,'seed':862026,'rows':rows},separators=(',',':'))+'\n')
print(out)
