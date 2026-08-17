-- Manutenção do banco — rodar no SQL Editor do Supabase.
--
-- NÃO é uma migration: VACUUM FULL não pode rodar dentro de transação, e migrations
-- rodam em transação. Por isso este arquivo fica separado e é colado à mão.
--
-- Contexto (medido em 16/08/2026, 4 usuários, banco em 104 MB):
--   job_run_details  44 MB / 0 linhas vivas  -> histórico do pg_cron, puro inchaço
--   _http_response   32 MB / 36 linhas       -> respostas do pg_net nunca podadas
--   user_profiles     2 MB / 4 linhas        -> 8 KB de dado real, resto é bloat de UPDATE
--
-- Rode os blocos NA ORDEM, um de cada vez, conferindo o resultado.


-- ---------------------------------------------------------------------------
-- BLOCO 1 — antes: fotografa o estado para comparar depois
-- ---------------------------------------------------------------------------
select pg_size_pretty(pg_database_size(current_database())) as banco_antes;


-- ---------------------------------------------------------------------------
-- BLOCO 2 — entulho do pg_cron
-- 0 linhas vivas: não há histórico a perder. TRUNCATE devolve o espaço na hora,
-- sem precisar de vacuum.
-- ---------------------------------------------------------------------------
truncate cron.job_run_details;


-- ---------------------------------------------------------------------------
-- BLOCO 3 — respostas antigas do pg_net
-- ---------------------------------------------------------------------------
delete from net._http_response where created < now() - interval '1 day';
vacuum full net._http_response;


-- ---------------------------------------------------------------------------
-- BLOCO 4 — bloat das tabelas quentes
-- Estas são atualizadas com muita frequência pelo app (updateUserProfile roda o
-- tempo todo), então acumulam linhas mortas.
--
-- ATENÇÃO: VACUUM FULL trava a tabela enquanto roda. Nessas tabelas, com o volume
-- atual, são segundos — mas evite horário de pico.
-- ---------------------------------------------------------------------------
vacuum full analyze public.user_profiles;
vacuum full analyze public.scheduled_tasks;
vacuum full analyze public.user_inventory;
vacuum full analyze public.app_runtime_events;


-- ---------------------------------------------------------------------------
-- BLOCO 5 — poda automática, para o entulho não voltar
-- Roda todo dia às 4h. Se já existir um job com este nome, o unschedule evita erro.
-- ---------------------------------------------------------------------------
select cron.unschedule('purge-runtime-history')
where exists (select 1 from cron.job where jobname = 'purge-runtime-history');

select cron.schedule('purge-runtime-history', '0 4 * * *', $$
  delete from cron.job_run_details where end_time < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '2 days';
$$);


-- ---------------------------------------------------------------------------
-- BLOCO 6 — depois: confirma o resultado
-- ---------------------------------------------------------------------------
select pg_size_pretty(pg_database_size(current_database())) as banco_depois;

select relname as tabela,
       n_live_tup as vivas,
       n_dead_tup as mortas,
       pg_size_pretty(pg_total_relation_size(relid)) as tamanho
from pg_stat_user_tables
order by pg_total_relation_size(relid) desc
limit 12;
