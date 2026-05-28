import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SignJWT, importPKCS8 } from "npm:jose@5.9.6";

type JsonRecord = Record<string, unknown>;
type PurchaseKind = "gold" | "membership";

type GooglePlayBody = {
  kind?: PurchaseKind;
  packId?: string;
  membershipTier?: "premium" | "platinum";
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
  packageName?: string;
  platform?: string;
  consumed?: boolean;
  acknowledged?: boolean;
  products?: string[];
  metadata?: JsonRecord;
};

type GoldPackConfig = {
  packId: string;
  productId: string;
  gold: number;
  brl: number;
};

type MembershipConfig = {
  productId: string;
  tier: "premium" | "platinum";
  brl: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://app.glyph.life";
const GOOGLE_PLAY_PACKAGE_NAME = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME") || "life.glyph.app";
const GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON") || "";
const GOOGLE_PLAY_CLIENT_EMAIL = Deno.env.get("GOOGLE_PLAY_CLIENT_EMAIL") || "";
const GOOGLE_PLAY_PRIVATE_KEY = Deno.env.get("GOOGLE_PLAY_PRIVATE_KEY") || "";
const GOOGLE_PLAY_OAUTH_CLIENT_ID = Deno.env.get("GOOGLE_PLAY_OAUTH_CLIENT_ID") || "";
const GOOGLE_PLAY_OAUTH_CLIENT_SECRET = Deno.env.get("GOOGLE_PLAY_OAUTH_CLIENT_SECRET") || "";
const GOOGLE_PLAY_REFRESH_TOKEN = Deno.env.get("GOOGLE_PLAY_REFRESH_TOKEN") || "";

const ANDROIDPUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

const DEFAULT_ALLOWED_ORIGINS = [
  SITE_URL,
  "https://glyph.life",
  "https://app.glyph.life",
  "https://www.glyph.life",
  "https://glyph-app-arabecos-projects.vercel.app",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const GOLD_PACKS: Record<string, GoldPackConfig> = {
  pack_gold_1: { packId: "pack_gold_1", productId: "pack_gold_1", gold: 50, brl: 5 },
  pack_gold_2: { packId: "pack_gold_2", productId: "pack_gold_2", gold: 110, brl: 10 },
  pack_gold_3: { packId: "pack_gold_3", productId: "pack_gold_3", gold: 230, brl: 20 },
  pack_gold_4: { packId: "pack_gold_4", productId: "pack_gold_4", gold: 600, brl: 50 },
  pack_gold_5: { packId: "pack_gold_5", productId: "pack_gold_5", gold: 1300, brl: 100 },
};

const MEMBERSHIPS: Record<string, MembershipConfig> = {
  premium_30d: { productId: "premium_30d", tier: "premium", brl: 17.9 },
  platinum_30d: { productId: "platinum_30d", tier: "platinum", brl: 44.9 },
};

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedGoogleAccessToken: { token: string; expiresAt: number } | null = null;

const asTrimmedString = (value: unknown): string => String(value ?? "").trim();

const normalizeOrigin = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.origin === "null" ? raw.replace(/\/+$/, "") : parsed.origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
};

const NORMALIZED_ALLOWED_ORIGINS = ALLOWED_ORIGINS.map((origin) => normalizeOrigin(origin));
const ALLOWED_HOST_SUFFIXES = ["glyph.life", "vercel.app", "localhost", "127.0.0.1"];

const isAllowedOriginValue = (origin: string | null) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (NORMALIZED_ALLOWED_ORIGINS.includes(normalized)) return true;

  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": normalizeOrigin(origin || ALLOWED_ORIGINS[0] || ""),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const jsonResponse = (body: JsonRecord, status: number, headers: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

const parseJsonResponse = async (response: Response): Promise<JsonRecord> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as JsonRecord;
  } catch {
    return { raw: text };
  }
};

const resolveServiceAccount = () => {
  if (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.trim()) {
    const parsed = JSON.parse(GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) as JsonRecord;
    const clientEmail = asTrimmedString(parsed.client_email);
    const privateKey = asTrimmedString(parsed.private_key).replace(/\\n/g, "\n");
    if (clientEmail && privateKey) return { clientEmail, privateKey };
  }

  const clientEmail = asTrimmedString(GOOGLE_PLAY_CLIENT_EMAIL);
  const privateKey = asTrimmedString(GOOGLE_PLAY_PRIVATE_KEY).replace(/\\n/g, "\n");
  if (clientEmail && privateKey) return { clientEmail, privateKey };

  return null;
};

const getGooglePlayAccessToken = async (): Promise<string> => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedGoogleAccessToken && cachedGoogleAccessToken.expiresAt > nowSeconds + 60) {
    return cachedGoogleAccessToken.token;
  }

  const serviceAccount = resolveServiceAccount();
  let tokenResponse: Response;

  if (serviceAccount) {
    const privateKey = await importPKCS8(serviceAccount.privateKey, "RS256");
    const assertion = await new SignJWT({ scope: ANDROIDPUBLISHER_SCOPE })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(serviceAccount.clientEmail)
      .setSubject(serviceAccount.clientEmail)
      .setAudience(GOOGLE_OAUTH_TOKEN_URL)
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + 3600)
      .sign(privateKey);

    tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
  } else if (GOOGLE_PLAY_OAUTH_CLIENT_ID && GOOGLE_PLAY_OAUTH_CLIENT_SECRET && GOOGLE_PLAY_REFRESH_TOKEN) {
    tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: GOOGLE_PLAY_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_PLAY_OAUTH_CLIENT_SECRET,
        refresh_token: GOOGLE_PLAY_REFRESH_TOKEN,
      }),
    });
  } else {
    throw new Error("GOOGLE_PLAY_AUTH_NOT_CONFIGURED");
  }

  const tokenPayload = await parseJsonResponse(tokenResponse);
  if (!tokenResponse.ok) {
    throw new Error(`GOOGLE_PLAY_AUTH_FAILED:${tokenResponse.status}:${String(tokenPayload.error_description || tokenPayload.error || "unknown")}`);
  }

  const accessToken = asTrimmedString(tokenPayload.access_token);
  const expiresIn = Number(tokenPayload.expires_in || 3600);
  if (!accessToken) {
    throw new Error("GOOGLE_PLAY_EMPTY_ACCESS_TOKEN");
  }

  cachedGoogleAccessToken = {
    token: accessToken,
    expiresAt: nowSeconds + Math.max(60, expiresIn),
  };

  return accessToken;
};

const getAuthenticatedUserId = async (req: Request) => {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.id) {
    throw new Error("AUTH_INVALID");
  }

  return data.user.id;
};

const googleApiFetch = async (url: string, accessToken: string, init: RequestInit = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(`GOOGLE_PLAY_API_FAILED:${response.status}:${String(payload.error_description || payload.error || payload.message || "unknown")}`);
  }

  return payload;
};

const buildGoogleProductUrl = (packageName: string, productId: string, purchaseToken: string, suffix = "") =>
  `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}${suffix}`;

const buildGoogleSubscriptionV2Url = (packageName: string, purchaseToken: string) =>
  `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

const buildGoogleSubscriptionAcknowledgeUrl = (packageName: string, productId: string, purchaseToken: string) =>
  `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;

const hasLineItemForProduct = (subscription: JsonRecord, productId: string): boolean => {
  const lineItems = Array.isArray(subscription.lineItems) ? subscription.lineItems : [];
  return lineItems.some((item) => item && typeof item === "object" && asTrimmedString((item as JsonRecord).productId) === productId);
};

const buildSafeGoogleMetadata = (
  body: GooglePlayBody,
  userId: string,
  googlePayload: JsonRecord,
  extra: JsonRecord = {},
): JsonRecord => ({
  google_play: {
    package_name: body.packageName || GOOGLE_PLAY_PACKAGE_NAME,
    product_id: body.productId || null,
    order_id: body.orderId || null,
    purchase_token_present: Boolean(body.purchaseToken),
    platform: body.platform || "android",
    purchase_state: googlePayload.purchaseState ?? null,
    consumption_state: googlePayload.consumptionState ?? null,
    acknowledgement_state: googlePayload.acknowledgementState ?? null,
    subscription_state: googlePayload.subscriptionState ?? null,
    latest_order_id: googlePayload.latestOrderId ?? null,
    region_code: googlePayload.regionCode ?? null,
    purchase_time_millis: googlePayload.purchaseTimeMillis ?? null,
  },
  glyph_purchase: {
    user_id: userId,
    kind: body.kind || null,
    pack_id: body.packId || null,
    membership_tier: body.membershipTier || null,
  },
  client_receipt: {
    consumed: body.consumed ?? null,
    acknowledged: body.acknowledged ?? null,
    products: body.products || [],
  },
  ...extra,
});

const handleGoldPurchase = async (body: GooglePlayBody, userId: string, accessToken: string) => {
  const pack = GOLD_PACKS[asTrimmedString(body.packId)];
  if (!pack) throw new Error("UNKNOWN_GOLD_PACK");

  const purchaseToken = asTrimmedString(body.purchaseToken);
  if (!purchaseToken) throw new Error("PURCHASE_TOKEN_REQUIRED");

  const packageName = asTrimmedString(body.packageName) || GOOGLE_PLAY_PACKAGE_NAME;
  if (packageName !== GOOGLE_PLAY_PACKAGE_NAME) throw new Error("PACKAGE_MISMATCH");

  const productId = asTrimmedString(body.productId) || pack.productId;
  if (productId !== pack.productId) throw new Error("PRODUCT_MISMATCH");

  const productPurchase = await googleApiFetch(
    buildGoogleProductUrl(packageName, productId, purchaseToken),
    accessToken,
  );

  if (Number(productPurchase.purchaseState) !== 0) {
    throw new Error(`PURCHASE_NOT_COMPLETED:${String(productPurchase.purchaseState ?? "unknown")}`);
  }

  if (asTrimmedString(productPurchase.productId) && asTrimmedString(productPurchase.productId) !== productId) {
    throw new Error("GOOGLE_PRODUCT_MISMATCH");
  }

  const metadata = buildSafeGoogleMetadata(body, userId, productPurchase, {
    catalog: {
      pack_id: pack.packId,
      gold: pack.gold,
      brl: pack.brl,
    },
  });

  const { data, error } = await supabaseAdmin.rpc("process_google_play_gold_purchase", {
    p_user_id: userId,
    p_pack_id: pack.packId,
    p_amount_gold: pack.gold,
    p_cost_brl: pack.brl,
    p_payment_id: purchaseToken,
    p_platform: body.platform || "android",
    p_product_id: productId,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(`GLYPH_CREDIT_FAILED:${error.message}`);
  }

  let consumeStatus: "skipped" | "consumed" | "already_consumed" | "failed" = "skipped";
  if (Number(productPurchase.consumptionState) === 1) {
    consumeStatus = "already_consumed";
  } else {
    try {
      await googleApiFetch(
        buildGoogleProductUrl(packageName, productId, purchaseToken, ":consume"),
        accessToken,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      consumeStatus = "consumed";
    } catch (error) {
      console.error("[Google Play] consume failed after credit:", error);
      consumeStatus = "failed";
    }
  }

  return {
    success: true,
    kind: "gold",
    duplicate: Boolean(data?.duplicate),
    new_gold: data?.new_gold ?? null,
    fragments: data?.fragments ?? null,
    wallet: data?.wallet ?? null,
    product_id: productId,
    pack_id: pack.packId,
    credited_gold: pack.gold,
    consume_status: consumeStatus,
  };
};

const handleMembershipPurchase = async (body: GooglePlayBody, userId: string, accessToken: string) => {
  const productId = asTrimmedString(body.productId);
  const membership = MEMBERSHIPS[productId];
  if (!membership) throw new Error("UNKNOWN_MEMBERSHIP_PRODUCT");

  if (body.membershipTier && body.membershipTier !== membership.tier) {
    throw new Error("MEMBERSHIP_TIER_MISMATCH");
  }

  const purchaseToken = asTrimmedString(body.purchaseToken);
  if (!purchaseToken) throw new Error("PURCHASE_TOKEN_REQUIRED");

  const packageName = asTrimmedString(body.packageName) || GOOGLE_PLAY_PACKAGE_NAME;
  if (packageName !== GOOGLE_PLAY_PACKAGE_NAME) throw new Error("PACKAGE_MISMATCH");

  const subscription = await googleApiFetch(
    buildGoogleSubscriptionV2Url(packageName, purchaseToken),
    accessToken,
  );

  if (asTrimmedString(subscription.subscriptionState) !== "SUBSCRIPTION_STATE_ACTIVE") {
    throw new Error(`SUBSCRIPTION_NOT_ACTIVE:${String(subscription.subscriptionState || "unknown")}`);
  }

  if (!hasLineItemForProduct(subscription, productId)) {
    throw new Error("SUBSCRIPTION_PRODUCT_MISMATCH");
  }

  const metadata = buildSafeGoogleMetadata(body, userId, subscription, {
    catalog: {
      product_id: productId,
      tier: membership.tier,
      brl: membership.brl,
    },
  });

  const { data, error } = await supabaseAdmin.rpc("process_approved_membership_payment", {
    p_user_id: userId,
    p_payment_id: purchaseToken,
    p_membership_tier: membership.tier,
    p_amount_paid: membership.brl,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(`GLYPH_MEMBERSHIP_FAILED:${error.message}`);
  }

  let acknowledgeStatus: "skipped" | "acknowledged" | "already_acknowledged" | "failed" = "skipped";
  if (asTrimmedString(subscription.acknowledgementState) === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED") {
    acknowledgeStatus = "already_acknowledged";
  } else {
    try {
      await googleApiFetch(
        buildGoogleSubscriptionAcknowledgeUrl(packageName, productId, purchaseToken),
        accessToken,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      acknowledgeStatus = "acknowledged";
    } catch (error) {
      console.error("[Google Play] subscription acknowledge failed after entitlement:", error);
      acknowledgeStatus = "failed";
    }
  }

  return {
    success: true,
    kind: "membership",
    membership_tier: data?.membership_tier ?? membership.tier,
    premium_expires_at: data?.premium_expires_at ?? null,
    product_id: productId,
    acknowledge_status: acknowledgeStatus,
  };
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = isAllowedOriginValue(origin);
  const corsHeaders = buildCorsHeaders(origin && isAllowedOrigin ? origin : null);

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin) return new Response("Forbidden origin", { status: 403, headers: corsHeaders });
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isAllowedOrigin) {
    return jsonResponse({ success: false, error: "FORBIDDEN_ORIGIN" }, 403, corsHeaders);
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "METHOD_NOT_ALLOWED" }, 405, corsHeaders);
  }

  try {
    const userId = await getAuthenticatedUserId(req);
    const body = await req.json() as GooglePlayBody;
    const kind = body.kind || "gold";
    const accessToken = await getGooglePlayAccessToken();

    if (kind === "gold") {
      const result = await handleGoldPurchase(body, userId, accessToken);
      return jsonResponse(result, 200, corsHeaders);
    }

    if (kind === "membership") {
      const result = await handleMembershipPurchase(body, userId, accessToken);
      return jsonResponse(result, 200, corsHeaders);
    }

    return jsonResponse({ success: false, error: "UNKNOWN_PURCHASE_KIND" }, 400, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Google Play Purchase] Fatal:", message);
    const status = message.includes("AUTH_") ? 401
      : message.includes("NOT_COMPLETED") || message.includes("NOT_ACTIVE") ? 402
        : message.includes("MISMATCH") || message.includes("REQUIRED") || message.includes("UNKNOWN") ? 400
          : 500;

    return jsonResponse({ success: false, error: message }, status, corsHeaders);
  }
});
