// Contextual Oracle lines, written rather than generated.
//
// The three contextual categories (Sinal de foco, Sinal de alerta, Leitura de ritmo)
// used to be produced by a model on every delivery, which put the cost on signups and
// made the whole feature fail whenever the model was unreachable. They speak about the
// player's own numbers, so a template filled from context is both cheaper and more
// accurate: it cannot invent a streak or name an arena that does not exist.
//
// Keyed by OracleHostOperationalState, which the function already derives. One voice —
// the tone modes were removed.

import type { OracleHostOperationalState } from "./oracle-host-voice.ts";

export interface OracleLineContext {
  username?: string | null;
  priorityArenaName?: string | null;
  priorityActionName?: string | null;
  pendingActionsToday?: number | null;
  overdueActions?: number | null;
  dailyProofStreakCurrent?: number | null;
  dailyProofStreakBest?: number | null;
  totalArenas?: number | null;
  cycleCompletionPercent?: number | null;
  pendingChests?: number | null;
  timeOfDay?: string | null;
}

/**
 * Lines may reference {arena}, {acao}, {pendentes}, {streak}, {recorde} and {nome}.
 * A line is only offered when every slot it uses has a value, so nothing ever renders
 * as "a arena null" — that check is what keeps the bank honest as it grows.
 */
const STATE_LINES: Record<OracleHostOperationalState, string[]> = {
  sem_direcao: [
    "Voce ainda nao tem uma arena. Escolhe uma area e cria a primeira: e o que faz o resto do app comecar a existir.",
    "Nada definido ainda. Uma arena so, com uma acao pequena, ja te da o que registrar hoje.",
    "Sem direcao definida. Comeca pelo que voce faria de qualquer jeito hoje e transforma em arena.",
  ],
  disperso: [
    "Voce tem {pendentes} pendencias hoje espalhadas. Escolhe uma e fecha antes de abrir outra frente.",
    "Muita coisa aberta ao mesmo tempo. Fechar uma pequena vale mais que adiantar tres pela metade.",
    "O dia esta espalhado. {arena} e a que mais precisa de voce agora.",
  ],
  atrasado: [
    "Voce tem {overdue} acoes vencidas. Nao precisa recuperar tudo: pega a mais antiga e resolve.",
    "O atraso acumulou. Fechar uma vencida hoje ja muda o numero de amanha.",
    "{arena} ficou pra tras. Uma passada curta ali corta o acumulo.",
  ],
  em_ritmo: [
    "Ritmo firme. Nao aumenta o escopo agora, so mantem o que ja esta funcionando.",
    "Voce esta em dia. O melhor movimento hoje e nao inventar nada novo.",
    "Consistencia e isso: {arena} andando sem precisar de esforco extra.",
  ],
  em_risco: [
    "O ciclo esta em risco. Corta o que da pra cortar e protege {arena}.",
    "Nao da pra salvar tudo neste ciclo. Escolhe o que importa e deixa o resto ir.",
    "O ciclo aperta. Um ajuste honesto de meta agora vale mais que forcar o numero.",
  ],
  retomando: [
    "Voce voltou. Nao tenta compensar os dias parados: faz uma acao pequena e fecha o dia.",
    "Retomar conta. Comeca por {acao}, que e curta.",
    "Depois de uma pausa, o objetivo e voltar a registrar, nao recuperar o atraso.",
  ],
  proximo_compromisso: [
    "{acao} esta perto. Deixa o que precisa separado antes de comecar.",
    "Tem compromisso chegando em {arena}. Cinco minutos de preparo evitam meia hora de atrito.",
    "O proximo bloco ja esta marcado. Vale deixar o caminho livre agora.",
  ],
  pronto_para_fechar: [
    "O dia esta pronto pra fechar. Faz o julgamento e leva a EXP.",
    "Tudo que dava pra hoje ja foi feito. Fecha o dia e deixa registrado.",
    "Restam {pendentes} pendencias, e nenhuma precisa ser hoje. Pode fechar.",
  ],
  arena_esquecida: [
    "{arena} esta parada ha um tempo. Ou volta com algo pequeno, ou tira do ciclo sem culpa.",
    "Tem arena sem movimento. Deixar parada e uma escolha valida, desde que seja escolha.",
    "{arena} nao recebe atencao ha dias. Vale decidir se ela continua no ciclo.",
  ],
  escopo_pesado: [
    "O escopo esta maior do que o ciclo aguenta. Reduzir meta agora nao tira EXP ja conquistada.",
    "Voce planejou mais do que cabe. Ajustar e mais honesto que arrastar.",
    "Tem {pendentes} pendencias so hoje. Isso e sinal de escopo, nao de falta de esforco.",
  ],
  oportunidade_util: [
    "Da pra encaixar {acao} agora sem atrapalhar o resto do dia.",
    "Voce tem uma janela util. {arena} e onde ela rende mais.",
    "Momento bom pra uma acao curta. Nao precisa ser a mais dificil.",
  ],
  streak_mantida: [
    "{streak} dias seguidos de prova. Mantem o tamanho da acao, nao aumenta.",
    "Sequencia de {streak} dias viva. O que sustenta isso e o tamanho pequeno.",
    "Voce esta em {streak} dias, com recorde de {recorde}. Hoje basta nao quebrar.",
  ],
  streak_quebrada: [
    "A sequencia quebrou. Recomecar hoje custa uma acao; adiar custa a semana.",
    "Perdeu a sequencia, nao o progresso. O que ja foi registrado continua seu.",
    "Seu recorde e {recorde} dias. Ele continua la, esperando a proxima tentativa.",
  ],
  primeira_acao_do_dia: [
    "Primeira do dia. {acao} e um bom ponto de partida.",
    "O dia ainda nao tem registro. Uma acao pequena ja abre o placar.",
    "Comeca por {arena}: e a que sustenta o resto do dia.",
  ],
};

const SLOT_PATTERN = /\{(arena|acao|pendentes|overdue|streak|recorde|nome)\}/g;

const resolveSlot = (slot: string, context: OracleLineContext): string | null => {
  const positive = (value: number | null | undefined) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? String(Math.round(value)) : null;

  switch (slot) {
    case "arena": return context.priorityArenaName?.trim() || null;
    case "acao": return context.priorityActionName?.trim() || null;
    case "pendentes": return positive(context.pendingActionsToday);
    case "overdue": return positive(context.overdueActions);
    case "streak": return positive(context.dailyProofStreakCurrent);
    case "recorde": return positive(context.dailyProofStreakBest);
    case "nome": return context.username?.trim() || null;
    default: return null;
  }
};

const renderLine = (template: string, context: OracleLineContext): string | null => {
  let missing = false;
  const rendered = template.replace(SLOT_PATTERN, (_match, slot: string) => {
    const value = resolveSlot(slot, context);
    if (value === null) {
      missing = true;
      return "";
    }
    return value;
  });
  return missing ? null : rendered;
};

/**
 * Picks a line for the current state, skipping any whose slots cannot be filled and
 * any the player has seen recently. Returns null only when the state has no usable
 * line at all, which lets the caller stay silent rather than say something empty.
 */
export const buildContextualOracleLine = ({
  state,
  context,
  recentLines = [],
}: {
  state: OracleHostOperationalState;
  context: OracleLineContext;
  recentLines?: string[];
}): string | null => {
  const templates = STATE_LINES[state] || [];
  const usable = templates
    .map((template) => renderLine(template, context))
    .filter((line): line is string => Boolean(line));

  if (usable.length === 0) return null;

  const seen = new Set(recentLines.map((line) => line.trim()));
  const fresh = usable.filter((line) => !seen.has(line.trim()));
  const pool = fresh.length > 0 ? fresh : usable;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const ORACLE_LINE_STATES = Object.keys(STATE_LINES) as OracleHostOperationalState[];
