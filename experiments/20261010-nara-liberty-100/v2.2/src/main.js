import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld } from './world.js';
import { at, routeLength, points, stops, landmarks } from './route.js';
import './style.css';

const $=s=>document.querySelector(s);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('#loading').hidden=true;$('#error').hidden=false;throw e;}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
$('#scene').append(renderer.domElement);
renderer.domElement.tabIndex=0;
renderer.domElement.setAttribute('aria-label','参道の3D表示。ドラッグで見回し、Wまたは上矢印で前進します。');
const scene=new THREE.Scene();scene.background=new THREE.Color('#b3c4cc');scene.fog=new THREE.FogExp2('#b3c4cc',.0008);
scene.add(new THREE.HemisphereLight('#d3e0dd','#5b6348',2.15));
const sun=new THREE.DirectionalLight('#fff1d3',3.2);sun.position.set(-240,380,-120);sun.target.position.set(0,0,-300);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-220,right:220,top:430,bottom:-430,near:1,far:900});sun.shadow.bias=-.0006;sun.shadow.normalBias=.08;
let world;try{world=await createWorld(scene);}catch(e){$('#loading').hidden=true;$('#error').hidden=false;$('#error').textContent='建築モデルを読み込めませんでした。再読み込みしてください。';throw e;}
const camera=new THREE.PerspectiveCamera( sixty(),innerWidth/innerHeight,.08,1600);
function sixty(){return innerWidth<760?68:61;}
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enabled=false;orbit.enableDamping=true;orbit.minDistance=10;orbit.maxDistance=950;orbit.maxPolarAngle=Math.PI/2-.04;
let progress=0,walking=false,overview=false,yawOffset=0,pitch=0,highQuality=false,arrived=false;
let drag=null,held=0;const keys=new Set();const eyeHeight=1.65;
const labels=[{t:0,name:'大仏前交差点',sub:'街の通りから、東大寺の参道へ。'},{t:.10,name:'東大寺参道',sub:'土産物店と木立のあいだを北へ。'},{t:stops[1]-.015,name:'南大門',sub:'高さ25.46m。大円柱のあいだを通る。'},{t:stops[2]-.07,name:'鏡池・中門',sub:'池を右手に、西側の拝観入口へ。'},{t:stops[2]+.06,name:'西側の拝観入口',sub:'中門正面は通らず、回廊の西側から。'},{t:.94,name:'大仏殿・前庭',sub:'八角燈籠の先に、48.742mの大仏殿。'}];
const mapPoints=points.map(p=>[80+p.x*.16,155+p.z*.19]);
document.querySelectorAll('[data-stop]').forEach((b,i)=>b.dataset.stop=stops[i]);
$('#route-line').setAttribute('d',mapPoints.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '));
for(const t of stops){const p=at(t).position,c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',80+p.x*.16);c.setAttribute('cy',155+p.z*.19);c.setAttribute('r',3);$('#route-line').after(c);}
function updateUi(){
  document.querySelector('.title-block').hidden=progress>.04;
  $('#progress').value=(progress*100).toFixed(1);$('#progress-label').value=`${Math.round(progress*100)}%`;
  const loc=[...labels].reverse().find(l=>progress>=l.t)||labels[0];$('#location-name').textContent=loc.name;$('#location-sub').textContent=loc.sub;
  const nearest=stops.reduce((best,t)=>Math.abs(t-progress)<Math.abs(best-progress)?t:best,0);
  document.querySelectorAll('[data-stop]').forEach(b=>{const active=Number(b.dataset.stop)===nearest;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('#walk').innerHTML=walking?'<span>Ⅱ</span> 立ち止まる':'<span>▶</span> 散策を始める';$('#walk').setAttribute('aria-pressed',String(walking));
  const position=at(progress).position;$('#map-position').setAttribute('cx',80+position.x*.16);$('#map-position').setAttribute('cy',155+position.z*.19);
  $('#arrival').hidden=progress<.999;arrived=progress>=.999;
}
function setCamera(now=0){
  const p=at(progress);camera.position.copy(p.position);camera.position.y+=eyeHeight;
  if(walking&&!reduced)camera.position.y+=Math.sin(now*.005)*.012;
  const distanceToGate=Math.abs(p.position.z-landmarks.nandaimon.position.z);
  const gateLook=THREE.MathUtils.smoothstep(progress,.90,1)*.35+(distanceToGate<65&&progress<.52?.14:0);
  if(progress>.90){const target=landmarks.hall.position; p.yaw=Math.atan2(p.position.x-target.x,p.position.z-target.z);}
  camera.rotation.order='YXZ';camera.rotation.set(pitch+gateLook,p.yaw+yawOffset,0);
}
function setProgress(t){progress=THREE.MathUtils.clamp(t,0,1);if(progress>=1)walking=false;updateUi();if(!overview)setCamera();}
function setOverview(value){
  overview=value;orbit.enabled=value;$('#overview').setAttribute('aria-pressed',String(value));$('#overview').textContent=value?'目線に戻る':'俯瞰 ↗';
  if(value){walking=false;updateUi();const p=at(progress).position;orbit.target.copy(p);camera.position.copy(p).add(new THREE.Vector3(180,270,220));orbit.update();}
  else{yawOffset=0;pitch=0;setCamera();}
}
$('#walk').addEventListener('click',()=>{if(overview)setOverview(false);if(progress>=1)progress=0;walking=!walking;updateUi();});
$('#progress').addEventListener('input',e=>{walking=false;if(overview)setOverview(false);setProgress(Number(e.target.value)/100);});
document.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>{walking=false;if(overview)setOverview(false);yawOffset=0;pitch=0;setProgress(Number(b.dataset.stop));}));
$('#reset').addEventListener('click',()=>{walking=false;if(overview)setOverview(false);yawOffset=0;pitch=0;setProgress(0);});
$('#overview').addEventListener('click',()=>setOverview(!overview));
$('#quality').addEventListener('click',()=>{highQuality=!highQuality;renderer.setPixelRatio(highQuality?Math.min(devicePixelRatio,1.5):Math.min(devicePixelRatio,1));$('#quality').textContent=highQuality?'描画：高精細':'描画：標準';$('#quality').setAttribute('aria-pressed',String(highQuality));});
renderer.domElement.addEventListener('pointerdown',e=>{if(overview)return;drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||overview)return;yawOffset-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.003,-.9,.8);drag={x:e.clientX,y:e.clientY};setCamera();});
renderer.domElement.addEventListener('pointerup',()=>{drag=null;});renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
window.addEventListener('keydown',e=>{if($('#about').open||/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','s','a','d','W','S','A','D'].includes(e.key)){e.preventDefault();keys.add(e.key.toLowerCase());}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();held=0;drag=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();held=0;walking=false;updateUi();}});
for(const [id,dir]of [['forward',1],['backward',-1]]){
  const b=$(`#${id}`);b.addEventListener('pointerdown',e=>{if(overview)setOverview(false);walking=false;updateUi();held=dir;b.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held=0);
}
$('#about-open').addEventListener('click',()=>{walking=false;held=0;keys.clear();updateUi();$('#about').showModal();});$('#about-close').addEventListener('click',()=>$('#about').close());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=sixty();camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();walking=false;$('#error').hidden=false;$('#error').textContent='3Dの描画が中断しました。ページを再読み込みしてください。';});
setCamera();updateUi();
let renderCount=0;
let last=performance.now(),fpsStart=last,frames=0,lastCameraState='',renderRequested=true;
renderer.setAnimationLoop(now=>{
  const dt=Math.min((now-last)/1000,.1);last=now;
  if(!overview&&!$('#about').open){
    const direction=held+(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)+(walking?1:0);
    if(direction){progress=THREE.MathUtils.clamp(progress+direction*Number($('#speed').value)*dt/routeLength,0,1);if(progress>=1)walking=false;updateUi();}
    if(keys.has('a')||keys.has('arrowleft'))yawOffset+=dt*.8;if(keys.has('d')||keys.has('arrowright'))yawOffset-=dt*.8;
    setCamera(now);
  }else if(overview)orbit.update();
  const cameraState=[...camera.position.toArray(),...camera.quaternion.toArray()].map(v=>v.toFixed(5)).join(',')+`/${innerWidth}/${innerHeight}/${highQuality}`;
  if(renderRequested||cameraState!==lastCameraState){renderer.render(scene,camera);renderCount++;frames++;renderRequested=false;lastCameraState=cameraState;}
  if(now-fpsStart>1000){$('#fps').textContent=frames?`${Math.round(frames*1000/(now-fpsStart))} FPS`:'静止中';frames=0;fpsStart=now;}
});
$('#loading').hidden=true;
window.todaijiDebug=()=>({version:2.2,renderCount,progress,walking,overview,arrived,eyeHeight,highQuality,camera:camera.position.toArray(),yawOffset,pitch,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,webgl2:renderer.capabilities.isWebGL2,...world});
