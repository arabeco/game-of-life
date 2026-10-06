-- AS REGRAS SECRETAS: SO POR REGRA, E OS NUMEROS PARA MEDIR.
--
-- As regras moram em constants/desbloqueiosPorRegra.ts e sao decididas no app
-- (utils/medidorDeSegredos.ts). Este arquivo nao repete nenhuma: ele tira as
-- pecas de regra da loja e do bau, cadastra os quinze premios novos e entrega os
-- NUMEROS que o medidor le.

begin;

-- ---------------------------------------------------------------------------
-- 1. As 20 pecas de regra saem da loja e do bau.
--
-- open_chest e buy_store_item ja recusam is_rank_exclusive (conferido no banco
-- em 06/10/2026, pelo supabase/CHECK-regras-secretas.sql). No servidor, a coluna
-- passa a querer dizer "vem por caminho proprio": patente ou regra.
-- ---------------------------------------------------------------------------
update public.items
set is_rank_exclusive = true, gold_price = null
where id in (
  'item_border_1_002', 'item_banner_disciplinado',
  'item_border_2_001', 'item_banner_popular',
  'item_border_t2_veterano', 'item_banner_t2_veterano',
  'item_border_3_001', 'item_banner_imparavel',
  'item_border_t3_mistico', 'item_banner_t3_mistico',
  'item_border_t3_transcendente', 'item_banner_t4_transcendente',
  'item_border_t4_celestial', 'item_banner_t4_celestial',
  'item_border_t4_guardia', 'item_banner_t4_guardia',
  'item_border_t4_oraculo', 'item_banner_t4_oraculo',
  'item_border_4_001', 'item_banner_lendaviva'
);

-- A raridade e a dificuldade da regra, e o par tem a mesma. O valor de reciclar
-- e o de forjar acompanham o tier, pela mesma tabela do app
-- (tools/generate-items-sql.mjs): o botao de quebrar le o tier.
update public.items set tier = 2, rarity = 'uncommon', recycle_value = 30, craft_cost = 120
where id in ('item_border_1_002', 'item_banner_disciplinado');
update public.items set tier = 3, rarity = 'rare', recycle_value = 100, craft_cost = 400
where id in ('item_border_t4_oraculo', 'item_banner_t4_oraculo');
update public.items set tier = 4, rarity = 'epic', recycle_value = 300, craft_cost = 1200
where id = 'item_border_t3_transcendente';

-- ---------------------------------------------------------------------------
-- 2. Os quinze premios novos, sem arte ainda: fora do jogo ate o PNG chegar.
--    Quando a arte entrar, a linha de cada um ganha image_url e
--    is_live_in_game = true.
-- ---------------------------------------------------------------------------
-- recycle_value e craft_cost sao NOT NULL no banco: tabela por tier do app.
insert into public.items (id, name, category, tier, rarity, recycle_value, craft_cost, gold_price, is_rank_exclusive, is_live_in_game)
values
  ('item_skin_1_012', 'Escriba', 'skin', 1, 'common', 10, 40, null, true, false),
  ('item_skin_2_010', 'Maratona', 'skin', 2, 'uncommon', 30, 120, null, true, false),
  ('item_skin_3_009', 'Ancião', 'skin', 3, 'rare', 100, 400, null, true, false),
  ('item_skin_4_005', 'Campeão', 'skin', 4, 'epic', 300, 1200, null, true, false),
  ('item_skin_5_003', 'Imperador', 'skin', 5, 'legendary', 1000, 4000, null, true, false),
  ('item_border_t2_sereno', 'Sereno', 'border', 2, 'uncommon', 30, 120, null, true, false),
  ('item_banner_t2_sereno', 'Sereno', 'banner', 2, 'uncommon', 30, 120, null, true, false),
  ('item_border_t3_alvorada', 'Alvorada', 'border', 3, 'rare', 100, 400, null, true, false),
  ('item_banner_t3_alvorada', 'Alvorada', 'banner', 3, 'rare', 100, 400, null, true, false),
  ('item_border_t3_prisma', 'Prisma', 'border', 3, 'rare', 100, 400, null, true, false),
  ('item_banner_t3_prisma', 'Prisma', 'banner', 3, 'rare', 100, 400, null, true, false),
  ('item_border_t4_profeta', 'Profeta', 'border', 4, 'epic', 300, 1200, null, true, false),
  ('item_banner_t4_profeta', 'Profeta', 'banner', 4, 'epic', 300, 1200, null, true, false),
  ('item_border_t5_pedra_da_lua', 'Pedra da Lua', 'border', 5, 'legendary', 1000, 4000, null, true, false),
  ('item_banner_t5_pedra_da_lua', 'Pedra da Lua', 'banner', 5, 'legendary', 1000, 4000, null, true, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Os numeros.
--
-- _marcas_secretas(uuid) conta por id e fica fechada para todo mundo menos o
-- dono do banco — e o que o CHECK usa no SQL Editor. A versao publica,
-- minhas_marcas_secretas(), le so a conta de quem chama. Como ela roda como
-- dono, cada consulta abaixo filtra pela pessoa explicitamente.
-- ---------------------------------------------------------------------------
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

commit;
