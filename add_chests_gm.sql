-- 1. Inserir 5 baus de cada tipo na tabela user_chests para o GM
INSERT INTO user_chests (user_id, chest_type, is_opened, earned_at)
SELECT 
  '96f08119-c428-4ae8-8ec3-e29e6a36c739'::uuid,
  t.type,
  FALSE,
  NOW()
FROM 
  unnest(ARRAY['Comum', 'Incomum', 'Raro', '?pico', 'Lend?rio', 'Season', 'Ciclo']) AS t(type)
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
  SELECT jsonb_agg(jsonb_build_object('type', chest_type, 'count', count) ORDER BY chest_type) as chests_data
  FROM chest_counts
)
UPDATE user_profiles
SET chests = COALESCE((SELECT chests_data FROM chest_json),
  '[{"type": "Comum", "count": 5}, {"type": "Incomum", "count": 5}, {"type": "Raro", "count": 5}, {"type": "?pico", "count": 5}, {"type": "Lend?rio", "count": 5}, {"type": "Season", "count": 5}, {"type": "Ciclo", "count": 5}]'::jsonb
)
WHERE id = '96f08119-c428-4ae8-8ec3-e29e6a36c739';

-- 3. Force update de fallback
UPDATE user_profiles
SET chests = '[{"type": "Comum", "count": 5}, {"type": "Incomum", "count": 5}, {"type": "Raro", "count": 5}, {"type": "?pico", "count": 5}, {"type": "Lend?rio", "count": 5}, {"type": "Season", "count": 5}, {"type": "Ciclo", "count": 5}]'::jsonb
WHERE id = '96f08119-c428-4ae8-8ec3-e29e6a36c739';
