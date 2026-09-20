import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contexto = fs.readFileSync(path.join(root, 'contexts', 'GameContext.tsx'), 'utf8');
const app = fs.readFileSync(path.join(root, 'components', 'AuthenticatedApp.tsx'), 'utf8');

/**
 * O BOM-DIA PAGA FRAGMENTO, NUNCA EXP.
 *
 * Entre instalar o app e receber a primeira coisa, o jogador atravessava um
 * ciclo inteiro: as missoes iniciais pagam uma vez e acabam, a sequencia foi
 * aposentada da recompensa, e a EXP do dia so chega ao perfil no fecho.
 *
 * A tentacao obvia era adiantar a EXP do dia. Ela foi recusada de proposito: a
 * EXP ja e depositada em daily_commitments e paga pelo endCycle, e adiantar
 * exigiria excluir do fecho o que ja foi pago. Duas armadilhas ali — o endCycle
 * tem historico de pagar a mesma base duas vezes, e um dia que fosse excluido
 * sem ter sido creditado (porque a pessoa nao abriu o app) sumiria do bolso
 * dela sem deixar rastro.
 *
 * Fragmento nao tem essa superficie: e dinheiro novo, nao ha o que excluir de
 * lugar nenhum. Este teste existe para que a tentacao continue recusada.
 */

const bloco = (() => {
    const i = contexto.indexOf('     * O BOM-DIA: fragmentos por ter voltado.');
    assert.ok(i > 0, 'sumiu o bom-dia do GameContext');
    return contexto.slice(i, contexto.indexOf('const claimSeasonQuest', i));
})();

// 1. Paga fragmento, e EXP zero.
{
    assert.match(bloco, /fragments: FRAGMENTOS_DO_BOM_DIA/, 'o bom-dia tem de pagar fragmento');
    assert.match(
        bloco, /xp: 0/,
        'o bom-dia NAO pode pagar EXP: ela ja e depositada por dia e paga no fecho, '
        + 'e adiantar aqui abriria o caminho de pagamento duplo do endCycle',
    );
}

// 2. Fixo, e nao proporcional ao dia anterior.
//
// Quem nao fez nada ontem e exatamente quem mais precisa de um motivo para
// voltar hoje. Escalar com produtividade cobra mais caro de quem ja esta saindo.
{
    assert.match(
        contexto, /export const FRAGMENTOS_DO_BOM_DIA = (\d+);/,
        'o valor do bom-dia tem de ser uma constante, nao uma conta',
    );
    const valor = Number(contexto.match(/export const FRAGMENTOS_DO_BOM_DIA = (\d+);/)[1]);
    assert.ok(valor > 0, 'o bom-dia tem de pagar alguma coisa');
    assert.ok(
        valor <= 5,
        `o bom-dia paga ${valor} fragmentos. A campanha casual mais barata custa 22: `
        + 'acima de 5 por dia, abrir o app passa a render mais que jogar, e missao e '
        + 'ciclo deixam de ser de onde vem coisa de verdade.',
    );
    assert.doesNotMatch(bloco, /completedRows|expDeposited|cycleExpBonus/, 'o bom-dia nao olha o dia anterior');
}

// 3. A marca e podada.
//
// O grantMissionReward guarda todo completionId em completedSeasonMissions, que
// e lido a cada carga do app. Um por dia seriam 365 textos por ano.
{
    assert.match(contexto, /export const BOM_DIA_FLAG_PREFIX = /, 'a marca do bom-dia precisa de prefixo para poder podar');
    assert.match(
        bloco, /filter\(\(flag\) => !flag\.startsWith\(BOM_DIA_FLAG_PREFIX\)\)/,
        'sem a poda, completedSeasonMissions cresce um texto por dia para sempre',
    );
}

// 4. O painel de ontem abre sozinho, e a marca dele e do APARELHO.
//
// O painel existia e quase ninguem via: so o Oraculo, o atalho Alt+S e um botao
// dentro do planner. E a marca fica no localStorage de proposito — o perfil e
// lido a cada carga, e nao vale engordar uma linha do banco com um carimbo que
// so decide se um modal abre.
{
    assert.match(app, /glyph:painel-de-ontem:/, 'sumiu a abertura automatica do painel de ontem');
    assert.match(
        app, /getOperationalDateString\(new Date\(\)\)/,
        'a abertura tem de usar a data OPERACIONAL, a mesma que diz em que dia uma tarefa caiu',
    );
    const i = app.indexOf('glyph:painel-de-ontem:');
    const trecho = app.slice(i - 900, i + 700);
    assert.match(trecho, /catch/, 'sem armazenamento o painel tem de desistir, e nao reabrir a cada carga');
}

console.log('bom-dia: ok');
