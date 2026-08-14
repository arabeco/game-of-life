import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogRoot = path.join(repoRoot, 'public', 'assets', 'catalog');

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
  }));
  return nested.flat();
};

const relativeCatalogPath = (absolutePath) => path
  .relative(catalogRoot, absolutePath)
  .replaceAll('\\', '/');

const imagePaths = (await listFiles(catalogRoot))
  .filter((filePath) => /\.(png|jpe?g|webp)$/i.test(filePath));

let bytesBefore = 0;
let bytesAfter = 0;
let optimizedFiles = 0;

for (const filePath of imagePaths.filter((candidate) => candidate.toLowerCase().endsWith('.png'))) {
  const input = await readFile(filePath);
  const relativePath = relativeCatalogPath(filePath);
  const isLargeGlyphPlate = /^avatars\/glyphs\/PLACA_/i.test(relativePath);

  let pipeline = sharp(input);
  if (isLargeGlyphPlate) {
    pipeline = pipeline.resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true });
  }

  const output = await pipeline
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  bytesBefore += input.length;
  if (output.length < input.length) {
    await writeFile(filePath, output);
    bytesAfter += output.length;
    optimizedFiles += 1;
  } else {
    bytesAfter += input.length;
  }
}

const assets = [];
for (const filePath of imagePaths.sort((left, right) => left.localeCompare(right))) {
  const bytes = await readFile(filePath);
  const fileStat = await stat(filePath);
  assets.push({
    path: relativeCatalogPath(filePath),
    bytes: fileStat.size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

const totalBytes = assets.reduce((sum, asset) => sum + asset.bytes, 0);
await writeFile(
  path.join(catalogRoot, 'manifest.json'),
  `${JSON.stringify({ totalFiles: assets.length, totalBytes, assets }, null, 2)}\n`,
  'utf8',
);

console.log(
  `Optimized ${optimizedFiles} PNG files: ${(bytesBefore / 1024 / 1024).toFixed(2)} MB -> ${(bytesAfter / 1024 / 1024).toFixed(2)} MB. Catalog total: ${(totalBytes / 1024 / 1024).toFixed(2)} MB.`,
);
