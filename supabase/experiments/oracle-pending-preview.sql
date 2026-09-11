-- TESTE SOMENTE LEITURA: nao gera cards, nao envia push e nao altera o cron.
-- Retorna um unico resultado. Mesmo fuso, categorias e virada das 4h do backend atual.
-- Nao e uma fila: duas execucoes concorrentes ainda podem selecionar a mesma pessoa.
-- Antes de ativar: reserva atomica, gravacao idempotente e EXPLAIN no banco real.
with clock as (
  select now() as instant,
    now() at time zone 'America/Sao_Paulo' as local_now
), bounds as (
  select *,
    (((local_now - interval '4 hours')::date + time '04:00')
      at time zone 'America/Sao_Paulo') as day_start,
    ((((local_now - interval '4 hours')::date + 1) + time '04:00')
      at time zone 'America/Sao_Paulo') as day_end
  from clock
), eligible as (
  select p.user_id,
    coalesce(to_jsonb(p.enabled_categories),
      '["frases_inspiradoras","reflexoes_filosoficas","fragmentos_sabedoria","rituais_lifestyle","sussurros_maestria"]'::jsonb) as categories,
    -- O backend atual considera horas e minutos, ignorando segundos.
    date_trunc('minute', date '2000-01-01' + coalesce(p.quiet_hours_start, time '22:00'))::time as quiet_start,
    date_trunc('minute', date '2000-01-01' + coalesce(p.quiet_hours_end, time '07:00'))::time as quiet_end
  from public.oracle_preferences p
  where p.ia_enabled is true
    and p.notifications_enabled is true
    and p.daily_focus_card_enabled is true
    and p.presence_level > 0
), available as (
  select e.user_id, e.categories
  from eligible e cross join bounds b
  where e.categories ?| array[
    'frases_inspiradoras','reflexoes_filosoficas','fragmentos_sabedoria',
    'rituais_lifestyle','sussurros_maestria'
  ]
    and not (
      (e.quiet_start < e.quiet_end
        and date_trunc('minute', b.local_now)::time >= e.quiet_start
        and date_trunc('minute', b.local_now)::time < e.quiet_end)
      or (e.quiet_start > e.quiet_end and (
        date_trunc('minute', b.local_now)::time >= e.quiet_start
        or date_trunc('minute', b.local_now)::time < e.quiet_end
      ))
    )
), pending as (
  select a.user_id from available a cross join bounds b
  where not exists (
    select 1 from public.oracle_messages m
    where m.user_id = a.user_id
      and m.delivery_type = 'feed'
      and m.created_at >= b.day_start and m.created_at < b.day_end
      and coalesce(m.context_snapshot ->> 'triggerType', '') <> 'manual'
      and a.categories ? m.category::text
      and m.category::text = any(array[
        'frases_inspiradoras','reflexoes_filosoficas','fragmentos_sabedoria',
        'rituais_lifestyle','sussurros_maestria'
      ])
  )
), batch as (
  select p.user_id from pending p cross join bounds b
  -- Alterna a ordem a cada rodada; nenhum usuario sem conteudo trava o inicio da fila.
  order by md5(p.user_id::text || floor(extract(epoch from b.instant) / 600)::text), p.user_id
  limit 25
)
select
  (select count(*) from eligible) as usuarios_no_select_atual,
  (select count(*) from available) as fora_do_silencio_com_categorias,
  (select count(*) from pending) as ainda_sem_card_automatico_hoje,
  (select count(*) from batch) as usuarios_retornados_no_lote_novo,
  (select count(*) from eligible) - (select count(*) from batch) as ids_a_menos_transferidos_nesta_consulta;
