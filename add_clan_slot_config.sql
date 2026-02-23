
-- Adicionar coluna para configuração de slots (nomes/emojis personalizados)
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS slot_config JSONB DEFAULT '{}';

-- Exemplo de estrutura do JSONB:
-- {
--   "mesa_1": { "label": "Marketing", "emoji": "📢" },
--   "mesa_central": { "label": "Brainstorm", "emoji": "💡" }
-- }
