begin;

-- O valor do fragmento passa a ser um numero so.
--
-- Havia duas fontes para a mesma coisa: `items.recycle_value`, por item, no
-- servidor; e ECONOMY.recycle_values, por patamar, no cliente — que e a que
-- escreve "Quebrar 10" no botao. Enquanto concordaram, ninguem notou.
--
-- A medicao mostrou que nao e preco por item, e sim residuo:
--
--   patamar 1   35 itens · servidor 8..10   ·  3 divergem
--   patamar 2   26 itens · servidor 18..30  ·  4 divergem
--   patamar 3   31 itens · servidor 45..100 ·  2 divergem
--   patamar 4   33 itens · servidor 300     ·  0 divergem
--   patamar 5   20 itens · servidor 1000    ·  0 divergem
--   patamar 6    9 itens · servidor 300..3000 · 6 divergem
--
-- Em TODO patamar o maximo do servidor e exatamente o numero do app, e os
-- patamares 4 e 5 batem perfeito em 53 itens. Preco deliberado por item nao se
-- pareceria com isso: teria variacao em todo lugar, e nao um teto que coincide
-- com a tabela do cliente. Sao linhas que ficaram para tras.
--
-- O patamar 6 e o motivo de nao deixar para depois: 6 dos 9 miticos pagam ate um
-- DECIMO do prometido. Mitico e o que a pessoa mais pensa antes de quebrar, e o
-- unico que ela nao vai quebrar duas vezes para conferir.
--
-- Todas as divergencias sao para MENOS, entao alinhar so aumenta. Ninguem perde
-- fragmento com isto, e o botao deixa de mentir.

do $$
declare
  v_acima integer;
begin
  if to_regclass('public.items') is null then
    raise exception 'RECYCLE_VALUE_MISSING: public.items';
  end if;

  -- Se algum item pagasse MAIS que a tabela do app, a leitura acima estaria
  -- errada — existiria preco por item de verdade, e alinhar seria rebaixar
  -- alguem. Nesse caso nada e escrito.
  select count(*) into v_acima
  from public.items
  where coalesce(recycle_value, 0) > case coalesce(tier, 1)
    when 1 then 10 when 2 then 30 when 3 then 100
    when 4 then 300 when 5 then 1000 when 6 then 3000 else 0 end;

  if v_acima > 0 then
    raise exception 'RECYCLE_VALUE_ABORTED: % itens pagam MAIS que a tabela do app; nao vou rebaixar ninguem sem olhar', v_acima;
  end if;
end;
$$;

update public.items
set recycle_value = case coalesce(tier, 1)
  when 1 then 10 when 2 then 30 when 3 then 100
  when 4 then 300 when 5 then 1000 when 6 then 3000 else recycle_value end
where coalesce(recycle_value, 0) is distinct from case coalesce(tier, 1)
  when 1 then 10 when 2 then 30 when 3 then 100
  when 4 then 300 when 5 then 1000 when 6 then 3000 else coalesce(recycle_value, 0) end;

do $$
declare
  v_restam integer;
begin
  select count(*) into v_restam
  from public.items
  where coalesce(recycle_value, 0) is distinct from case coalesce(tier, 1)
    when 1 then 10 when 2 then 30 when 3 then 100
    when 4 then 300 when 5 then 1000 when 6 then 3000 else 0 end;
  raise notice 'itens ainda em desacordo com o botao: %', v_restam;
end;
$$;

commit;
