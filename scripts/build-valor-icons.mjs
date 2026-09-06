import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outDir = path.join(root, 'public', 'assets', 'icons');
const reviewPath = path.join(root, 'docs', 'valor-icons-review.png');

const svg = (body) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${body}
</svg>`);

// Shapes are intentionally broad and flat: these assets live at 16 px in the UI.
const icons = {
  'exp.png': svg(`
    <path fill="#B6842D" fill-rule="evenodd" d="M40 94h82l73 108 72-108h78L238 253l111 165h-82l-72-108-73 108H40l113-165L40 94Zm249 0h105c57 0 91 34 91 91 0 58-35 92-91 92h-34v141h-71V94Zm71 62v59h29c17 0 26-10 26-30 0-19-9-29-26-29h-29Z"/>
    <path fill="#D7B25A" d="M72 116h31l66 97-17 25-80-122Zm246 0h73c29 0 49 13 59 36h-90v38h-42v-74Z"/>
  `),
  'ouro.png': svg(`
    <circle cx="256" cy="256" r="204" fill="#B6842D"/>
    <path fill="#D7B25A" fill-rule="evenodd" d="M256 84a172 172 0 1 1 0 344 172 172 0 0 1 0-344Zm0 36a136 136 0 1 0 0 272 136 136 0 0 0 0-272Z"/>
    <circle cx="256" cy="256" r="104" fill="#B6842D"/>
  `),
  'fragmento.png': svg(`
    <path fill="#684093" d="m208 47 193 103-38 274-174 44-91-191 110-230Z"/>
    <path fill="#9870B7" d="m208 47 43 262-62 159-91-191 110-230Zm43 262 150-159-38 274-112-115Z"/>
  `),
  'acoes.png': svg(`
    <g transform="translate(51.2 51.2) scale(.8)">
      <path d="M83 246 217 380 428 153" fill="none" stroke="#31875A" stroke-width="90" stroke-linecap="square" stroke-linejoin="miter"/>
      <path d="M82 223 216 357 392 168" fill="none" stroke="#6BB58A" stroke-width="18" stroke-linecap="square" stroke-linejoin="miter"/>
    </g>
  `),
  'sequencia.png': svg(`
    <path fill="#B94732" d="M189 63c82 53 113 123 94 198 29-19 45-45 46-77 55 53 80 119 64 184-17 67-70 106-137 106-83 0-143-55-143-135 0-57 31-96 58-133 31-42 30-88 18-143Z"/>
    <path fill="#DE8644" d="M257 251c9 38-14 64-35 91-28 37-13 88 33 105 44-16 68-55 61-96-5-33-26-61-51-88 1 28-3 47-17 66 3-29 1-53 9-78Z"/>
  `),
  'meta.png': svg(`
    <circle cx="256" cy="256" r="208" fill="#B83E3B"/>
    <circle cx="256" cy="256" r="143" fill="#F3F0E8"/>
    <circle cx="256" cy="256" r="68" fill="#B83E3B"/>
  `),
};

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(path.dirname(reviewPath), { recursive: true });

const rendered = {};
for (const [name, source] of Object.entries(icons)) {
  const output = path.join(outDir, name);
  await sharp(source).png({ compressionLevel: 9 }).toFile(output);
  rendered[name] = await fs.readFile(output);
}

const labels = [
  ['exp.png', 'EXP'],
  ['ouro.png', 'OURO'],
  ['fragmento.png', 'FRAGMENTO'],
  ['acoes.png', 'ACOES'],
  ['sequencia.png', 'SEQUENCIA'],
  ['meta.png', 'META'],
];

const width = 1080;
const height = 710;
const composites = [];
const labelSvg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
  `<rect width="100%" height="100%" fill="#202329"/>`,
  `<text x="36" y="42" fill="#fff" font-family="Arial,sans-serif" font-size="24" font-weight="700">Ícones de valor — prova real em 16 px</text>`,
  `<text x="36" y="68" fill="#aeb5c0" font-family="Arial,sans-serif" font-size="15">À esquerda: arte 80 px · centro: 16 px em #14161a e branco · direita: ampliação pixelada do render de 16 px</text>`];

for (let i = 0; i < labels.length; i++) {
  const [name, label] = labels[i];
  const y = 96 + i * 99;
  labelSvg.push(`<rect x="24" y="${y - 10}" width="1032" height="88" rx="10" fill="${i % 2 ? '#292d34' : '#25282f'}"/>`);
  labelSvg.push(`<text x="128" y="${y + 29}" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="700">${label}</text>`);
  labelSvg.push(`<text x="128" y="${y + 54}" fill="#aeb5c0" font-family="Arial,sans-serif" font-size="14">+150</text>`);
  labelSvg.push(`<rect x="310" y="${y + 9}" width="150" height="48" rx="8" fill="#14161a"/><text x="328" y="${y + 40}" fill="#f3f5f7" font-family="Arial,sans-serif" font-size="20" font-weight="700">+150</text>`);
  labelSvg.push(`<rect x="480" y="${y + 9}" width="150" height="48" rx="8" fill="#fff"/><text x="498" y="${y + 40}" fill="#202329" font-family="Arial,sans-serif" font-size="20" font-weight="700">+150</text>`);
  const icon80 = await sharp(rendered[name]).resize(80, 80).png().toBuffer();
  const icon16 = await sharp(rendered[name]).resize(16, 16).png().toBuffer();
  const zoom = await sharp(icon16).resize(80, 80, { kernel: 'nearest' }).png().toBuffer();
  composites.push({ input: icon80, left: 36, top: y - 6 });
  composites.push({ input: icon16, left: 424, top: y + 25 });
  composites.push({ input: icon16, left: 594, top: y + 25 });
  composites.push({ input: zoom, left: 672, top: y - 6 });
}
labelSvg.push('</svg>');

await sharp(Buffer.from(labelSvg.join('')))
  .composite(composites)
  .png({ compressionLevel: 9 })
  .toFile(reviewPath);

console.log(JSON.stringify({ outputs: Object.keys(icons), review: reviewPath }, null, 2));
