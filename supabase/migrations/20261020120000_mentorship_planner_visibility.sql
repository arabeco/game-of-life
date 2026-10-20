-- A mentoria pode acompanhar a semana sem tornar o planner inteiro publico.
--
-- O estado e do mentor (organizacao da propria carteira). A visibilidade e da
-- pessoa acompanhada. Sao duas decisoes separadas e, portanto, duas RPCs.

begin;

alter table public.relationship_links
  add column if not exists mentor_status text not null default 'em_ritmo',
  add column if not exists planner_share_mode text not null default 'shared_arenas';

alter table public.relationship_links
  drop constraint if exists relationship_links_mentor_status_check,
  add constraint relationship_links_mentor_status_check
    check (mentor_status in ('em_ritmo', 'atencao', 'pausado'));

alter table public.relationship_links
  drop constraint if exists relationship_links_planner_share_mode_check,
  add constraint relationship_links_planner_share_mode_check
    check (planner_share_mode in ('none', 'shared_arenas', 'full'));

create or replace function public.set_mentorship_mentor_status(
  p_link_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_link public.relationship_links%rowtype;
begin
  select * into v_link from public.relationship_links where id = p_link_id for update;
  if not found then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
  if auth.uid() is null or v_link.mentor_id <> auth.uid() or v_link.link_type <> 'mentoria' then
    raise exception 'RELATIONSHIP_PERMISSION_DENIED';
  end if;
  if p_status not in ('em_ritmo', 'atencao', 'pausado') then raise exception 'MENTOR_STATUS_INVALID'; end if;

  update public.relationship_links
  set mentor_status = p_status, updated_at = now()
  where id = v_link.id
  returning * into v_link;

  return jsonb_build_object('success', true, 'link', to_jsonb(v_link));
end;
$$;

create or replace function public.set_mentorship_planner_visibility(
  p_link_id uuid,
  p_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_link public.relationship_links%rowtype;
begin
  select * into v_link from public.relationship_links where id = p_link_id for update;
  if not found then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
  if auth.uid() is null or v_link.pupil_id <> auth.uid() or v_link.link_type <> 'mentoria' then
    raise exception 'RELATIONSHIP_PERMISSION_DENIED';
  end if;
  if p_mode not in ('none', 'shared_arenas', 'full') then raise exception 'PLANNER_VISIBILITY_INVALID'; end if;

  update public.relationship_links
  set planner_share_mode = p_mode, updated_at = now()
  where id = v_link.id
  returning * into v_link;

  return jsonb_build_object('success', true, 'link', to_jsonb(v_link));
end;
$$;

-- So o planner completo passa por esta funcao. O escopo de arenas ja e
-- entregue pela leitura normal das arenas vinculadas e continua restrito a
-- elas. A semana e somente leitura e deixa de responder assim que o vinculo
-- vencer ou for encerrado.
create or replace function public.mentor_planner_week(
  p_link_id uuid,
  p_start_date date default current_date
)
returns table(
  task_id text,
  action_id text,
  action_name text,
  arena_id uuid,
  arena_name text,
  arena_icon text,
  task_date date,
  start_time integer,
  duration integer,
  completed boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_link public.relationship_links%rowtype;
begin
  select * into v_link from public.relationship_links where id = p_link_id;
  if not found then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
  if auth.uid() is null or v_link.mentor_id <> auth.uid() or v_link.link_type <> 'mentoria' then
    raise exception 'RELATIONSHIP_PERMISSION_DENIED';
  end if;
  if not public.relationship_link_is_live(v_link) then raise exception 'RELATIONSHIP_LINK_EXPIRED'; end if;
  if v_link.planner_share_mode <> 'full' then raise exception 'PLANNER_FULL_NOT_SHARED'; end if;

  return query
  select
    t.id,
    t.action_id,
    a.name,
    a.arena_id,
    ar.name,
    coalesce(ar.icon, '🏛️'),
    t.date::date,
    t.start_time,
    t.duration,
    coalesce(t.completed, false)
  from public.scheduled_tasks t
  join public.actions a on a.id::text = t.action_id
  left join public.arenas ar on ar.id = a.arena_id
  where t.user_id = v_link.pupil_id
    and t.date::date >= coalesce(p_start_date, current_date)
    and t.date::date < coalesce(p_start_date, current_date) + 7
  order by t.date::date, t.start_time nulls last, t.execution_order nulls last, t.created_at;
end;
$$;

revoke all on function public.set_mentorship_mentor_status(uuid, text) from public, anon;
revoke all on function public.set_mentorship_planner_visibility(uuid, text) from public, anon;
revoke all on function public.mentor_planner_week(uuid, date) from public, anon;
grant execute on function public.set_mentorship_mentor_status(uuid, text) to authenticated;
grant execute on function public.set_mentorship_planner_visibility(uuid, text) to authenticated;
grant execute on function public.mentor_planner_week(uuid, date) to authenticated;

commit;
