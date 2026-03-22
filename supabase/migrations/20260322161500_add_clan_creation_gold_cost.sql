create or replace function public.create_clan_with_gold(
  p_name text,
  p_icon text default null,
  p_description text default '',
  p_clan_type text default 'Casual',
  p_recruitment_status text default 'Aberto'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_cost integer := 100;
  v_new_gold integer;
  v_clan public.clans%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'CLAN_NAME_REQUIRED';
  end if;

  if exists (
    select 1
    from public.clan_members cm
    where cm.user_id = v_uid
  ) then
    raise exception 'CLAN_ALREADY_JOINED';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'clan_creation',
    format('Criacao de cla: %s', trim(p_name)),
    jsonb_build_object(
      'clan_name', trim(p_name),
      'clan_type', coalesce(nullif(trim(p_clan_type), ''), 'Casual'),
      'recruitment_status', coalesce(nullif(trim(p_recruitment_status), ''), 'Aberto'),
      'cost_gold', v_cost
    )
  );

  insert into public.clans (
    name,
    icon,
    description,
    clan_type,
    recruitment_status,
    exp,
    rank_id
  ) values (
    trim(p_name),
    nullif(trim(coalesce(p_icon, '')), ''),
    coalesce(p_description, ''),
    coalesce(nullif(trim(p_clan_type), ''), 'Casual'),
    coalesce(nullif(trim(p_recruitment_status), ''), 'Aberto'),
    0,
    'feudo'
  )
  returning * into v_clan;

  insert into public.clan_members (
    user_id,
    clan_id,
    role
  ) values (
    v_uid,
    v_clan.id,
    'leader'
  );

  return jsonb_build_object(
    'success', true,
    'cost_gold', v_cost,
    'new_gold', v_new_gold,
    'clan', to_jsonb(v_clan)
  );
exception
  when unique_violation then
    raise exception 'CLAN_NAME_ALREADY_EXISTS';
end;
$$;

revoke all on function public.create_clan_with_gold(text, text, text, text, text) from public;
grant execute on function public.create_clan_with_gold(text, text, text, text, text) to authenticated;
