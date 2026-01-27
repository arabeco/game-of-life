-- View simples para visualizar perfis rapidamente
create or replace view public.profiles_summary as
select
  id,
  user_id,
  nickname,
  full_name,
  status_title,
  global_level,
  avatar_url,
  cover_url,
  (attributes #>> '{gratitude,motto_main,value}') as motto_main,
  (attributes #>> '{truth,mtp_mission,value}') as mtp_mission,
  (attributes #>> '{mental,mental_status,current_value}') as mental_status,
  (attributes #>> '{physical,physical_status,current_value}') as physical_status,
  (cosmetics ->> 'banner_id') as banner_id,
  (cosmetics ->> 'frame_id') as frame_id,
  (cosmetics ->> 'color_theme') as color_theme
from public.profiles;
