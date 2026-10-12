-- O QUE A ABERTURA DO APP BAIXA, CONSULTA POR CONSULTA (12/10/2026).
--
-- So leitura. Cada linha repete uma consulta que o app faz ao abrir, com os
-- mesmos filtros, e mede o tamanho do JSON que ela devolve para a conta do
-- Afonso. O total bate de perto com o que o medidor de abertura conta no
-- celular (JSON sem compressao).
--
-- Dois blocos: rode UM DE CADA VEZ e me mande as duas tabelas.

-- 1. CADA CONSULTA DA ABERTURA -------------------------------------------------
with eu as (select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id),
consultas(consulta, n, bytes) as (
  select 'perfil (user_profiles *)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.user_profiles t, eu where t.id = eu.id
  union all
  select 'arenas *', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.arenas t, eu where t.user_id::text = eu.id::text
  union all
  select 'acoes (actions *)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.actions t, eu where t.user_id::text = eu.id::text
  union all
  select 'tarefas: 3 meses atras ate +35 dias', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.scheduled_tasks t, eu
  where t.user_id::text = eu.id::text
    and t.date::date between (current_date - interval '3 months')::date and current_date + 35
  union all
  select 'niveis (asset_levels *)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.asset_levels t, eu where t.user_id::text = eu.id::text
  union all
  select 'ciclos abertos (sem relatorio)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from (select * from public.cycles c, eu where c.user_id::text = eu.id::text and c.report_data is null limit 50) t
  union all
  select 'ciclos fechados (com relatorio)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from (select c.* from public.cycles c, eu where c.user_id::text = eu.id::text and c.report_data is not null limit 100) t
  union all
  select '  so a coluna report_data', count(*), coalesce(sum(octet_length(t.report_data::text)), 0)
  from public.cycles t, eu where t.user_id::text = eu.id::text and t.report_data is not null
  union all
  select 'campanhas (2x: carrega duas vezes)', count(*), 2 * octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.campaigns t, eu where t.user_id::text = eu.id::text
  union all
  select 'pastas (arena_folders *)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.arena_folders t, eu where t.user_id::text = eu.id::text
  union all
  select 'inventario (user_inventory *)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.user_inventory t, eu where t.user_id::text = eu.id::text
  union all
  select 'oraculo: 20 mensagens', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from (select m.* from public.oracle_messages m, eu where m.user_id::text = eu.id::text order by m.created_at desc limit 20) t
  union all
  select 'notificacoes: TODAS, sem limite', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from public.notifications t, eu where t.user_id::text = eu.id::text
  union all
  select 'amigos e pedidos', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from (
    select to_jsonb(f) as r from public.friends f, eu where f.user_id::text = eu.id::text
    union all
    select to_jsonb(r) from public.friend_requests r, eu
    where r.recipient_id::text = eu.id::text or r.sender_id::text = eu.id::text
  ) t
  union all
  select 'temporadas + missoes (de todos)', count(*), octet_length(coalesce(json_agg(t)::text, '[]'))
  from (
    select to_jsonb(s) as r from public.seasons s
    union all
    select to_jsonb(m) from public.season_missions m
  ) t
)
select consulta, n as linhas, round(bytes / 1024.0, 1) as kb
from consultas
union all
select 'TOTAL (sem a linha "so a coluna")', sum(n) filter (where consulta not like '  %'),
  round(sum(bytes) filter (where consulta not like '  %') / 1024.0, 1)
from consultas
order by kb desc;


-- 2. DENTRO DOS RELATORIOS: O QUE PESA ------------------------------------------
-- Cada chave do report_data (e de report_data.metrics), somada em todos os
-- ciclos fechados.
with eu as (select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id),
relatorios as (
  select c.report_data as r
  from public.cycles c, eu
  where c.user_id::text = eu.id::text and c.report_data is not null
),
chaves as (
  select k.key as chave, octet_length(k.value::text) as bytes
  from relatorios, jsonb_each(relatorios.r::jsonb) k
  union all
  select 'metrics.' || k.key, octet_length(k.value::text)
  from relatorios, jsonb_each(coalesce(relatorios.r::jsonb -> 'metrics', '{}'::jsonb)) k
)
select chave, count(*) as ciclos, round(sum(bytes) / 1024.0, 1) as kb
from chaves
group by chave
order by sum(bytes) desc
limit 20;


-- 3. TAREFAS, INVENTARIO E PERFIL: QUAL COLUNA PESA -----------------------------
-- O nome da coluna conta: o JSON repete o nome em cada linha.
with eu as (select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id),
linhas as (
  select 'tarefas' as tabela, to_jsonb(t) as r
  from public.scheduled_tasks t, eu
  where t.user_id::text = eu.id::text
    and t.date::date between (current_date - interval '3 months')::date and current_date + 35
  union all
  select 'inventario', to_jsonb(t) from public.user_inventory t, eu where t.user_id::text = eu.id::text
  union all
  select 'perfil', to_jsonb(t) from public.user_profiles t, eu where t.id = eu.id
)
select tabela, k.key as coluna,
  round(sum(octet_length(k.key) + octet_length(k.value::text) + 4) / 1024.0, 1) as kb
from linhas, jsonb_each(linhas.r) k
group by tabela, k.key
order by sum(octet_length(k.key) + octet_length(k.value::text) + 4) desc
limit 30;
