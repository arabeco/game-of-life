import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../assets/light/', import.meta.url));
const dir = process.argv.includes('--embedded') ? fileURLToPath(new URL('../../../public/garden-experiment/assets/light/', import.meta.url)) : source;
const report = JSON.parse(await readFile(`${source}/report.json`, 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const used = new Set();
for (const [name, expected] of Object.entries(report.models)) {
  const json = JSON.parse(await readFile(`${dir}/${name}.gltf`, 'utf8'));
  const resources = [...json.buffers.filter(b => b.uri).map(b => b.uri), ...json.images.map(i => i.uri)];
  let bytes = (await stat(`${dir}/${name}.gltf`)).size;
  for (const resource of new Set(resources)) {
    assert.match(resource, /^[a-z0-9.-]+$/);
    bytes += (await stat(`${dir}/${resource}`)).size;
    used.add(resource);
  }
  assert.equal(bytes, expected.totalBytes, `${name}: recorded byte budget drifted`);
  assert.ok(bytes <= 500_000, `${name}: exceeds 500 KB including its textures`);
  assert.deepEqual(json.images.map(i => i.uri).sort(), [...expected.textures].sort());
  const doc = await io.read(`${dir}/${name}.gltf`);
  let triangles = 0;
  for (const primitive of doc.getRoot().listMeshes().flatMap(mesh => mesh.listPrimitives())) {
    const position = primitive.getAttribute('POSITION');
    assert.ok(position.getCount() > 0);
    assert.ok([...position.getArray()].every(Number.isFinite), `${name}: non-finite vertices`);
    for (const index of primitive.getIndices().getArray()) assert.ok(index < position.getCount());
    triangles += primitive.getIndices().getCount() / 3;
  }
  assert.equal(triangles, expected.triangles);
  console.log(`${name}: ${bytes} bytes, ${triangles} triangles, decoded OK`);
}
for (const uri of Object.keys(report.textures)) {
  const meta = await sharp(`${dir}/${uri}`).metadata();
  assert.ok(meta.width <= 512 && meta.height <= 512);
}
const tree = JSON.parse(await readFile(`${dir}/tree-full.gltf`, 'utf8'));
const leafImage = tree.images.find(image => image.name.includes('leaves') && image.name.includes('diff'));
assert.ok((await sharp(`${dir}/${leafImage.uri}`).metadata()).hasAlpha, 'Leaf cards require an alpha silhouette');
for (const file of await readdir(dir)) if (file.endsWith('.webp')) assert.ok(used.has(file), `Unreferenced texture packaged: ${file}`);
assert.ok(!Object.hasOwn(report.models, 'tree-lean'), 'Only the approved tree belongs in the report');
console.log('PASS: budgets, decoded geometry, shared images, alpha mask and no stale textures.');
