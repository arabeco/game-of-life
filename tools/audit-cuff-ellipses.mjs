import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const targets = [
  ['T1_CHUVA', 261], ['T1_ESCUDEIRO', 260], ['T2_BARAO', 267],
  ['T2_TRILHA', 261], ['T3_CONDE', 260], ['T3_DUQUE', 260],
  ['T3_INVERNO', 264], ['T3_NOTURNO', 261], ['T4_EMPREENDEDOR', 267],
  ['T4_PRINCIPE', 260], ['T4_REI', 262],
];
const root = path.resolve('public/assets/catalog/avatars');
const out = path.resolve('art-delivery/2d/arm-pose-fix/target-fix');
await fs.mkdir(out, { recursive: true });
const tiles = [];
for (const [index, [id, cuffY]] of targets.entries()) {
  const png = await sharp(path.join(root, `SKIN_${id}.png`))
    .extract({ left: 155, top: cuffY - 26, width: 190, height: 60 })
    .resize(570, 180).png().toBuffer();
  const label = Buffer.from(`<svg width="570" height="28"><rect width="570" height="28" fill="#17232a"/><text x="8" y="21" fill="white" font-size="19" font-family="Arial">${id}</text></svg>`);
  const tile = await sharp({ create: { width: 570, height: 208, channels: 4, background: '#536773' } })
    .composite([{ input: png, left: 0, top: 28 }, { input: label, left: 0, top: 0 }]).png().toBuffer();
  tiles.push({ input: tile, left: (index % 3) * 570, top: Math.floor(index / 3) * 208 });
}
await sharp({ create: { width: 1710, height: 832, channels: 4, background: '#536773' } })
  .composite(tiles).png().toFile(path.join(out, 'eleven-cuffs-before.png'));
