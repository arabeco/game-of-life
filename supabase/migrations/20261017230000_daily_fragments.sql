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
