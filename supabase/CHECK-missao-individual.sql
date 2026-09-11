-- SOMENTE LEITURA, resultado unico; nao revela contas, nao aceita nem paga missoes.
with functions as (
  select p.proname, pg_get_functiondef(p.oid) as definition
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('accept_arena_pact','claim_arena_pact_reward','abandon_arena_pact')
), missions as (
  select to_jsonb(p) as profile from public.user_profiles p
)
select jsonb_build_object(
  'funcoes', (select jsonb_agg(jsonb_build_object(
    'nome', proname,
    'md5', md5(definition),
    'checagem_tipo_ativo_com_uuid', definition ~ 'v_active\s+uuid' and definition like '%select arena_pact_kind into v_active%',
    'suporta_escopo_geral', definition like '%PACT_SCOPE_REQUIRES_VOLUME%',
    'retomada_com_meta_corrigida', definition like '%count(distinct task_id) >= v_goal%'
  )) from functions),
  'missoes_gerais_ativas', (select count(*) from missions where profile->>'arena_pact_kind' is not null and profile->>'arena_pact_arena_id' is null),
  'missoes_de_arena_ativas', (select count(*) from missions where profile->>'arena_pact_kind' is not null and profile->>'arena_pact_arena_id' is not null),
  'retomadas_meta_2', (select count(*) from missions where profile->>'arena_pact_kind'='retomada' and profile->>'arena_pact_goal'='2')
) as verificacao;
