
-- Tabela para rastrear o progresso GLOBAL das missões de clã
CREATE TABLE IF NOT EXISTS public.clan_mission_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL,
    current_value INTEGER DEFAULT 0,
    target_value INTEGER DEFAULT 50,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clan_id, mission_id)
);

ALTER TABLE public.clan_mission_progress ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "select_clan_mission_progress" ON public.clan_mission_progress
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );

CREATE POLICY "update_clan_mission_progress" ON public.clan_mission_progress
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );

CREATE POLICY "insert_clan_mission_progress" ON public.clan_mission_progress
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );
