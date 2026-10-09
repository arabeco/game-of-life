import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Ajustes por peca: [id, y do punho, centro atual esquerdo/direito,
// centro alvo esquerdo/direito, y final]. Apenas candidatos; nunca sobrescreve
// o catalogo. Oficina/Atelie mantem o antebraco visivel.
const jobs = [
  ['T2_CAVALEIRO', 259, 167, 333, 179, 312, 267],
  ['T2_TRILHA', 261, 169, 327, 179, 312, 267],
  ['T4_REI', 262, 176, 324, 179, 312, 267],
  ['T3_DUQUE', 260, 178, 322, 179, 312, 267],
  ['T3_NOTURNO', 261, 170, 331, 179, 312, 267],
  ['T3_INVERNO', 264, 167, 332, 179, 312, 267],
  ['T2_BARAO', 267, 175, 326, 179, 312, 267],
  ['T3_CONDE', 260, 180, 321, 179, 312, 265],
  ['T4_PRINCIPE', 260, 176, 323, 179, 312, 265],
  ['T5_SOBERANO', 273, 177, 323, 179, 312, 273],
  ['T1_ESCUDEIRO', 260, 175, 324, 179, 312, 265],
  ['T1_CHUVA', 261, 170, 328, 179, 312, 267],
  ['T4_EMPREENDEDOR', 267, 173, 328, 179, 312, 267],
  ['T2_OFICINA', 218, 179, 319, 180, 310, 218],
  ['T3_ATELIE', 195, 182, 313, 182, 307, 195],
];
const root = path.resolve('public/assets/catalog/avatars');
const outDir = path.resolve('art-delivery/2d/arm-pose-fix/batch-candidates');
const originalDir = path.resolve('art-delivery/2d/arm-pose-fix/originals');
await fs.mkdir(outDir, { recursive: true });
const body = await sharp(path.join(root, 'body_masc_1.png')).ensureAlpha().raw().toBuffer();
const femaleBody = await sharp(path.join(root, 'body_fem_1.png')).ensureAlpha().raw().toBuffer();

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const samples = [];
const femaleSamples = [];
const cuffSamples = [];

for (const [id, cuffY, leftNow, rightNow, leftTarget, rightTarget, finalY] of jobs) {
  const backedUpSource = path.join(originalDir, `SKIN_${id}.png`);
  const sourcePath = await fs.access(backedUpSource).then(() => backedUpSource, () => path.join(root, `SKIN_${id}.png`));
  const { data: original, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 500 || info.height !== 500 || info.channels !== 4) throw new Error(`${id}: RGBA 500x500 esperado`);
  const base = Buffer.from(original);
  const accum = new Float32Array(500 * 500 * 4);
  const cover = new Float32Array(500 * 500);
  const startY = cuffY < 230 ? 145 : 170;
  const leftEnd = leftNow + 14;
  const rightEnd = rightNow - 14;
  for (const side of ['left', 'right']) {
    for (let y = startY; y <= cuffY + 3; y++) {
      const t = clamp((y - startY) / (cuffY - startY), 0, 1);
      const limit = side === 'left' ? lerp(209, leftEnd, t) : lerp(286, rightEnd, t);
      const dx = (side === 'left' ? leftTarget - leftNow : rightTarget - rightNow) * t;
      const dy = (finalY - cuffY) * t;
      for (let x = 140; x <= 355; x++) {
        if (side === 'left' ? x >= limit : x <= limit) continue;
        const src = (y * 500 + x) * 4;
        const alpha = original[src + 3] / 255;
        if (alpha <= 0) continue;
        base[src + 3] = 0;
        const nx = x + dx, ny = y + dy;
        const ix = Math.floor(nx), iy = Math.floor(ny);
        for (const [px, py, w] of [
          [ix, iy, (1 - (nx - ix)) * (1 - (ny - iy))],
          [ix + 1, iy, (nx - ix) * (1 - (ny - iy))],
          [ix, iy + 1, (1 - (nx - ix)) * (ny - iy)],
          [ix + 1, iy + 1, (nx - ix) * (ny - iy)],
        ]) {
          if (px < 0 || px >= 500 || py < 0 || py >= 500 || w <= 0) continue;
          const p = py * 500 + px;
          const aw = alpha * w;
          cover[p] += aw;
          for (let c = 0; c < 3; c++) accum[p * 4 + c] += original[src + c] * aw;
        }
      }
    }
  }
  for (let p = 0; p < 500 * 500; p++) {
    if (cover[p] <= 0) continue;
    const i = p * 4, warpedAlpha = clamp(cover[p], 0, 1);
    const existingAlpha = base[i + 3] / 255;
    const alpha = warpedAlpha + existingAlpha * (1 - warpedAlpha);
    for (let c = 0; c < 3; c++) {
      const color = accum[i + c] / cover[p];
      base[i + c] = Math.round((color * warpedAlpha + base[i + c] * existingAlpha * (1 - warpedAlpha)) / alpha);
    }
    base[i + 3] = Math.round(alpha * 255);
  }

  // Alarga so a borda externa do ombro quando o corpo-base apareceria por
  // fora da roupa. A gola/linha interna continua no mesmo lugar.
  for (let y = 123; y <= 160; y++) {
    const bodyLeft = Array.from({ length: 90 }, (_, j) => 140 + j)
      .find(x => body[(y * 500 + x) * 4 + 3] > 128);
    const bodyRight = Array.from({ length: 90 }, (_, j) => 350 - j)
      .find(x => body[(y * 500 + x) * 4 + 3] > 128);
    for (const side of ['left', 'right']) {
      const region = side === 'left'
        ? Array.from({ length: 56 }, (_, j) => 180 + j)
        : Array.from({ length: 56 }, (_, j) => 325 - j);
      const originalOuter = region.find(x => original[(y * 500 + x) * 4 + 3] > 128);
      const bodyOuter = side === 'left' ? bodyLeft : bodyRight;
      if (originalOuter == null || bodyOuter == null) continue;
      const needed = side === 'left' ? originalOuter - bodyOuter : bodyOuter - originalOuter;
      if (needed < 4) continue;
      const inner = side === 'left'
        ? Math.min(235, originalOuter + 24)
        : Math.max(265, originalOuter - 24);
      const target = side === 'left' ? bodyOuter - 1 : bodyOuter + 1;
      const start = Math.min(inner, target), end = Math.max(inner, target);
      for (let x = start; x <= end; x++) {
        const fraction = (x - inner) / (target - inner);
        const srcX = Math.round(inner + fraction * (originalOuter - inner));
        const dst = (y * 500 + x) * 4, src = (y * 500 + srcX) * 4;
        for (let c = 0; c < 4; c++) base[dst + c] = original[src + c];
      }
    }
  }

  // O teste da mascara no PNG esta desativado: em capas/armaduras ela criou
  // linhas artificiais. O teste atual usa a mao do corpo numa camada frontal.
  if (process.argv.includes('--test-mask')) {
    const shortSleeve = cuffY < 230;
    for (let y = finalY - (shortSleeve ? 6 : 10); y <= finalY + 10; y++) {
    for (const center of [leftTarget, rightTarget]) {
      for (let x = Math.floor(center - 23); x <= Math.ceil(center + 23); x++) {
        const i = (y * 500 + x) * 4;
        if (base[i + 3] === 0 || cover[y * 500 + x] < 0.08) continue;
        let handAlpha = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const py = y + oy, px = x + ox;
          if (px < 0 || px >= 500 || py < 0 || py >= 500) continue;
          handAlpha = Math.max(handAlpha, body[(py * 500 + px) * 4 + 3]);
          handAlpha = Math.max(handAlpha, femaleBody[(py * 500 + px) * 4 + 3]);
        }
        base[i + 3] = Math.round(base[i + 3] * (1 - handAlpha / 255));
      }
    }
    }
  }

  // A interpolacao pode deixar fragmentos de 1-2 pixels soltos ao lado do
  // punho. Remover somente ilhas pequenas e laterais, nunca adornos da roupa.
  const seen = new Uint8Array(500 * 500);
  for (let seed = 0; seed < seen.length; seed++) {
    if (seen[seed] || base[seed * 4 + 3] < 16) continue;
    const pixels = [seed];
    seen[seed] = 1;
    for (let qi = 0; qi < pixels.length; qi++) {
      const p = pixels[qi], x = p % 500, y = Math.floor(p / 500);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const nx = x + dx, ny = y + dy, next = ny * 500 + nx;
        if (nx < 0 || nx >= 500 || ny < 0 || ny >= 500 || seen[next] || base[next * 4 + 3] < 16) continue;
        seen[next] = 1;
        pixels.push(next);
      }
    }
    const lateral = pixels.every(p => {
      const x = p % 500, y = Math.floor(p / 500);
      return y >= 190 && y <= 300 && (x < 165 || x > 335);
    });
    if (lateral && pixels.length < 80) {
      for (const p of pixels) base[p * 4 + 3] = 0;
    }
  }

  const output = path.join(outDir, `SKIN_${id}.png`);
  const image = await sharp(base, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
  await fs.writeFile(output, image);
  const handLayer = async (pixels) => {
    const hands = Buffer.from(pixels);
    const cutoff = cuffY < 230 ? cuffY - 8 : finalY - 19;
    for (let y = 0; y < 500; y++) for (let x = 0; x < 500; x++) {
      if (y < cutoff || y > 290 || (x > 198 && x < 296)) hands[(y * 500 + x) * 4 + 3] = 0;
    }
    return sharp(hands, { raw: { width: 500, height: 500, channels: 4 } }).png().toBuffer();
  };
  const maleHands = await handLayer(body);
  const composite = await sharp(body, { raw: { width: 500, height: 500, channels: 4 } })
    .composite([{ input: image, left: 0, top: 0 }, { input: maleHands, left: 0, top: 0 }]).png().toBuffer();
  await sharp(composite).resize(1000).png().toFile(path.join(outDir, `SKIN_${id}.review.png`));
  samples.push({ id, input: await sharp(composite).resize(300).png().toBuffer() });
  cuffSamples.push({ id, input: await sharp(composite)
    .extract({ left: 145, top: Math.max(0, cuffY - 28), width: 205, height: 70 })
    .resize(615, 210).png().toBuffer() });
  const femaleHands = await handLayer(femaleBody);
  const femaleComposite = await sharp(femaleBody, { raw: { width: 500, height: 500, channels: 4 } })
    .composite([{ input: image, left: 0, top: 0 }, { input: femaleHands, left: 0, top: 0 }]).png().toBuffer();
  await sharp(femaleComposite).resize(1000).png().toFile(path.join(outDir, `SKIN_${id}.fem-review.png`));
  femaleSamples.push({ id, input: await sharp(femaleComposite).resize(300).png().toBuffer() });
}

for (const [filename, entries] of [['fit-sheet.png', samples], ['fit-sheet-fem.png', femaleSamples]]) {
  const sheet = path.join(outDir, filename);
  const tiles = [];
  for (const [index, { id, input }] of entries.entries()) {
    const label = Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="#26333b"/><text x="8" y="21" fill="white" font-size="18" font-family="sans-serif">${id}</text></svg>`);
    const tile = await sharp({ create: { width: 300, height: 330, channels: 4, background: '#465a65' } })
      .composite([{ input, left: 0, top: 30 }, { input: label, left: 0, top: 0 }]).png().toBuffer();
    tiles.push({ input: tile, left: (index % 5) * 300, top: Math.floor(index / 5) * 330 });
  }
  await sharp({ create: { width: 1500, height: 990, channels: 4, background: '#465a65' } }).composite(tiles).png().toFile(sheet);
  console.log(sheet);
}
const cuffTiles = [];
for (const [index, { id, input }] of cuffSamples.entries()) {
  const label = Buffer.from(`<svg width="615" height="30"><rect width="615" height="30" fill="#26333b"/><text x="8" y="21" fill="white" font-size="18" font-family="sans-serif">${id}</text></svg>`);
  const tile = await sharp({ create: { width: 615, height: 240, channels: 4, background: '#465a65' } })
    .composite([{ input, left: 0, top: 30 }, { input: label, left: 0, top: 0 }]).png().toBuffer();
  cuffTiles.push({ input: tile, left: (index % 3) * 615, top: Math.floor(index / 3) * 240 });
}
await sharp({ create: { width: 1845, height: 1200, channels: 4, background: '#465a65' } })
  .composite(cuffTiles).png().toFile(path.join(outDir, 'cuffs-sheet.png'));
