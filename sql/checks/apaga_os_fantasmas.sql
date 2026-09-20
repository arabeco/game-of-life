-- Apaga as sete linhas que só existem no banco.
--
-- Seis bordas e um tema que nunca chegaram ao repositório: sem código, sem arte
-- no disco, sem seed. São nomes, não itens. Conferido em 20/09/2026 que ninguém
-- os tem.
--
-- ISTO APAGA. Não dá para desfazer. Roda com a transação inteira: o select do
-- começo mostra o que vai sair, e se aparecer dono a transação para sozinha
-- antes de apagar qualquer coisa.

begin;

-- O que vai sair.
select id, name, category, tier, coalesce(is_live_in_game, true) as vivo
from public.items
where id in (
  'item_border_1_001',
  'item_border_1_003',
  'item_border_1_004',
  'item_border_2_002',
  'item_border_3_002',
  'item_border_exclusive_001',
  'item_theme_nebulosa'
)
order by category, tier, id;

-- A trava. Se alguém tiver qualquer uma delas, isto estoura e nada é apagado.
do $$
declare
  v_donos integer;
begin
  select count(*) into v_donos
  from public.user_inventory
  where item_id in (
    'item_border_1_001',
    'item_border_1_003',
    'item_border_1_004',
    'item_border_2_002',
    'item_border_3_002',
    'item_border_exclusive_001',
    'item_theme_nebulosa'
  );

  if v_donos > 0 then
    raise exception 'ALGUEM TEM: % linha(s) no inventario. Nada foi apagado.', v_donos;
  end if;
end $$;

delete from public.items
where id in (
  'item_border_1_001',
  'item_border_1_003',
  'item_border_1_004',
  'item_border_2_002',
  'item_border_3_002',
  'item_border_exclusive_001',
  'item_theme_nebulosa'
);

commit;

-- Confere: tem de vir vazio.
select id, name from public.items
where id in (
  'item_border_1_001',
  'item_border_1_003',
  'item_border_1_004',
  'item_border_2_002',
  'item_border_3_002',
  'item_border_exclusive_001',
  'item_theme_nebulosa'
);
