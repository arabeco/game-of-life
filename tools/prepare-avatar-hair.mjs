import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [source, output, scaleArg, leftArg, topArg] = process.argv.slice(2);
if (!source || !output || !scaleArg || !leftArg || !topArg) {
  console.error('Uso: node tools/prepare-avatar-hair.mjs <origem.png> <saida.png> <escala> <esquerda> <topo>');
  process.exit(1);
}
const scale = Number(scaleArg);
const left = Number(leftArg);
const top = Number(topArg);
if (!(scale > 0 && scale < 1 && Number.isInteger(left) && Number.isInteger(top))) {
  throw new Error('escala/posicao invalidas');
}
const sourceInfo = await sharp(source).metadata();
const width = Math.round(sourceInfo.width * scale);
const height = Math.round(sourceInfo.height * scale);
if (left < 0 || top < 0 || left + width > 500 || top + height > 500) {
  throw new Error('cabelo fora da tela 500x500');
}
const resized = await sharp(source).ensureAlpha().resize(width, height).png().toBuffer();
await fs.mkdir(path.dirname(output), { recursive: true });
await sharp({ create: { width: 500, height: 500, channels: 4, background: '#00000000' } })
  .composite([{ input: resized, left, top }])
  .png()
  .toFile(output);

const bodies = ['masc_1', 'masc_2', 'masc_3', 'masc_4', 'fem_1', 'fem_2', 'fem_3', 'fem_4'];
const tiles = [];
for (const [index, body] of bodies.entries()) {
  const bodyFile = path.resolve(`public/assets/catalog/avatars/body_${body}.png`);
  const preview = await sharp(bodyFile).ensureAlpha()
    .composite([{ input: output, left: 0, top: 0 }])
    .png().toBuffer();
  tiles.push({ input: preview, left: (index % 4) * 500, top: Math.floor(index / 4) * 500 });
}
const review = output.replace(/\.png$/i, '.review.png');
await sharp({ create: { width: 2000, height: 1000, channels: 4, background: '#4b606a' } })
  .composite(tiles).png().toFile(review);
console.log(JSON.stringify({ source, output, review, scale, left, top }));
