import assert from 'node:assert/strict';
import {
    filterTasksAfterFreeProgressReset,
    marcaDeRodadaDepoisDoCiclo,
} from '../utils/freeProgressScope.ts';

/**
 * FECHAR O CICLO E CLICAR EM "CONTINUAR" NAO PODE DEIXAR O CICLO LIGADO.
 *
 * O botao "Continuar" do fim de ciclo existe para quem nao quer abrir outro
 * ciclo: ele encerra o ciclo e devolve a pessoa para a rodada livre. Para isso
 * ele grava a MARCA da rodada, e a marca decide duas coisas ao mesmo tempo:
 *
 *   1. quais tarefas contam na arena — `filterTasksAfterFreeProgressReset`
 *      guarda so o que veio DEPOIS dela;
 *   2. quanta experiencia a rodada acumulou — o `refreshRoundExpBonus` soma
 *      `daily_commitments.exp_deposited` com `gte('date', marca.slice(0, 10))`.
 *
 * A marca estava sendo gravada com a data de INICIO do ciclo. As duas leituras
 * entao abracavam o ciclo inteiro:
 *
 *   - as arenas continuavam cheias, porque toda tarefa do ciclo e posterior ao
 *     comeco dele;
 *   - o acumulado da rodada virava a experiencia do ciclo INTEIRA, que o
 *     relatorio ja tinha creditado e que ja tinha promovido a pessoa.
 *
 * O segundo e o caro: ao concluir a rodada depois, o mesmo ciclo pagava de
 * novo. Experiencia paga duas vezes nao aparece como erro em lugar nenhum — ela
 * so sobe.
 *
 * As duas leituras usam limites diferentes, e por isso a marca nao pode ser o
 * fim do ciclo tambem: o filtro de tarefas compara com `>` num instante, e a
 * soma de experiencia compara com `>=` numa data. Com a marca no ultimo dia, a
 * soma ainda pegaria aquele dia. A marca certa e o DIA SEGUINTE, a zero hora —
 * a unica que as duas leituras entendem do mesmo jeito.
 */

const relatorio = { startDate: '2026-09-01', endDate: '2026-09-20' };
const marca = marcaDeRodadaDepoisDoCiclo(relatorio);

// 1. A marca cai no dia seguinte ao fim do ciclo.
{
    assert.equal(marca, '2026-09-21T00:00:00.000Z', 'a marca deveria ser a zero hora do dia seguinte ao fim do ciclo');
}

// 2. Nenhuma tarefa do ciclo sobrevive ao filtro da rodada.
{
    const tarefas = [
        { id: 'primeiro-dia', date: '2026-09-01', completedAt: '2026-09-01T09:00:00.000Z' },
        { id: 'meio', date: '2026-09-15', completedAt: '2026-09-15T21:30:00.000Z' },
        { id: 'ultimo-dia', date: '2026-09-20', completedAt: '2026-09-20T23:10:00.000Z' },
    ];
    const sobreviventes = filterTasksAfterFreeProgressReset(tarefas, marca).map((t) => t.id);
    assert.deepEqual(sobreviventes, [], `tarefa do ciclo continuou contando na arena: ${sobreviventes.join(', ')}`);
}

// 3. O que vem depois do ciclo conta, senao a rodada nova nasceria surda.
{
    const tarefas = [
        { id: 'depois', date: '2026-09-21', completedAt: '2026-09-21T08:00:00.000Z' },
        { id: 'bem-depois', date: '2026-09-25', completedAt: '2026-09-25T08:00:00.000Z' },
    ];
    const sobreviventes = filterTasksAfterFreeProgressReset(tarefas, marca).map((t) => t.id);
    assert.deepEqual(sobreviventes, ['depois', 'bem-depois'], 'tarefa posterior ao ciclo deveria contar na rodada nova');
}

// 4. A data que a soma de experiencia usa exclui o ultimo dia do ciclo.
//
// O `refreshRoundExpBonus` faz `gte('date', marca.slice(0, 10))`. Como o corte e
// inclusivo, a marca precisa ja estar no dia seguinte — senao o deposito do
// ultimo dia entraria na rodada e seria pago pela segunda vez.
{
    const desde = marca.slice(0, 10);
    assert.ok(desde > relatorio.endDate, `a soma da rodada comecaria em ${desde}, que ainda alcanca o ciclo`);
    assert.equal(desde, '2026-09-21');
}

// 5. Um ciclo de um dia so tambem fecha direito.
{
    const curto = marcaDeRodadaDepoisDoCiclo({ startDate: '2026-09-20', endDate: '2026-09-20' });
    assert.equal(curto, '2026-09-21T00:00:00.000Z');
}

// 6. ENCERRAR NO MEIO. A marca segue o dia em que se fechou, nao o planejado.
//
// O `endCycle` grava `endDate = getLocalDateString()` — o dia de hoje, o dia do
// fecho — e guarda o que estava planejado num campo separado, `plannedEndDate`.
// Sao coisas diferentes de proposito, e a marca tem de seguir a PRIMEIRA.
//
// Se seguisse a planejada, quem encerrasse um ciclo de trinta dias no decimo
// nono ficaria onze dias com a rodada surda: tudo o que fizesse ate a data que
// nunca chegou cairia antes da marca, as arenas apareceriam vazias e a
// experiencia da rodada nao contaria. O contrario do bug que este arquivo
// guarda, e do mesmo tamanho.
{
    const encerradoNoMeio = {
        startDate: '2026-09-01',
        endDate: '2026-09-20',        // fechou hoje, a mao
        plannedEndDate: '2026-09-30', // ia ate o fim do mes
    };
    const marcaDoMeio = marcaDeRodadaDepoisDoCiclo(encerradoNoMeio);
    assert.equal(marcaDoMeio, '2026-09-21T00:00:00.000Z', 'a marca seguiu a data planejada em vez do fecho de verdade');

    // O dia seguinte ao fecho ja conta, mesmo estando antes do fim planejado.
    const depoisDoFecho = filterTasksAfterFreeProgressReset(
        [{ id: 'dia-seguinte', date: '2026-09-21', completedAt: '2026-09-21T10:00:00.000Z' },
         { id: 'dentro-do-planejado', date: '2026-09-25', completedAt: '2026-09-25T10:00:00.000Z' }],
        marcaDoMeio,
    ).map((t) => t.id);
    assert.deepEqual(
        depoisDoFecho,
        ['dia-seguinte', 'dentro-do-planejado'],
        'tarefa feita depois do fecho manual precisa contar na rodada nova',
    );
}

// 7. Relatorio sem data nao inventa marca.
//
// Devolver uma marca invalida seria pior do que nao devolver nenhuma: a marca
// vazia mantem a rodada como estava, e uma marca torta apagaria a arena inteira.
{
    assert.equal(marcaDeRodadaDepoisDoCiclo({ startDate: '2026-09-01' }), null);
    assert.equal(marcaDeRodadaDepoisDoCiclo({ endDate: 'nao e data' }), null);
    assert.equal(marcaDeRodadaDepoisDoCiclo(null), null);
}

console.log('continuar-sem-ciclo: ok');
