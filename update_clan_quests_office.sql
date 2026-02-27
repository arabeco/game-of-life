-- Tabela para Missões Customizadas do Clã (Criadas pelo Líder)
-- Esta tabela armazena ações/missões personalizadas criadas para slots específicos.
CREATE TABLE IF NOT EXISTS public.clan_custom_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('singular', 'shared')), -- 'singular' (Tipo A) ou 'shared' (Tipo B)
    slot_id TEXT, -- ID do slot onde a missão foi criada (ex: 'mesa_1', 'central_table')
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'completed', 'aborted')),
    target_value INTEGER DEFAULT 1,
    current_value INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_gold INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_user_id UUID REFERENCES auth.users(id), -- Para missões Singulares (Tipo A)
    
    -- Campos exclusivos do Modo Office
    due_date TIMESTAMPTZ,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    category TEXT DEFAULT 'work'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clan_custom_quests_clan ON public.clan_custom_quests(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_custom_quests_slot ON public.clan_custom_quests(clan_id, slot_id);
CREATE INDEX IF NOT EXISTS idx_clan_custom_quests_assigned ON public.clan_custom_quests(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_clan_quests_due_date ON public.clan_custom_quests(due_date);

-- Habilitar RLS
ALTER TABLE public.clan_custom_quests ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "view_clan_quests" ON public.clan_custom_quests;
CREATE POLICY "view_clan_quests" ON public.clan_custom_quests
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_custom_quests.clan_id AND cm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "create_clan_quests" ON public.clan_custom_quests;
CREATE POLICY "create_clan_quests" ON public.clan_custom_quests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clan_members cm 
            WHERE cm.clan_id = clan_custom_quests.clan_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'leader'
        )
    );

DROP POLICY IF EXISTS "update_clan_quests" ON public.clan_custom_quests;
CREATE POLICY "update_clan_quests" ON public.clan_custom_quests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_custom_quests.clan_id AND cm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "delete_clan_quests" ON public.clan_custom_quests;
CREATE POLICY "delete_clan_quests" ON public.clan_custom_quests
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clan_members cm 
            WHERE cm.clan_id = clan_custom_quests.clan_id 
            AND cm.user_id = auth.uid() 
            AND cm.role = 'leader'
        )
    );
