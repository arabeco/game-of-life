
-- 1. Tabela para rastrear participantes em missões de clã (Opt-in)
CREATE TABLE IF NOT EXISTS public.clan_mission_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL, -- ID da missão definido no GameContent.ts
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- Referência direta a user_profiles para garantir consistência
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    contribution_value INTEGER DEFAULT 0, -- Quanto o usuário contribuiu para a meta
    UNIQUE(clan_id, mission_id, user_id)
);

-- 2. Tabela para rastrear o estado da missão para o clã
CREATE TABLE IF NOT EXISTS public.clan_mission_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(clan_id, mission_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.clan_mission_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_mission_states ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (RLS)

-- Leitura: Membros do clã podem ver quem está participando
CREATE POLICY "select_clan_mission_participants" ON public.clan_mission_participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_participants.clan_id AND cm.user_id = auth.uid())
    );

-- Leitura: Membros do clã podem ver o estado da missão
CREATE POLICY "select_clan_mission_states" ON public.clan_mission_states
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_states.clan_id AND cm.user_id = auth.uid())
    );

-- Inserção: Usuário pode entrar na missão (se for do clã)
CREATE POLICY "insert_clan_mission_participant" ON public.clan_mission_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_participants.clan_id AND cm.user_id = auth.uid())
    );

-- Atualização: Usuário pode atualizar sua própria contribuição
CREATE POLICY "update_own_contribution" ON public.clan_mission_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Inserção/Atualização de Estado: Apenas sistema ou triggers (ou simplificado para líderes se necessário, mas idealmente via função segura)
-- Por enquanto, vamos permitir que qualquer membro do clã crie o estado inicial se não existir (ao entrar na missão)
CREATE POLICY "insert_clan_mission_state" ON public.clan_mission_states
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_states.clan_id AND cm.user_id = auth.uid())
    );

-- Atualização de Estado: Permitir que membros atualizem o status de conclusão (idealmente seria via trigger, mas para manter simples no frontend)
CREATE POLICY "update_clan_mission_state" ON public.clan_mission_states
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_states.clan_id AND cm.user_id = auth.uid())
    );
