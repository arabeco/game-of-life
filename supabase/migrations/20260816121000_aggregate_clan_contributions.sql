-- loadClanAndMembers pulled every row of clan_xp_contributions for the clan and
-- summed them in the browser. That payload grows without bound and is subject
-- to whatever row cap the API enforces, at which point the totals quietly come
-- back short. This aggregates in Postgres instead: one row per member.
--
-- Season bounds are compared on created_at::date to match how the client
-- derived them. Pass nulls to get lifetime totals only.

begin;

create or replace function public.get_clan_contribution_totals(
  p_clan_id uuid,
  p_season_start date default null,
  p_season_end date default null
)
returns table (
  member_id uuid,
  total_xp bigint,
  season_xp bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Mirrors the table's RLS policy: only members may read their clan's ledger.
  if not exists (
    select 1
    from public.clan_members membership
    where membership.clan_id = p_clan_id
      and membership.user_id = v_user_id
  ) then
    raise exception 'Not a member of this clan';
  end if;

  return query
  select
    contribution.user_id as member_id,
    coalesce(sum(contribution.xp_amount), 0)::bigint as total_xp,
    coalesce(
      sum(contribution.xp_amount) filter (
        where (p_season_start is null or contribution.created_at::date >= p_season_start)
          and (p_season_end is null or contribution.created_at::date <= p_season_end)
      ),
      0
    )::bigint as season_xp
  from public.clan_xp_contributions contribution
  where contribution.clan_id = p_clan_id
  group by contribution.user_id;
end;
$$;

revoke all on function public.get_clan_contribution_totals(uuid, date, date) from public;
grant execute on function public.get_clan_contribution_totals(uuid, date, date) to authenticated;

commit;
