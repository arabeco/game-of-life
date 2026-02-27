-- RESET MISSIONS SCRIPT
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real do seu usuário (UUID)
-- Você pode encontrar seu ID na URL do perfil ou no console (userProfile.id)

DO $$ 
DECLARE 
    target_user_id UUID := 'SEU_USER_ID_AQUI'; 
BEGIN
    -- 1. Remover participação em missões de clã (Opt-in)
    DELETE FROM public.clan_mission_participants 
    WHERE user_id = target_user_id;

    -- 2. Limpar missões completadas no perfil (array de texto)
    UPDATE public.user_profiles 
    SET completed_season_missions = '{}'
    WHERE id = target_user_id;

    -- 3. Remover ações criadas para missões de temporada e clã
    -- Isso permite que o usuário aceite as missões novamente
    DELETE FROM public.actions 
    WHERE user_id = target_user_id 
    AND (
        arena_id IN (
            SELECT id FROM public.arenas 
            WHERE name LIKE 'Quests - %'
        )
        OR name IN (
            'O Andarilho', 'O Erudito', 'O Guerreiro', 'Unidade do Clã', 
            'Socializar', 'Socializar (1h)', 'Caminhada (1km)', 
            'Leitura Focada', 'Flexões (x10)', 'Criar Ciclo', 
            'Perfil de Ativos', 'Soberano', 'Arenas', 'Ações', 
            'Completar Ação', 'Compartilhar'
        )
    );

    RAISE NOTICE 'Progresso de missões resetado para o usuário %', target_user_id;
END $$;
