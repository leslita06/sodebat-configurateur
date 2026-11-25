/* SODEBAT : cabine d'ascenseur en 3D (three.js r160). Modèle original construit pour SODEBAT ; matières Poly Haven (CC0). */
import * as THREE from 'three';
import { OrbitControls } from './assets/vendor/OrbitControls.js';
import { GLTFLoader } from './assets/vendor/GLTFLoader.js';
import { RGBELoader } from './assets/vendor/RGBELoader.js';

const $ = s => document.querySelector(s);
const T = 'assets/tex/';

const PAROIS = {
  inox: { t: 'Inox brossé', sw: 'linear-gradient(135deg,#d9dcdf,#9aa0a6 55%,#e6e8ea)', tier: 'inox' },
  champagne: { t: 'Inox champagne', sw: 'linear-gradient(135deg,#e9d3b0,#b8946a 55%,#f0dfc4)', tier: 'premium' },
  noyer: { t: 'Noyer', sw: `url(${T}noyer_diff.jpg)`, tier: 'premium' },
  chene: { t: 'Chêne clair', sw: `url(${T}chene_diff.jpg)`, tier: 'premium' },
  verre: { t: 'Verre fumé', sw: 'linear-gradient(135deg,#3a4656,#141a22 60%,#4b5869)', tier: 'premium' },
  blanc: { t: 'Blanc satiné', sw: 'linear-gradient(135deg,#f3f4f6,#d7dadf)', tier: 'std' },
};
const SOLS = {
  granit: { t: 'Granit', sw: `url(${T}granit_diff.jpg)` },
  pierre: { t: 'Pierre claire', sw: `url(${T}pierre_diff.jpg)` },
  caoutchouc: { t: 'Caoutchouc', sw: `url(${T}caoutchouc_diff.jpg)` },
  bois: { t: 'Parquet', sw: `url(${T}bois_diff.jpg)` },
};
const LUMS = { dalle: 'Dalle', ruban: 'Ruban', spot: 'Spots' };
const MAINS = { inox: 'Inox', or: 'Laiton', noir: 'Noir mat' };
const AMB = [
  { k: 'noyer', t: 'Noyer et inox', c: { paroi: 'noyer', fond: 'inox', sol: 'pierre', lum: 'ruban', main: 'inox' } },
  { k: 'inox', t: 'Inox et granit', c: { paroi: 'inox', sol: 'granit', lum: 'dalle', main: 'inox' } },
  { k: 'verre', t: 'Verre fumé', c: { paroi: 'verre', sol: 'pierre', lum: 'spot', main: 'or' } },
  { k: 'champagne', t: 'Champagne', c: { paroi: 'champagne', sol: 'granit', lum: 'spot', main: 'or' } },
  { k: 'chene', t: 'Chêne clair', c: { paroi: 'chene', sol: 'bois', lum: 'ruban', main: 'inox' } },
  { k: 'sante', t: 'Santé', c: { paroi: 'blanc', sol: 'caoutchouc', lum: 'dalle', main: 'inox' } },
];
let cfg = { ...AMB[0].c };

/* ---------- Interface ---------- */
const btn = (g, k, inner, on) => `<button type="button" data-o="${g}" data-k="${k}" aria-pressed="${on}">${inner}</button>`;
function ui() {
  $('#o-amb').innerHTML = AMB.map(a => btn('amb', a.k, `<img src="assets/img/ambiance-${a.k}.jpg" alt="" loading="lazy"><span>${a.t}</span>`, false)).join('');
  $('#o-par').innerHTML = Object.entries(PAROIS).map(([k, v]) => btn('paroi', k, `<i style="background-image:${v.sw}"></i>${v.t}`, false)).join('');
  $('#o-sol').innerHTML = Object.entries(SOLS).map(([k, v]) => btn('sol', k, `<i style="background-image:${v.sw}"></i>${v.t}`, false)).join('');
  $('#o-lum').innerHTML = Object.entries(LUMS).map(([k, v]) => btn('lum', k, v, false)).join('');
  $('#o-main').innerHTML = Object.entries(MAINS).map(([k, v]) => btn('main', k, v, false)).join('');
  sync();
}
function ambOf(c) { return AMB.find(a => Object.entries(a.c).every(([k, v]) => c[k] === v) && (!!c.fond === !!a.c.fond)); }
function label(c) { return `${PAROIS[c.paroi].t}${c.fond ? ', fond ' + PAROIS[c.fond].t.toLowerCase() : ''}, sol ${SOLS[c.sol].t.toLowerCase()}, ${LUMS[c.lum].toLowerCase()}`; }
function sync() {
  const a = ambOf(cfg);
  document.querySelectorAll('[data-o]').forEach(b => {
    const g = b.dataset.o, k = b.dataset.k;
    b.setAttribute('aria-pressed', g === 'amb' ? (a && a.k === k) : cfg[g] === k);
  });
  $('#st-tag').textContent = label(cfg);
  $('#v-photo').style.display = a ? '' : 'none';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-o]'); if (!b) return;
  const g = b.dataset.o, k = b.dataset.k;
  if (g === 'amb') cfg = { ...AMB.find(a => a.k === k).c };
  else { cfg[g] = k; if (g === 'paroi') delete cfg.fond; }
  sync(); apply(); closePhoto();
});
$('#v-photo').addEventListener('click', () => {
  const a = ambOf(cfg); if (!a) return;
  $('#ph-img').src = `assets/img/ambiance-${a.k}.jpg`; $('#ph-img').alt = 'Rendu photoréaliste : ' + a.t; $('#ph').hidden = false;
});
function closePhoto() { $('#ph').hidden = true; }
$('#ph-x').addEventListener('click', closePhoto);
$('#use-fin').addEventListener('click', () => {
  const a = ambOf(cfg);
  window.dispatchEvent(new CustomEvent('sodebat:finitions', { detail: { tier: PAROIS[cfg.paroi].tier, label: label(cfg), img: `ambiance-${(a || AMB.find(x => x.c.paroi === cfg.paroi) || AMB[0]).k}.jpg` } }));
});
ui();

/* ---------- Scène ---------- */
const canvas = $('#c3d');
let gl = null;
try { gl = canvas.getContext('webgl2') || canvas.getContext('webgl'); } catch (e) { }
if (!gl) {
  // Sans 3D (ancien navigateur) : on montre le rendu photo de l'ambiance.
  $('#st-load').classList.add('off');
  const a = ambOf(cfg) || AMB[0];
  $('#ph-img').src = `assets/img/ambiance-${a.k}.jpg`; $('#ph').hidden = false; $('#ph-x').style.display = 'none';
  document.addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (!b) return; const x = ambOf(cfg) || AMB.find(y => y.c.paroi === cfg.paroi) || AMB[0]; $('#ph-img').src = `assets/img/ambiance-${x.k}.jpg`; $('#ph').hidden = false; });
  throw new Error('no-webgl');
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#E4E9F0');
const cam = new THREE.PerspectiveCamera(42, 1, 0.05, 50);
// Le modèle est en mètres ; ouverture de porte côté +z, cabine 1,10 × 1,40 × 2,20 m.
const TGT = new THREE.Vector3(0.55, 1.10, -0.70);
cam.position.set(0.25, 1.30, 3.45);
const ctl = new OrbitControls(cam, canvas);
ctl.target.copy(TGT);
ctl.enableDamping = true; ctl.dampingFactor = 0.08;
ctl.enablePan = false;
ctl.minDistance = 2.2; ctl.maxDistance = 5.0;
ctl.minPolarAngle = Math.PI * 0.30; ctl.maxPolarAngle = Math.PI * 0.56;
ctl.minAzimuthAngle = -0.6; ctl.maxAzimuthAngle = 0.6;
$('#v-face').addEventListener('click', () => { cam.position.set(0.25, 1.30, 3.45); ctl.target.copy(TGT); ctl.update(); });

const tl = new THREE.TextureLoader();
const texCache = {};
function tex(n, srgb, rep = 1) {
  const key = n + rep; if (texCache[key]) return texCache[key];
  const t = tl.load(T + n); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return (texCache[key] = t);
}
const M = THREE.MeshPhysicalMaterial;
const inox = () => new M({ color: '#bfc6cd', metalness: 1, roughness: 0.38, roughnessMap: tex('inox_rough.jpg'), normalMap: tex('inox_nor.jpg'), normalScale: new THREE.Vector2(0.15, 0.15), anisotropy: 0.6 });
const MATS = {
  inox, champagne: () => new M({ color: '#dcb98f', metalness: 1, roughness: 0.3, roughnessMap: tex('inox_rough.jpg'), normalMap: tex('inox_nor.jpg'), normalScale: new THREE.Vector2(0.15, 0.15), anisotropy: 0.6 }),
  noyer: () => new M({ map: tex('noyer_diff.jpg', 1), roughnessMap: tex('noyer_rough.jpg'), normalMap: tex('noyer_nor.jpg'), roughness: 0.85, specularIntensity: 0.25, envMapIntensity: 0.5 }),
  chene: () => new M({ map: tex('chene_diff.jpg', 1), roughnessMap: tex('chene_rough.jpg'), normalMap: tex('chene_nor.jpg'), roughness: 0.85, specularIntensity: 0.25, envMapIntensity: 0.5 }),
  verre: () => new M({ color: '#1c2430', roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.9 }),
  blanc: () => new M({ color: '#e4e6e9', roughness: 0.5, clearcoat: 0.1 }),
  granit: () => new M({ map: tex('granit_diff.jpg', 1), roughnessMap: tex('granit_rough.jpg'), normalMap: tex('granit_nor.jpg'), roughness: 0.6 }),
  pierre: () => new M({ map: tex('pierre_diff.jpg', 1), roughnessMap: tex('pierre_rough.jpg'), normalMap: tex('pierre_nor.jpg'), roughness: 0.5 }),
  caoutchouc: () => new M({ map: tex('caoutchouc_diff.jpg', 1), roughnessMap: tex('caoutchouc_rough.jpg'), normalMap: tex('caoutchouc_nor.jpg'), roughness: 0.9 }),
  bois: () => new M({ map: tex('bois_diff.jpg', 1), roughnessMap: tex('bois_rough.jpg'), normalMap: tex('bois_nor.jpg'), roughness: 0.7, clearcoat: 0.3 }),
};
const matCache = {};
const mat = k => matCache[k] || (matCache[k] = MATS[k]());
const MAINM = { inox: () => mat('inox'), or: () => mat('champagne'), noir: () => matCache.noir || (matCache.noir = new M({ color: '#151515', roughness: 0.45, metalness: 0.3 })) };
const FIX = {
  cadre: mat('inox'), seuil: new M({ color: '#b8babd', metalness: 1, roughness: 0.45 }), joint: new M({ color: '#08080a', roughness: 0.8 }),
  coque: new M({ color: '#2B2F36', roughness: 0.6 }), plafond: new M({ color: '#eceef1', roughness: 0.6 }),
  miroir: new M({ color: '#f4f4f4', metalness: 1, roughness: 0.03 }),
  anneau: new THREE.MeshStandardMaterial({ color: '#1d4f8a', emissive: '#38B6FF', emissiveIntensity: 2.2 }),
  ecran: new THREE.MeshBasicMaterial({ map: tex('display.jpg', 1) }),
};
const LUMC = { dalle: '#fff6ea', ruban: '#ffdcae', spot: '#ffeacc' };

const parts = {};
const roleOf = n => {
  if (n.startsWith('paroi_fond')) return 'fond';
  if (n.startsWith('paroi')) return 'paroi';
  if (n.startsWith('lum_dalle')) return 'lum_dalle';
  if (n.startsWith('lum_ruban')) return 'lum_ruban';
  if (n.startsWith('lum_spot')) return 'lum_spot';
  if (n.startsWith('main')) return 'main';
  if (n.startsWith('bouton_anneau') || n.startsWith('bp_anneau')) return 'anneau';
  if (n.startsWith('bouton') || n.startsWith('bp_')) return 'bouton';
  if (n === 'cop_ecran') return 'ecran';
  if (/^(plinthe|retour|imposte|montant|cop|bp_plaque)/.test(n)) return 'cadre';
  if (n.startsWith('fond_joint')) return 'joint';
  if (n.startsWith('seuil')) return 'seuil';
  if (n.startsWith('coque')) return 'coque';
  return n.split('_')[0];
};
const lights = {};
function setupLights() {
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b2a6', 0.35));
  const fill = new THREE.DirectionalLight('#ffffff', 0.6); fill.position.set(0.6, 2.2, 3.5); fill.target.position.copy(TGT); scene.add(fill, fill.target);
  const top = new THREE.PointLight('#fff6ea', 2.4, 4, 1.6); top.position.set(0.55, 2.1, -0.72); scene.add(top); lights.top = top;
  lights.spots = [];
  for (const [x, z] of [[0.3, -0.35], [0.8, -0.35], [0.3, -1.05], [0.8, -1.05]]) {
    const s = new THREE.SpotLight('#ffeacc', 3.2, 3.5, 0.75, 0.6, 1.4); s.position.set(x, 2.17, z); s.target.position.set(x, 0, z); scene.add(s, s.target); lights.spots.push(s);
  }
}
function apply() {
  if (!parts.paroi) return;
  const pm = mat(cfg.paroi), fm = mat(cfg.fond || cfg.paroi);
  parts.paroi.forEach(m => m.material = pm);
  (parts.fond || []).forEach(m => m.material = fm);
  (parts.sol || []).forEach(m => m.material = mat(cfg.sol));
  (parts.main || []).forEach(m => m.material = MAINM[cfg.main]());
  for (const k of ['dalle', 'ruban', 'spot']) {
    (parts['lum_' + k] || []).forEach(m => { m.visible = cfg.lum === k; m.material = new THREE.MeshBasicMaterial({ color: LUMC[k] }); });
  }
  lights.top.color.set(LUMC[cfg.lum]);
  lights.top.intensity = cfg.lum === 'dalle' ? 1.8 : cfg.lum === 'ruban' ? 1.1 : 0.5;
  lights.spots.forEach(s => { s.visible = cfg.lum === 'spot'; });
  scene.environmentIntensity = cfg.lum === 'spot' ? 0.75 : 0.9;
}

setupLights();
new RGBELoader().load('assets/3d/hall.hdr', hdr => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(hdr).texture; hdr.dispose();
});
new GLTFLoader().load('assets/3d/cabine.glb', g => {
  g.scene.traverse(o => {
    if (!o.isMesh) return;
    const r = roleOf(o.name);
    (parts[r] = parts[r] || []).push(o);
    if (FIX[r]) o.material = FIX[r];
    if (r === 'bouton') o.material = mat('inox');
  });
  scene.add(g.scene);
  apply();
  $('#st-load').classList.add('off');
  window.__CABINE_OK = true;
}, undefined, () => { $('#st-load').innerHTML = 'La cabine 3D n\'a pas pu se charger.'; });

function size() {
  const r = canvas.parentElement.getBoundingClientRect();
  if (!r.width) return;
  renderer.setSize(r.width, r.height, false);
  cam.aspect = r.width / r.height;
  cam.fov = cam.aspect < 0.8 ? 58 : 44;
  cam.updateProjectionMatrix();
}
addEventListener('resize', size);
window.addEventListener('sodebat:tab', () => requestAnimationFrame(size));
size();
(function loop() { requestAnimationFrame(loop); if (!canvas.offsetParent) return; ctl.update(); renderer.render(scene, cam); })();
window.__setCabine = (c) => { cfg = { ...c }; sync(); apply(); };
