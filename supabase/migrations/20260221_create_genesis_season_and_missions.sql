
-- 1. Inserir ou Atualizar a Season Genesis
INSERT INTO seasons (id, name, description, theme, lore_text, background_png_url, start_date, end_date, is_active)
VALUES (
    'season-genesis-0',
    'Gênesis',
    'O início de uma nova era. Desperte seu potencial.',
    'Império',
    'O Império Genesis se ergue. Castelos de cristal e fortalezas de aço dominam o horizonte. É hora de construir seu legado.',
    'https://images.unsplash.com/photo-1468657988500-aca2be09f4c6?q=80&w=2070&auto=format&fit=crop', -- Imagem de Castelo/Império
    '2025-12-21',
    '2026-03-20',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    theme = EXCLUDED.theme,
    lore_text = EXCLUDED.lore_text,
    background_png_url = EXCLUDED.background_png_url,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    is_active = EXCLUDED.is_active;

-- 2. Limpar missões antigas desta season (para evitar duplicatas se rodar mais de uma vez)
DELETE FROM season_missions WHERE season_id = 'season-genesis-0';

-- 3. Inserir Missões (Mapeando do GMboard.ts para a estrutura do DB)
-- Nota: Ajustando goal_value e action_name para corresponder à lógica do GameContext

-- Quest: O Andarilho
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES (
    'quest-wanderer',
    'season-genesis-0',
    'O Andarilho',
    'Caminhe 20km no total para fortalecer suas pernas e espírito.',
    'individual',
    'actions_completed',
    20, -- 20 repetições de 1km
    'exp',
    1000,
    'Caminhada (1km)',
    '🥾',
    '{"totalReps": 20}'
);

-- Quest: O Erudito
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES (
    'quest-scholar',
    'season-genesis-0',
    'O Erudito',
    'Leia um livro inteiro ou dedique tempo consistente à leitura.',
    'individual',
    'actions_completed',
    15, -- 15 repetições de leitura focada
    'exp',
    800,
    'Leitura Focada',
    '📖',
    '{"totalReps": 15, "milestone": true}'
);

-- Quest: O Guerreiro
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES (
    'quest-warrior',
    'season-genesis-0',
    'O Guerreiro',
    'Complete 50 flexões (total acumulado) para fortalecer seu corpo.',
    'individual',
    'actions_completed',
    5, -- 5 repetições de 10 flexões
    'exp',
    500,
    'Flexões (x10)',
    '⚔️',
    '{"totalReps": 5}'
);

-- Quest: Unidade do Clã
INSERT INTO season_missions (id, season_id, title, description, type, goal_type, goal_value, reward_type, reward_value, action_name, icon, requirements)
VALUES (
    'quest-clan-unity',
    'season-genesis-0',
    'Unidade do Clã',
    'O Clã deve acumular 50 horas de atividades conjuntas.',
    'clan',
    'actions_completed', -- ou clan_goal
    50,
    'exp',
    2000,
    'Socializar (1h)',
    '🗣️',
    '{"clanGoal": 50, "collectiveGoal": 50}'
);
