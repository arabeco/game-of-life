-- FECHA AS FUNCOES INTERNAS QUE QUALQUER UM PODIA CHAMAR (26/11/2026).
--
-- Achado na checagem de prontidao (supabase db advisors + teste com a chave
-- publica). O Postgres da EXECUTE ao PUBLIC em toda funcao nova, e o Supabase
-- expoe toda funcao do schema public em /rest/v1/rpc. Estas 15 rodam como dono
-- (security definer), gravam e nao conferem quem chama. Com a chave publica
-- que vai dentro do app, qualquer pessoa — sem login — podia:
--   _codex_set_wallet_gold        definir o ouro de qualquer conta
--   _starter_reward_credit_gold   dar ouro a qualquer conta
--   _starter_reward_grant_inventory_item_once / _mark_unlock   dar item
--   _starter_reward_mark_purchase marcar compra para qualquer conta
--   _nullify_public_uuid_column   zerar qualquer coluna uuid de qualquer tabela
--   _handoff_or_delete_led_clans  passar adiante ou apagar os clas de alguem
--   issue_golden_invites          emitir convites dourados
--   ... e o resto da lista abaixo.
--
-- Ninguem de fora precisa delas. Quem as chama sao outras funcoes security
-- definer (do mesmo dono, postgres), que seguem podendo: dentro delas a
-- permissao conferida e a do dono. Nenhuma regra de RLS nem funcao comum
-- (invoker) depende delas — conferido em producao antes de escrever isto.
-- O app nao chama nenhuma das 15.
--
-- As duas que o app chama logado perdem so o acesso sem login.
--
-- Pode ser rodado de novo sem estrago.

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        '_codex_debit_gold',
        '_codex_set_wallet_gold',
        '_create_competition_snapshot_from_invite',
        '_create_competition_snapshot',
        '_handoff_or_delete_led_clans',
        '_nullify_public_uuid_column',
        '_starter_reward_credit_gold',
        '_starter_reward_grant_inventory_item_once',
        '_starter_reward_mark_purchase',
        '_starter_reward_mark_unlock',
        '_starter_reward_set_wallet_gold',
        'anunciar_patente_do_cla',
        'bootstrap_new_player_rewards_for_user',
        'enqueue_cycle_deadline_notifications',
        'issue_golden_invites'
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;

  -- Chamadas pelo app com a pessoa logada: so o acesso sem login sai.
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('increment_clan_mission_progress', 'expire_stale_relationship_link_invites')
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

notify pgrst, 'reload schema';

-- CONFERENCIA (so le). Tudo tem de dar false na coluna anon; e false na
-- coluna logado, menos nas duas ultimas.
select p.proname as funcao,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as logado
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    '_codex_debit_gold', '_codex_set_wallet_gold', '_create_competition_snapshot_from_invite',
    '_create_competition_snapshot', '_handoff_or_delete_led_clans', '_nullify_public_uuid_column',
    '_starter_reward_credit_gold', '_starter_reward_grant_inventory_item_once',
    '_starter_reward_mark_purchase', '_starter_reward_mark_unlock', '_starter_reward_set_wallet_gold',
    'anunciar_patente_do_cla', 'bootstrap_new_player_rewards_for_user',
    'enqueue_cycle_deadline_notifications', 'issue_golden_invites',
    'increment_clan_mission_progress', 'expire_stale_relationship_link_invites')
order by logado, p.proname;
