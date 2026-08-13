begin;

create table if not exists public.clan_xp_contributions (
  id bigint generated always as identity primary key,
  clan_id uuid not null references public.clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_amount integer not null check (xp_amount > 0),
  source_key text not null check (char_length(source_key) between 3 and 160),
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);

create index if not exists clan_xp_contributions_clan_user_idx
  on public.clan_xp_contributions (clan_id, user_id);

alter table public.clan_xp_contributions enable row level security;

revoke all on table public.clan_xp_contributions from anon, authenticated;
grant select on table public.clan_xp_contributions to authenticated;

drop policy if exists "Clan members can read contribution history" on public.clan_xp_contributions;
create policy "Clan members can read contribution history"
on public.clan_xp_contributions
for select
to authenticated
using (
  exists (
    select 1
    from public.clan_members membership
    where membership.clan_id = clan_xp_contributions.clan_id
      and membership.user_id = auth.uid()
  )
);

create or replace function public.record_my_clan_xp(
  p_xp_amount integer,
  p_source_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_inserted_id bigint;
  v_clan_exp integer;
  v_member_total integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_xp_amount is null or p_xp_amount <= 0 then
    raise exception 'XP amount must be positive';
  end if;

  if p_source_key is null or char_length(trim(p_source_key)) not between 3 and 160 then
    raise exception 'Invalid contribution source';
  end if;

  select membership.clan_id
    into v_clan_id
  from public.clan_members membership
  where membership.user_id = v_user_id
  order by membership.joined_at desc nulls last
  limit 1;

  if v_clan_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'not_in_clan');
  end if;

  insert into public.clan_xp_contributions (
    clan_id,
    user_id,
    xp_amount,
    source_key
  ) values (
    v_clan_id,
    v_user_id,
    p_xp_amount,
    trim(p_source_key)
  )
  on conflict (user_id, source_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'already_recorded');
  end if;

  update public.clans
  set exp = coalesce(exp, 0) + p_xp_amount,
      rank_id = case
        when coalesce(exp, 0) + p_xp_amount >= 2500000 then 'imperio'
        when coalesce(exp, 0) + p_xp_amount >= 1000000 then 'dinastia'
        when coalesce(exp, 0) + p_xp_amount >= 400000 then 'reino'
        when coalesce(exp, 0) + p_xp_amount >= 150000 then 'principado'
        when coalesce(exp, 0) + p_xp_amount >= 50000 then 'provincia'
        when coalesce(exp, 0) + p_xp_amount >= 10000 then 'bastiao'
        else 'feudo'
      end
  where id = v_clan_id
  returning exp into v_clan_exp;

  select coalesce(sum(contribution.xp_amount), 0)::integer
    into v_member_total
  from public.clan_xp_contributions contribution
  where contribution.clan_id = v_clan_id
    and contribution.user_id = v_user_id;

  return jsonb_build_object(
    'awarded', true,
    'clan_id', v_clan_id,
    'clan_exp', v_clan_exp,
    'member_total', v_member_total
  );
end;
$$;

revoke all on function public.record_my_clan_xp(integer, text) from public;
grant execute on function public.record_my_clan_xp(integer, text) to authenticated;

-- A EXP ja existente permanece como base historica. O ledger registra apenas
-- contribuicoes permanentes novas, sem apagar patente ou progresso antigo.

commit;
