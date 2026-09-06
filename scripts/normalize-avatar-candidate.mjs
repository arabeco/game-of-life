import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) {
  throw new Error('uso: node scripts/normalize-avatar-candidate.mjs origem.png destino.png');
}

const TARGET = { left: 167, top: 54, width: 157, height: 415 };
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// A extracao gerada deixou um halo de alfa baixo. Remove apenas esse halo e
// remapeia a borda forte para preservar antialiasing no corpo.
let x0 = info.width;
let y0 = info.height;
let x1 = -1;
let y1 = -1;
for (let y = 0; y < info.height; y += 1) {
  for (let x = 0; x < info.width; x += 1) {
    const i = (y * info.width + x) * 4 + 3;
    const alpha = data[i];
    data[i] = alpha <= 220 ? 0 : Math.min(255, Math.round((alpha - 220) * 255 / 35));
    if (data[i] > 0) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
}

if (x1 < x0 || y1 < y0) throw new Error('nenhum corpo opaco encontrado');

const cutout = await sharp(data, { raw: info })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .resize(TARGET.width, TARGET.height, { fit: 'fill' })
  .png()
  .toBuffer();

await sharp({ create: { width: 500, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: cutout, left: TARGET.left, top: TARGET.top }])
  .png()
  .toFile(destination);

console.log(JSON.stringify({ source: path.resolve(source), destination: path.resolve(destination), sourceBounds: { x0, y0, x1, y1 }, target: TARGET }, null, 2));
