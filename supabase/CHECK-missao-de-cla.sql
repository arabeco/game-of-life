-- CONFERE A MISSAO DE CLA (12/10/2026). Rode depois de 20261012200000_missao_de_cla.sql.
select
  to_regclass('public.clan_quests') is not null as tabela_de_missoes,
  to_regclass('public.clan_quest_participants') is not null as tabela_de_participantes,
  exists (select 1 from public.clan_quests where id = 'clan-genesis-socializar' and goal = 20 and reward_chest = 'Raro') as socializar_na_genesis,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.entrar_na_missao_de_cla(text,text)'), 'execute'), false) as app_entra,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.status_da_missao_de_cla(text)'), 'execute'), false) as app_le,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.receber_premio_da_missao_de_cla(text)'), 'execute'), false) as app_recebe,
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.humor_do_meu_cla()'), 'execute'), false) as app_ve_humor,
  not coalesce(has_function_privilege('anon', to_regprocedure('public.humor_do_meu_cla()'), 'execute'), false) as visitante_nao_ve_humor,
  not has_table_privilege('authenticated', 'public.clan_quest_participants', 'insert') as ninguem_escreve_direto;
