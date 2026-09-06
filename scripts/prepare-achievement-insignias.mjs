import sharp from 'sharp';

const assets = [
  {
    source: 'C:/Users/Afonso/.codex/generated_images/01a063d4-cfaa-7b80-9245-522a9c2710c4/exec-21ef5773-e7bc-4742-a1c0-72229cd0b121.png',
    output: 'public/assets/catalog/interface/insignia_ciclo_bronze.png',
  },
  {
    source: 'C:/Users/Afonso/.codex/generated_images/01a063d4-cfaa-7b80-9245-522a9c2710c4/exec-5f44673c-5c34-4028-9412-34c0dba51066.png',
    output: 'public/assets/catalog/interface/insignia_missao_prata.png',
  },
  {
    source: 'C:/Users/Afonso/.codex/generated_images/01a063d4-cfaa-7b80-9245-522a9c2710c4/exec-a47e6e80-ed76-41b2-829f-b0db972eabdc.png',
    output: 'public/assets/catalog/interface/insignia_quest_temporada.png',
  },
  {
    source: 'C:/Users/Afonso/.codex/generated_images/01a063d4-cfaa-7b80-9245-522a9c2710c4/exec-c7f0c3dd-3b04-49be-8cdc-380258f4c3b0.png',
    output: 'public/assets/catalog/interface/insignia_season_genesis.png',
  },
];

for (const { source, output, trimRows = 0 } of assets) {
  const pipeline = sharp(source);
  if (trimRows > 0) {
    const metadata = await pipeline.metadata();
    pipeline.extract({
      left: 0,
      top: trimRows,
      width: metadata.width,
      height: metadata.height - trimRows * 2,
    });
  }
  await pipeline
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(output);
}

const labels = [
  '01  CICLOS — BRONZE',
  '02  MISSÕES — PRATA',
  '03  QUEST DE TEMPORADA',
  '04  GENESIS',
];
const positions = [
  { left: 70, top: 70 },
  { left: 530, top: 70 },
  { left: 70, top: 540 },
  { left: 530, top: 540 },
];
const reviewLayers = [];

for (let index = 0; index < assets.length; index += 1) {
  const { left, top } = positions[index];
  reviewLayers.push({
    input: await sharp(assets[index].output).resize(360, 360).png().toBuffer(),
    left: left + 20,
    top,
  });
  reviewLayers.push({
    input: Buffer.from(
      `<svg width="400" height="52" xmlns="http://www.w3.org/2000/svg">
        <text x="200" y="32" text-anchor="middle" fill="#f4f0e8"
          font-family="Arial, sans-serif" font-size="20" font-weight="700">${labels[index]}</text>
      </svg>`,
    ),
    left,
    top: top + 372,
  });
}

await sharp({
  create: {
    width: 1000,
    height: 1000,
    channels: 4,
    background: '#111116',
  },
})
  .composite(reviewLayers)
  .png({ compressionLevel: 9 })
  .toFile('docs/insignias-conquistas-review.png');

console.log('docs/insignias-conquistas-review.png');
