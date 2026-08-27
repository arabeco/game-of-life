import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { SignJWT, importPKCS8 } from "npm:jose@5.9.6";
import webpush from "npm:web-push@3.6.7";

type JsonRecord = Record<string, unknown>;
type NotificationPriority = "critical" | "actionable" | "progress" | "ambient";
type OracleAttentionProfile = "essencial" | "equilibrado" | "ativo";
type OracleMode =
  | "neutro"
  | "calmo"
  | "reflexivo"
  | "tatico"
  | "estrategico"
  | "coach"
  | "personalizado";
type AppMode = "BASIC" | "GAME";

type StoredPushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  subscription: JsonRecord;
  device_label?: string | null;
  failure_count?: number | null;
};

type NormalizedNotification = {
  id: string;
  userId: string;
  type: string;
  content: string;
  metadata: JsonRecord;
  read: boolean;
  createdAt: string;
};

type OraclePresentation = "ambient_pulse" | "info_card";

type NormalizedOracleMessage = {
  id: string;
  userId: string;
  content: string;
  mode: OracleMode;
  deliveryType: "feed" | "push" | "chat";
  read: boolean;
  contextSnapshot: JsonRecord;
  createdAt: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEB_PUSH_VAPID_PUBLIC_KEY = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
const WEB_PUSH_VAPID_PRIVATE_KEY = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") || "";
const WEB_PUSH_VAPID_SUBJECT = Deno.env.get("WEB_PUSH_VAPID_SUBJECT") || "mailto:oraculo@glyph.life";
const WEB_PUSH_WEBHOOK_SECRET = Deno.env.get("WEB_PUSH_WEBHOOK_SECRET") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://app.glyph.life";
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") || "";
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") || "";

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
};
const FCM_CLIENT_EMAIL = Deno.env.get("FCM_CLIENT_EMAIL") || "";
const FCM_PRIVATE_KEY = Deno.env.get("FCM_PRIVATE_KEY") || "";
const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://app.glyph.life,https://www.glyph.life,https://glyph.life,https://glyph-app-arabecos-projects.vercel.app,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const FCM_OAUTH_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const FCM_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

let cachedFcmAccessToken:
  | {
    token: string;
    expiresAt: number;
  }
  | null = null;

const POLICY: Record<string, { priority: NotificationPriority; basicVisible: boolean; gameVisible: boolean }> = {
  mentor_invite: { priority: "critical", basicVisible: true, gameVisible: true },
  direct_message: { priority: "actionable", basicVisible: true, gameVisible: true },
  friend_request: { priority: "critical", basicVisible: true, gameVisible: true },
  friend_response: { priority: "actionable", basicVisible: true, gameVisible: true },
  friend_accepted: { priority: "ambient", basicVisible: false, gameVisible: true },
  clan_invite: { priority: "critical", basicVisible: true, gameVisible: true },
  clan_response: { priority: "actionable", basicVisible: true, gameVisible: true },
  clan_join: { priority: "ambient", basicVisible: false, gameVisible: true },
  clan_mission_update: { priority: "critical", basicVisible: true, gameVisible: true },
  cycle_ending: { priority: "critical", basicVisible: true, gameVisible: true },
  cycle_finalized: { priority: "progress", basicVisible: false, gameVisible: true },
  season_ending: { priority: "critical", basicVisible: true, gameVisible: true },
  reward_ready: { priority: "actionable", basicVisible: true, gameVisible: true },
  mission_redeemable: { priority: "actionable", basicVisible: true, gameVisible: true },
  level_up: { priority: "progress", basicVisible: false, gameVisible: true },
  title_unlocked: { priority: "progress", basicVisible: false, gameVisible: true },
  oracle_prompt: { priority: "ambient", basicVisible: false, gameVisible: true },
  codex_gift: { priority: "actionable", basicVisible: true, gameVisible: true },
  partnership_invite: { priority: "critical", basicVisible: true, gameVisible: true },
  arena_access: { priority: "actionable", basicVisible: true, gameVisible: true },
  competition_result: { priority: "critical", basicVisible: true, gameVisible: true },
  action_reminder: { priority: "actionable", basicVisible: true, gameVisible: true },
  system: { priority: "critical", basicVisible: true, gameVisible: true },
};

const NOTIFICATION_PUSH_PRIORITIES: NotificationPriority[] = ["critical", "actionable"];

const MODE_PUSH_PROFILE: Record<OracleMode, OracleAttentionProfile> = {
  neutro: "equilibrado",
  calmo: "essencial",
  reflexivo: "essencial",
  tatico: "ativo",
  estrategico: "equilibrado",
  coach: "ativo",
  personalizado: "equilibrado",
};

const corsHeadersFor = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || ALLOWED_ORIGINS[0] || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-web-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "t"].includes(value.trim().toLowerCase());
  }
  return false;
};

const asNumber = (value: unknown, fallback = 0): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

type FcmServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

type PushDispatchPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
  icon: string;
  badge: string;
  requireInteraction: boolean;
  renotify: boolean;
  notificationId?: string;
  oracleMessageId?: string;
  type: string;
};

const resolveFcmServiceAccount = (): FcmServiceAccount | null => {
  if (FCM_SERVICE_ACCOUNT_JSON.trim()) {
    try {
      const parsed = JSON.parse(FCM_SERVICE_ACCOUNT_JSON);
      const projectId = asTrimmedString(parsed.project_id);
      const clientEmail = asTrimmedString(parsed.client_email);
      const privateKey = asTrimmedString(parsed.private_key).replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        return {
          projectId,
          clientEmail,
          privateKey,
        };
      }
    } catch (_error) {
      return null;
    }
  }

  const projectId = asTrimmedString(FCM_PROJECT_ID);
  const clientEmail = asTrimmedString(FCM_CLIENT_EMAIL);
  const privateKey = asTrimmedString(FCM_PRIVATE_KEY).replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

const hasFcmServerConfig = (): boolean => Boolean(resolveFcmServiceAccount());

const getFcmAccessToken = async (): Promise<string> => {
  const serviceAccount = resolveFcmServiceAccount();
  if (!serviceAccount) {
    throw new Error("Missing FCM service account configuration.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedFcmAccessToken && cachedFcmAccessToken.expiresAt > nowSeconds + 60) {
    return cachedFcmAccessToken.token;
  }

  const privateKey = await importPKCS8(serviceAccount.privateKey, "RS256");
  const assertion = await new SignJWT({ scope: FCM_OAUTH_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.clientEmail)
    .setSubject(serviceAccount.clientEmail)
    .setAudience(FCM_OAUTH_TOKEN_URL)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 3600)
    .sign(privateKey);

  const tokenResponse = await fetch(FCM_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const tokenText = await tokenResponse.text();
  let tokenPayload: JsonRecord = {};

  if (tokenText) {
    try {
      tokenPayload = JSON.parse(tokenText);
    } catch (_error) {
      tokenPayload = { error: tokenText };
    }
  }

  if (!tokenResponse.ok) {
    throw new Error(`FCM auth failed (${tokenResponse.status}): ${String(tokenPayload.error || tokenPayload.error_description || tokenText || "unknown_error")}`);
  }

  const accessToken = asTrimmedString(tokenPayload.access_token);
  const expiresIn = Number(tokenPayload.expires_in || 3600);
  if (!accessToken) {
    throw new Error("FCM auth returned an empty access token.");
  }

  cachedFcmAccessToken = {
    token: accessToken,
    expiresAt: nowSeconds + Math.max(60, expiresIn),
  };

  return accessToken;
};

const normalizeFcmDataValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

const shouldDisableFailedNativeSubscription = (statusCode: number | null, errorMessage: string): boolean => {
  if (statusCode === 404) return true;

  const normalized = errorMessage.toLowerCase();
  return normalized.includes("unregistered")
    || normalized.includes("registration token is not a valid fcm registration token")
    || normalized.includes("requested entity was not found")
    || normalized.includes("invalid registration token");
};

const sendNativePushNotification = async (
  subscriptionRow: StoredPushSubscription,
  payload: PushDispatchPayload,
) => {
  const serviceAccount = resolveFcmServiceAccount();
  if (!serviceAccount) {
    throw new Error("FCM server configuration is missing.");
  }

  const token = asTrimmedString(isRecord(subscriptionRow.subscription) ? subscriptionRow.subscription.token : "");
  if (!token) {
    throw new Error("Missing native push token in subscription row.");
  }

  const accessToken = await getFcmAccessToken();
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            url: normalizeFcmDataValue(payload.url),
            tag: normalizeFcmDataValue(payload.tag),
            type: normalizeFcmDataValue(payload.type),
            notificationId: normalizeFcmDataValue(payload.notificationId),
            oracleMessageId: normalizeFcmDataValue(payload.oracleMessageId),
            requireInteraction: normalizeFcmDataValue(payload.requireInteraction),
            renotify: normalizeFcmDataValue(payload.renotify),
          },
          android: {
            priority: "high",
            notification: {
              tag: payload.tag,
              click_action: "OPEN_APP",
            },
          },
        },
      }),
    },
  );

  const rawText = await response.text();
  let parsed: JsonRecord = {};

  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch (_error) {
      parsed = { raw: rawText };
    }
  }

  if (!response.ok) {
    const googleError = isRecord(parsed.error) ? parsed.error : {};
    const details = Array.isArray(googleError.details) ? googleError.details : [];
    const detailMessages = details
      .map((detail) => (isRecord(detail) ? asTrimmedString(detail.errorCode) || asTrimmedString(detail.message) : ""))
      .filter(Boolean);
    const message = asTrimmedString(googleError.message)
      || detailMessages.join(" | ")
      || rawText
      || `http_${response.status}`;

    throw new Error(`FCM send failed (${response.status}): ${message}`);
  }

  return {
    statusCode: response.status || 200,
    data: parsed,
  };
};

const isInvalidPushEndpoint = (endpoint: string): boolean => {
  const normalized = endpoint.trim();
  if (!normalized) return true;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    return hostname.endsWith(".invalid") || hostname === "permanently-removed.invalid";
  } catch (_error) {
    return true;
  }
};

const shouldDisableFailedSubscription = (statusCode: number | null, errorMessage: string): boolean => {
  if (statusCode === 404 || statusCode === 410) return true;

  const normalized = errorMessage.toLowerCase();
  return normalized.includes(".invalid")
    || normalized.includes("failed to lookup address information")
    || normalized.includes("dns error")
    || normalized.includes("enotfound")
    || normalized.includes("invalid subscription payload");
};

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return /^https:\/\/([a-z0-9-]+\.)?glyph\.life$/i.test(origin);
};

const jsonResponse = (origin: string | null, status: number, payload: JsonRecord) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeadersFor(origin),
      "Content-Type": "application/json",
    },
  });

const getSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase admin secrets.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return null;

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !data?.user) {
    return null;
  }

  return data.user;
};

const normalizeNotification = (payload: unknown): NormalizedNotification => {
  const root = isRecord(payload) ? payload : {};
  const record = isRecord(root.record)
    ? root.record
    : isRecord(root.new)
      ? root.new
      : root;

  return {
    id: asTrimmedString(record.id),
    userId: asTrimmedString(record.user_id) || asTrimmedString(record.userId),
    type: asTrimmedString(record.type) || "system",
    content: asTrimmedString(record.content),
    metadata: isRecord(record.metadata) ? record.metadata : {},
    read: asBoolean(record.read),
    createdAt: asTrimmedString(record.created_at) || asTrimmedString(record.createdAt) || new Date().toISOString(),
  };
};

const normalizeOracleMessage = (payload: unknown): NormalizedOracleMessage => {
  const root = isRecord(payload) ? payload : {};
  const record = isRecord(root.record)
    ? root.record
    : isRecord(root.new)
      ? root.new
      : root;

  const deliveryType = asTrimmedString(record.delivery_type) || asTrimmedString(record.deliveryType) || "feed";
  const rawMode = asTrimmedString(record.mode) || "neutro";
  const mode = ([
    "neutro",
    "calmo",
    "reflexivo",
    "tatico",
    "estrategico",
    "coach",
    "personalizado",
  ].includes(rawMode)
    ? rawMode
    : "neutro") as OracleMode;

  return {
    id: asTrimmedString(record.id),
    userId: asTrimmedString(record.user_id) || asTrimmedString(record.userId),
    content: asTrimmedString(record.content),
    mode,
    deliveryType: (deliveryType === "push" || deliveryType === "chat" ? deliveryType : "feed") as "feed" | "push" | "chat",
    read: asBoolean(record.read),
    createdAt: asTrimmedString(record.created_at) || asTrimmedString(record.createdAt) || new Date().toISOString(),
    contextSnapshot: isRecord(record.context_snapshot)
      ? record.context_snapshot
      : isRecord(record.contextSnapshot)
        ? record.contextSnapshot
        : {},
  };
};

const getNotificationTitle = (notification: NormalizedNotification): string => {
  const variantSeed = `${notification.id || notification.userId || ""}:${notification.createdAt || ""}:${notification.type}`;
  const pickVariant = (lines: string[]) => lines[Math.abs(hashString(variantSeed)) % lines.length] || lines[0];

  switch (notification.type) {
    case "cycle_ending":
      return pickVariant([
        "O ciclo esta entrando na reta final.",
        "A janela do ciclo ficou curta.",
        "Hora de salvar o que ainda importa.",
      ]);
    case "cycle_finalized":
      return pickVariant([
        "Ciclo fechado.",
        "Boa. Esse ciclo virou memoria.",
        "Relatorio pronto para guardar a fase.",
      ]);
    case "reward_ready":
    case "mission_redeemable":
      return pickVariant([
        "Tem recompensa esperando voce.",
        "Algo bom ficou pronto.",
        "Voce deixou valor acumulado.",
      ]);
    case "mentor_invite":
      return "Voce recebeu um convite de mentor.";
    case "direct_message":
      return asTrimmedString(notification.metadata.senderNickname) || "Nova mensagem direta.";
    case "clan_invite":
      if (notification.metadata?.joinRequest === true) {
        return "Novo pedido para o seu grupo.";
      }
      return "Voce recebeu um convite de grupo.";
    case "friend_request":
      return "Voce recebeu um convite de amizade.";
    case "friend_response":
      return "Seu convite de amizade foi respondido.";
    case "friend_accepted":
      return "Seu convite de amizade foi aceito.";
    case "clan_response":
      return "Seu pedido de grupo foi respondido.";
    case "clan_join":
      return "Seu pedido de grupo foi aceito.";
    case "clan_mission_update":
      return pickVariant([
        "Seu grupo mexeu uma peca.",
        "Tem movimento novo no grupo.",
        "A mesa do grupo mudou.",
      ]);
    case "season_ending":
      return pickVariant([
        "A temporada esta fechando.",
        "A janela da temporada ficou curta.",
        "Ultimos movimentos da temporada.",
      ]);
    case "level_up":
      return pickVariant([
        "Voce subiu de nivel.",
        "Nivel novo desbloqueado.",
        "O progresso apareceu no placar.",
      ]);
    case "title_unlocked":
      return "Voce desbloqueou um titulo.";
    case "oracle_prompt":
      return pickVariant([
        "O Oraculo cutucou de leve.",
        "Tenho um sinal rapido para voce.",
        "Vi uma coisa no seu mapa.",
      ]);
    case "codex_gift":
      return "Uma campanha chegou para voce.";
    case "partnership_invite":
      return "Voce recebeu um convite de parceria.";
    case "arena_access":
      return "Uma nova arena foi compartilhada.";
    case "competition_result":
      return "Seu duelo recebeu um desfecho.";
    case "action_reminder":
      return pickVariant([
        "Sua acao esta chegando.",
        "Esta quase na hora de entrar.",
        "Prepara o terreno: a acao vem ai.",
      ]);
    default:
      return pickVariant([
        "Tem um sinal novo no Glyph.",
        "Algo mudou no seu mapa.",
        "Glyph trouxe uma atualizacao.",
      ]);
  }
};

const getNotificationBody = (notification: NormalizedNotification): string => {
  if (notification.type === "direct_message") {
    return asTrimmedString(notification.metadata.messagePreview)
      || notification.content
      || "Uma nova mensagem direta chegou para voce.";
  }

  if (notification.content) return notification.content;
  const variantSeed = `${notification.id || notification.userId || ""}:${notification.createdAt || ""}:${notification.type}:body`;
  const pickVariant = (lines: string[]) => lines[Math.abs(hashString(variantSeed)) % lines.length] || lines[0];

  switch (notification.type) {
    case "cycle_ending":
      return pickVariant([
        "Nao tenta salvar tudo. Escolhe uma entrega real e fecha uma prova.",
        "O tempo encurtou. Corta excesso e protege o que ainda muda o ciclo.",
        "Uma acao certa agora vale mais que redesenhar o plano inteiro.",
      ]);
    case "cycle_finalized":
      return pickVariant([
        "O que foi feito agora tem registro. Abre o relatorio quando quiser revisar.",
        "Fase fechada. Guarda a leitura antes de abrir o proximo mapa.",
        "Boa. O ciclo saiu da cabeca e virou historico.",
      ]);
    case "codex_gift":
      return pickVariant([
        "Uma campanha nova chegou para a sua biblioteca.",
        "Tem caminho pronto esperando instalacao.",
        "Alguem te mandou uma campanha para usar quando fizer sentido.",
      ]);
    case "direct_message":
      return notification.content || "Uma nova mensagem direta chegou para voce.";
    case "competition_result":
      return pickVariant([
        "O duelo recebeu um desfecho.",
        "Tem resultado novo esperando no desafio.",
        "A competicao virou resultado. Vale conferir.",
      ]);
    case "action_reminder":
      return pickVariant([
        "Arruma o minimo em volta e entra sem renegociar.",
        "Comeca pequeno. O importante e nao transformar isso em conversa interna.",
        "Se ainda faz sentido, prepara o ambiente e executa.",
      ]);
    case "reward_ready":
    case "mission_redeemable":
      return pickVariant([
        "Abre quando puder. Recompensa parada tambem e energia sem uso.",
        "Tem ganho esperando coleta. Nada dramatico, so nao deixa sumir do radar.",
        "Voce ja fez a parte dificil. Agora pega o retorno.",
      ]);
    case "oracle_prompt":
      return pickVariant([
        "Nao e relatorio. E so uma coisa dominante para decidir o proximo movimento.",
        "Prometo nao listar doze assuntos. Olha so o sinal principal.",
        "Tem uma leitura curta esperando voce no Oraculo.",
      ]);
    default:
      return pickVariant([
        "Abre quando puder e resolve em uma passada.",
        "Tem algo esperando leitura, sem precisar quebrar o seu fluxo agora.",
        "O app separou isso para voce nao precisar catar depois.",
      ]);
  }
};

const resolveDirectMessagePushPresentation = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  notification: NormalizedNotification,
) => {
  const fallbackTitle = getNotificationTitle(notification);
  const fallbackBody = getNotificationBody(notification);
  const senderId = asTrimmedString(notification.metadata.senderId);
  const senderNickname = asTrimmedString(notification.metadata.senderNickname) || fallbackTitle;

  const { data } = await supabaseAdmin
    .from("notifications")
      .select("metadata, read")
      .eq("user_id", notification.userId)
      .eq("type", "direct_message")
      .eq("read", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const unreadRows = Array.isArray(data) ? data.filter((row) => !asBoolean(row?.read)) : [];
  const unreadSenderIds = unreadRows
    .map((row) => asTrimmedString(isRecord(row?.metadata) ? row.metadata.senderId : ""))
    .filter(Boolean);
  const uniqueSenderIds = Array.from(new Set(unreadSenderIds));
  const unreadCount = unreadRows.length || 1;
  const sameSender = uniqueSenderIds.length <= 1;
  const directMessageUrl = senderId
    ? `/?oracle=dms&participant=${encodeURIComponent(senderId)}`
    : "/?oracle=dms";

  if (unreadCount <= 1) {
    return {
      title: senderNickname,
      body: fallbackBody,
      tag: senderId ? `glyph-direct-message-${senderId}` : `glyph-direct-message-${notification.userId}`,
      renotify: false,
      url: directMessageUrl,
    };
  }

  return {
    title: sameSender ? senderNickname : "Mensagens diretas",
    body: sameSender ? `${unreadCount} mensagens nao lidas` : `${unreadCount} mensagens diretas nao lidas`,
    tag: sameSender && senderId
      ? `glyph-direct-message-${senderId}`
      : `glyph-direct-message-${notification.userId}`,
    renotify: true,
    url: sameSender ? directMessageUrl : "/?oracle=dms",
  };
};

const getOracleMessageTitle = (message: NormalizedOracleMessage): string => {
  const presentation = (asTrimmedString(message.contextSnapshot.presentation) || "ambient_pulse") as OraclePresentation;
  const pickVariant = (lines: string[]) => lines[Math.abs(hashString(`${message.id}:${message.createdAt}:oracle-title`)) % lines.length] || lines[0];
  if (presentation === "info_card") {
    return pickVariant([
      "O Oraculo deixou um card.",
      "Tem uma leitura nova no Oraculo.",
      "Um sinal virou card para voce.",
    ]);
  }

  switch (message.mode) {
    case "coach":
      return pickVariant(["O Oraculo cutucou voce.", "Sem drama: so uma acao.", "Tenho um empurrao curto."]);
    case "tatico":
      return pickVariant(["Movimento tatico na mesa.", "Tem proximo passo claro.", "O mapa pediu foco."]);
    case "estrategico":
      return pickVariant(["Olha a estrategia do ciclo.", "Tem uma escolha importante aqui.", "O ciclo pediu decisao."]);
    case "calmo":
      return pickVariant(["Respira. Uma coisa por vez.", "Sem pressa, mas com direcao.", "Volta pelo menor passo."]);
    case "reflexivo":
      return pickVariant(["Tem um padrao aparecendo.", "Vi um sinal no seu ritmo.", "Uma leitura curta para voce."]);
    case "personalizado":
      return pickVariant(["Falei no seu modo.", "Um sinal no tom que voce escolheu.", "O Oraculo adaptou a leitura."]);
    case "neutro":
    default:
      return pickVariant(["O Oraculo tem um sinal.", "Tem leitura nova para voce.", "Vi algo no seu mapa."]);
  }
};

const getOracleMessageBody = (message: NormalizedOracleMessage): string => {
  const normalized = (message.content || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    const variants = [
      "Tem uma leitura curta esperando voce.",
      "Escolhi um sinal dominante. Sem relatorio longo.",
      "Olha isso antes de abrir mais uma frente.",
    ];
    return variants[Math.abs(hashString(`${message.id}:${message.createdAt}:oracle-empty`)) % variants.length];
  }

  return normalized.length > 180
    ? `${normalized.slice(0, 177).trimEnd()}...`
    : normalized;
};

const shouldPushNotification = (
  notification: NormalizedNotification,
  appMode: AppMode,
  activeMode: OracleMode,
): boolean => {
  void activeMode;
  if (notification.read) return false;

  const policy = POLICY[notification.type] || POLICY.system;
  if (appMode === "BASIC" && !policy.basicVisible) return false;
  if (appMode !== "BASIC" && !policy.gameVisible) return false;

  return NOTIFICATION_PUSH_PRIORITIES.includes(policy.priority);
};

const shouldPushOracleMessage = (
  message: NormalizedOracleMessage,
  appMode: AppMode,
  dailyFocusCardEnabled: boolean,
  presenceLevel: number,
): boolean => {
  if (message.read) {
    return false;
  }

  // Duas coisas passam por aqui, e sao coisas diferentes:
  //   'feed' — o card de infos, conteudo com cota propria;
  //   'chat' com purpose 'oracle_speech' — a fala do Oraculo.
  // A fala so virou push agora. Antes ela era um evento de janela que pintava um
  // balao por cinco segundos e evaporava: quem estava com o celular no bolso
  // simplesmente nao recebia, embora o combinado fosse que desligar o aviso
  // tirasse a fala do celular, nao que a apagasse.
  const isOracleSpeech = message.deliveryType === "chat"
    && asTrimmedString(message.contextSnapshot.purpose) === "oracle_speech";

  if (message.deliveryType !== "feed" && !isOracleSpeech) {
    return false;
  }

  const triggerType = asTrimmedString(message.contextSnapshot.triggerType);
  if (triggerType === "manual") {
    return false;
  }

  // A fala nao passa pelo perfil de push do modo, que existe para graduar quanto
  // do CONTEUDO pago vira aviso. Ela ja foi filtrada pela presenca no cliente
  // antes de ser gravada; aqui so falta o interruptor, ja conferido acima.
  if (isOracleSpeech) {
    return presenceLevel > 0;
  }

  // A presenca decide O QUE o Oraculo fala; quem decide se aquilo vira aviso no
  // aparelho e o interruptor de avisos, conferido antes de chegar aqui. Este
  // portao exigia presenca 3, entao quem estava no Equilibrado recebia o card e
  // nunca o aviso — duas regras para a mesma decisao, em lugares diferentes.
  // Silencioso nao gera card, entao nao chega ate aqui de qualquer forma.
  if (presenceLevel <= 0) {
    return false;
  }

  if (appMode === "BASIC" && dailyFocusCardEnabled) {
    return true;
  }

  const modePushProfile = MODE_PUSH_PROFILE[message.mode] || "equilibrado";
  if (modePushProfile === "essencial") {
    return false;
  }

  const presentation = (asTrimmedString(message.contextSnapshot.presentation) || "ambient_pulse") as OraclePresentation;
  if (modePushProfile === "equilibrado") {
    return presentation === "info_card";
  }

  return true;
};

const configureVapid = () => {
  if (!WEB_PUSH_VAPID_PUBLIC_KEY || !WEB_PUSH_VAPID_PRIVATE_KEY) {
    throw new Error("Missing WEB_PUSH_VAPID_PUBLIC_KEY or WEB_PUSH_VAPID_PRIVATE_KEY.");
  }

  webpush.setVapidDetails(
    WEB_PUSH_VAPID_SUBJECT,
    WEB_PUSH_VAPID_PUBLIC_KEY,
    WEB_PUSH_VAPID_PRIVATE_KEY,
  );
};

const reservePushDispatch = async (
  notificationId: string,
  subscriptionId: string,
  userId: string,
): Promise<boolean> => {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("notification_push_dispatches")
    .insert({
      notification_id: notificationId,
      subscription_id: subscriptionId,
      user_id: userId,
      status: "pending",
    });

  if (!error) return true;

  const duplicate =
    error.code === "23505" ||
    String(error.message || "").toLowerCase().includes("duplicate");

  if (duplicate) {
    return false;
  }

  throw error;
};

const reserveOraclePushDispatch = async (
  messageId: string,
  subscriptionId: string,
  userId: string,
): Promise<boolean> => {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("oracle_message_push_dispatches")
    .insert({
      message_id: messageId,
      subscription_id: subscriptionId,
      user_id: userId,
      status: "pending",
    });

  if (!error) return true;

  const duplicate =
    error.code === "23505" ||
    String(error.message || "").toLowerCase().includes("duplicate");

  if (duplicate) {
    return false;
  }

  throw error;
};

const markDispatchResult = async (
  notificationId: string,
  subscriptionId: string,
  patch: JsonRecord,
) => {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin
    .from("notification_push_dispatches")
    .update(patch)
    .eq("notification_id", notificationId)
    .eq("subscription_id", subscriptionId);
};

const markOracleDispatchResult = async (
  messageId: string,
  subscriptionId: string,
  patch: JsonRecord,
) => {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin
    .from("oracle_message_push_dispatches")
    .update(patch)
    .eq("message_id", messageId)
    .eq("subscription_id", subscriptionId);
};

const updateSubscriptionHealth = async (subscriptionId: string, patch: JsonRecord) => {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin
    .from("push_subscriptions")
    .update(patch)
    .eq("id", subscriptionId);
};

const normalizeStoredSubscription = (row: StoredPushSubscription): JsonRecord | null => {
  if (!isRecord(row.subscription)) return null;
  const endpoint = asTrimmedString(row.subscription.endpoint) || asTrimmedString(row.endpoint);
  const keys = isRecord(row.subscription.keys) ? row.subscription.keys : {};
  if (!endpoint || isInvalidPushEndpoint(endpoint) || !asTrimmedString(keys.p256dh) || !asTrimmedString(keys.auth)) return null;

  return {
    endpoint,
    expirationTime: row.subscription.expirationTime ?? null,
    keys: {
      p256dh: asTrimmedString(keys.p256dh),
      auth: asTrimmedString(keys.auth),
    },
  };
};

const isNativeTokenSubscription = (row: StoredPushSubscription): boolean => {
  if (!isRecord(row.subscription)) return false;
  return asTrimmedString(row.subscription.kind) === "native_token";
};

const getDeliverySubscriptions = (subscriptions: StoredPushSubscription[]): StoredPushSubscription[] => {
  return subscriptions;
};

const deliverPushToSubscription = async (
  subscriptionRow: StoredPushSubscription,
  payload: PushDispatchPayload,
) => {
  if (isNativeTokenSubscription(subscriptionRow)) {
    return await sendNativePushNotification(subscriptionRow, payload);
  }

  const pushSubscription = normalizeStoredSubscription(subscriptionRow);
  if (!pushSubscription) {
    throw new Error("invalid_subscription_payload");
  }

  return await webpush.sendNotification(pushSubscription as any, JSON.stringify(payload));
};

const registerSubscription = async (req: Request, body: JsonRecord, origin: string | null) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse(origin, 401, { error: "Unauthorized request." });
  }

  const subscription = isRecord(body.subscription) ? body.subscription : null;
  const endpoint = asTrimmedString(subscription?.endpoint);
  if (!subscription || !endpoint) {
    return jsonResponse(origin, 400, { error: "Missing push subscription payload." });
  }
  if (isInvalidPushEndpoint(endpoint)) {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("push_subscriptions")
      .update({
        disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: "invalid_endpoint_registration_rejected",
      })
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);

    return jsonResponse(origin, 400, { error: "Invalid push subscription endpoint." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert({
      user_id: user.id,
      endpoint,
      subscription,
      user_agent: asTrimmedString(body.userAgent),
      device_label: asTrimmedString(body.deviceLabel) || "glyph-web",
      disabled_at: null,
      last_seen_at: now,
      updated_at: now,
      failure_count: 0,
      last_error: null,
    }, {
      onConflict: "endpoint",
    });

  if (error) {
    return jsonResponse(origin, 500, { error: error.message || "Could not register subscription." });
  }

  return jsonResponse(origin, 200, { success: true });
};

const unregisterSubscription = async (req: Request, body: JsonRecord, origin: string | null) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse(origin, 401, { error: "Unauthorized request." });
  }

  const endpoint = asTrimmedString(body.endpoint)
    || asTrimmedString(isRecord(body.subscription) ? body.subscription.endpoint : "");

  if (!endpoint) {
    return jsonResponse(origin, 400, { error: "Missing subscription endpoint." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .update({
      disabled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return jsonResponse(origin, 500, { error: error.message || "Could not unregister subscription." });
  }

  return jsonResponse(origin, 200, { success: true });
};

const registerNativeSubscription = async (req: Request, body: JsonRecord, origin: string | null) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse(origin, 401, { error: "Unauthorized request." });
  }

  const token = asTrimmedString(body.token);
  const platform = asTrimmedString(body.platform) || "android";
  const userAgent = asTrimmedString(body.userAgent);
  const deviceLabel = asTrimmedString(body.deviceLabel) || `glyph-${platform}-native`;
  const legacyDeviceLabel = `glyph-${platform}-native`;
  if (!token) {
    return jsonResponse(origin, 400, { error: "Missing native push token." });
  }

  const endpoint = `native:${platform}:${token}`;
  const subscription = {
    kind: "native_token",
    platform,
    token,
  };

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date().toISOString();
  let cleanupQuery = supabaseAdmin
    .from("push_subscriptions")
    .update({
      disabled_at: now,
      updated_at: now,
      last_error: "superseded_by_new_native_token",
    })
    .eq("user_id", user.id)
    .is("disabled_at", null)
    .neq("endpoint", endpoint)
    .like("endpoint", `native:${platform}:%`);

  if (userAgent) {
    cleanupQuery = cleanupQuery.eq("user_agent", userAgent);
  } else {
    cleanupQuery = cleanupQuery.eq("device_label", deviceLabel);
  }

  await cleanupQuery;

  if (legacyDeviceLabel !== deviceLabel) {
    await supabaseAdmin
      .from("push_subscriptions")
      .update({
        disabled_at: now,
        updated_at: now,
        last_error: "superseded_by_new_native_token",
      })
      .eq("user_id", user.id)
      .eq("device_label", legacyDeviceLabel)
      .is("disabled_at", null)
      .neq("endpoint", endpoint)
      .like("endpoint", `native:${platform}:%`);
  }

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert({
      user_id: user.id,
      endpoint,
      subscription,
      user_agent: userAgent,
      device_label: deviceLabel,
      disabled_at: null,
      last_seen_at: now,
      updated_at: now,
      failure_count: 0,
      last_error: null,
    }, {
      onConflict: "endpoint",
    });

  if (error) {
    return jsonResponse(origin, 500, { error: error.message || "Could not register native token." });
  }

  return jsonResponse(origin, 200, {
    success: true,
    delivery: hasFcmServerConfig() ? "fcm_ready" : "pending_fcm_server",
  });
};

const unregisterNativeSubscription = async (req: Request, body: JsonRecord, origin: string | null) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse(origin, 401, { error: "Unauthorized request." });
  }

  const token = asTrimmedString(body.token);
  const platform = asTrimmedString(body.platform) || "android";
  const userAgent = asTrimmedString(body.userAgent);
  const deviceLabel = asTrimmedString(body.deviceLabel) || "";
  if (!token) {
    return jsonResponse(origin, 400, { error: "Missing native push token." });
  }

  const endpoint = `native:${platform}:${token}`;
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .update({
      disabled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (!error && deviceLabel) {
    let cleanupQuery = supabaseAdmin
      .from("push_subscriptions")
      .update({
        disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("device_label", deviceLabel)
      .is("disabled_at", null)
      .like("endpoint", `native:${platform}:%`);

    if (userAgent) {
      cleanupQuery = cleanupQuery.eq("user_agent", userAgent);
    }

    await cleanupQuery;
  }

  if (error) {
    return jsonResponse(origin, 500, { error: error.message || "Could not unregister native token." });
  }

  return jsonResponse(origin, 200, { success: true });
};

const dispatchTestPush = async (req: Request, _body: JsonRecord, origin: string | null) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse(origin, 401, { error: "Unauthorized request." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, subscription, device_label, failure_count")
    .eq("user_id", user.id)
    .is("disabled_at", null);

  if (subscriptionsError) {
    return jsonResponse(origin, 500, { error: subscriptionsError.message || "Could not load subscriptions." });
  }

  const activeSubscriptions = getDeliverySubscriptions((subscriptions || []) as StoredPushSubscription[]);
  if (activeSubscriptions.length === 0) {
    return jsonResponse(origin, 200, {
      success: false,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: "no_active_subscriptions",
    });
  }

  const hasWebSubscription = activeSubscriptions.some((subscriptionRow) => !isNativeTokenSubscription(subscriptionRow));
  if (hasWebSubscription) {
    configureVapid();
  }

  const payload: PushDispatchPayload = {
    title: "Teste GLYPH",
    body: "Se isso chegou no aparelho, a trilha de push esta viva.",
    tag: `glyph-push-test-${user.id}`,
    url: "/?oracle=notifications",
    icon: "/logo-diamond.png",
    badge: "/logo-diamond.png",
    requireInteraction: false,
    renotify: true,
    type: "system",
  };

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const subscriptionRow of activeSubscriptions) {
    const isNativeSubscription = isNativeTokenSubscription(subscriptionRow);
    const pushSubscription = isNativeSubscription ? {} : normalizeStoredSubscription(subscriptionRow);
    const nativeToken = isNativeSubscription
      ? asTrimmedString(isRecord(subscriptionRow.subscription) ? subscriptionRow.subscription.token : "")
      : "";

    if ((!isNativeSubscription && !pushSubscription) || (isNativeSubscription && !nativeToken)) {
      skipped += 1;
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: isNativeSubscription ? "invalid_native_token_payload" : "invalid_subscription_payload",
        disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      continue;
    }

    try {
      await deliverPushToSubscription(subscriptionRow, payload);
      sent += 1;
      await updateSubscriptionHealth(subscriptionRow.id, {
        last_success_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        failure_count: 0,
        last_error: null,
        disabled_at: null,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      failed += 1;
      const statusCode = Number((error as { statusCode?: number })?.statusCode || 0) || null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      const disableSubscription = isNativeSubscription
        ? shouldDisableFailedNativeSubscription(statusCode, errorMessage)
        : shouldDisableFailedSubscription(statusCode, errorMessage);
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: errorMessage,
        last_seen_at: new Date().toISOString(),
        disabled_at: disableSubscription ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return jsonResponse(origin, 200, {
    success: sent > 0,
    sent,
    skipped,
    failed,
    detail: errors.slice(0, 2).join(" | "),
  });
};

const dispatchNotification = async (req: Request, body: JsonRecord, origin: string | null) => {
  if (!WEB_PUSH_WEBHOOK_SECRET || req.headers.get("x-web-push-secret") !== WEB_PUSH_WEBHOOK_SECRET) {
    return jsonResponse(origin, 401, { error: "Invalid webhook secret." });
  }

  const notification = normalizeNotification(body);
  if (!notification.id || !notification.userId) {
    return jsonResponse(origin, 400, { error: "Invalid notification payload." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: subscriptions, error: subscriptionsError }, { data: preferenceRow }, { data: profileRow }] = await Promise.all([
    supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, subscription, device_label, failure_count")
      .eq("user_id", notification.userId)
      .is("disabled_at", null),
    supabaseAdmin
      .from("oracle_preferences")
      .select("active_mode, notifications_enabled, dm_notifications_enabled")
      .eq("user_id", notification.userId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_profiles")
      .select("app_mode")
      .eq("id", notification.userId)
      .maybeSingle(),
  ]);

  if (subscriptionsError) {
    return jsonResponse(origin, 500, { error: subscriptionsError.message || "Could not load subscriptions." });
  }

  if (preferenceRow?.notifications_enabled === false) {
    return jsonResponse(origin, 200, { skipped: true, reason: "notifications_disabled" });
  }

  if (notification.type === "direct_message" && preferenceRow?.dm_notifications_enabled === false) {
    return jsonResponse(origin, 200, { skipped: true, reason: "dm_notifications_disabled" });
  }

  const appMode = (asTrimmedString(profileRow?.app_mode) === "BASIC" ? "BASIC" : "GAME") as AppMode;
  const activeMode = (asTrimmedString(preferenceRow?.active_mode) || "neutro") as OracleMode;
  if (!shouldPushNotification(notification, appMode, activeMode)) {
    return jsonResponse(origin, 200, { skipped: true, reason: "policy_filtered" });
  }

  const activeSubscriptions = getDeliverySubscriptions((subscriptions || []) as StoredPushSubscription[]);
  if (activeSubscriptions.length === 0) {
    return jsonResponse(origin, 200, { skipped: true, reason: "no_active_subscriptions" });
  }

  if (activeSubscriptions.some((subscriptionRow) => !isNativeTokenSubscription(subscriptionRow))) {
    configureVapid();
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscriptionRow of activeSubscriptions) {
    const isNativeSubscription = isNativeTokenSubscription(subscriptionRow);
    const pushSubscription = isNativeSubscription ? {} : normalizeStoredSubscription(subscriptionRow);
    const nativeToken = isNativeSubscription
      ? asTrimmedString(isRecord(subscriptionRow.subscription) ? subscriptionRow.subscription.token : "")
      : "";

    if ((!isNativeSubscription && !pushSubscription) || (isNativeSubscription && !nativeToken)) {
      skipped += 1;
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: isNativeSubscription ? "invalid_native_token_payload" : "invalid_subscription_payload",
        disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      continue;
    }

    const reserved = await reservePushDispatch(notification.id, subscriptionRow.id, notification.userId);
    if (!reserved) {
      skipped += 1;
      continue;
    }

    const directMessagePresentation = notification.type === "direct_message"
      ? await resolveDirectMessagePushPresentation(supabaseAdmin, notification)
      : null;
    const payload = {
      title: directMessagePresentation?.title || getNotificationTitle(notification),
      body: directMessagePresentation?.body || getNotificationBody(notification),
      tag: directMessagePresentation?.tag || `glyph-notification-${notification.id}`,
      url: directMessagePresentation?.url || asTrimmedString(notification.metadata.url) || (notification.type === "action_reminder" ? "/?view=planner" : "/?oracle=notifications"),
      icon: "/logo-diamond.png",
      badge: "/logo-diamond.png",
      requireInteraction: (POLICY[notification.type] || POLICY.system).priority === "critical",
      renotify: Boolean(directMessagePresentation?.renotify),
      notificationId: notification.id,
      type: notification.type,
    };

    try {
      const result = await deliverPushToSubscription(subscriptionRow, payload);
      sent += 1;

      await markDispatchResult(notification.id, subscriptionRow.id, {
        status: "sent",
        response_code: result.statusCode || 201,
        error_message: null,
        sent_at: new Date().toISOString(),
      });

      await updateSubscriptionHealth(subscriptionRow.id, {
        last_success_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        failure_count: 0,
        last_error: null,
        disabled_at: null,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      failed += 1;
      const statusCode = Number((error as { statusCode?: number })?.statusCode || 0) || null;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await markDispatchResult(notification.id, subscriptionRow.id, {
        status: "error",
        response_code: statusCode,
        error_message: errorMessage,
        sent_at: null,
      });

      const disableSubscription = isNativeSubscription
        ? shouldDisableFailedNativeSubscription(statusCode, errorMessage)
        : shouldDisableFailedSubscription(statusCode, errorMessage);
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: errorMessage,
        last_seen_at: new Date().toISOString(),
        disabled_at: disableSubscription ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return jsonResponse(origin, 200, {
    success: true,
    sent,
    skipped,
    failed,
  });
};

const dispatchOracleMessage = async (req: Request, body: JsonRecord, origin: string | null) => {
  if (!WEB_PUSH_WEBHOOK_SECRET || req.headers.get("x-web-push-secret") !== WEB_PUSH_WEBHOOK_SECRET) {
    return jsonResponse(origin, 401, { error: "Invalid webhook secret." });
  }

  const message = normalizeOracleMessage(body);
  if (!message.id || !message.userId) {
    return jsonResponse(origin, 400, { error: "Invalid oracle message payload." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: subscriptions, error: subscriptionsError }, { data: preferenceRow }, { data: profileRow }] = await Promise.all([
    supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, subscription, device_label, failure_count")
      .eq("user_id", message.userId)
      .is("disabled_at", null),
    supabaseAdmin
      .from("oracle_preferences")
      .select("notifications_enabled, daily_focus_card_enabled, presence_level")
      .eq("user_id", message.userId)
      .maybeSingle(),
    supabaseAdmin
      .from("user_profiles")
      .select("app_mode")
      .eq("id", message.userId)
      .maybeSingle(),
  ]);

  if (subscriptionsError) {
    return jsonResponse(origin, 500, { error: subscriptionsError.message || "Could not load subscriptions." });
  }

  if (preferenceRow?.notifications_enabled === false) {
    return jsonResponse(origin, 200, { skipped: true, reason: "notifications_disabled" });
  }

  const appMode: AppMode = asTrimmedString(profileRow?.app_mode) === "BASIC" ? "BASIC" : "GAME";
  const dailyFocusCardEnabled = preferenceRow?.daily_focus_card_enabled === true;
  const presenceLevel = clamp(Math.round(asNumber(preferenceRow?.presence_level, 1)), 0, 3);

  if (!shouldPushOracleMessage(message, appMode, dailyFocusCardEnabled, presenceLevel)) {
    return jsonResponse(origin, 200, { skipped: true, reason: "policy_filtered" });
  }

  const activeSubscriptions = getDeliverySubscriptions((subscriptions || []) as StoredPushSubscription[]);
  if (activeSubscriptions.length === 0) {
    return jsonResponse(origin, 200, { skipped: true, reason: "no_active_subscriptions" });
  }

  if (activeSubscriptions.some((subscriptionRow) => !isNativeTokenSubscription(subscriptionRow))) {
    configureVapid();
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscriptionRow of activeSubscriptions) {
    const isNativeSubscription = isNativeTokenSubscription(subscriptionRow);
    const pushSubscription = isNativeSubscription ? {} : normalizeStoredSubscription(subscriptionRow);
    const nativeToken = isNativeSubscription
      ? asTrimmedString(isRecord(subscriptionRow.subscription) ? subscriptionRow.subscription.token : "")
      : "";

    if ((!isNativeSubscription && !pushSubscription) || (isNativeSubscription && !nativeToken)) {
      skipped += 1;
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: isNativeSubscription ? "invalid_native_token_payload" : "invalid_subscription_payload",
        disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      continue;
    }

    const reserved = await reserveOraclePushDispatch(message.id, subscriptionRow.id, message.userId);
    if (!reserved) {
      skipped += 1;
      continue;
    }

    const presentation = (asTrimmedString(message.contextSnapshot.presentation) || "ambient_pulse") as OraclePresentation;
    const payload = {
      title: getOracleMessageTitle(message),
      body: getOracleMessageBody(message),
      tag: `glyph-notification-${message.id}`,
      url: "/?oracle=chat",
      icon: "/logo-diamond.png",
      badge: "/logo-diamond.png",
      requireInteraction: presentation === "info_card",
      renotify: presentation === "info_card",
      notificationId: message.id,
      oracleMessageId: message.id,
      type: "oracle_prompt",
    };

    try {
      const result = await deliverPushToSubscription(subscriptionRow, payload);
      sent += 1;

      await markOracleDispatchResult(message.id, subscriptionRow.id, {
        status: "sent",
        response_code: result.statusCode || 201,
        error_message: null,
        sent_at: new Date().toISOString(),
      });

      await updateSubscriptionHealth(subscriptionRow.id, {
        last_success_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        failure_count: 0,
        last_error: null,
        disabled_at: null,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      failed += 1;
      const statusCode = Number((error as { statusCode?: number })?.statusCode || 0) || null;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await markOracleDispatchResult(message.id, subscriptionRow.id, {
        status: "error",
        response_code: statusCode,
        error_message: errorMessage,
        sent_at: null,
      });

      const disableSubscription = isNativeSubscription
        ? shouldDisableFailedNativeSubscription(statusCode, errorMessage)
        : shouldDisableFailedSubscription(statusCode, errorMessage);
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: errorMessage,
        last_seen_at: new Date().toISOString(),
        disabled_at: disableSubscription ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return jsonResponse(origin, 200, {
    success: true,
    sent,
    skipped,
    failed,
  });
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new Response("Forbidden origin", { status: 403, headers: corsHeaders });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isAllowedOrigin(origin)) {
    return new Response("Forbidden origin", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(origin, 405, { error: "Method not allowed." });
  }

  let body: JsonRecord = {};
  try {
    const parsed = await req.json();
    body = isRecord(parsed) ? parsed : {};
  } catch (_error) {
    return jsonResponse(origin, 400, { error: "Invalid JSON body." });
  }

  const action = asTrimmedString(body.action);

  try {
    if (action === "register") {
      return await registerSubscription(req, body, origin);
    }

    if (action === "unregister") {
      return await unregisterSubscription(req, body, origin);
    }

    if (action === "register_native") {
      return await registerNativeSubscription(req, body, origin);
    }

    if (action === "unregister_native") {
      return await unregisterNativeSubscription(req, body, origin);
    }

    if (action === "dispatch-test") {
      return await dispatchTestPush(req, body, origin);
    }

    if (action === "dispatch-notification") {
      return await dispatchNotification(req, body, origin);
    }

    if (action === "dispatch-oracle-message") {
      return await dispatchOracleMessage(req, body, origin);
    }

    return jsonResponse(origin, 400, { error: "Unknown action." });
  } catch (error) {
    return jsonResponse(origin, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
