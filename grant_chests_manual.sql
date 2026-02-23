-- Script para adicionar 5 baús de cada tipo ao usuário especificado
-- UUID: 96f08119-c428-4ae8-8ec3-e29e6a36c739

-- 1. Inserir registros individuais na tabela user_chests
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

-- 2. Atualizar o resumo JSONB na tabela user_profiles para refletir o novo total
-- Esta consulta recalcula o total baseando-se na tabela user_chests para garantir consistência
UPDATE user_profiles
SET chests = (
  SELECT jsonb_agg(jsonb_build_object('type', type, 'count', count))
  FROM (
    SELECT chest_type as type, COUNT(*) as count
    FROM user_chests
    WHERE user_id = '96f08119-c428-4ae8-8ec3-e29e6a36c739' AND is_opened = FALSE
    GROUP BY chest_type
  ) sub
)
WHERE id = '96f08119-c428-4ae8-8ec3-e29e6a36c739';

-- 3. Garantir que o usuário tenha permissão de GM para ver as ferramentas de debug
UPDATE user_profiles
SET role = 'gm'
WHERE id = '96f08119-c428-4ae8-8ec3-e29e6a36c739';
