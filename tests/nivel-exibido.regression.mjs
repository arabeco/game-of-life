import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A ESCADA VAI DE 0 A 10 POR AREA, E O INDICE COMECA EM 50.
 *
 * Cada area tem onze degraus: o 0 e o abandono — quem parou de encarar — e o 10
 * e a obra. O Indice Glyph e a base de 50 mais a soma dos cinco degraus, entao
 * ele vai de 50 (tudo abandonado) a 100 (tudo no topo), e as cinco pontas do
 * pentagono somam exatamente a metade de cima do numero do meio.
 *
 * Tres coisas precisam andar juntas, e nenhuma avisa quando se separa:
 *
 *   1. o numero de frases por area (11) e o de nomes de degrau (11);
 *   2. a conta do Indice: base 50 + 5 areas x 10 degraus = 100 exatos;
 *   3. o degrau da area aparece cru na tela, sem multiplicador.
 *
 * O terceiro ponto tem historia. Houve uma versao em que o degrau valia dois na
 * exibicao, para as pontas somarem 100 sem ninguem multiplicar. A conta fechava
 * e o numero soava falso — "estou no nivel 20 em Saude" e um numero que o modelo
 * nao tem. A base de 50 resolve a mesma coisa sem inventar escala.
 *
 * E o perigo maior nunca foi esquecer a conta: e faze-la em metade dos lugares.
 * O cracha do UserAvatar imprimia a soma crua enquanto o texto ao lado ja
 * convertia, e o mesmo membro aparecia com dois numeros na mesma linha. Nenhum
 * dos dois estava quebrado — eles so discordavam, que e o jeito mais caro de
 * errar, porque parece que o app mente em algum lugar e ninguem sabe qual.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (relativo) => fs.readFileSync(path.join(raiz, relativo), 'utf8');

const arquivosDeTela = () => {
    const saida = [];
    const andar = (dir) => {
        for (const entrada of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
            const relativo = `${dir}/${entrada.name}`;
            if (entrada.isDirectory()) andar(relativo);
            else if (entrada.name.endsWith('.tsx')) saida.push(relativo);
        }
    };
    andar('components');
    andar('views');
    return saida;
};

let falhas = 0;
const reprovar = (mensagem) => { falhas += 1; console.log(`nao ok - ${mensagem}`); };

const areas = ler('constants/lifeAreas.ts');
const numero = (nome) => {
    const achado = areas.match(new RegExp(`${nome} = (\\d+)`));
    assert.ok(achado, `${nome} sumiu de constants/lifeAreas.ts`);
    return Number(achado[1]);
};

// ------------------------------------------------------------------ 1. a conta
const TETO = numero('MASTERY_AREA_MAX_LEVEL');
const BASE = numero('MASTERY_INDEX_BASE');
const TOTAL = numero('MASTERY_TOTAL_MAX_LEVEL');
const CRU = numero('MASTERY_RAW_TOTAL_MAX_LEVEL');

assert.equal(
    BASE + TETO * 5,
    TOTAL,
    `a conta do Índice parou de fechar: ${BASE} + 5x${TETO} deveria dar ${TOTAL}`,
);
console.log(`ok - ${BASE} de base + 5 áreas x ${TETO} degraus = ${TOTAL}`);

assert.equal(CRU, TETO * 5, 'MASTERY_RAW_TOTAL_MAX_LEVEL saiu de sincronia com o teto da área');
console.log(`ok - a soma crua máxima continua ${CRU}`);

assert.equal(
    numero('PONTOS_POR_DEGRAU'),
    1,
    'o degrau da área voltou a ser multiplicado na exibição — foi isso que criou o "nível 20"',
);
console.log('ok - o degrau da área aparece cru');

// ----------------------------------------------------- 2. onze frases, onze nomes
const nomes = areas.match(/MASTERY_LEVEL_NAMES = \[([^\]]*)\]/);
assert.ok(nomes, 'MASTERY_LEVEL_NAMES sumiu');
const quantosNomes = (nomes[1].match(/'/g) || []).length / 2;
assert.equal(
    quantosNomes,
    TETO + 1,
    `são ${TETO + 1} degraus (0 a ${TETO}), mas ${quantosNomes} nomes — a escada fica deslocada`,
);
console.log(`ok - ${quantosNomes} nomes de degrau, um por nível`);

for (const [, id, bloco] of areas.matchAll(/id: '(\w+)',[\s\S]*?levelDescriptions: \[([\s\S]*?)\],\n/g)) {
    const quantas = (bloco.match(/^\s*'/gm) || []).length;
    if (quantas !== TETO + 1) {
        reprovar(`${id}: ${quantas} frases, esperava ${TETO + 1} (do degrau 0 ao ${TETO})`);
    }
}
if (falhas === 0) console.log(`ok - cada área tem ${TETO + 1} frases`);

// ------------------------------------- 3. o mapa de frases comeca no degrau zero
for (const arquivo of ['constants/GMboard.ts', 'contexts/GameContext.tsx']) {
    if (/\[index \+ 1\]: description|\[i \+ 1\]: desc/.test(ler(arquivo))) {
        reprovar(`${arquivo}: o mapa de frases ainda começa em 1 — a frase do abandono viraria a do degrau 1`);
    }
}
if (falhas === 0) console.log('ok - o mapa de frases começa no degrau 0');

// ------------------------------------------------------- 4. o cracha do avatar
const avatar = ler('components/UserAvatar.tsx');
if (/<span[^>]*>\{level\}<\/span>/.test(avatar)) {
    reprovar('UserAvatar voltou a imprimir `level` cru: o crachá vai discordar do texto ao lado dele');
} else if (!avatar.includes('getDisplayLevel(level)')) {
    reprovar('UserAvatar deixou de converter o nível — confira como o crachá está sendo montado');
} else {
    console.log('ok - o crachá do avatar converte antes de mostrar');
}

// ------------------------------------- 5. ninguem exibe cru, nem dobra a mao
const EXIBE_CRU = /(?:Nv\.?|N[íi]vel|Lv\.?|LVL)\s*\{\s*(?!getDisplayLevel|getAreaDisplayLevel)[A-Za-z_$][\w$?.]*\.level\b/g;
const DOBRA = /\.level\s*\*\s*2\b|\blevel\s*\*\s*2\b/g;

for (const arquivo of arquivosDeTela()) {
    const fonte = ler(arquivo);
    for (const achado of fonte.match(EXIBE_CRU) || []) {
        reprovar(`${arquivo}: mostra nível cru em ${JSON.stringify(achado.trim())}`);
    }
    for (const achado of fonte.match(DOBRA) || []) {
        reprovar(`${arquivo}: dobra o nível à mão em ${JSON.stringify(achado.trim())}`);
    }
}
if (falhas === 0) console.log('ok - nenhuma tela mostra nível cru nem dobra à mão');

// --------------------------------------- 6. as telas de area usam a escala
const DA_AREA = [
    'components/AssetPentagon.tsx',
    'components/Sephirot.tsx',
    'components/ProfileAssetsPreview.tsx',
    'views/AssetsView.tsx',
    'components/MasteryWheel.tsx',
];
for (const arquivo of DA_AREA) {
    const fonte = ler(arquivo);
    if (!fonte.includes('getAreaDisplayLevel') && !fonte.includes('PONTOS_POR_DEGRAU')) {
        reprovar(`${arquivo}: mostra nível de área sem passar pela escala de exibição`);
    }
}
if (falhas === 0) console.log(`ok - as ${DA_AREA.length} telas de área usam a escala de exibição`);

assert.equal(falhas, 0, 'a escada de níveis saiu de sincronia');

console.log(`\nescada conferida: 0 a ${TETO} por área, Índice de ${BASE} a ${TOTAL}`);
