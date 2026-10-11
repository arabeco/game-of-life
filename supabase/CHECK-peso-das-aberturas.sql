-- QUANTO CADA ABERTURA DO APP BAIXA (11/10/2026).
--
-- So leitura. Cada abertura grava o peso da abertura ANTERIOR (os primeiros 30
-- segundos depois de abrir do zero), entao os numeros aparecem a partir da
-- segunda abertura numa versao com o medidor (AAB 110 em diante).

select
  created_at at time zone 'America/Sao_Paulo' as quando,
  user_id,
  (metadata ->> 'egress_anterior_kb')::int as kb,
  (metadata ->> 'egress_anterior_pedidos')::int as pedidos
from public.app_runtime_events
where event_name = 'shell_ready'
  and metadata ? 'egress_anterior_kb'
order by created_at desc
limit 30;
