import type { Action, Arena, ChestType, ScheduledTask } from '../types';
import { calculateArenaProgress } from './progressUtilsEngine.js';

/**
 * Pactos de arena: as missoes que o Oraculo propoe sobre arenas que o jogador JA TEM.
 *
 * As 7 missoes de `systemChallenges.ts` sao todas de primeira vez — primeira arena,
 * primeiro ciclo, primeira campanha. Gastou, acabou: depois do onboarding o Oraculo
 * fica sem nada para oferecer. E elas medem progresso por NOME DE ACAO, entao cada
 * missao precisa criar a propria acao, que cai numa arena separada da vida real da
 * pessoa.
 *
 * O pacto inverte as duas coisas. Ele aponta para uma arena existente e mede as
 * acoes de verdade dela. Como a arena muda, tres moldes bastam para nunca repetir:
 * o repertorio deixa de ser uma lista finita e passa a ser molde x arena.
 *
 * Nada aqui usa IA. E filtro e contagem sobre dado que ja esta na memoria.
 */

export type ArenaPactKind = 'constancia' | 'conclusao' | 'retomada';
export type ArenaPactDifficulty = 'leve' | 'media' | 'alta';

export interface ArenaPactReward {
  gold: number;
  xp: number;
  chest?: ChestType;
}

export interface ArenaPact {
  id: string;
  kind: ArenaPactKind;
  difficulty: ArenaPactDifficulty;
  arenaId: string;
  arenaName: string;
  arenaIcon: string;
  title: string;
  description: string;
  /** Dias exigidos, acoes restantes, ou 1 para retomada. */
  goal: number;
  reward: ArenaPactReward;
  /** Data operacional em que o pacto foi aceito. Nada antes disso conta. */
  startedOn: string;
}

export interface ArenaPactProgress {
  current: number;
  goal: number;
  percent: number;
  completed: boolean;
}

/**
 * Recompensa por dificuldade. Fixa por faixa, e nao proporcional ao tamanho da
 * arena: premio proporcional convida a fabricar arena sob medida para o premio.
 * A faixa ja e escolhida a partir do esforco real, entao a escala existe sem
 * abrir essa porta.
 *
 * XP na MESMA escala das missoes (constants/systemChallenges.ts): 100 para o
 * leve, 300 para o medio, 500 para o maior. XP no Glyph e minuto de acao, e o
 * premio e bonus por cima do que a acao ja paga. Esta tabela nasceu com
 * 300/750/1500, o que fazia um pacto de arena render o triplo da maior missao
 * do jogo — duas reguas diferentes para a mesma moeda.
 */
export const ARENA_PACT_REWARDS: Record<ArenaPactDifficulty, ArenaPactReward> = {
  leve: { gold: 2, xp: 100 },
  media: { gold: 5, xp: 300 },
  alta: { gold: 10, xp: 500, chest: 'Raro' },
};

/** Dias exigidos em cada faixa do pacto de constancia. */
export const CONSTANCIA_DAYS: Record<ArenaPactDifficulty, number> = {
  leve: 3,
  media: 5,
  alta: 7,
};

/** Abaixo disso a arena e pequena demais para valer um pacto de conclusao. */
export const MIN_ACTIONS_FOR_CONCLUSAO = 3;

/** A partir de quantos dias parada uma arena vira candidata a retomada. */
export const DIAS_PARA_RETOMADA = 7;

export interface ArenaStats {
  arena: Arena;
  /**
   * Arena travada por campanha. Nao sai do objeto da arena: `is_locked` nao e
   * coluna, o estado vive no arenaConfig da campanha e e recalculado a partir
   * dos pre-requisitos. Por isso entra por fora, ja resolvido por quem chama.
   */
  isLocked: boolean;
  progressPercent: number;
  totalPlanned: number;
  totalCompleted: number;
  isCleared: boolean;
  hasMeasurableProgress: boolean;
  /** Dias desde a ultima conclusao na arena. null quando nunca houve uma. */
  daysSinceLastDelivery: number | null;
}

const toDate = (value: string): Date => new Date(`${value.slice(0, 10)}T00:00:00`);

const daysBetween = (from: string, to: string): number => Math.round(
  (toDate(to).getTime() - toDate(from).getTime()) / 86400000,
);

/** Tarefas concluidas que pertencem a arena. */
const arenaCompletedTasks = (arena: Arena, tasks: ScheduledTask[]): ScheduledTask[] => {
  const actionIds = new Set(arena.actionIds || []);
  return (tasks || []).filter((task) => Boolean(task.completed) && actionIds.has(task.actionId));
};

export interface ArenaStatsOptions {
  lockedArenaIds?: ReadonlySet<string>;
  /**
   * Historico completo, sem recorte de ciclo. So o abandono usa isto.
   *
   * Progresso de arena ZERA a cada ciclo — ArenaCard recorta as tarefas por
   * activeCycle, entao uma arena fechada no ciclo passado aparece aberta no
   * novo. O pacto tem de enxergar o mesmo que a pessoa ve, senao recusa arena
   * que a tela mostra vazia.
   *
   * Ja "parada ha 86 dias" e o contrario: cortar por ciclo zeraria a conta a
   * cada virada e a retomada nunca dispararia, que e justamente o molde que so
   * existe por causa de arena real abandonada.
   */
  allTimeTasks?: ScheduledTask[];
}

export const buildArenaStats = (
  arena: Arena,
  actions: Action[],
  tasks: ScheduledTask[],
  today: string,
  options: ArenaStatsOptions = {},
): ArenaStats => {
  const { lockedArenaIds, allTimeTasks } = options;
  const progress = calculateArenaProgress({ arena, actions, tasks });
  const completed = arenaCompletedTasks(arena, allTimeTasks || tasks);

  const lastDate = completed
    .map((task) => String(task.date || '').slice(0, 10))
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    arena,
    isLocked: Boolean(lockedArenaIds?.has(arena.id)),
    progressPercent: progress.progressPercent,
    totalPlanned: progress.totalPlanned,
    totalCompleted: progress.totalCompleted,
    isCleared: progress.isCleared,
    hasMeasurableProgress: progress.hasMeasurableProgress,
    daysSinceLastDelivery: lastDate ? Math.max(0, daysBetween(lastDate, today)) : null,
  };
};

/**
 * Arenas que podem receber um pacto. Propor pacto sobre arena arquivada, travada,
 * escondida, vazia ou ja concluida e o jeito mais rapido de o Oraculo perder a
 * confianca de quem le.
 */
export const isArenaEligible = (stats: ArenaStats): boolean => {
  const { arena } = stats;
  // `isArchived` e coluna de verdade. `isCleared`, `isLocked` e `isHidden` nao
  // sao: o primeiro vem calculado em stats, e o travamento chega pelo conjunto
  // da campanha. Ler os campos do objeto aqui era checagem que nunca disparava.
  if (arena.isArchived) return false;
  if (stats.isLocked) return false;
  // isCleared tambem chega calculado (stats), mas getCampaignArenaStates devolve
  // o campo por arena e alguem pode passa-lo adiante no objeto: guardar os dois
  // nao custa nada e fecha a porta se isso acontecer.
  if (arena.isCleared || arena.isHidden) return false;
  if (!Array.isArray(arena.actionIds) || arena.actionIds.length === 0) return false;
  if (stats.isCleared) return false;
  return true;
};

const conclusaoDifficulty = (restantes: number): ArenaPactDifficulty => {
  if (restantes <= 2) return 'leve';
  if (restantes <= 5) return 'media';
  return 'alta';
};

const buildPact = (
  kind: ArenaPactKind,
  difficulty: ArenaPactDifficulty,
  stats: ArenaStats,
  goal: number,
  startedOn: string,
): ArenaPact => {
  const { arena } = stats;
  const nome = arena.name;

  const textos: Record<ArenaPactKind, { title: string; description: string }> = {
    constancia: {
      title: `Entregar em ${nome} por ${goal} dias`,
      description: `Conclua ao menos uma acao de ${nome} em ${goal} dias diferentes. Nao precisam ser seguidos.`,
    },
    conclusao: {
      title: `Fechar ${nome}`,
      description: goal === 1
        ? `Falta uma acao para ${nome} chegar ao fim.`
        : `Faltam ${goal} acoes para ${nome} chegar ao fim.`,
    },
    retomada: {
      title: `Voltar a ${nome}`,
      description: stats.daysSinceLastDelivery
        ? `${nome} esta parada ha ${stats.daysSinceLastDelivery} dias. Uma acao concluida reabre o caminho.`
        : `Uma acao concluida em ${nome} reabre o caminho.`,
    },
  };

  return {
    id: `pact-${kind}-${arena.id}-${startedOn}`,
    kind,
    difficulty,
    arenaId: arena.id,
    arenaName: nome,
    arenaIcon: arena.icon || '\u{1F3DF}️',
    title: textos[kind].title,
    description: textos[kind].description,
    goal,
    reward: ARENA_PACT_REWARDS[difficulty],
    startedOn,
  };
};

/** Todos os pactos que fariam sentido para uma arena. */
export const buildPactsForArena = (stats: ArenaStats, today: string): ArenaPact[] => {
  if (!isArenaEligible(stats)) return [];

  const pacts: ArenaPact[] = [];

  // Retomada so existe quando ha o que retomar: a arena ja andou e parou.
  if (
    stats.daysSinceLastDelivery !== null
    && stats.daysSinceLastDelivery >= DIAS_PARA_RETOMADA
  ) {
    pacts.push(buildPact('retomada', 'leve', stats, 1, today));
  }

  // Conclusao so em arena com tamanho real, senao vira premio por arena de fachada.
  const restantes = Math.max(0, stats.totalPlanned - stats.totalCompleted);
  if (
    stats.hasMeasurableProgress
    && stats.totalPlanned >= MIN_ACTIONS_FOR_CONCLUSAO
    && restantes > 0
  ) {
    pacts.push(buildPact('conclusao', conclusaoDifficulty(restantes), stats, restantes, today));
  }

  // Constancia serve a qualquer arena viva. A faixa vem do quanto ela ja anda:
  // arena parada recebe meta curta, arena que ja tem ritmo recebe meta longa.
  const faixa: ArenaPactDifficulty = stats.daysSinceLastDelivery === null
    ? 'leve'
    : stats.daysSinceLastDelivery >= DIAS_PARA_RETOMADA
      ? 'leve'
      : stats.progressPercent >= 50 ? 'alta' : 'media';
  pacts.push(buildPact('constancia', faixa, stats, CONSTANCIA_DAYS[faixa], today));

  return pacts;
};

const DIFFICULTY_ORDER: ArenaPactDifficulty[] = ['leve', 'media', 'alta'];

/**
 * Ate tres propostas, de dificuldades diferentes, cada uma numa arena diferente
 * quando der. Dificuldade repetida transforma escolha em sorteio; arena repetida
 * faz parecer que o app so enxerga uma parte da vida da pessoa.
 */
export const buildPactCandidates = (
  arenas: Arena[],
  actions: Action[],
  tasks: ScheduledTask[],
  today: string,
  limit = 3,
  options: ArenaStatsOptions = {},
): ArenaPact[] => {
  const stats = (arenas || [])
    .map((arena) => buildArenaStats(arena, actions, tasks, today, options))
    .filter(isArenaEligible);

  // Arena parada ha mais tempo primeiro: e a que mais precisa de um empurrao.
  stats.sort((left, right) => (right.daysSinceLastDelivery ?? 0) - (left.daysSinceLastDelivery ?? 0));

  const todos = stats.flatMap((entry) => buildPactsForArena(entry, today));

  const escolhidos: ArenaPact[] = [];
  const arenasUsadas = new Set<string>();

  for (const difficulty of DIFFICULTY_ORDER) {
    const candidato = todos.find((pact) => (
      pact.difficulty === difficulty && !arenasUsadas.has(pact.arenaId)
    ));
    if (candidato) {
      escolhidos.push(candidato);
      arenasUsadas.add(candidato.arenaId);
    }
  }

  // Faltando opcao, completa sem repetir arena; so entao aceita repetir.
  if (escolhidos.length < limit) {
    for (const pact of todos) {
      if (escolhidos.length >= limit) break;
      if (escolhidos.some((entry) => entry.id === pact.id)) continue;
      if (arenasUsadas.has(pact.arenaId)) continue;
      escolhidos.push(pact);
      arenasUsadas.add(pact.arenaId);
    }
  }

  return escolhidos.slice(0, limit);
};

/** Propostas restritas a uma arena escolhida pelo jogador. */
export const buildPactCandidatesForArena = (
  arena: Arena,
  actions: Action[],
  tasks: ScheduledTask[],
  today: string,
  options: ArenaStatsOptions = {},
): ArenaPact[] => buildPactsForArena(buildArenaStats(arena, actions, tasks, today, options), today);

/**
 * Progresso do pacto ativo. So conta o que aconteceu a partir do aceite — aceitar
 * um pacto ja cumprido pelo passado nao seria compromisso nenhum.
 */
export const measurePactProgress = (
  pact: ArenaPact,
  arena: Arena | null | undefined,
  actions: Action[],
  tasks: ScheduledTask[],
): ArenaPactProgress => {
  const vazio: ArenaPactProgress = { current: 0, goal: pact.goal, percent: 0, completed: false };
  if (!arena) return vazio;

  if (pact.kind === 'conclusao') {
    const progress = calculateArenaProgress({ arena, actions, tasks });
    const completed = progress.isCleared || progress.progressPercent >= 100;
    return {
      current: completed ? pact.goal : Math.max(0, pact.goal - Math.max(0, progress.totalPlanned - progress.totalCompleted)),
      goal: pact.goal,
      percent: Math.min(100, Math.round(progress.progressPercent)),
      completed,
    };
  }

  const desdeOAceite = arenaCompletedTasks(arena, tasks)
    .filter((task) => String(task.date || '').slice(0, 10) >= pact.startedOn);

  if (pact.kind === 'retomada') {
    const current = desdeOAceite.length > 0 ? 1 : 0;
    return { current, goal: 1, percent: current * 100, completed: current >= 1 };
  }

  // constancia: dias distintos, nao numero de acoes. Cinco acoes num dia so
  // continuam sendo um dia.
  const dias = new Set(desdeOAceite.map((task) => String(task.date || '').slice(0, 10)));
  const current = dias.size;
  return {
    current,
    goal: pact.goal,
    percent: Math.min(100, Math.round((current / Math.max(1, pact.goal)) * 100)),
    completed: current >= pact.goal,
  };
};

/** O que fica gravado no perfil. O resto do pacto e derivado destes campos. */
export interface ArenaPactState {
  arenaPactArenaId?: string | null;
  arenaPactKind?: string | null;
  arenaPactDifficulty?: string | null;
  arenaPactGoal?: number | null;
  arenaPactStartedOn?: string | null;
}

const KINDS: ArenaPactKind[] = ['constancia', 'conclusao', 'retomada'];
const DIFFICULTIES: ArenaPactDifficulty[] = ['leve', 'media', 'alta'];

/**
 * Campos prontos para gravar. A escrita e estrita; so a LEITURA e frouxa
 * (ArenaPactState), porque o que volta do banco chega sem tipo garantido.
 */
export interface ArenaPactWrite {
  arenaPactArenaId: string | null;
  arenaPactKind: ArenaPactKind | null;
  arenaPactDifficulty: ArenaPactDifficulty | null;
  arenaPactGoal: number | null;
  arenaPactStartedOn: string | null;
}

export const toArenaPactState = (pact: ArenaPact | null): ArenaPactWrite => (
  pact
    ? {
      arenaPactArenaId: pact.arenaId,
      arenaPactKind: pact.kind,
      arenaPactDifficulty: pact.difficulty,
      arenaPactGoal: pact.goal,
      arenaPactStartedOn: pact.startedOn,
    }
    : {
      arenaPactArenaId: null,
      arenaPactKind: null,
      arenaPactDifficulty: null,
      arenaPactGoal: null,
      arenaPactStartedOn: null,
    }
);

/**
 * Remonta o pacto ativo a partir do que esta gravado.
 *
 * Titulo, descricao e recompensa NAO vem do banco: saem do molde, agora. Assim
 * mudar o molde corrige tambem os pactos que ja estavam abertos, em vez de
 * deixar texto velho preso na linha.
 *
 * Devolve null quando a arena sumiu — apagar a arena dissolve o pacto, e o
 * `on delete set null` do banco faz exatamente isso com o arena_id.
 */
export const rebuildActivePact = (
  state: ArenaPactState | null | undefined,
  arenas: Arena[],
  actions: Action[],
  tasks: ScheduledTask[],
  today: string,
): ArenaPact | null => {
  if (!state?.arenaPactArenaId || !state.arenaPactKind) return null;

  const kind = KINDS.find((entry) => entry === state.arenaPactKind);
  const difficulty = DIFFICULTIES.find((entry) => entry === state.arenaPactDifficulty);
  const goal = Number(state.arenaPactGoal || 0);
  const startedOn = String(state.arenaPactStartedOn || '').slice(0, 10);
  if (!kind || !difficulty || goal <= 0 || !startedOn) return null;

  const arena = (arenas || []).find((entry) => entry.id === state.arenaPactArenaId);
  if (!arena) return null;

  return buildPact(kind, difficulty, buildArenaStats(arena, actions, tasks, today), goal, startedOn);
};
