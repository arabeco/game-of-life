alter table if exists public.actions
add column if not exists planner_quadrant text;

update public.actions
set planner_quadrant = lower(nullif(coalesce(context->>'plannerQuadrant', context->>'planner_quadrant', ''), ''))
where planner_quadrant is null
  and coalesce(context->>'plannerQuadrant', context->>'planner_quadrant', '') <> '';

alter table if exists public.actions
drop constraint if exists actions_planner_quadrant_check;

alter table if exists public.actions
add constraint actions_planner_quadrant_check
check (
  planner_quadrant is null
  or planner_quadrant in ('ui', 'nui', 'uni', 'nuni')
);

update public.actions
set context = coalesce(context, '{}'::jsonb) || jsonb_build_object('plannerQuadrant', planner_quadrant)
where planner_quadrant is not null
  and coalesce(context->>'plannerQuadrant', '') is distinct from planner_quadrant;
