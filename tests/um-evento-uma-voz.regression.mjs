import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * UM EVENTO, UMA VOZ.
 *
 * Em 04/10/2026, fechando um ciclo de verdade, dois relatos chegaram juntos:
 *
 *   "Oraculo inutil repetindo toast e com numero errado"
 *   "Modal de arena concluida com toast e com fala do oraculo.... Mta coisa
 *    repetida"
 *
 * Nao eram dois defeitos: era o mesmo. O app tinha tres superficies de aviso —
 * toast, balao do Oraculo e placa de tela cheia — e nenhuma regra dizendo qual
 * delas fala sobre o que. Entao todas falavam, sobre tudo, ao mesmo tempo.
 *
 * Pior que o volume: cada superficie media com uma REGUA DIFERENTE e nenhuma
 * dizia qual. Num clique so a pessoa lia "5 de 7 · faltam 2" (progresso da
 * arena) e logo abaixo "3/5. Faltam 2" (repeticoes daquela acao no ciclo). As
 * duas certas, juntas impossiveis de conciliar — e a leitura natural e a que ele
 * fez: o segundo aviso e o primeiro com o numero errado.
 *
 * A regra que este teste guarda: quem mede mais, fala. Os outros calam.
 */

const taskDomain = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../components/AchievementModal.tsx', import.meta.url), 'utf8');

// ============================================= 1. o fecho de arena fala UMA vez
//
// A placa carrega nome, icone, entregas, minutos e dias. O toast dizia so
// 'Arena "X" concluida.' e o balao comecava com essa mesma frase. Os dois
// disparavam ATRAS do modal, onde ninguem os le.

assert.doesNotMatch(
    taskDomain,
    /showToast\(\s*\n?\s*campaignJustCleared/,
    'o toast de arena/campanha concluida voltou — a placa ja diz isso, e por cima dele',
);
assert.doesNotMatch(
    taskDomain,
    /falarReacao\('(arena|campaign)_completed'/,
    'o Oraculo voltou a narrar o fecho que a placa anuncia com mais dados',
);
console.log('ok - o fecho de arena fala uma vez, pela placa');

// ------------- e a placa nao pode perder o que o toast e o balao entregavam
//
// Calar as outras duas vozes so se sustenta se a que ficou medir MAIS. Se um dia
// alguem enxugar o payload da placa, o fecho de arena passa a dizer menos do que
// dizia antes de tres avisos virarem um.
const placa = taskDomain.slice(
    taskDomain.indexOf("type: 'ARENA_COMPLETED'"),
    taskDomain.indexOf("type: 'ARENA_COMPLETED'") + 700,
);
for (const campo of ['deliveries', 'minutes', 'days', 'actionCount']) {
    assert.ok(placa.includes(`${campo}:`),
        `a placa perdeu "${campo}" — ela e a unica voz do fecho agora, nao pode medir menos`);
}
console.log('ok - a placa mede mais que as vozes que calaram');

// ================== 2. o Oraculo nao repete a medida que o toast acabou de dar
//
// Toda conclusao mostra um toast com o progresso da ARENA. O meio do caminho da
// meta da ACAO ("3/5, faltam 2") nao acrescentava nada a isso: so a contagem,
// com outro denominador. Ficam a primeira, a penultima e o fecho — momentos que
// o toast da arena nao marca.
assert.match(
    taskDomain,
    /if \(remaining > 1 && cappedCount > 1\) return false;/,
    'o Oraculo voltou a comentar o meio da meta, que e a medida do toast de novo',
);
assert.doesNotMatch(
    taskDomain,
    /falarReacao\(goalEvent[\s\S]{0,400}cycle_goal_progress/,
    'cycle_goal_progress voltou a ser disparado',
);

// Devolver `false` ali e de proposito: a conclusao ainda precisa chegar na
// atencao de ritmo do dia (3, 5, 8 acoes), que e fato novo e nao releitura.
const cicloMeta = taskDomain.slice(
    taskDomain.indexOf('maybeTriggerActionCycleProgressAttention'),
    taskDomain.indexOf('const showTaskProgressToast'),
);
assert.match(cicloMeta, /remaining === 1 \? 'cycle_goal_last_one' : 'cycle_goal_first'/,
    'os tres momentos que sobraram mudaram sem combinar');
assert.match(
    taskDomain,
    /if \(maybeTriggerActionCycleProgressAttention\([\s\S]{0,160}\)\) return;\s*\n\s*maybeTriggerDailyMomentumAttention/,
    'o ritmo do dia precisa continuar depois do meio da meta ser recusado',
);
console.log('ok - o Oraculo mede o que o toast nao mediu, e nunca o mesmo numero');

// ============================ 3. fechar a placa da arena devolve pro Planner
//
// A ultima acao de uma arena e marcada DENTRO dela. Fechada a placa, a pessoa
// ficava numa ArenaView sem nada para fazer, a um toque de onde o dia continua.
assert.match(modal, /APP_NAVIGATE_EVENT/,
    'a placa nao navega mais — fechar arena volta a deixar a pessoa na arena vazia');
assert.match(
    modal,
    /if \(isArenaComplete && typeof window !== 'undefined'\) \{[\s\S]{0,260}view: 'planner'/,
    "a volta pro Planner precisa ser so do fecho de arena, e so dentro de handleClose",
);

// Os outros feitos NAO navegam: subir de patente ou fechar relatorio nao esvazia
// a tela de tras. Se a condicao cair, todo feito passa a jogar a pessoa no
// Planner no meio do que ela estava fazendo.
const navegacoes = (modal.match(/window\.dispatchEvent\(new CustomEvent<AppNavigatePayload>\(/g) || []).length;
assert.equal(navegacoes, 1,
    'a placa ganhou outra navegacao — so o fecho de arena esvazia a tela de tras');
console.log('ok - so o fecho de arena devolve pro Planner');

console.log('Um evento, uma voz: quem mede mais fala, e os outros calam.');
