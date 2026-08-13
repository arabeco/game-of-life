import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS_DB } from '../constants/items';
import { AVATAR_BASE_URL, BODY_DB, HAIR_DB, getHairUrl } from '../constants/skins';

const BUCKET_ROOT = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/';
const LOCAL_ROOT = '/assets/catalog/';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(repoRoot, 'public', 'assets', 'catalog');

const sourceUrls = new Set<string>();

const addCatalogUrl = (value?: string | null) => {
  const normalized = value?.trim() || '';
  if (normalized.startsWith(BUCKET_ROOT)) {
    sourceUrls.add(normalized);
    return;
  }
  if (normalized.startsWith(LOCAL_ROOT)) {
    sourceUrls.add(`${BUCKET_ROOT}${normalized.slice(LOCAL_ROOT.length)}`);
  }
};

for (const item of ITEMS_DB) {
  addCatalogUrl(item.imageUrl);
}

for (const body of BODY_DB) {
  addCatalogUrl(`${AVATAR_BASE_URL}/${body.filename}`);
}

for (const hair of HAIR_DB) {
  const colorCount = Math.max(1, hair.availableColors?.length || 0);
  for (let index = 1; index <= colorCount; index += 1) {
    const url = getHairUrl(hair.id, String(index));
    addCatalogUrl(url);
  }
}

const download = async (sourceUrl: string) => {
  const relativePath = decodeURIComponent(sourceUrl.slice(BUCKET_ROOT.length));
  if (!relativePath || relativePath.includes('..')) throw new Error(`Unsafe asset path: ${relativePath}`);

  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${sourceUrl}`);

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`Unexpected content type ${contentType}: ${sourceUrl}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`Empty asset: ${sourceUrl}`);

  const destination = path.join(outputRoot, ...relativePath.split('/'));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);

  return {
    path: relativePath.replaceAll('\\', '/'),
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
};

const urls = [...sourceUrls].sort();
const manifest: Array<{ path: string; bytes: number; sha256: string }> = [];
const failures: string[] = [];
let cursor = 0;

const worker = async () => {
  while (cursor < urls.length) {
    const index = cursor;
    cursor += 1;
    try {
      manifest[index] = await download(urls[index]);
    } catch (error) {
      failures.push(String(error));
    }
  }
};

await mkdir(outputRoot, { recursive: true });
await Promise.all(Array.from({ length: Math.min(8, urls.length) }, () => worker()));

if (failures.length > 0) {
  throw new Error(`Failed to download ${failures.length} catalog assets:\n${failures.join('\n')}`);
}

const sortedManifest = manifest.filter(Boolean).sort((left, right) => left.path.localeCompare(right.path));
const totalBytes = sortedManifest.reduce((sum, asset) => sum + asset.bytes, 0);
await writeFile(
  path.join(outputRoot, 'manifest.json'),
  `${JSON.stringify({ totalFiles: sortedManifest.length, totalBytes, assets: sortedManifest }, null, 2)}\n`,
  'utf8',
);

console.log(`Downloaded ${sortedManifest.length} assets (${(totalBytes / 1024 / 1024).toFixed(2)} MB).`);
