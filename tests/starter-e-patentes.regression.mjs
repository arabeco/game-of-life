import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const empacota = async (entrada, saida) => {
    const destino = path.join(root, 'node_modules', '.cache', saida);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    await esbuild.build({
        entryPoints: [path.join(root, entrada)],
        bundle: true, platform: 'node', format: 'esm',
        outfile: destino, logLevel: 'error',
    });
    return import(`file://${destino.split(path.sep).join('/')}`);
};

const { RANK_REWARDS, NOBILITY_RANKS } = await empacota('constants/nobility.ts', 'nobility-check.mjs');
const { ITEMS_DB } = await empacota('constants/items.ts', 'items-check.mjs');

const sql = fs.readFileSync(path.join(root, 'sql', 'new_player_bootstrap_rewards.sql'), 'utf8');

/** Os ids de um array literal do plpgsql, pelo nome da variavel. */
const listaDoSql = (nome) => {
    const bloco = sql.match(new RegExp(`${nome} text\\[\\] := array\\[([^\\]]*)\\]`));
    assert.ok(bloco, `nao achei ${nome} no SQL do starter`);
    return bloco[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
};

// Ids que existem fora do ITEMS_DB: temas de interface, que vivem no GM_CONFIG.
const TEMAS = new Set(['BASIC', 'GOLD', 'FROST', 'EMBER', 'CYBER', 'AURORA', 'VOID']);
const existe = (id) => TEMAS.has(id) || ITEMS_DB.some((i) => i.id === id);

// 1. Cabelo e corpo nao sao inventario, e nenhuma tabela pode entrega-los.
//
// O SovereignCustomizer libera a categoria hairStyles inteira no filtro de
// posse, e o ciclador de corpo le o BODY_DB direto sem olhar posse. Entregar um
// deles como recompensa anuncia, com modal de promocao, uma peca que a pessoa
// tem desde o primeiro minuto — e pior, faz a curva da escada parecer cheia
// quando nao esta. Sete cabelos ja moraram no RANK_REWARDS por isso.
{
    for (const [patente, recompensas] of Object.entries(RANK_REWARDS)) {
        for (const r of recompensas) {
            assert.notEqual(
                r.category, 'hairStyles',
                `${patente} entrega ${r.itemId}: cabelo e aparencia, nao item`,
            );
            assert.notEqual(
                r.category, 'bodyStyles',
                `${patente} entrega ${r.itemId}: corpo e aparencia, nao item`,
            );
        }
    }

    const doStarter = listaDoSql('v_starter_items');
    const cabelos = ITEMS_DB.filter((i) => i.category === 'hair').map((i) => i.id);
    for (const cabelo of cabelos) {
        assert.ok(!doStarter.includes(cabelo), `o starter pack concede o cabelo ${cabelo}`);
    }
}

// 2. Todo id entregue tem de existir.
//
// O starter concedia `grunge_longo`, que nunca esteve no catalogo nem no
// HAIR_DB. Uma concessao para um id inventado nao falha em lugar nenhum: a
// linha entra no inventario, nenhuma tela sabe desenha-la, e ninguem descobre.
{
    for (const [patente, recompensas] of Object.entries(RANK_REWARDS)) {
        for (const r of recompensas) {
            assert.ok(existe(r.itemId), `${patente} entrega ${r.itemId}, que nao existe no catalogo`);
        }
    }
    for (const id of [...listaDoSql('v_starter_items'), ...listaDoSql('v_starter_topup')]) {
        assert.ok(existe(id), `o starter pack concede ${id}, que nao existe no catalogo`);
    }
}

// 3. O Vagante declarado e o Vagante entregue.
//
// Ninguem e promovido a Vagante — entra-se nele — entao o caminho de promocao
// do GameContext pula o degrau zero de proposito, para nao abrir modal de
// promocao no primeiro login. Quem entrega essa lista e o starter pack.
//
// As duas listas separadas sao a armadilha: a NobilityLadder mostra o
// RANK_REWARDS.vagante, e durante um bom tempo ela prometeu Cacador, tema Gelo
// Eterno, Tabua Aprendiz e a propria insignia do Vagante — nenhum dos quatro
// chegava a ninguem. Prometer o que nao se entrega e pior do que nao prometer.
{
    const doStarter = new Set(listaDoSql('v_starter_items'));
    for (const r of RANK_REWARDS.vagante) {
        assert.ok(
            doStarter.has(r.itemId),
            `RANK_REWARDS.vagante promete ${r.itemId} e o starter pack nao entrega`,
        );
    }
}

// 4. O degrau zero tem de ter roupa que chegue.
//
// A primeira promocao custa 6.000 EXP, que na regua de ~1 EXP por minuto sao
// 100 horas executadas. Ate la o vestuario e o unico lugar do jogo onde a
// pessoa se ve, e com duas roupas o ciclador vira um uniforme — foi a primeira
// coisa que a primeira jogadora de fora notou.
{
    const roupasDoVagante = RANK_REWARDS.vagante.filter((r) => r.category === 'skins');
    assert.ok(
        roupasDoVagante.length >= 4,
        `o Vagante entrega ${roupasDoVagante.length} roupas; o piso e 4`,
    );

    const escudeiro = NOBILITY_RANKS.find((r) => r.id === 'escudeiro');
    assert.equal(escudeiro.expTotalRequired, 6000, 'mudou o custo da primeira promocao: rever o piso acima');
}

console.log('starter-e-patentes: ok');
