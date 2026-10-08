-- OS QUINZE PREMIOS DAS REGRAS SECRETAS GANHAM ARTE.
--
-- Entraram em public.items pela 20261006180000_regras_secretas com
-- is_live_in_game = false e sem image_url, esperando o PNG. A arte chegou em
-- 06 e 08/10/2026 e esta no app (constants/items.ts); aqui o banco acompanha.
-- O endereco segue o mesmo formato que tools/generate-items-sql.mjs grava para
-- as outras roupas, bordas e banners — o app o resolve para o arquivo local.

begin;

update public.items as i
set image_url = v.image_url, is_live_in_game = true
from (values
  ('item_skin_1_012', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/SKIN_T1_ESCRIBA.png'),
  ('item_skin_2_010', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/SKIN_T2_MARATONA.png'),
  ('item_skin_3_009', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/SKIN_T3_ANCIAO.png'),
  ('item_skin_4_005', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/SKIN_T4_CAMPEAO.png'),
  ('item_skin_5_003', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/SKIN_T5_IMPERADOR.png'),
  ('item_border_t2_sereno', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/borda_t2_sereno.png'),
  ('item_banner_t2_sereno', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/banner_t2_sereno.png'),
  ('item_border_t3_alvorada', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/borda_t3_alvorada.png'),
  ('item_banner_t3_alvorada', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/banner_t3_alvorada.png'),
  ('item_border_t3_prisma', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/borda_t3_prisma.png'),
  ('item_banner_t3_prisma', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/banner_t3_prisma.png'),
  ('item_border_t4_profeta', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/borda_t4_profeta.png'),
  ('item_banner_t4_profeta', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/banner_t4_profeta.png'),
  ('item_border_t5_pedra_da_lua', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/borda_t5_pedra_da_lua.png'),
  ('item_banner_t5_pedra_da_lua', 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/banner_t5_pedra_da_lua.png')
) as v(id, image_url)
where i.id = v.id;

-- Confere: tem de dar 15 linhas, todas vivas e com arte.
select id, is_live_in_game, image_url is not null as tem_arte
from public.items
where id in (
  'item_skin_1_012', 'item_skin_2_010', 'item_skin_3_009', 'item_skin_4_005', 'item_skin_5_003',
  'item_border_t2_sereno', 'item_banner_t2_sereno', 'item_border_t3_alvorada', 'item_banner_t3_alvorada',
  'item_border_t3_prisma', 'item_banner_t3_prisma', 'item_border_t4_profeta', 'item_banner_t4_profeta',
  'item_border_t5_pedra_da_lua', 'item_banner_t5_pedra_da_lua'
)
order by id;

commit;
