import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Retoque localizado dos dois punhos rejeitados na revisao visual. A roupa
// continua sem maos: abrimos somente o miolo voltado para a camera para que
// as maos do corpo-base aparecam sob a manga.
const root = path.resolve('public/assets/catalog/avatars');
const out = path.resolve('art-delivery/2d/arm-pose-fix/target-fix');
await fs.mkdir(out, { recursive: true });
const bodies = await Promise.all(['body_masc_1.png', 'body_fem_1.png'].map(name =>
  sharp(path.join(root, name)).ensureAlpha().raw().toBuffer()));

const makePreview = async (body, skin, name, suffix) => {
  const merged = await sharp(body, { raw: { width: 500, height: 500, channels: 4 } })
    .composite([{ input: skin, left: 0, top: 0 }])
    .png()
    .toBuffer();
  await sharp(merged).resize(1000).png().toFile(path.join(out, `${name}.${suffix}.png`));
};

for (const name of ['SKIN_T3_DUQUE', 'SKIN_T4_REI']) {
  const { data, info } = await sharp(path.join(root, `${name}.png`))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 500 || info.height !== 500 || info.channels !== 4) throw new Error(name);
  const fixed = Buffer.from(data);
  let changed = 0;
  for (let y = 260; y <= 282; y++) for (let x = 164; x <= 329; x++) {
    const side = x < 230 ? { cx: 179, rx: 13 } : { cx: 313, rx: 14 };
    if (Math.abs(x - side.cx) >= side.rx) continue;
    const cuffEnd = 261 + 2 * (1 - ((x - side.cx) / side.rx) ** 2);
    if (y < cuffEnd) continue;
    const i = (y * 500 + x) * 4;
    if (!fixed[i + 3]) continue;
    const hand = Math.max(bodies[0][i + 3], bodies[1][i + 3]) / 255;
    const [r, g, b] = fixed.subarray(i, i + 3);
    const luma = .2126 * r + .7152 * g + .0722 * b;
    // Protege tecido azul e peles claras da capa. O bracal marrom/escuro
    // termina antes da mao, em vez de preservar o tubo oco da geracao.
    if (b > r + 10 || (luma > 160 && Math.abs(r - b) < 20)) continue;
    const edge = Math.min(1, (y - cuffEnd + 1) / 2);
    const amount = hand * edge;
    const next = Math.round(fixed[i + 3] * (1 - amount));
    if (next !== fixed[i + 3]) { fixed[i + 3] = next; changed++; }
  }
  const skin = await sharp(fixed, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
  await fs.writeFile(path.join(out, `${name}.png`), skin);
  await makePreview(bodies[0], skin, name, 'male-preview');
  await makePreview(bodies[1], skin, name, 'female-preview');
  await sharp(skin).extract({ left: 150, top: 230, width: 200, height: 65 })
    .resize(1200, 390).png().toFile(path.join(out, `${name}-cuff-after.png`));
  console.log(`${name}: ${changed} pixels retocados`);
}

const entrepreneur = 'SKIN_T4_EMPREENDEDOR';
const { data: source, info } = await sharp(path.join(root, `${entrepreneur}.png`))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 500 || info.height !== 500 || info.channels !== 4) throw new Error(entrepreneur);
const cleaned = Buffer.from(source);
let removed = 0;
for (let y = 271; y <= 274; y++) for (let x = 321; x <= 339; x++) {
  const i = (y * 500 + x) * 4 + 3;
  if (cleaned[i]) { cleaned[i] = 0; removed++; }
}
const cleanedPng = await sharp(cleaned, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
await fs.writeFile(path.join(out, `${entrepreneur}.png`), cleanedPng);
await makePreview(bodies[0], cleanedPng, entrepreneur, 'male-preview');
await sharp(cleanedPng).extract({ left: 150, top: 230, width: 200, height: 65 })
  .resize(1200, 390).png().toFile(path.join(out, `${entrepreneur}-cuff-after.png`));
console.log(`${entrepreneur}: ${removed} pixels da lasca removidos`);
