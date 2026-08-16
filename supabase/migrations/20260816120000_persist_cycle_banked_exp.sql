-- Banked cycle EXP was kept only in React state (cycleExpBonus). Mission rewards
-- and applyExp grants landed there and were then wiped whenever
-- refreshOpenCycleDerivedState recomputed the value from daily_commitments,
-- which never contained them. This gives those grants a durable home.
--
-- Daily judgment deposits stay in daily_commitments.exp_deposited and must NOT
-- be written here, or they would be counted twice.

begin;

alter table public.cycles
  add column if not exists banked_exp_bonus integer not null default 0;

create or replace function public.increment_cycle_banked_exp(
  p_cycle_id text,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_next integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_cycle_id is null or char_length(trim(p_cycle_id)) = 0 then
    raise exception 'Cycle id is required';
  end if;

  -- A zero/absent delta is a read, so callers can resync without a write.
  if p_amount is null or p_amount = 0 then
    select coalesce(cycle.banked_exp_bonus, 0)
      into v_next
    from public.cycles cycle
    where cycle.id::text = p_cycle_id::text
      and cycle.user_id = v_user_id;

    return coalesce(v_next, 0);
  end if;

  update public.cycles cycle
     set banked_exp_bonus = greatest(0, coalesce(cycle.banked_exp_bonus, 0) + p_amount)
   where cycle.id::text = p_cycle_id::text
     and cycle.user_id = v_user_id
  returning cycle.banked_exp_bonus into v_next;

  if v_next is null then
    raise exception 'Cycle not found for this user';
  end if;

  return v_next;
end;
$$;

revoke all on function public.increment_cycle_banked_exp(text, integer) from public;
grant execute on function public.increment_cycle_banked_exp(text, integer) to authenticated;

commit;
