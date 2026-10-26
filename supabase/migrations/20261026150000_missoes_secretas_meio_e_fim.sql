-- MISSOES SECRETAS DE MEIO E FIM DE JOGO (26/10/2026).
--
-- Treze regras novas e EXP em todas. Quem decide e utils/medidorDeSegredos.ts;
-- aqui so entram quatro numeros novos na mesma leitura de sempre:
--   diasEntrePrimeiraEUltimaAcao  (Veterano: 1 ano entre a 1a e a ultima acao)
--   maiorRepeticaoDeAcao          (Ritual e Liturgia: a mesma acao, mesmo id)
--   diasComMaisDe350Exp           (Disciplinado e Fornalha)
--   arenasConcluidasComMeta       (Trofeus e Galeria)
-- Os ciclos de 7 dias ou mais saem do campo `dias` que ja vinha.
--
-- O resto da funcao e igual a 20261006180000_regras_secretas.sql.

-- Os quatro pares que foram para as missoes grandes sobem para a raridade
-- delas. Reciclar e forjar acompanham o tier, pela mesma tabela de sempre.
update public.items set tier = 3, rarity = 'rare', recycle_value = 100, craft_cost = 400
where id in ('item_border_2_001', 'item_banner_popular', 'item_border_t2_veterano', 'item_banner_t2_veterano');
update public.items set tier = 4, rarity = 'epic', recycle_value = 300, craft_cost = 1200
where id in ('item_border_1_002', 'item_banner_disciplinado', 'item_border_3_001', 'item_banner_imparavel');

create or replace function public._marcas_secretas(p_user uuid)
returns jsonb
language sql
stable
set search_path = public
as $$
  with
  concluidas as (
    select st.date, st.start_time, st.action_id
    from public.scheduled_tasks st
    where st.user_id = p_user
      and coalesce(st.completed, false)
      and st.date ~ '^\d{4}-\d{2}-\d{2}'
  ),
  por_dia as (
    select left(date, 10)::date as dia, count(*) as quantas
    from concluidas
    group by 1
  ),
  -- A sequencia como o relatorio a conta: dias seguidos com acao concluida.
  sequencias as (
    select count(*) as tamanho
    from (select dia, dia - (row_number() over (order by dia))::int as grupo from por_dia) ilhas
    group by grupo
  ),
  areas_por_dia as (
    select left(c.date, 10)::date as dia, count(distinct ar.asset_id) as areas
    from concluidas c
    join public.actions a on a.id::text = c.action_id
    join public.arenas ar on ar.id = a.arena_id
    where ar.asset_id in ('proposito', 'relacoes', 'trabalho', 'lazer', 'saude')
    group by 1
  ),
  sequencias_cinco as (
    select count(*) as tamanho
    from (
      select dia, dia - (row_number() over (order by dia))::int as grupo
      from areas_por_dia
      where areas = 5
    ) ilhas
    group by grupo
  ),
  -- 04:00 a 06:59: antes das quatro ainda e a madrugada do dia anterior.
  cedo_por_dia as (
    select left(date, 10)::date as dia, count(*) as quantas
    from concluidas
    where start_time >= 240 and start_time < 420
    group by 1
  ),
  semanas_cedo as (
    select (
      select coalesce(sum(c2.quantas), 0)
      from cedo_por_dia c2
      where c2.dia between c1.dia and c1.dia + 6
    ) as quantas
    from cedo_por_dia c1
  ),
  -- A mesma acao (mesmo id) concluida varias vezes. Copiar a arena gera ids
  -- novos e recomeca a conta; arquivar nao muda nada.
  por_acao as (
    select action_id, count(*) as vezes
    from concluidas
    group by 1
  ),
  ciclos as (
    select c.end_date, (c.end_date - c.start_date + 1) as dias, c.report_data
    from public.cycles c
    where c.user_id = p_user and c.report_data is not null
  )
  select jsonb_build_object(
    'acoesConcluidas', (select count(*) from concluidas),
    'maiorSequencia', coalesce((select max(tamanho) from sequencias), 0),
    'maiorDia', coalesce((select max(quantas) from por_dia), 0),
    'diasSeguidosComCincoAreas', coalesce((select max(tamanho) from sequencias_cinco), 0),
    'maiorSemanaAntesDasSete', coalesce((select max(quantas) from semanas_cedo), 0),
    -- 26/10/2026: as missoes de meio e fim de jogo.
    'diasEntrePrimeiraEUltimaAcao', coalesce((select max(dia) - min(dia) from por_dia), 0),
    'maiorRepeticaoDeAcao', coalesce((select max(vezes) from por_acao), 0),
    -- O EXP que o fecho do dia depositou de fato (o julgamento).
    'diasComMaisDe350Exp', (
      select count(*) from public.daily_commitments d
      where d.user_id = p_user and d.stage = 'judgment' and coalesce(d.exp_deposited, 0) > 350
    ),
    'arenasConcluidasComMeta', (
      select count(*) from public.arenas ar
      where ar.user_id = p_user and ar.completed_at is not null
        and nullif(btrim(coalesce(ar.final_goal, '')), '') is not null
    ),
    -- Pagina escrita: pelo menos 100 caracteres.
    'paginasDoDiario', (
      select count(*) from public.journal_pages j
      where j.user_id = p_user and char_length(btrim(j.content)) >= 100
    ),
    'diasDeHumor', (
      select count(distinct (m.recorded_at at time zone 'America/Sao_Paulo')::date)
      from public.mood_entries m
      where m.user_id = p_user
    ),
    'amizades', (select count(*) from public.friends f where f.user_id = p_user),
    'competicoesVencidas', (
      select count(*) from public.relationship_competition_challenges ch
      where ch.winner_user_id = p_user
    ),
    -- Pacto de arena reclamado. O de tipo `primeira` e a missao inicial do
    -- onboarding, e nao conta.
    'missoesDoOraculo', (
      select count(*) from public.user_purchases up
      where up.user_id = p_user
        and up.product_type = 'arena_pact'
        and up.product_id not like '%:primeira:%'
    ),
    -- Como mentor, chegou ao prazo sem ninguem sair antes.
    'mentoriasAteOFim', (
      select count(*) from public.relationship_links l
      where l.link_type = 'mentoria'
        and l.mentor_id = p_user
        and l.expires_at <= now()
        and (l.ended_at is null or l.ended_at >= l.expires_at)
    ),
    'ciclos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'fim', end_date,
        'dias', dias,
        'nota', report_data->>'grade',
        'feitas', nullif(coalesce(report_data->'metrics'->>'actions_completed', report_data->'metrics'->>'actionsCompleted'), '')::numeric,
        'planejadas', nullif(coalesce(report_data->'metrics'->>'total_planned_actions', report_data->'metrics'->>'totalPlannedActions'), '')::numeric,
        'arenasFechadasPorArea', report_data->'metrics'->'arenas_fechadas_por_area'
      ) order by end_date)
      from ciclos
    ), '[]'::jsonb)
  );
$$;

create or replace function public.minhas_marcas_secretas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public._marcas_secretas(auth.uid());
$$;

revoke all on function public._marcas_secretas(uuid) from public, anon, authenticated;
revoke all on function public.minhas_marcas_secretas() from public, anon;
grant execute on function public.minhas_marcas_secretas() to authenticated;

-- Conferencia: as 4 chaves novas e os 8 itens com a raridade nova.
select 'chave' as o_que, k as valor
from jsonb_object_keys(public._marcas_secretas('00000000-0000-0000-0000-000000000000'::uuid)) k
where k in ('diasEntrePrimeiraEUltimaAcao', 'maiorRepeticaoDeAcao', 'diasComMaisDe350Exp', 'arenasConcluidasComMeta')
union all
select 'item', id || ' = ' || rarity
from public.items
where id in ('item_border_2_001', 'item_banner_popular', 'item_border_t2_veterano', 'item_banner_t2_veterano',
             'item_border_1_002', 'item_banner_disciplinado', 'item_border_3_001', 'item_banner_imparavel')
order by 1, 2;
