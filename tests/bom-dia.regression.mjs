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

// 2a. So paga a quem fez alguma coisa ONTEM.
//
// Pagar por abrir o app quebrava duas coisas. Economia: fragmento preso a
// presenca, e nao a uso, e o mesmo farm sem jogar que tirou a campanha do preco
// em fragmento. E primeira instalacao: a conta nova terminava o onboarding com
// a marca do bom-dia ja no perfil, e o primeiro modal de recompensa que a
// pessoa via era um premio por nao ter feito nada.
//
// Prender ao dia anterior resolve os dois, e dispensa guarda contra o
// onboarding — quem acabou de instalar nao concluiu nada ontem.
{
    assert.match(bloco, /shiftLocalDateString\(hoje, -1\)/, 'o bom-dia deixou de olhar o dia anterior');
    assert.match(
        bloco, /if \(!fezAlgoOntem\) return;/,
        'o bom-dia voltou a pagar por abrir o app, sem exigir uso no dia anterior',
    );
    assert.match(bloco, /task\.completed/, 'o bom-dia tem de exigir tarefa CONCLUIDA, e nao apenas agendada');
}

// 2b. O valor e fixo: quem fez uma acao e quem fez dez recebem igual.
//
// O que se paga aqui e ter voltado, nao ter produzido — produtividade ja e paga
// pela EXP do dia, pelas missoes e pelo fecho do ciclo. Escalar aqui seria pagar
// a mesma coisa duas vezes.
{
    assert.match(
        contexto, /export const FRAGMENTOS_DO_BOM_DIA = (\d+);/,
        'o valor do bom-dia tem de ser uma constante, nao uma conta',
    );
    const valor = Number(contexto.match(/export const FRAGMENTOS_DO_BOM_DIA = (\d+);/)[1]);
    assert.ok(valor > 0, 'o bom-dia tem de pagar alguma coisa');
    assert.ok(
        valor <= 5,
        `o bom-dia paga ${valor} fragmentos. A ancora e a FORJA, unico sumidouro de `
        + 'fragmento desde que campanha saiu do preco em fragmento: forjar um item '
        + 'tier 1 custa 40. Acima de 5 por dia, trinta dias de bom-dia passam a valer '
        + 'mais que um bau raro (30 a 80), e abrir o app passa a render mais que usar '
        + 'o app.',
    );
    assert.doesNotMatch(
        bloco, /completedRows|expDeposited|cycleExpBonus|\.length \* |fezAlgoOntem\.length/,
        'o bom-dia voltou a escalar com o tamanho do dia anterior',
    );
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
