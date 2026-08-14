import type { OracleContext } from '../types';

export type OracleCoachPace = 'adiantado' | 'no_ritmo' | 'atrasado' | 'critico' | null;
export type OracleCoachArenaPace = OracleCoachPace | 'sem_medida';

export type OracleCycleCoachAction =
  | { id: string; label: string; kind: 'open_planner' }
  | { id: string; label: string; kind: 'open_cycle' }
  | { id: string; label: string; kind: 'open_arenas' }
  | { id: string; label: string; kind: 'open_arena'; arenaId: string };

export interface OracleCycleCoachBrief {
  id: string;
  content: string;
  quickActions: OracleCycleCoachAction[];
}

export interface PlannerCoachContext {
  arenasCount: number;
  actionsCount: number;
  cycleLengthDays: number | null;
  cycleProgress: number;
  daysSinceLastPlannerOpen: number | null;
  daysSinceLastProof: number | null;
  hasActiveCycle: boolean;
  cyclePace: OracleCoachPace;
  focusArenaName: string | null;
  focusArenaPace: OracleCoachArenaPace;
  focusArenaAdjustment: string | null;
  priorityActionName: string | null;
  completedActionNameToday: string | null;
}

export const getOracleCoachDailyLimit = (presenceLevel: number): number => {
  if (presenceLevel <= 0) return 0;
  return presenceLevel >= 3 ? 2 : 1;
};

export const shouldShowPlannerCoach = (
  presenceLevel: number,
  random: () => number = Math.random,
): boolean => {
  if (presenceLevel <= 1) return false;
  return random() < (presenceLevel >= 3 ? 0.55 : 0.25);
};

const pickLine = (lines: string[], random: () => number): string => (
  lines[Math.floor(random() * lines.length)] || lines[0] || ''
);

export const buildPlannerCoachSpeech = (
  context: PlannerCoachContext,
  random: () => number = Math.random,
): string | null => {
  const {
    arenasCount,
    actionsCount,
    cycleLengthDays,
    cycleProgress,
    daysSinceLastPlannerOpen,
    daysSinceLastProof,
    hasActiveCycle,
    cyclePace,
    focusArenaName,
    focusArenaPace,
    focusArenaAdjustment,
    priorityActionName,
    completedActionNameToday,
  } = context;

  if (daysSinceLastPlannerOpen !== null && daysSinceLastPlannerOpen >= 3) {
    return pickLine([
      `Voce nao abriu o Planner nos ultimos ${daysSinceLastPlannerOpen} dias. Antes de compensar tudo, ajuste o numero de acoes nas arenas se precisar.`,
      `Faz ${daysSinceLastPlannerOpen} dias que voce nao passa por aqui. Eu recomecaria pequeno: uma acao real hoje, o resto a gente reorganiza depois.`,
    ], random);
  }

  if (!hasActiveCycle && arenasCount > 0) {
    return pickLine([
      'Para nao se perder nas acoes, eu comecaria com um ciclo de 1 semana ou menos. Quer montar um pequeno?',
      'Voce ja tem arena. Agora falta uma janela curta para ela respirar: um ciclo de ate 7 dias costuma ser mais facil de conduzir.',
    ], random);
  }

  if (cycleLengthDays && cycleLengthDays > 7 && cycleProgress < 35) {
    return pickLine([
      `Esse ciclo tem ${cycleLengthDays} dias e ainda esta em ${cycleProgress}%. Talvez um ciclo de 1 semana ou menos fique mais facil de conduzir.`,
      `O ciclo esta longo para o progresso atual: ${cycleProgress}% em ${cycleLengthDays} dias. Pode valer encurtar a rodada e proteger o foco.`,
    ], random);
  }

  if (daysSinceLastProof !== null && daysSinceLastProof >= 3) {
    return pickLine([
      `Faz ${daysSinceLastProof} dias desde sua ultima conclusao. Talvez hoje seja dia de reduzir a carga e fechar uma acao pequena.`,
      `A sequencia esfriou um pouco. Nao precisa voltar perfeito: uma acao concluida hoje ja recoloca o ciclo em movimento.`,
    ], random);
  }

  if (focusArenaName && (focusArenaPace === 'atrasado' || focusArenaPace === 'critico')) {
    return pickLine([
      `${focusArenaName} esta ficando para tras pelo tempo e progresso do ciclo. Quer abrir a arena e rever a meta?`,
      `A arena ${focusArenaName} esta pedindo ajuste. Talvez valha reduzir repeticoes, editar uma acao ou tirar o que nao faz mais sentido.`,
    ], random);
  }

  if (focusArenaName && focusArenaAdjustment === 'pausar_arena') {
    return pickLine([
      `${focusArenaName} esta sem movimento ha alguns dias. Quer retomar com uma acao pequena ou pausar essa arena por enquanto?`,
      `A arena ${focusArenaName} esfriou. Antes de se cobrar, vale decidir: continuar, editar ou pausar?`,
    ], random);
  }

  if (cyclePace === 'atrasado' || cyclePace === 'critico') {
    return pickLine([
      'Seu ciclo esta ficando para tras olhando o tempo e o progresso. Quer rever alguma meta antes de tentar compensar tudo?',
      'O ritmo do ciclo caiu. Eu olharia primeiro para o que pode ser reduzido ou removido sem culpa.',
    ], random);
  }

  if (priorityActionName) {
    return pickLine([
      `Que tal ${priorityActionName} hoje? Uma acao real ja mantem o ciclo em movimento.`,
      `${priorityActionName} ainda cabe hoje? Se nao couber, vale ajustar a meta em vez de deixar virar peso.`,
    ], random);
  }

  if (completedActionNameToday) {
    return pickLine([
      `Voce ja fez ${completedActionNameToday} hoje. Boa. Quer proteger o ritmo ou encerrar por aqui?`,
      `${completedActionNameToday} ja saiu do papel hoje. Agora escolhe com calma se ainda cabe mais alguma coisa.`,
    ], random);
  }

  if (arenasCount === 1 && actionsCount <= 3) {
    return pickLine([
      'Voce esta com uma arena so. Se fizer sentido, adicionar uma segunda frente pode equilibrar melhor o ciclo.',
      'Sua estrutura esta bem enxuta. Uma segunda arena pode ajudar a separar o que e corpo, trabalho, casa ou foco.',
    ], random);
  }

  return null;
};

const openFocusedArena = (context: OracleContext): OracleCycleCoachAction | null => {
  if (!context.focusArenaSignal) return null;
  return {
    id: `coach-open-arena:${context.focusArenaSignal.arenaId}`,
    label: `Abrir ${context.focusArenaSignal.arenaName}`,
    kind: 'open_arena',
    arenaId: context.focusArenaSignal.arenaId,
  };
};

const compactActions = (
  actions: Array<OracleCycleCoachAction | null>,
): OracleCycleCoachAction[] => actions.filter((action): action is OracleCycleCoachAction => Boolean(action)).slice(0, 2);

export const buildOracleCycleCoachBrief = (context: OracleContext): OracleCycleCoachBrief => {
  const focusArena = context.focusArenaSignal;
  const progress = Math.max(0, Math.round(context.cycleCompletionPercent || 0));
  const expected = Math.max(0, Math.round(context.expectedCycleCompletionPercent || 0));
  const completed = Math.max(0, context.cycleCompletedActions);
  const total = Math.max(0, context.cycleTotalActions);
  const pending = Math.max(0, context.cyclePendingActions);

  if (!context.hasArenas) {
    return {
      id: 'coach:first-arena',
      content: 'Vamos comecar pequeno. Escolha uma frente importante da sua vida e crie uma arena com uma acao que realmente caiba na sua semana.',
      quickActions: [{ id: 'coach-open-arenas', label: 'Criar primeira arena', kind: 'open_arenas' }],
    };
  }

  if (!context.hasCycle) {
    return {
      id: 'coach:start-cycle',
      content: `Voce ja tem ${context.totalArenas} arena${context.totalArenas === 1 ? '' : 's'}. Agora escolha uma rodada curta para transformar intencao em ritmo. Sete dias ja bastam para aprender o que cabe de verdade.`,
      quickActions: [
        { id: 'coach-open-cycle', label: 'Montar ciclo', kind: 'open_cycle' },
        { id: 'coach-open-arenas', label: 'Rever arenas', kind: 'open_arenas' },
      ],
    };
  }

  if ((total > 0 && pending === 0) || progress >= 100) {
    return {
      id: `coach:cycle-ready:${context.cycleName || 'active'}`,
      content: `Voce concluiu o que estava medido neste ciclo. Antes de abrir outra rodada, feche este ciclo e registre o que funcionou.`,
      quickActions: [{ id: 'coach-open-cycle', label: 'Fechar ciclo', kind: 'open_cycle' }],
    };
  }

  if (total === 0) {
    return {
      id: `coach:unmeasured:${focusArena?.arenaId || 'cycle'}`,
      content: focusArena
        ? `${focusArena.arenaName} ainda nao tem uma meta mensuravel neste ciclo. Se quiser acompanhar o ritmo, defina uma repeticao minima que seja honesta.`
        : 'Este ciclo ainda nao tem uma meta mensuravel. Escolha uma acao pequena para saber o que significa avancar.',
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-arenas', label: 'Ver arenas', kind: 'open_arenas' },
      ]),
    };
  }

  if (context.cycleDaysRemaining === 0 && pending > 0) {
    return {
      id: `coach:last-day:${context.cycleName || 'active'}:${pending}`,
      content: `O ciclo chegou ao ultimo dia com ${pending} acao${pending === 1 ? '' : 'es'} pendente${pending === 1 ? '' : 's'}. Nao precisa fingir um fechamento perfeito: faca o que ainda cabe e encerre com uma leitura honesta.`,
      quickActions: [
        { id: 'coach-open-planner', label: 'Ver o que ainda cabe', kind: 'open_planner' },
        { id: 'coach-open-cycle', label: 'Rever ciclo', kind: 'open_cycle' },
      ],
    };
  }

  if (context.cyclePace === 'atrasado' || context.cyclePace === 'critico') {
    const arenaLine = focusArena
      ? ` ${focusArena.arenaName} pede mais atencao agora.`
      : '';
    return {
      id: `coach:behind:${focusArena?.arenaId || 'cycle'}:${context.cycleDayNumber || 0}`,
      content: `Seu ciclo esta em ${progress}%, enquanto o tempo percorrido aponta cerca de ${expected}%.${arenaLine} Em vez de tentar compensar tudo, escolha uma acao real ou reduza uma meta que deixou de fazer sentido.`,
      quickActions: compactActions([
        openFocusedArena(context),
        { id: 'coach-open-planner', label: 'Escolher uma acao', kind: 'open_planner' },
      ]),
    };
  }

  if (completed === 0) {
    return {
      id: `coach:first-proof:${context.cycleName || 'active'}`,
      content: `O ciclo comecou, mas ainda falta a primeira conclusao. Nao tente resolver a semana inteira agora: escolha a menor acao que coloca o ciclo em movimento hoje.`,
      quickActions: [
        { id: 'coach-open-planner', label: 'Escolher primeira acao', kind: 'open_planner' },
      ],
    };
  }

  if (context.cyclePace === 'adiantado') {
    return {
      id: `coach:ahead:${context.cycleDayNumber || 0}:${completed}`,
      content: `Boa: voce concluiu ${completed} de ${total} acoes e esta adiantado no ciclo. Proteja esse ritmo sem transformar a vantagem em carga extra.`,
      quickActions: [{ id: 'coach-open-cycle', label: 'Ver andamento', kind: 'open_cycle' }],
    };
  }

  const priorityLine = context.priorityActionName
    ? ` Que tal ${context.priorityActionName} hoje?`
    : ' Escolha uma acao que mantenha o fio sem pesar o dia.';
  return {
    id: `coach:on-pace:${context.cycleDayNumber || 0}:${completed}`,
    content: `Voce concluiu ${completed} de ${total} acoes e esta acompanhando o ritmo do ciclo.${priorityLine}`,
    quickActions: [
      { id: 'coach-open-planner', label: 'Abrir Planner', kind: 'open_planner' },
      { id: 'coach-open-cycle', label: 'Ver ciclo', kind: 'open_cycle' },
    ],
  };
};
