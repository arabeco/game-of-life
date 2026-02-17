
-- Permitir que membros removam sua própria participação em missões de clã
-- (Necessário para o fluxo de "Sair da Missão" ou "Deletar Arena/Ação")

-- 1. Verificar se a política já existe e remover para evitar conflitos (opcional, mas seguro)
DROP POLICY IF EXISTS "delete_own_clan_mission_participation" ON public.clan_mission_participants;

-- 2. Criar a política de DELETE
-- Um usuário só pode deletar linhas onde o user_id é ele mesmo
CREATE POLICY "delete_own_clan_mission_participation" ON public.clan_mission_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Garantir que RLS está ativo (já deve estar, mas por segurança)
ALTER TABLE public.clan_mission_participants ENABLE ROW LEVEL SECURITY;

-- 4. Permitir que usuários deletem suas próprias ações (se houver alguma restrição global, o que não é padrão, mas bom garantir)
-- A tabela 'actions' geralmente já tem políticas, mas vamos reforçar se necessário.
-- Normalmente actions é pública ou tem policy 'Users can all on own actions'.
-- Vamos verificar se precisamos adicionar algo para actions. 
-- Se a tabela actions for 'public' sem RLS, ok. Se tiver RLS, precisa de policy.
-- Assumindo que actions tem RLS ativado (padrão do projeto):

DROP POLICY IF EXISTS "delete_own_action" ON public.actions;

CREATE POLICY "delete_own_action" ON public.actions
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Mesma coisa para arenas
DROP POLICY IF EXISTS "delete_own_arena" ON public.arenas;

CREATE POLICY "delete_own_arena" ON public.arenas
    FOR DELETE USING (auth.uid() = user_id);
