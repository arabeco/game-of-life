-- Utilitarios JSONB + indices + checks (profiles.attributes)

-- 1) Merge parcial no JSONB (deep merge simples)
create or replace function public.jsonb_deep_merge(target jsonb, patch jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb := target;
  key text;
  value jsonb;
begin
  if target is null then
    return patch;
  end if;
  if patch is null then
    return target;
  end if;
  for key, value in select * from jsonb_each(patch)
  loop
    if jsonb_typeof(value) = 'object' and jsonb_typeof(target -> key) = 'object' then
      result := jsonb_set(result, array[key], public.jsonb_deep_merge(target -> key, value), true);
    else
      result := jsonb_set(result, array[key], value, true);
    end if;
  end loop;
  return result;
end;
$$;

-- Helper para aplicar patch no profile atual
create or replace function public.update_profile_attributes(p_user_id uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.profiles
     set attributes = public.jsonb_deep_merge(coalesce(attributes, '{}'::jsonb), p_patch)
   where user_id = p_user_id;
end;
$$;

grant execute on function public.update_profile_attributes(uuid, jsonb) to authenticated;

-- 2) Indices para chaves usadas na UI
create index if not exists profiles_attr_motto_main_idx
  on public.profiles ((attributes #>> '{gratitude,motto_main}'));

create index if not exists profiles_attr_projects_list_idx
  on public.profiles using gin ((attributes #> '{inspiration,projects_list}'));

-- 3) Checks de levels 1-10
alter table public.profiles
  add constraint if not exists chk_gratitude_level
  check ((attributes #>> '{gratitude,gratitude_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_spirit_level
  check ((attributes #>> '{spirit,spirit_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_mental_level
  check ((attributes #>> '{mental,mental_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_truth_level
  check ((attributes #>> '{truth,truth_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_inspiration_level
  check ((attributes #>> '{inspiration,inspiration_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_love_level
  check ((attributes #>> '{love,love_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_abundance_level
  check ((attributes #>> '{abundance,abundance_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_work_level
  check ((attributes #>> '{work,work_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_authenticity_level
  check ((attributes #>> '{authenticity,authenticity_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_physical_level
  check ((attributes #>> '{physical,physical_level}')::int between 1 and 10);
