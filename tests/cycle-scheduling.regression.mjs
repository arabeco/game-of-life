import assert from 'node:assert/strict';
import {
  FREE_ROUND_SCHEDULE_DAYS,
  addDaysIso,
  buildCycleRegenerationPlan,
  buildRecurringDates,
  countRecurringOccurrences,
  dayOfWeekForIso,
  resolveCycleArenaIds,
  resolveScheduleHorizon,
} from '../utils/cycleScheduling.ts';

/**
 * O CICLO E A JANELA.
 *
 * Tres decisoes que sempre foram a mesma pergunta viviam separadas: quantas
 * tarefas gravar, quais arenas entram no ciclo novo, e o que reagendar na
 * virada. Este teste e o contrato da resposta unica.
 *
 * O que ele existe para impedir, em ordem de gravidade:
 *
 *   1. o ciclo nascer com uma arena so porque a pessoa marcou renovar em uma
 *   2. a virada nao reagendar, e toda acao recorrente morrer na troca de ciclo
 *   3. voltar a gravar um ano de tarefas no primeiro clique
 */

const HOJE = '2026-09-06';

// ---------------------------------------------------------------- horizonte
{
  const cicloVivo = { startDate: '2026-09-01', endDate: '2026-09-30' };
  assert.equal(
    resolveScheduleHorizon(HOJE, cicloVivo),
    '2026-09-30',
    'com ciclo aberto, o fim do ciclo e o horizonte'
  );

  assert.equal(
    resolveScheduleHorizon(HOJE, { startDate: '2026-09-06', endDate: HOJE }),
    HOJE,
    'o ultimo dia do ciclo ainda e dia de trabalho, nao vira rodada livre'
  );

  const semCiclo = addDaysIso(HOJE, FREE_ROUND_SCHEDULE_DAYS);
  assert.equal(resolveScheduleHorizon(HOJE, null), semCiclo, 'sem ciclo, a janela da rodada livre');

  // Um ciclo vencido nao pode servir de horizonte: geraria zero tarefa e a acao
  // nasceria morta, sem ninguem entender por que.
  assert.equal(
    resolveScheduleHorizon(HOJE, { startDate: '2026-07-01', endDate: '2026-08-23' }),
    semCiclo,
    'ciclo ja vencido cai na rodada livre em vez de gerar nada'
  );
}

// ------------------------------------------------------------ datas geradas
{
  const todosOsDias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  const dez = buildRecurringDates({ from: HOJE, through: addDaysIso(HOJE, 9), daysOfWeek: todosOsDias });
  assert.equal(dez.length, 10, 'janela de 10 dias com todos os dias marcados gera 10 tarefas');
  assert.equal(dez[0], HOJE, 'a janela comeca hoje');
  assert.equal(dez[9], addDaysIso(HOJE, 9), 'e o ultimo dia entra: a ponta e inclusiva');

  const umDia = [dayOfWeekForIso(HOJE)];
  const quatro = buildRecurringDates({ from: HOJE, through: addDaysIso(HOJE, 27), daysOfWeek: umDia });
  assert.equal(quatro.length, 4, 'um dia da semana em 28 dias acontece quatro vezes');
  for (let i = 1; i < quatro.length; i += 1) {
    assert.equal(quatro[i], addDaysIso(quatro[i - 1], 7), 'as ocorrencias ficam a sete dias uma da outra');
  }

  assert.deepEqual(
    buildRecurringDates({ from: HOJE, through: addDaysIso(HOJE, 30), daysOfWeek: [] }),
    [],
    'sem dia marcado nao existe agenda'
  );
  assert.deepEqual(
    buildRecurringDates({ from: HOJE, through: '2026-09-01', daysOfWeek: todosOsDias }),
    [],
    'janela invertida nao gera nada'
  );

  // O antigo laco de 365 nao pode voltar por acidente: mesmo pedindo um ciclo de
  // dez anos, existe um teto duro.
  const absurdo = buildRecurringDates({ from: HOJE, through: '2036-09-06', daysOfWeek: todosOsDias });
  assert.ok(absurdo.length <= 400, 'uma data corrompida nao gera dezenas de milhares de linhas');

  assert.equal(
    countRecurringOccurrences({ from: HOJE, through: addDaysIso(HOJE, 9), daysOfWeek: todosOsDias }),
    10,
    'a contagem que a tela mostra e a mesma lista que sera gravada'
  );
}

// ------------------------------------------------- quais arenas entram (bug)
{
  const oitoArenas = Array.from({ length: 8 }, (_, i) => ({ id: `a${i + 1}`, isArchived: false }));

  // ESTE E O BUG QUE O TESTE EXISTE PARA IMPEDIR.
  // A tela de novo ciclo so registra as arenas que a pessoa tocou. Marcar
  // renovar em uma arena de oito comecava o ciclo com uma arena, e as outras
  // sete sumiam da contagem sem nenhum aviso.
  const umaRenovada = resolveCycleArenaIds({
    arenas: oitoArenas,
    changes: [{ id: 'a3', status: 'renew' }],
  });
  assert.equal(umaRenovada.length, 8, 'renovar uma arena nao expulsa as outras sete do ciclo');

  assert.deepEqual(
    resolveCycleArenaIds({ arenas: oitoArenas, changes: [] }),
    oitoArenas.map(a => a.id),
    'nao mexer em nada mantem todas as arenas ativas'
  );

  const semDuas = resolveCycleArenaIds({
    arenas: oitoArenas,
    changes: [{ id: 'a1', status: 'archive' }, { id: 'a2', status: 'delete' }],
  });
  assert.deepEqual(semDuas, ['a3', 'a4', 'a5', 'a6', 'a7', 'a8'], 'sai quem foi arquivada ou apagada, e so');

  // Renovar uma arena arquivada a traz de volta. A lista recebida aqui ainda e a
  // de antes dessa mudanca, entao sem a excecao ela ficaria de fora do proprio
  // ciclo que a ressuscitou.
  const comArquivada = [...oitoArenas, { id: 'velha', isArchived: true }];
  assert.ok(
    !resolveCycleArenaIds({ arenas: comArquivada, changes: [] }).includes('velha'),
    'arena arquivada nao entra sozinha'
  );
  assert.ok(
    resolveCycleArenaIds({ arenas: comArquivada, changes: [{ id: 'velha', status: 'renew' }] }).includes('velha'),
    'arena arquivada que foi renovada entra no ciclo'
  );
}

// ------------------------------------------------------ virada de ciclo
{
  const acao = (id, arenaId, extra = {}) => ({
    id,
    arenaId,
    actionType: 'Ação Recorrente',
    duration: 30,
    scheduledDays: ['SEG', 'QUA', 'SEX'],
    scheduledStartTime: 480,
    ...extra,
  });

  const ciclo = { startDate: '2026-09-01', endDate: '2026-09-30', arenaIds: ['treino', 'estudo'] };
  const acoes = [
    acao('correr', 'treino'),
    acao('ler', 'estudo'),
    acao('fora', 'arquivada'),
    acao('semDias', 'treino', { scheduledDays: [] }),
    acao('semHora', 'treino', { scheduledStartTime: undefined }),
    acao('livre', 'treino', { actionType: 'Livre' }),
  ];

  const plano = buildCycleRegenerationPlan({ cycle: ciclo, today: HOJE, actions: acoes, existingTasks: [] });
  const porAcao = new Set(plano.map(item => item.actionId));

  assert.deepEqual([...porAcao].sort(), ['correr', 'ler'], 'so acoes recorrentes das arenas do ciclo voltam');
  assert.ok(plano.every(item => item.date >= HOJE), 'a virada nao cria tarefa vencida no passado do ciclo');
  assert.ok(plano.every(item => item.date <= ciclo.endDate), 'e nao passa do fim do ciclo');
  assert.ok(plano.every(item => item.startTime === 480 && item.duration === 30), 'a receita vem da propria acao');

  // Rodar duas vezes nao pode duplicar: a virada pode ser disparada de novo se a
  // pessoa reabrir o app no meio da criacao do ciclo.
  const jaExistem = plano.map(item => ({ actionId: item.actionId, date: item.date, startTime: item.startTime }));
  assert.deepEqual(
    buildCycleRegenerationPlan({ cycle: ciclo, today: HOJE, actions: acoes, existingTasks: jaExistem }),
    [],
    'reagendar de novo sobre o que ja existe nao cria nada'
  );

  // Ciclo agendado para o futuro gera a janela inteira, nao a partir de hoje.
  const futuro = { startDate: '2026-10-01', endDate: '2026-10-31', arenaIds: ['treino'] };
  const planoFuturo = buildCycleRegenerationPlan({ cycle: futuro, today: HOJE, actions: acoes, existingTasks: [] });
  assert.ok(planoFuturo.length > 0, 'ciclo agendado tambem e reagendado');
  assert.ok(planoFuturo.every(item => item.date >= '2026-10-01'), 'e comeca no inicio dele, nao hoje');

  assert.deepEqual(
    buildCycleRegenerationPlan({
      cycle: { ...ciclo, arenaIds: [] },
      today: HOJE,
      actions: acoes,
      existingTasks: [],
    }),
    [],
    'ciclo sem arena nenhuma nao reagenda nada'
  );
}

console.log('Ciclo como janela: horizonte, datas geradas, arenas do ciclo novo e a virada que reagenda.');
