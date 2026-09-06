import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const assetRoot = path.join(root, 'public', 'assets', 'catalog', 'interface');

const sections = [
  {
    title: 'BAÚS',
    top: 90,
    items: [
      ['bau_comum.webp', '01  BAÚ NORMAL', 'COMUM · INCOMUM'],
      ['bau_raro.webp', '02  BAÚ PRATA', 'RARO · CICLO'],
      ['bau_epico.webp', '03  BAÚ DE OURO', 'ÉPICO'],
      ['bau_mitico.webp', '04  BAÚ MÍTICO', 'QUEST · TEMPORADA'],
      ['bau_lendario.webp', '05  BAÚ LENDÁRIO', 'LENDÁRIO'],
    ],
  },
  {
    title: 'INSÍGNIAS DE PATENTE',
    top: 485,
    items: [
      ['insignia_rank_1_vagante.webp', '01  VAGANTE', 'PATENTE'],
      ['insignia_rank_2_escudeiro.webp', '02  ESCUDEIRO', 'PATENTE'],
      ['insignia_rank_3_cavaleiro.webp', '03  CAVALEIRO', 'PATENTE'],
      ['insignia_rank_4_lorde.webp', '04  LORDE', 'PATENTE'],
      ['insignia_rank_5_barao.webp', '05  BARÃO', 'PATENTE'],
      ['insignia_rank_6_conde.webp', '06  CONDE', 'PATENTE'],
      ['insignia_rank_7_duque.webp', '07  DUQUE', 'PATENTE'],
      ['insignia_rank_8_principe.webp', '08  PRÍNCIPE', 'PATENTE'],
      ['insignia_rank_9_rei.webp', '09  REI', 'PATENTE'],
      ['insignia_rank_10_soberano.webp', '10  SOBERANO', 'PATENTE'],
    ],
  },
  {
    title: 'INSÍGNIAS DE CONQUISTA',
    top: 1195,
    items: [
      ['insignia_ciclo_bronze.webp', 'CICLOS', 'BRONZE · ACUMULÁVEL'],
      ['insignia_missao_prata.webp', 'MISSÕES', 'PRATA · ACUMULÁVEL'],
      ['insignia_quest_temporada.webp', 'QUEST DE TEMPORADA', 'AZUL-ROXA · GENÉRICA'],
      ['insignia_season_genesis.webp', 'GÊNESIS', 'EXCLUSIVA DA TEMPORADA'],
    ],
  },
];

const width = 1600;
const height = 1580;
const cellWidth = 320;
const rowHeight = 335;
const layers = [];

const textLayer = (width, height, markup) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${markup}</svg>`,
);

for (const section of sections) {
  layers.push({
    input: textLayer(width, 46,
      `<text x="32" y="32" fill="#f1eee7" font-family="Arial,sans-serif" font-size="25" font-weight="800" letter-spacing="2">${section.title}</text>`),
    left: 0,
    top: section.top - 46,
  });

  for (let index = 0; index < section.items.length; index += 1) {
    const [filename, name, detail] = section.items[index];
    const column = index % 5;
    const row = Math.floor(index / 5);
    const left = column * cellWidth;
    const top = section.top + row * rowHeight;
    layers.push({
      input: await sharp(path.join(assetRoot, filename))
        .resize(260, 260, { fit: 'contain' })
        .png()
        .toBuffer(),
      left: left + 30,
      top,
    });
    layers.push({
      input: textLayer(cellWidth, 66, `
        <text x="160" y="25" text-anchor="middle" fill="#f5f2eb" font-family="Arial,sans-serif" font-size="18" font-weight="800">${name}</text>
        <text x="160" y="49" text-anchor="middle" fill="#9da3ad" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="1">${detail}</text>`),
      left,
      top: top + 260,
    });
  }
}

await sharp({
  create: { width, height, channels: 4, background: '#101217' },
})
  .composite(layers)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'docs', 'insignias-e-baus-nomeados.png'));

console.log('docs/insignias-e-baus-nomeados.png');
