import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Oraculo <no-reply@glyph.life>";

const EMAILABLE_NOTIFICATION_TYPES = new Set(["mentor_invite", "partnership_invite", "clan_invite"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonRecord = Record<string, unknown>;

type NormalizedNotification = {
  id: string;
  userId: string;
  type: string;
  content: string;
  metadata: JsonRecord;
  email: string;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
};

const isDeliverableEmail = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") && !normalized.endsWith("@gol.local");
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeNotification = (payload: unknown): NormalizedNotification => {
  const root = isRecord(payload) ? payload : {};
  const notificationCandidate = isRecord(root.record)
    ? root.record
    : isRecord(root.new)
      ? root.new
      : root;
  const metadata = isRecord(notificationCandidate.metadata) ? notificationCandidate.metadata : {};

  return {
    id: asTrimmedString(notificationCandidate.id),
    userId: asTrimmedString(notificationCandidate.user_id) || asTrimmedString(notificationCandidate.userId),
    type: asTrimmedString(notificationCandidate.type) || "system",
    content: asTrimmedString(notificationCandidate.content),
    metadata,
    email:
      asTrimmedString(metadata.email) ||
      asTrimmedString(notificationCandidate.email) ||
      asTrimmedString(notificationCandidate.recipient_email),
  };
};

const shouldSendEmail = (notification: NormalizedNotification): boolean =>
  asBoolean(notification.metadata.sendEmail) ||
  asBoolean(notification.metadata.welcome) ||
  EMAILABLE_NOTIFICATION_TYPES.has(notification.type);

const getDefaultSubject = (notification: NormalizedNotification): string => {
  const metadataSubject = asTrimmedString(notification.metadata.emailSubject);
  if (metadataSubject) return metadataSubject;

  if (asBoolean(notification.metadata.welcome)) {
    return "Glyph - Bem-vindo!";
  }

  switch (notification.type) {
    case "mentor_invite":
      return "Glyph - Convite de mentoria";
    case "partnership_invite":
      return "Glyph - Convite de parceria";
    case "clan_invite":
      return "Glyph - Convite de cla";
    default:
      return `Novo sinal no Oraculo: ${notification.type || "system"}`;
  }
};

const buildDispatchKey = (notification: NormalizedNotification): string => {
  const metadataDispatchKey = asTrimmedString(notification.metadata.dispatchKey);
  if (metadataDispatchKey) return metadataDispatchKey;
  if (notification.id) return `notification:${notification.id}`;

  const inviteId = asTrimmedString(notification.metadata.inviteId);
  if (inviteId && notification.type) {
    return `invite:${notification.type}:${inviteId}`;
  }

  if (asBoolean(notification.metadata.welcome) && notification.userId) {
    return `welcome:${notification.userId}`;
  }

  return "";
};

const getSupabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const reserveDispatchKey = async (
  dispatchKey: string,
  notification: NormalizedNotification,
): Promise<boolean> => {
  if (!dispatchKey) return true;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return true;

  try {
    const { error } = await supabaseAdmin.from("notification_email_dispatches").insert({
      dispatch_key: dispatchKey,
      notification_id: notification.id || null,
      user_id: notification.userId || null,
      notification_type: notification.type || "system",
    });

    if (error) {
      const duplicate =
        error.code === "23505" ||
        String(error.message || "").toLowerCase().includes("duplicate");

      if (duplicate) {
        console.log("Skipping duplicate email dispatch:", dispatchKey);
        return false;
      }

      console.warn("Could not reserve notification email dispatch key:", error.message || error);
    }
  } catch (error) {
    console.warn("Dispatch key reservation failed:", error);
  }

  return true;
};

const resolveRecipientEmail = async (notification: NormalizedNotification): Promise<string> => {
  if (isDeliverableEmail(notification.email)) {
    return notification.email;
  }

  if (!notification.userId) {
    return "";
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return "";
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("email")
      .eq("id", notification.userId)
      .maybeSingle();

    if (error) {
      console.warn("Failed to resolve recipient email from user_profiles:", error.message || error);
      return "";
    }

    const profileEmail = asTrimmedString(data?.email);
    return isDeliverableEmail(profileEmail) ? profileEmail : "";
  } catch (error) {
    console.warn("Unexpected recipient email lookup failure:", error);
    return "";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY secret.");
    }

    const payload = await req.json();
    const notification = normalizeNotification(payload);

    console.log("Resend Webhook Payload:", {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      metadataKeys: Object.keys(notification.metadata),
    });

    if (!shouldSendEmail(notification)) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "notification_not_marked_for_email" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const dispatchKey = buildDispatchKey(notification);
    const reserved = await reserveDispatchKey(dispatchKey, notification);

    if (!reserved) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "duplicate_dispatch", dispatchKey }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const email = await resolveRecipientEmail(notification);
    if (!email) {
      console.warn("No deliverable recipient email found for notification.");
      return new Response(
        JSON.stringify({ skipped: true, reason: "missing_recipient_email", dispatchKey }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const safeContent = escapeHtml(notification.content || "Voce recebeu uma nova notificacao do Glyph.")
      .replaceAll("\n", "<br />");
    const subject = getDefaultSubject(notification);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Ola!</h2>
            <p>Voce recebeu uma nova notificacao do sistema <strong>Glyph</strong>:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${safeContent}
            </div>
            <p style="font-size: 12px; color: #666;">Acesse o app para responder ou ver mais detalhes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999;">Glyph - Oraculo de Maestria</p>
          </div>
        `,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      throw new Error(resData?.message || resData?.error || "Resend API request failed.");
    }

    return new Response(JSON.stringify({ ...resData, dispatchKey }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown resend error.";
    console.error("Resend Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
