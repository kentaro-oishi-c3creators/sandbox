import * as THREE from 'three';
import data from './site-data.json';
export const project=(lat,lon,h=0)=>new THREE.Vector3((lon-data.origin.lon)*111320*Math.cos(data.origin.lat*Math.PI/180),h,-(lat-data.origin.lat)*110940);
export const landmarks=Object.fromEntries(data.landmarks.map(l=>[l.id,{...l,position:project(l.lat,l.lon,l.height)}]));
export const points=data.route.map(p=>project(...p));
export const distances=[0];
for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+points[i].distanceTo(points[i-1]));
export const routeLength=distances.at(-1);
export const stops=[0,(distances[3]-34)/routeLength,distances[4]/routeLength,1];
export function at(t){const d=THREE.MathUtils.clamp(t,0,1)*routeLength;let i=1;while(i<points.length-1&&d>distances[i])i++;const k=(d-distances[i-1])/(distances[i]-distances[i-1]);const position=points[i-1].clone().lerp(points[i],k),direction=points[i].clone().sub(points[i-1]).normalize();return {position,direction,yaw:Math.atan2(-direction.x,-direction.z)};}
export function heightAt(x,z){return THREE.MathUtils.clamp(-z/650*7,0,7)+Math.max(0,x-90)*.03;}
