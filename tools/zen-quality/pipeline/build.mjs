import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, weld, simplifyPrimitive, prune, dedup, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, writeFile, stat, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const assets = fileURLToPath(new URL('../assets/', import.meta.url));
const output = `${assets}/light`;
await mkdir(output, { recursive: true });
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});

// Recover individual leaves by connectivity, including duplicated vertices at UV seams.
function leafGroups(prim) {
  const pos = prim.getAttribute('POSITION').getArray();
  const indices = prim.getIndices().getArray();
  const parent = Int32Array.from({ length: pos.length / 3 }, (_, i) => i);
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const join = (a, b) => { parent[find(b)] = find(a); };
  const points = new Map();
  for (let i = 0; i < parent.length; i++) {
    const key = `${pos[i * 3].toFixed(5)},${pos[i * 3 + 1].toFixed(5)},${pos[i * 3 + 2].toFixed(5)}`;
    if (points.has(key)) join(i, points.get(key)); else points.set(key, i);
  }
  for (let i = 0; i < indices.length; i += 3) { join(indices[i], indices[i + 1]); join(indices[i], indices[i + 2]); }
  const groups = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    const key = find(indices[i]);
    if (!groups.has(key)) groups.set(key, { indices: [], vertices: new Set() });
    const group = groups.get(key);
    for (let j = 0; j < 3; j++) { group.indices.push(indices[i + j]); group.vertices.add(indices[i + j]); }
  }
  return [...groups.values()].map(group => {
    const center = [0, 0, 0];
    for (const v of group.vertices) for (let a = 0; a < 3; a++) center[a] += pos[v * 3 + a] / group.vertices.size;
    return { ...group, center };
  });
}

const report = { generatedFrom: 'tree.glb / rock.glb (preserved inputs)', models: {}, textures: {} };

// Fit a textured plane to each leaf's UVs. Its alpha texture supplies the silhouette,
// replacing 2–20 triangles with two without letting a global decimator erase the leaf.
function leafCards(doc, prim, selected, expansion) {
  const p = prim.getAttribute('POSITION').getArray(), uv = prim.getAttribute('TEXCOORD_0').getArray();
  const normal = prim.getAttribute('NORMAL').getArray();
  const positions = [], normals = [], uvs = [], indices = [];
  for (const group of selected) {
    const ids = [...group.vertices];
    const mean = [0, 0], n = [0, 0, 0];
    for (const v of ids) { mean[0] += uv[v * 2] / ids.length; mean[1] += uv[v * 2 + 1] / ids.length; for (let a = 0; a < 3; a++) n[a] += normal[v * 3 + a]; }
    let uu = 0, vv = 0, cross = 0;
    const pu = [0, 0, 0], pv = [0, 0, 0];
    for (const v of ids) {
      const u = uv[v * 2] - mean[0], w = uv[v * 2 + 1] - mean[1];
      uu += u * u; vv += w * w; cross += u * w;
      for (let a = 0; a < 3; a++) { pu[a] += (p[v * 3 + a] - group.center[a]) * u; pv[a] += (p[v * 3 + a] - group.center[a]) * w; }
    }
    const determinant = uu * vv - cross * cross;
    if (Math.abs(determinant) < 1e-14) continue;
    const uAxis = pu.map((v, a) => (v * vv - pv[a] * cross) / determinant);
    const vAxis = pv.map((v, a) => (v * uu - pu[a] * cross) / determinant);
    const minU = Math.min(...ids.map(v => uv[v * 2])), maxU = Math.max(...ids.map(v => uv[v * 2]));
    const minV = Math.min(...ids.map(v => uv[v * 2 + 1])), maxV = Math.max(...ids.map(v => uv[v * 2 + 1]));
    const length = Math.hypot(...n) || 1, base = positions.length / 3;
    for (const [u, v] of [[minU, minV], [maxU, minV], [maxU, maxV], [minU, maxV]]) {
      for (let a = 0; a < 3; a++) { positions.push(group.center[a] + expansion * (uAxis[a] * (u - mean[0]) + vAxis[a] * (v - mean[1]))); normals.push(n[a] / length); }
      uvs.push(u, v);
    }
    // Match triangle winding to the source normals (important for double-sided lighting).
    const face = [uAxis[1]*vAxis[2]-uAxis[2]*vAxis[1], uAxis[2]*vAxis[0]-uAxis[0]*vAxis[2], uAxis[0]*vAxis[1]-uAxis[1]*vAxis[0]];
    indices.push(...(face.reduce((s,x,a)=>s+x*n[a],0) >= 0 ? [0,1,2,0,2,3] : [0,2,1,0,3,2]).map(i=>base+i));
  }
  const buffer = doc.getRoot().listBuffers()[0];
  for (const semantic of prim.listSemantics()) prim.setAttribute(semantic, null);
  for (const [name, type, array] of [['POSITION','VEC3',positions],['NORMAL','VEC3',normals],['TEXCOORD_0','VEC2',uvs]]) prim.setAttribute(name, doc.createAccessor().setBuffer(buffer).setType(type).setArray(new Float32Array(array)));
  prim.setIndices(doc.createAccessor().setBuffer(buffer).setType('SCALAR').setArray(new Uint32Array(indices)));
}

async function finish(doc, name) {
  await doc.transform(prune(), dedup());
  // Shared external images: the two tree meshes refer to the same content-addressed files.
  // All variants of one tree in the scene also reuse the decoded geometry and Texture objects.
  for (const texture of doc.getRoot().listTextures()) {
    const size = /nor_gl|rough/.test(texture.getName()) ? 256 : 512;
    let source = sharp(texture.getImage()).resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
    // The supplied leaf atlas is RGB with a black background, despite its "alpha"
    // name. Cards need an actual alpha channel; keep the interior leaf shading.
    if (/leaves.*diff/.test(texture.getName())) {
      const { data, info } = await source.removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const rgba = Buffer.alloc(info.width * info.height * 4);
      for (let i = 0; i < info.width * info.height; i++) {
        rgba[i*4] = data[i*3]; rgba[i*4+1] = data[i*3+1]; rgba[i*4+2] = data[i*3+2];
        rgba[i*4+3] = Math.round(Math.min(1, Math.max(0, (Math.max(data[i*3],data[i*3+1],data[i*3+2])-8)/14))*255);
      }
      source = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
    }
    const bytes = await source.webp({ quality: 78, alphaQuality: 95 }).toBuffer();
    const uri = `shared-${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.webp`;
    texture.setImage(bytes).setMimeType('image/webp').setURI(uri);
    report.textures[uri] = bytes.length;
  }
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  // Resource URIs are resolved relative to the glTF; Vite copies this directory intact.
  doc.getRoot().listBuffers().forEach((buffer, i) => buffer.setURI(`${name}-${i}.bin`));
  await io.write(`${output}/${name}.gltf`, doc);
  const tris = doc.getRoot().listMeshes().flatMap(m => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
  const textures = [...new Set(doc.getRoot().listTextures().map(t => t.getURI()))];
  const geometryBytes = (await stat(`${output}/${name}.gltf`)).size + (await stat(`${output}/${name}-0.bin`)).size;
  report.models[name] = { triangles: tris, geometryBytes, textures, totalBytes: geometryBytes + textures.reduce((n, uri) => n + report.textures[uri], 0) };
  console.log(name, report.models[name]);
}

for (const profile of [
  { name: 'tree-full', keep: .16, expansion: 2.65, trunkRatio: .30, branchRatio: .038 },
]) {
  const doc = await io.read(`${assets}/tree.glb`);
  await doc.transform(dequantize(), weld());
  for (const prim of doc.getRoot().listMeshes().flatMap(m => m.listPrimitives())) {
    const material = prim.getMaterial();
    if (material.getName().includes('leaves')) {
      const groups = leafGroups(prim);
      console.log('Leaf components', groups.length, 'triangle ranges', Math.min(...groups.map(g => g.indices.length / 3)), Math.max(...groups.map(g => g.indices.length / 3)));
      if (process.argv.includes('--inspect')) process.exit(0);
      // Stratification preserves every occupied region instead of deleting whole branches.
      const cells = new Map();
      groups.forEach((group, i) => {
        const key = group.center.map(v => Math.floor(v / .25)).join(',');
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push({ ...group, id: i });
      });
      const selected = [];
      for (const cell of cells.values()) {
        cell.sort((a, b) => ((a.id * 2654435761) >>> 0) - ((b.id * 2654435761) >>> 0));
        selected.push(...cell.slice(0, Math.max(1, Math.ceil(cell.length * profile.keep))));
      }
      leafCards(doc, prim, selected, profile.expansion);
      // Alpha testing avoids sorting thousands of overlapping transparent leaves.
      material.setAlphaMode('MASK').setAlphaCutoff(.35);
      console.log('Leaves kept', selected.length, 'tris', prim.getIndices().getCount() / 3);
    } else {
      simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: material.getName().includes('branches') ? profile.branchRatio : profile.trunkRatio, error: .006 });
    }
  }
  await finish(doc, profile.name);
}
const rock = await io.read(`${assets}/rock.glb`);
await rock.transform(dequantize(), weld());
for (const prim of rock.getRoot().listMeshes().flatMap(m => m.listPrimitives())) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: .07, error: .004 });
await finish(rock, 'rock-light');
await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
// Only remove obsolete generated images from this pipeline's own output directory.
for (const file of await readdir(output)) if (/^shared-[0-9a-f]{16}\.webp$/.test(file) && !report.textures[file]) await unlink(`${output}/${file}`);
