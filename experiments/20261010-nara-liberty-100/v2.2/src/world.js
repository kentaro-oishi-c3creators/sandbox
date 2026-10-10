import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { materials } from './textures.js';
import { points, landmarks, heightAt, routeLength } from './route.js';

export async function createWorld(scene){
 const m=materials();m.roof.side=THREE.DoubleSide;
 const meshes=[];let seed=522;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const add=(g,mat,p=[0,0,0],rot=[0,0,0])=>{const o=new THREE.Mesh(g,mat);o.position.set(...p);o.rotation.set(...rot);o.receiveShadow=true;o.castShadow=true;scene.add(o);meshes.push(o);return o;};
 const box=(s,p,mat=m.stone,rot)=>add(new THREE.BoxGeometry(...s),mat,p,rot);
 const cyl=(r,h,p,mat=m.wood,sides=12)=>add(new THREE.CylinderGeometry(r,r,h,sides),mat,p);
 const terrain=new THREE.PlaneGeometry(850,950,50,65);terrain.rotateX(-Math.PI/2);terrain.translate(0,0,-310);
 for(let i=0;i<terrain.attributes.position.count;i++){const a=terrain.attributes.position;a.setY(i,heightAt(a.getX(i),a.getZ(i))-.18);}terrain.computeVertexNormals();add(terrain,m.forest);
 box([850,.12,14],[0,-.04,0],m.road);
 for(let x=-80;x<=80;x+=7)box([3,.02,.16],[x,.03,0],m.plaster);
 for(let z=-6;z<=6;z+=1.7)box([4,.03,.65],[-8,.04,z],m.plaster);
 // Route surfaces and curbs use the same coordinates as the walking camera.
 function path(a,b,width=9){const d=b.clone().sub(a),len=d.length();const g=new THREE.PlaneGeometry(width,len,1,Math.ceil(len/5));g.rotateX(-Math.PI/2);const o=add(g,m.gravel,a.clone().lerp(b,.5).add(new THREE.Vector3(0,.02,0)).toArray());o.rotation.y=Math.atan2(d.x,d.z);o.rotation.x=-Math.atan2(d.y,Math.hypot(d.x,d.z));o.castShadow=false;}
 for(let i=1;i<points.length;i++)path(points[i-1],points[i],i<5?10:6);
 // Additional schematic peripheral tracks.
 for(const [a,b]of [[[-210,5,-430],[150,5,-430]],[[150,5,-430],[210,12,-530]],[[-210,4,-280],[-210,6,-520]]])path(new THREE.Vector3(...a),new THREE.Vector3(...b),4);
 // Stone joints, kerbs and bollards along the main approach.
 for(let z=-25;z>-480;z-=3){const y=heightAt(0,z);for(const side of [-1,1])box([.32,.23,2.7],[side*5.2,y+.04,z]);if(z%15===-10)box([10,.025,.06],[0,y+.035,z],m.dark);}
 function roof(x,z,y,w,d,h){const shape=new THREE.Shape();shape.moveTo(-d/2,0);shape.lineTo(0,h);shape.lineTo(d/2,0);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:w,bevelEnabled:false});const o=add(g,m.roof,[x-w/2,y,z]);o.rotation.y=Math.PI/2;o.position.set(x-w/2,y,z);return o;}
 function building(x,z,w,d,h=6,red=false){const y=heightAt(x,z);box([w,h,d],[x,y+h/2,z],red?m.red:m.plaster);roof(x,z,y+h,w+2,d+2,3);for(let j=-w/2+1;j<w/2;j+=2.5)box([.15,h,.15],[x+j,y+h/2,z+d/2+.1],m.wood);}
 // Shopfront rhythm: estimated footprints, original signs, no real-store branding.
 function sign(text,x,y,z){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#dfd5b7';ctx.fillRect(0,0,256,64);ctx.fillStyle='#302d25';ctx.font='32px serif';ctx.textAlign='center';ctx.fillText(text,128,44);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;add(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:t}),[x,y,z]);}
 for(let i=0;i<9;i++){const z=-40-i*21;building(-13,z,12,17,5.2);box([12,.18,2.4],[-13,heightAt(-13,z)+3.2,z+9.2],m.roof);sign(['奈良みやげ','茶屋','参道の店'][i%3],-13,heightAt(-13,z)+4.2,z+8.6);}
 building(-75,-310,64,37,8);building(-140,-405,38,28,8);building(-220,-485,26,26,10);building(142,-510,18,18,10);building(160,-555,18,19,7);building(92,-350,44,29,7);
 // Kagami pond, irregular outline to the east of the axis.
 const pond=landmarks.pond.position;const shape=new THREE.Shape();for(let i=0;i<25;i++){const a=i/24*Math.PI*2,r=1+Math.sin(a*3)*.1;const x=Math.cos(a)*26*r,z=Math.sin(a)*41*r;if(i===0)shape.moveTo(x,z);else shape.lineTo(x,z);}const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);add(geo,new THREE.MeshStandardMaterial({color:'#546c6b',metalness:.3,roughness:.25}),[pond.x,pond.y-.12,pond.z]);
 for(let i=0;i<35;i++){const a=i/35*Math.PI*2;const o=add(new THREE.IcosahedronGeometry(.9+rand()*.8,0),m.stone,[pond.x+Math.cos(a)*28,pond.y,pond.z+Math.sin(a)*43]);o.scale.set(1,.6,1);}
 const c=landmarks.chumon.position,h=landmarks.hall.position;
 // Courtyard lawn and stone approach. Front wall has a west admission gap.
 box([133,.14,105],[0,6.35,(c.z+h.z)/2],m.moss);
 path(new THREE.Vector3(0,6.5,c.z-20),points.at(-1),7);
 for(const [x,w]of [[-87,22],[-24,48],[48,80]]){building(x,c.z,w,5,4,true);}
 building(0,c.z,22,12,9,true);
 // Closed central door, walkway routes west around it.
 box([7,7,.3],[0,c.y+3.5,c.z+6.2],m.dark);
 for(const side of [-1,1]){building(side*68,(c.z+h.z)/2,5,110,4,true);}
 // Octagonal bronze lantern in front of the hall, slightly east of walking line.
 const bronze=new THREE.MeshStandardMaterial({color:'#4c6457',metalness:.5,roughness:.65});
 const lz=h.z+45;cyl(.8,.3,[0,7.15,lz],m.stone,8);cyl(.2,2,[0,8.25,lz],bronze,8);cyl(.9,1.3,[0,9.8,lz],bronze,8);add(new THREE.ConeGeometry(1.25,.7,8),bronze,[0,10.8,lz]);cyl(.14,.4,[0,11.35,lz],bronze,8);
 // Low railings, lanterns and approach lighting.
 for(let z=-235;z>-470;z-=27){for(const side of [-1,1]){const x=side*8,y=heightAt(x,z);box([.8,.2,.8],[x,y+.1,z]);cyl(.17,1.3,[x,y+.8,z],m.stone);box([.62,.5,.62],[x,y+1.7,z]);add(new THREE.ConeGeometry(.65,.5,4),m.stone,[x,y+2.2,z],[0,Math.PI/4,0]);}}
 // Deterministic broadleaf trees, merged opaque foliage, no moving actors.
 const leaf=new THREE.MeshStandardMaterial({color:'#526344',map:m.forest.map,bumpMap:m.forest.map,bumpScale:.25,roughness:1});let trees=0;
 for(let i=0;i<340;i++){const x=(rand()-.5)*650,z=35-rand()*780;if(Math.abs(x)<21|| (Math.abs(x)<82&&z<c.z+20&&z>h.z-45) || (Math.abs(x-pond.x)<34&&Math.abs(z-pond.z)<51) || (x>-32&&x<0&&z>-225))continue;const y=heightAt(x,z),height=8+rand()*9;cyl(.25+rand()*.2,height,[x,y+height/2,z],m.bark,7);for(let k=0;k<3;k++){const o=add(new THREE.SphereGeometry(3.5+rand()*2,10,8),leaf,[x+(rand()-.5)*5,y+height-1+k,z+(rand()-.5)*4]);o.scale.set(1,.72,1);}trees++;}
 // Merge static objects by material, retaining world-space normals.
 scene.updateMatrixWorld(true);const batches=new Map();for(const o of meshes){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);scene.remove(o);o.geometry.dispose();}
 for(const [material,geometries]of batches){const merged=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g));const o=new THREE.Mesh(merged,material);o.receiveShadow=true;o.castShadow=material!==leaf;scene.add(o);for(const g of geometries)g.dispose();}
 const loader=new GLTFLoader();const bounds={};
 for(const [file,id]of [['nandaimon','nandaimon'],['daibutsuden','hall']]){const gltf=await loader.loadAsync(`${import.meta.env.BASE_URL}models/${file}.glb`);const obj=gltf.scene;const size=new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());bounds[file]=size.toArray();obj.position.copy(landmarks[id].position);obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.side=THREE.DoubleSide;}});scene.add(obj);}
 return {routeLength,trees,animals:0,people:0,statues:0,gateHeight:bounds.nandaimon[1],hallDimensions:bounds.daibutsuden,landmarkBounds:bounds,landmarkPositions:Object.fromEntries(Object.entries(landmarks).map(([id,l])=>[id,l.position.toArray()]))};
}
