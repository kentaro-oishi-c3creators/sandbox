import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import './style.css';

const $ = (s) => document.querySelector(s);
const root = $('#scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  $('#loading').hidden = true;
  $('#error').hidden = false;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor('#e8eee3');
root.append(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#e8eee3', 85, 195);
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 300);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.maxPolarAngle = Math.PI / 2 - .04;
controls.minDistance = 8;
controls.maxDistance = 120;
controls.target.set(0, 0, -15);
scene.add(new THREE.HemisphereLight('#fff9e3', '#7c9871', 2.5));
const sun = new THREE.DirectionalLight('#fff1d0', 3);
sun.position.set(-35, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 180 });
sun.shadow.bias = -.001;
scene.add(sun);
const mats = {};
function material(color) {
  return mats[color] ??= new THREE.MeshStandardMaterial({ color, roughness: .95 });
}
function mesh(geometry, color, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(parent, color, size, pos) { return mesh(new THREE.BoxGeometry(...size), color, parent, ...pos); }
function cylinder(parent, color, top, bottom, height, pos, sides = 8) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, sides), color, parent, ...pos);
}
function ball(parent, color, radius, pos, detail = 0) { return mesh(new THREE.IcosahedronGeometry(radius, detail), color, parent, ...pos); }
let seed = 20261010;
function rand() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
const ground = cylinder(scene, '#9cae7e', 89, 90, 2, [0, -1.2, -20], 64);
ground.castShadow = false;
box(scene, '#d9cba5', [11, .12, 78], [0, -.1, -8]);
box(scene, '#d9cba5', [85, .13, 7], [0, -.08, 23]);
// A mossy stream and a small vermilion bridge, handmade rather than GIS geometry.
const water = box(scene, '#8daea1', [100, .08, 4], [0, -.01, -4]);
water.material = new THREE.MeshStandardMaterial({ color: '#8daea1', roughness: .35, metalness: .1 });
box(scene, '#ae5435', [12, .45, 7], [0, .25, -4]);
for (const x of [-5.4, 5.4]) {
  box(scene, '#bc6144', [.22, .2, 7], [x, 1.4, -4]);
  for (let z = -7; z <= -1; z += 1.5) cylinder(scene, '#ad5037', .13, .13, 1.4, [x, .8, z]);
}
function tree(x, z, scale = 1, cedar = false) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale);
  cylinder(g, '#77654c', .26, .45, 4.5, [0, 2.1, 0]);
  if (cedar) {
    for (let i = 0; i < 3; i++) cylinder(g, ['#476a4d', '#547557', '#678566'][i], 0, 2.7 - i * .5, 4, [0, 4 + i * 1.8, 0]);
  } else {
    const color = ['#6d8c5d', '#7d965e', '#a3a365', '#bc9858'][Math.floor(rand() * 4)];
    ball(g, color, 2.9, [0, 5, 0], 1);
    ball(g, color, 2.1, [-1.8, 4.8, .3]);
    ball(g, color, 2, [1.5, 5.6, -.5]);
  }
  scene.add(g);
}
for (let i = 0; i < 130; i++) {
  const x = (rand() - .5) * 145, z = rand() * -110 + 36;
  if (Math.abs(x) < 12 || (z > 18 && z < 29) || (Math.abs(x) < 22 && z < -43)) continue;
  tree(x, z, .6 + rand() * .8, z < -15 && rand() > .35);
}
function torii(z, size = 1) {
  const g = new THREE.Group(); g.position.z = z; g.scale.setScalar(size);
  cylinder(g, '#b95336', .28, .38, 6.2, [-4, 3.1, 0]);
  cylinder(g, '#b95336', .28, .38, 6.2, [4, 3.1, 0]);
  for (const x of [-4, 4]) cylinder(g, '#535445', .4, .4, .55, [x, .25, 0]);
  box(g, '#b95336', [9.8, .38, .5], [0, 4.6, 0]);
  box(g, '#b95336', [.25, 1.1, .38], [0, 5.3, 0]);
  box(g, '#ad5135', [10.8, .4, .75], [0, 6, 0]);
  box(g, '#46493d', [11.4, .3, .85], [0, 6.35, 0]);
  for (const side of [-1, 1]) {
    const cap = box(g, '#46493d', [1.5, .3, .85], [side * 5.8, 6.5, 0]);
    cap.rotation.z = side * .16;
  }
  scene.add(g);
}
torii(12, 1.12); torii(-30, .95);
function lantern(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  box(g, '#9d9c86', [1, .2, 1], [0, .1, 0]);
  cylinder(g, '#a8a58b', .2, .3, 1.1, [0, .7, 0]);
  box(g, '#a4a18a', [.75, .15, .75], [0, 1.35, 0]);
  box(g, '#b4b198', [.65, .55, .65], [0, 1.68, 0]);
  box(g, '#575d4d', [.3, .3, .67], [0, 1.68, 0]);
  cylinder(g, '#8b8d79', .13, .7, .42, [0, 2.16, 0], 4).rotation.y = Math.PI / 4;
  ball(g, '#989a81', .14, [0, 2.45, 0]); scene.add(g);
}
for (let z = 5; z > -43; z -= 5) for (const x of [-7, 7]) lantern(x, z);
function roof(g, width, depth, y) {
  // Trapezoid cross-section gives layered, sloping shrine roofs.
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); shape.lineTo(-width * .3, 2.1); shape.lineTo(width * .3, 2.1); shape.lineTo(width / 2, 0); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  mesh(geo, '#555a49', g, 0, y, -depth / 2);
  box(g, '#686953', [width * .65, .25, depth + .5], [0, y + 2.1, 0]);
  box(g, '#343f33', [width + .4, .18, depth + .2], [0, y, 0]);
}
function shrine(x, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale);
  box(g, '#b0ac92', [18, .8, 11], [0, .4, 0]);
  box(g, '#eee4c9', [15, 3.7, 8], [0, 2.7, 0]);
  for (let x = -7; x <= 7; x += 2.8) box(g, '#b8593d', [.35, 4.6, .4], [x, 3, 4.1]);
  for (const x of [-4.2, 0, 4.2]) {
    box(g, '#5e5542', [1.9, 2.7, .2], [x, 2.5, 4.08]);
    for (let dx = -.6; dx < 1; dx += .4) box(g, '#b58354', [.09, 2.7, .24], [x + dx, 2.5, 4.1]);
  }
  box(g, '#bc6446', [16.5, .4, 8.4], [0, 4.9, 0]);
  roof(g, 20, 12, 5.1);
  for (let i = 0; i < 3; i++) box(g, '#b4af97', [5, .25, 1.3], [0, .15 + i * .22, 6.8 - i]);
  scene.add(g);
}
shrine(0, -55); shrine(-20, -52, .65); shrine(20, -52, .65);
for (const x of [-14, 14]) {
  box(scene, '#b85b3c', [9, 2.6, .35], [x, 1.6, -45]);
  box(scene, '#545c48', [10, .3, 1.8], [x, 3, -45]);
}
// Deer are original low-poly shapes; their quiet presence is part of the joke.
function deer(x, z, angle, scale) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = angle; g.scale.setScalar(scale);
  const body = ball(g, '#ae8155', .6, [0, 1, 0], 1); body.scale.set(.65, .85, 1.3);
  cylinder(g, '#ba9165', .2, .3, .75, [0, 1.47, -.5]).rotation.x = -.4;
  const head = ball(g, '#b58c5f', .33, [0, 1.95, -.75]); head.scale.z = 1.4;
  for (const side of [-1, 1]) {
    const ear = ball(g, '#b99065', .2, [side * .28, 2.13, -.68]); ear.scale.set(.5, 1, .6); ear.rotation.z = side * -.7;
    ball(g, '#283b2d', .045, [side * .24, 2, -.94]);
    for (const front of [-1, 1]) cylinder(g, '#86613f', .065, .09, .8, [side * .25, .4, front * .45]);
    for (let i = 0; i < 4; i++) ball(g, '#e9d7aa', .06, [side * .36, 1.2 + (i % 2) * .12, -.3 + i * .2]);
  }
  ball(g, '#eee2bc', .15, [0, 1.1, .75]); scene.add(g);
}
for (let i = 0; i < 18; i++) deer((rand() - .5) * 55, rand() * 44 - 12, rand() * Math.PI * 2, .9 + rand() * .4);
// Statue geometry is shared across clones. No downloaded model or hidden asset license.
function statue() {
  const g = new THREE.Group();
  cylinder(g, '#72a59a', .22, .48, 1.5, [0, 1, 0]);
  const body = cylinder(g, '#7bab9e', .32, .24, .7, [0, 1.8, 0]); body.rotation.z = -.08;
  ball(g, '#8eb7a6', .23, [0, 2.35, 0], 1);
  cylinder(g, '#6e9e91', .3, .28, .13, [0, 2.55, 0]);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const ray = cylinder(g, '#6f9f92', 0, .06, .38, [Math.cos(a) * .28, 2.72, Math.sin(a) * .28], 4);
    ray.rotation.z = -Math.cos(a) * .5; ray.rotation.x = Math.sin(a) * .5;
  }
  const arm = cylinder(g, '#7bab9e', .07, .13, 1.1, [-.43, 2.35, 0]); arm.rotation.z = -.4;
  cylinder(g, '#759c7c', .08, .07, .4, [-.64, 3, 0]);
  const flame = ball(g, '#e5b464', .18, [-.64, 3.28, 0]); flame.scale.y = 1.55;
  const tablet = box(g, '#578c7f', [.35, .52, .12], [.35, 1.8, -.17]); tablet.rotation.z = -.18;
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .17, .45, 0);
    cylinder(leg, '#6e9e91', .1, .12, .42, [0, -.12, 0]);
    box(leg, '#608e83', [.18, .12, .35], [0, -.31, -.08]); g.add(leg); legs.push(leg);
  }
  g.userData.legs = legs;
  return g;
}
const template = statue();
const statues = [];
for (let i = 0; i < 100; i++) {
  const g = template.clone(true);
  g.userData.legs = g.children.filter((child) => child.type === 'Group');
  const lane = (i % 7 - 3) * 1.12;
  const startZ = 28 - Math.floor(i / 7) * 4.4;
  g.position.set(lane, 0, startZ);
  g.scale.setScalar(.8 + rand() * .18);
  g.rotation.y = Math.PI;
  g.userData.startZ = startZ;
  g.userData.speed = .6 + rand() * .4;
  scene.add(g); statues.push(g);
}
// Batch static scenery by material and the 100 statues by shared part geometry.
// This keeps the handmade scene small in GPU draw calls, including on mobile.
const staticGroups = new Map();
scene.updateMatrixWorld(true);
const statueMeshes = new Set();
statues.forEach((g) => g.traverse((o) => { if (o.isMesh) statueMeshes.add(o); }));
const staticMeshes = [];
scene.traverse((o) => { if (o.isMesh && !statueMeshes.has(o)) staticMeshes.push(o); });
for (const m of staticMeshes) {
  const key = m.material.uuid;
  if (!staticGroups.has(key)) staticGroups.set(key, { material: m.material, geometries: [] });
  const geometry = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
  staticGroups.get(key).geometries.push(geometry.applyMatrix4(m.matrixWorld));
  m.removeFromParent();
}
for (const { material: mat, geometries } of staticGroups.values()) {
  const merged = mergeGeometries(geometries);
  const m = new THREE.Mesh(merged, mat); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  geometries.forEach((geo) => geo.dispose());
}
const statueParts = [];
statues[0].traverse((o) => { if (o.isMesh) statueParts.push(o); });
const statuePartSources = statues.map((g) => { const parts = []; g.traverse((o) => { if (o.isMesh) { parts.push(o); o.visible = false; } }); return parts; });
const batches = statueParts.map((part) => {
  const m = new THREE.InstancedMesh(part.geometry, part.material, 100);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = true; m.receiveShadow = true;
  m.frustumCulled = false; scene.add(m); return m;
});
const views = {
  park: { position: [49, 36, 67], target: [0, 1, -12], label: '奈良公園 / PARK VIEW' },
  path: { position: [14, 9, 23], target: [0, 2, -22], label: '春日の参道 / LANTERN PATH' },
  shrine: { position: [28, 18, -22], target: [0, 3, -54], label: '朱色の社殿 / FOREST SHRINE' },
};
let currentView = 'park', transition = null, count = 100, speed = 1, paused = reducedMotion, elapsed = 0;
function chooseView(name, immediately = false) {
  const view = views[name]; currentView = name;
  $('#view-label').textContent = view.label;
  document.querySelectorAll('.place').forEach((b) => { b.classList.toggle('active', b.dataset.view === name); b.setAttribute('aria-pressed', String(b.dataset.view === name)); });
  if (immediately || reducedMotion) { camera.position.set(...view.position); controls.target.set(...view.target); transition = null; }
  else transition = { start: performance.now(), from: camera.position.clone(), targetFrom: controls.target.clone(), to: new THREE.Vector3(...view.position), targetTo: new THREE.Vector3(...view.target) };
  controls.update();
}
chooseView('park', true);
controls.addEventListener('start', () => { transition = null; });
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => chooseView(b.dataset.view)));
function updateLabel() {
  $('#count-label').textContent = count === 0 ? '鹿たちの、いつもの奈良' : `${count}体が${paused ? '休憩中' : '散歩中'}`;
  $('#pause').textContent = paused ? '▶ 散歩を再開' : 'Ⅱ 一時停止';
  $('#pause').setAttribute('aria-pressed', String(paused));
}
$('#statue-count').addEventListener('change', (e) => { count = Number(e.target.value); statues.forEach((g, i) => { g.visible = i < count; }); updateLabel(); });
$('#speed').addEventListener('input', (e) => { speed = Number(e.target.value); $('#speed-label').value = `${speed.toFixed(1)}×`; });
$('#pause').addEventListener('click', () => { paused = !paused; updateLabel(); });
$('#reset').addEventListener('click', () => chooseView(currentView));
$('#about-button').addEventListener('click', () => $('#about').showModal());
$('#close-about').addEventListener('click', () => $('#about').close());
$('#about').addEventListener('click', (e) => { if (e.target === $('#about')) { const b = e.target.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) e.target.close(); } });
updateLabel();
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); $('#error').hidden = false; $('#error').textContent = '3Dの描画が中断しました。ページを再読み込みしてください。'; });
let last = performance.now(), fpsStart = last, frames = 0;
function animate(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (!paused) {
    elapsed += dt * speed;
    for (let i = 0; i < count; i++) {
      const g = statues[i];
      g.position.z = 30 - ((30 - g.userData.startZ + elapsed * g.userData.speed) % 72);
      g.position.y = Math.abs(Math.sin(elapsed * 4 + i)) * .035;
      g.userData.legs.forEach((leg, j) => { leg.rotation.x = Math.sin(elapsed * 4 + i + j * Math.PI) * .35; });
    }
  }
  if (transition) {
    const t = Math.min((now - transition.start) / 1100, 1), smooth = t * t * (3 - 2 * t);
    camera.position.lerpVectors(transition.from, transition.to, smooth);
    controls.target.lerpVectors(transition.targetFrom, transition.targetTo, smooth);
    if (t === 1) transition = null;
  }
  controls.update();
  statues.forEach((g) => g.updateMatrixWorld(true));
  batches.forEach((batch, p) => {
    batch.count = count;
    for (let i = 0; i < count; i++) batch.setMatrixAt(i, statuePartSources[i][p].matrixWorld);
    batch.instanceMatrix.needsUpdate = true;
  });
  renderer.render(scene, camera);
  frames++;
  if (now - fpsStart > 1000) { $('#fps').textContent = `${Math.round(frames * 1000 / (now - fpsStart))} FPS`; frames = 0; fpsStart = now; }
}
renderer.setAnimationLoop(animate);
$('#loading').hidden = true;
// Bounded observability for browser acceptance checks; no credentials or personal data.
window.naraDebug = () => ({ count, paused, speed, currentView, visibleStatues: statues.filter((s) => s.visible).length, firstStatueZ: statues[0].position.z, camera: camera.position.toArray(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, webgl: renderer.capabilities.isWebGL2 });
