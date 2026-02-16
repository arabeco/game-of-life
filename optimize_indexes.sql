
-- Otimização de Índices para Consultas Frequentes

-- 1. Scheduled Tasks: Consultas por usuário e data são as mais frequentes (Planner)
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_date ON public.scheduled_tasks(user_id, date);

-- 2. Reports: Consultas de histórico ordenadas por data
CREATE INDEX IF NOT EXISTS idx_reports_user_end_date ON public.reports(user_id, end_date DESC);

-- 3. Actions: Consultas por arena (para carregar ações de uma arena específica)
CREATE INDEX IF NOT EXISTS idx_actions_arena_id ON public.actions(arena_id);

-- 4. Arena Folders: Consultas por usuário
CREATE INDEX IF NOT EXISTS idx_arena_folders_user_id ON public.arena_folders(user_id);

-- 5. Clan Missions: Consultas de progresso por clã e missão
CREATE INDEX IF NOT EXISTS idx_clan_mission_progress_lookup ON public.clan_mission_progress(clan_id, mission_id);
