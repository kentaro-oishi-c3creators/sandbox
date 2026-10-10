import * as THREE from 'three';

// Original deterministic material textures, generated locally; no external image requests.
let seed = 42;
const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function canvasTexture(kind, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'); const data = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const n = (rand() - .5) * (kind === 'gravel' ? 48 : 27);
    const wave = Math.sin(x * .31 + Math.sin(y * .022) * 3) * 10 + Math.sin(y * .1) * 5;
    let r, g, b;
    if (kind === 'bark') { const streak = wave * 1.2 + Math.sin(x * 1.1) * 15; r = 72 + n + streak; g = 66 + n + streak; b = 49 + n + streak; }
    else if (kind === 'stone') { const moss = Math.max(0, Math.sin(x * .027) * Math.cos(y * .05)) * 25; r = 126 + n - moss; g = 130 + n; b = 114 + n - moss; }
    else if (kind === 'forest') { r = 67 + n; g = 79 + n; b = 44 + n; }
    else if (kind === 'asphalt') { r = 82 + n; g = 83 + n; b = 79 + n; }
    else if (kind === 'roof') { r = 59 + n + Math.sin(y * .35) * 9; g = 55 + n; b = 45 + n; }
    else { r = 167 + n; g = 157 + n; b = 132 + n; }
    data.data[i] = r; data.data[i + 1] = g; data.data[i + 2] = b; data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  if (kind === 'gravel' || kind === 'forest') {
    for (let i = 0; i < 1500; i++) {
      const x = rand() * size, y = rand() * size;
      ctx.fillStyle = kind === 'forest' ? `rgba(${100 + rand() * 40},90,40,.35)` : `rgba(${100 + rand() * 80},${100 + rand() * 70},100,.3)`;
      ctx.beginPath();ctx.ellipse(x, y, .7 + rand() * 2.5, .5 + rand() * 1.5, rand() * 3, 0, 7);ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;t.colorSpace = THREE.SRGBColorSpace;t.anisotropy = 4;return t;
}
export function materials() {
  const make = (kind, repeat, color = '#ffffff') => {
    const map = canvasTexture(kind); map.repeat.set(...repeat);
    return new THREE.MeshStandardMaterial({ map, color, bumpMap: map, bumpScale: kind === 'bark' ? .12 : .045, roughness: .96 });
  };
  return {
    bark: make('bark', [2, 4]), stone: make('stone', [1, 1]), gravel: make('gravel', [3, 3]),
    forest: make('forest', [35, 90]), road: make('asphalt', [5, 2]), roof: make('roof', [7, 3]),
    red: new THREE.MeshStandardMaterial({ color: '#a33622', roughness: .82 }),
    redLight: new THREE.MeshStandardMaterial({ color: '#b84529', roughness: .85 }),
    plaster: new THREE.MeshStandardMaterial({ color: '#ddd7be', roughness: .95 }),
    dark: new THREE.MeshStandardMaterial({ color: '#25251e', roughness: .9 }),
    wood: new THREE.MeshStandardMaterial({ color: '#6c5133', roughness: .92 }),
    gold: new THREE.MeshStandardMaterial({ color: '#b49c61', metalness: .4, roughness: .65 }),
    moss: new THREE.MeshStandardMaterial({ color: '#4a5a31', roughness: 1 }),
  };
}
export function foliageTexture() {
  const c = document.createElement('canvas');c.width = c.height = 128; const ctx = c.getContext('2d');
  for (let i = 0; i < 65; i++) {
    const x = 15 + rand() * 98, y = 14 + rand() * 99;
    ctx.fillStyle = `rgb(${38 + rand() * 30},${61 + rand() * 42},${30 + rand() * 27})`;
    ctx.beginPath();ctx.ellipse(x, y, 5 + rand() * 9, 2 + rand() * 5, rand() * 6.3, 0, 6.3);ctx.fill();
    ctx.strokeStyle = '#72904a66';ctx.beginPath();ctx.moveTo(x - 4,y);ctx.lineTo(x + 4,y);ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);t.colorSpace = THREE.SRGBColorSpace;return t;
}
