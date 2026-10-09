import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [source, output, topArg = '115', bottomArg = '468', maskArg = '[]'] = process.argv.slice(2);
if (!source || !output) {
  console.error('Uso: node tools/prepare-avatar-art.mjs <origem.png> <saida.png> [topo] [base]');
  process.exit(1);
}

const top = Number(topArg);
const bottom = Number(bottomArg);
const bodyCutouts = JSON.parse(maskArg);
if (!(top >= 0 && bottom > top && bottom <= 500)) throw new Error('topo/base invalidos');

const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let minX = info.width;
let minY = info.height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * info.channels + 3] <= 20) continue;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
}
if (maxY < 0) throw new Error('imagem sem alpha visivel');

// Redimensiona o quadro completo, sem recortar ou esticar a peca.
const scale = (bottom - top) / (maxY - minY);
const width = Math.round(info.width * scale);
const height = Math.round(info.height * scale);
const left = Math.round((500 - width) / 2);
const imageTop = Math.round(top - minY * scale);
if (left < 0 || imageTop < 0 || left + Math.round(maxX * scale) >= 500 || imageTop + Math.round(maxY * scale) >= 500) {
  throw new Error(`quadro fora de 500x500: width=${width}, height=${height}, left=${left}, top=${imageTop}`);
}

// Apenas o padding transparente excedente e aparado; a arte nao e recortada.
const resized = await sharp(source)
  .resize(width, height, { fit: 'fill' })
  .extract({ left: 0, top: 0, width: Math.min(width, 500 - left), height: Math.min(height, 500 - imageTop) })
  .png()
  .toBuffer();
await fs.mkdir(path.dirname(output), { recursive: true });
await sharp({ create: { width: 500, height: 500, channels: 4, background: '#00000000' } })
  .composite([{ input: resized, left, top: imageTop }])
  .png()
  .toFile(output);

const bodies = ['masc_1', 'masc_2', 'masc_3', 'masc_4', 'fem_1', 'fem_2', 'fem_3', 'fem_4'];
const previewTiles = [];
for (const [index, body] of bodies.entries()) {
  const bodyFile = path.resolve(`public/assets/catalog/avatars/body_${body}.png`);
  const bodyPixels = await sharp(bodyFile).ensureAlpha().raw().toBuffer();
  for (const [rx, ry, rw, rh] of bodyCutouts) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) bodyPixels[(y * 500 + x) * 4 + 3] = 0;
    }
  }
  const preview = await sharp(bodyPixels, { raw: { width: 500, height: 500, channels: 4 } })
    .composite([{ input: output, left: 0, top: 0 }])
    .png()
    .toBuffer();
  previewTiles.push({ input: preview, left: (index % 4) * 500, top: Math.floor(index / 4) * 500 });
}
const review = output.replace(/\.png$/i, '.review.png');
await sharp({ create: { width: 2000, height: 1000, channels: 4, background: '#4b606a' } })
  .composite(previewTiles)
  .png()
  .toFile(review);

console.log(JSON.stringify({ source, output, review, sourceBounds: [minX, minY, maxX, maxY], scale, left, imageTop, bodyCutouts }));
