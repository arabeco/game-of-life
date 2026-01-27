-- Tabela separada para NPCs (evita FK com auth.users)
create table if not exists public.npc_profiles (
  npc_id uuid primary key default gen_random_uuid(),
  nickname text,
  full_name text,
  status_title text,
  archetype_name text,
  archetype_tags text[],
  avatar_url text,
  cover_url text,
  level_geral int default 0,
  player_data jsonb default '{}'::jsonb
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'npc_profiles_nickname_unique'
      and conrelid = 'public.npc_profiles'::regclass
  ) then
    alter table public.npc_profiles
      add constraint npc_profiles_nickname_unique unique (nickname);
  end if;
end $$;

-- Seed NPC publico: Neymar (NJR_10)
delete from public.npc_profiles where nickname = 'NJR_10';
insert into public.npc_profiles (
  npc_id,
  nickname,
  full_name,
  status_title,
  archetype_name,
  archetype_tags,
  avatar_url,
  cover_url,
  level_geral,
  player_data
)
select
  gen_random_uuid(),
  'NJR_10',
  'Neymar da Silva Santos Junior',
  'Icone Pop / Lenda Tecnica',
  'The Eternal Kid',
  array['Ousadia','Alegria','Caos'],
  '',
  '',
  95,
  jsonb_build_object(
    'identity', jsonb_build_object(
      'global_level', 95,
      'status_title', 'Icone Pop / Lenda Tecnica',
      'archetype_name', 'The Eternal Kid',
      'archetype_tags', array['Ousadia','Alegria','Caos']
    ),
    'gratitude', jsonb_build_object(
      'gratitude_level', 10,
      'motto_main', 'Tudo Passa',
      'beliefs_list', array['100% Jesus','Blessed'],
      'flow_state_analysis', 'Vibra alto, leve, criativo e conectado.'
    ),
    'spirit', jsonb_build_object(
      'spirit_level', 9,
      'belief_system', 'Cristianismo',
      'entity_leader_name', 'Jesus Cristo',
      'entity_leader_img', '',
      'entity_protector_name', 'Familia',
      'entity_protector_img', ''
    ),
    'mental', jsonb_build_object(
      'mental_level', 8,
      'operational_philosophy', 'Deixa acontecer naturalmente',
      'mental_status', 'Criativo',
      'vulnerability_desc', 'Pode dispersar quando a pressao aumenta.'
    ),
    'truth', jsonb_build_object(
      'truth_level', 9,
      'mtp_mission', 'Inspirar jovens pelo futebol e pela alegria.',
      'passive_traits', array['Carismatico','Leal'],
      'mbti_type', 'ENFP',
      'zodiac_sign', 'Aquario',
      'inspiration_slots', jsonb_build_array(
        jsonb_build_object('name','Pele','img','','reason','O Rei'),
        jsonb_build_object('name','Ronaldinho','img','','reason','Magia')
      )
    ),
    'inspiration', jsonb_build_object(
      'inspiration_level', 9,
      'projects_list', jsonb_build_array(
        jsonb_build_object('project_name','Instituto Neymar Jr','project_logo','','project_status','Impacto Massivo'),
        jsonb_build_object('project_name','NJR10','project_logo','','project_status','Ativo')
      )
    ),
    'love', jsonb_build_object(
      'love_level', 8,
      'social_role_analysis', 'Lider Tribal',
      'inner_circle', jsonb_build_array(
        jsonb_build_object('name','Davi Lucca','relation','Filho'),
        jsonb_build_object('name','Nadine','relation','Mae')
      ),
      'war_brothers', jsonb_build_array(
        jsonb_build_object('name','Parcas','group_name','Os Parcas')
      )
    ),
    'abundance', jsonb_build_object(
      'abundance_level', 10,
      'burn_rate_indicator', 'Alto gasto, alto ganho',
      'liquidity_sources', array['Salario','Patrocinios','Licenciamento'],
      'assets_slots', array['Salario Al-Hilal','Jatinho','Mansao']
    ),
    'work', jsonb_build_object(
      'work_level', 10,
      'primary_class', jsonb_build_object('role','Atleta Profissional','time_in_role','15 anos'),
      'secondary_class', jsonb_build_object('role','Influenciador','time_in_role','10 anos'),
      'career_history', 'Santos, Barcelona, PSG, Al-Hilal'
    ),
    'authenticity', jsonb_build_object(
      'authenticity_level', 8,
      'hobbies_slots', jsonb_build_array(
        jsonb_build_object('name','CS2','rank_info','Global Elite','achievement','Inventario raro'),
        jsonb_build_object('name','Poker','rank_info','Pro','achievement','Torneios internacionais')
      )
    ),
    'physical', jsonb_build_object(
      'physical_level', 8,
      'shape_img', '',
      'physical_status_desc', 'Atletico com lesoes controladas',
      'attributes_stats', jsonb_build_object(
        'agility', 96,
        'acceleration', 94,
        'strength', 78,
        'stamina', 80
      )
    )
  );
