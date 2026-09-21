import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

/**
 * NENHUMA BORDA E NENHUM BANNER PODE FICAR SEM CAMINHO.
 *
 * Em 20/09/2026 as duas categorias sairam da escada de patente, e quatro pecas
 * cairam num lugar que nao existia ate entao: sem preco, fora do bau, fora da
 * escada — e nada no codigo dizia que elas deveriam vir de algum lugar. Um item
 * assim nao da erro. Ele so nunca aparece, e a unica forma de descobrir e alguem
 * ir procurar.
 *
 * Este teste fecha essa porta. Toda borda e todo banner vivo precisa ter UMA
 * destas: preco na loja, degrau de patente, temporada, staff, bau, pacote
 * inicial, codigo de resgate — ou uma REGRA declarada no
 * constants/desbloqueiosPorRegra.
 *
 * Ele nao cobra que a regra esteja MEDIDA. Medir e a outra metade e ainda nao
 * existe. O que ele cobra e que a peca esteja declarada em algum lugar, para a
 * pendencia continuar visivel em vez de virar sumico.
 */

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const empacota = async (entrada, nome) => {
    const destino = path.join(raiz, 'node_modules', '.cache', nome);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(raiz, entrada)],
        bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { ITEMS_DB, isChestEligibleItem } = await empacota('constants/items.ts', 'regras-items.mjs');
const { RANK_REWARDS } = await empacota('constants/nobility.ts', 'regras-nobility.mjs');
const { REGRAS_DE_DESBLOQUEIO, ITENS_DA_VANGUARDA, ITENS_LIBERADOS_POR_REGRA } =
    await empacota('constants/desbloqueiosPorRegra.ts', 'regras-desbloqueio.mjs');

const noStarter = (() => {
    const sql = fs.readFileSync(path.join(raiz, 'sql', 'new_player_bootstrap_rewards.sql'), 'utf8');
    const bloco = sql.match(/v_starter_items text\[\] := array\[([^\]]*)\]/);
    return new Set(bloco ? bloco[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean) : []);
})();

const naEscada = new Set(
    Object.values(RANK_REWARDS || {}).flatMap((premios) => (premios || []).map((p) => p.itemId)),
);
const daVanguarda = new Set(ITENS_DA_VANGUARDA);

// --- 1. toda borda e todo banner tem caminho --------------------------------

{
    const pecas = ITEMS_DB.filter(
        (i) => ['border', 'banner'].includes(i.category) && !i.isLegacyRetired,
    );
    assert.ok(pecas.length > 0, 'nao achei borda nem banner no catalogo');

    const semCaminho = pecas.filter((i) => !(
        i.costGold
        || naEscada.has(i.id)
        || noStarter.has(i.id)
        || daVanguarda.has(i.id)
        || ITENS_LIBERADOS_POR_REGRA.has(i.id)
        || i.isSeasonExclusive
        || i.seasonKey
        || i.isGmExclusive
        || i.isQuestExclusive
        || isChestEligibleItem(i)
    )).map((i) => `${i.category} ${i.id} (${i.name})`);

    assert.deepEqual(
        semCaminho,
        [],
        `borda ou banner sem caminho nenhum — nem preco, nem degrau, nem regra:\n  ${semCaminho.join('\n  ')}`,
    );
}

// --- 2. as regras apontam para itens que existem ----------------------------
//
// Uma regra que libera um id morto e pior do que regra nenhuma: ela promete.

{
    const ids = new Set(ITEMS_DB.map((i) => i.id));
    const fantasmas = REGRAS_DE_DESBLOQUEIO.flatMap(
        (regra) => regra.itens.filter((id) => !ids.has(id)).map((id) => `${regra.nome} → ${id}`),
    );
    assert.deepEqual(fantasmas, [], `regra apontando para item que nao existe:\n  ${fantasmas.join('\n  ')}`);

    const vanguardaMorta = ITENS_DA_VANGUARDA.filter((id) => !ids.has(id));
    assert.deepEqual(vanguardaMorta, [], `item da Vanguarda nao existe: ${vanguardaMorta.join(', ')}`);
}

// --- 3. cada regra libera o PAR, e cada item sai de uma regra so -------------
//
// Borda e banner vem em par de proposito: e o que faz 32 pecas caberem em 11
// condicoes. Uma regra com uma peca so passa — nem todo nome tem irma — mas
// um item em duas regras seria entregue duas vezes por motivos diferentes.

{
    const vistos = new Map();
    for (const regra of REGRAS_DE_DESBLOQUEIO) {
        assert.ok(regra.itens.length > 0, `a regra ${regra.nome} nao libera nada`);
        assert.ok(regra.frase.trim().length > 0, `a regra ${regra.nome} nao tem frase para o modal`);
        for (const id of regra.itens) {
            const dono = vistos.get(id);
            assert.equal(dono, undefined, `${id} sai por duas regras: ${dono} e ${regra.nome}`);
            vistos.set(id, regra.nome);
        }
    }
}

// --- 4. a Vanguarda fica FORA das regras ------------------------------------
//
// Ela vem por codigo de resgate, nao por condicao. Se entrasse na lista, a
// contagem de regras mentiria sobre o proprio tamanho.

{
    const intrusos = ITENS_DA_VANGUARDA.filter((id) => ITENS_LIBERADOS_POR_REGRA.has(id));
    assert.deepEqual(intrusos, [], `item da Vanguarda virou regra: ${intrusos.join(', ')}`);
}

// --- 5. o Mistico e o Celestial pedem a MESMA leitura -----------------------
//
// As duas condicoes que ainda nao tem medidor sao de area por ciclo. Ficam
// presas uma na outra aqui para que escrever o medidor de uma resolva a outra —
// e para que ninguem invente uma terceira forma de perguntar a mesma coisa.

{
    const deArea = REGRAS_DE_DESBLOQUEIO.filter(
        (r) => r.condicao.tipo === 'arenas_da_area_no_ciclo' || r.condicao.tipo === 'arena_em_cada_area_no_ciclo',
    ).map((r) => r.nome).sort();
    assert.deepEqual(deArea, ['Celestial', 'Místico'], 'mudou quem depende da leitura de arena por area no ciclo');
}

console.log(`regras-de-desbloqueio: ok — ${REGRAS_DE_DESBLOQUEIO.length} regras, ${ITENS_LIBERADOS_POR_REGRA.size} peças`);
