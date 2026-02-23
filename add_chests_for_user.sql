-- 1. Inserir 5 baús de cada tipo na tabela user_chests
INSERT INTO user_chests (user_id, chest_type, is_opened, earned_at)
SELECT 
  '5fa431dd-5862-41ea-974c-c4513af24765'::uuid, 
  t.type, 
  FALSE, 
  NOW()
FROM 
  unnest(ARRAY['incomum', 'ciclo', 'radiante', 'epico', 'season']) AS t(type)
CROSS JOIN 
  generate_series(1, 5);

-- 2. Sincronizar a coluna 'chests' em user_profiles com a contagem real
-- Isso garante que o frontend (que lê user_profiles) veja os baús imediatamente
WITH chest_counts AS (
  SELECT chest_type, count(*) as count
  FROM user_chests
  WHERE user_id = '5fa431dd-5862-41ea-974c-c4513af24765' AND is_opened = FALSE
  GROUP BY chest_type
),
chest_json AS (
  SELECT jsonb_agg(jsonb_build_object('type', chest_type, 'count', count)) as chests_data
  FROM chest_counts
)
UPDATE user_profiles
SET chests = COALESCE((SELECT chests_data FROM chest_json), '[]'::jsonb)
WHERE id = '5fa431dd-5862-41ea-974c-c4513af24765';
