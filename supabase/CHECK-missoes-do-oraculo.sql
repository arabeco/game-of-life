-- As missoes individuais que a regra secreta "Oraculo" conta (10/10/2026).
-- A regra destrava com 2; a missao inicial (`primeira`) fica de fora.
-- So leitura. Cole no SQL Editor e me mande o resultado.

select
  up.product_id,
  split_part(up.product_id, ':', 2) as tipo,
  up.product_id like '%:primeira:%' as e_a_inicial,
  up.purchased_at
from public.user_purchases up
where up.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
  and up.product_type = 'arena_pact'
order by up.purchased_at;
