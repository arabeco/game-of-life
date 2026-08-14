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
