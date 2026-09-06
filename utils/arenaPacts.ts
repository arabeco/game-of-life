import type { Action, Arena, ChestType, ScheduledTask } from '../types';
import { getTaskOperationalDateString, getOperationalDateString, shiftLocalDateString } from './operationalDay.js';
import { calculateArenaProgress } from './progressUtilsEngine.js';

/**
 * NA TELA ISTO SE CHAMA "MISSAO INDIVIDUAL".
 *
 * O nome interno continua "pacto" de proposito: renomear significaria mexer em
 * cinco colunas do banco, tres RPCs e as migracoes ja aplicadas — risco real,
 * zero ganho para quem usa. Se voce leu "pacto" aqui e "missao" na interface,
 * e a mesma coisa.
 *
 * O vocabulario da tela, para nao escorregar de novo:
 *   missao de temporada  — as da season
 *   missao individual    — ESTA, uma por vez, ocupa o slot
 *   missao inicial       — as faceis, completam sozinhas, sem slot
 *   desafio              — duelo contra rival, e so isso
 *
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

export type ArenaPactKind = 'constancia' | 'conclusao' | 'retomada' | 'volume';
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
  /**
   * Por que ESTE pacto, para ESTA pessoa, agora — tirado do mesmo numero que
   * gerou a escolha. Nao e persistido: so existe na proposta.
   *
   * A regra: se nao da para nomear o numero, a proposta nao sai. E o que separa
   * leitura de bajulacao.
   */
  motivo?: string;
  reward: ArenaPactReward;
  /** Data operacional em que o pacto foi aceito. Nada antes disso conta. */
  startedOn: string;
  endsOn?: string | null;
}

export interface ArenaPactProgress {
  current: number;
  goal: number;
  percent: number;
  completed: boolean;
  windowEnded?: boolean;
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

export const VOLUME_TARGETS = { leve: { actions: 3, days: 7 }, media: { actions: 6, days: 14 }, alta: { actions: 10, days: 21 } } as const;

/** Abaixo disso a arena e pequena demais para valer um pacto de conclusao. */
export const MIN_ACTIONS_FOR_CONCLUSAO = 3;

/** A partir de quantos dias parada uma arena vira candidata a retomada. */
export const DIAS_PARA_RETOMADA = 7;

/** Entregas pedidas na retomada. Uma pode ser impulso; duas e retorno. */
export const META_RETOMADA = 2;

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
  /**
   * Em quantos dias DIFERENTES a pessoa entregou nesta arena nos ultimos 30.
   *
   * E a medida do ritmo dela, e sem ela o pacto media a arena em vez da pessoa:
   * "10 acoes em 21 dias" e passeio para quem entrega todo dia e impossivel para
   * quem entrega uma vez por semana — mesma meta, mesmo premio, significados
   * opostos.
   *
   * Sai da mesma varredura de conclusoes que ja roda aqui, e usa o historico
   * completo pelo mesmo motivo que o abandono: o progresso da arena zera a cada
   * ciclo, o ritmo da pessoa nao.
   */
  deliveryDaysLast30: number;
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

  const datas = completed
    .map((task) => String(task.date || '').slice(0, 10))
    .filter(Boolean)
    .sort();
  const lastDate = datas.at(-1) || null;

  const inicioDaJanela = shiftLocalDateString(today, -29);
  const deliveryDaysLast30 = new Set(
    datas.filter((data) => data >= inicioDaJanela && data <= today),
  ).size;

  return {
    arena,
    isLocked: Boolean(lockedArenaIds?.has(arena.id)),
    progressPercent: progress.progressPercent,
    totalPlanned: progress.totalPlanned,
    totalCompleted: progress.totalCompleted,
    isCleared: progress.isCleared,
    hasMeasurableProgress: progress.hasMeasurableProgress,
    daysSinceLastDelivery: lastDate ? Math.max(0, daysBetween(lastDate, today)) : null,
    deliveryDaysLast30,
  };
};

/**
 * A faixa vem da META, e de mais nada.
 *
 * Antes eram TRES reguas decidindo o mesmo premio: constancia e volume olhavam
 * o progresso da arena, conclusao olhava quanto faltava, retomada era sempre
 * leve. Tres escalas para uma moeda so.
 *
 * Com a faixa saindo do tamanho, some a incoerencia E o buraco: sumir por trinta
 * dias passa a dar meta pequena, logo premio pequeno. Nao existe caminho onde
 * ficar parado paga mais.
 */
export const faixaPorMeta = (meta: number): ArenaPactDifficulty => (
  meta <= 3 ? 'leve' : meta <= 7 ? 'media' : 'alta'
);

/** Janela do pacto de volume. Uma so: duas semanas cabem em quase toda vida. */
export const VOLUME_WINDOW_DAYS = 14;

/**
 * O ESCOPO DO APP INTEIRO, como uma arena que nao existe.
 *
 * A missao individual pode ser de uma arena ou de tudo junto. Em vez de abrir um
 * caminho paralelo para o segundo caso — outra medicao, outro texto, outra
 * validacao —, ele vira uma arena SINTETICA que contem todas as acoes reais.
 * Dai para baixo nada muda: a cadencia, a meta, a faixa, a medicao e a
 * restauracao sao as mesmas linhas de codigo.
 *
 * No banco isso e `arena_pact_arena_id` NULO. Aqui e a string vazia, porque o
 * tipo de `Arena` exige id — e a conversao acontece num lugar so,
 * `toArenaPactState`.
 */
export const ESCOPO_APP = '';

export const buildArenaEscopoApp = (arenas: Arena[], actions: Action[]): Arena => ({
  id: ESCOPO_APP,
  assetId: '',
  name: 'todas as arenas',
  description: '',
  icon: '\u2B21',
  actionIds: (actions || [])
    .filter((action) => action.actionType !== 'Livre')
    .filter((action) => (arenas || []).some((arena) => arena.id === action.arenaId && !arena.isArchived))
    .map((action) => action.id),
});

/** A arena de uma missao, real ou sintetica. Quem mede precisa das duas. */
export const resolvePactArena = (
  pact: ArenaPact,
  arenas: Arena[],
  actions: Action[],
): Arena | null => (
  pact.arenaId === ESCOPO_APP
    ? buildArenaEscopoApp(arenas, actions)
    : (arenas || []).find((arena) => arena.id === pact.arenaId) || null
);

/**
 * A meta que cabe no ritmo: o que a pessoa costuma entregar, projetado na
 * janela. Sem esticao — o prazo ja e a pressao, e prometer acima do ritmo e
 * fabricar fracasso.
 *
 * Arena sem historico cai no piso: nao da para estimar ritmo de quem ainda nao
 * comecou, e chutar alto seria inventar.
 */
const metaPorCadencia = (diasEm30: number, janela: number, piso: number, teto: number): number => {
  if (diasEm30 <= 0) return piso;
  return Math.min(teto, Math.max(piso, Math.round((diasEm30 * janela) / 30)));
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
  // A faixa NAO e mais escolhida: ela e derivada da meta em quem chama, e chega
  // aqui so para nao recalcular. Ver `faixaPorMeta`.
  difficulty: ArenaPactDifficulty,
  stats: ArenaStats,
  goal: number,
  startedOn: string,
  endsOn?: string | null,
): ArenaPact => {
  const { arena } = stats;
  const nome = arena.name;
  const diasDaJanela = endsOn ? Math.max(1, daysBetween(startedOn, endsOn) + 1) : VOLUME_WINDOW_DAYS;

  // No escopo do app o nome ja e "todas as arenas", entao "6 ações de todas as
  // arenas" leria mal. O texto muda; a mecanica, nao.
  const escopoApp = arena.id === ESCOPO_APP;

  /**
   * O motivo, tirado do numero que gerou a escolha. Nunca elogio: sempre fato.
   */
  const motivos: Record<ArenaPactKind, string> = {
    retomada: stats.daysSinceLastDelivery
      ? `${nome} está parada há ${stats.daysSinceLastDelivery} dias.`
      : `${nome} está parada.`,
    conclusao: `É o que resta para ${nome} fechar.`,
    constancia: stats.deliveryDaysLast30 > 0
      ? `Você registrou ${nome} em ${stats.deliveryDaysLast30} dos últimos 30 dias.`
      : `${nome} ainda não tem ritmo registrado — esta começa pequena.`,
    volume: stats.deliveryDaysLast30 > 0
      ? (escopoApp
        ? `Você registrou algo em ${stats.deliveryDaysLast30} dos últimos 30 dias — ${goal} em ${diasDaJanela} cabe nesse ritmo.`
        : `Você registrou ${nome} em ${stats.deliveryDaysLast30} dos últimos 30 dias — ${goal} em ${diasDaJanela} cabe nesse ritmo.`)
      : `${nome} ainda não tem ritmo registrado — esta começa pequena.`,
  };

  /**
   * O TITULO diz para que serve; a DESCRICAO diz a regra; o MOTIVO diz por que
   * voce. Tres camadas, tres perguntas diferentes.
   *
   * O titulo era a regra outra vez: "Entregar em Leitura por 5 dias" descreve o
   * mecanismo e nao o proposito. Verbo mais nome, sem artigo — Salvar, Acelerar,
   * Manter, Fechar, Retomar —, e a pessoa sabe o que esta escolhendo antes de ler
   * a letra miuda.
   *
   * ESFRIANDO e um proxy, e vale dizer: "atrasada em relacao ao esperado no
   * ciclo" exigiria a linha do tempo do ciclo, que `ArenaStats` nao recebe. Dias
   * sem entrega e o sinal mais proximo que existe aqui — abaixo de
   * DIAS_PARA_RETOMADA, porque a partir dali o molde de retomada assume.
   */
  const esfriando = (stats.daysSinceLastDelivery ?? 0) >= 3;

  const textos: Record<ArenaPactKind, { title: string; description: string }> = {
    volume: {
      title: `${esfriando ? 'Salvar' : 'Acelerar'} ${nome}`,
      description: escopoApp
        ? `${goal} ações em ${diasDaJanela} dias, em qualquer arena. Conclua ${goal} ações (exceto Livre) entre ${startedOn.split('-').reverse().join('/')} e ${(endsOn || '').split('-').reverse().join('/')}. Descansos não quebram a missão. O dia vira às 4h.`
        : `${goal} ações de ${nome} em ${diasDaJanela} dias. Conclua ${goal} ações (exceto Livre) entre ${startedOn.split('-').reverse().join('/')} e ${(endsOn || '').split('-').reverse().join('/')}. Descansos não quebram o pacto. O dia vira às 4h. Registros tardios dessas datas contam enquanto o pacto estiver aberto.`,
    },
    constancia: {
      title: `Manter ${nome}`,
      description: `Uma ação de ${nome} em ${goal} dias diferentes. Não precisam ser seguidos.`,
    },
    conclusao: {
      title: `Fechar ${nome}`,
      description: goal === 1
        ? `Falta uma ação para ${nome} chegar ao fim.`
        : `Faltam ${goal} ações para ${nome} chegar ao fim.`,
    },
    retomada: {
      title: `Retomar ${nome}`,
      description: stats.daysSinceLastDelivery
        ? `${nome} esta parada ha ${stats.daysSinceLastDelivery} dias. Uma ação concluida reabre o caminho.`
        : `Uma ação concluida em ${nome} reabre o caminho.`,
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
    motivo: motivos[kind],
    reward: ARENA_PACT_REWARDS[difficulty],
    startedOn,
    ...(kind === 'volume' ? { endsOn } : {}),
  };
};

/** Todos os pactos que fariam sentido para uma arena. */
export const buildPactsForArena = (stats: ArenaStats, today: string): ArenaPact[] => {
  if (!isArenaEligible(stats)) return [];

  const pacts: ArenaPact[] = [];

  // Retomada so existe quando ha o que retomar: a arena ja andou e parou.
  //
  // Sao DUAS entregas, e nao uma: uma pode ser impulso, duas e retorno. Continua
  // na faixa leve, porque a faixa agora sai da meta.
  if (
    stats.daysSinceLastDelivery !== null
    && stats.daysSinceLastDelivery >= DIAS_PARA_RETOMADA
  ) {
    pacts.push(buildPact('retomada', faixaPorMeta(META_RETOMADA), stats, META_RETOMADA, today));
  }

  // Conclusao so em arena com tamanho real, senao vira premio por arena de fachada.
  const restantes = Math.max(0, stats.totalPlanned - stats.totalCompleted);
  if (
    stats.hasMeasurableProgress
    && stats.totalPlanned >= MIN_ACTIONS_FOR_CONCLUSAO
    && restantes > 0
  ) {
    // Conclusao ja media o trabalho real restante — a unica das quatro que
    // media a pessoa. Agora a faixa dela sai da mesma regua das outras.
    pacts.push(buildPact('conclusao', faixaPorMeta(restantes), stats, restantes, today));
  }

  // Constancia e volume agora saem do RITMO da pessoa, nao do progresso da
  // arena. O progresso da arena diz o tamanho dela; o ritmo diz o tamanho da
  // pessoa — e o pacto e um compromisso da pessoa.
  const metaConstancia = metaPorCadencia(stats.deliveryDaysLast30, VOLUME_WINDOW_DAYS, 2, CONSTANCIA_DAYS.alta);
  pacts.push(buildPact('constancia', faixaPorMeta(metaConstancia), stats, metaConstancia, today));

  if (stats.hasMeasurableProgress) {
    const metaVolume = metaPorCadencia(stats.deliveryDaysLast30, VOLUME_WINDOW_DAYS, VOLUME_TARGETS.leve.actions, VOLUME_TARGETS.alta.actions);
    pacts.unshift(buildPact(
      'volume',
      faixaPorMeta(metaVolume),
      stats,
      metaVolume,
      today,
      shiftLocalDateString(today, VOLUME_WINDOW_DAYS - 1),
    ));
  }

  return pacts;
};

const KIND_ORDER: ArenaPactKind[] = ['retomada', 'conclusao', 'volume', 'constancia'];

/**
 * Ate tres propostas: RELEVANCIA primeiro, variedade depois.
 *
 * Antes a regra era uma de cada dificuldade. Parecia variedade, mas descartava
 * a proposta mais relevante quando a vaga da dificuldade dela ja tinha sido
 * ocupada por outra arena — e, agora que a faixa sai da meta, duas propostas
 * boas podem legitimamente pagar igual.
 *
 * Entao a ordem e: arena mais precisada primeiro, e dentro dela o TIPO que
 * ainda nao apareceu. Tipo e o que muda o esforco; dificuldade e so o preco.
 * Arena repetida continua fora — faz parecer que o app so enxerga um pedaco da
 * vida da pessoa.
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

  const escolhidos: ArenaPact[] = [];
  const arenasUsadas = new Set<string>();
  const tiposUsados = new Set<ArenaPactKind>();

  // Uma passada pelas arenas na ordem da necessidade. De cada uma sai um pacto
  // so: o de tipo ainda nao usado, ou o primeiro que ela oferecer.
  for (const entry of stats) {
    if (escolhidos.length >= limit) break;
    if (arenasUsadas.has(entry.arena.id)) continue;
    const daArena = buildPactsForArena(entry, today);
    if (daArena.length === 0) continue;

    const inedito = KIND_ORDER
      .filter((kind) => !tiposUsados.has(kind))
      .map((kind) => daArena.find((pact) => pact.kind === kind))
      .find(Boolean);
    const escolhido = inedito || daArena[0];

    escolhidos.push(escolhido);
    arenasUsadas.add(escolhido.arenaId);
    tiposUsados.add(escolhido.kind);
  }

  return escolhidos.slice(0, limit);
};

/**
 * Propostas do APP INTEIRO — o "tudo junto" da escolha.
 *
 * So volume: e o unico molde que faz sentido sem uma frente especifica. Ele
 * reaproveita a arena sintetica, entao a meta sai do ritmo GERAL da pessoa pela
 * mesma conta que usa numa arena so.
 */
export const buildAppScopePacts = (
  arenas: Arena[],
  actions: Action[],
  tasks: ScheduledTask[],
  today: string,
  options: ArenaStatsOptions = {},
): ArenaPact[] => {
  const sintetica = buildArenaEscopoApp(arenas, actions);
  if (sintetica.actionIds.length === 0) return [];
  const stats = buildArenaStats(sintetica, actions, tasks, today, options);
  const meta = metaPorCadencia(stats.deliveryDaysLast30, VOLUME_WINDOW_DAYS, VOLUME_TARGETS.leve.actions, VOLUME_TARGETS.alta.actions);
  return [buildPact(
    'volume',
    faixaPorMeta(meta),
    stats,
    meta,
    today,
    shiftLocalDateString(today, VOLUME_WINDOW_DAYS - 1),
  )];
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
  today = getOperationalDateString(),
): ArenaPactProgress => {
  const vazio: ArenaPactProgress = { current: 0, goal: pact.goal, percent: 0, completed: false };
  if (!arena) return vazio;

  if (pact.kind === 'volume') {
    if (!pact.endsOn) return vazio;
    // Pelos actionIds da arena, e nao por `a.arenaId === arena.id`: a arena do
    // escopo do app e SINTETICA e nao tem id proprio, mas carrega a lista de
    // acoes. Arena real tem os dois, entao a regra unica serve as duas.
    const doEscopo = new Set(arena.actionIds || []);
    const ids = new Set(actions.filter(a => doEscopo.has(a.id) && a.actionType !== 'Livre').map(a => a.id));
    const current = new Set(tasks.filter(t => {
      const date = getTaskOperationalDateString(t);
      return t.completed && ids.has(t.actionId) && date >= pact.startedOn && date <= pact.endsOn! && date <= today;
    }).map(t => t.id)).size;
    return { current, goal: pact.goal, percent: Math.min(100, Math.round(current / pact.goal * 100)),
      completed: current >= pact.goal, windowEnded: today > pact.endsOn };
  }

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
  arenaPactEndsOn?: string | null;
}

const KINDS: ArenaPactKind[] = ['constancia', 'conclusao', 'retomada', 'volume'];
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
  arenaPactEndsOn: string | null;
}

export const toArenaPactState = (pact: ArenaPact | null): ArenaPactWrite => (
  pact
    ? {
      // O sentinela vira NULO no banco: e la que "sem arena" significa "o app
      // inteiro", e as duas RPCs leem exatamente isso.
      arenaPactArenaId: pact.arenaId === ESCOPO_APP ? null : pact.arenaId,
      arenaPactKind: pact.kind,
      arenaPactDifficulty: pact.difficulty,
      arenaPactGoal: pact.goal,
      arenaPactStartedOn: pact.startedOn,
      arenaPactEndsOn: pact.endsOn || null,
    }
    : {
      arenaPactArenaId: null,
      arenaPactKind: null,
      arenaPactDifficulty: null,
      arenaPactGoal: null,
      arenaPactStartedOn: null,
      arenaPactEndsOn: null,
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
  // O TIPO e quem diz que ha missao, nao a arena: no escopo do app ela e nula.
  if (!state?.arenaPactKind) return null;

  const kind = KINDS.find((entry) => entry === state.arenaPactKind);
  const difficulty = DIFFICULTIES.find((entry) => entry === state.arenaPactDifficulty);
  const goal = Number(state.arenaPactGoal || 0);
  const startedOn = String(state.arenaPactStartedOn || '').slice(0, 10);
  if (!kind || !difficulty || goal <= 0 || !startedOn) return null;

  const escopoApp = !state.arenaPactArenaId;
  if (escopoApp && kind !== 'volume') return null;
  const arena = escopoApp
    ? buildArenaEscopoApp(arenas, actions)
    : (arenas || []).find((entry) => entry.id === state.arenaPactArenaId);
  if (!arena) return null;

  const endsOn = state.arenaPactEndsOn || null;
  if (kind === 'volume' && (!endsOn || endsOn < startedOn)) return null;
  return buildPact(kind, difficulty, buildArenaStats(arena, actions, tasks, today), goal, startedOn, endsOn);
};
