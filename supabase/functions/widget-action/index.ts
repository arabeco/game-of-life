import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Metodo nao permitido." }, 405);

  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sessao ausente." }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return json({ error: "Sessao invalida." }, 401);

  const body = await request.json().catch(() => ({}));
  const actionId = String(body.actionId || "");
  const date = String(body.date || "");
  const completionMinute = Number(body.completionMinute);
  if (!actionId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(completionMinute)) {
    return json({ error: "Acao ou horario invalido." }, 400);
  }

  const { data: action, error: actionError } = await supabase
    .from("actions")
    .select("id,name,icon,duration,action_type,user_id,arena_id")
    .eq("id", actionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (actionError || !action) return json({ error: "Acao nao encontrada." }, 404);
  if (action.action_type === "Marco") return json({ error: "Marcos devem ser confirmados dentro do app." }, 409);

  const safeDuration = Math.max(1, Number(action.duration || 15));
  const safeStartTime = Math.max(0, Math.min(1439, Math.round(completionMinute) - safeDuration));
  const { data: pendingTasks, error: pendingError } = await supabase
    .from("scheduled_tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("action_id", actionId)
    .eq("completed", false)
    .eq("date", date)
    .order("start_time", { ascending: true })
    .limit(1);

  if (pendingError) return json({ error: "Nao foi possivel conferir a acao." }, 500);

  const existingTaskId = pendingTasks?.[0]?.id || null;
  let taskId = existingTaskId;
  if (existingTaskId) {
    const { error } = await supabase
      .from("scheduled_tasks")
      .update({ completed: true, start_time: safeStartTime, duration: safeDuration })
      .eq("id", existingTaskId)
      .eq("user_id", user.id);
    if (error) return json({ error: "Nao foi possivel concluir a acao." }, 500);
  } else {
    const { data: repeatedTasks, error: repeatedError } = await supabase
      .from("scheduled_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("action_id", actionId)
      .eq("completed", true)
      .eq("date", date)
      .eq("start_time", safeStartTime)
      .limit(1);
    if (repeatedError) return json({ error: "Nao foi possivel conferir a conclusao." }, 500);

    taskId = repeatedTasks?.[0]?.id || crypto.randomUUID();
    if (!repeatedTasks?.length) {
      const { error } = await supabase.from("scheduled_tasks").insert({
        id: taskId,
        user_id: user.id,
        action_id: actionId,
        date,
        start_time: safeStartTime,
        duration: safeDuration,
        completed: true,
        created_at: new Date().toISOString(),
      });
      if (error) return json({ error: "Nao foi possivel registrar a acao." }, 500);
    }
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("daily_proof_streak")
    .eq("id", user.id)
    .maybeSingle();
  const currentStreak = (profile?.daily_proof_streak && typeof profile.daily_proof_streak === "object")
    ? profile.daily_proof_streak as Record<string, unknown>
    : {};
  const previousDate = new Date(`${date}T12:00:00Z`);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  const previousDateString = previousDate.toISOString().slice(0, 10);
  const lastProofDate = String(currentStreak.last_proof_date || currentStreak.last_closed_date || "");
  const previousCurrent = Math.max(0, Number(currentStreak.current || 0));
  const isSameDate = lastProofDate === date;
  const nextCurrent = isSameDate ? Math.max(1, previousCurrent) : lastProofDate === previousDateString ? previousCurrent + 1 : 1;
  const previousBest = Math.max(Number(currentStreak.best || 0), previousCurrent);
  const nowIso = new Date().toISOString();
  const nextStreak = {
    ...currentStreak,
    current: nextCurrent,
    best: Math.max(previousBest, nextCurrent),
    total_closed_days: isSameDate ? Number(currentStreak.total_closed_days || 0) : Number(currentStreak.total_closed_days || 0) + 1,
    last_closed_date: date,
    last_closed_at: nowIso,
    total_proof_days: isSameDate ? Number(currentStreak.total_proof_days || currentStreak.total_closed_days || 0) : Number(currentStreak.total_proof_days || currentStreak.total_closed_days || 0) + 1,
    last_proof_date: date,
    last_proof_at: nowIso,
    last_proof_action_id: actionId,
    last_proof_arena_id: action.arena_id || null,
  };
  await supabase.from("user_profiles").update({ daily_proof_streak: nextStreak }).eq("id", user.id);

  return json({
    success: true,
    task: {
      taskId,
      actionId,
      name: action.name,
      icon: action.icon || "*",
      date,
      startTime: safeStartTime,
      completed: true,
      exp: action.action_type === "Livre" ? 0 : safeDuration,
    },
  });
});
