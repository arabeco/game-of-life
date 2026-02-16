-- Criar tabela clan_quest_progress
CREATE TABLE clan_quest_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX idx_clan_quest_progress_clan_id ON clan_quest_progress(clan_id);
CREATE INDEX idx_clan_quest_progress_quest_id ON clan_quest_progress(quest_id);

-- Criar restrição para garantir que não haja duplicatas
ALTER TABLE clan_quest_progress ADD CONSTRAINT unique_clan_quest UNIQUE (clan_id, quest_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clan_quest_progress ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura/escrita baseada no clan
CREATE POLICY "Users can manage their clan quest progress" ON clan_quest_progress
  FOR ALL USING (
    clan_id IN (
      SELECT clan_id FROM clan_members 
      WHERE user_id = auth.uid()
    )
  );
