-- Run manually after local sql:checa. No retroactive rewards or garden edits.
begin;
create table if not exists public.garden_basket_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_days integer not null default 0 check (active_days between 0 and 4),
  target_days integer not null default (3 + floor(random()*3)::integer) check (target_days between 3 and 5),
  last_credit_day date
);
create table if not exists public.garden_basket_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 5 and 16),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists garden_basket_pending on public.garden_basket_deliveries(user_id, created_at) where claimed_at is null;
alter table public.garden_basket_progress enable row level security;
alter table public.garden_basket_deliveries enable row level security;
revoke all on public.garden_basket_progress, public.garden_basket_deliveries from anon, authenticated;
grant select on public.garden_basket_deliveries to authenticated;
drop policy if exists garden_basket_read_own on public.garden_basket_deliveries;
create policy garden_basket_read_own on public.garden_basket_deliveries for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.credit_garden_basket_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid;
  today date := (statement_timestamp() at time zone 'America/Sao_Paulo')::date;
  progress public.garden_basket_progress%rowtype;
  pending integer;
  reward_score integer;
begin
  if new.completed is distinct from true then return new; end if;
  if tg_op = 'UPDATE' then
    if old.completed is true then return new; end if;
  end if;
  -- Backdated imports/future schedules cannot be used to accumulate baskets.
  if new.date is null or new.date::text not in (today::text, (today-1)::text) then return new; end if;
  select a.user_id into owner_id from public.actions a where a.id::text = new.action_id::text;
  if owner_id is null or (auth.uid() is not null and auth.uid() <> owner_id) then return new; end if;
  insert into public.garden_basket_progress(user_id) values(owner_id) on conflict do nothing;
  select * into progress from public.garden_basket_progress where user_id=owner_id for update;
  -- This latch survives undo/recomplete, deletion and multiple devices.
  if progress.last_credit_day >= today then return new; end if;
  update public.garden_basket_progress set last_credit_day=today where user_id=owner_id;
  select count(*) into pending from public.garden_basket_deliveries where user_id=owner_id and claimed_at is null;
  if pending >= 2 then return new; end if;
  if progress.active_days + 1 < progress.target_days then
    update public.garden_basket_progress set active_days=active_days+1 where user_id=owner_id;
  else
    -- 95%: 5..15 fragments. 5%: score over 15 replaces fragments with a Common chest.
    reward_score := case when random() < .05 then 16 else 5 + floor(random()*11)::integer end;
    insert into public.garden_basket_deliveries(user_id,score) values(owner_id,reward_score);
    update public.garden_basket_progress set active_days=0,target_days=3+floor(random()*3)::integer where user_id=owner_id;
  end if;
  return new;
end;
$$;
revoke all on function public.credit_garden_basket_activity() from public, anon, authenticated;
drop trigger if exists garden_basket_activity on public.scheduled_tasks;
create trigger garden_basket_activity after insert or update of completed on public.scheduled_tasks
for each row execute function public.credit_garden_basket_activity();

create or replace function public.claim_garden_basket(p_delivery_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  delivery public.garden_basket_deliveries%rowtype;
  balance integer;
  amount integer;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into delivery from public.garden_basket_deliveries where id=p_delivery_id and user_id=uid for update;
  if not found then raise exception 'BASKET_NOT_FOUND'; end if;
  select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)) into balance
    from public.user_profiles where id=uid for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  if delivery.claimed_at is not null then
    return jsonb_build_object('awarded',false,'fragments',0,'chest',null,'balance',balance);
  end if;
  amount := case when delivery.score > 15 then 0 else delivery.score end;
  if amount > 0 then
    balance := balance + amount;
    update public.user_profiles set fragments=balance,
      wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{fragments}',to_jsonb(balance)) where id=uid;
  else
    perform public.grant_chest(p_user_id := uid, p_chest_type := 'Comum');
  end if;
  update public.garden_basket_deliveries set claimed_at=now() where id=delivery.id;
  return jsonb_build_object('awarded',true,'fragments',amount,'chest',case when amount=0 then 'Comum' else null end,'balance',balance);
end;
$$;
revoke all on function public.claim_garden_basket(uuid) from public, anon;
grant execute on function public.claim_garden_basket(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
