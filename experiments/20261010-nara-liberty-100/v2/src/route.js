import * as THREE from 'three';

// Edited route for a bounded prototype, NOT surveyed geographic coordinates.
export const points = [[0,0,40],[0,0,23],[0,.1,-35],[9,.35,-66],[11,.7,-110],[5,1,-137],[-6,2.2,-151],[-6,3.2,-170],[-30,4.3,-178]].map(p => new THREE.Vector3(...p));
const lengths = [];let total = 0;
for(let i=1;i<points.length;i++){const length=points[i].distanceTo(points[i-1]);lengths.push(length);total+=length;}
export const routeLength=total;
export function at(t) {
  const distance=THREE.MathUtils.clamp(t,0,1)*total;let consumed=0;
  for(let i=0;i<lengths.length;i++){
    if(distance<=consumed+lengths[i]||i===lengths.length-1){
      const k=THREE.MathUtils.clamp((distance-consumed)/lengths[i],0,1);
      const position=points[i].clone().lerp(points[i+1],k);
      const direction=points[i+1].clone().sub(points[i]).normalize();
      return {position,direction,yaw:Math.atan2(-direction.x,-direction.z)};
    }consumed+=lengths[i];
  }
}
export function heightAt(x,z){
  let best=Infinity,height=0;
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z;
    const k=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
    const d=(x-a.x-dx*k)**2+(z-a.z-dz*k)**2;
    if(d<best){best=d;height=THREE.MathUtils.lerp(a.y,b.y,k);}
  }
  return height;
}
