export interface LiveDailyPraiseInput {
  actionName: string;
  arenaName?: string | null;
  completedCount: number;
  plannedCount: number;
  distinctArenaCount: number;
  streakCurrent: number;
  isFirstProofToday: boolean;
}

export interface HistoricalDailyInsightInput {
  completedCount: number;
  plannedCount: number;
  distinctArenaCount: number;
  arenaNames: string[];
  topArenaName?: string | null;
  topArenaCompleted?: number;
  previousActiveDaysAverage?: number | null;
}

const pickLine = (lines: string[], random: () => number): string => (
  lines[Math.floor(random() * lines.length)] || lines[0] || ''
);

const joinNames = (names: string[]): string => {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  if (uniqueNames.length <= 1) return uniqueNames[0] || '';
  if (uniqueNames.length === 2) return `${uniqueNames[0]} e ${uniqueNames[1]}`;
  return `${uniqueNames.slice(0, -1).join(', ')} e ${uniqueNames.at(-1)}`;
};

export const buildLiveDailyPraise = (
  input: LiveDailyPraiseInput,
  random: () => number = Math.random,
): string | null => {
  const completed = Math.max(0, Math.round(input.completedCount));
  const planned = Math.max(0, Math.round(input.plannedCount));
  const arenas = Math.max(0, Math.round(input.distinctArenaCount));
  const streak = Math.max(0, Math.round(input.streakCurrent));
  const actionName = input.actionName.trim() || 'uma ação';
  const arenaName = input.arenaName?.trim() || null;

  if (input.isFirstProofToday) {
    if (streak > 1) {
      return pickLine([
        `${streak} dias em movimento. ${actionName} manteve a sequência viva hoje.`,
        `Primeiro registro de hoje e ${streak} dias seguidos com movimento. Boa constância.`,
      ], random);
    }

    return pickLine([
      `Primeiro registro do dia. ${actionName} já deu ao ciclo algo concreto para contar.`,
      `Boa. ${actionName} saiu do plano e entrou no seu histórico de verdade.`,
    ], random);
  }

  if (planned > 0 && completed >= planned) {
    return pickLine([
      `Você concluiu tudo o que estava registrado para hoje. Dia fechado com consistência.`,
      `${completed} de ${planned}. O que estava previsto para hoje foi realizado.`,
    ], random);
  }

  if (arenas >= 3 && completed >= 3) {
    return pickLine([
      `${completed} ações em ${arenas} áreas. Hoje teve movimento com equilíbrio.`,
      `Você movimentou ${arenas} áreas hoje. Não foi só volume; houve distribuição.`,
    ], random);
  }

  if (completed === 2 && arenas >= 2) {
    return pickLine([
      `Duas ações, em duas áreas diferentes. Um dia pequeno e bem distribuído.`,
      `Você já movimentou duas frentes hoje. Bom equilíbrio sem precisar exagerar.`,
    ], random);
  }

  if (completed === 3) {
    return pickLine([
      `Três ações concluídas hoje. O dia já tem um padrão consistente.`,
      `Terceiro registro do dia. Você está construindo ritmo, não apenas acumulando tarefas.`,
    ], random);
  }

  if (completed === 5) {
    return pickLine([
      `Cinco ações registradas. Bastante movimento hoje; não precisa transformar isso em obrigação amanhã.`,
      `Cinco conclusões no dia. Um avanço forte, sem criar dívida com o dia seguinte.`,
    ], random);
  }

  if (arenaName && completed === 2) {
    return pickLine([
      `${arenaName} recebeu mais um registro hoje. A repetição está começando a virar ritmo.`,
      `Mais um registro em ${arenaName}. É assim que o padrão começa a aparecer.`,
    ], random);
  }

  return null;
};

export const buildHistoricalDailyInsight = (input: HistoricalDailyInsightInput): string => {
  const completed = Math.max(0, Math.round(input.completedCount));
  const planned = Math.max(0, Math.round(input.plannedCount));
  const arenas = Math.max(0, Math.round(input.distinctArenaCount));
  const arenaNames = [...new Set(input.arenaNames.map((name) => name.trim()).filter(Boolean))];
  const namedAreas = joinNames(arenaNames.slice(0, 3));
  const previousAverage = typeof input.previousActiveDaysAverage === 'number'
    ? Math.max(0, input.previousActiveDaysAverage)
    : null;

  if (planned === 0) {
    return 'Este dia ficou sem ações registradas. Ele continua fazendo parte do ciclo, mas ainda não oferece dados suficientes para uma leitura.';
  }

  if (completed === 0) {
    return `Havia ${planned} ${planned === 1 ? 'ação registrada' : 'ações registradas'}, mas nenhuma conclusão. Isso não apaga o ciclo; ajuda a perceber se a carga daquele dia realmente cabia.`;
  }

  if (completed >= planned) {
    if (arenas >= 2 && namedAreas) {
      return `Você concluiu tudo o que estava registrado e movimentou ${namedAreas}. Foi um dia completo e bem distribuído.`;
    }
    return `Você concluiu as ${planned} ${planned === 1 ? 'ação registrada' : 'ações registradas'}. Foi um dia completo dentro da meta que havia sido definida.`;
  }

  if (arenas >= 3 && namedAreas) {
    return `Você movimentou ${namedAreas}. Mesmo sem concluir tudo, o dia teve avanço distribuído por ${arenas} áreas.`;
  }

  if (previousAverage !== null && completed >= Math.ceil(previousAverage + 1)) {
    return `Você concluiu ${completed} ações, acima da média recente de ${previousAverage.toFixed(1).replace('.', ',')}. O dia teve mais movimento que o seu padrão anterior.`;
  }

  const topArenaCompleted = Math.max(0, Math.round(input.topArenaCompleted || 0));
  if (input.topArenaName && topArenaCompleted > completed / 2) {
    return `${input.topArenaName} concentrou a maior parte do movimento: ${topArenaCompleted} de ${completed} conclusões. Foi um dia de foco mais do que de equilíbrio.`;
  }

  if (arenas >= 2 && namedAreas) {
    return `Você concluiu ${completed} de ${planned} ações e movimentou ${namedAreas}. Houve avanço em mais de uma frente, sem exigir um dia perfeito.`;
  }

  return `Você concluiu ${completed} de ${planned} ${planned === 1 ? 'ação registrada' : 'ações registradas'}. O registro mostra avanço real e também o que pode ser ajustado no restante do ciclo.`;
};

/**
 * Leitura do dia corrente no painel diario.
 *
 * O painel so falava sobre dias passados: `buildHistoricalDailyInsight` devolve
 * texto para uma data que ja fechou, e a chamada em SitrepContent desiste quando
 * a data e hoje. Ou seja, no caso normal — abrir o painel durante o dia — nao
 * havia frase nenhuma. Esta funcao cobre esse caso.
 *
 * A profundidade muda com a assinatura, e a diferenca e a REGUA, nao o elogio:
 *  - livre: descreve o dia. Sem comparacao.
 *  - premium: compara com o seu proprio dia medio no ciclo atual.
 *  - platinum: compara o ciclo em curso com a sua mediana de ciclos fechados.
 *
 * Nenhum nivel cobra do jogador. Ficar abaixo da media e informacao, nao falta:
 * o app pontua por `fair_v2_1` justamente para nao punir, e o texto acompanha.
 */
export type DailyReadingDepth = 'livre' | 'premium' | 'platinum';

export interface TodayDailyReadingInput {
  completedCount: number;
  plannedCount: number;
  distinctArenaCount: number;
  topArenaName?: string | null;
  streakCurrent?: number;
  /** Media de conclusoes nos dias ativos anteriores do ciclo atual. */
  cycleActiveDayAverage?: number | null;
  /** Taxa de execucao do ciclo em curso, 0-100. */
  currentCycleExecutionPct?: number | null;
  /** Mediana da taxa de execucao dos ciclos ja fechados, 0-100. */
  pastCyclesExecutionMedianPct?: number | null;
  /** Quantos ciclos fechados sustentam a mediana acima. */
  pastCyclesCount?: number;
}

export interface TodayDailyReading {
  text: string;
  /** Regua exibida ao lado da frase, quando houver comparacao. */
  comparison: string | null;
  depth: DailyReadingDepth;
}

const formatDecimal = (value: number): string => value.toFixed(1).replace('.', ',');

const describeToday = (completed: number, planned: number, arenas: number, topArenaName: string | null): string => {
  if (planned === 0) {
    return 'Nenhuma acao registrada para hoje ainda. O dia continua aberto.';
  }
  if (completed === 0) {
    return `Hoje tem ${planned} ${planned === 1 ? 'acao registrada' : 'acoes registradas'} e nenhuma conclusao ate agora. O dia ainda esta em aberto.`;
  }
  if (completed >= planned) {
    return `Voce ja concluiu as ${planned} ${planned === 1 ? 'acao registrada' : 'acoes registradas'} de hoje.`;
  }
  if (arenas >= 3) {
    return `${completed} de ${planned} concluidas, distribuidas por ${arenas} areas.`;
  }
  if (topArenaName && arenas === 1) {
    return `${completed} de ${planned} concluidas, todas em ${topArenaName}.`;
  }
  return `${completed} de ${planned} acoes concluidas ate agora.`;
};

export const buildTodayDailyReading = (
  input: TodayDailyReadingInput,
  depth: DailyReadingDepth = 'livre',
): TodayDailyReading => {
  const completed = Math.max(0, Math.round(input.completedCount));
  const planned = Math.max(0, Math.round(input.plannedCount));
  const arenas = Math.max(0, Math.round(input.distinctArenaCount));
  const topArenaName = input.topArenaName?.trim() || null;

  const base = describeToday(completed, planned, arenas, topArenaName);

  if (depth === 'livre') {
    return { text: base, comparison: null, depth };
  }

  if (depth === 'platinum') {
    const current = input.currentCycleExecutionPct;
    const median = input.pastCyclesExecutionMedianPct;
    const cycles = Math.max(0, Math.round(input.pastCyclesCount || 0));

    if (typeof current === 'number' && typeof median === 'number' && cycles >= 2) {
      const delta = Math.round(current - median);
      const comparison = `Ciclo em ${Math.round(current)}% · sua mediana em ${cycles} ciclos e ${Math.round(median)}%`;

      if (delta >= 5) {
        return { text: `${base} Este ciclo esta rodando acima do seu padrao historico.`, comparison, depth };
      }
      if (delta <= -5) {
        return { text: `${base} Este ciclo esta abaixo do seu padrao historico — vale olhar se a carga planejada mudou.`, comparison, depth };
      }
      return { text: `${base} Este ciclo esta no seu padrao historico.`, comparison, depth };
    }

    if (cycles < 2) {
      return {
        text: `${base} Ainda nao ha ciclos fechados suficientes para comparar com o seu historico.`,
        comparison: null,
        depth,
      };
    }
  }

  // premium, e platinum sem historico de ciclo suficiente
  const average = typeof input.cycleActiveDayAverage === 'number' && input.cycleActiveDayAverage > 0
    ? input.cycleActiveDayAverage
    : null;

  if (average === null) {
    return {
      text: `${base} Ainda nao ha dias ativos anteriores neste ciclo para servir de referencia.`,
      comparison: null,
      depth,
    };
  }

  const comparison = `Hoje ${completed} · seu dia ativo medio e ${formatDecimal(average)}`;

  if (completed >= average + 1) {
    return { text: `${base} Esta acima do seu dia medio neste ciclo.`, comparison, depth };
  }
  if (completed > 0 && completed <= average - 1) {
    return { text: `${base} Esta abaixo do seu dia medio neste ciclo, o que por si so nao diz muita coisa: um dia menor cabe no ciclo.`, comparison, depth };
  }
  if (completed === 0) {
    return { text: `${base} Seu dia ativo medio neste ciclo e ${formatDecimal(average)}.`, comparison, depth };
  }
  return { text: `${base} Esta na media dos seus dias ativos neste ciclo.`, comparison, depth };
};
