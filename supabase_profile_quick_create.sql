-- Criacao rapida de perfil com defaults (attributes/cosmetics)
create or replace function public.create_profile_minimal(
  p_user_id uuid,
  p_nickname text,
  p_full_name text,
  p_status_title text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (
    user_id,
    nickname,
    full_name,
    status_title,
    global_level,
    attributes,
    cosmetics
  )
  values (
    p_user_id,
    p_nickname,
    p_full_name,
    p_status_title,
    0,
    jsonb_build_object(
      'gratitude', jsonb_build_object(
        'level', 1,
        'motto_main', jsonb_build_object('type','type1','title','Lema','value',''),
        'beliefs_list', jsonb_build_object('type','type1','title','Crenças','value',''),
        'flow_state_analysis', jsonb_build_object('type','type1','title','Flow','value','')
      ),
      'spirit', jsonb_build_object(
        'level', 1,
        'belief_system', jsonb_build_object('type','type1','title','Sistema','value',''),
        'entity_leader', jsonb_build_object('type','type3','title','Entidade Líder','image_url','', 'caption',''),
        'entity_protector', jsonb_build_object('type','type3','title','Entidade Protetora','image_url','', 'caption','')
      ),
      'mental', jsonb_build_object(
        'level', 1,
        'operational_philosophy', jsonb_build_object('type','type1','title','Filosofia','value',''),
        'mental_status', jsonb_build_object('type','type5','title','Status Mental','current_value','', 'options_list', jsonb_build_array()),
        'vulnerability_desc', jsonb_build_object('type','type1','title','Vulnerabilidade','value','')
      ),
      'truth', jsonb_build_object(
        'level', 1,
        'mtp_mission', jsonb_build_object('type','type1','title','Missão','value',''),
        'passive_traits', jsonb_build_object('type','type5','title','Traços','current_value','', 'options_list', jsonb_build_array()),
        'mbti_type', jsonb_build_object('type','type1','title','MBTI','value',''),
        'zodiac_sign', jsonb_build_object('type','type1','title','Signo','value',''),
        'inspiration_slots', jsonb_build_array()
      ),
      'inspiration', jsonb_build_object(
        'level', 1,
        'projects_list', jsonb_build_array()
      ),
      'love', jsonb_build_object(
        'level', 1,
        'social_role_analysis', jsonb_build_object('type','type1','title','Papel Social','value',''),
        'inner_circle', jsonb_build_array(),
        'war_brothers', jsonb_build_array()
      ),
      'abundance', jsonb_build_object(
        'level', 1,
        'burn_rate_indicator', jsonb_build_object('type','type1','title','Burn Rate','value',''),
        'liquidity_sources', jsonb_build_object('type','type1','title','Fontes','value',''),
        'assets_slots', jsonb_build_array()
      ),
      'work', jsonb_build_object(
        'level', 1,
        'primary_class', jsonb_build_object('type','type2','title','Classe Primária','value','', 'sub_value',''),
        'secondary_class', jsonb_build_object('type','type2','title','Classe Secundária','value','', 'sub_value',''),
        'career_history', jsonb_build_object('type','type1','title','Histórico','value','')
      ),
      'authenticity', jsonb_build_object(
        'level', 1,
        'hobbies_slots', jsonb_build_array()
      ),
      'physical', jsonb_build_object(
        'level', 1,
        'shape_photo', jsonb_build_object('type','type4','top_label','', 'image_url','', 'caption',''),
        'physical_status', jsonb_build_object('type','type5','title','Status Físico','current_value','', 'options_list', jsonb_build_array()),
        'attributes_stats', jsonb_build_array()
      )
    ),
    jsonb_build_object(
      'banner_id', 'solar_crest',
      'frame_id', 'halo_gold',
      'color_theme', 'gold',
      'active_effects', jsonb_build_array()
    )
  );
end;
$$;

grant execute on function public.create_profile_minimal(uuid, text, text, text) to authenticated;
