-- Update image URLs for Border items

-- Border: Disciplinado
UPDATE items 
SET image_url = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borada_disciplinado.png' 
WHERE id = 'item_border_1_002';

-- Border: Popular
UPDATE items 
SET image_url = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_popular.png' 
WHERE id = 'item_border_2_001';

-- Border: Imparável
UPDATE items 
SET image_url = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_imparavel.png' 
WHERE id = 'item_border_3_001';

-- Border: Lenda Viva
UPDATE items 
SET image_url = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_lendaviva.png' 
WHERE id = 'item_border_4_001';

-- Border: GM - Grande Mestre
UPDATE items 
SET image_url = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/borda_gm.png' 
WHERE id = 'item_border_5_001';
