import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tarefaEstaNoDia } from '../utils/coreLoopUtils.js';

/**
 * O DENOMINADOR DO CICLO E O QUE FOI POSTO NO DIA — UMA REGUA SO.
 *
 * Em 04/10/2026 um ciclo real com 70 tarefas postas e 70 cumpridas aparecia
 * como 70/86, 81%. Nao era bug de uma tela: eram TRES contas diferentes
 * respondendo a mesma pergunta.
 *
 *   card do ciclo   max(soma das repeticoes declaradas, numero de tarefas)
 *   fechamento      tarefas do escopo, com a baia junto
 *   painel diario   tarefas do escopo, sem a baia
 *
 * Os 16 que faltavam para 86 eram repeticao declarada em acao que ninguem
 * agendou — nao existiam como linha nem no dia nem na baia. E a tarefa que
 * esperava na baia entrava no fechamento como compromisso, cobrando por uma
 * escolha que nao tinha sido feita.
 *
 * Este teste prende as tres pontas.
 */

// ------------------------------------------------- 1. a regra, em si
assert.equal(tarefaEstaNoDia({ completed: true, startTime: -1 }), true,
    'concluida sem horario continua sendo feita');
assert.equal(tarefaEstaNoDia({ completed: false, startTime: 0 }), true,
    'meia-noite e horario: 0 esta no dia');
assert.equal(tarefaEstaNoDia({ completed: false, startTime: 540 }), true,
    'com horario, esta no dia');
assert.equal(tarefaEstaNoDia({ completed: false, startTime: -1 }), false,
    'sem horario e sem conclusao, espera na baia');
assert.equal(tarefaEstaNoDia(null), false, 'nada nao esta no dia');
assert.equal(tarefaEstaNoDia({}), false, 'sem campo nenhum, trata como baia');
console.log('ok - a regra separa o dia da baia, e o zero conta como horario');

// ------------------------------- 2. o card nao infla por repeticao
const assets = readFileSync(new URL('../views/AssetsView.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(assets, /buildCycleActionTotal\s*\(/,
    'o card voltou a somar repeticoes declaradas no denominador');
assert.match(assets, /tarefaEstaNoDia\(task\)/,
    'o card precisa excluir a baia pela regra compartilhada');
assert.match(assets, /const totalPlanned = scopedTasks\.length;/,
    'o denominador do card e o numero de tarefas postas no dia');
console.log('ok - o card conta tarefas postas, nao repeticoes declaradas');

// ------------------------------- 3. o fechamento exclui a baia
const contexto = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
assert.match(
    contexto,
    /filterCycleTasksByScope\([^)]*\)\s*\n\s*\.filter\(tarefaEstaNoDia\)/,
    'o fechamento voltou a contar a baia como compromisso',
);
console.log('ok - o fechamento exclui a baia');

// --------------------------- 4. e o painel diario continua como estava
const painel = readFileSync(new URL('../components/DailyPanelContent.tsx', import.meta.url), 'utf8');
assert.match(painel, /startTime < 0/, 'o painel diario precisa continuar separando a baia');
console.log('ok - o painel diario mantem a regra que ele ja tinha');

console.log('Denominador do ciclo: uma regua so — o que foi posto no dia.');
