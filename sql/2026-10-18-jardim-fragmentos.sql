-- Jardim e Painel Diario: aplicar integralmente no editor SQL.
-- Cada secao e transacional e pode ser reaplicada.

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


begin;
create table if not exists public.garden_expansions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 level integer not null default 0 check(level between 0 and 7)
);
alter table public.garden_expansions enable row level security;
revoke all on public.garden_expansions from anon, authenticated;

create or replace function public.get_garden_expansion() returns integer
language sql stable security definer set search_path='' as $$
 select coalesce((select level from public.garden_expansions where user_id=auth.uid()),0);
$$;
revoke all on function public.get_garden_expansion() from public, anon;
grant execute on function public.get_garden_expansion() to authenticated;

create or replace function public.buy_garden_expansion(p_level integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); balance integer; owned integer; price integer;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_level is null or p_level not between 1 and 7 then raise exception 'INVALID_EXPANSION'; end if;
 -- The wallet lock serializes concurrent purchases and retries across sessions.
 select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)) into balance
 from public.user_profiles where id=uid for update;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 insert into public.garden_expansions(user_id) values(uid) on conflict do nothing;
 select level into owned from public.garden_expansions where user_id=uid for update;
 if p_level<=owned then return jsonb_build_object('level',owned,'balance',balance,'charged',0); end if;
 if p_level<>owned+1 then raise exception 'EXPANSION_ORDER'; end if;
 price:=(array[80,140,220,320,450,650,900])[p_level];
 if balance<price then raise exception 'INSUFFICIENT_FRAGMENTS'; end if;
 balance:=balance-price;
 update public.user_profiles set fragments=balance,wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{fragments}',to_jsonb(balance)) where id=uid;
 update public.garden_expansions set level=p_level where user_id=uid;
 return jsonb_build_object('level',p_level,'balance',balance,'charged',price);
end;
$$;
revoke all on function public.buy_garden_expansion(integer) from public, anon;
grant execute on function public.buy_garden_expansion(integer) to authenticated;

create or replace function public.validate_garden_expansion() returns trigger
language plpgsql security definer set search_path='' as $$
declare size text:=new.state#>>'{terrain,size}'; owned integer;
begin
 if size is null or size in ('standard','spacious') then return new; end if;
 if size !~ '^expansion-[1-7]$' then raise exception 'INVALID_GARDEN_SIZE'; end if;
 select coalesce(level,0) into owned from public.garden_expansions where user_id=new.user_id;
 if coalesce(owned,0)<right(size,1)::integer then raise exception 'GARDEN_SIZE_NOT_OWNED'; end if;
 return new;
end;
$$;
revoke all on function public.validate_garden_expansion() from public, anon, authenticated;
-- The garden table is installed by 20260909180000; compilation scaffolds may omit it.
do $$ begin
 if to_regclass('public.user_gardens_3d') is not null then
  drop trigger if exists garden_expansion_guard on public.user_gardens_3d;
  create trigger garden_expansion_guard before insert or update of state on public.user_gardens_3d
  for each row execute function public.validate_garden_expansion();
 end if;
end $$;
commit;


begin;
create table if not exists public.daily_fragments_activation (
 id boolean primary key default true check(id),
 start_day date not null default ((now() at time zone 'America/Sao_Paulo' - interval '4 hours')::date)
);
insert into public.daily_fragments_activation(id) values(true) on conflict do nothing;
create table if not exists public.daily_fragment_receipts (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null, raw_exp bigint not null check(raw_exp>=0),
 fragments integer not null check(fragments between 0 and 15),
 created_at timestamptz not null default now(), primary key(user_id,day)
);
alter table public.daily_fragments_activation enable row level security;
alter table public.daily_fragment_receipts enable row level security;
revoke all on public.daily_fragments_activation,public.daily_fragment_receipts from anon,authenticated;

create or replace function public.claim_daily_fragments(p_day date) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); today date:=(now() at time zone 'America/Sao_Paulo'-interval '4 hours')::date;
 balance integer; earned integer; raw bigint; receipt public.daily_fragment_receipts%rowtype;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_day is null or p_day>=today then raise exception 'DAY_NOT_CLOSED'; end if;
 if p_day<(select start_day from public.daily_fragments_activation where id) then return null; end if;
 -- Serializes two panels/devices with other wallet operations.
 select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)) into balance
 from public.user_profiles where id=uid for update;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 select * into receipt from public.daily_fragment_receipts where user_id=uid and day=p_day;
 if found then return jsonb_build_object('day',p_day,'rawExp',receipt.raw_exp,'fragments',receipt.fragments,'balance',balance,'awarded',false); end if;
 -- Raw completed action EXP: duration only, without difficulty, Premium,
 -- chests, cycle grants or client-supplied values. Free actions do not score.
 select coalesce(sum(greatest(0,round(coalesce(t.duration,a.duration,0)::numeric))),0)::bigint into raw
 from public.scheduled_tasks t join public.actions a on a.id::text=t.action_id::text and a.user_id=t.user_id
 where t.user_id=uid and t.completed=true and coalesce(a.action_type,'')<>'Livre'
 and t.date::date between p_day and p_day+1
 and (t.date::date-case when t.start_time>=0 and t.start_time<240 then 1 else 0 end)=p_day;
 earned:=least(15,raw/50)::integer;
 insert into public.daily_fragment_receipts(user_id,day,raw_exp,fragments) values(uid,p_day,raw,earned);
 if earned>0 then
  balance:=balance+earned;
  update public.user_profiles set fragments=balance,wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{fragments}',to_jsonb(balance)) where id=uid;
 end if;
 return jsonb_build_object('day',p_day,'rawExp',raw,'fragments',earned,'balance',balance,'awarded',true);
end;
$$;
revoke all on function public.claim_daily_fragments(date) from public,anon;
grant execute on function public.claim_daily_fragments(date) to authenticated;
commit;
