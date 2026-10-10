"""Validate exported bounds, geographic transformation and closed-gate routing."""
import json,struct,math
from pathlib import Path
p=Path(__file__).resolve().parents[1]
for name,expected in [('daibutsuden',[57.012,48.742,50.480]),('nandaimon',[31,25.46,17])]:
 b=(p/'public/models'/f'{name}.glb').read_bytes();assert b[:4]==b'glTF';n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);a=[g['accessors'][q['attributes']['POSITION']]for m in g['meshes']for q in m['primitives']];lo=[min(v['min'][i]for v in a)for i in range(3)];hi=[max(v['max'][i]for v in a)for i in range(3)];assert abs(lo[1])<.0001
 for i,v in enumerate(expected):assert abs(hi[i]-lo[i]-v)<.001
 assert abs(hi[0]+lo[0])<.001 and abs(hi[2]+lo[2])<.001
 print(name,'bounds passed')
d=json.loads((p/'src/site-data.json').read_text());o=d['origin']
def project(p):return [(p[1]-o['lon'])*111320*math.cos(o['lat']*math.pi/180),p[2],-(p[0]-o['lat'])*110940]
a=[project(p)for p in d['route']];length=sum(math.dist(x,y)for x,y in zip(a,a[1:]));assert 600<length<800
c=next(l for l in d['landmarks']if l['id']=='chumon');z=project([c['lat'],c['lon'],c['height']])[2]
for p,q in zip(a,a[1:]):
 if min(p[2],q[2])<=z<=max(p[2],q[2]) and p[2]!=q[2]:
  x=p[0]+(q[0]-p[0])*(z-p[2])/(q[2]-p[2]);assert -75<x<-49,'Cross southern west admission gap, never closed central door'
print('route passed; estimated model distance',round(length,3),'metres')
