import assert from 'node:assert/strict';
import { buildFairScoreFromTasks } from '../utils/fairScoreUtils.js';

/**
 * CEM NAO PODE PEDIR CRESCIMENTO COMPOSTO.
 *
 * A nota tem cinco parcelas: honra 40, metas 30, cadencia 15, realismo 10 e
 * ascensao 5. A ascensao pagava os 5 pontos so a partir de 1,15 — entregar 15%
 * a mais que a MEDIANA DOS PROPRIOS CICLOS ANTERIORES.
 *
 * E a mediana sobe junto. Cumprido o 1,15, ela incorpora o volume novo e a
 * proxima cobranca ja e 15% em cima disso. Dez ciclos pediriam 4x o volume
 * inicial; vinte, 16x. Relatado em 05/10/2026, e e exatamente isto:
 *
 *   "15% A MAIS TODO CICLO PRA PODER TIRAR 100 EU VOU PRA INFINITO"
 *
 * Havia ainda um fio de navalha: o realismo paga 10 so ATE 1,15 e a ascensao
 * pagava 5 so A PARTIR de 1,15. Quem honra o plano inteiro tem as duas razoes
 * iguais — entao 100 existia num ponto unico, e em qualquer outro se perdia
 * pelo menos um ponto.
 *
 * Este teste guarda as duas coisas: que sustentar basta, e que o plato existe.
 */

/** Uma tarefa cumprida, do jeito que o core-loop monta. */
const tarefa = (id, arenaId, date, duration, completed = true) => ({
    id, arenaId, date, duration, completed,
    actionId: `acao-${id}`, actionType: 'Meta', startTime: 480,
});

/** Dois ciclos anteriores com a mesma carga, para a mediana ser previsivel. */
const anteriores = (carga) => [
    { metrics: { fairness: { honoredLoadUnits: carga, activeDays: 5, measurementStatus: 'scored' } } },
    { metrics: { fairness: { honoredLoadUnits: carga, activeDays: 5, measurementStatus: 'scored' } } },
];

/**
 * Um ciclo impecavel: tudo que foi posto foi cumprido, no tamanho de sempre.
 * `fator` multiplica a carga para simular crescer ou encolher.
 */
const cicloImpecavel = (fator) => {
    const minutos = Math.round(120 * fator);
    return buildFairScoreFromTasks({
        tasks: [
            tarefa('a1', 'Arena A', '2026-03-08', minutos),
            tarefa('a2', 'Arena A', '2026-03-09', minutos),
            tarefa('b1', 'Arena B', '2026-03-10', minutos),
            tarefa('b2', 'Arena B', '2026-03-11', minutos),
            tarefa('c1', 'Arena C', '2026-03-12', minutos),
        ],
        previousReports: anteriores(20),
        durationDays: 5,
    });
};

// ===================================== 1. sustentar o proprio tamanho da 100
//
// Cinco tarefas de 120min contra uma mediana de 20 unidades: a razao fica em
// 1,0. Antes isto dava 99 — faltava o ponto da ascensao, que so vinha crescendo.
const sustentou = cicloImpecavel(1);
assert.equal(sustentou.fairness.selfGrowthRate, 1,
    'o cenario parou de medir 1,0 — o resto do teste perde o sentido');
assert.equal(sustentou.fairScore, 100,
    'ciclo impecavel no tamanho de sempre voltou a nao alcancar 100');
console.log('ok - fazer o combinado, no seu tamanho, da 100');

// ============================================ 2. o topo e plato, nao navalha
//
// De 1,0 a 1,15 as duas parcelas que disputavam ficam no maximo ao mesmo tempo.
// Crescer nao paga mais que sustentar, e tambem nao custa.
const cresceu = cicloImpecavel(1.15);
assert.equal(cresceu.fairScore, 100,
    'crescer ate 1,15 deixou de valer 100 — o plato sumiu');
assert.ok(cresceu.fairScore === sustentou.fairScore,
    'crescer voltou a pagar mais que sustentar, e a esteira volta junto');
console.log('ok - de 1,0 a 1,15 a nota e a mesma: plato, nao fio de navalha');

// ======================================= 3. exagerar no plano continua caindo
//
// Tirar a obrigacao de crescer nao pode virar licenca para inflar o ciclo: o
// realismo cobra a partir de 1,15, e e ele que segura o overplanner.
const exagerou = cicloImpecavel(1.6);
assert.ok(exagerou.fairScore < 100,
    'inflar o ciclo deixou de custar — o realismo parou de cobrar');
console.log('ok - planejar muito acima do proprio tamanho continua custando');

// ==================================== 4. entregar bem menos continua custando
//
// O que saiu foi a obrigacao de SUBIR, nao a medida de queda.
const encolheu = cicloImpecavel(0.5);
assert.ok(encolheu.fairScore < sustentou.fairScore,
    'encolher para metade do proprio tamanho parou de aparecer na nota');
console.log('ok - entregar bem abaixo do seu normal continua pesando');

// ============================== 5. e a esteira nao volta por outro caminho
//
// A unica porta para os 5 pontos e `selfGrowthRate >= 1`. Se alguem reescrever
// a faixa de cima para pedir crescimento de novo, isto cai aqui.
const fonte = await import('node:fs').then(
    (fs) => fs.readFileSync(new URL('../utils/fairScoreUtils.js', import.meta.url), 'utf8'),
);
assert.match(fonte, /if \(selfGrowthRate >= 1\) return 5;/,
    'a faixa de cima da ascensao voltou a pedir crescimento');
console.log('ok - o topo da ascensao continua em sustentar');

console.log('Nota sem esteira: cem e fazer o combinado, nao crescer para sempre.');
