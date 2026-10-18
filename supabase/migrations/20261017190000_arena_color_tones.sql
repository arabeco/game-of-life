-- Additive migration. No action, scheduling, progress or content data is changed.
begin;
alter table public.arenas add column if not exists color_tone_sequence integer
    check (color_tone_sequence >= 0);

create or replace function public.arena_tone_area(p_asset text, p_name text)
returns text language sql immutable set search_path = '' as $$
    select case
      when lower(coalesce(p_name,'')) like '%quests - %'
        or lower(coalesce(p_name,'')) like '%outros%'
        or lower(coalesce(p_name,'')) like '%sidequest%'
        or lower(coalesce(p_name,'')) like '%side quest%'
        or lower(coalesce(p_name,'')) like 'clan office%' then null
      when lower(trim(p_asset)) in ('proposito','consciencia','espiritualidade','espaco-mental','espaco_mental','espacomental') then 'proposito'
      when lower(trim(p_asset)) in ('relacoes','conexoes','conexao') then 'relacoes'
      when lower(trim(p_asset)) in ('trabalho','projetos','financas') then 'trabalho'
      when lower(trim(p_asset)) in ('lazer','hobbies','bem-estar','bem_estar') then 'lazer'
      when lower(trim(p_asset)) in ('saude','fisico','corpo') then 'saude'
      else null end;
$$;

create table if not exists public.arena_tone_counters (
    user_id uuid not null references auth.users(id) on delete cascade,
    asset_id text not null,
    next_sequence integer not null check (next_sequence >= 0),
    primary key (user_id, asset_id)
);
alter table public.arena_tone_counters enable row level security;
revoke all on public.arena_tone_counters from anon, authenticated;
grant select on public.arena_tone_counters to authenticated;
drop policy if exists arena_tone_counters_read_own on public.arena_tone_counters;
create policy arena_tone_counters_read_own on public.arena_tone_counters
    for select to authenticated using (user_id = (select auth.uid()));

-- Lock out concurrent creation only for this short backfill/counter initialization.
lock table public.arenas in share row exclusive mode;
-- Existing competition snapshots prohibit any UPDATE. Use the established
-- transaction-local maintenance flag solely for adding presentation metadata.
select set_config('app.relationship_competition_admin', '1', true);
with ranked as (
    select id, (row_number() over (
        partition by user_id, public.arena_tone_area(asset_id, name)
        order by created_at nulls last, id
    ) - 1)::integer as sequence
    from public.arenas
    where user_id is not null and public.arena_tone_area(asset_id, name) is not null
)
update public.arenas a set color_tone_sequence = r.sequence
from ranked r where a.id = r.id and a.color_tone_sequence is null;
select set_config('app.relationship_competition_admin', '', true);

insert into public.arena_tone_counters (user_id, asset_id, next_sequence)
select user_id, public.arena_tone_area(asset_id, name), max(color_tone_sequence) + 1
from public.arenas
where user_id is not null and color_tone_sequence is not null
    and public.arena_tone_area(asset_id, name) is not null
group by user_id, public.arena_tone_area(asset_id, name)
on conflict (user_id, asset_id) do update
set next_sequence = greatest(public.arena_tone_counters.next_sequence, excluded.next_sequence);

create or replace function public.assign_arena_color_tone()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
    area text;
    previous_area text;
    previous_sequence integer;
begin
    area := public.arena_tone_area(new.asset_id, new.name);
    if tg_op = 'UPDATE' then
        previous_area := public.arena_tone_area(old.asset_id, old.name);
        previous_sequence := old.color_tone_sequence;
    else
        -- INSERT ON CONFLICT runs the INSERT trigger too. A reorder/upsert
        -- must not consume another slot or change an existing arena's tone.
        select public.arena_tone_area(a.asset_id, a.name), a.color_tone_sequence
        into previous_area, previous_sequence from public.arenas a where a.id = new.id;
        if found then
            new.color_tone_sequence := previous_sequence;
            return new;
        end if;
    end if;
    if area is null or new.user_id is null then
        new.color_tone_sequence := null;
    elsif area = previous_area and previous_sequence is not null then
        new.color_tone_sequence := previous_sequence;
    else
        insert into public.arena_tone_counters (user_id, asset_id, next_sequence)
        values (new.user_id, area, 1)
        on conflict (user_id, asset_id) do update
        set next_sequence = public.arena_tone_counters.next_sequence + 1
        returning next_sequence - 1 into new.color_tone_sequence;
    end if;
    return new;
end;
$$;
revoke all on function public.assign_arena_color_tone() from public, anon, authenticated;
drop trigger if exists assign_arena_color_tone on public.arenas;
create trigger assign_arena_color_tone before insert or update on public.arenas
    for each row execute function public.assign_arena_color_tone();
notify pgrst, 'reload schema';
commit;
