import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Cada entrada foi medida no PNG 500x500. A arte aceita (Cavaleiro, Oficina,
// Atelie, Soberano) nao entra aqui. A abertura eliptica e a parte de tras da
// manga: ela nao pode ficar na camada frontal sobre a mao do corpo.
const cuffs = [
  ['T1_CHUVA', 253, 263, [164, 185], [306, 327]],
  ['T1_ESCUDEIRO', 259, 268, [168, 190], [302, 325]],
  ['T2_BARAO', 262, 271, [166, 186], [305, 326]],
  ['T2_TRILHA', 257, 270, [165, 193], [299, 327]],
  ['T3_CONDE', 255, 267, [170, 187], [306, 322]],
  ['T3_DUQUE', 262, 270, [169, 190], [303, 329]],
  ['T3_INVERNO', 259, 271, [162, 195], [297, 330]],
  ['T3_NOTURNO', 250, 264, [165, 195], [297, 329]],
  ['T4_EMPREENDEDOR', 260, 269, [165, 185], [306, 327]],
  ['T4_PRINCIPE', 254, 268, [169, 188], [305, 324]],
  ['T4_REI', 260, 271, [170, 192], [299, 328]],
];
const root = path.resolve('public/assets/catalog/avatars');
const out = path.resolve('art-delivery/2d/arm-pose-fix/cuff-cut-candidates');
const preCut = path.resolve('art-delivery/2d/arm-pose-fix/pre-cuff-cut');
await fs.mkdir(out, { recursive: true });
const bodies = await Promise.all(['body_masc_1.png', 'body_fem_1.png'].map(name =>
  sharp(path.join(root, name)).ensureAlpha().raw().toBuffer()));
const handCutoffs = {
  T1_CHUVA: 248, T1_ESCUDEIRO: 246, T2_BARAO: 248,
  T2_TRILHA: 248, T3_CONDE: 246, T3_DUQUE: 248,
  T3_INVERNO: 248, T3_NOTURNO: 248, T4_EMPREENDEDOR: 248,
  T4_PRINCIPE: 246, T4_REI: 248,
};
const sheets = [[], [], []];

for (const [index, [id, cutY, endY, leftRange, rightRange]] of cuffs.entries()) {
  const name = `SKIN_${id}`;
  const backedUp = path.join(preCut, `${name}.png`);
  const input = await fs.access(backedUp).then(() => backedUp, () => path.join(root, `${name}.png`));
  const { data, info } = await sharp(input)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 500 || info.height !== 500 || info.channels !== 4) throw new Error(name);
  const fixed = Buffer.from(data);
  let removed = 0;
  for (const [lo, hi] of [leftRange, rightRange]) {
    for (let x = lo; x <= hi; x++) {
      for (let y = cutY; y <= endY; y++) {
        const i = (y * 500 + x) * 4 + 3;
        const r = fixed[i - 3], g = fixed[i - 2], b = fixed[i - 1];
        const luma = .213 * r + .715 * g + .072 * b;
        if (id === 'T3_DUQUE' && !(r > b + 8 || luma < 30)) continue;
        if (id === 'T4_REI' && !(luma < 155 && (r > b + 8 || luma < 35))) continue;
        if (id === 'T3_INVERNO' && !(
          luma < 20 || (y <= 269 && (x < 230 ? x <= 185 : x >= 310))
        )) continue;
        if (id === 'T3_NOTURNO' && !(
          luma < 23 || (x < 230 ? x <= 186 : x >= 312)
        )) continue;
        if (fixed[i]) { fixed[i] = 0; removed++; }
      }
    }
  }
  const erase = (x1, x2, y1, y2, select = () => true) => {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
      const i = (y * 500 + x) * 4;
      if (!fixed[i + 3] || !select(fixed[i], fixed[i + 1], fixed[i + 2], fixed[i + 3])) continue;
      fixed[i + 3] = 0;
      removed++;
    }
  };
  if (id === 'T1_CHUVA') {
    erase(165, 185, 264, 264);
    erase(310, 326, 264, 264);
  }
  if (id === 'T4_EMPREENDEDOR') {
    const lightRim = (r, g, b) => .213 * r + .715 * g + .072 * b > 105 && r > b;
    erase(163, 194, 259, 273, lightRim);
    erase(298, 339, 259, 273, lightRim);
  }
  const png = await sharp(fixed, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
  await fs.writeFile(path.join(out, `${name}.png`), png);
  const variants = [png];
  for (const body of bodies) {
    const hands = Buffer.from(body);
    for (let y = 0; y < 500; y++) for (let x = 0; x < 500; x++) {
      if (y < handCutoffs[id] || y > 290 || (x > 198 && x < 296)) hands[(y * 500 + x) * 4 + 3] = 0;
    }
    const handPng = await sharp(hands, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
    variants.push(await sharp(body, { raw: { width: 500, height: 500, channels: 4 } })
      .composite([{ input: png, left: 0, top: 0 }, { input: handPng, left: 0, top: 0 }]).png().toBuffer());
  }
  for (const [mode, suffix] of ['male', 'female'].entries()) {
    await sharp(variants[mode + 1]).resize(1000).png()
      .toFile(path.join(out, `${name}.${suffix}-preview.png`));
  }
  for (let mode = 0; mode < variants.length; mode++) {
    const crop = await sharp(variants[mode])
      .extract({ left: 155, top: cutY - 25, width: 190, height: 60 })
      .resize(570, 180).png().toBuffer();
    const label = Buffer.from(`<svg width="570" height="28"><rect width="570" height="28" fill="#17232a"/><text x="8" y="21" fill="white" font-size="19" font-family="Arial">${id}</text></svg>`);
    const tile = await sharp({ create: { width: 570, height: 208, channels: 4, background: '#536773' } })
      .composite([{ input: crop, left: 0, top: 28 }, { input: label, left: 0, top: 0 }]).png().toBuffer();
    sheets[mode].push({ input: tile, left: (index % 3) * 570, top: Math.floor(index / 3) * 208 });
  }
  console.log(`${name}: ${removed} pixels da abertura removidos`);
}

for (const [mode, filename] of ['cuffs-only.png', 'cuffs-male.png', 'cuffs-female.png'].entries()) {
  await sharp({ create: { width: 1710, height: 832, channels: 4, background: '#536773' } })
    .composite(sheets[mode]).png().toFile(path.join(out, filename));
}
