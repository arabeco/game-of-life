-- Atualização do Schema para Suporte a Codex e Níveis

-- 1. Adicionar colunas na tabela de ARENAS para rastrear origem e nível
ALTER TABLE public.arenas 
ADD COLUMN IF NOT EXISTS origin_codex_id UUID,
ADD COLUMN IF NOT EXISTS codex_level INT;

-- 2. Adicionar coluna na tabela de AÇÕES para rastrear origem
ALTER TABLE public.actions
ADD COLUMN IF NOT EXISTS origin_codex_id UUID;

-- 3. Adicionar coluna no PERFIL DO USUÁRIO para salvar compras e desbloqueios
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS unlocked_items JSONB DEFAULT '{}'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.arenas.codex_level IS 'Nível do Codex ao qual esta arena pertence (ex: 1, 2, 3)';
COMMENT ON COLUMN public.user_profiles.unlocked_items IS 'Armazena itens comprados como Codexes e Cosméticos em formato JSON';
