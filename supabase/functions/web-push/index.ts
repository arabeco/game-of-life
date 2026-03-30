import { createClient } from "npm:@supabase/supabase-js@2.45.0";
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
  failure_count?: number | null;
};

type NormalizedNotification = {
  id: string;
  userId: string;
  type: string;
  content: string;
  metadata: JsonRecord;
  read: boolean;
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
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEB_PUSH_VAPID_PUBLIC_KEY = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
const WEB_PUSH_VAPID_PRIVATE_KEY = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") || "";
const WEB_PUSH_VAPID_SUBJECT = Deno.env.get("WEB_PUSH_VAPID_SUBJECT") || "mailto:oraculo@glyph.life";
const WEB_PUSH_WEBHOOK_SECRET = Deno.env.get("WEB_PUSH_WEBHOOK_SECRET") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://app.glyph.life";
const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://app.glyph.life,https://www.glyph.life,https://glyph.life,https://glyph-app-arabecos-projects.vercel.app,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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

const PROFILE_PUSH: Record<OracleAttentionProfile, NotificationPriority[]> = {
  essencial: ["critical"],
  equilibrado: ["critical", "actionable"],
  ativo: ["critical", "actionable", "ambient"],
};

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
    contextSnapshot: isRecord(record.context_snapshot)
      ? record.context_snapshot
      : isRecord(record.contextSnapshot)
        ? record.contextSnapshot
        : {},
  };
};

const getNotificationTitle = (notification: NormalizedNotification): string => {
  switch (notification.type) {
    case "cycle_ending":
      return "Seu ciclo esta proximo do fim.";
    case "cycle_finalized":
      return "Parabens! Seu ciclo foi finalizado.";
    case "reward_ready":
    case "mission_redeemable":
      return "Voce tem novas recompensas.";
    case "mentor_invite":
      return "Voce recebeu um convite de mentor.";
    case "direct_message":
      return asTrimmedString(notification.metadata.senderNickname) || "Nova mensagem direta.";
    case "clan_invite":
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
      return "Seu grupo precisa de voce.";
    case "season_ending":
      return "A temporada esta acabando.";
    case "level_up":
      return "Voce subiu de nivel.";
    case "title_unlocked":
      return "Voce desbloqueou um titulo.";
    case "oracle_prompt":
      return "O Oraculo chamou sua atencao.";
    case "codex_gift":
      return "Uma campanha chegou para voce.";
    case "partnership_invite":
      return "Voce recebeu um convite de parceria.";
    case "arena_access":
      return "Uma nova arena foi compartilhada.";
    case "competition_result":
      return "Seu duelo recebeu um desfecho.";
    case "action_reminder":
      return "Sua acao vai comecar em breve.";
    default:
      return "Aviso do sistema.";
  }
};

const getNotificationBody = (notification: NormalizedNotification): string => {
  if (notification.type === "direct_message") {
    return asTrimmedString(notification.metadata.messagePreview)
      || notification.content
      || "Uma nova mensagem direta chegou para voce.";
  }

  if (notification.content) return notification.content;

  switch (notification.type) {
    case "codex_gift":
      return "Uma campanha valiosa foi enviada para a sua biblioteca.";
    case "direct_message":
      return notification.content || "Uma nova mensagem direta chegou para voce.";
    case "competition_result":
      return "Seu rival fechou o duelo primeiro.";
    case "action_reminder":
      return "Uma acao programada sua vai comecar em breve.";
    default:
      return "Ha uma atualizacao importante esperando sua leitura.";
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

  if (unreadCount <= 1) {
    return {
      title: senderNickname,
      body: fallbackBody,
      tag: senderId ? `glyph-direct-message-${senderId}` : `glyph-direct-message-${notification.userId}`,
      renotify: false,
    };
  }

  return {
    title: sameSender ? senderNickname : "Mensagens diretas",
    body: sameSender ? `${unreadCount} novas mensagens` : `${unreadCount} novas mensagens diretas`,
    tag: sameSender && senderId
      ? `glyph-direct-message-${senderId}`
      : `glyph-direct-message-${notification.userId}`,
    renotify: true,
  };
};

const getOracleMessageTitle = (message: NormalizedOracleMessage): string => {
  switch (message.mode) {
    case "coach":
      return "Oraculo - Coach";
    case "tatico":
      return "Oraculo - Tatico";
    case "estrategico":
      return "Oraculo - Estrategico";
    case "calmo":
      return "Oraculo - Calmo";
    case "reflexivo":
      return "Oraculo - Reflexivo";
    case "personalizado":
      return "Oraculo - Personalizado";
    case "neutro":
    default:
      return "Oraculo - Neutro";
  }
};

const getOracleMessageBody = (message: NormalizedOracleMessage): string =>
  message.content || "O Oraculo trouxe um novo card para voce.";

const shouldPushNotification = (
  notification: NormalizedNotification,
  appMode: AppMode,
  activeMode: OracleMode,
): boolean => {
  if (notification.read) return false;

  const policy = POLICY[notification.type] || POLICY.system;
  if (appMode === "BASIC" && !policy.basicVisible) return false;
  if (appMode !== "BASIC" && !policy.gameVisible) return false;

  const pushProfile = PROFILE_PUSH[MODE_PUSH_PROFILE[activeMode] || "equilibrado"];
  return pushProfile.includes(policy.priority);
};

const shouldPushOracleMessage = (message: NormalizedOracleMessage): boolean => {
  if (message.read || message.deliveryType !== "feed") {
    return false;
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

const dispatchNotification = async (req: Request, body: JsonRecord, origin: string | null) => {
  if (!WEB_PUSH_WEBHOOK_SECRET || req.headers.get("x-web-push-secret") !== WEB_PUSH_WEBHOOK_SECRET) {
    return jsonResponse(origin, 401, { error: "Invalid webhook secret." });
  }

  configureVapid();

  const notification = normalizeNotification(body);
  if (!notification.id || !notification.userId) {
    return jsonResponse(origin, 400, { error: "Invalid notification payload." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: subscriptions, error: subscriptionsError }, { data: preferenceRow }, { data: profileRow }] = await Promise.all([
    supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, subscription, failure_count")
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

  if (!preferenceRow?.notifications_enabled) {
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

  const activeSubscriptions = (subscriptions || []) as StoredPushSubscription[];
  if (activeSubscriptions.length === 0) {
    return jsonResponse(origin, 200, { skipped: true, reason: "no_active_subscriptions" });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscriptionRow of activeSubscriptions) {
    const pushSubscription = normalizeStoredSubscription(subscriptionRow);
    if (!pushSubscription) {
      skipped += 1;
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: "invalid_subscription_payload",
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
      url: asTrimmedString(notification.metadata.url) || (notification.type === "action_reminder" ? "/?view=planner" : "/?oracle=notifications"),
      icon: "/logo-diamond.png",
      badge: "/logo-diamond.png",
      requireInteraction: (POLICY[notification.type] || POLICY.system).priority === "critical",
      renotify: Boolean(directMessagePresentation?.renotify),
      notificationId: notification.id,
      type: notification.type,
    };

    try {
      const result = await webpush.sendNotification(pushSubscription as any, JSON.stringify(payload));
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

      const disableSubscription = shouldDisableFailedSubscription(statusCode, errorMessage);
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

  configureVapid();

  const message = normalizeOracleMessage(body);
  if (!message.id || !message.userId) {
    return jsonResponse(origin, 400, { error: "Invalid oracle message payload." });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: subscriptions, error: subscriptionsError }, { data: preferenceRow }] = await Promise.all([
    supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, subscription, failure_count")
      .eq("user_id", message.userId)
      .is("disabled_at", null),
    supabaseAdmin
      .from("oracle_preferences")
      .select("notifications_enabled")
      .eq("user_id", message.userId)
      .maybeSingle(),
  ]);

  if (subscriptionsError) {
    return jsonResponse(origin, 500, { error: subscriptionsError.message || "Could not load subscriptions." });
  }

  if (!preferenceRow?.notifications_enabled) {
    return jsonResponse(origin, 200, { skipped: true, reason: "notifications_disabled" });
  }

  if (!shouldPushOracleMessage(message)) {
    return jsonResponse(origin, 200, { skipped: true, reason: "policy_filtered" });
  }

  const activeSubscriptions = (subscriptions || []) as StoredPushSubscription[];
  if (activeSubscriptions.length === 0) {
    return jsonResponse(origin, 200, { skipped: true, reason: "no_active_subscriptions" });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const subscriptionRow of activeSubscriptions) {
    const pushSubscription = normalizeStoredSubscription(subscriptionRow);
    if (!pushSubscription) {
      skipped += 1;
      await updateSubscriptionHealth(subscriptionRow.id, {
        failure_count: Number(subscriptionRow.failure_count || 0) + 1,
        last_error: "invalid_subscription_payload",
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

    const payload = {
      title: getOracleMessageTitle(message),
      body: getOracleMessageBody(message),
      tag: `glyph-oracle-${message.id}`,
      url: "/?oracle=chat",
      icon: "/logo-diamond.png",
      badge: "/logo-diamond.png",
      requireInteraction: false,
      oracleMessageId: message.id,
      type: "oracle_prompt",
    };

    try {
      const result = await webpush.sendNotification(pushSubscription as any, JSON.stringify(payload));
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

      const disableSubscription = shouldDisableFailedSubscription(statusCode, errorMessage);
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
