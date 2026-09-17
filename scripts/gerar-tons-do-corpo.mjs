import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/**
 * Gera os tons de pele de um corpo a partir de UM desenho so.
 *
 * Existe porque os corpos femininos tinham sido desenhados separados em vez de
 * recoloridos: body_fem_1, _2 e _3 sao de 16/ago e body_fem_4 e _5 sao de
 * 02/set, com a cabeca em lugares diferentes — fem_1 e fem_3 com o alto do
 * cranio 7px acima do gabarito e 3 a 5px mais largos. Cada cabelo foi afinado
 * na tools/avatar-align.html contra body_fem_5, entao o ajuste fino so valia
 * naquele corpo e o cabelo saia do lugar nos outros quatro. Nao ha tabela de
 * offset que conserte isso: eram cinco geometrias para um encaixe so.
 *
 * O caminho certo e o que o scripts/check-avatar-geometry.mjs ja mandava: "os
 * tons devem sair todos do MESMO desenho". Este script faz isso — pega o corpo
 * que passa no gabarito e escurece a PELE, deixando roupa, cabelo e olhos como
 * estao.
 *
 * Como a pele e reconhecida: por matiz. Pele fica entre 2 e 46 graus com alguma
 * saturacao; o collant branco tem saturacao perto de zero e o cabelo tem valor
 * baixo, entao os dois ficam de fora sozinhos, sem mascara desenhada a mao.
 *
 * Os fatores de cada tom nao foram inventados: saem da razao medida entre os
 * tons que o jogo ja aceita (body_masc_1 -> _2 -> _3 e o trio feminino antigo),
 * que concordam entre si dentro de 4%. Assim a escada nova cai na mesma familia
 * de marrons do resto do catalogo.
 *
 * Uso:
 *   node scripts/gerar-tons-do-corpo.mjs body_fem_5 body_fem_1..5
 *   node scripts/gerar-tons-do-corpo.mjs body_fem_5 body_fem_1..5 --conferir
 */

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = path.join(root, 'public', 'assets', 'catalog', 'avatars');

/**
 * Multiplicadores de cada degrau, do mais claro ao mais escuro.
 *
 * O degrau 1 e o proprio desenho, sem toque. Os degraus 3 e 5 sao as razoes
 * medidas nos tons 2 e 3 das familias que ja existiam; 2 e 4 ficam no meio, de
 * modo que a escada suba parelha em vez de dar um salto no fim.
 */
const DEGRAUS = [
    [1.000, 1.000, 1.000],
    [0.880, 0.820, 0.740],
    [0.798, 0.684, 0.562],
    [0.640, 0.540, 0.460],
    [0.508, 0.418, 0.374],
];

const paraHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const d = mx - mn;
    let h = 0;
    if (d) {
        if (mx === r) h = 60 * (((g - b) / d) % 6);
        else if (mx === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    return [h < 0 ? h + 360 : h, mx ? d / mx : 0, mx];
};

/**
 * Se um pixel e pele.
 *
 * `r > b` entra porque sombra azulada no tecido branco as vezes cai dentro da
 * faixa de matiz por arredondamento, e pele nunca tem mais azul que vermelho.
 */
const ehPele = (r, g, b) => {
    const [h, s, v] = paraHsv(r, g, b);
    return h >= 2 && h <= 46 && s >= 0.13 && s <= 0.78 && v >= 0.22 && r > b;
};

/**
 * O alfa que o desenho usa por dentro.
 *
 * body_fem_4 e body_fem_5 sairam do editor com alfa 240 no corpo inteiro — 6%
 * translucidos, com a aura e a placa aparecendo por baixo da pele. Pegar o
 * MAIOR alfa nao acha isso, porque nove pixels soltos estao em 255; o que
 * acha e o alfa mais REPETIDO entre os opacos.
 */
const alfaDeDentro = (data, canais) => {
    const conta = new Map();
    for (let i = 3; i < data.length; i += canais) {
        const a = data[i];
        if (a > 200) conta.set(a, (conta.get(a) || 0) + 1);
    }
    let melhor = 255; let maior = 0;
    for (const [a, n] of conta) if (n > maior) { maior = n; melhor = a; }
    return melhor;
};

const expandirAlvos = (texto) => {
    const faixa = texto.match(/^(.*?)(\d+)\.\.(\d+)$/);
    if (!faixa) return [texto];
    const [, prefixo, de, ate] = faixa;
    const saida = [];
    for (let i = Number(de); i <= Number(ate); i += 1) saida.push(`${prefixo}${i}`);
    return saida;
};

const base = process.argv[2];
const alvos = expandirAlvos(process.argv[3] || '');
const soConferir = process.argv.includes('--conferir');

if (!base || !alvos.length) {
    console.error('uso: node scripts/gerar-tons-do-corpo.mjs <base> <alvo1..alvoN> [--conferir]');
    process.exit(1);
}
if (alvos.length > DEGRAUS.length) {
    console.error(`ha ${DEGRAUS.length} degraus definidos e ${alvos.length} alvos pedidos.`);
    process.exit(1);
}

const arquivoBase = path.join(PASTA, `${base}.png`);
if (!fs.existsSync(arquivoBase)) {
    console.error(`nao achei ${arquivoBase}`);
    process.exit(1);
}

const { data, info } = await sharp(arquivoBase).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const alfaBase = alfaDeDentro(data, channels);
const ganho = 255 / alfaBase;

console.log(`base: ${base}.png  ${width}x${height}  alfa de dentro ${alfaBase}${alfaBase < 255 ? ` -> corrigido para 255 (x${ganho.toFixed(4)})` : ''}`);
if (soConferir) console.log('modo conferir: nada sera gravado');

for (let t = 0; t < alvos.length; t += 1) {
    const k = DEGRAUS[t];
    const saida = Buffer.alloc(width * height * 4);
    let soma = [0, 0, 0]; let pele = 0;

    for (let p = 0; p < width * height; p += 1) {
        const i = p * channels;
        const o = p * 4;
        const r = data[i]; const g = data[i + 1]; const b = data[i + 2]; const a = data[i + 3];

        saida[o + 3] = Math.min(255, Math.round(a * ganho));

        if (a > 0 && ehPele(r, g, b)) {
            saida[o] = Math.min(255, Math.round(r * k[0]));
            saida[o + 1] = Math.min(255, Math.round(g * k[1]));
            saida[o + 2] = Math.min(255, Math.round(b * k[2]));
            soma[0] += saida[o]; soma[1] += saida[o + 1]; soma[2] += saida[o + 2];
            pele += 1;
        } else {
            saida[o] = r; saida[o + 1] = g; saida[o + 2] = b;
        }
    }

    const media = pele
        ? '#' + soma.map((v) => Math.round(v / pele).toString(16).padStart(2, '0')).join('').toUpperCase()
        : '-';
    const destino = path.join(PASTA, `${alvos[t]}.png`);
    if (!soConferir) {
        await sharp(saida, { raw: { width, height, channels: 4 } })
            .png({ compressionLevel: 9 })
            .toFile(destino);
    }
    console.log(`  ${alvos[t]}.png  degrau ${t + 1}  pele media ${media}  ${pele}px`);
}

console.log(soConferir ? 'nada gravado.' : 'pronto. rode scripts/check-avatar-geometry.mjs para conferir a geometria.');
