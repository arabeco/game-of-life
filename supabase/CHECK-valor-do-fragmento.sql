-- CHECAGEM — só lê, não altera nada.
--
-- O teste da funcao nova pagou 8 por um item de patamar 1, e a tabela do app diz
-- 10. Quem quebra le "Quebrar 10" e recebe 8.
--
-- Duas fontes para o mesmo numero: `items.recycle_value`, por item, no servidor;
-- e ECONOMY.recycle_values, por patamar, no cliente. Enquanto concordaram,
-- ninguem notou. Isto mede o desacordo antes de eu escolher qual das duas manda.
--
-- O calculo do patamar sai para um CTE em vez de repetir a expressao no select e
-- no group by: repetida, ela vira duas expressoes diferentes aos olhos do
-- Postgres, e foi assim que a primeira versao disto quebrou.
with base as (
  select
    coalesce(tier, 1) as patamar,
    coalesce(recycle_value, 0) as valor_servidor,
    case coalesce(tier, 1)
      when 1 then 10 when 2 then 30 when 3 then 100
      when 4 then 300 when 5 then 1000 when 6 then 3000 else 0 end as o_app_promete
  from public.items
)
select
  patamar,
  count(*) as itens,
  min(o_app_promete) as o_app_promete,
  min(valor_servidor) as servidor_min,
  max(valor_servidor) as servidor_max,
  count(*) filter (where valor_servidor is distinct from o_app_promete) as divergem,
  count(*) filter (where valor_servidor = 0) as pagam_zero
from base
group by patamar
order by patamar;
