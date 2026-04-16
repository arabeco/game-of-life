export type OracleIntent =
  | "general_chat"
  | "app_question"
  | "app_action"
  | "hybrid"
  | "unsupported";

export type OracleResponseKind =
  | "chat"
  | "app_answer"
  | "action_offer"
  | "action_handoff"
  | "clarification"
  | "premium_nudge";

export type OracleActionDraftKind =
  | "create_cycle"
  | "edit_cycle_date"
  | "create_arena"
  | "update_arena"
  | "create_action"
  | "update_action"
  | "schedule_action"
  | "complete_action"
  | "organize_day"
  | "status"
  | "unknown";

export type DayOfWeek = "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";

export type OracleActionDraft = {
  kind: OracleActionDraftKind;
  confidence: "low" | "medium" | "high";
  originalText: string;
  summary: string;
  needsConfirmation: boolean;
  cycleName?: string | null;
  arenaName?: string | null;
  actionName?: string | null;
  date?: string | null;
  startTime?: number | null;
  daysOfWeek?: DayOfWeek[] | null;
  organizeMode?: "leve" | "padrao" | "intenso" | null;
  inferredFromGeneralIntent?: boolean;
};

export type OracleConversationMemory = {
  summary: string;
  currentTopic?: string | null;
  currentObjective?: string | null;
  mentionedEntities?: string[];
  lastActionOffer?: string | null;
  turnCount: number;
};

export type OraclePremiumHint = {
  reason: "depth" | "continuity" | "memory" | "voice" | "advanced_guidance";
  label: string;
  message: string;
};

export type OracleStructuredContext = {
  recognizedIntent: OracleIntent;
  confidence: "low" | "medium" | "high";
  topics: string[];
  shouldOfferAction: boolean;
  shouldUsePremiumDepth: boolean;
  needsClarification: boolean;
  appContextUsed: boolean;
  memory?: OracleConversationMemory | null;
};

const MONTH_INDEX: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

export const normalizeOracleText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const addDays = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const parseDateFromText = (text: string, today: string): string | null => {
  const normalized = normalizeOracleText(text);
  if (/\bhoje\b/.test(normalized)) return today;
  if (/\bamanha\b/.test(normalized)) return addDays(today, 1);

  const isoMatch = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  const brMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (brMatch) {
    let year = brMatch[3] || today.slice(0, 4);
    if (year.length === 2) year = `20${year}`;
    return `${year}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  }

  const monthMatch = normalized.match(/\b(\d{1,2})\s+de\s+([a-z]+)(?:\s+de\s+(20\d{2}))?\b/);
  if (monthMatch) {
    const month = MONTH_INDEX[monthMatch[2]];
    if (typeof month !== "number") return null;
    const year = monthMatch[3] || today.slice(0, 4);
    return `${year}-${String(month + 1).padStart(2, "0")}-${monthMatch[1].padStart(2, "0")}`;
  }

  return null;
};

export const parseTimeMinutes = (text: string): number | null => {
  const normalized = normalizeOracleText(text);

  const clock = normalized.match(/\b(?:as|ass)?\s*(\d{1,2})[:h](\d{2})\b/);
  if (clock) {
    const hour = Number(clock[1]);
    const minute = Number(clock[2]);
    return hour <= 23 && minute <= 59 ? (hour * 60) + minute : null;
  }

  const hourOnly = normalized.match(/\b(?:as|ass)\s*(\d{1,2})h?\b/);
  if (hourOnly) {
    const hour = Number(hourOnly[1]);
    return hour <= 23 ? hour * 60 : null;
  }

  if (/\b(de manha|demanha|manha|cedo)\b/.test(normalized)) return 9 * 60;
  if (/\btarde\b/.test(normalized)) return 14 * 60;
  if (/\b(noite|fim da tarde)\b/.test(normalized)) return 19 * 60;

  return null;
};

export const parseDaysOfWeek = (text: string): DayOfWeek[] | null => {
  const normalized = normalizeOracleText(text);
  if (/\b(todo dia|todos os dias|diario|diaria)\b/.test(normalized)) {
    return ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
  }

  const days: DayOfWeek[] = [];
  if (/\b(seg|segunda)\b/.test(normalized)) days.push("SEG");
  if (/\b(ter|terca)\b/.test(normalized)) days.push("TER");
  if (/\b(qua|quarta)\b/.test(normalized)) days.push("QUA");
  if (/\b(qui|quinta)\b/.test(normalized)) days.push("QUI");
  if (/\b(sex|sexta)\b/.test(normalized)) days.push("SEX");
  if (/\b(sab|sabado)\b/.test(normalized)) days.push("SAB");
  if (/\b(dom|domingo)\b/.test(normalized)) days.push("DOM");
  return days.length > 0 ? days : null;
};

const extractQuotedText = (text: string): string | null => {
  const match = text.match(/["'](.+?)["']/);
  return match?.[1]?.trim() || null;
};

const cleanEntity = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value
    .replace(/\b(para|pra|hoje|amanha|de manha|manha|tarde|noite|as \d.*)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || null;
};

const extractEntityTail = (text: string, keyword: "ciclo" | "arena" | "acao"): string | null => {
  const normalized = normalizeOracleText(text);
  const aliases = keyword === "acao" ? "(?:acao|ação)" : keyword;
  const match = normalized.match(new RegExp(`${aliases}\\s+(?:de\\s+|do\\s+|da\\s+|chamad[oa]\\s+)?(.+?)(?=\\s+(?:na|no|em|com|ate|para|pra|descricao|prioridade|dificuldade|seg|ter|qua|qui|sex|sab|dom|as\\b|\\d{1,2}[/:h]|$))`, "i"));
  return cleanEntity(match?.[1]);
};

const inferActionName = (text: string): string | null => {
  const quoted = extractQuotedText(text);
  if (quoted) return quoted;

  const explicit = extractEntityTail(text, "acao");
  if (explicit) return explicit;

  const normalized = normalizeOracleText(text);
  const patterns = [
    /(?:agendar|agenda|programar|programa|marcar|marca)\s+(.+?)(?=\s+(?:para|pra|amanha|hoje|de manha|manha|tarde|noite|seg|ter|qua|qui|sex|sab|dom|as\b|\d{1,2}[/:h]|$))/,
    /(?:fiz|feito|feita|realizei|terminei|completei|completar|completa|concluir|conclui)\s+(.+?)(?=\s+(?:agora|para|pra|amanha|hoje|as\b|\d{1,2}[/:h]|$))/,
    /(?:editar|edita|alterar|altera|mudar|muda|renomear|renomeia|ajustar|ajusta)\s+(.+?)(?=\s+(?:com|para|pra|na|no|descricao|dificuldade|duracao|repeticoes|$))/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return cleanEntity(match[1]);
  }

  return null;
};

const inferArenaName = (text: string): string | null => {
  const quoted = extractQuotedText(text);
  if (quoted) return quoted;
  return extractEntityTail(text, "arena");
};

const inferCycleName = (text: string): string | null => {
  const quoted = extractQuotedText(text);
  if (quoted) return quoted;
  return extractEntityTail(text, "ciclo");
};

const parseOrganizeMode = (text: string): "leve" | "padrao" | "intenso" | null => {
  const normalized = normalizeOracleText(text);
  if (/\bleve\b/.test(normalized)) return "leve";
  if (/\b(intenso|agressivo|forte)\b/.test(normalized)) return "intenso";
  if (/\b(padrao|padrão|normal)\b/.test(normalized)) return "padrao";
  return null;
};

export const parseOracleActionDraft = (text: string, today: string): OracleActionDraft => {
  const normalized = normalizeOracleText(text);
  const date = parseDateFromText(text, today);
  const startTime = parseTimeMinutes(text);
  const daysOfWeek = parseDaysOfWeek(text);
  const actionName = inferActionName(text);
  const arenaName = inferArenaName(text);
  const cycleName = inferCycleName(text);
  const organizeMode = parseOrganizeMode(text);

  let kind: OracleActionDraftKind = "unknown";

  if (/\b(organiza|organizar|reorganiza|reorganizar|arruma meu dia|planeja meu dia)\b/.test(normalized)) {
    kind = "organize_day";
  } else if (/\b(como ta|como está|status|sitrep|resumo do dia|resumo do ciclo)\b/.test(normalized)) {
    kind = "status";
  } else if (/\b(fiz|feito|feita|realizei|terminei|completei|completar|completa|concluir|conclui)\b/.test(normalized)) {
    kind = "complete_action";
  } else if (/\b(programar|programa|agendar|agenda|marcar|marca)\b/.test(normalized)) {
    kind = "schedule_action";
  } else if (/\b(criar ciclo|cria ciclo|novo ciclo|abrir ciclo|abre ciclo)\b/.test(normalized)) {
    kind = "create_cycle";
  } else if (/\b(editar ciclo|edita ciclo|ajustar ciclo|mudar fim do ciclo|muda fim do ciclo|prorroga ciclo)\b/.test(normalized)) {
    kind = "edit_cycle_date";
  } else if (/\b(criar arena|cria arena|nova arena)\b/.test(normalized)) {
    kind = "create_arena";
  } else if (/\b(editar arena|edita arena|ajustar arena|renomear arena|muda arena)\b/.test(normalized)) {
    kind = "update_arena";
  } else if (/\b(criar acao|cria acao|nova acao|criar ação|cria ação)\b/.test(normalized)) {
    kind = "create_action";
  } else if (/\b(editar acao|edita acao|ajustar acao|muda acao|renomear acao|editar ação|edita ação)\b/.test(normalized)) {
    kind = "update_action";
  }

  const confidence = kind === "unknown"
    ? "low"
    : (actionName || arenaName || cycleName || date || startTime !== null || organizeMode || daysOfWeek)
      ? "high"
      : "medium";

  const summaryMap: Record<OracleActionDraftKind, string> = {
    create_cycle: `Criar ciclo${cycleName ? `: ${cycleName}` : ""}`,
    edit_cycle_date: `Ajustar data final do ciclo${date ? ` para ${date}` : ""}`,
    create_arena: `Criar arena${arenaName ? `: ${arenaName}` : ""}`,
    update_arena: `Editar arena${arenaName ? `: ${arenaName}` : ""}`,
    create_action: `Criar ação${actionName ? `: ${actionName}` : ""}`,
    update_action: `Editar ação${actionName ? `: ${actionName}` : ""}`,
    schedule_action: `Agendar ação${actionName ? `: ${actionName}` : ""}${date ? ` em ${date}` : ""}${startTime !== null ? ` às ${String(Math.floor(startTime / 60)).padStart(2, "0")}:${String(startTime % 60).padStart(2, "0")}` : ""}`,
    complete_action: `Concluir ação${actionName ? `: ${actionName}` : ""}`,
    organize_day: "Reorganizar o dia",
    status: "Consultar status do app",
    unknown: "Sem ação operacional clara",
  };

  return {
    kind,
    confidence,
    originalText: text.trim(),
    summary: summaryMap[kind],
    needsConfirmation: kind !== "unknown",
    cycleName,
    arenaName,
    actionName,
    date,
    startTime,
    daysOfWeek,
    organizeMode,
  };
};

const APP_KEYWORDS = /\b(glyph|app|oraculo|oráculo|planner|sitrep|ciclo|arena|acao|ações|acoes|premium|clã|cla|mundo|mensagens)\b/;
const GENERAL_TOPIC_KEYWORDS = /\b(ansiedade|saude|treino|trabalho|relacionamento|vida|estudo|filme|livro|negocio|negócio|produtividade|rotina)\b/;
const PREMIUM_DEPTH_KEYWORDS = /\b(aprofund|mais fundo|detalha|detalhado|me acompanha|acompanha comigo|continuar nisso|continuidade|memoria|voz|plano completo|reflexao longa|reflexão longa)\b/;

export const routeOracleIntent = (
  text: string,
  memory?: OracleConversationMemory | null,
): OracleStructuredContext => {
  const normalized = normalizeOracleText(text);
  const actionDraft = parseOracleActionDraft(text, new Date().toISOString().slice(0, 10));
  const mentionsApp = APP_KEYWORDS.test(normalized);
  const mentionsGeneralTopic = GENERAL_TOPIC_KEYWORDS.test(normalized);
  const shouldOfferAction = actionDraft.kind !== "unknown";
  const shouldUsePremiumDepth = PREMIUM_DEPTH_KEYWORDS.test(normalized)
    || /\b(como funciona melhor|me explica melhor)\b/.test(normalized)
    || ((memory?.turnCount || 0) >= 6 && mentionsGeneralTopic);

  let recognizedIntent: OracleIntent = "general_chat";
  if (shouldOfferAction && mentionsApp) {
    recognizedIntent = "app_action";
  } else if (shouldOfferAction && mentionsGeneralTopic) {
    recognizedIntent = "hybrid";
  } else if (mentionsApp) {
    recognizedIntent = "app_question";
  } else if (mentionsGeneralTopic || normalized.length > 0) {
    recognizedIntent = "general_chat";
  } else {
    recognizedIntent = "unsupported";
  }

  const topics = [
    mentionsApp ? "app" : "",
    shouldOfferAction ? "acao" : "",
    mentionsGeneralTopic ? "geral" : "",
    shouldUsePremiumDepth ? "profundidade" : "",
  ].filter(Boolean);

  const needsClarification = shouldOfferAction && actionDraft.confidence === "low";
  const confidence = needsClarification ? "low" : shouldOfferAction || mentionsApp ? "high" : "medium";

  return {
    recognizedIntent,
    confidence,
    topics,
    shouldOfferAction,
    shouldUsePremiumDepth,
    needsClarification,
    appContextUsed: recognizedIntent === "app_action" || recognizedIntent === "app_question" || recognizedIntent === "hybrid",
    memory: memory || null,
  };
};

export const buildOraclePremiumHint = (
  structuredContext: OracleStructuredContext,
): OraclePremiumHint | null => {
  if (!structuredContext.shouldUsePremiumDepth) return null;

  return {
    reason: structuredContext.recognizedIntent === "app_action" ? "advanced_guidance" : "depth",
    label: "Premium aprofunda isso",
    message: structuredContext.recognizedIntent === "app_action"
      ? "Se você quiser acompanhamento mais profundo e contínuo nisso, o Premium deixa o Oráculo ir mais longe sem poluir a conversa."
      : "Se você quiser ir mais fundo e manter continuidade nesse tema, o Premium deixa o Oráculo sustentar melhor a conversa.",
  };
};

export const buildOracleCommandDraft = (text: string, today: string) => {
  const draft = parseOracleActionDraft(text, today);
  return {
    intent: draft.kind,
    actionName: draft.actionName || null,
    date: draft.date || null,
    startTime: draft.startTime ?? null,
    needsConfirmation: draft.needsConfirmation,
    confidence: draft.confidence,
    draft,
  };
};
