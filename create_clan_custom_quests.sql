
-- Tabela para Missões Customizadas do Clã (Criadas pelo Líder)
CREATE TABLE IF NOT EXISTS public.clan_custom_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('singular', 'shared')), -- 'singular' (Tipo A) ou 'shared' (Tipo B)
    slot_id TEXT, -- ID do slot onde a missão foi criada (ex: 'mesa_1', 'central_table')
    status TEXT DEFAULT 'active', -- 'active', 'locked', 'completed', 'aborted'
    target_value INTEGER DEFAULT 1,
    current_value INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_gold INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_user_id UUID REFERENCES auth.users(id), -- Para missões Singulares (Tipo A) após opt-in
    
    -- Restrições de integridade
    CONSTRAINT valid_status CHECK (status IN ('active', 'locked', 'completed', 'aborted'))
);

-- Índices
CREATE INDEX idx_clan_custom_quests_clan ON public.clan_custom_quests(clan_id);
CREATE INDEX idx_clan_custom_quests_slot ON public.clan_custom_quests(clan_id, slot_id);
CREATE INDEX idx_clan_custom_quests_assigned ON public.clan_custom_quests(assigned_user_id);

-- RLS
ALTER TABLE public.clan_custom_quests ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Leitura: Membros do clã podem ver todas as missões do clã
CREATE POLICY "view_clan_quests" ON public.clan_custom_quests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_custom_quests.clan_id AND cm.user_id = auth.uid())
    );

-- Criação: Apenas Líderes (verificado via trigger ou app logic, aqui deixamos aberto para membros do clã mas vamos restringir no app)
-- Idealmente: checar role 'leader' na tabela clan_members
CREATE POLICY "create_clan_quests" ON public.clan_custom_quests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clan_members cm 
            WHERE cm.clan_id = clan_custom_quests.clan_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'leader'
        )
    );

-- Atualização:
-- 1. Líder pode editar/cancelar
-- 2. Membros podem dar opt-in (update assigned_user_id) se estiver 'active' e mission_type='singular'
-- 3. Membros podem atualizar progresso (se participando)
CREATE POLICY "update_clan_quests" ON public.clan_custom_quests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_custom_quests.clan_id AND cm.user_id = auth.uid())
    );

-- Deletar: Apenas Líder
CREATE POLICY "delete_clan_quests" ON public.clan_custom_quests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clan_members cm 
            WHERE cm.clan_id = clan_custom_quests.clan_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'leader'
        )
    );
