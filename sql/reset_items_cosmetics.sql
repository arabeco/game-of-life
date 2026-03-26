-- Reset cirurgico do sistema de itens/cosmeticos.
-- Nao apaga arenas, acoes, ciclos, codex, relatorios ou progresso de produtividade.
-- Resultado esperado:
-- 1. limpa user_inventory
-- 2. limpa unlock maps legacy
-- 3. equipa a UI skin BASIC por padrao
-- 4. remove equipamentos cosmeticos antigos do sovereign sem mexer em body/tone
-- 5. na proxima carga, o starter pack volta a ser concedido pelo app

begin;

-- Backup opcional rapido antes do reset.
create table if not exists backup_user_inventory_20260312 as
select * from user_inventory
where false;

insert into backup_user_inventory_20260312
select *
from user_inventory;

create table if not exists backup_user_profiles_items_20260312 as
select
  id,
  skin,
  border,
  banner_url,
  sovereign,
  unlocked_items,
  unlocked_skins,
  updated_at
from user_profiles
where false;

insert into backup_user_profiles_items_20260312
select
  id,
  skin,
  border,
  banner_url,
  sovereign,
  unlocked_items,
  unlocked_skins,
  updated_at
from user_profiles;

delete from user_inventory;

update user_profiles
set
  skin = 'BASIC',
  border = 'default',
  banner_url = null,
  unlocked_skins = jsonb_build_object('BASIC', true),
  unlocked_items = jsonb_build_object(
    'bodyStyles', '{}'::jsonb,
    'hairStyles', '{}'::jsonb,
    'outfits', '{}'::jsonb,
    'artifacts', '{}'::jsonb,
    'codexes', '{}'::jsonb,
    'skins', '{}'::jsonb,
    'borders', '{}'::jsonb,
    'banners', '{}'::jsonb,
    'glyphs', '{}'::jsonb,
    'auras', '{}'::jsonb,
    'orbs', '{}'::jsonb,
    'plates', '{}'::jsonb,
    'ornament', '{}'::jsonb,
    'insignias', '{}'::jsonb,
    'ui_skins', jsonb_build_object('BASIC', true)
  ),
  sovereign = coalesce(sovereign, '{}'::jsonb)
    || jsonb_build_object(
      'outfit', 'none',
      'artifact', 'none',
      'glyph', 'none',
      'aura', 'none',
      'orb', 'none',
      'glyph_plate', 'none',
      'artifact_plate', 'none',
      'sovereign_plate', 'none',
      'primary_display', 'sovereign'
    ),
  updated_at = now();

commit;
