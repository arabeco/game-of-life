-- Keep each attempt and its completed tasks; the reusable template stays in codex.
alter table public.campaigns add column if not exists source_codex_id uuid;
alter table public.campaigns add column if not exists completed_at timestamptz;
alter table public.campaigns add column if not exists result_snapshot jsonb;

create or replace function public.finish_campaign_run(p_campaign_id uuid, p_status text, p_template jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_campaign public.campaigns%rowtype;
  v_ids uuid[];
  v_codex uuid;
  v_snapshot jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_status not in ('completed', 'archived') then raise exception 'Invalid status'; end if;
  select * into v_campaign from public.campaigns where id = p_campaign_id and user_id = v_user for update;
  if not found then raise exception 'Campaign not found'; end if;
  if v_campaign.status <> 'active' then
    return jsonb_build_object('sourceCodexId', v_campaign.source_codex_id, 'status', v_campaign.status);
  end if;
  select array_agg(value::uuid) into v_ids from jsonb_array_elements_text(v_campaign.arena_ids);
  if exists(select 1 from unnest(v_ids) id where not exists(select 1 from public.arenas a where a.id = id and a.user_id = v_user)) then
    raise exception 'Campaign contains unavailable arenas';
  end if;
  if p_status = 'completed' and (
    not exists(select 1 from public.actions where arena_id = any(v_ids) and user_id = v_user and action_type <> 'Livre')
    or exists(select 1 from public.actions a where a.arena_id = any(v_ids) and a.user_id = v_user and a.action_type <> 'Livre'
      and (select count(*) from public.scheduled_tasks t where t.action_id = a.id and t.user_id = v_user and t.completed is true) < greatest(1, coalesce(a.repetitions, 1)))
  ) then raise exception 'Complete the remaining actions first'; end if;
  v_codex := v_campaign.source_codex_id;
  if v_codex is null then
    select a.origin_codex_id into v_codex from public.arenas a join public.codex c on c.id = a.origin_codex_id and c.owner_id = v_user
      where a.id = any(v_ids) and a.user_id = v_user limit 1;
  end if;
  if v_codex is null then
    if coalesce(jsonb_array_length(p_template->'levels'), 0) = 0 then raise exception 'Missing reusable template'; end if;
    insert into public.codex(owner_id, name, description, template, schema_version, source_type)
      values(v_user, v_campaign.title, v_campaign.description, p_template, 'v2', 'created') returning id into v_codex;
  end if;
  select jsonb_build_object('arenas', coalesce((select jsonb_agg(to_jsonb(a)) from public.arenas a where a.id = any(v_ids) and a.user_id = v_user),'[]'),
    'actions', coalesce((select jsonb_agg(to_jsonb(a)) from public.actions a where a.arena_id = any(v_ids) and a.user_id = v_user),'[]'),
    'completedRepetitions', (select count(*) from public.scheduled_tasks t join public.actions a on a.id = t.action_id where a.arena_id = any(v_ids) and t.user_id = v_user and t.completed is true)) into v_snapshot;
  update public.arenas set is_archived = true where id = any(v_ids) and user_id = v_user;
  delete from public.scheduled_tasks t using public.actions a where t.action_id = a.id and a.arena_id = any(v_ids) and t.user_id = v_user and t.completed is not true and t.date >= current_date;
  update public.campaigns set status = p_status, completed_at = now(), updated_at = now(), source_codex_id = v_codex, result_snapshot = v_snapshot where id = p_campaign_id;
  return jsonb_build_object('sourceCodexId', v_codex, 'status', p_status);
end;
$$;
revoke all on function public.finish_campaign_run(uuid,text,jsonb) from public, anon;
grant execute on function public.finish_campaign_run(uuid,text,jsonb) to authenticated;
