"""Original parametric exterior studies. Blender Z-up → GLB Y-up; metres.
Run blender -b --python scripts/build-landmarks.py. Details are estimates.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);return m
wood=mat('weathered cedar',(.24,.16,.095));dark=mat('recess',(.055,.05,.043));roof=mat('ceramic',(.17,.185,.18));white=mat('plaster',(.72,.69,.6));stone=mat('granite',(.48,.49,.44));gold=mat('gold',(.66,.46,.14))
def box(size,pos,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);return o
def column(x,y,z,h):
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.48,depth=h,location=(x,y,z+h/2));bpy.context.object.data.materials.append(wood)
def tiled(w,d,e,r):
 verts=[];faces=[];nx=32;ny=28
 def h(x,y):
  v=min(1,max(abs(y)/(d/2),max(0,(abs(x)-max(0,w-d)/2)/(d/2))));return e+r*(1-v)**1.35+max(0,v-.78)**2*16
 for j in range(ny+1):
  for i in range(nx+1):
   x=(i/nx-.5)*w;y=(j/ny-.5)*d;verts.append((x,y,h(x,y)))
 for j in range(ny):
  for i in range(nx):
   a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
 mesh=bpy.data.meshes.new('curved tiles');mesh.from_pydata(verts,[],faces);mesh.materials.append(roof);o=bpy.data.objects.new('curved roof',mesh);bpy.context.collection.objects.link(o)
 seams=[];quads=[]
 for side in [-1,1]:
  for k in range(int(w-2)):
   x=-w/2+1+k
   for j in range(7):
    y=side*d/2*j/7;yy=side*d/2*(j+1)/7;n=len(seams)
    seams.extend([(x-.045,y,h(x,y)+.06),(x+.045,y,h(x,y)+.06),(x+.045,yy,h(x,yy)+.06),(x-.045,yy,h(x,yy)+.06)]);quads.append((n,n+1,n+2,n+3))
 mesh=bpy.data.meshes.new('tile ridges');mesh.from_pydata(seams,[],quads);mesh.materials.append(roof);o=bpy.data.objects.new('tile ridges',mesh);bpy.context.collection.objects.link(o)
 box((max(3,w-d),.65,.65),(0,0,e+r),roof)
def export(name,target):
 objs=list(bpy.context.scene.objects)
 for m in [wood,dark,roof,white,stone,gold]:
  group=[o for o in list(bpy.context.scene.objects) if o.type=='MESH' and o.data.materials[0]==m]
  if not group:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in group:o.select_set(True)
  bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
 objs=list(bpy.context.scene.objects);coords=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box];lo=[min(c[i] for c in coords) for i in range(3)];hi=[max(c[i] for c in coords) for i in range(3)];scale=[target[i]/(hi[i]-lo[i]) for i in range(3)]
 for o in objs:
  bpy.context.view_layer.objects.active=o;bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
  for v in o.data.vertices:
   a=o.matrix_world@v.co;v.co=Vector(((a.x-(lo[0]+hi[0])/2)*scale[0],-(a.y-(lo[1]+hi[1])/2)*scale[1],(a.z-lo[2])*scale[2]))
  o.location=(0,0,0)
 bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models'/f'{name}.glb'),export_format='GLB',export_yup=True)
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
box((58,49,1.6),(0,0,.8),stone);box((48,38,25),(0,0,14.1),wood)
for y in [-19.2,19.2]:
 box((48,.15,7),(0,y,23),white)
 for x in range(-24,25,8):column(x,y,1.6,25);box((.45,.6,7),(x,y,23),wood)
 for x in range(-20,21,8):
  box((6.8,.35,12),(x,y,8),dark)
  for k in range(9):box((.1,.2,12),(x-3+k*.75,y+.23,8),wood)
for x in [-24,24]:
 for y in range(-16,17,8):column(x,y,1.6,25)
for z in [14,16,25,27]:box((50,40,.55),(0,0,z),wood)
tiled(61,52,16,8);tiled(55,43,28,18)
for i in range(25):
 x=-6+i*.5;box((.55,8,.35),(x,24,21.8+2.3*math.cos(x/6*math.pi)),roof)
for side in [-1,1]:
 for i in range(9):box((.55,.4,.55),(side*(6.8+i*.16),0,46+i*.35),gold)
export('daibutsuden',(57.012,50.480,48.742))
box((29,13,.5),(0,0,.25),stone)
for x in [-12,-7.2,-2.4,2.4,7.2,12]:
 for y in [-4.8,0,4.8]:column(x,y,.5,19.058)
for z in [4,7,10,14,18.5]:
 for y in [-4.8,0,4.8]:box((26,.5,.65),(0,y,z),wood)
 for x in [-12,-7.2,-2.4,2.4,7.2,12]:box((.5,11,.6),(x,0,z),wood)
for x in [-10,10]:box((3.2,8,9),(x,0,5),dark)
for x in range(-12,13,2):
 for y in [-5,5]:box((1.8,2.2,.4),(x,y,10.8),wood);box((1.5,2,.4),(x,y,19),wood)
tiled(33,17,11,5);tiled(31,16,20,5)
export('nandaimon',(31,17,25.46))
print('Generated metre-scale GLB. Gate width/depth and details estimated.')
