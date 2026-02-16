
-- Tabela para rastrear participantes em missões de clã (Opt-in)
CREATE TABLE IF NOT EXISTS public.clan_mission_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL, -- ID da missão definido no GameContent.ts
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    contribution_value INTEGER DEFAULT 0, -- Quanto o usuário contribuiu para a meta
    UNIQUE(clan_id, mission_id, user_id)
);

-- Tabela para rastrear o estado da missão para o clã
CREATE TABLE IF NOT EXISTS public.clan_mission_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(clan_id, mission_id)
);

-- RLS Policies
ALTER TABLE public.clan_mission_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_mission_states ENABLE ROW LEVEL SECURITY;

-- Leitura: Membros do clã podem ver
CREATE POLICY "Membros veem participantes" ON public.clan_mission_participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_participants.clan_id AND cm.user_id = auth.uid())
    );

CREATE POLICY "Membros veem estado da missão" ON public.clan_mission_states
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_states.clan_id AND cm.user_id = auth.uid())
    );

-- Inserção: Usuário pode entrar na missão (se for do clã)
CREATE POLICY "Entrar na missão" ON public.clan_mission_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_participants.clan_id AND cm.user_id = auth.uid())
    );

-- Atualização: Sistema ou Líder (simplificado para todos membros atualizarem sua contribuição por enquanto, ou via trigger/function segura)
-- Para simplificar, permitimos que o usuário atualize sua própria contribuição
CREATE POLICY "Atualizar contribuição" ON public.clan_mission_participants
    FOR UPDATE USING (auth.uid() = user_id);

