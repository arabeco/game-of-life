export type OracleCoachPace = 'adiantado' | 'no_ritmo' | 'atrasado' | 'critico' | null;
export type OracleCoachArenaPace = OracleCoachPace | 'sem_medida';

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
      `Faz ${daysSinceLastProof} dias desde sua ultima prova fechada. Talvez hoje seja dia de reduzir a carga e fechar uma acao pequena.`,
      `A sequencia esfriou um pouco. Nao precisa voltar perfeito: uma prova real hoje ja recoloca o ciclo em movimento.`,
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
