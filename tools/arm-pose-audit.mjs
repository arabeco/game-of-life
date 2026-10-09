import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const names = [
  'T2_CAVALEIRO', 'T2_TRILHA', 'T4_REI', 'T3_DUQUE', 'T3_NOTURNO',
  'T3_INVERNO', 'T2_BARAO', 'T3_CONDE', 'T4_PRINCIPE', 'T5_SOBERANO',
  'T1_ESCUDEIRO', 'T1_CHUVA', 'T4_EMPREENDEDOR', 'T2_OFICINA', 'T3_ATELIE',
];
const root = path.resolve('public/assets/catalog/avatars');
const out = path.resolve('art-delivery/2d/arm-pose-fix/original-fit-sheet.png');
await fs.mkdir(path.dirname(out), { recursive: true });
const body = await fs.readFile(path.join(root, 'body_masc_1.png'));
const cells = [];
for (const [index, id] of names.entries()) {
  const skin = await fs.readFile(path.join(root, `SKIN_${id}.png`));
  const composite = await sharp(body).composite([{ input: skin, left: 0, top: 0 }]).png().toBuffer();
  const thumb = await sharp(composite).resize(300).png().toBuffer();
  const label = Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="#26333b"/><text x="8" y="21" fill="white" font-size="18" font-family="sans-serif">${id}</text></svg>`);
  const cell = await sharp({ create: { width: 300, height: 330, channels: 4, background: '#465a65' } })
    .composite([{ input: thumb, left: 0, top: 30 }, { input: label, left: 0, top: 0 }]).png().toBuffer();
  cells.push({ input: cell, left: (index % 5) * 300, top: Math.floor(index / 5) * 330 });
}
await sharp({ create: { width: 1500, height: 990, channels: 4, background: '#465a65' } })
  .composite(cells).png().toFile(out);
console.log(out);
