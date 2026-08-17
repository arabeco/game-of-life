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
-- BLOCO 3 — respostas do pg_net
--
-- O app chama net.http_post com PERFORM (web push), descartando o id do request.
-- Ninguém nunca lê _http_response — as linhas são inalcançáveis por construção.
--
-- TRUNCATE em vez de DELETE + VACUUM FULL: devolve o espaço na hora e funciona
-- dentro de transação, que é o que o SQL Editor do Supabase exige.
-- ---------------------------------------------------------------------------
truncate net._http_response;


-- ---------------------------------------------------------------------------
-- BLOCO 4 — bloat das tabelas quentes  [OPCIONAL — não roda no SQL Editor]
--
-- VACUUM não pode rodar dentro de transação, e o SQL Editor envolve tudo em uma.
-- Só funciona por conexão direta (psql, DBeaver, TablePlus) com a connection
-- string de Database Settings:
--
--   vacuum full analyze public.user_profiles;
--   vacuum full analyze public.scheduled_tasks;
--   vacuum full analyze public.user_inventory;
--   vacuum full analyze public.app_runtime_events;
--
-- Vale pouco: essas quatro somam ~4 MB, contra os 76 MB dos blocos 2 e 3. O
-- autovacuum reaproveita esse espaço sozinho conforme o app grava. Só encare
-- isso se o banco voltar a incomodar depois de crescer de verdade.


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
