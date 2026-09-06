/**
 * O arbitro do Oraculo: quem merece falar agora.
 *
 * ANTES daqui, a fala saia de uma cascata de dez `if` dentro de
 * buildPlannerCoachSpeech: o primeiro que casasse vencia e calava os outros
 * nove. Uma pessoa pode estar ao mesmo tempo tres dias ausente, com o ciclo
 * atrasado, uma arena critica, outra retomada e no streak 29 — e a cascata
 * decidia "ausente ganhou, fim". A vida nao tem prioridade fixa.
 *
 * E as arenas chegavam la ja mutiladas. O contexto calcula ate seis, ordenadas
 * por GRAVIDADE (multiplicador de 1000 no suggestedAdjustment), e a fala usava
 * so `arenaSignals[0]`. Calculava seis e jogava cinco fora. Pior: por ser
 * ordenacao por gravidade, `adiantado` + `manter_ritmo` da a menor nota
 * possivel — era estruturalmente impossivel uma arena que vai bem ganhar a voz,
 * e uma virada CAIA no ranking justamente por ter melhorado.
 *
 * Agora cada detector produz candidatos independentes, ninguem cala ninguem, e
 * o arbitro escolhe por relevancia.
 *
 * A pergunta mudou de "qual arena esta pior?" para "qual acontecimento merece
 * ser dito agora?" — e, antes dela, "alguem merece falar?".
 *
 * RELEVANCIA NAO E TAMANHO DA CONQUISTA, e quanto vale interromper. Uma arena
 * fechada ja foi fechada e vai continuar fechada daqui a vinte minutos; um
 * streak pode morrer hoje. Por isso quatro eixos e nao uma nota unica: discutir
 * se "streak em risco e 4 ou arena concluida e 4" e insoluvel, porque as duas
 * sao importantes por motivos diferentes.
 *
 * O contrato deste arquivo e tests/oracle-arbiter.regression.mjs. Os pesos sao
 * ajustaveis; o que o teste protege sao os COMPORTAMENTOS que eles produzem.
 */

export type OracleCoachPace = 'adiantado' | 'no_ritmo' | 'atrasado' | 'critico' | null;
export type OracleCoachArenaPace = OracleCoachPace | 'sem_medida';

/**
 * Cada tipo corresponde a um estado de COACH_LINES. Um candidato sem banco de
 * frases venceria e ficaria mudo, entao o teste amarra os dois lados.
 */
export type OracleCandidateType =
  | 'streak_marco'
  | 'streak_em_risco'
  | 'meta_inflada'
  | 'ausente'
  | 'arena_retomada'
  | 'sem_ciclo'
  | 'ciclo_longo'
  | 'sem_entrega'
  | 'arena_atrasada'
  | 'arena_parada'
  | 'ciclo_atrasado'
  | 'prioridade'
  | 'ja_entregou'
  | 'estrutura_enxuta';

export const ORACLE_CANDIDATE_TYPES: readonly OracleCandidateType[] = [
  'streak_marco',
  'streak_em_risco',
  'meta_inflada',
  'ausente',
  'arena_retomada',
  'sem_ciclo',
  'ciclo_longo',
  'sem_entrega',
  'arena_atrasada',
  'arena_parada',
  'ciclo_atrasado',
  'prioridade',
  'ja_entregou',
  'estrutura_enxuta',
];

export interface OracleCandidateWeight {
  /** O quanto isto pesa na vida da pessoa. */
  importance: number;
  /** O quanto perde valor se for dito amanha. E o eixo que separa risco de fato consumado. */
  urgency: number;
  /** O quanto isto e diferente do que ela ja sabe — repetir o obvio nao informa. */
  novelty: number;
  /** O quanto ela consegue fazer alguma coisa a respeito agora. */
  actionability: number;
  /**
   * Dias que o assunto fica de molho depois de dito. Propriedade do TIPO, nao
   * da situacao: queixa cansa, risco nao. Zero ainda impede repetir no mesmo dia.
   */
  cooldownDays: number;
  why: string;
}

/**
 * A tabela unica. Nenhum peso mora fora daqui.
 *
 * Isto e uma condicao da troca, nao estilo: substituir dez `if` legiveis por
 * quatro numeros vezes dez tipos so vale a pena se os numeros estiverem todos no
 * mesmo lugar e cada um disser por que e o que e. Peso espalhado pelo codigo
 * seria uma regra ruim E opaca — pior que a cascata que ela substitui.
 */
export const ORACLE_CANDIDATE_WEIGHTS: Record<OracleCandidateType, OracleCandidateWeight> = {
  streak_marco: {
    importance: 4, urgency: 3, novelty: 4, actionability: 0,
    cooldownDays: 0, // Zero: cada marco e um numero diferente, e so pode acontecer uma vez cada.
    why: 'Novidade 4 e não 5 porque marco e PREVISIVEL: quem esta no dia 6 sabe que amanha e 7. Uma retomada surpreende, um marco chega marcado. E o que faz o dia 7 perder para uma arena parada ha nove dias enquanto o dia 100 ganha — a diferenca vem do boost, não da base. Urgencia 3 porque comemoracao adiada e comemoracao perdida. Acionabilidade zero de proposito: pedir alguma coisa aqui estragaria o unico momento do app em que a pessoa não deve nada.',
  },
  streak_em_risco: {
    importance: 4, urgency: 5, novelty: 3, actionability: 5,
    cooldownDays: 0, // Zero: cada noite e um risco novo, e nao avisar porque avisou ontem seria deixar morrer por elegancia.
    why: 'A unica coisa no app que morre sozinha se ninguem disser nada. Uma arena fechada continua fechada daqui a vinte minutos; um streak de 23 dias vira 0 na virada. Vence ate a estrutura inflada — a conta que não fecha continua não fechando amanha de manha, e a sequência não.',
  },
  meta_inflada: {
    importance: 5, urgency: 3, novelty: 4, actionability: 5,
    cooldownDays: 3, // Tres dias: a estrutura nao muda sozinha, e repetir todo dia vira cobranca sobre algo que ela ja ouviu.
    why: 'A nota mais alta da tabela, inclusive acima de "sumiu" — de proposito, porque costuma ser a CAUSA de ter sumido. E o unico caso em que o problema não e a pessoa: ela pode se esforcar o mes inteiro e continuar falhando, porque a conta não fecha. Acionabilidade maxima: baixar a repeticao resolve na hora.',
  },
  ausente: {
    importance: 4, urgency: 5, novelty: 3, actionability: 3,
    cooldownDays: 1, // Um dia: se ela voltou a sumir amanha, isso e um fato novo.
    why: 'Quem sumiu pode não voltar. E a unica situacao em que o silencio do app decide o desfecho, entao urgencia maxima.',
  },
  arena_retomada: {
    importance: 4, urgency: 2, novelty: 5, actionability: 2,
    cooldownDays: 2, // Dois dias: retomada e um momento, nao um estado. Repetir transforma reconhecimento em bajulacao.
    why: 'Novidade maxima: e a unica coisa que a pessoa NÃO ve na tela, porque a tela mostra o estado e não a mudanca. Vence a queixa sobre a mesma arena de proposito — dizer "reduza a meta" no dia em que ela voltou a andar e o pior erro que o Oráculo pode cometer.',
  },
  sem_ciclo: {
    importance: 4, urgency: 3, novelty: 2, actionability: 5,
    cooldownDays: 2, // Dois dias: com um, quem esta sem ciclo ouvia sobre ciclo dia sim dia nao — e a solucao proposta e sempre a mesma, entao repetir nao acrescenta.
    why: 'Sem ciclo nada mais funciona, e resolver e um toque. Acionabilidade maxima, urgencia média porque não piora sozinho.',
  },
  ciclo_longo: {
    importance: 3, urgency: 2, novelty: 2, actionability: 4,
    cooldownDays: 3, // Tres dias: ciclo arrastado leva dias para mudar, entao nao ha o que dizer de novo antes disso.
    why: 'Ciclo arrastado e problema estrutural: importa, mas não muda nada dizer hoje em vez de amanha.',
  },
  sem_entrega: {
    importance: 4, urgency: 4, novelty: 2, actionability: 3,
    cooldownDays: 1, // Um dia: cada dia a mais sem entrega e um fato diferente do dia anterior.
    why: 'Tres dias sem entregar e o comeco do padrao que vira abandono. Ainda da para interromper.',
  },
  arena_atrasada: {
    importance: 3, urgency: 2, novelty: 1, actionability: 3,
    cooldownDays: 2, // Dois dias, o maior entre as queixas de arena: e a fala mais repetivel do banco e a que mais rapido vira papel de parede.
    why: 'Atraso de arena e comum e a pessoa ja ve na tela. Novidade baixa de proposito: anunciar o obvio gasta a fala do dia.',
  },
  arena_parada: {
    importance: 4, urgency: 3, novelty: 2, actionability: 4,
    cooldownDays: 2, // Dois dias: sete dias parada nao vira nada em vinte e quatro horas.
    why: 'Sete dias e zero conclusao e mais grave que atraso: a arena parou de existir na pratica, e ainda da para reanimar.',
  },
  ciclo_atrasado: {
    importance: 3, urgency: 3, novelty: 1, actionability: 2,
    cooldownDays: 2, // Dois dias: e agregado e pouco acionavel, entao repetir so acumula peso sem indicar saida.
    why: 'E um agregado — diz que algo esta errado sem dizer onde. Pouco acionavel, e por isso perde para o que aponta a arena.',
  },
  prioridade: {
    importance: 2, urgency: 3, novelty: 1, actionability: 5,
    cooldownDays: 1, // Um dia: a acao prioritaria muda de um dia para o outro, entao amanha costuma ser outra frase.
    why: 'Sozinha não e grande coisa, mas e a unica que entrega o próximo movimento pronto. E o eixo de acionabilidade que a carrega.',
  },
  ja_entregou: {
    importance: 2, urgency: 1, novelty: 2, actionability: 0,
    cooldownDays: 0, // Zero: elogiar o que ela fez hoje e sobre HOJE. So nao pode sair duas vezes no mesmo dia.
    why: 'Elogio de rotina. Nota baixa de proposito: elogio inflacionado destroi o valor do elogio de marco.',
  },
  estrutura_enxuta: {
    importance: 2, urgency: 1, novelty: 3, actionability: 3,
    cooldownDays: 3, // Tres dias: estrutura pequena nao e defeito e nao tem pressa nenhuma.
    why: 'Quase nunca dispara, entao quando dispara e informacao nova. Nenhuma pressa: estrutura pequena não e defeito.',
  },
};

/**
 * A urgencia pesa mais que os outros eixos porque e o unico que expira. O que e
 * importante hoje continua importante amanha; o que e urgente, nao.
 */
const EIXO_PESO = {
  importance: 1,
  urgency: 1.5,
  novelty: 1.2,
  actionability: 0.8,
} as const;

/**
 * Teto do ajuste por gravidade.
 *
 * O boost ordena arenas DENTRO do mesmo tipo — entre tres arenas atrasadas, a
 * pior fala primeiro. Se crescesse sem limite, uma arena muito atrasada passaria
 * na frente de "alguem sumiu ha uma semana" e a tabela de pesos deixaria de
 * significar qualquer coisa. Dois pontos e menos que a distancia entre dois
 * tipos vizinhos, entao ele desempata sem promover.
 */
export const SEVERITY_BOOST_CAP = 2;

export type OracleArenaTrend = 'piorando' | 'estavel' | 'melhorando' | 'retomando';

export interface PlannerCoachArena {
  arenaId: string;
  arenaName: string;
  pace: OracleCoachArenaPace;
  adjustment: string | null;
  progressDelta: number | null;
  daysSinceProof: number | null;
  pendingActionsToday: number;
  /** Direcao, separada de `pace`. Ausente = contexto antigo, sem passado. */
  trend?: OracleArenaTrend;
  /** Dias parada antes de voltar. So existe quando trend e 'retomando'. */
  trendPauseDays?: number | null;
}

/** O que os detectores precisam ver. `PlannerCoachContext` estende isto. */
export interface OracleCandidateInput {
  arenasCount: number;
  actionsCount: number;
  cycleLengthDays: number | null;
  cycleProgress: number;
  daysSinceLastPlannerOpen: number | null;
  daysSinceLastProof: number | null;
  hasActiveCycle: boolean;
  cyclePace: OracleCoachPace;
  priorityActionName: string | null;
  completedActionNameToday: string | null;
  /** Demanda diaria montada e o melhor dia ja entregue. Ausentes = sem historico para julgar. */
  plannedDailyDemand?: number | null;
  bestDailyCompletions?: number | null;
  daysWithCompletions?: number;
  cycleDayNumber?: number | null;
  /** Sequencia atual e hora local. Sem os dois nao da para saber que ela esta em risco. */
  dailyProofStreakCurrent?: number;
  hourOfDay?: number | null;
  /** TODAS as arenas ranqueadas, nao so a primeira. Ausente = comportamento antigo. */
  arenas?: PlannerCoachArena[];
}

export interface OracleCandidate {
  type: OracleCandidateType;
  arenaId?: string;
  arenaName?: string;
  vars: Record<string, string | number | null>;
  importance: number;
  urgency: number;
  novelty: number;
  actionability: number;
  /** Ajuste por gravidade do caso concreto, limitado a SEVERITY_BOOST_CAP. */
  boost: number;
  score: number;
}

export const scoreOracleCandidate = (
  weight: OracleCandidateWeight,
  boost: number = 0,
): number => (
  weight.importance * EIXO_PESO.importance +
  weight.urgency * EIXO_PESO.urgency +
  weight.novelty * EIXO_PESO.novelty +
  weight.actionability * EIXO_PESO.actionability +
  Math.min(SEVERITY_BOOST_CAP, Math.max(0, boost))
);

const build = (
  type: OracleCandidateType,
  vars: Record<string, string | number | null> = {},
  extra: { arenaId?: string; arenaName?: string; boost?: number } = {},
): OracleCandidate => {
  const weight = ORACLE_CANDIDATE_WEIGHTS[type];
  const boost = Math.min(SEVERITY_BOOST_CAP, Math.max(0, extra.boost || 0));
  return {
    type,
    arenaId: extra.arenaId,
    arenaName: extra.arenaName,
    vars,
    importance: weight.importance,
    urgency: weight.urgency,
    novelty: weight.novelty,
    actionability: weight.actionability,
    boost,
    score: scoreOracleCandidate(weight, boost),
  };
};

/**
 * Gravidade da arena, normalizada em [0, SEVERITY_BOOST_CAP].
 *
 * Usa o atraso em pontos percentuais e os dias sem conclusao. Nao decide QUEM
 * fala — decide qual arena representa o tipo quando varias se qualificam.
 */
const arenaBoost = (arena: PlannerCoachArena): number => {
  const atraso = Math.max(0, -(arena.progressDelta ?? 0)) / 50;
  const parada = Math.min(1, Math.max(0, arena.daysSinceProof ?? 0) / 14);
  return Math.min(SEVERITY_BOOST_CAP, (atraso + parada) * (SEVERITY_BOOST_CAP / 2));
};

// --- os detectores ----------------------------------------------------------
// Cada um olha uma coisa e nao sabe da existencia dos outros. Nenhum retorna
// cedo, nenhum cala ninguem: e essa independencia que substitui a cascata.

const detectAbsence = (input: OracleCandidateInput): OracleCandidate[] => (
  input.daysSinceLastPlannerOpen !== null && input.daysSinceLastPlannerOpen >= 3
    ? [build('ausente', { dias: input.daysSinceLastPlannerOpen })]
    : []
);

const detectCycleIssues = (input: OracleCandidateInput): OracleCandidate[] => {
  const saida: OracleCandidate[] = [];
  if (!input.hasActiveCycle && input.arenasCount > 0) {
    // A acao prioritaria vai junto: sem ciclo, a saida util costuma ser executar
    // e nao configurar, e para dizer isso e preciso ter o que apontar.
    saida.push(build('sem_ciclo', { acao: input.priorityActionName }));
  }
  if (input.cycleLengthDays && input.cycleLengthDays > 7 && input.cycleProgress < 35) {
    saida.push(build('ciclo_longo', {
      dias: input.cycleLengthDays,
      progresso: Math.round(input.cycleProgress),
    }));
  }
  if (input.cyclePace === 'atrasado' || input.cyclePace === 'critico') {
    saida.push(build('ciclo_atrasado'));
  }
  return saida;
};

const detectDeliveryGap = (input: OracleCandidateInput): OracleCandidate[] => (
  input.daysSinceLastProof !== null && input.daysSinceLastProof >= 3
    ? [build('sem_entrega', { dias: input.daysSinceLastProof })]
    : []
);

/**
 * Uma passada por TODAS as arenas. Era aqui que cinco de seis morriam.
 *
 * Uma arena so pode representar um tipo: `arena_parada` e o caso grave e
 * absorve `arena_atrasada`, senao a mesma arena competiria consigo mesma e
 * ocuparia duas vagas da lista.
 */
const detectArenaIssues = (input: OracleCandidateInput): OracleCandidate[] => {
  const arenas = input.arenas || [];
  const saida: OracleCandidate[] = [];

  for (const arena of arenas) {
    const extra = { arenaId: arena.arenaId, arenaName: arena.arenaName, boost: arenaBoost(arena) };

    // A retomada SUBSTITUI a queixa sobre a mesma arena, nao concorre com ela.
    //
    // Uma arena pode estar em 22% quando deveria estar em 60% — `critico` — e ao
    // mesmo tempo ter voltado a andar hoje depois de oito dias. Os dois fatos sao
    // verdade, mas so um merece a fala: "reduza a meta" no dia em que a pessoa
    // fez a coisa certa e o pior erro possivel. A frase da retomada ja diz que
    // ela ainda esta atras.
    if (arena.trend === 'retomando') {
      saida.push(build('arena_retomada', {
        arena: arena.arenaName,
        dias: arena.trendPauseDays ?? null,
      }, extra));
      continue;
    }

    if (arena.adjustment === 'pausar_arena') {
      saida.push(build('arena_parada', { arena: arena.arenaName }, extra));
      continue;
    }
    if (arena.pace === 'atrasado' || arena.pace === 'critico') {
      saida.push(build('arena_atrasada', { arena: arena.arenaName }, extra));
    }
  }

  return saida;
};

/**
 * A estrutura pede mais do que a pessoa jamais entregou.
 *
 * `reduzir_meta` ja existia no contexto, mas dispara em `pace atrasado` — que
 * acontece tanto para quem pos 2 acoes por dia e nao fez, quanto para quem pos
 * 40 e e impossivel. So o segundo e evidencia de estrutura errada. No primeiro
 * a pessoa apenas nao executou, e mandar ela cortar a meta e o app se rendendo
 * por ela.
 *
 * Os quatro portoes sao conservadores de proposito. Falso positivo aqui manda
 * alguem capaz baixar o proprio padrao, o que e pior do que ficar calado:
 *
 *   - cinco dias de ciclo, senao nao ha o que julgar;
 *   - tres dias com alguma entrega, para separar "impossivel" de "nem tentou";
 *   - oito acoes por dia no minimo, um piso absoluto — abaixo disso nenhuma
 *     estrutura e impossivel, so mal executada;
 *   - demanda maior que o DOBRO do melhor dia que ela ja teve. O melhor dia e
 *     generoso: se nem ele chega perto do que o plano pede todo dia, a conta nao
 *     fecha, e a culpa e do numero.
 */
const DEMANDA_MINIMA_PARA_SUSPEITA = 8;

// Tipos antigos permanecem para ler historico; nao ha detectores de sequencia global.

const detectStructuralIssues = (input: OracleCandidateInput): OracleCandidate[] => {
  const demanda = input.plannedDailyDemand ?? null;
  const melhorDia = input.bestDailyCompletions ?? null;
  const diasComEntrega = input.daysWithCompletions ?? 0;
  const diaDoCiclo = input.cycleDayNumber ?? 0;

  if (demanda === null || melhorDia === null) return [];
  if (diaDoCiclo < 5) return [];
  if (diasComEntrega < 3) return [];
  if (demanda < DEMANDA_MINIMA_PARA_SUSPEITA) return [];
  if (demanda <= melhorDia * 2) return [];

  return [build('meta_inflada', {
    acoes: Math.round(demanda),
    maximo: melhorDia,
  })];
};

const detectStructure = (input: OracleCandidateInput): OracleCandidate[] => (
  input.arenasCount === 1 && input.actionsCount <= 3 ? [build('estrutura_enxuta')] : []
);

const detectNextMove = (input: OracleCandidateInput): OracleCandidate[] => (
  input.priorityActionName ? [build('prioridade', { acao: input.priorityActionName })] : []
);

const detectAchievements = (input: OracleCandidateInput): OracleCandidate[] => (
  input.completedActionNameToday
    ? [build('ja_entregou', { acao: input.completedActionNameToday })]
    : []
);

export const detectOracleCandidates = (input: OracleCandidateInput): OracleCandidate[] => [
  ...detectAbsence(input),
  ...detectCycleIssues(input),
  ...detectDeliveryGap(input),
  ...detectArenaIssues(input),
  // Sequência global aposentada: nenhum candidato, mesmo para perfis legados.
  ...detectStructuralIssues(input),
  ...detectStructure(input),
  ...detectNextMove(input),
  ...detectAchievements(input),
];

/**
 * O corte por presenca.
 *
 * Silencioso e Infinity e nao um numero alto de proposito: e o pacto, nao uma
 * regua severa. Nenhum acontecimento, por maior que seja, fura por acidente.
 * Aviso de risco e outra coisa e vai por outro interruptor.
 *
 * O Equilibrado exige mais que o Presente — e a diferenca entre "celebra o que e
 * grande" e "acompanha o seu dia de perto". O 10 e calibrado para deixar passar
 * ausencia, ciclo faltando e arena parada, e barrar elogio de rotina.
 */
export const getOracleRelevanceThreshold = (presenceValue: number): number => {
  if (!Number.isFinite(presenceValue) || presenceValue <= 0) return Infinity;
  return presenceValue >= 3 ? 5 : 10;
};

/**
 * Lista ranqueada, NAO vencedor.
 *
 * Quem consome anda na lista ate achar quem consegue falar. Devolver so o
 * primeiro faria um candidato barrado adiante — cooldown, frase invalida por
 * variavel faltando — virar silencio indevido, em vez de passar a vez.
 */
export const rankOracleCandidates = (
  input: OracleCandidateInput,
  presenceValue: number,
): OracleCandidate[] => {
  const limiar = getOracleRelevanceThreshold(presenceValue);
  if (!Number.isFinite(limiar)) return [];

  return detectOracleCandidates(input)
    .filter((candidato) => candidato.score >= limiar)
    .sort((esquerda, direita) => direita.score - esquerda.score);
};
