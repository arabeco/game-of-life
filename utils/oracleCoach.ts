import type { OracleSpeechTone } from '../constants/oracleSpeechLibrary';
import type { OracleContext } from '../types';
import type { OracleCandidateInput } from './oracleCandidates.ts';
import { rankOracleCandidates } from './oracleCandidates.ts';

// Os tipos de ritmo moram no arbitro agora, junto de quem os le. Reexportados
// para quem ja importava daqui.
export type { OracleCoachPace, OracleCoachArenaPace, PlannerCoachArena } from './oracleCandidates.ts';

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

/**
 * Os tres campos `focusArena*` sairam daqui.
 *
 * Eles eram a unica janela para a camada de arena, e mostravam UMA — a primeira
 * de um ranking por gravidade, com as outras cinco ja descartadas. No lugar
 * deles entra `arenas`, com todas, e quem escolhe passa a ser o arbitro.
 */
export type PlannerCoachContext = OracleCandidateInput;

// getOracleCoachDailyLimit saiu daqui.
//
// Ela dizia quantas falas por dia cada nivel de presenca recebe — a mesma
// pergunta que ORACLE_PRESENCE_RULES.openingLine responde, num arquivo que nao
// conhecia o outro. Duas regras sobre o mesmo assunto e como o app acabava
// dizendo uma coisa na tabela e fazendo outra na tela.

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

/**
 * A fala de abertura, agora por TOM.
 *
 * Ela era a fala mais vista do app — dispara toda vez que se abre, no nivel
 * Presente — e tinha o menor estoque de todos: 20 frases, duas por situacao, sem
 * variacao nenhuma de tom. As reacoes ja falavam em quatro vozes; a abertura,
 * que aparece muito mais, falava numa so.
 *
 * O tom nao e enfeite: e o que o Premium compra. Ter reacao com tom e abertura
 * sem tom fazia o Oraculo mudar de personalidade dependendo do que ele estava
 * dizendo.
 *
 * As quatro vozes, e o que separa uma da outra:
 *   neutro    — constata. Nao sugere, nao pergunta, nao consola.
 *   coach     — entrega o proximo passo, concreto e pequeno.
 *   reflexivo — devolve a pergunta em vez da resposta.
 *   calmo     — tira o peso antes de qualquer coisa.
 *
 * Custo de rede: zero. Sao textos escritos, escolhidos no aparelho, com os
 * numeros da propria pessoa preenchidos nos marcadores.
 */

type CoachToneLines = Record<OracleSpeechTone, readonly string[]>;

const COACH_LINES: Record<string, CoachToneLines> = {
  /** Sumiu por tres dias ou mais. Marcadores: {dias} */
  ausente: {
    neutro: [
      'Voce nao abre o Planner ha {dias} dias. As acoes continuam onde estavam.',
      '{dias} dias sem passar por aqui. Nada foi perdido, so parou.',
    ],
    coach: [
      'Faz {dias} dias. Comece por uma acao pequena hoje, e ajuste o resto depois.',
      '{dias} dias parado. Escolha uma so para hoje: recomecar pesa menos que compensar.',
    ],
    reflexivo: [
      'Faz {dias} dias. O que mudou na sua vida nesse intervalo?',
      '{dias} dias longe daqui. Foi falta de tempo, ou o plano deixou de servir?',
    ],
    calmo: [
      'Faz {dias} dias, e tudo bem. O painel espera, nao cobra.',
      '{dias} dias sem aparecer. Nao precisa recuperar nada. Comeca de onde da.',
    ],
  },

  /**
   * Uma arena voltou a andar depois de uma pausa de verdade.
   *
   * Este e o unico estado que descreve uma MUDANCA e nao um lugar, e por isso e
   * o unico que a pessoa nao consegue ler na tela: a tela mostra 22%, nao mostra
   * que ontem eram 22% ha oito dias.
   *
   * Toda voz tem uma linha com {dias} e uma sem. Nao e enfeite: fillCoachLine
   * invalida a linha quando falta variavel, entao a sem numero e a garantia de
   * que sempre sobra alguma coisa para dizer.
   *
   * E nenhuma delas finge que a arena esta em dia — dizer "voltou a andar" e
   * "ainda esta atras" na mesma frase e o que separa reconhecer de bajular.
   */
  arena_retomada: {
    neutro: [
      'Depois de {dias} dias parada, {arena} voltou a andar. Ainda esta atras, mas mudou de direcao.',
      '{arena} voltou a andar. Continua atras do planejado, e agora esta em movimento.',
    ],
    coach: [
      '{arena} ficou {dias} dias parada e voltou hoje. Repete amanha e vira ritmo.',
      '{arena} saiu do lugar. O proximo dia e o que decide se foi um dia ou uma retomada.',
    ],
    reflexivo: [
      '{dias} dias parada, e hoje {arena} andou. O que mudou hoje que nao existia ontem?',
      '{arena} voltou depois de um tempo parada. Da para repetir o que fez isso acontecer?',
    ],
    calmo: [
      '{arena} voltou depois de {dias} dias. Nao precisa recuperar tudo — precisa continuar.',
      '{arena} andou de novo. O tempo parado nao volta, e tambem nao precisa ser pago.',
    ],
  },

  /** Tem arena, nao tem ciclo. */
  sem_ciclo: {
    neutro: [
      'Voce tem arena e nao tem ciclo aberto. O ciclo e o que da comeco e fim ao periodo.',
      'Sem ciclo, as acoes existem mas nao tem prazo nem fecho.',
    ],
    coach: [
      'Abra um ciclo de sete dias ou menos. Curto e mais facil de terminar do que longo.',
      'Proximo passo: monte um ciclo pequeno. Uma semana ja da ritmo sem virar divida.',
    ],
    reflexivo: [
      'Voce tem arena, mas nao marcou um periodo. Quanto tempo voce quer se dar?',
      'O que voce quer conseguir enxergar quando esse periodo fechar?',
    ],
    calmo: [
      'Ja tem arena, que era a parte dificil. O ciclo pode ser curto e sem ambicao.',
      'Nao precisa de um plano grande. Uma semana ja e um ciclo.',
    ],
  },

  /** Ciclo longo com pouco progresso. Marcadores: {dias}, {progresso} */
  ciclo_longo: {
    neutro: [
      'Ciclo de {dias} dias, {progresso}% andado.',
      '{progresso}% em um ciclo de {dias} dias. O prazo esta maior que o ritmo.',
    ],
    coach: [
      'Ciclo de {dias} dias em {progresso}%. Encurte a rodada ou tire uma frente.',
      '{progresso}% de {dias} dias. Reduzir o escopo agora custa menos que arrastar ate o fim.',
    ],
    reflexivo: [
      'Ciclo de {dias} dias em {progresso}%. O ciclo esta grande, ou a semana ficou cheia?',
      '{progresso}% andado. O que voce planejou ainda e o que voce quer?',
    ],
    calmo: [
      'Ciclo longo anda devagar mesmo. {progresso}% nao e atraso, e o tamanho da rodada.',
      'Sao {dias} dias. Nao ha pressa embutida nisso.',
    ],
  },

  /** Sem conclusao ha tres dias ou mais. Marcadores: {dias} */
  sem_entrega: {
    neutro: [
      'Ultima conclusao ha {dias} dias.',
      '{dias} dias sem fechar nada. A sequencia parou.',
    ],
    coach: [
      'Faz {dias} dias. Fecha a menor que estiver aberta hoje.',
      '{dias} dias sem entrega. Escolhe a mais barata e conclui: o resto volta sozinho.',
    ],
    reflexivo: [
      '{dias} dias sem concluir. O que esta no caminho?',
      'Faz {dias} dias. As acoes ainda cabem no seu dia como estao?',
    ],
    calmo: [
      '{dias} dias sem entrega, e isso acontece. Uma pequena hoje ja recoloca.',
      'A sequencia esfriou. Nao precisa voltar inteiro de uma vez.',
    ],
  },

  /** Arena de foco atrasada. Marcadores: {arena} */
  /**
   * A estrutura pede mais do que a pessoa jamais entregou.
   *
   * E o unico estado em que o Oraculo diz que o problema NAO e ela. Por isso
   * nenhuma linha cobra, nenhuma pede esforco, e nenhuma sugere abandonar: todas
   * apontam o numero. Nao culpar alguem por um erro estrutural e a diferenca de
   * produto inteira aqui.
   *
   * Marcadores: {acoes} — o que o plano pede por dia. {maximo} — o melhor dia
   * que ela ja teve.
   */
  meta_inflada: {
    neutro: [
      'Sua estrutura pede {acoes} acoes por dia. Seu melhor dia ate agora teve {maximo}.',
      'O plano pede {acoes} por dia. Isso nao e falta de esforco, e conta que nao fecha.',
    ],
    coach: [
      '{acoes} acoes por dia e o que esta montado. Corte pela metade e voce passa a fechar o dia.',
      'Seu melhor dia teve {maximo}. Ajuste as repeticoes para perto disso e o resto se resolve.',
    ],
    reflexivo: [
      'O plano pede {acoes} por dia. Voce montou para quem voce e, ou para quem queria ser?',
      'Seu melhor dia foi {maximo} e a meta pede {acoes}. Qual dos dois numeros e o real?',
    ],
    calmo: [
      'Sao {acoes} acoes por dia ai. Nao e voce que esta devendo — e o numero.',
      'O dia que voce montou e maior que o dia que existe. Da para baixar agora, sem perder nada.',
    ],
  },

  /**
   * Arena atras do ritmo. Este e o caso de EXECUCAO, nao de estrutura.
   *
   * Tres destas linhas mandavam cortar a meta — "reveja a meta", "diminua a
   * repeticao", "talvez a meta e que estava grande". Mas estar atras nao e
   * evidencia de meta errada: se voce pos 2 acoes por dia e passou a semana no
   * videogame, nao ha nada de errado com o numero, voce so nao fez. Sugerir
   * corte ali e o app se rendendo por voce.
   *
   * Quem manda cortar e `meta_inflada`, e so quando ha evidencia de verdade —
   * a demanda passa do dobro do melhor dia que a pessoa ja teve. Aqui a fala
   * volta para o que cabe: uma acao, hoje.
   */
  arena_atrasada: {
    neutro: [
      '{arena} esta atras do ritmo do ciclo.',
      'Pelo tempo e pelo progresso, {arena} e a que mais ficou para tras.',
    ],
    coach: [
      'Abra {arena} e feche uma acao dela hoje. A menor que tiver, nao a mais dificil.',
      '{arena} nao andou esta semana. Uma acao hoje ja muda o numero de amanha.',
    ],
    reflexivo: [
      '{arena} ficou para tras. Ela ainda importa como importava quando voce criou?',
      'O que {arena} pedia de voce que a semana nao deu?',
    ],
    calmo: [
      '{arena} esta devagar, e devagar ainda e andar. Uma acao hoje basta.',
      'Nem toda arena anda no mesmo passo. {arena} pode esperar sem culpa.',
    ],
  },

  /** Arena parada, candidata a pausa. Marcadores: {arena} */
  arena_parada: {
    neutro: [
      '{arena} esta sem movimento ha alguns dias.',
      'Nenhuma acao de {arena} foi registrada recentemente.',
    ],
    coach: [
      '{arena} parou. Decide agora: uma acao pequena hoje, ou pausa a arena.',
      'Retomar {arena} com o menor item, ou pausar. As duas resolvem; deixar aberta nao.',
    ],
    reflexivo: [
      '{arena} esfriou. Isso e uma fase, ou ela deixou de fazer sentido?',
      'O que aconteceria se voce pausasse {arena} por um tempo?',
    ],
    calmo: [
      '{arena} parou, e pausar tambem e uma escolha legitima.',
      'Nao precisa manter {arena} viva so porque ela existe.',
    ],
  },

  /** Ciclo inteiro atrasado. */
  ciclo_atrasado: {
    neutro: [
      'O ciclo esta atras do ritmo pelo tempo restante.',
      'O progresso do ciclo ficou abaixo do que o prazo pedia.',
    ],
    coach: [
      'Antes de compensar, tire uma meta. Fechar menos inteiro vale mais que muito pela metade.',
      'O ciclo apertou. Reduz o escopo hoje e protege o que sobrar.',
    ],
    reflexivo: [
      'O ciclo esta atrasado. O que voce planejou era para esta semana ou para uma semana ideal?',
      'O que dentro do ciclo voce ja sabe que nao vai acontecer?',
    ],
    calmo: [
      'O ciclo esta atras, e isso nao apaga o que ja foi feito.',
      'Ciclo atrasado nao e ciclo perdido. Ainda da para fechar com o que cabe.',
    ],
  },

  /** Ha uma acao prioritaria clara. Marcadores: {acao} */
  prioridade: {
    neutro: [
      '{acao} e a proxima da fila hoje.',
      'Hoje tem {acao} em aberto.',
    ],
    coach: [
      'Faz {acao} hoje. Uma real ja mantem o ciclo andando.',
      '{acao} primeiro. Depois dela o resto do dia decide sozinho.',
    ],
    reflexivo: [
      '{acao} cabe hoje de verdade, ou entrou na lista por inercia?',
      'Se so {acao} acontecesse hoje, o dia teria valido?',
    ],
    calmo: [
      '{acao} esta ali quando der. Nao precisa ser agora.',
      'Se {acao} nao couber hoje, ajustar a meta e melhor que carregar peso.',
    ],
  },

  /** Ja concluiu algo hoje. Marcadores: {acao} */
  ja_entregou: {
    neutro: [
      'Voce concluiu {acao} hoje.',
      '{acao} ja saiu hoje.',
    ],
    coach: [
      '{acao} feita. Se ainda houver energia, a proxima menor mantem o ritmo.',
      'Boa, {acao} saiu. Decide agora se para aqui ou puxa mais uma.',
    ],
    reflexivo: [
      '{acao} saiu hoje. O que fez ela acontecer, que da para repetir amanha?',
      'Voce ja entregou {acao}. O dia precisa de mais alguma coisa?',
    ],
    calmo: [
      '{acao} ja foi. Isso ja e o dia cumprido, se voce quiser que seja.',
      'Uma entrega e suficiente. Encerrar aqui e uma escolha, nao desistencia.',
    ],
  },

  /** Estrutura muito enxuta. */
  estrutura_enxuta: {
    neutro: [
      'Voce tem uma arena so, com poucas acoes.',
      'A estrutura esta enxuta: uma frente e pouca coisa dentro.',
    ],
    coach: [
      'Uma segunda arena separa melhor as areas. Corpo, trabalho e casa nao competem na mesma lista.',
      'Cria uma segunda frente quando fizer sentido. Duas pequenas equilibram mais que uma cheia.',
    ],
    reflexivo: [
      'Uma arena so. Ela cobre o que voce quer mudar, ou e por onde deu para comecar?',
      'O que esta fora do app hoje e deveria estar dentro?',
    ],
    calmo: [
      'Uma arena ja e um comeco inteiro. Nao precisa crescer agora.',
      'Enxuto funciona. Adicionar so quando incomodar ter so uma.',
    ],
  },
};

/** Preenche {arena}, {acao}, {dias}, {progresso}. Marcador sem valor invalida a linha. */
const fillCoachLine = (template: string, vars: Record<string, string | number | null>): string | null => {
  let faltou = false;
  const texto = template.replace(/\{(\w+)\}/g, (_all, chave: string) => {
    const valor = vars[chave];
    if (valor === null || valor === undefined || valor === '') { faltou = true; return ''; }
    return String(valor);
  });
  return faltou ? null : texto;
};

const pickCoachLine = (
  estado: keyof typeof COACH_LINES,
  tone: OracleSpeechTone,
  vars: Record<string, string | number | null>,
  random: () => number,
): string | null => {
  const porTom = COACH_LINES[estado];
  if (!porTom) return null;
  // Tom desconhecido cai no neutro, que e o gratuito: melhor a voz certa em
  // neutro do que a voz errada.
  const linhas = porTom[tone] || porTom.neutro;
  const validas = linhas.map((linha) => fillCoachLine(linha, vars)).filter((linha): linha is string => Boolean(linha));
  if (validas.length === 0) return null;
  return validas[Math.floor(random() * validas.length)] || validas[0];
};

/**
 * A cascata de dez `if` saiu daqui.
 *
 * Ela decidia por ordem fixa: o primeiro que casasse vencia e calava os outros
 * nove. Quem estava tres dias ausente E com uma arena critica E com uma acao
 * prioritaria ouvia sobre a ausencia, sempre, e nunca sobre o resto — e quem
 * estava em `prioridade` ouvia `prioridade` todo dia, porque a ordem nao muda.
 *
 * Agora os detectores produzem candidatos independentes e o arbitro ordena por
 * relevancia. Aqui so sobra andar na lista: o primeiro que consegue render uma
 * frase fala. Andar na lista, e nao pegar o primeiro, e o que faz um candidato
 * barrado — variavel faltando hoje, cooldown amanha — passar a vez em vez de
 * virar silencio indevido.
 *
 * A presenca entra como corte de relevancia. O padrao e 3 (Presente) para que
 * chamadas sem ela se comportem como antes: quem controla se ele fala e a
 * politica de presenca, la em cima; aqui o corte so afina.
 */
export const buildPlannerCoachSpeech = (
  context: PlannerCoachContext,
  random: () => number = Math.random,
  tone: OracleSpeechTone = 'neutro',
  presenceValue: number = 3,
): string | null => {
  for (const candidato of rankOracleCandidates(context, presenceValue)) {
    const linha = pickCoachLine(candidato.type, tone, candidato.vars, random);
    if (linha) return linha;
  }
  return null;
};

/** Quantas linhas o banco tem, por estado e por tom. Usado pelo teste. */
export const COACH_LINE_STATES = Object.keys(COACH_LINES);
export const countCoachLines = (): number =>
  Object.values(COACH_LINES).reduce(
    (soma, porTom) => soma + Object.values(porTom).reduce((s, linhas) => s + linhas.length, 0),
    0,
  );

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
