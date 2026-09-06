import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mede a cabeca de um corpo e compara com o gabarito.
 *
 * Existe para conferir corpo NOVO enquanto ele esta sendo desenhado, em vez de
 * descobrir o desvio depois de a arte estar pronta e a roupa nao encaixar.
 *
 * O gabarito e body_masc_1: alto do cranio em y=54, centro em x=244, cabeca de
 * 42px de largura, pescoco em y=99. Os tres corpos masculinos ficam dentro de
 * 1,1% a 3,9% de diferenca de silhueta entre si; os femininos chegam a 16,1%
 * entre fem_1 e fem_2, sinal de terem sido gerados separados em vez de
 * recoloridos a partir de um so. Corpo novo deve nascer contra o gabarito, e os
 * tons devem sair todos do MESMO desenho.
 *
 * Uso:
 *   node scripts/check-avatar-geometry.mjs                    (todos os corpos)
 *   node scripts/check-avatar-geometry.mjs caminho/novo.png   (um arquivo)
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = path.join(root, 'public', 'assets', 'catalog', 'avatars');

const GABARITO = { topo: 54, centro: 244, largura: 42, pescoco: 99 };
const TOLERANCIA = 3;

// So tres medidas reprovam, e sao as que governam alguma coisa na tela: onde
// comeca o cranio e onde ele esta manda no encaixe do cabelo e do capuz, e a
// largura manda no quanto de cabeca escapa do elmo.
//
// O pescoco fica de fora de proposito. Ele nao e lido por nada — nem pelas
// caixas de REGIOES_DO_CORPO, que sao coordenadas absolutas — e um corpo
// feminino legitimamente tem pescoco mais fino e mais longo, o que empurra a
// medida em 4 ou 5 pixels sem nenhum efeito visivel. Reprovar por isso mandaria
// refazer arte que esta certa.
const CRITICAS = ['topo', 'centro', 'largura'];

/** Le a largura, a altura e o canal alfa de um PNG sem depender de biblioteca. */
const lerAlfa = async (arquivo) => {
    // O canvas do Node nao existe aqui, entao a leitura e feita pelo proprio
    // decodificador de PNG do Node 24 via createImageBitmap? Nao ha. Usamos o
    // esbuild? Tambem nao. Sharp e pesado. Como so precisamos do alfa, decodifi-
    // camos o PNG na unha: assinatura, IHDR e os IDAT inflados.
    const zlib = await import('node:zlib');
    const buf = fs.readFileSync(arquivo);
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${arquivo} nao e PNG`);

    let pos = 8;
    let largura = 0; let altura = 0; let profundidade = 0; let tipoCor = 0;
    const idat = [];
    let trns = null;
    while (pos < buf.length) {
        const tam = buf.readUInt32BE(pos);
        const tipo = buf.toString('ascii', pos + 4, pos + 8);
        const dados = buf.subarray(pos + 8, pos + 8 + tam);
        if (tipo === 'IHDR') {
            largura = dados.readUInt32BE(0);
            altura = dados.readUInt32BE(4);
            profundidade = dados[8];
            tipoCor = dados[9];
        } else if (tipo === 'IDAT') {
            idat.push(dados);
        } else if (tipo === 'tRNS') {
            trns = Buffer.from(dados);
        } else if (tipo === 'IEND') break;
        pos += 12 + tam;
    }

    // Os corpos sao PNG PALETADO (color type 3) com a transparencia numa tabela
    // tRNS separada, nao RGBA. Ler so o tipo 6 rejeitava justamente os arquivos
    // que este script existe para medir.
    const CANAIS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
    const canais = CANAIS[tipoCor];
    if (profundidade !== 8 || !canais) {
        throw new Error(`${path.basename(arquivo)}: suportado apenas 8 bits nos color types 0/2/3/4/6, veio type ${tipoCor} depth ${profundidade}`);
    }

    const cru = zlib.inflateSync(Buffer.concat(idat));
    const passo = largura * canais;
    const linhas = Buffer.alloc(altura * passo);

    // Desfaz os filtros por linha do PNG (None/Sub/Up/Average/Paeth).
    const paeth = (a, b, c) => {
        const p = a + b - c;
        const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c);
        return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
    };
    let origem = 0;
    for (let y = 0; y < altura; y += 1) {
        const filtro = cru[origem]; origem += 1;
        const destino = y * passo;
        for (let x = 0; x < passo; x += 1) {
            const bruto = cru[origem + x];
            const esq = x >= canais ? linhas[destino + x - canais] : 0;
            const cima = y > 0 ? linhas[destino - passo + x] : 0;
            const diag = (y > 0 && x >= canais) ? linhas[destino - passo + x - canais] : 0;
            let valor;
            if (filtro === 0) valor = bruto;
            else if (filtro === 1) valor = bruto + esq;
            else if (filtro === 2) valor = bruto + cima;
            else if (filtro === 3) valor = bruto + ((esq + cima) >> 1);
            else if (filtro === 4) valor = bruto + paeth(esq, cima, diag);
            else throw new Error(`filtro PNG desconhecido: ${filtro}`);
            linhas[destino + x] = valor & 0xff;
        }
        origem += passo;
    }

    // Onde esta o alfa depende do tipo: RGBA e cinza+alfa carregam por pixel;
    // paletado consulta a tRNS pelo indice; RGB e cinza puros sao opacos.
    let opaco;
    if (tipoCor === 6) opaco = (x, y) => linhas[y * passo + x * canais + 3] > 16;
    else if (tipoCor === 4) opaco = (x, y) => linhas[y * passo + x * canais + 1] > 16;
    else if (tipoCor === 3) {
        opaco = (x, y) => {
            const indice = linhas[y * passo + x];
            const a = trns && indice < trns.length ? trns[indice] : 255;
            return a > 16;
        };
    } else opaco = () => true;

    return { largura, altura, opaco };
};

const medir = ({ largura, altura, opaco }) => {
    const porLinha = [];
    for (let y = 0; y < altura; y += 1) {
        let n = 0;
        for (let x = 0; x < largura; x += 1) if (opaco(x, y)) n += 1;
        porLinha.push(n);
    }
    const topo = porLinha.findIndex((n) => n > 0);
    if (topo < 0) return null;

    // O pescoco e a linha mais estreita logo abaixo do cranio. As 25 primeiras
    // ficam de fora porque o alto da cabeca e naturalmente estreito e venceria
    // a busca pelo minimo.
    let pescoco = topo + 25; let menor = Infinity;
    for (let y = topo + 25; y < Math.min(altura, topo + 120); y += 1) {
        if (porLinha[y] < menor) { menor = porLinha[y]; pescoco = y; }
    }

    let x0 = largura; let x1 = -1; let larguraCabeca = 0;
    for (let y = topo; y < pescoco; y += 1) {
        for (let x = 0; x < largura; x += 1) {
            if (!opaco(x, y)) continue;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
        }
        if (porLinha[y] > larguraCabeca) larguraCabeca = porLinha[y];
    }
    return { topo, pescoco, centro: Math.floor((x0 + x1) / 2), largura: larguraCabeca };
};

const alvos = process.argv.slice(2);
const arquivos = alvos.length
    ? alvos.map((a) => path.resolve(root, a))
    : fs.readdirSync(PASTA).filter((f) => /^body_.*\.png$/.test(f)).map((f) => path.join(PASTA, f));

console.log(`gabarito: topo y=${GABARITO.topo}  centro x=${GABARITO.centro}  largura ${GABARITO.largura}px  pescoco y=${GABARITO.pescoco}`);
console.log(`tolerancia: ${TOLERANCIA}px nas medidas criticas (${CRITICAS.join(', ')})`);
console.log('o pescoco aparece so para informar e nao reprova\n');

let fora = 0;
for (const arquivo of arquivos) {
    const nome = path.basename(arquivo);
    let m;
    try {
        m = medir(await lerAlfa(arquivo));
    } catch (erro) {
        console.log(`${nome.padEnd(22)} ERRO: ${erro.message}`);
        fora += 1;
        continue;
    }
    if (!m) { console.log(`${nome.padEnd(22)} vazio`); fora += 1; continue; }

    const desvios = {
        topo: m.topo - GABARITO.topo,
        centro: m.centro - GABARITO.centro,
        largura: m.largura - GABARITO.largura,
        pescoco: m.pescoco - GABARITO.pescoco,
    };
    const ruim = CRITICAS.some((chave) => Math.abs(desvios[chave]) > TOLERANCIA);
    if (ruim) fora += 1;
    const sinal = (n) => (n > 0 ? `+${n}` : String(n));
    console.log(
        `${nome.padEnd(22)} ${ruim ? 'FORA' : ' ok '}  `
        + `topo ${String(m.topo).padStart(3)} (${sinal(desvios.topo).padStart(3)})  `
        + `centro ${String(m.centro).padStart(3)} (${sinal(desvios.centro).padStart(3)})  `
        + `largura ${String(m.largura).padStart(3)} (${sinal(desvios.largura).padStart(3)})  `
        + `pescoco ${String(m.pescoco).padStart(3)} (${sinal(desvios.pescoco).padStart(3)})`,
    );
}

console.log(`\n${arquivos.length - fora} de ${arquivos.length} dentro da tolerancia.`);
console.log('Corpo fora do gabarito nao e erro de build — e a arte que a roupa nao vai encaixar.');
