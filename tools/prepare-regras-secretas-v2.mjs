import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('output/regras-secretas-arte');
const sourceDir = join(root, 'rascunhos', 'banners-v2-sources');
const bannerDir = join(root, 'banners-v2');
await mkdir(bannerDir, { recursive: true });

const bannerNames = [
  'banner_t2_sereno.png',
  'banner_t3_alvorada.png',
  'banner_t3_prisma.png',
  'banner_t4_profeta.png',
  'banner_t5_pedra_da_lua.png',
];

for (const name of bannerNames) {
  const source = join(sourceDir, name);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] < 24) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) throw new Error(`${name}: no visible pixels`);
  const padX = Math.max(4, Math.round((maxX - minX + 1) * 0.01));
  const padY = Math.max(3, Math.round((maxY - minY + 1) * 0.02));
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(info.width, maxX + padX + 1);
  const bottom = Math.min(info.height, maxY + padY + 1);
  await sharp(source)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize(680, 115, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toFile(join(bannerDir, name));
  console.log(`${name}: ${right - left}x${bottom - top} -> 680x115`);
}

const clothingSource = join(root, 'rascunhos', 'SKIN_T1_ESCRIBA-comprida-v4-source.png');
const clothingTarget = join(root, 'SKIN_T1_ESCRIBA-v4.png');
await sharp(clothingSource).resize(500, 500, { fit: 'fill', kernel: 'lanczos3' }).png().toFile(clothingTarget);
console.log('SKIN_T1_ESCRIBA-v4.png: 500x500');
