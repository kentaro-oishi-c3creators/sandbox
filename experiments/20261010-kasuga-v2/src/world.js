import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials, foliageTexture } from './textures.js';
import { at, heightAt, points, routeLength } from './route.js';

export function createWorld(scene) {
  const m = materials(); const staticMeshes = []; let seed = 871;
  // Walkers see the eaves from below as well as the roof from above.
  m.roof.side = THREE.DoubleSide;
  const rand = () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296; };
  function add(geo, mat, parent, pos = [0,0,0], rot = [0,0,0]) {
    const mesh=new THREE.Mesh(geo,mat);mesh.position.set(...pos);mesh.rotation.set(...rot);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);staticMeshes.push(mesh);return mesh;
  }
  const box=(parent,mat,size,pos,rot)=>add(new THREE.BoxGeometry(...size),mat,parent,pos,rot);
  const cyl=(parent,mat,r1,r2,h,pos,rot,sides=12)=>add(new THREE.CylinderGeometry(r1,r2,h,sides),mat,parent,pos,rot);
  const sphere=(parent,mat,r,pos,scale=[1,1,1])=>{const s=add(new THREE.SphereGeometry(r,12,8),mat,parent,pos);s.scale.set(...scale);return s;};
  function beam(parent,mat,from,to,r1=.08,r2=.13) {
    const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),v=b.clone().sub(a);
    const o=cyl(parent,mat,r1,r2,v.length(),a.clone().add(b).multiplyScalar(.5).toArray());
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;
  }
  // Terrain follows the edited approach's height, with low uneven banks in the forest.
  const terrain=new THREE.PlaneGeometry(220,310,55,78);terrain.rotateX(-Math.PI/2);terrain.translate(-6,0,-88);
  const positions=terrain.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,heightAt(x,z)-.12+Math.sin(x*.13)*Math.sin(z*.06)*.45);
  }
  terrain.computeVertexNormals();add(terrain,m.forest,scene);
  const asphalt=box(scene,m.road,[52,.18,9],[0,-.07,35]);asphalt.castShadow=false;
  for(const x of [-19,-11,11,19])box(scene,m.plaster,[3,.02,.13],[x,.04,35]);
  // Individual textured segments make the route bend and climb instead of a flat toy plane.
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],d=b.clone().sub(a),length=d.length();
    const geo=new THREE.PlaneGeometry(i>5?5.6:7.2,length,1,Math.ceil(length/4));geo.rotateX(-Math.PI/2);
    const surface=add(geo,m.gravel,scene,a.clone().lerp(b,.5).add(new THREE.Vector3(0,.025,0)).toArray());
    surface.rotation.y=Math.atan2(d.x,d.z);
    surface.rotation.x=-Math.atan2(d.y,Math.hypot(d.x,d.z));surface.castShadow=false;
    for(const side of [-1,1]){
      const offset=new THREE.Vector3(d.z,0,-d.x).normalize().multiplyScalar(side*(i>5?2.9:3.8));
      for(let j=0;j<length;j+=2){
        const p=a.clone().lerp(b,j/length).add(offset);box(scene,m.stone,[.3,.17,1.8],[p.x,p.y+.04,p.z],[0,Math.atan2(d.x,d.z),0]);
      }
    }
  }
  // Small stream and stone bridge in the middle of the approach.
  const bridge=at(.46);const bridgeGroup=new THREE.Group();bridgeGroup.position.copy(bridge.position);bridgeGroup.rotation.y=bridge.yaw;scene.add(bridgeGroup);
  box(bridgeGroup,m.stone,[8,.5,4],[0,.04,0]);
  for(const side of [-1,1]){
    box(bridgeGroup,m.stone,[.25,.24,4.3],[side*3.8,.9,0]);
    for(const z of [-1.8,0,1.8])box(bridgeGroup,m.stone,[.33,1,.33],[side*3.8,.4,z]);
  }
  const waterMat=new THREE.MeshStandardMaterial({color:'#415a52',roughness:.27,metalness:.2});
  box(bridgeGroup,waterMat,[34,.03,2.3],[0,-.23,0]);
  function torii(position,width=9,height=8){
    const g=new THREE.Group();g.position.copy(position.position);g.rotation.y=position.yaw;scene.add(g);
    for(const side of [-1,1]){
      const pillar=cyl(g,m.red,width*.036,width*.043,height*.86,[side*width*.36,height*.42,0]);pillar.rotation.z=side*.026;
      cyl(g,m.dark,width*.046,width*.05,.5,[side*width*.36,.25,0]);
      // Metal rings at the base, visible on the real torii type.
      add(new THREE.TorusGeometry(width*.047,.025,6,24),m.dark,g,[side*width*.36,.58,0],[Math.PI/2,0,0]);
    }
    box(g,m.red,[width,.3,.44],[0,height*.67,0]);
    box(g,m.red,[.28,height*.18,.33],[0,height*.77,0]);
    box(g,m.red,[width*1.11,.42,.7],[0,height*.89,0]);
    box(g,m.dark,[width*1.17,.25,.82],[0,height*.93,0]);
    for(const side of [-1,1])box(g,m.dark,[1.7,.24,.82],[side*width*.61,height*.955,0],[0,0,side*.11]);
    box(g,m.wood,[.7,.9,.12],[0,height*.76,.28]);
    box(g,m.gold,[.44,.68,.025],[0,height*.76,.35]);
  }
  torii(at(.075),10.5,8.2);torii(at(.68),8.6,7.1);
  function lantern(t,side,offset=0){
    const p=at(t),normal=new THREE.Vector3(-p.direction.z,0,p.direction.x);
    const g=new THREE.Group();g.position.copy(p.position).add(normal.multiplyScalar(side*(4.5+offset)));g.position.y=heightAt(g.position.x,g.position.z);g.rotation.y=rand()*.15;g.scale.setScalar(.9+rand()*.25);scene.add(g);
    box(g,m.stone,[.95,.18,.95],[0,.09,0]);
    cyl(g,m.stone,.28,.4,.24,[0,.29,0]);
    cyl(g,m.stone,.17,.24,.98,[0,.9,0]);
    cyl(g,m.stone,.36,.24,.22,[0,1.49,0]);
    box(g,m.stone,[.78,.12,.78],[0,1.67,0]);
    // Four open windows, made from stone corner piers rather than a solid black cube.
    for(const x of [-.29,.29])for(const z of [-.29,.29])box(g,m.stone,[.13,.53,.13],[x,1.99,z]);
    box(g,m.dark,[.39,.36,.39],[0,1.97,0]);
    box(g,m.stone,[.8,.12,.8],[0,2.28,0]);
    const roof=cyl(g,m.stone,.22,.79,.43,[0,2.54,0],undefined,8);roof.rotation.y=Math.PI/8;
    sphere(g,m.stone,.15,[0,2.89,0],[1,1.1,1]);
    // Irregular caps of moss, sparingly placed on old stone surfaces.
    sphere(g,m.moss,.23,[.12,2.57,.33],[1.5,.1,.8]);
    sphere(g,m.moss,.16,[-.2,.18,.22],[1.4,.12,1]);
  }
  for(let t=.2;t<.93;t+=.017)for(const side of [-1,1])lantern(t,side,rand()*.7);
  for(let t=.73;t<.94;t+=.033)for(const side of [-1,1])lantern(t,side,2+rand());
  // End section: shallow worn stone steps lead into the south gate forecourt.
  const stepStart=.82,stepEnd=.94;
  for(let i=0;i<18;i++){
    const t=stepStart+(stepEnd-stepStart)*i/18,p=at(t);
    box(scene,m.stone,[6.1,.2,1.65],[p.position.x,p.position.y-.07,p.position.z],[0,p.yaw,0]);
  }
  function roof(parent,width,depth,base,rise){
    // Curved eaves, ridge, hip ends. Surface is built as strips, not a flat pyramid.
    const verts=[],uvs=[],indices=[],nx=24,nz=12;
    for(let zi=0;zi<=nz;zi++)for(let xi=0;xi<=nx;xi++){
      const x=(xi/nx-.5)*width,z=(zi/nz-.5)*depth;
      const slope=Math.abs(z)/(depth/2),hip=Math.max(0,(Math.abs(x)/(width/2)-.55)/.45);
      const y=base+rise*(1-Math.max(slope,hip))+.23*slope**5;
      verts.push(x,y,z);uvs.push(xi/nx,zi/nz);
    }
    for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const a=z*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();add(geo,m.roof,parent);
    for(const side of [-1,1])box(parent,m.dark,[width,.14,.16],[0,base+.24,side*depth/2]);
    box(parent,m.roof,[width*.56,.26,.42],[0,base+rise+.1,0]);
    for(const side of [-1,1])box(parent,m.wood,[.3,.25,.45],[side*width*.29,base+rise+.24,0],[0,0,side*-.2]);
  }
  const end=at(1);const gate=new THREE.Group();gate.position.copy(end.position).add(end.direction.clone().multiplyScalar(20));gate.rotation.y=end.yaw;scene.add(gate);
  // Nanmon: twelve metres from local ground to top, large central passage and upper gallery.
  box(gate,m.stone,[18,.45,10],[0,-.03,0]);
  for(const x of [-6.5,-2.4,2.4,6.5])for(const z of [-2.8,2.8]){
    cyl(gate,m.red,.24,.29,5.9,[x,3.12,z]);
    cyl(gate,m.stone,.37,.38,.26,[x,.36,z]);
    box(gate,m.redLight,[1.1,.28,.45],[x,5.2,z]);
    box(gate,m.red,[.42,.25,1.4],[x,5.45,z]);
  }
  for(const x of [-4.4,4.4]){
    box(gate,m.plaster,[3.5,3.8,.25],[x,2.55,-2.4]);
    box(gate,m.wood,[3.1,3.4,.18],[x,2.5,2.36]);
    for(let j=-1.4;j<=1.4;j+=.38)box(gate,m.dark,[.07,3.4,.2],[x+j,2.5,2.5]);
    box(gate,m.red,[3.8,.2,.55],[x,4.6,2.8]);
  }
  box(gate,m.redLight,[14.4,.4,6.6],[0,5.3,0]);
  roof(gate,19,10.2,5.55,1.65);
  box(gate,m.plaster,[11.9,2.2,4.5],[0,8.35,0]);
  for(const x of [-5.9,-3.9,-1.95,0,1.95,3.9,5.9])box(gate,m.red,[.22,2.7,4.65],[x,8.3,0]);
  for(const x of [-3.8,0,3.8]){
    box(gate,m.wood,[1.5,1.6,.17],[x,8.32,2.35]);
    for(let j=-.55;j<.7;j+=.27)box(gate,m.dark,[.08,1.5,.22],[x+j,8.32,2.43]);
  }
  box(gate,m.red,[13,.3,5.3],[0,9.55,0]);
  roof(gate,18,9.2,9.85,1.92); // roof upper ridge reaches 12m.
  // Upper balustrade and bracketing: silhouette is recognisably a two-storey gate.
  box(gate,m.redLight,[14.3,.3,6.7],[0,7.22,0]);
  for(const z of [-3.2,3.2]){
    for(let x=-6.7;x<7;x+=.55)cyl(gate,m.red,.045,.05,.8,[x,7.7,z],undefined,6);
    box(gate,m.red,[14.1,.12,.15],[0,8.09,z]);
  }
  for(const side of [-1,1]){
    for(let i=0;i<7;i++){
      const x=side*(11+i*3.6);
      box(gate,m.plaster,[3.6,2.8,.25],[x,2,0]);
      for(const dx of [-1.8,1.8])cyl(gate,m.red,.14,.16,3.8,[x+dx,2.1,1.4]);
      box(gate,m.red,[3.7,.24,2.6],[x,3.94,0]);
      const rg=new THREE.Group();rg.position.set(x,0,0);gate.add(rg);roof(rg,3.7,4.5,4.05,1.05);
      for(const dx of [-.8,.8]){
        beam(gate,m.dark,[x+dx,3.3,1.2],[x+dx,2.6,1.2],.025,.025);
        cyl(gate,m.gold,.12,.16,.42,[x+dx,2.44,1.2],undefined,6);
      }
    }
  }
  box(gate,m.stone,[65,.1,29],[0,-.06,-17]);
  box(gate,m.plaster,[64,2.8,.25],[0,1.5,-29]);
  for(let x=-30;x<=30;x+=3.75)cyl(gate,m.red,.14,.16,3.5,[x,1.7,-28.8]);
  const rear=new THREE.Group();rear.position.z=-29;gate.add(rear);roof(rear,65,4.4,3.1,.9);
  gate.updateMatrixWorld(true);
  const unscaledTop=new THREE.Box3().setFromObject(gate).max.y-gate.position.y;
  gate.scale.y=12/unscaledTop;
  gate.updateMatrixWorld(true);
  const measuredGateHeight=new THREE.Box3().setFromObject(gate).max.y-gate.position.y;
  // Small auxiliary roof near the torii; no deer-shaped fountain yet in this stage.
  const pavilion=new THREE.Group();const pp=at(.7);pavilion.position.copy(pp.position).add(new THREE.Vector3(12,0,0));scene.add(pavilion);
  for(const x of [-2.4,2.4])for(const z of [-1.5,1.5])cyl(pavilion,m.wood,.14,.17,3,[x,1.5,z]);
  roof(pavilion,6.4,4.8,3.1,1.1);box(pavilion,m.stone,[3.4,.8,1.4],[0,.5,0]);
  function sign(text,pos,yaw,width=1.8,height=1.1){
    const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#b2a182';ctx.fillRect(0,0,512,256);ctx.fillStyle='#3a3a2b';ctx.font='36px serif';ctx.textAlign='center';ctx.fillText(text,256,110);ctx.font='20px sans-serif';ctx.fillText('春日大社  表参道',256,172);
    const mat=new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c),roughness:.9});
    const g=new THREE.Group();g.position.set(...pos);g.rotation.y=yaw;scene.add(g);
    box(g,m.wood,[.12,1.5,.12],[-width*.4,.75,0]);box(g,m.wood,[.12,1.5,.12],[width*.4,.75,0]);box(g,mat,[width,height,.1],[0,1.7,0]);
  }
  sign('春 日 大 社',[-6,0,26],0);const sp=at(.62);sign('南門へ  →',[sp.position.x+6,sp.position.y,sp.position.z],sp.yaw);
  // Tall trunks and roots, with leaf-cluster billboards instead of faceted toy crowns.
  const leafMat=new THREE.MeshStandardMaterial({map:foliageTexture(),alphaTest:.38,side:THREE.DoubleSide,roughness:1,color:'#99ab80'});
  const leafMatrices=[];const dummy=new THREE.Object3D();let treeCount=0;
  for(let i=0;i<270;i++){
    const t=rand()*.98,p=at(t),side=rand()>.5?1:-1,offset=8+rand()*50;
    const normal=new THREE.Vector3(-p.direction.z,0,p.direction.x);
    const base=p.position.clone().add(normal.multiplyScalar(side*offset));base.z+=(rand()-.5)*14;base.y=heightAt(base.x,base.z);
    // Keep the gate forecourt readable.
    if(base.distanceTo(gate.position)<19)continue;
    const h=11+rand()*11,r=.24+rand()*.48;
    const g=new THREE.Group();g.position.copy(base);g.rotation.z=(rand()-.5)*.06;scene.add(g);treeCount++;
    cyl(g,m.bark,r*.55,r,h,[0,h/2,0],undefined,10);
    for(let j=0;j<4;j++){
      const angle=rand()*Math.PI*2;beam(g,m.bark,[0,.3,0],[Math.cos(angle)*(1.1+r),.03,Math.sin(angle)*(1.1+r)],.03,r*.5);
      const bx=Math.cos(angle)*(2+rand()*2),bz=Math.sin(angle)*(2+rand()*2),by=h*(.65+rand()*.2);
      beam(g,m.bark,[0,by-1,0],[bx,by+1.5,bz],.06,.18);
    }
    for(let j=0;j<8;j++){
      dummy.position.set(base.x+(rand()-.5)*7,base.y+h-2+rand()*5,base.z+(rand()-.5)*7);
      dummy.rotation.set((rand()-.5)*1.2,rand()*6.28,(rand()-.5)*.6);dummy.scale.set(4+rand()*4,3+rand()*4,1);dummy.updateMatrix();leafMatrices.push(dummy.matrix.clone());
    }
    if(i%3===0){
      for(let j=0;j<3;j++){const rock=sphere(g,m.stone,.3+rand()*.5,[rand()*3-1.5,.15,rand()*3-1.5],[1.4,.5,1]);rock.rotation.y=rand()*3;}
    }
  }
  const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,leafMatrices.length);
  leafMatrices.forEach((matrix,i)=>leaves.setMatrixAt(i,matrix));leaves.castShadow=true;leaves.receiveShadow=true;scene.add(leaves);
  // Static scene batching keeps material richness without thousands of draw calls.
  scene.updateMatrixWorld(true);const groups=new Map();
  for(const mesh of staticMeshes){
    const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geo.applyMatrix4(mesh.matrixWorld);
    if(!groups.has(mesh.material.uuid))groups.set(mesh.material.uuid,{material:mesh.material,geometries:[]});
    groups.get(mesh.material.uuid).geometries.push(geo);mesh.removeFromParent();
  }
  for(const {material,geometries} of groups.values()){
    const merged=mergeGeometries(geometries);const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);geometries.forEach(g=>g.dispose());
  }
  return {treeCount,lanterns:Math.ceil((.93-.2)/.017)*2+Math.ceil((.94-.73)/.033)*2,gateHeight:measuredGateHeight,routeLength,leafCount:leafMatrices.length,animals:0,people:0,statues:0};
}
