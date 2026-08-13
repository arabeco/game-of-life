import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogRoot = path.join(repoRoot, 'public', 'assets', 'catalog');
const manifest = JSON.parse(await readFile(path.join(catalogRoot, 'manifest.json'), 'utf8'));

assert.equal(manifest.totalFiles, manifest.assets.length);
assert.equal(manifest.totalFiles, 139);

let totalBytes = 0;
for (const asset of manifest.assets) {
  const filePath = path.join(catalogRoot, ...asset.path.split('/'));
  const fileStat = await stat(filePath);
  const bytes = await readFile(filePath);
  assert.equal(fileStat.size, asset.bytes, `${asset.path} has an unexpected size`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.path} hash changed`);
  totalBytes += fileStat.size;
}

assert.equal(totalBytes, manifest.totalBytes);

for (const relativeSource of ['constants/items.ts', 'constants/skins.ts']) {
  const source = await readFile(path.join(repoRoot, relativeSource), 'utf8');
  assert.doesNotMatch(source, /supabase\.co\/storage\/v1\/object\/public\/user-images/);
  assert.match(source, /CATALOG_(ASSET|AVATAR)/);
}

console.log(`Static catalog regression: ${manifest.totalFiles} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB.`);
