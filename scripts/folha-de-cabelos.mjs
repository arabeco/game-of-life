import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as esbuild from 'esbuild';

/**
 * Uma folha com os 26 cabelos na cabeca do mesmo corpo, ja com o ajuste da
 * tabela aplicado.
 *
 * Existe porque conferir encaixe estava custando caro demais para ser feito: a
 * tools/avatar-preview.html mostra UMA peca em todos os corpos, entao ver o
 * catalogo inteiro era trocar de peca 26 vezes e comparar de memoria. O erro
 * que interessa — o cabelo alto demais deixando o cranio aparecer, ou baixo
 * demais comendo a sobrancelha — salta quando as 26 estao lado a lado, e
 * desaparece quando se ve uma de cada vez.
 *
 * Desenha do mesmo jeito que o CanvasAvatar: getAvatarOffset com o corpo em
 * cena, applyAvatarOffset para a caixa. Se a folha mostra certo, o app mostra
 * certo — e o contrario tambem, que e o ponto.
 *
 * Uso:
 *   node scripts/folha-de-cabelos.mjs                 (body_fem_1)
 *   node scripts/folha-de-cabelos.mjs body_masc_1
 */

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AVATARES = path.join(root, 'public', 'assets', 'catalog', 'avatars');
const CABELOS = path.join(AVATARES, 'hair');

const empacota = async () => {
    const destino = path.join(root, 'node_modules', '.cache', 'folha-de-cabelos.mjs');
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(root, 'constants', 'avatarOffsets.ts')],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { getAvatarOffset, applyAvatarOffset } = await empacota();

const corpo = process.argv[2] || 'body_fem_1';
const arquivoDoCorpo = path.join(AVATARES, `${corpo}.png`);
if (!fs.existsSync(arquivoDoCorpo)) {
    console.error(`nao achei ${arquivoDoCorpo}`);
    process.exit(1);
}

const L = 500;
// Margem para o ajuste poder sair do quadro sem estourar o composite, que nao
// aceita coordenada negativa.
const M = 120;
// A janela da cabeca, generosa o bastante para caber topete e cabelo comprido.
const JANELA = { left: 175, top: 5, largura: 150, altura: 170 };
const Z = 1.35;
const CELULA = { largura: Math.round(JANELA.largura * Z), altura: Math.round(JANELA.altura * Z) };
const ROTULO = 20;
const COLUNAS = 6;

const pecas = fs.readdirSync(CABELOS).filter((n) => n.toLowerCase().endsWith('.png')).sort();

const desenhar = async (arquivoDoCabelo) => {
    const ajuste = getAvatarOffset(arquivoDoCabelo, `${corpo}.png`);
    const caixa = applyAvatarOffset(L, L, ajuste);
    const cabelo = await sharp(path.join(CABELOS, arquivoDoCabelo))
        .resize(Math.round(caixa.w), Math.round(caixa.h)).png().toBuffer();
    const base = await sharp(arquivoDoCorpo).png().toBuffer();

    const inteiro = await sharp({
        create: { width: L + 2 * M, height: L + 2 * M, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([
        { input: base, left: M, top: M },
        { input: cabelo, left: M + Math.round(caixa.x), top: M + Math.round(caixa.y) },
    ]).png().toBuffer();

    return sharp(inteiro)
        .extract({ left: M + JANELA.left, top: M + JANELA.top, width: JANELA.largura, height: JANELA.altura })
        .resize(CELULA.largura, CELULA.altura)
        .flatten({ background: '#c8c8c8' })
        .png().toBuffer();
};

const rotuloDe = (nome, ajuste) => {
    const curto = nome.replace(/^CABELO_/, '').replace(/\.png$/, '');
    const dx = ajuste?.x ?? 0; const dy = ajuste?.y ?? 0; const e = ajuste?.scale ?? 1;
    const numeros = `${dx} / ${dy}${Math.abs(e - 1) > 0.001 ? `  ×${e.toFixed(2)}` : ''}`;
    const svg = `<svg width="${CELULA.largura}" height="${ROTULO}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1b1d21"/>
        <text x="5" y="14" font-family="monospace" font-size="10" fill="#e8eaee">${curto}</text>
        <text x="${CELULA.largura - 5}" y="14" font-family="monospace" font-size="10" fill="#d8b44c" text-anchor="end">${numeros}</text>
    </svg>`;
    return Buffer.from(svg);
};

const linhas = Math.ceil(pecas.length / COLUNAS);
const alturaDaCelula = CELULA.altura + ROTULO;
const composicao = [];

for (let i = 0; i < pecas.length; i += 1) {
    const col = i % COLUNAS;
    const lin = Math.floor(i / COLUNAS);
    composicao.push({ input: await desenhar(pecas[i]), left: col * CELULA.largura, top: lin * alturaDaCelula });
    composicao.push({
        input: rotuloDe(pecas[i], getAvatarOffset(pecas[i], `${corpo}.png`)),
        left: col * CELULA.largura,
        top: lin * alturaDaCelula + CELULA.altura,
    });
}

const saida = path.join(root, 'node_modules', '.cache', `folha-${corpo}.png`);
await sharp({
    create: { width: COLUNAS * CELULA.largura, height: linhas * alturaDaCelula, channels: 3, background: '#1b1d21' },
}).composite(composicao).png().toFile(saida);

console.log(`${pecas.length} cabelos em ${corpo}`);
console.log(saida);
