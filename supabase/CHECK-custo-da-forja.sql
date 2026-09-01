-- CHECAGEM — só lê, não altera nada.
--
-- O mesmo desacordo do `recycle_value`, do outro lado da moeda: o modal escreve
-- "Forjar 120 💎" a partir da tabela por patamar do cliente, e a forja cobra o
-- que estiver em `items.craft_cost`.
--
-- Aqui o erro é pior que no quebrar. Lá, divergir para menos pagava pouco. Aqui,
-- divergir para MAIS cobra mais do que a tela pediu — e cobrar a mais sem avisar
-- é a diferença entre um número errado e uma quebra de confiança.
with base as (
  select
    coalesce(tier, 1) as patamar,
    coalesce(craft_cost, 0) as servidor,
    case coalesce(tier, 1)
      when 1 then 40 when 2 then 120 when 3 then 400
      when 4 then 1200 when 5 then 4000 when 6 then 12000 else 0 end as o_app_promete
  from public.items
)
select
  patamar,
  count(*) as itens,
  min(o_app_promete) as o_app_promete,
  min(servidor) as servidor_min,
  max(servidor) as servidor_max,
  count(*) filter (where servidor is distinct from o_app_promete) as divergem,
  count(*) filter (where servidor > o_app_promete) as cobram_a_mais,
  count(*) filter (where servidor = 0) as saem_de_graca
from base
group by patamar
order by patamar;
