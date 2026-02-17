-- ==============================================================================
-- SCRIPT DE CORREÇÃO E LIMPEZA - CLAN MISSIONS & ARENAS
-- ==============================================================================
-- Instruções:
-- 1. Copie todo este conteúdo.
-- 2. Vá no Painel do Supabase -> SQL Editor.
-- 3. Cole e clique em "Run".
-- ==============================================================================

-- 1. [CRÍTICO] CORREÇÃO DE PERMISSÕES (RLS)
-- Adiciona a permissão que faltava para o usuário conseguir SAIR (deletar) sua participação na missão.
DROP POLICY IF EXISTS "delete_own_participation" ON public.clan_mission_participants;
CREATE POLICY "delete_own_participation" ON public.clan_mission_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Garante que o usuário possa ver suas próprias participações (caso a policy de select esteja restritiva demais)
DROP POLICY IF EXISTS "select_own_participation" ON public.clan_mission_participants;
CREATE POLICY "select_own_participation" ON public.clan_mission_participants
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_participants.clan_id AND cm.user_id = auth.uid()));

-- 2. LIMPEZA DE ARENAS BUGADAS
-- Remove arenas que foram criadas com nomes inválidos (como "1") devido a bugs anteriores.
DELETE FROM public.arenas
WHERE name IN ('1', 'undefined', 'null', 'Arena Sem Nome');

-- 3. LIMPEZA DE PARTICIPAÇÕES INVÁLIDAS
-- Remove registros de participação em missões que não existem ou são IDs antigos.
-- Mantém apenas a missão oficial de clã atual ('quest-clan-unity').
DELETE FROM public.clan_mission_participants
WHERE mission_id NOT IN ('quest-clan-unity');

-- 4. LIMPEZA DE AÇÕES "ÓRFÃS"
-- Remove ações que ficaram no banco mas não têm mais uma arena associada.
DELETE FROM public.actions
WHERE arena_id NOT IN (SELECT id FROM public.arenas);

-- 5. [OPCIONAL] RESET DO PROGRESSO DA MISSÃO DE CLÃ
-- Se a barra de progresso estiver travada ou errada, descomente a linha abaixo para resetar.
-- DELETE FROM public.clan_mission_progress WHERE mission_id = 'quest-clan-unity';

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================
