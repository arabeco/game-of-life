-- Tabela de Slots da Aldeia
CREATE TABLE IF NOT EXISTS clan_aldeia_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
    slot_id TEXT NOT NULL,
    health NUMERIC DEFAULT 100,
    streak_good INTEGER DEFAULT 0,
    streak_bad INTEGER DEFAULT 0,
    last_visited_at TIMESTAMPTZ,
    last_decay_calculation TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clan_id, slot_id)
);

-- Tabela de Presença na Aldeia
CREATE TABLE IF NOT EXISTS clan_aldeia_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    slot_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    hours_counted INTEGER DEFAULT 1
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clan_aldeia_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_aldeia_presence ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Policies) para Slots
DO $$ 
BEGIN
    -- Permitir leitura para todos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_aldeia_slots' AND policyname = 'Everyone can view aldeia slots') THEN
        CREATE POLICY "Everyone can view aldeia slots" ON clan_aldeia_slots FOR SELECT USING (true);
    END IF;

    -- Permitir atualização para membros do clã
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_aldeia_slots' AND policyname = 'Members can update aldeia slots') THEN
        CREATE POLICY "Members can update aldeia slots" ON clan_aldeia_slots FOR UPDATE USING (
            EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_aldeia_slots.clan_id AND clan_members.user_id = auth.uid())
        );
    END IF;

    -- Permitir inserção para membros do clã (inicialização)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_aldeia_slots' AND policyname = 'Members can insert aldeia slots') THEN
        CREATE POLICY "Members can insert aldeia slots" ON clan_aldeia_slots FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_aldeia_slots.clan_id AND clan_members.user_id = auth.uid())
        );
    END IF;
END $$;

-- Políticas de Segurança (Policies) para Presença
DO $$ 
BEGIN
    -- Permitir leitura para todos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_aldeia_presence' AND policyname = 'Everyone can view aldeia presence') THEN
        CREATE POLICY "Everyone can view aldeia presence" ON clan_aldeia_presence FOR SELECT USING (true);
    END IF;

    -- Permitir gerenciamento da própria presença
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_aldeia_presence' AND policyname = 'Users can manage their own presence') THEN
        CREATE POLICY "Users can manage their own presence" ON clan_aldeia_presence FOR ALL USING (
            auth.uid() = user_id
        );
    END IF;
END $$;
