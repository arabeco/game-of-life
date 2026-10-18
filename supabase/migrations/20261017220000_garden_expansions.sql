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
