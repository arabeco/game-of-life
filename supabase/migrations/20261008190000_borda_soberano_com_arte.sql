-- A BORDA SOBERANO GANHA ARTE.
--
-- item_border_4_002 era o ultimo item escondido por falta de PNG. A arte
-- chegou em 06/10/2026 e entrou no app em 08/10 (constants/items.ts); aqui o
-- banco acompanha, no mesmo formato da 20261008080000.

begin;

update public.items
set image_url = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/interface/borda_soberano.png',
    is_live_in_game = true
where id = 'item_border_4_002';

-- Confere: tem de dar 1 linha, viva e com arte.
select id, is_live_in_game, image_url is not null as tem_arte
from public.items
where id = 'item_border_4_002';

commit;
