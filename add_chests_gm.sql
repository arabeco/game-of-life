-- 1. Inserir 5 baús de cada tipo na tabela user_chests para o GM
INSERT INTO user_chests (user_id, chest_type, is_opened, earned_at)
SELECT 
  '96f08119-c428-4ae8-8ec3-e29e6a36c739'::uuid, 
  t.type, 
  FALSE, 
  NOW()
FROM 
  unnest(ARRAY['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário']) AS t(type)
CROSS JOIN 
  generate_series(1, 5);

-- 2. Sincronizar a coluna 'chests' em user_profiles com a contagem real
WITH chest_counts AS (
  SELECT chest_type, count(*) as count
  FROM user_chests
  WHERE user_id = '96f08119-c428-4ae8-8ec3-e29e6a36c739' AND is_opened = FALSE
  GROUP BY chest_type
),
chest_json AS (
  SELECT jsonb_agg(jsonb_build_object('type', chest_type, 'count', count)) as chests_data
  FROM chest_counts
)
UPDATE user_profiles
SET chests = COALESCE((SELECT chests_data FROM chest_json), 
  -- Fallback if user_chests is empty or not fully populated yet, we enforce the JSON structure directly for immediate effect
  '[{"type": "Comum", "count": 5}, {"type": "Incomum", "count": 5}, {"type": "Raro", "count": 5}, {"type": "Épico", "count": 5}, {"type": "Lendário", "count": 5}]'::jsonb
)
WHERE id = '96f08119-c428-4ae8-8ec3-e29e6a36c739';

-- Force update just in case the sync above relied on user_chests being populated which might not exist in all envs
UPDATE user_profiles
SET chests = '[{"type": "Comum", "count": 5}, {"type": "Incomum", "count": 5}, {"type": "Raro", "count": 5}, {"type": "Épico", "count": 5}, {"type": "Lendário", "count": 5}]'::jsonb
WHERE id = '96f08119-c428-4ae8-8ec3-e29e6a36c739';
