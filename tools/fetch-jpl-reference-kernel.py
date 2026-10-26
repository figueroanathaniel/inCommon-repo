#!/usr/bin/env python3
"""Download a 1900 to 2100 excerpt of NASA's original DE441 reference file.

Only the coverage header is changed. The coefficient records are verbatim.
This file is for independent Swiss JPLEPH reference generation, not app use.
Usage: python tools/fetch-jpl-reference-kernel.py <output-dir>
"""
import urllib.request,re,struct,pathlib,math
import sys
output=pathlib.Path(sys.argv[1]);output.mkdir(parents=True,exist_ok=True)
base='https://ssd.jpl.nasa.gov/ftp/eph/planets/Linux/de441/'
header=urllib.request.urlopen(base+'header.441',timeout=30).read().decode();(output/'header.441').write_text(header)
print(header[:500],flush=True)
url=base+'linux_m13000p17000.441'
def read(start,n):
 print('range',start,n,flush=True)
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':f'bytes={start}-{start+n-1}'}),timeout=45) as r:d=r.read()
 if len(d)!=n:raise RuntimeError(f'request {n}, received {len(d)}')
 return d
ncoeff=int(re.search(r'NCOEFF\s*=\s*(\d+)',header)[1]);reclen=ncoeff*8
raw=bytearray(read(0,2*reclen));ss=struct.unpack_from('<3d',raw,2652);print('Ncoeff',ncoeff,'ss',ss,flush=True)
i=math.floor((2415013.5-ss[0])/ss[2]);end=math.ceil((2488075.5-ss[0])/ss[2]);ss2=(ss[0]+i*ss[2],ss[0]+end*ss[2],ss[2]);struct.pack_into('<3d',raw,2652,*ss2)
raw.extend(read((i+2)*reclen,(end-i)*reclen));p=(output/'de441-client.eph');p.write_bytes(raw);print('wrote',p,len(raw),ss2,flush=True)
