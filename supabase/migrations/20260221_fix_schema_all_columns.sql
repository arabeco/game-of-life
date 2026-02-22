
-- 1. Ajustar Schema da tabela season_missions (Adicionar TODAS as colunas que podem faltar)
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS type text DEFAULT 'individual';
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'actions_completed';
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS goal_value integer DEFAULT 1;
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'exp';
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS reward_value text; -- Pode ser numero ou string (ID de item)
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS action_name text;
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE season_missions ADD COLUMN IF NOT EXISTS requirements jsonb;

-- 2. Inserir a Season Genesis com UUID válido
INSERT INTO seasons (id, name, lore_text, background_png_url, start_date, end_date, is_active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Gênesis',
    'O Império Genesis se ergue. Castelos de cristal e fortalezas de aço dominam o horizonte. É hora de construir seu legado.',
    'https://images.unsplash.com/photo-1468657988500-aca2be09f4c6?q=80&w=2070&auto=format&fit=crop',
    '2025-12-21',
    '2026-03-20',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    lore_text = EXCLUDED.lore_text,
    background_png_url = EXCLUDED.background_png_url,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    is_active = EXCLUDED.is_active;

-- 3. Inserir Missões com UUIDs válidos
-- Andarilho
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'O Andarilho', 'Caminhe 20km no total.', 'individual', 'actions_completed', 20, 'exp', '1000', 'Caminhada (1km)', '🥾', '{"totalReps": 20}')
ON CONFLICT (id) DO UPDATE SET 
    season_id = EXCLUDED.season_id, title = EXCLUDED.title, type = EXCLUDED.type, 
    goal_type = EXCLUDED.goal_type, goal_value = EXCLUDED.goal_value, 
    reward_type = EXCLUDED.reward_type, reward_value = EXCLUDED.reward_value,
    action_name = EXCLUDED.action_name, icon = EXCLUDED.icon, requirements = EXCLUDED.requirements;

-- Erudito
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'O Erudito', 'Leia um livro inteiro ou dedique tempo.', 'individual', 'actions_completed', 15, 'exp', '800', 'Leitura Focada', '📖', '{"totalReps": 15, "milestone": true}')
ON CONFLICT (id) DO UPDATE SET 
    season_id = EXCLUDED.season_id, title = EXCLUDED.title, type = EXCLUDED.type, 
    goal_type = EXCLUDED.goal_type, goal_value = EXCLUDED.goal_value, 
    reward_type = EXCLUDED.reward_type, reward_value = EXCLUDED.reward_value,
    action_name = EXCLUDED.action_name, icon = EXCLUDED.icon, requirements = EXCLUDED.requirements;

-- Guerreiro
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'O Guerreiro', 'Complete 50 flexões (total).', 'individual', 'actions_completed', 5, 'exp', '500', 'Flexões (x10)', '⚔️', '{"totalReps": 5}')
ON CONFLICT (id) DO UPDATE SET 
    season_id = EXCLUDED.season_id, title = EXCLUDED.title, type = EXCLUDED.type, 
    goal_type = EXCLUDED.goal_type, goal_value = EXCLUDED.goal_value, 
    reward_type = EXCLUDED.reward_type, reward_value = EXCLUDED.reward_value,
    action_name = EXCLUDED.action_name, icon = EXCLUDED.icon, requirements = EXCLUDED.requirements;

-- Unidade do Clã
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Unidade do Clã', 'O Clã deve acumular 50 horas conjuntas.', 'clan', 'actions_completed', 50, 'exp', '2000', 'Socializar (1h)', '🗣️', '{"clanGoal": 50, "collectiveGoal": 50}')
ON CONFLICT (id) DO UPDATE SET 
    season_id = EXCLUDED.season_id, title = EXCLUDED.title, type = EXCLUDED.type, 
    goal_type = EXCLUDED.goal_type, goal_value = EXCLUDED.goal_value, 
    reward_type = EXCLUDED.reward_type, reward_value = EXCLUDED.reward_value,
    action_name = EXCLUDED.action_name, icon = EXCLUDED.icon, requirements = EXCLUDED.requirements;
