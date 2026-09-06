import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const avatarDir = path.join(root, 'public', 'assets', 'catalog', 'avatars');
const outputDir = path.join(root, 'docs', 'drafts', 'avatar-tones-v1');

const variants = [
    { source: 'body_fem_5.png', output: 'body_fem_6.png', tone: '#9a6242', label: 'castanho dourado' },
    { source: 'body_fem_5.png', output: 'body_fem_7.png', tone: '#744536', label: 'mogno profundo' },
    { source: 'body_fem_5.png', output: 'body_fem_8.png', tone: '#49342f', label: 'ébano neutro' },
    { source: 'body_masc_1.png', output: 'body_masc_4.png', tone: '#8d5b3d', label: 'castanho dourado' },
    { source: 'body_masc_1.png', output: 'body_masc_5.png', tone: '#694033', label: 'mogno profundo' },
    { source: 'body_masc_1.png', output: 'body_masc_6.png', tone: '#40302e', label: 'ébano neutro' },
];

const clamp = (value, min = 0, max = 255) => Math.max(min, Math.min(max, value));
const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hexRgb = (hex) => {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

// A máscara combina cor e posição apenas para separar pele do maiô branco e do
// cabelo. O alpha nunca é tocado: encaixe e silhueta permanecem idênticos.
const skinWeight = (r, g, b, a, x, y) => {
    if (a <= 16) return 0;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    const warm = r - b;
    if (max < 52 || sat < 0.055 || warm < 7 || r < g * 0.96 || g < b * 0.92) return 0;

    // A parte superior escura da cabeça é cabelo. A transição suave evita uma
    // linha artificial na testa sem alterar sobrancelhas e olhos.
    if (y < 73) return 0;
    if (y < 84 && luminance(r, g, b) < 78) return 0;

    const chromaWeight = clamp((warm - 7) / 26, 0, 1);
    const saturationWeight = clamp((sat - 0.055) / 0.13, 0, 1);
    const lightWeight = clamp((luminance(r, g, b) - 48) / 38, 0, 1);
    return Math.min(1, Math.max(chromaWeight, saturationWeight) * lightWeight);
};

const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

async function generate(variant) {
    const sourcePath = path.join(avatarDir, variant.source);
    const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const weights = new Float32Array(info.width * info.height);
    const skinLuma = [];

    for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
            const pixel = y * info.width + x;
            const i = pixel * 4;
            const weight = skinWeight(data[i], data[i + 1], data[i + 2], data[i + 3], x, y);
            weights[pixel] = weight;
            if (weight > 0.65) skinLuma.push(luminance(data[i], data[i + 1], data[i + 2]));
        }
    }

    const sourceMid = median(skinLuma);
    const [tr, tg, tb] = hexRgb(variant.tone);
    const targetMid = luminance(tr, tg, tb);
    const out = Buffer.from(data);
    let changed = 0;

    for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
            const pixel = y * info.width + x;
            const i = pixel * 4;
            const weight = weights[pixel];
            if (!weight) continue;

            const oldR = data[i]; const oldG = data[i + 1]; const oldB = data[i + 2];
            const oldLuma = luminance(oldR, oldG, oldB);
            // Curva comprimida: mantém músculos, rosto e brilho sem deixar os
            // realces brancos demais nem esmagar as sombras do tom profundo.
            const shade = Math.pow(Math.max(0.18, oldLuma / sourceMid), 0.72);
            const desiredLuma = targetMid * shade;
            const targetScale = desiredLuma / targetMid;
            const detail = (oldLuma - sourceMid) * 0.08;
            const nr = clamp(tr * targetScale + detail);
            const ng = clamp(tg * targetScale + detail);
            const nb = clamp(tb * targetScale + detail);

            // A máscara suave preserva maquiagem, lábios e pequenas variações.
            const blend = 0.9 * weight;
            out[i] = Math.round(oldR * (1 - blend) + nr * blend);
            out[i + 1] = Math.round(oldG * (1 - blend) + ng * blend);
            out[i + 2] = Math.round(oldB * (1 - blend) + nb * blend);
            if (out[i] !== oldR || out[i + 1] !== oldG || out[i + 2] !== oldB) changed += 1;
        }
    }

    const outputPath = path.join(outputDir, variant.output);
    await sharp(out, { raw: info }).png().toFile(outputPath);

    const verify = await sharp(outputPath).ensureAlpha().raw().toBuffer();
    let alphaChanged = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== verify[i]) alphaChanged += 1;
    return { ...variant, width: info.width, height: info.height, changed, alphaChanged };
}

fs.mkdirSync(outputDir, { recursive: true });
const results = [];
for (const variant of variants) results.push(await generate(variant));
fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(results, null, 2)}\n`);

for (const result of results) {
    console.log(`${result.output}: ${result.width}x${result.height}, pixels recoloridos=${result.changed}, alpha alterado=${result.alphaChanged}`);
}
