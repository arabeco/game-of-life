import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isTaskInPool } from '../utils/taskDomain.js';

/**
 * O DENOMINADOR DO CICLO: POSTO NO DIA, E SEM A QUEST.
 *
 * Em 04/10/2026 um ciclo real com 70 tarefas postas e 70 cumpridas aparecia
 * como 70/86, 81%, e com nota S num ciclo de sete dias. Nenhuma das duas coisas
 * era bug de uma tela: eram CONTAS DIFERENTES respondendo a mesma pergunta.
 *
 *   card dos Ativos     max(soma das repeticoes declaradas, numero de tarefas)
 *   widget / trilha     a mesma inflacao, em outra copia
 *   fechamento          tarefas do escopo, com a baia junto
 *   painel diario       tarefas do escopo, sem a baia
 *
 * Os 16 que faltavam para 86 eram repeticao declarada em acao que ninguem
 * agendou — nao existiam como linha nem no dia nem na baia. Pareciam ser as 17
 * pendentes da missao de temporada, e nao eram: sao dois numeros sem relacao,
 * um de repeticao e outro de progresso de quest.
 *
 * E a nota: a trilha usava `getScoreGrade`, que e so faixa de pontuacao, e
 * prometia S; o fechamento passa por `notaDoCiclo`, que aplica o teto por porte,
 * e entregava A. O ciclo anterior do mesmo usuario comprova — 7 dias, score 99,
 * nota A gravada.
 */

// ------------------------------------------------- 1. a regra da baia
assert.equal(isTaskInPool({ completed: true, startTime: -1 }), false,
    'concluida sem horario continua sendo feita, nao e baia');
assert.equal(isTaskInPool({ completed: false, startTime: 0 }), false,
    'meia-noite e horario: 0 esta no dia');
assert.equal(isTaskInPool({ completed: false, startTime: -1 }), true,
    'sem horario e sem conclusao, espera na baia');
console.log('ok - a regra separa o dia da baia, e o zero conta como horario');

// --------------------------- 2. ninguem reinventa essa regra
//
// `isTaskInPool` ja existia e e usada pelo Planner, pela RestScreen e pelo chat
// do Oraculo. Houve uma tentativa de criar `tarefaEstaNoDia` ao lado dela, que
// era a mesma regra com outro nome e o sinal invertido.
for (const arquivo of ['utils/coreLoopUtils.js', 'views/AssetsView.tsx', 'contexts/GameContext.tsx']) {
    const fonte = readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
    assert.doesNotMatch(fonte, /tarefaEstaNoDia/,
        `${arquivo}: nasceu um segundo nome para o que isTaskInPool ja responde`);
}
console.log('ok - a baia tem um dono so');

// ------------------------- 3. a inflacao por repeticao nao volta
for (const arquivo of ['views/AssetsView.tsx', 'utils/widgetSnapshots.ts']) {
    const fonte = readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
    assert.doesNotMatch(fonte, /buildCycleActionTotal\s*\(/,
        `${arquivo}: voltou a somar repeticoes declaradas no denominador`);
}
console.log('ok - o denominador conta tarefas postas, nao repeticoes declaradas');

// ------------------------------- 4. a baia sai das tres telas
const assets = readFileSync(new URL('../views/AssetsView.tsx', import.meta.url), 'utf8');
const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const widget = readFileSync(new URL('../utils/widgetSnapshots.ts', import.meta.url), 'utf8');

assert.match(assets, /!isTaskInPool\(task\)/, 'o card dos Ativos voltou a contar a baia');
assert.match(contexto, /\.filter\(\(t\) => !isTaskInPool\(t\)\)/, 'o fechamento voltou a contar a baia');
assert.match(widget, /\.filter\(\(task\) => !isTaskInPool\(task\)\)/, 'o widget voltou a contar a baia');
console.log('ok - a baia sai do card, do fechamento e do widget');

// --------------------- 5. a quest nunca e pendencia do ciclo
assert.match(widget, /scopedActionIds\.has\(task\.actionId\) && !isQuestActionId\(task\.actionId\)/,
    'a quest voltou para o denominador do ciclo');
assert.match(widget, /!== 'Livre' && !isQuestActionId\(task\.actionId\)/,
    'a quest voltou para a conta da nota');
assert.match(contexto, /tarefasDaProporcao = scoredCycleTasks\.filter\(t => !idsDeJornada\.has\(t\.id\)\)/,
    'o fechamento voltou a contar a jornada na proporcao');
console.log('ok - a quest da bonus, nunca pendencia');

// ------------------- 6. a previa mostra a nota com teto
const relatorios = readFileSync(new URL('../views/ReportsView.tsx', import.meta.url), 'utf8');
assert.match(relatorios, /const notaComTeto = cycleSnapshot\?\.grade;/,
    'a trilha voltou a inferir a nota do score, sem o teto por porte');
console.log('ok - a previa e o fechamento mostram a mesma letra');

console.log('Denominador do ciclo: posto no dia, sem a quest, e a nota com teto desde a previa.');
