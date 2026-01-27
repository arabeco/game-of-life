-- Seed de perfil NJR_10 usando profiles (root + attributes + cosmetics)
insert into public.profiles (
  id,
  user_id,
  nickname,
  full_name,
  global_level,
  status_title,
  archetype_name,
  archetype_tags,
  avatar_url,
  cover_url,
  attributes,
  cosmetics
)
values (
  gen_random_uuid(),
  'REPLACE_WITH_AUTH_USER_ID',
  'NJR_10',
  'Neymar da Silva Santos Junior',
  80,
  'Icone Pop / Lenda Tecnica',
  'The Eternal Kid',
  array['Ousadia','Alegria','Caos'],
  'https://placehold.co/256x256?text=Avatar',
  'https://placehold.co/1200x400?text=Cover',
  jsonb_build_object(
    'gratitude', jsonb_build_object(
      'level', 10,
      'motto_main', jsonb_build_object('type','type1','title','Lema','value','Tudo Passa'),
      'beliefs_list', jsonb_build_object('type','type1','title','Crenças','value','100% Jesus • Blessed'),
      'flow_state_analysis', jsonb_build_object('type','type1','title','Flow','value','Vibra alto, leve, criativo e conectado.')
    ),
    'spirit', jsonb_build_object(
      'level', 9,
      'belief_system', jsonb_build_object('type','type1','title','Sistema','value','Cristianismo'),
      'entity_leader', jsonb_build_object('type','type3','title','Entidade Líder','image_url','https://placehold.co/300x300?text=Leader','caption','Jesus Cristo'),
      'entity_protector', jsonb_build_object('type','type3','title','Entidade Protetora','image_url','https://placehold.co/300x300?text=Protector','caption','Familia')
    ),
    'mental', jsonb_build_object(
      'level', 8,
      'operational_philosophy', jsonb_build_object('type','type1','title','Filosofia','value','Deixa acontecer naturalmente'),
      'mental_status', jsonb_build_object(
        'type','type5','title','Status Mental',
        'current_value','Criativo',
        'options_list', jsonb_build_array('Distração Total','Criativo','Focado')
      ),
      'vulnerability_desc', jsonb_build_object('type','type1','title','Vulnerabilidade','value','Pode dispersar quando a pressao aumenta.')
    ),
    'truth', jsonb_build_object(
      'level', 9,
      'mtp_mission', jsonb_build_object('type','type1','title','Missao','value','Inspirar jovens pelo futebol e pela alegria.'),
      'passive_traits', jsonb_build_object(
        'type','type5','title','Traços',
        'current_value','Carismatico, Leal',
        'options_list', jsonb_build_array('Carismatico','Leal','Visionario','Resiliente')
      ),
      'mbti_type', jsonb_build_object('type','type1','title','MBTI','value','ENFP'),
      'zodiac_sign', jsonb_build_object('type','type1','title','Signo','value','Aquario'),
      'inspiration_slots', jsonb_build_array(
        jsonb_build_object('type','type3','title','Inspiracao','image_url','https://placehold.co/300x300?text=Pele','caption','Pele • O Rei'),
        jsonb_build_object('type','type3','title','Inspiracao','image_url','https://placehold.co/300x300?text=Ronaldinho','caption','Ronaldinho • Magia')
      )
    ),
    'inspiration', jsonb_build_object(
      'level', 9,
      'projects_list', jsonb_build_array(
        jsonb_build_object('type','type3','title','Projeto','image_url','https://placehold.co/300x300?text=Instituto','caption','Instituto Neymar Jr • Impacto Massivo'),
        jsonb_build_object('type','type3','title','Projeto','image_url','https://placehold.co/300x300?text=NJR10','caption','NJR10 • Ativo')
      )
    ),
    'love', jsonb_build_object(
      'level', 8,
      'social_role_analysis', jsonb_build_object('type','type1','title','Papel Social','value','Lider Tribal'),
      'inner_circle', jsonb_build_array(
        jsonb_build_object('type','type4','top_label','Davi Lucca','image_url','https://placehold.co/300x400?text=Davi','caption','Filho'),
        jsonb_build_object('type','type4','top_label','Nadine','image_url','https://placehold.co/300x400?text=Nadine','caption','Mae')
      ),
      'war_brothers', jsonb_build_array(
        jsonb_build_object('type','type4','top_label','Gil','image_url','https://placehold.co/300x400?text=Gil','caption','Irmaos de Guerra')
      )
    ),
    'abundance', jsonb_build_object(
      'level', 10,
      'burn_rate_indicator', jsonb_build_object('type','type1','title','Burn Rate','value','Alto gasto, alto ganho'),
      'liquidity_sources', jsonb_build_object('type','type1','title','Fontes','value','Salario • Patrocinios • Licenciamento'),
      'assets_slots', jsonb_build_array(
        jsonb_build_object('type','type3','title','Ativo','image_url','https://placehold.co/300x300?text=Salario','caption','Salario Al-Hilal'),
        jsonb_build_object('type','type3','title','Ativo','image_url','https://placehold.co/300x300?text=Jatinho','caption','Jatinho'),
        jsonb_build_object('type','type3','title','Ativo','image_url','https://placehold.co/300x300?text=Mansao','caption','Mansao')
      )
    ),
    'work', jsonb_build_object(
      'level', 10,
      'primary_class', jsonb_build_object('type','type2','title','Classe Primaria','value','Atleta Profissional','sub_value','15 anos'),
      'secondary_class', jsonb_build_object('type','type2','title','Classe Secundaria','value','Influenciador','sub_value','10 anos'),
      'career_history', jsonb_build_object('type','type1','title','Historico','value','Santos, Barcelona, PSG, Al-Hilal')
    ),
    'authenticity', jsonb_build_object(
      'level', 8,
      'hobbies_slots', jsonb_build_array(
        jsonb_build_object('type','type3','title','Hobby','image_url','https://placehold.co/300x300?text=CS2','caption','CS2 • Global Elite'),
        jsonb_build_object('type','type3','title','Hobby','image_url','https://placehold.co/300x300?text=Poker','caption','Poker • Pro')
      )
    ),
    'physical', jsonb_build_object(
      'level', 8,
      'shape_photo', jsonb_build_object('type','type4','top_label','Shape Atual','image_url','https://placehold.co/300x400?text=Shape','caption','Atletico'),
      'physical_status', jsonb_build_object(
        'type','type5','title','Status Fisico',
        'current_value','Atlético (com lesões)',
        'options_list', jsonb_build_array('Lesionado','Atlético (com lesões)','Atletico','Sedentario')
      ),
      'attributes_stats', jsonb_build_array(
        jsonb_build_object('type','type2','title','Agilidade','value','96','sub_value','Elite'),
        jsonb_build_object('type','type2','title','Aceleracao','value','94','sub_value','Elite'),
        jsonb_build_object('type','type2','title','Forca','value','78','sub_value','Alta'),
        jsonb_build_object('type','type2','title','Stamina','value','80','sub_value','Alta')
      )
    )
  ),
  jsonb_build_object(
    'banner_id', 'solar_crest',
    'frame_id', 'halo_gold',
    'color_theme', 'gold',
    'active_effects', jsonb_build_array('soft_glow')
  )
);
