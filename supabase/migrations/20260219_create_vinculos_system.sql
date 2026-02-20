-- 🔗 SYSTEM VÍNCULOS (LINKS)

-- 1. Tabela de Convites (Invites)
CREATE TABLE IF NOT EXISTS public.relationship_link_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('mentoria', 'parceria')),
    arena_id UUID NOT NULL, -- Não forçamos FK para permitir arenas arquivadas/deletadas manterem histórico, ou use ON DELETE SET NULL se preferir
    arena_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb, -- { name, icon } para exibição rápida
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 2. Tabela de Vínculos Ativos (Links)
CREATE TABLE IF NOT EXISTS public.relationship_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Na parceria, um é mentor 'simbólico' ou usamos lógica de par
    pupil_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('mentoria', 'parceria')),
    arena_id UUID NOT NULL,
    arena_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    satisfaction_level INTEGER DEFAULT 50 CHECK (satisfaction_level BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ -- Se não nulo, vínculo encerrado
);

-- 3. Log de Notificações (Toque Humano)
CREATE TABLE IF NOT EXISTS public.link_notifications_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID NOT NULL REFERENCES public.relationship_links(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('praise', 'support', 'scold')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Desafios PVP (Events)
CREATE TABLE IF NOT EXISTS public.pvp_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL, -- 'xp_race', 'check_streak'
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    participants JSONB DEFAULT '[]'::jsonb, -- Array de user_ids
    metadata JSONB DEFAULT '{}'::jsonb -- Metas, recompensas, etc.
);

-- RLS POLICIES

ALTER TABLE public.relationship_link_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_challenges ENABLE ROW LEVEL SECURITY;

-- Invites Policies
CREATE POLICY "Users can see invites they sent or received" ON public.relationship_link_invites
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert invites" ON public.relationship_link_invites
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update invites they received" ON public.relationship_link_invites
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Links Policies
CREATE POLICY "Users can see their own links" ON public.relationship_links
    FOR SELECT USING (auth.uid() = mentor_id OR auth.uid() = pupil_id);

CREATE POLICY "System/Users can insert links on accept" ON public.relationship_links
    FOR INSERT WITH CHECK (auth.uid() = mentor_id OR auth.uid() = pupil_id);

CREATE POLICY "Mentors can update satisfaction" ON public.relationship_links
    FOR UPDATE USING (auth.uid() = mentor_id);

-- Notifications Log Policies
CREATE POLICY "Users can see their notifications" ON public.link_notifications_log
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert notifications" ON public.link_notifications_log
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- PVP Policies (Leitura pública ou restrita?)
CREATE POLICY "Public read active challenges" ON public.pvp_challenges
    FOR SELECT USING (true);
