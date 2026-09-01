-- CHECAGEM — só lê, não altera nada.
--
-- O teste da funcao nova pagou 8 por um item de patamar 1, e a tabela do app diz
-- 10. Quem quebra le "Quebrar 10" e recebe 8.
--
-- Duas fontes para o mesmo numero: `items.recycle_value`, por item, no servidor;
-- e ECONOMY.recycle_values, por patamar, no cliente. Enquanto concordaram,
-- ninguem notou. Isto mede o desacordo antes de eu escolher qual das duas manda.
select
  coalesce(tier, 0) as patamar,
  count(*) as itens,
  case coalesce(tier, 1)
    when 1 then 10 when 2 then 30 when 3 then 100
    when 4 then 300 when 5 then 1000 when 6 then 3000 else 0 end as o_app_promete,
  min(coalesce(recycle_value, 0)) as servidor_min,
  max(coalesce(recycle_value, 0)) as servidor_max,
  count(*) filter (where coalesce(recycle_value, 0) is distinct from case coalesce(tier, 1)
    when 1 then 10 when 2 then 30 when 3 then 100
    when 4 then 300 when 5 then 1000 when 6 then 3000 else 0 end) as divergem,
  count(*) filter (where coalesce(recycle_value, 0) = 0) as pagam_zero
from public.items
group by coalesce(tier, 0)
order by 1;
