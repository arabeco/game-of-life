import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Piloto geometrico, preserva o corpo como gabarito e exporta apenas a roupa.
const root = path.resolve('public/assets/catalog/avatars');
const source = path.join(root, 'SKIN_T2_TRILHA.png');
const body = path.join(root, 'body_masc_1.png');
const outDir = path.resolve('art-delivery/2d/arm-pose-fix/candidates');
const output = path.join(outDir, 'SKIN_T2_TRILHA-warp-pilot.png');
const preview = path.join(outDir, 'SKIN_T2_TRILHA-warp-pilot.review.png');
const femalePreview = path.join(outDir, 'SKIN_T2_TRILHA-warp-pilot.fem-review.png');
const cuffPreview = path.join(outDir, 'SKIN_T2_TRILHA-warp-pilot.cuffs.png');
await fs.mkdir(outDir, { recursive: true });

const { data: original, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 500 || info.height !== 500 || info.channels !== 4) throw new Error('Esperado RGBA 500x500');
const base = Buffer.from(original);
const moved = new Float32Array(500 * 500 * 4);
const coverage = new Float32Array(500 * 500);

const interp = (y, points) => {
  for (let i = 1; i < points.length; i++) {
    if (y <= points[i][0]) {
      const [y0, x0] = points[i - 1];
      const [y1, x1] = points[i];
      return x0 + (x1 - x0) * ((y - y0) / (y1 - y0));
    }
  }
  return points.at(-1)[1];
};

const leftEdge = [[170, 209], [190, 205], [205, 199], [220, 196], [235, 189], [250, 183], [265, 181]];
const rightEdge = [[170, 286], [190, 291], [205, 297], [220, 302], [235, 308], [250, 313], [265, 315]];
const selected = (x, y, side) => side === 'left'
  ? x < interp(y, leftEdge) && x >= 145
  : x > interp(y, rightEdge) && x <= 350;

for (const side of ['left', 'right']) {
  for (let y = 170; y <= 265; y++) {
    const progress = Math.max(0, Math.min(1, (y - 170) / 95));
    const dx = (side === 'left' ? 11 : -15) * progress;
    const dy = 5 * progress;
    for (let x = side === 'left' ? 145 : 286; x <= (side === 'left' ? 209 : 350); x++) {
      if (!selected(x, y, side)) continue;
      const src = (y * 500 + x) * 4;
      const alpha = original[src + 3] / 255;
      if (alpha === 0) continue;
      base[src + 3] = 0;
      const nx = x + dx;
      const ny = y + dy;
      const ix = Math.floor(nx);
      const iy = Math.floor(ny);
      for (const [px, py, weight] of [
        [ix, iy, (1 - (nx - ix)) * (1 - (ny - iy))],
        [ix + 1, iy, (nx - ix) * (1 - (ny - iy))],
        [ix, iy + 1, (1 - (nx - ix)) * (ny - iy)],
        [ix + 1, iy + 1, (nx - ix) * (ny - iy)],
      ]) {
        if (px < 0 || px >= 500 || py < 0 || py >= 500 || weight <= 0) continue;
        const p = py * 500 + px;
        const w = alpha * weight;
        coverage[p] += w;
        for (let c = 0; c < 3; c++) moved[p * 4 + c] += original[src + c] * w;
      }
    }
  }
}

for (let p = 0; p < 500 * 500; p++) {
  const c = Math.min(1, coverage[p]);
  if (c <= 0) continue;
  const dst = p * 4;
  const baseAlpha = base[dst + 3] / 255;
  const combined = c + baseAlpha * (1 - c);
  for (let channel = 0; channel < 3; channel++) {
    const warpedColor = moved[dst + channel] / coverage[p];
    base[dst + channel] = Math.round((warpedColor * c + base[dst + channel] * baseAlpha * (1 - c)) / combined);
  }
  base[dst + 3] = Math.round(combined * 255);
}

// Na parte alta, o ombro do casaco precisa cobrir o ombro do gabarito.
// Estica apenas a faixa externa ate o contorno do body_masc_1, mantendo
// a borda interna da gola no mesmo pixel e sem copiar o corpo para a roupa.
const upperRows = {
  left: { inner: [[120, 231], [130, 228], [140, 223], [150, 218], [170, 209]], outer: [[120, 212], [130, 190], [140, 184], [150, 182], [170, 181]] },
  right: { inner: [[120, 266], [130, 269], [140, 275], [150, 280], [170, 286]], outer: [[120, 277], [130, 300], [140, 308], [150, 312], [170, 315]] },
};
for (let y = 120; y < 170; y++) {
  for (const side of ['left', 'right']) {
    const guide = upperRows[side];
    const inner = Math.round(interp(y, guide.inner));
    const desiredOuter = Math.round(interp(y, guide.outer));
    const outerPixels = [];
    const [scanStart, scanEnd] = side === 'left' ? [180, inner] : [inner, 330];
    for (let x = scanStart; x <= scanEnd; x++) {
      if (original[(y * 500 + x) * 4 + 3] > 128) outerPixels.push(x);
    }
    if (outerPixels.length === 0) continue;
    const sourceOuter = side === 'left' ? outerPixels[0] : outerPixels.at(-1);
    const start = Math.min(desiredOuter, inner);
    const end = Math.max(desiredOuter, inner);
    for (let x = start; x <= end; x++) {
      const fraction = (x - inner) / (desiredOuter - inner);
      const sourceX = Math.round(inner + fraction * (sourceOuter - inner));
      const dst = (y * 500 + x) * 4;
      const src = (y * 500 + sourceX) * 4;
      for (let channel = 0; channel < 4; channel++) base[dst + channel] = original[src + channel];
    }
  }
}

// O escuro dentro do tubo e a face traseira da manga. No avatar ele deve
// ficar atras do braco; no PNG frontal, essa area precisa ser transparente.
for (let y = 254; y <= 268; y++) {
  for (const [x0, x1] of [[165, 192], [302, 328]]) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * 500 + x) * 4;
      if (base[i + 3] === 0) continue;
      const frontFactor = Math.max(0, Math.min(1, (base[i] - 90) / 70));
      base[i + 3] = Math.round(base[i + 3] * frontFactor);
    }
  }
}

await sharp(base, { raw: { width: 500, height: 500, channels: 4 } }).png().toFile(output);
const composite = await sharp(body).composite([{ input: output, left: 0, top: 0 }]).png().toBuffer();
await sharp(composite).resize(1000).png().toFile(preview);
const femaleComposite = await sharp(path.join(root, 'body_fem_1.png'))
  .composite([{ input: output, left: 0, top: 0 }]).png().toBuffer();
await sharp(femaleComposite).resize(1000).png().toFile(femalePreview);
await sharp(composite).extract({ left: 145, top: 232, width: 205, height: 65 })
  .resize(1230, 390).png().toFile(cuffPreview);
console.log(JSON.stringify({ output, preview, femalePreview, cuffPreview }));
