import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('public/assets/catalog/avatars');
const outDir = path.resolve('art-delivery/2d/arm-pose-fix/layer-pilot');
await fs.mkdir(outDir, { recursive: true });
for (const id of ['T2_TRILHA', 'T3_NOTURNO', 'T2_CAVALEIRO', 'T2_OFICINA']) {
  const source = path.join(root, `SKIN_${id}.png`);
  for (const gender of ['masc', 'fem']) {
    const bodyFile = path.join(root, `body_${gender}_1.png`);
    const { data: body } = await sharp(bodyFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const handLayer = Buffer.from(body);
    const cutoff = ['T2_OFICINA'].includes(id) ? 210 : 248;
    for (let y = 0; y < 500; y++) for (let x = 0; x < 500; x++) {
      if (y < cutoff || y > 290 || (x > 198 && x < 296)) handLayer[(y * 500 + x) * 4 + 3] = 0;
    }
    const skin = await fs.readFile(source);
    const handImage = await sharp(handLayer, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
    const composite = await sharp(bodyFile)
      .composite([{ input: skin, left: 0, top: 0 }, { input: handImage, left: 0, top: 0 }])
      .png().toBuffer();
    await sharp(composite).resize(1000).png().toFile(path.join(outDir, `${id}-${gender}.png`));
  }
}
