import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import './style.css';
import { createBaseKit, KIT_THEMES, type KitTheme } from './baseKit';

// All imported assets stay in this standalone study, outside the app's public directory.
import sandColorUrl from './assets/sand/compact/diff.webp?url';
import sandNormalUrl from './assets/sand/compact/nor_gl.webp?url';
import sandRoughUrl from './assets/sand/compact/rough.webp?url';
import assetReport from './assets/light/report.json';
import sandReport from './assets/sand/compact/report.json';

const host = document.querySelector<HTMLElement>('#scene')!;
const loading = document.querySelector<HTMLElement>('#loading')!;
const label = document.querySelector<HTMLElement>('#loading-label')!;
const qualityInfo = document.querySelector<HTMLElement>('#quality-info')!;
type Quality = 'full';
const localAsset = (name: string) => new URL(`./assets/light/${name}.gltf`, document.baseURI).href;
const treeLabel = (name: 'tree-full') => {
  const model = assetReport.models[name];
  return `Árvore: ${Math.round(model.totalBytes / 1000)} KB · ${(model.triangles / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil triângulos`;
};
const profiles = {
  full: { tree: localAsset('tree-full'), rock: localAsset('rock-light'), segments: 0, label: treeLabel('tree-full') },
};
const modelCache = new Map<Quality, Promise<[T.Group, T.Group]>>();
const assetCache = new Map<string, Promise<T.Group>>();
const compositionSelect = document.querySelector<HTMLSelectElement>('#composition')!;
const metrics = document.querySelector<HTMLOutputElement>('#metrics')!;
const sharingInfo = document.querySelector<HTMLElement>('#sharing-info')!;
let grove: T.Group | undefined;
let composition = 'kit';
const kitCache = new Map<KitTheme, T.Group>();
let kitTheme: KitTheme = 'serene';
const themeSelect = document.querySelector<HTMLSelectElement>('#kit-theme')!;
let activeKit: T.Group | undefined;
let activeModels: T.Group[] = [];
let sandPatch: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial> | undefined;
let disposed = false;
const scene = new T.Scene();
scene.background = new T.Color('#e5dfce');
scene.fog = new T.Fog('#e5dfce', 24, 68);
const camera = new T.PerspectiveCamera(39, innerWidth / innerHeight, .1, 110);
const renderer = (() => {
  try { return new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (error) {
    label.textContent = 'Este estudo precisa de WebGL. Ative a aceleração gráfica e recarregue a página.';
    loading.querySelector('.pulse')?.remove();
    throw error;
  }
})();
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
host.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
let needsRender = true;
let settleFrames = 0;
controls.addEventListener('change', () => { needsRender = true; });
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.minDistance = 2;
controls.maxDistance = 24;
controls.maxPolarAngle = Math.PI * .47;
controls.minPolarAngle = .15;
controls.target.set(0, 1.3, 0);
controls.autoRotateSpeed = .65;
const motionButton = document.querySelector<HTMLButtonElement>('#motion-test')!;
const fpsOutput = document.querySelector<HTMLOutputElement>('#fps')!;
motionButton.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  motionButton.setAttribute('aria-pressed', String(controls.autoRotate));
  motionButton.textContent = controls.autoRotate ? 'Parar movimento' : 'Testar movimento';
  needsRender = true;
});
const hemisphere = new T.HemisphereLight('#e5eff7', '#b1a185', 2.2);
scene.add(hemisphere);
const sun = new T.DirectionalLight('#fff0d5', 3.2);
sun.position.set(-6, 9, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: .5, far: 58 });
sun.shadow.normalBias = .025;
sun.shadow.bias = -.00015;
sun.shadow.radius = 3;
scene.add(sun);
const fill = new T.DirectionalLight('#c5dddf', .8);
fill.position.set(5, 5, -5);
scene.add(fill);

const targets = {
  all: { position: [10, 7.2, 13], target: [0, 1.35, 0] },
  tree: { position: [4, 3.3, 7.6], target: [-1.8, 2.65, -.7] },
  rock: { position: [5.5, 2.5, 5.8], target: [2, .8, .9] },
  sand: { position: [3.8, 2.3, 6.2], target: [.9, .1, 1.8] },
  water: { position: [6.3, 4.7, 8], target: [2,.15,1.5] },
  details: { position: [4, 3.4, 5.6], target: [0,1,.05] },
} satisfies Record<string, { position: number[]; target: number[] }>;
type View = keyof typeof targets;
let transition: { from: T.Vector3; aim: T.Vector3; to: T.Vector3; target: T.Vector3; start: number } | null = null;
let aerial = true;
const aerialIntro = document.querySelector<HTMLElement>('#aerial-intro')!;
const enterGarden = document.querySelector<HTMLButtonElement>('#enter-garden')!;
function showAerial() {
  aerial = true;
  aerialIntro.hidden = false;
  controls.autoRotate = true;
  motionButton.setAttribute('aria-pressed', 'true');
  motionButton.textContent = 'Parar movimento';
  camera.position.set(18, 16, 24);
  controls.target.set(0, 0, 0);
  controls.maxDistance = 50;
  controls.update();
  needsRender = true;
}
function enterGardenView() {
  aerial = false;
  aerialIntro.hidden = true;
  controls.autoRotate = false;
  motionButton.setAttribute('aria-pressed', 'false');
  motionButton.textContent = 'Testar movimento';
  setView('all');
}
enterGarden.addEventListener('click', enterGardenView);
function setView(view: View, instant = false) {
  if (aerial) { aerial = false; aerialIntro.hidden = true; controls.autoRotate = false; }
  document.body.dataset.view = view;
  const preset = targets[view];
  const to = new T.Vector3(...preset.position);
  if (innerWidth < 650 && view === 'all') to.set(12, 8.5, 18);
  const target = new T.Vector3(...preset.target);
  if (view === 'all' && composition === 'grove') {
    target.set(0, 2, 0);
    if (innerWidth < 650) to.set(24, 18, 35); else to.set(16, 12, 20);
  }
  if (composition === 'kit') {
    if (view === 'all') { target.set(0,1.4,0); if(innerWidth<650)to.set(18,17,25);else to.set(12,11,16); }
    if (view === 'tree') { target.set(-2.7,2.7,-1.4); to.set(3.5,4,7); }
    if (view === 'rock') { target.set(-3.3,.8,2.6); to.set(1.2,3.2,7.8); }
  }
  if (instant) { camera.position.copy(to); controls.target.copy(target); controls.update(); }
  else transition = { from: camera.position.clone(), aim: controls.target.clone(), to, target, start: performance.now() };
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view as View)));
document.querySelector('#reset')!.addEventListener('click', () => setView('all'));
controls.addEventListener('start', () => { transition = null; });
document.querySelector<HTMLInputElement>('#light')!.addEventListener('input', event => {
  const amount = Number((event.target as HTMLInputElement).value);
  sun.position.set(-7 + amount * 11, 11 - amount * 6, 5);
  sun.color.set('#fff5e4').lerp(new T.Color('#ffcc8d'), amount);
  sun.intensity = 3.4 - amount * .7;
  needsRender = true;
});
showAerial();

function normalizeModel(root: T.Group, dimension: 'x' | 'y', size: number, position: T.Vector3) {
  const bounds = new T.Box3().setFromObject(root);
  const extents = bounds.getSize(new T.Vector3());
  const center = bounds.getCenter(new T.Vector3());
  const scale = size / extents[dimension];
  root.scale.multiplyScalar(scale);
  root.position.set(position.x - center.x * scale, position.y - bounds.min.y * scale, position.z - center.z * scale);
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (!(material instanceof T.MeshStandardMaterial)) return;
      material.envMapIntensity = .5;
      for (const map of [material.map, material.normalMap, material.roughnessMap]) if (map) map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    });
  });
  return root;
}

// One loader shares decoded images across separate glTF files through its image cache.
// One asset promise per URL avoids reloading the rock when switching tree quality.
T.Cache.enabled = true;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const sharedTextures = new Map<string, T.Texture>();
function loadModel(url: string): Promise<T.Group> {
  const cached = assetCache.get(url);
  if (cached) return cached;
  const pending = loader.loadAsync(url).then(gltf => {
    if (url.includes('/assets/light/')) gltf.scene.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!(material instanceof T.MeshStandardMaterial)) continue;
        for (const slot of ['map', 'normalMap', 'roughnessMap', 'metalnessMap'] as const) {
          const texture: T.Texture | null = material[slot];
          if (!texture) continue;
          // Include transform and color space: the same pixels can have different sampling.
          const textureIndex: number | undefined = gltf.parser.associations.get(texture)?.textures;
          const definition: { source?: number; extensions?: { EXT_texture_webp?: { source: number } } } | undefined = gltf.parser.json.textures[textureIndex!];
          const source = definition?.extensions?.EXT_texture_webp?.source ?? definition?.source;
          const uri: string | undefined = source === undefined ? undefined : gltf.parser.json.images[source]?.uri;
          if (!uri) continue;
          const key = `${uri}|${texture.colorSpace}|${texture.offset.toArray()}|${texture.repeat.toArray()}|${texture.rotation}|${texture.wrapS}|${texture.wrapT}`;
          const shared = sharedTextures.get(key);
          if (shared && shared !== texture) { material[slot] = shared; texture.dispose(); }
          else sharedTextures.set(key, texture);
        }
        if (material.alphaTest > 0) material.alphaToCoverage = true;
      }
    });
    if (disposed) { releaseObject(gltf.scene); sharedTextures.clear(); T.Cache.clear(); }
    return gltf.scene;
  }).catch(error => { assetCache.delete(url); throw error; });
  assetCache.set(url, pending);
  return pending;
}
function getModels(quality: Quality): Promise<[T.Group, T.Group]> {
  const cached = modelCache.get(quality);
  if (cached) return cached;
  const profile = profiles[quality];
  const pending = Promise.all([loadModel(profile.tree), loadModel(profile.rock)]).then(([tree, rock]): [T.Group, T.Group] => [
    normalizeModel(tree.clone(true), 'y', 5.8, new T.Vector3(-1.85, -.025, -.8)),
    normalizeModel(rock.clone(true), 'x', 2.65, new T.Vector3(2, -.12, .9)),
  ]).catch(error => { modelCache.delete(quality); throw error; });
  modelCache.set(quality, pending);
  return pending;
}

// Concentrate geometry where the ridges exist; the rest is the shared flat ground.
function createRingSand() {
  const radial = 96, angular = 128;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (let r = 0; r <= radial; r++) for (let a = 0; a <= angular; a++) {
    const distance = 1.15 + r / radial * (4.8 - 1.15), angle = a / angular * Math.PI * 2;
    const x = 2 + Math.cos(angle) * distance / .91, z = .9 + Math.sin(angle) * distance;
    const edge = T.MathUtils.smoothstep(distance, 1.15, 1.5) * (1 - T.MathUtils.smoothstep(distance, 3.8, 4.8));
    const ring = Math.sin(distance * 25 + Math.sin(Math.atan2(z - .9, x - 2) * 3) * .22);
    positions.push(x, -.034 + (ring * .017 + .020) * edge, z);
    uvs.push((x + 7.5) / 15, (7.5 - z) / 15);
    if (r < radial && a < angular) { const i = r * (angular + 1) + a; indices.push(i, i + 1, i + angular + 1, i + 1, i + angular + 2, i + angular + 1); }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

// Each mesh primitive is rendered as one batch, using its original geometry/material.
function instanceModel(root: T.Group, variants: { p: number[]; s: number[]; r: number; tint: string }[], foliageOnly: boolean) {
  const group = new T.Group();
  root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root), center = bounds.getCenter(new T.Vector3());
  const origin = new T.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z);
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    const mesh = new T.InstancedMesh(object.geometry, object.material, variants.length);
    const leaf = !Array.isArray(object.material) && object.material.name.includes('leaves');
    variants.forEach((variant, i) => {
      const matrix = new T.Matrix4().compose(new T.Vector3(...variant.p), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), variant.r), new T.Vector3(...variant.s));
      mesh.setMatrixAt(i, matrix.multiply(origin).multiply(object.matrixWorld));
      mesh.setColorAt(i, new T.Color(foliageOnly && !leaf ? '#ffffff' : variant.tint));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.computeBoundingSphere(); group.add(mesh);
  });
  return group;
}
function clearGrove() {
  if (!grove) return;
  scene.remove(grove);
  // Instance buffers belong to the grove; geometry/materials still belong to the cache.
  grove.traverse(object => { if (object instanceof T.InstancedMesh) object.dispose(); });
  grove = undefined;
}
function showComposition() {
  clearGrove();
  if (activeKit) scene.remove(activeKit);
  controls.maxDistance = composition === 'single' ? 24 : 50;
  activeModels.forEach(model => { scene.remove(model); });
  if (composition === 'single') activeModels.forEach(model => scene.add(model));
  else if (composition === 'kit') {
    activeKit = kitCache.get(kitTheme);
    if (!activeKit) { activeKit = createBaseKit(activeModels[0],activeModels[1],instanceModel,kitTheme);kitCache.set(kitTheme,activeKit); }
    scene.add(activeKit);
  }
  else {
    grove = new T.Group();
    grove.add(instanceModel(activeModels[0], [
      { p: [-4,0,-3], s: [.74,.9,.8], r: .4, tint: '#ffffff' },
      { p: [0,0,-4], s: [1.02,.8,.95], r: 1.8, tint: '#d5bb78' },
      { p: [4,0,-3], s: [.64,1,.68], r: 2.7, tint: '#c4d9a8' },
      { p: [-4.4,0,1.6], s: [.74,.62,.8], r: 3.6, tint: '#e7b58f' },
      { p: [.2,0,.4], s: [.8,.72,.68], r: 4.4, tint: '#ffffff' },
      { p: [4.6,0,1.8], s: [.66,.6,.8], r: 5.1, tint: '#b4cca0' },
    ], true));
    grove.add(instanceModel(activeModels[1], Array.from({ length: 9 }, (_, i) => ({
      p: [-5 + i % 5 * 2.3, 0, 3.8 + Math.floor(i / 5) * 1.8],
      s: [.25 + i % 3 * .15, .23 + i % 4 * .1, .3 + i % 2 * .25], r: i * 1.3,
      tint: ['#ffffff', '#d4d6c8', '#bfc6cd'][i % 3],
    })), false));
    scene.add(grove);
  }
  sharingInfo.textContent = composition === 'kit' ? `${KIT_THEMES[kitTheme].name} · ${kitTheme==='serene'?'totem de pedras':kitTheme==='luxury'?'guardião do pátio':'relicário de ametista'}. Mesmas bases, materiais compartilhados.` : composition === 'grove' ? '6 árvores + 9 pedras · mesmos 2 modelos carregados.' : 'Variações compartilham malhas e texturas.';
  document.querySelector('header h1')!.innerHTML = composition === 'kit' ? 'O começo<br>da calma.' : 'Um lugar<br>para respirar.';
  document.querySelector('header p')!.textContent = composition === 'kit' ? `COLEÇÃO / ${KIT_THEMES[kitTheme].name.toLocaleUpperCase('pt-BR')}` : 'Areia, árvore e pedra. Um estudo de luz e natureza.';
  if (sandPatch) sandPatch.visible = composition !== 'kit';
  document.body.dataset.composition = composition;
  document.querySelector<HTMLButtonElement>('[data-view="rock"]')!.textContent = composition === 'kit' ? 'Peça exclusiva' : 'A pedra';
  needsRender = true;
  // Reflection-map preparation can reset renderer statistics during its first frame.
  // One settled frame restores both the final image and representative scene counters.
  settleFrames = 2;
}
compositionSelect.addEventListener('change', () => {
  composition = compositionSelect.value; showComposition();
  setView('all');
});
themeSelect.addEventListener('change',()=>{kitTheme=themeSelect.value as KitTheme;showComposition();});

async function createGarden() {
  const manager = new T.LoadingManager();
  manager.onProgress = (_url, done, total) => { label.textContent = `Preparando materiais · ${Math.round(done / total * 100)}%`; };
  const texture = new T.TextureLoader(manager);
  const [models, albedo, normal, roughness] = await Promise.all([
    getModels('full'), texture.loadAsync(sandColorUrl), texture.loadAsync(sandNormalUrl), texture.loadAsync(sandRoughUrl),
  ]);
  if (disposed) { models.forEach(releaseObject); [albedo, normal, roughness].forEach(map => map.dispose()); return; }
  activeModels = models;
  models.forEach(model => scene.add(model));
  [albedo, normal, roughness].forEach(map => {
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.repeat.set(85, 85);
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  });
  albedo.colorSpace = T.SRGBColorSpace;
  const sandMaterial = (colorMap: T.Texture, normalMap: T.Texture, roughnessMap: T.Texture) => {
    const material = new T.MeshStandardMaterial({ map: colorMap, normalMap, normalScale: new T.Vector2(.19, .19), roughnessMap, roughness: 1 });
    // Keep photographic microdetail without large muddy patches overwhelming the scene.
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        float grainLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        diffuseColor.rgb = vec3(0.68, 0.61, 0.48) * (0.86 + grainLuma * 0.25);
      `);
    };
    return material;
  };
  const ground = new T.Mesh(new T.PlaneGeometry(150, 150), sandMaterial(albedo, normal, roughness));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.035;
  ground.receiveShadow = true;
  scene.add(ground);

  // Actual shallow ridges catch light; their ends fade smoothly into the textured sand.
  const patch = createRingSand();
  const patchColor = albedo.clone(), patchNormal = normal.clone(), patchRough = roughness.clone();
  [patchColor, patchNormal, patchRough].forEach(map => { map.repeat.set(8.5, 8.5); });
  const sand = new T.Mesh(patch, sandMaterial(patchColor, patchNormal, patchRough));
  sand.receiveShadow = true;
  sandPatch = sand;
  scene.add(sand);
  showComposition();
  showAerial();

  label.textContent = 'Jardim pronto';
  loading.classList.add('ready');
  loading.setAttribute('aria-hidden', 'true');
  compositionSelect.disabled = false;
  themeSelect.disabled = false;
  qualityInfo.textContent = profiles.full.label;
  needsRender = true;
}
createGarden().catch(error => {
  if (disposed) return;
  console.error('Não foi possível carregar o estudo do jardim:', error);
  label.textContent = 'Não foi possível carregar os materiais. Recarregue a página para tentar novamente.';
  loading.querySelector('.pulse')?.remove();
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  needsRender = true;
});
let lastSample = performance.now(), renderedFrames = 0;
renderer.setAnimationLoop(() => {
  if (document.hidden || disposed) return;
  if (transition) {
    const t = Math.min(1, (performance.now() - transition.start) / 1100);
    const eased = t * t * (3 - 2 * t);
    camera.position.lerpVectors(transition.from, transition.to, eased);
    controls.target.lerpVectors(transition.aim, transition.target, eased);
    if (t === 1) transition = null;
  }
  controls.update();
  if (scene.fog instanceof T.Fog) {
    scene.fog.near = Math.max(24, camera.position.distanceTo(controls.target) + 12);
    scene.fog.far = scene.fog.near + 44;
  }
  if (needsRender || settleFrames > 0) { renderer.render(scene, camera); needsRender = false; settleFrames = Math.max(0,settleFrames-1); renderedFrames++; }
  const now = performance.now();
  if (now - lastSample >= 1000) {
    fpsOutput.textContent = renderedFrames < 3 ? 'Em repouso' : `${Math.round(renderedFrames * 1000 / (now - lastSample))} FPS`;
    lastSample = now;
    renderedFrames = 0;
    const treeReport = assetReport.models['tree-full'];
    metrics.textContent = `${renderer.info.render.triangles.toLocaleString('pt-BR')} triângulos desenhados (inclui sombras)\n${renderer.info.render.calls} chamadas de desenho\n${renderer.info.memory.geometries} geometrias / ${renderer.info.memory.textures} texturas na GPU${treeReport ? `\nÁrvore + pedra: ${((treeReport.totalBytes + assetReport.models['rock-light'].totalBytes) / 1000).toFixed(0)} KB únicos` : ''}\nAreia: ${Math.round(sandReport.totalBytes / 1000)} KB de texturas\nGeometrias das composições ficam em cache até fechar.`;
  }
});

const released = new WeakSet<object>();
function releaseObject(root: T.Object3D) {
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    if (!released.has(object.geometry)) { object.geometry.dispose(); released.add(object.geometry); }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (released.has(material)) return;
      for (const value of Object.values(material)) {
        if (value instanceof T.Texture && !released.has(value)) {
          value.dispose();
          if (typeof ImageBitmap !== 'undefined' && value.image instanceof ImageBitmap) value.image.close();
          released.add(value);
        }
      }
      material.dispose(); released.add(material);
    });
  });
}
function disposeGarden() {
  if (disposed) return;
  disposed = true;
  renderer.setAnimationLoop(null);
  controls.dispose();
  clearGrove();
  if (activeKit) scene.remove(activeKit);
  kitCache.forEach(kit => kit.userData.dispose());
  kitCache.clear();
  releaseObject(scene);
  modelCache.forEach(pending => { void pending.then(models => models.forEach(releaseObject)).catch(() => undefined); });
  modelCache.clear();
  assetCache.forEach(pending => { void pending.then(releaseObject).catch(() => undefined); });
  assetCache.clear();
  sharedTextures.clear();
  T.Cache.clear();
  sun.shadow.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
}
addEventListener('message', event => {
  if (window.parent === window || event.source !== window.parent || event.origin !== location.origin) return;
  if (event.data?.type === 'glyph-experiment-dispose') {
    disposeGarden();
    window.parent.postMessage({ type: 'glyph-experiment-disposed' }, location.origin);
  }
});
addEventListener('keydown', event => {
  if (event.key === 'Escape' && window.parent !== window) window.parent.postMessage({ type: 'glyph-experiment-exit' }, location.origin);
});
addEventListener('pagehide', disposeGarden, { once: true });
