import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const project = path.resolve(__dirname, '..');
const items = [
  ['public/assets/catalog/interface/insignia_rank_1_vagante.png', '01 VAGANTE'],
  ['public/assets/catalog/interface/insignia_rank_2_escudeiro.png', '02 ESCUDEIRO'],
  ['public/assets/catalog/interface/insignia_rank_3_cavaleiro.png', '03 CAVALEIRO'],
  ['public/assets/catalog/interface/insignia_rank_4_lorde.png', '04 LORDE'],
  ['public/assets/catalog/interface/insignia_rank_5_barao.png', '05 BARAO'],
  ['public/assets/catalog/interface/insignia_rank_6_conde.png', '06 CONDE'],
  ['public/assets/catalog/interface/insignia_rank_7_duque.png', '07 DUQUE'],
  ['public/assets/catalog/interface/insignia_rank_8_principe.png', '08 PRINCIPE'],
  ['public/assets/catalog/interface/insignia_rank_9_rei.png', '09 REI'],
  ['public/assets/catalog/interface/insignia_rank_10_soberano.png', '10 SOBERANO'],
];

async function main() {
  const layers = [];
  for (let i = 0; i < items.length; i += 1) {
    const [source, label] = items[i];
    const input = path.isAbsolute(source) ? source : path.join(project, source);
    const left = (i % 5) * 300;
    const top = Math.floor(i / 5) * 350;
    layers.push({
      input: await sharp(input).resize(260, 260, { fit: 'contain' }).png().toBuffer(),
      left: left + 20,
      top: top + 18,
    });
    const color = '#f1f1f1';
    layers.push({
      input: Buffer.from(`<svg width="300" height="60" xmlns="http://www.w3.org/2000/svg"><text x="150" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${color}">${label}</text></svg>`),
      left,
      top: top + 282,
    });
  }
  await sharp({ create: { width: 1500, height: 700, channels: 4, background: '#101114' } })
    .composite(layers)
    .png()
    .toFile(path.join(project, 'docs/insignias-review.png'));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
