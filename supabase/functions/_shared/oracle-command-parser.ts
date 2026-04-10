export type OracleCommandIntent =
  | "schedule_action"
  | "complete_action"
  | "unschedule_action"
  | "unknown";

export type OracleCommandDraft = {
  intent: OracleCommandIntent;
  actionName: string | null;
  date: string | null;
  startTime: number | null;
  needsConfirmation: boolean;
  confidence: "low" | "medium" | "high";
};

const normalizeText = (value: string): string =>
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

const parseDateFromText = (text: string, today: string): string | null => {
  const normalized = normalizeText(text);
  if (/\bhoje\b/.test(normalized)) return today;
  if (/\bamanha\b/.test(normalized)) return addDays(today, 1);

  const brMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (!brMatch) return null;

  const day = brMatch[1].padStart(2, "0");
  const month = brMatch[2].padStart(2, "0");
  let year = brMatch[3] || today.slice(0, 4);
  if (year.length === 2) year = `20${year}`;
  return `${year}-${month}-${day}`;
};

const parseTimeMinutes = (text: string): number | null => {
  const normalized = normalizeText(text);
  const clock = normalized.match(/\b(?:as|ass)?\s*(\d{1,2})[:h](\d{2})\b/);
  if (clock) {
    const hour = Number(clock[1]);
    const minute = Number(clock[2]);
    return hour <= 23 && minute <= 59 ? (hour * 60) + minute : null;
  }

  const hourOnly = normalized.match(/\b(?:as|ass)?\s*(\d{1,2})h?\b/);
  if (hourOnly && /\b(as|ass)\b/.test(normalized)) {
    const hour = Number(hourOnly[1]);
    return hour <= 23 ? hour * 60 : null;
  }

  if (/\b(de manha|demanha|manha|cedo)\b/.test(normalized)) return 9 * 60;
  if (/\btarde\b/.test(normalized)) return 14 * 60;
  if (/\b(noite|fim da tarde)\b/.test(normalized)) return 19 * 60;

  return null;
};

const extractActionName = (text: string): string | null => {
  const normalized = normalizeText(text);
  const patterns = [
    /(?:agendar|agenda|programar|programa|marcar|marca)\s+(.+?)(?=\s+(?:para|pra|amanha|hoje|de manha|demanha|manha|tarde|noite|as\b|ass\b|\d{1,2}[/:h]|$))/,
    /(?:fiz|feito|feita|realizei|terminei|completei|completar|completa|concluir|conclui)\s+(.+?)(?=\s+(?:agora|para|pra|amanha|hoje|de manha|demanha|manha|tarde|noite|as\b|ass\b|\d{1,2}[/:h]|$))/,
    /(?:desmarcar|desmarca|desfazer|desfaz|descompletar|descompleta|tirar|remove|remover)\s+(.+?)(?=\s+(?:do planner|da agenda|de hoje|amanha|hoje|as\b|ass\b|\d{1,2}[/:h]|$))/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
};

export const parseOracleCommandDraft = (text: string, today: string): OracleCommandDraft => {
  const normalized = normalizeText(text);
  const actionName = extractActionName(text);
  const date = parseDateFromText(text, today);
  const startTime = parseTimeMinutes(text);

  let intent: OracleCommandIntent = "unknown";
  if (/\b(desmarcar|desmarca|desfazer|desfaz|descompletar|descompleta|tirar|remover|remove)\b/.test(normalized)) {
    intent = "unschedule_action";
  } else if (/\b(fiz|feito|feita|realizei|terminei|completei|completar|completa|concluir|conclui)\b/.test(normalized)) {
    intent = "complete_action";
  } else if (/\b(programar|programa|agendar|agenda|marcar|marca)\b/.test(normalized)) {
    intent = "schedule_action";
  }

  return {
    intent,
    actionName,
    date,
    startTime,
    needsConfirmation: intent !== "unknown",
    confidence: intent !== "unknown" && actionName ? "high" : intent !== "unknown" ? "medium" : "low",
  };
};
