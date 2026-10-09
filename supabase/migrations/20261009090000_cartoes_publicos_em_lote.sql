-- OS CARTOES PUBLICOS, EM LOTE.
--
-- 20260929103000_public_profile_boundary fechou a leitura direta de
-- user_profiles: cada pessoa le so a propria linha, e o perfil dos outros sai
-- por get_public_profile_data, um de cada vez. A busca foi trocada; os quatro
-- lugares que leem varios perfis de uma vez — amigos, membros do cla, vinculos
-- (parceria, mentoria, duelo) e a tela de conexoes — continuaram indo direto na
-- tabela. A consulta nao da erro: devolve so a linha de quem pergunta. Em
-- 09/10/2026 isso apareceu como "meus amigos sumiram", parceria com um
-- fantasma e "Membro Desconhecido" no cla.
--
-- Esta funcao devolve, para uma lista de ids, so o cartao publico — o mesmo
-- que a busca por apelido ja mostra a qualquer pessoa logada — mais o cla. Os
-- widgets dos Ativos seguem a preferencia de visibilidade do dono, como em
-- get_public_profile_data. E-mail, carteira e o resto da linha ficam de fora.

begin;

create or replace function public.get_public_profile_cards(p_user_ids uuid[])
returns table (
  id uuid,
  nickname text,
  sovereign jsonb,
  avatar_url text,
  border text,
  level integer,
  background_url text,
  banner_url text,
  skin text,
  nobility jsonb,
  is_online boolean,
  clan_name text,
  clan_icon text,
  visible_widgets text[],
  asset_art_by_id jsonb,
  asset_widget_values jsonb
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_user_ids is null or cardinality(p_user_ids) = 0 then
    return;
  end if;
  -- Lista de amigos, cla e vinculos cabe folgado; o teto so impede varrer a
  -- base inteira numa chamada.
  if cardinality(p_user_ids) > 300 then
    raise exception 'TOO_MANY_IDS';
  end if;

  return query
  select
    up.id,
    up.nickname,
    up.sovereign,
    up.avatar_url,
    up.border,
    up.level,
    up.background_url,
    up.banner_url,
    up.skin,
    up.nobility,
    up.is_online,
    cla.name,
    cla.icon,
    case when vis.pode then coalesce(up.visible_widgets, array[]::text[]) else array[]::text[] end,
    case when vis.pode then coalesce(up.asset_art_by_id, '{}'::jsonb) else '{}'::jsonb end,
    case when vis.pode then coalesce(up.asset_widget_values, '{}'::jsonb) else '{}'::jsonb end
  from public.user_profiles up
  left join lateral (
    select c.name, c.icon
    from public.clan_members cm
    join public.clans c on c.id = cm.clan_id
    where cm.user_id = up.id
    order by cm.joined_at nulls last
    limit 1
  ) cla on true
  cross join lateral (
    select (
      up.id = v_viewer
      or up.assets_visibility = 'all'
      or (
        up.assets_visibility = 'friends'
        and exists (
          select 1
          from public.friends f
          where (f.user_id = v_viewer and f.friend_id = up.id)
             or (f.user_id = up.id and f.friend_id = v_viewer)
        )
      )
    ) as pode
  ) vis
  where up.id = any(p_user_ids);
end;
$$;

revoke all on function public.get_public_profile_cards(uuid[]) from public;
grant execute on function public.get_public_profile_cards(uuid[]) to authenticated;

commit;
