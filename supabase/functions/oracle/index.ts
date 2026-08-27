import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  buildOraclePremiumHint,
  normalizeOracleText,
  routeOracleIntent,
  type OracleConversationMemory,
  type OracleResponseKind,
} from "../_shared/oracle-vnext-shared.ts";
import {
  buildOracleHostVoiceDirective,
  deriveOracleHostOperationalState,
  ORACLE_BASE_UNIVERSAL,
  ORACLE_MODE_PROMPT_BLOCKS,
  type OracleHostOperationalState,
} from "../_shared/oracle-host-voice.ts";
import { buildContextualOracleLine } from "../_shared/oracle-lines.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEB_PUSH_WEBHOOK_SECRET = Deno.env.get("WEB_PUSH_WEBHOOK_SECRET") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://app.glyph.life";
const TIME_ZONE = "America/Sao_Paulo";
const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://app.glyph.life,https://www.glyph.life,https://glyph.life,https://glyph-app-arabecos-projects.vercel.app,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

type JsonRecord = Record<string, unknown>;
type OracleMode = "calmo" | "reflexivo" | "tatico" | "estrategico" | "coach" | "personalizado" | "neutro";
type OracleCategory =
  | "frases_inspiradoras"
  | "reflexoes_filosoficas"
  | "fragmentos_sabedoria"
  | "dicas_produtividade"
  | "rituais_lifestyle"
  | "provocacoes"
  | "sussurros_maestria"
  | "analise_padroes";
type OraclePresentation = "ambient_pulse" | "info_card";
type OracleTriggerType = "app_open" | "cron" | "manual";
type OracleOperationalState = OracleHostOperationalState;

type OracleContext = {
  currentTime: string;
  timeOfDay: "madrugada" | "manha" | "tarde" | "noite";
  hasCycle: boolean;
  cycleDayNumber: number | null;
  cycleTotalDays: number | null;
  cycleCompletionPercent: number | null;
  hasArenas: boolean;
  totalArenas: number;
  arenaNames: string[];
  arenaSignals: OracleArenaSignal[];
  focusArenaSignal: OracleArenaSignal | null;
  stalledArenaCount: number;
  overloadedArenaCount: number;
  staleArenas: string[];
  completedActionsInCycle: number;
  pendingActionsToday: number;
  overdueActions: number;
  dailyProofStreakCurrent: number;
  dailyProofStreakBest: number;
  dailyProofTotalClosedDays: number;
  dailyProofLastClosedDate: string | null;
  dailyProofLastProofActionId: string | null;
  dailyProofLastProofArenaId: string | null;
  dailyProofLastProofCycleId: string | null;
  dailyProofLastScore: number | null;
  dailyProofLastExpDeposited: number | null;
  dailyProofLastCompletedTasksCount: number | null;
  dailyProofLastTotalTasksCount: number | null;
  activeMode: OracleMode;
  customModeInstructions: string | null;
  enabledCategories: OracleCategory[];
  username: string;
  level: number;
  sephirotLevels: Record<string, number>;
  clanName: string | null;
  seasonName: string | null;
  pendingChests: number;
  priorityArenaName: string | null;
  priorityActionName: string | null;
  nextMove: string | null;
  cycleRisk: "baixo" | "medio" | "alto";
  needsFirstArena: boolean;
  needsFirstAction: boolean;
  needsFirstTask: boolean;
  needsSitrepClosure: boolean;
};

type OracleArenaSignal = {
  arenaId: string;
  arenaName: string;
  actionCount: number;
  measurableActionCount: number;
  progressPercent: number | null;
  expectedProgressPercent: number | null;
  progressDelta: number | null;
  pace: "adiantado" | "no_ritmo" | "atrasado" | "critico" | "sem_medida";
  completedActions: number;
  plannedActions: number;
  pendingActions: number;
  pendingActionsToday: number;
  hasMeasurableProgress: boolean;
  lastProofDate: string | null;
  daysSinceProof: number | null;
  suggestedAdjustment: "reduzir_meta" | "pausar_arena" | "criar_meta_minima" | "proteger_uma_acao" | "manter_ritmo";
  reason: string;
};

type OraclePreferencesRuntime = {
  userId: string;
  iaEnabled: boolean;
  notificationsEnabled: boolean;
  dailyFocusCardEnabled: boolean;
  presenceLevel: number;
  enabledCategories: OracleCategory[];
  activeMode: OracleMode;
  customModeInstructions: string | null;
  quietHoursStart: string;
  quietHoursEnd: string;
};

type OracleMessageRuntime = {
  id: string;
  category: OracleCategory;
  content: string;
  mode: OracleMode;
  deliveryType: "feed" | "push" | "chat";
  contextSnapshot: JsonRecord;
  read: boolean;
  createdAt: string;
};

type ArenaRow = {
  id: string;
  asset_id?: string | null;
  name?: string | null;
  is_archived?: boolean | null;
  action_ids?: unknown;
};

type ActionRow = {
  id: string;
  arena_id: string;
  name?: string | null;
  repetitions?: number | null;
  action_type?: string | null;
};

type TaskRow = {
  id: string;
  action_id: string;
  date: string;
  start_time?: number | null;
  completed?: boolean | null;
};

type CycleRow = {
  id: string;
  name?: string | null;
  start_date: string;
  end_date: string;
  arena_ids?: unknown;
};

type DailyCommitmentRow = {
  date: string;
  stage?: string | null;
};

type AssetLevelRow = {
  asset_id: string;
  level?: number | null;
};

type OracleMessageRow = {
  id: string;
  category?: string | null;
  content?: string | null;
  mode?: string | null;
  delivery_type?: string | null;
  context_snapshot?: JsonRecord | null;
  read?: boolean | null;
  created_at: string;
};

type OraclePreferencesRow = {
  user_id: string;
  ia_enabled?: boolean | null;
  notifications_enabled?: boolean | null;
  daily_focus_card_enabled?: boolean | null;
  presence_level?: number | null;
  enabled_categories?: unknown;
  active_mode?: string | null;
  custom_mode_instructions?: string | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
};

type UserProfileRow = {
  id: string;
  nickname?: string | null;
  level?: number | null;
  chests?: unknown;
  app_mode?: string | null;
  daily_proof_streak?: unknown;
  is_premium?: boolean | null;
  premium_expires_at?: string | null;
  subscription_tier?: string | null;
};

type AppMode = "BASIC" | "GAME";

const SAO_PAULO_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DAY_MINUTES = 24 * 60;
const DAY_MS = DAY_MINUTES * 60 * 1000;
const ORACLE_MANUAL_LIBRARY_CATEGORIES: OracleCategory[] = [
  "frases_inspiradoras",
  "reflexoes_filosoficas",
  "fragmentos_sabedoria",
  "rituais_lifestyle",
  "sussurros_maestria",
];

const ORACLE_CATEGORY_LABELS: Record<OracleCategory, string> = {
  frases_inspiradoras: "Carta inspiradora",
  reflexoes_filosoficas: "Reflexao filosofica",
  fragmentos_sabedoria: "Fragmento de sabedoria",
  dicas_produtividade: "Sinal de foco",
  rituais_lifestyle: "Dica de vida",
  provocacoes: "Sinal de alerta",
  sussurros_maestria: "Sussurro de maestria",
  analise_padroes: "Leitura de ritmo",
};

const DEFAULT_ORACLE_PREFERENCES = {
  iaEnabled: true,
  notificationsEnabled: true,
  dailyFocusCardEnabled: false,
  // Matches the settings screen, which offers 0, 2 and 3. Level 1 has no option.
  presenceLevel: 2,
  enabledCategories: [...ORACLE_MANUAL_LIBRARY_CATEGORIES],
  activeMode: "neutro" as OracleMode,
  customModeInstructions: null,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

const isLocalDevOrigin = (origin: string | null): boolean => !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
const isVercelPreviewOrigin = (origin: string | null): boolean => !!origin && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
const isGlyphOrigin = (origin: string | null): boolean => !!origin && /^https:\/\/([a-z0-9-]+\.)?glyph\.life$/i.test(origin);

const isAllowedRequestOrigin = (origin: string | null): boolean => (
  !origin ||
  ALLOWED_ORIGINS.includes(origin) ||
  isLocalDevOrigin(origin) ||
  isVercelPreviewOrigin(origin) ||
  isGlyphOrigin(origin)
);

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || ALLOWED_ORIGINS[0] || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-oracle-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const jsonResponse = (origin: string | null, status: number, payload: JsonRecord) => new Response(
  JSON.stringify(payload),
  {
    status,
    headers: {
      ...buildCorsHeaders(origin),
      "Content-Type": "application/json",
    },
  },
);

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value.trim() : fallback;

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "t"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "f"].includes(normalized)) return false;
  }
  return fallback;
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => asTrimmedString(entry)).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return normalizeStringArray(JSON.parse(trimmed));
      } catch (_error) {
        return [];
      }
    }

    if (trimmed.includes(",")) {
      return trimmed.split(",").map((entry) => entry.trim()).filter(Boolean);
    }

    return [trimmed];
  }

  return [];
};

const normalizeOracleMode = (value: unknown): OracleMode => {
  const normalized = asTrimmedString(value).toLowerCase();
  switch (normalized) {
    case "calmo":
    case "reflexivo":
    case "tatico":
    case "estrategico":
    case "coach":
    case "personalizado":
    case "neutro":
      return normalized;
    default:
      return "neutro";
  }
};

const isOracleCategory = (value: string): value is OracleCategory => (
  [
    "frases_inspiradoras",
    "reflexoes_filosoficas",
    "fragmentos_sabedoria",
    "dicas_produtividade",
    "rituais_lifestyle",
    "provocacoes",
    "sussurros_maestria",
    "analise_padroes",
  ].includes(value)
);

const normalizeOracleCategories = (value: unknown): OracleCategory[] => (
  normalizeStringArray(value).filter((entry): entry is OracleCategory => isOracleCategory(entry))
);

const normalizeOracleManualCategories = (enabledCategories: OracleCategory[] = []): OracleCategory[] => {
  return enabledCategories.filter((category) => ORACLE_MANUAL_LIBRARY_CATEGORIES.includes(category));
};

const resolveRuntimeOraclePreferences = (userId: string, row: OraclePreferencesRow | null): OraclePreferencesRuntime => ({
  userId,
  iaEnabled: row?.ia_enabled ?? DEFAULT_ORACLE_PREFERENCES.iaEnabled,
  notificationsEnabled: row?.notifications_enabled ?? DEFAULT_ORACLE_PREFERENCES.notificationsEnabled,
  dailyFocusCardEnabled: row?.daily_focus_card_enabled ?? DEFAULT_ORACLE_PREFERENCES.dailyFocusCardEnabled,
  presenceLevel: clamp(Math.round(asNumber(row?.presence_level, DEFAULT_ORACLE_PREFERENCES.presenceLevel)), 0, 3),
  enabledCategories: normalizeOracleManualCategories(
    normalizeOracleCategories(row?.enabled_categories ?? DEFAULT_ORACLE_PREFERENCES.enabledCategories),
  ),
  activeMode: normalizeOracleMode(row?.active_mode ?? DEFAULT_ORACLE_PREFERENCES.activeMode),
  customModeInstructions: asTrimmedString(row?.custom_mode_instructions, "") || DEFAULT_ORACLE_PREFERENCES.customModeInstructions,
  quietHoursStart: asTrimmedString(row?.quiet_hours_start, DEFAULT_ORACLE_PREFERENCES.quietHoursStart) || DEFAULT_ORACLE_PREFERENCES.quietHoursStart,
  quietHoursEnd: asTrimmedString(row?.quiet_hours_end, DEFAULT_ORACLE_PREFERENCES.quietHoursEnd) || DEFAULT_ORACLE_PREFERENCES.quietHoursEnd,
});

const getSaoPauloParts = (date: Date) => {
  const partMap = SAO_PAULO_PARTS_FORMATTER.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});

  const year = Number(partMap.year || "1970");
  const month = Number(partMap.month || "01");
  const day = Number(partMap.day || "01");
  const hour = Number(partMap.hour || "00");
  const minute = Number(partMap.minute || "00");
  const second = Number(partMap.second || "00");

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateString: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
};

const shiftDateString = (dateString: string, dayDelta: number): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const next = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  next.setUTCDate(next.getUTCDate() + dayDelta);
  const nextYear = next.getUTCFullYear();
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(next.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const getOperationalDateString = (date = new Date()): string => {
  const local = getSaoPauloParts(date);
  return local.hour < 4 ? shiftDateString(local.dateString, -1) : local.dateString;
};

const deriveOracleOperationalState = (contextData: OracleContext, now = new Date()): OracleOperationalState => {
  return deriveOracleHostOperationalState(contextData, {
    operationalDate: getOperationalDateString(now),
  });
};

const getTimeOfDay = (date = new Date()): OracleContext["timeOfDay"] => {
  const { hour } = getSaoPauloParts(date);
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
};

const parseClockMinutes = (value: string | null | undefined, fallback: string): number => {
  const [hoursRaw, minutesRaw] = String(value || fallback).split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return parseClockMinutes(fallback, fallback);
  return clamp(hours, 0, 23) * 60 + clamp(minutes, 0, 59);
};

const getQuietWindowMinutes = (preferences: Pick<OraclePreferencesRuntime, "quietHoursStart" | "quietHoursEnd">): number => {
  const start = parseClockMinutes(preferences.quietHoursStart, "22:00");
  const end = parseClockMinutes(preferences.quietHoursEnd, "07:00");
  if (start === end) return 0;
  if (start < end) return end - start;
  return (DAY_MINUTES - start) + end;
};

const isQuietHours = (date: Date, preferences: Pick<OraclePreferencesRuntime, "quietHoursStart" | "quietHoursEnd">): boolean => {
  const nowParts = getSaoPauloParts(date);
  const currentMinutes = nowParts.hour * 60 + nowParts.minute;
  const start = parseClockMinutes(preferences.quietHoursStart, "22:00");
  const end = parseClockMinutes(preferences.quietHoursEnd, "07:00");
  if (start === end) return false;
  if (start < end) return currentMinutes >= start && currentMinutes < end;
  return currentMinutes >= start || currentMinutes < end;
};

const resolveOracleAutoDailyTarget = (
  preferences: Pick<OraclePreferencesRuntime, "enabledCategories" | "presenceLevel">,
  _appMode: AppMode,
): number => {
  if (preferences.presenceLevel <= 0 || preferences.enabledCategories.length === 0) return 0;
  // Deliberate since 1.0.56: one automatic card a day at every level above silent.
  return 1;
};

const getOracleAutoGapMs = (
  preferences: Pick<OraclePreferencesRuntime, "enabledCategories" | "presenceLevel" | "quietHoursStart" | "quietHoursEnd">,
  appMode: AppMode,
): number => {
  const target = resolveOracleAutoDailyTarget(preferences, appMode);
  if (target <= 0) return DAY_MS;
  const activeWindowMinutes = Math.max(4 * 60, DAY_MINUTES - getQuietWindowMinutes(preferences));
  const gapMinutes = Math.max(60, Math.round(activeWindowMinutes / target));
  return gapMinutes * 60 * 1000;
};

const getTaskOperationalDateString = (task: TaskRow): string => {
  if (!task?.date) return "";
  const startTime = asNumber(task.start_time, -1);
  return Number.isFinite(startTime) && startTime >= 0 && startTime < 240
    ? shiftDateString(task.date, -1)
    : task.date;
};

const taskMatchesOperationalDate = (task: TaskRow, operationalDateString: string): boolean =>
  getTaskOperationalDateString(task) === operationalDateString;

const getLatestOracleFeedMessage = (messages: OracleMessageRuntime[]): OracleMessageRuntime | null => {
  let latest: OracleMessageRuntime | null = null;
  for (const message of messages) {
    if (message.deliveryType !== "feed") continue;
    if (!latest || new Date(message.createdAt).getTime() > new Date(latest.createdAt).getTime()) {
      latest = message;
    }
  }
  return latest;
};

const getOracleFeedMessagesForOperationalDay = (messages: OracleMessageRuntime[], now: Date): OracleMessageRuntime[] => {
  const operationalDay = getOperationalDateString(now);
  return messages.filter((message) => (
    message.deliveryType === "feed" &&
    getOperationalDateString(new Date(message.createdAt)) === operationalDay
  ));
};

const resolveAutomaticOracleCategory = (
  _appMode: AppMode,
  _mode: OracleMode,
  _contextData: OracleContext,
  messages: OracleMessageRuntime[],
  enabledCategories: OracleCategory[],
  now: Date,
): OracleCategory | null => {
  const ambientPool = normalizeOracleManualCategories(enabledCategories);
  const todayFeedMessages = getOracleFeedMessagesForOperationalDay(messages, now);
  const sentAmbientCategories = new Set(
    todayFeedMessages
      .map((message) => message.category)
      .filter((category) => ambientPool.includes(category)),
  );
  const nextAmbientCategory = ambientPool.find((category) => !sentAmbientCategories.has(category));
  return nextAmbientCategory || null;
};

const daysBetweenInclusive = (startDate: string, endDate: string): number => {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
};

const diffDateDays = (fromDate: string, toDate: string): number | null => {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
};

const getActionCycleWeight = (action: ActionRow): number => {
  const actionType = asTrimmedString(action.action_type);
  if (actionType === "Livre") return 0;
  if (actionType === "Marco" || actionType === "Compromisso") return 1;
  return Math.max(1, Math.floor(asNumber(action.repetitions, 1)));
};

const resolveArenaPace = (
  completionPercent: number | null,
  expectedPercent: number | null,
): OracleArenaSignal["pace"] => {
  if (completionPercent === null || expectedPercent === null) return "sem_medida";
  const delta = completionPercent - expectedPercent;
  if (delta >= 10) return "adiantado";
  if (delta >= -10) return "no_ritmo";
  if (delta >= -25) return "atrasado";
  return "critico";
};

const buildArenaSignalReason = (signal: Omit<OracleArenaSignal, "reason">): string => {
  if (signal.suggestedAdjustment === "criar_meta_minima") {
    return "A arena tem acoes livres ou sem contador, entao precisa de meta minima se a pessoa quiser medir avanco.";
  }
  if (signal.suggestedAdjustment === "pausar_arena") {
    return "A arena ficou varios dias sem uma acao concluida dentro do ciclo.";
  }
  if (signal.suggestedAdjustment === "reduzir_meta") {
    return "O avanco da arena ficou abaixo do tempo ja gasto no ciclo.";
  }
  if (signal.suggestedAdjustment === "proteger_uma_acao") {
    return "A arena tem acao pendente hoje e pode voltar ao fio com um passo pequeno.";
  }
  return "A arena esta acompanhando o ritmo ou nao pede ajuste agora.";
};

const compareArenaSignals = (left: OracleArenaSignal, right: OracleArenaSignal): number => {
  const adjustmentScore: Record<OracleArenaSignal["suggestedAdjustment"], number> = {
    reduzir_meta: 5,
    pausar_arena: 4,
    proteger_uma_acao: 3,
    criar_meta_minima: 2,
    manter_ritmo: 1,
  };
  const paceScore: Record<OracleArenaSignal["pace"], number> = {
    critico: 5,
    atrasado: 4,
    sem_medida: 3,
    no_ritmo: 2,
    adiantado: 1,
  };
  const score = (signal: OracleArenaSignal) =>
    adjustmentScore[signal.suggestedAdjustment] * 1000 +
    paceScore[signal.pace] * 100 +
    signal.pendingActionsToday * 10 +
    signal.pendingActions +
    Math.max(0, -(signal.progressDelta ?? 0));
  return score(right) - score(left);
};

const buildNextMove = ({
  hasCycle,
  needsFirstArena,
  needsFirstAction,
  needsFirstTask,
  needsSitrepClosure,
  priorityArenaName,
  priorityActionName,
  pendingActionsToday,
}: {
  hasCycle: boolean;
  needsFirstArena: boolean;
  needsFirstAction: boolean;
  needsFirstTask: boolean;
  needsSitrepClosure: boolean;
  priorityArenaName: string | null;
  priorityActionName: string | null;
  pendingActionsToday: number;
}): string | null => {
  if (!hasCycle) return "Abrir um novo ciclo e escolher as arenas desta rodada.";
  if (needsFirstArena) return "Criar a primeira arena do ciclo.";
  if (needsFirstAction) return priorityArenaName ? `Criar a primeira acao em ${priorityArenaName}.` : "Criar a primeira acao do ciclo.";
  if (needsFirstTask) return priorityActionName ? `Agendar a primeira execucao de ${priorityActionName}.` : "Agendar a primeira tarefa do ciclo.";
  if (needsSitrepClosure) return "Fechar o SITREP de hoje antes de encerrar o dia.";
  if (priorityActionName) return priorityArenaName ? `Executar ${priorityActionName} em ${priorityArenaName}.` : `Executar ${priorityActionName}.`;
  if (pendingActionsToday > 0) return "Executar a proxima tarefa planejada do dia.";
  return "Proteger a cadencia do ciclo com a proxima acao relevante.";
};

const sumChestCount = (value: unknown): number => {
  if (!Array.isArray(value)) return 0;
  return value.reduce((acc, entry) => acc + asNumber(isRecord(entry) ? entry.count : 0, 0), 0);
};

const normalizeDailyProofStreak = (value: unknown) => {
  const entry = isRecord(value) ? value : {};
  return {
    current: Math.max(0, Math.round(asNumber(entry.current, 0))),
    best: Math.max(0, Math.round(asNumber(entry.best, 0))),
    totalClosedDays: Math.max(0, Math.round(asNumber(entry.totalClosedDays, 0))),
    lastClosedDate: asTrimmedString(entry.lastProofDate) || asTrimmedString(entry.lastClosedDate) || null,
    lastProofActionId: asTrimmedString(entry.lastProofActionId) || null,
    lastProofArenaId: asTrimmedString(entry.lastProofArenaId) || null,
    lastProofCycleId: asTrimmedString(entry.lastProofCycleId) || null,
    lastScore: Number.isFinite(entry.lastScore) ? Math.round(asNumber(entry.lastScore, 0)) : null,
    lastExpDeposited: Number.isFinite(entry.lastExpDeposited) ? Math.round(asNumber(entry.lastExpDeposited, 0)) : null,
    lastCompletedTasksCount: Number.isFinite(entry.lastCompletedTasksCount) ? Math.round(asNumber(entry.lastCompletedTasksCount, 0)) : null,
    lastTotalTasksCount: Number.isFinite(entry.lastTotalTasksCount) ? Math.round(asNumber(entry.lastTotalTasksCount, 0)) : null,
  };
};

const buildOracleOperationalContext = ({
  now,
  profile,
  preferences,
  arenas,
  actions,
  tasks,
  activeCycle,
  dailyCommitment,
  assetLevels,
}: {
  now: Date;
  profile: UserProfileRow | null;
  preferences: OraclePreferencesRuntime;
  arenas: ArenaRow[];
  actions: ActionRow[];
  tasks: TaskRow[];
  activeCycle: CycleRow | null;
  dailyCommitment: DailyCommitmentRow | null;
  assetLevels: AssetLevelRow[];
}): OracleContext => {
  const operationalDate = getOperationalDateString(now);
  const activeArenas = arenas.filter((arena) => !asBoolean(arena.is_archived, false));
  const actionById = new Map(actions.map((action) => [action.id, action]));
  const arenaById = new Map(activeArenas.map((arena) => [arena.id, arena]));
  const inferredArenaIds = new Set<string>();
  actions.forEach((action) => {
    const arenaId = asTrimmedString(action.arena_id);
    if (arenaId) inferredArenaIds.add(arenaId);
  });
  const todayTasks = tasks.filter((task) => taskMatchesOperationalDate(task, operationalDate));
  const pendingTodayTasks = todayTasks.filter((task) => !asBoolean(task.completed, false));
  const overdueTasks = tasks.filter((task) => !asBoolean(task.completed, false) && getTaskOperationalDateString(task) < operationalDate);
  const dailyProofStreak = normalizeDailyProofStreak(profile?.daily_proof_streak);
  const cycleArenaIds = new Set(normalizeStringArray(activeCycle?.arena_ids));
  const effectiveCycleEnd = activeCycle
    ? (activeCycle.end_date < operationalDate ? activeCycle.end_date : operationalDate)
    : operationalDate;

  const cycleTasks = activeCycle
    ? tasks.filter((task) => {
      if (task.date < activeCycle.start_date || task.date > effectiveCycleEnd) return false;
      if (cycleArenaIds.size === 0) return true;
      const action = actionById.get(task.action_id);
      return !!action && cycleArenaIds.has(action.arena_id);
    })
    : [];

  const completedCycleTasks = cycleTasks.filter((task) => asBoolean(task.completed, false));
  const completedActionsInCycle = new Set(completedCycleTasks.map((task) => task.action_id)).size;
  const cycleCompletionPercent = cycleTasks.length > 0 ? Math.round((completedCycleTasks.length / cycleTasks.length) * 100) : 0;
  const cycleTotalDays = activeCycle ? daysBetweenInclusive(activeCycle.start_date, activeCycle.end_date) : null;
  const cycleDayNumber = activeCycle
    ? Math.min(cycleTotalDays || 1, daysBetweenInclusive(activeCycle.start_date, operationalDate))
    : null;
  const expectedCycleProgress = activeCycle && cycleDayNumber && cycleTotalDays
    ? Math.round((cycleDayNumber / cycleTotalDays) * 100)
    : null;

  let cycleRisk: OracleContext["cycleRisk"] = "baixo";
  if (!activeCycle || pendingTodayTasks.length >= 5 || overdueTasks.length >= 3) {
    cycleRisk = "alto";
  } else if (
    overdueTasks.length > 0 ||
    (expectedCycleProgress !== null && cycleCompletionPercent < expectedCycleProgress - 15)
  ) {
    cycleRisk = "medio";
  }

  const sortedByUrgency = [...overdueTasks, ...pendingTodayTasks].sort((left, right) => {
    const leftDate = getTaskOperationalDateString(left);
    const rightDate = getTaskOperationalDateString(right);
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    const leftStart = Number.isFinite(left.start_time) ? asNumber(left.start_time, Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const rightStart = Number.isFinite(right.start_time) ? asNumber(right.start_time, Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    if (leftStart !== rightStart) return leftStart - rightStart;
    return left.id.localeCompare(right.id);
  });

  const priorityTask = sortedByUrgency[0] || null;
  const priorityAction = priorityTask ? actionById.get(priorityTask.action_id) || null : null;
  const priorityArena = priorityAction ? arenaById.get(priorityAction.arena_id) || null : null;
  const relevantArenas = activeCycle
    ? activeArenas.filter((arena) => cycleArenaIds.size === 0 || cycleArenaIds.has(arena.id))
    : activeArenas;
  const arenaSignals = relevantArenas
    .map((arena): OracleArenaSignal | null => {
      const arenaActions = actions.filter((action) => action.arena_id === arena.id);
      if (arenaActions.length === 0) {
        const baseSignal: Omit<OracleArenaSignal, "reason"> = {
          arenaId: arena.id,
          arenaName: asTrimmedString(arena.name, "Arena") || "Arena",
          actionCount: 0,
          measurableActionCount: 0,
          progressPercent: null,
          expectedProgressPercent: expectedCycleProgress,
          progressDelta: null,
          pace: "sem_medida",
          completedActions: 0,
          plannedActions: 0,
          pendingActions: 0,
          pendingActionsToday: 0,
          hasMeasurableProgress: false,
          lastProofDate: null,
          daysSinceProof: null,
          suggestedAdjustment: "criar_meta_minima",
        };
        return { ...baseSignal, reason: buildArenaSignalReason(baseSignal) };
      }

      const arenaActionIds = new Set(arenaActions.map((action) => action.id));
      const measurableActions = arenaActions.filter((action) => asTrimmedString(action.action_type) !== "Livre");
      const plannedActions = measurableActions.reduce((sum, action) => sum + getActionCycleWeight(action), 0);
      const arenaCycleTasks = cycleTasks.filter((task) => arenaActionIds.has(task.action_id));
      const completedTasks = arenaCycleTasks.filter((task) => asBoolean(task.completed, false));
      const completedActions = plannedActions > 0
        ? Math.min(plannedActions, completedTasks.filter((task) => actionById.get(task.action_id)?.action_type !== "Livre").length)
        : completedTasks.length;
      const progressPercent = plannedActions > 0 ? Math.round((completedActions / plannedActions) * 100) : null;
      const progressDelta = progressPercent !== null && expectedCycleProgress !== null
        ? progressPercent - expectedCycleProgress
        : null;
      const pace = resolveArenaPace(progressPercent, expectedCycleProgress);
      const pendingActions = plannedActions > 0 ? Math.max(0, plannedActions - completedActions) : 0;
      const pendingActionsTodayForArena = pendingTodayTasks.filter((task) => arenaActionIds.has(task.action_id)).length;
      const completedDates = completedTasks.map((task) => getTaskOperationalDateString(task)).sort();
      const lastProofDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;
      const daysSinceProof = lastProofDate ? diffDateDays(lastProofDate, operationalDate) : null;
      const suggestedAdjustment: OracleArenaSignal["suggestedAdjustment"] =
        plannedActions === 0
          ? "criar_meta_minima"
          : (daysSinceProof !== null && daysSinceProof >= 7 && completedActions === 0)
            ? "pausar_arena"
            : (pace === "critico" || pace === "atrasado")
              ? "reduzir_meta"
              : pendingActionsTodayForArena > 0
                ? "proteger_uma_acao"
                : "manter_ritmo";
      const baseSignal: Omit<OracleArenaSignal, "reason"> = {
        arenaId: arena.id,
        arenaName: asTrimmedString(arena.name, "Arena") || "Arena",
        actionCount: arenaActions.length,
        measurableActionCount: measurableActions.length,
        progressPercent,
        expectedProgressPercent: expectedCycleProgress,
        progressDelta,
        pace,
        completedActions,
        plannedActions,
        pendingActions,
        pendingActionsToday: pendingActionsTodayForArena,
        hasMeasurableProgress: plannedActions > 0,
        lastProofDate,
        daysSinceProof,
        suggestedAdjustment,
      };
      return { ...baseSignal, reason: buildArenaSignalReason(baseSignal) };
    })
    .filter((signal): signal is OracleArenaSignal => Boolean(signal))
    .sort(compareArenaSignals)
    .slice(0, 6);
  const focusArenaSignal = arenaSignals[0] || null;
  const stalledArenaCount = arenaSignals.filter((signal) => (
    signal.suggestedAdjustment === "pausar_arena" ||
    signal.pace === "critico" ||
    (signal.daysSinceProof ?? 0) >= 7
  )).length;
  const overloadedArenaCount = arenaSignals.filter((signal) => signal.suggestedAdjustment === "reduzir_meta").length;
  const recentThreshold = shiftDateString(operationalDate, -6);
  const staleArenas = activeArenas
    .filter((arena) => actions.some((action) => action.arena_id === arena.id))
    .filter((arena) => {
      const recentCompletedTask = tasks.some((task) => {
        if (!asBoolean(task.completed, false)) return false;
        const action = actionById.get(task.action_id);
        if (!action || action.arena_id !== arena.id) return false;
        const taskOperationalDate = getTaskOperationalDateString(task);
        return taskOperationalDate >= recentThreshold && taskOperationalDate <= operationalDate;
      });
      return !recentCompletedTask;
    })
    .map((arena) => asTrimmedString(arena.name))
    .filter(Boolean);

  const hasArenaEvidence = activeArenas.length > 0 || cycleArenaIds.size > 0 || inferredArenaIds.size > 0;
  const needsFirstArena = !hasArenaEvidence;
  const needsFirstAction = !needsFirstArena && actions.length === 0;
  const needsFirstTask = !needsFirstArena && !needsFirstAction && tasks.length === 0;
  const needsSitrepClosure = dailyCommitment?.date === operationalDate && dailyCommitment?.stage === "battle";

  return {
    currentTime: now.toISOString(),
    timeOfDay: getTimeOfDay(now),
    hasCycle: !!activeCycle,
    cycleDayNumber,
    cycleTotalDays,
    cycleCompletionPercent: activeCycle ? cycleCompletionPercent : null,
    hasArenas: hasArenaEvidence,
    totalArenas: Math.max(activeArenas.length, cycleArenaIds.size, inferredArenaIds.size),
    arenaNames: activeArenas.map((arena) => asTrimmedString(arena.name)).filter(Boolean),
    arenaSignals,
    focusArenaSignal,
    stalledArenaCount,
    overloadedArenaCount,
    staleArenas,
    completedActionsInCycle,
    pendingActionsToday: pendingTodayTasks.length,
    overdueActions: overdueTasks.length,
    dailyProofStreakCurrent: dailyProofStreak.current,
    dailyProofStreakBest: dailyProofStreak.best,
    dailyProofTotalClosedDays: dailyProofStreak.totalClosedDays,
    dailyProofLastClosedDate: dailyProofStreak.lastClosedDate,
    dailyProofLastProofActionId: dailyProofStreak.lastProofActionId,
    dailyProofLastProofArenaId: dailyProofStreak.lastProofArenaId,
    dailyProofLastProofCycleId: dailyProofStreak.lastProofCycleId,
    dailyProofLastScore: dailyProofStreak.lastScore,
    dailyProofLastExpDeposited: dailyProofStreak.lastExpDeposited,
    dailyProofLastCompletedTasksCount: dailyProofStreak.lastCompletedTasksCount,
    dailyProofLastTotalTasksCount: dailyProofStreak.lastTotalTasksCount,
    activeMode: preferences.activeMode,
    customModeInstructions: preferences.customModeInstructions,
    enabledCategories: preferences.enabledCategories,
    username: asTrimmedString(profile?.nickname, "voce") || "voce",
    level: Math.max(1, asNumber(profile?.level, 1)),
    sephirotLevels: assetLevels.reduce<Record<string, number>>((acc, entry) => {
      const assetId = asTrimmedString(entry.asset_id);
      if (assetId) acc[assetId] = Math.max(0, asNumber(entry.level, 0));
      return acc;
    }, {}),
    clanName: null,
    seasonName: null,
    pendingChests: sumChestCount(profile?.chests),
    priorityArenaName: priorityArena ? asTrimmedString(priorityArena.name) || null : null,
    priorityActionName: priorityAction ? asTrimmedString(priorityAction.name) || null : null,
    nextMove: buildNextMove({
      hasCycle: !!activeCycle,
      needsFirstArena,
      needsFirstAction,
      needsFirstTask,
      needsSitrepClosure,
      priorityArenaName: priorityArena ? asTrimmedString(priorityArena.name) || null : null,
      priorityActionName: priorityAction ? asTrimmedString(priorityAction.name) || null : null,
      pendingActionsToday: pendingTodayTasks.length,
    }),
    cycleRisk,
    needsFirstArena,
    needsFirstAction,
    needsFirstTask,
    needsSitrepClosure,
  };
};

const normalizeOracleMessages = (rows: OracleMessageRow[] | null | undefined): OracleMessageRuntime[] => (
  (rows || [])
    .map((row) => {
      const category = asTrimmedString(row.category);
      if (!isOracleCategory(category)) return null;
      const deliveryType = asTrimmedString(row.delivery_type, "feed");
      return {
        id: row.id,
        category,
        content: asTrimmedString(row.content),
        mode: normalizeOracleMode(row.mode),
        deliveryType: (deliveryType === "push" || deliveryType === "chat" ? deliveryType : "feed") as "feed" | "push" | "chat",
        contextSnapshot: isRecord(row.context_snapshot) ? row.context_snapshot : {},
        read: asBoolean(row.read, false),
        createdAt: row.created_at,
      };
    })
    .filter((message): message is OracleMessageRuntime => !!message)
);

const getSupabaseAdmin = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const createAutomaticOracleMessage = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  origin: string | null,
): Promise<{ status: string; reason?: string; messageId?: string }> => {
  const now = new Date();
  const [preferencesResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("oracle_preferences")
      .select("user_id, ia_enabled, notifications_enabled, daily_focus_card_enabled, presence_level, enabled_categories, active_mode, custom_mode_instructions, quiet_hours_start, quiet_hours_end")
      .eq("user_id", userId)
      .maybeSingle<OraclePreferencesRow>(),
    supabaseAdmin
      .from("user_profiles")
      .select("id, nickname, level, chests, app_mode, daily_proof_streak, is_premium, premium_expires_at, subscription_tier")
      .eq("id", userId)
      .maybeSingle<UserProfileRow>(),
  ]);

  if (preferencesResult.error) return { status: "error", reason: preferencesResult.error.message };
  if (profileResult.error) return { status: "error", reason: profileResult.error.message };

  const preferences = resolveRuntimeOraclePreferences(userId, preferencesResult.data ?? null);
  if (!preferences.iaEnabled) return { status: "skipped", reason: "ia_disabled" };
  if (!preferences.notificationsEnabled) return { status: "skipped", reason: "notifications_disabled" };
  if (!preferences.dailyFocusCardEnabled) return { status: "skipped", reason: "daily_focus_disabled" };
  if (preferences.presenceLevel <= 0) return { status: "skipped", reason: "presence_disabled" };
  if (normalizeOracleManualCategories(preferences.enabledCategories).length === 0) {
    return { status: "skipped", reason: "no_categories" };
  }
  if (isQuietHours(now, preferences)) return { status: "skipped", reason: "quiet_hours" };

  const profile = profileResult.data ?? null;

  // O card automatico deixou de ser exclusivo do Premium, e o motivo e aritmetico.
  //
  // A pool tem 3 variacoes por estado operacional. Dar 3 cards por dia ao Premium
  // queimaria as tres no mesmo dia e entregaria REPETICAO como beneficio pago —
  // pior do que nao dar nada. Entao o volume ficou em um por dia para todo mundo,
  // e o Premium passou a comprar profundidade em vez de quantidade: escolher os
  // temas e puxar card na hora, que continuam pagos.
  //
  // O efeito colateral e bom: no plano gratuito a mecanica deixa de ser invisivel.
  // Ninguem assina o que nunca viu funcionar.
  const appMode: AppMode = asTrimmedString(profile?.app_mode) === "BASIC" ? "BASIC" : "GAME";

  const [cycleResult, oracleMessagesResult] = await Promise.all([
    supabaseAdmin
      .from("cycles")
      .select("id, name, start_date, end_date, arena_ids")
      .eq("user_id", userId)
      .is("report_data", null)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle<CycleRow>(),
    supabaseAdmin
      .from("oracle_messages")
      .select("id, category, content, mode, delivery_type, context_snapshot, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<OracleMessageRow[]>(),
  ]);

  if (cycleResult.error) return { status: "error", reason: cycleResult.error.message };
  if (oracleMessagesResult.error) return { status: "error", reason: oracleMessagesResult.error.message };

  const activeCycle = cycleResult.data ?? null;
  const oracleMessages = normalizeOracleMessages(oracleMessagesResult.data);
  const autoDailyTarget = resolveOracleAutoDailyTarget(preferences, appMode);
  const todayMessages = getOracleFeedMessagesForOperationalDay(oracleMessages, now);
  const subscribedCategories = normalizeOracleManualCategories(preferences.enabledCategories);
  const autoMessagesToday = todayMessages.filter((message) => (
    subscribedCategories.includes(message.category)
    && message.contextSnapshot?.triggerType !== "manual"
  ));
  const autoSentToday = new Set(autoMessagesToday.map((message) => message.category)).size;
  const autoRemainingToday = Math.max(0, autoDailyTarget - autoSentToday);
  if (autoRemainingToday <= 0) return { status: "skipped", reason: "daily_limit" };

  const autoGapMs = getOracleAutoGapMs(preferences, appMode);
  const latestAutoTodayMessage = getLatestOracleFeedMessage(autoMessagesToday);
  if (latestAutoTodayMessage) {
    const nextAutoInMs = Math.max(0, autoGapMs - (now.getTime() - new Date(latestAutoTodayMessage.createdAt).getTime()));
    if (nextAutoInMs > 0) return { status: "skipped", reason: "cooldown" };
  }

  const operationalDate = getOperationalDateString(now);
  const taskWindowStart = activeCycle?.start_date || shiftDateString(operationalDate, -30);
  const taskWindowEnd = activeCycle?.end_date || operationalDate;
  const [arenasResult, actionsResult, tasksResult, dailyCommitmentResult, assetLevelsResult] = await Promise.all([
    supabaseAdmin
      .from("arenas")
      .select("id, asset_id, name, is_archived, action_ids")
      .eq("user_id", userId)
      .returns<ArenaRow[]>(),
    supabaseAdmin
      .from("actions")
      .select("id, arena_id, name, repetitions, action_type")
      .eq("user_id", userId)
      .returns<ActionRow[]>(),
    supabaseAdmin
      .from("scheduled_tasks")
      .select("id, action_id, date, start_time, completed")
      .eq("user_id", userId)
      .gte("date", taskWindowStart)
      .lte("date", taskWindowEnd)
      .returns<TaskRow[]>(),
    supabaseAdmin
      .from("daily_commitments")
      .select("date, stage")
      .eq("user_id", userId)
      .eq("date", operationalDate)
      .maybeSingle<DailyCommitmentRow>(),
    supabaseAdmin
      .from("asset_levels")
      .select("asset_id, level")
      .eq("user_id", userId)
      .returns<AssetLevelRow[]>(),
  ]);

  const operationalError = [
    arenasResult.error,
    actionsResult.error,
    tasksResult.error,
    dailyCommitmentResult.error,
    assetLevelsResult.error,
  ].find(Boolean);
  if (operationalError) return { status: "error", reason: operationalError.message };

  const contextData = buildOracleOperationalContext({
    now,
    profile,
    preferences,
    arenas: arenasResult.data ?? [],
    actions: actionsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    activeCycle,
    dailyCommitment: dailyCommitmentResult.data ?? null,
    assetLevels: assetLevelsResult.data ?? [],
  });

  const triggerType: OracleTriggerType = autoSentToday === 0 ? "app_open" : "cron";
  const category = resolveAutomaticOracleCategory(
    appMode,
    preferences.activeMode,
    contextData,
    oracleMessages,
    preferences.enabledCategories,
    now,
  );
  if (!category) return { status: "skipped", reason: "daily_limit" };
  const presentation: OraclePresentation = "info_card";
  const recentOracleLines = oracleMessages.map((message) => message.content).filter(Boolean).slice(0, 5);
  const operationalState = deriveOracleOperationalState(contextData, now);
  // Written line instead of a model call: these speak about the player's own numbers,
  // so a template filled from context cannot invent them, costs nothing per delivery,
  // and does not disappear when the provider is unreachable.
  const text = buildContextualOracleLine({
    state: operationalState,
    context: contextData,
    recentLines: recentOracleLines,
  });

  // No line fits the current state with the data available. Staying quiet is better
  // than delivering something generic that ignores what is happening.
  if (!text) return { status: "skipped", reason: "no_line_for_state" };

  const messageId = crypto.randomUUID();
  const { error: insertError } = await supabaseAdmin
    .from("oracle_messages")
    .insert({
      id: messageId,
      user_id: userId,
      category,
      content: text,
      mode: preferences.activeMode,
      delivery_type: "feed",
      context_snapshot: {
        triggerType,
        presentation,
        categoryLabel: ORACLE_CATEGORY_LABELS[category],
        generatedFor: "feed",
        purpose: "premium_content_card",
        operationalState,
        summary: "Card do Oraculo",
      },
      read: false,
      created_at: now.toISOString(),
    });

  if (insertError) return { status: "error", reason: insertError.message };
  return { status: "generated", messageId };
};

const handleAutomaticOracleCron = async (req: Request, origin: string | null) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WEB_PUSH_WEBHOOK_SECRET) {
    return jsonResponse(origin, 500, { error: "Function misconfigured for backend oracle automation." });
  }

  if (req.headers.get("x-oracle-cron-secret") !== WEB_PUSH_WEBHOOK_SECRET) {
    return jsonResponse(origin, 401, { error: "Invalid oracle cron secret." });
  }

  let body: JsonRecord = {};
  try {
    body = (await req.json()) as JsonRecord;
  } catch (_error) {
    body = {};
  }

  const limit = clamp(asNumber(body.limit, 25), 1, 50);
  const supabaseAdmin = getSupabaseAdmin();
  const requestedUserId = asTrimmedString(body.userId) || asTrimmedString(body.user_id);

  if (requestedUserId) {
    try {
      const result = await createAutomaticOracleMessage(supabaseAdmin, requestedUserId, origin);
      return jsonResponse(origin, 200, {
        ok: true,
        processed: 1,
        generated: result.status === "generated" ? 1 : 0,
        skipped: result.status === "skipped" ? 1 : 0,
        errored: result.status === "error" ? 1 : 0,
        results: [{ userId: requestedUserId, ...result }],
      });
    } catch (error) {
      return jsonResponse(origin, 200, {
        ok: true,
        processed: 1,
        generated: 0,
        skipped: 0,
        errored: 1,
        results: [{ userId: requestedUserId, status: "error", reason: String(error) }],
      });
    }
  }

  const { data: eligiblePreferences, error: preferencesError } = await supabaseAdmin
    .from("oracle_preferences")
    .select("user_id")
    .eq("ia_enabled", true)
    .eq("notifications_enabled", true)
    .eq("daily_focus_card_enabled", true)
    .gt("presence_level", 0);

  if (preferencesError) {
    return jsonResponse(origin, 500, {
      error: "Failed to load eligible Oracle preferences.",
      details: preferencesError.message,
    });
  }

  const uniqueUserIds = Array.from(new Set(
    (eligiblePreferences || []).map((row) => asTrimmedString((row as JsonRecord).user_id)).filter(Boolean),
  ));

  const shuffledUserIds = uniqueUserIds
    .map((userId) => ({ userId, sortKey: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((entry) => entry.userId)
    .slice(0, limit);

  const results: Array<{ userId: string; status: string; reason?: string; messageId?: string }> = [];
  for (const userId of shuffledUserIds) {
    try {
      results.push({ userId, ...(await createAutomaticOracleMessage(supabaseAdmin, userId, origin)) });
    } catch (error) {
      results.push({ userId, status: "error", reason: String(error) });
    }
  }

  return jsonResponse(origin, 200, {
    ok: true,
    processed: shuffledUserIds.length,
    generated: results.filter((result) => result.status === "generated").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    errored: results.filter((result) => result.status === "error").length,
    results,
  });
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = isAllowedRequestOrigin(origin);
  const corsOrigin = origin && isAllowedOrigin ? origin : null;

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin) {
      return new Response("Forbidden origin", { status: 403, headers: buildCorsHeaders(corsOrigin) });
    }
    return new Response("ok", { headers: buildCorsHeaders(corsOrigin) });
  }

  if (!isAllowedOrigin) {
    return new Response("Forbidden origin", { status: 403, headers: buildCorsHeaders(corsOrigin) });
  }

  if (req.method !== "POST") {
    return jsonResponse(corsOrigin, 405, { error: "Method not allowed." });
  }

  const clonedRequest = req.clone();
  let body: JsonRecord = {};
  try {
    body = (await clonedRequest.json()) as JsonRecord;
  } catch (_error) {
    body = {};
  }

  if (asTrimmedString(body.action) === "generate-automatic-feed") {
    return handleAutomaticOracleCron(req, corsOrigin);
  }

  // O Oraculo nao conversa mais: nao ha IA nem chat. Sobrou o feed automatico,
  // que monta as falas a partir de texto escrito (_shared/oracle-lines.ts).
  return jsonResponse(corsOrigin, 410, { error: "Oracle chat was removed. Only generate-automatic-feed is served." });
});
