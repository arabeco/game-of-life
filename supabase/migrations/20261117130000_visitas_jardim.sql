-- Rodar manualmente depois de 20261117120000_pessoas_para_conhecer.sql.
begin;
create table if not exists public.garden_visit_marks (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 visitor_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('recado','peixes','borboleta')),
 phrase_id integer,
 cost integer not null check(cost>0),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 removed_at timestamptz,
 owner_seen_at timestamptz,
 request_id uuid,
 check(owner_id<>visitor_id),
 check((kind='recado' and phrase_id between 1 and 10 and phrase_id is not null) or (kind<>'recado' and phrase_id is null)),
 unique(visitor_id,request_id)
);
create index if not exists garden_marks_active on public.garden_visit_marks(owner_id,expires_at) where removed_at is null;
create index if not exists garden_marks_daily on public.garden_visit_marks(visitor_id,owner_id,created_at);
alter table public.garden_visit_marks enable row level security;
revoke all on public.garden_visit_marks from public,anon,authenticated;
grant select on public.garden_visit_marks to authenticated;
drop policy if exists garden_marks_read on public.garden_visit_marks;
create policy garden_marks_read on public.garden_visit_marks for select to authenticated using(owner_id=auth.uid() or visitor_id=auth.uid());

-- Preços e durações existem só nesta constante do servidor; o seletor a recebe.
create or replace function public._catalogo_visitas() returns jsonb
language sql immutable set search_path='' as $$ select '[
 {"id":"recado","nome":"Deixar um recado","custo":1,"requisito":null,"duracao":168,"ativo":true},
 {"id":"peixes","nome":"Alimentar os peixes","custo":2,"requisito":"garden_base_pond","duracao":24,"ativo":true},
 {"id":"borboleta","nome":"Soltar uma borboleta","custo":3,"requisito":null,"duracao":24,"ativo":true},
 {"id":"petalas","nome":"Espalhar pétalas","custo":2,"requisito":null,"duracao":24,"ativo":false},
 {"id":"lanterna","nome":"Acender uma lanterna","custo":3,"requisito":"JARDIM_LANTERNA_PEDRA","duracao":24,"ativo":false}
 ]'::jsonb $$;

-- Extraído do caminho transacional usado em buy_garden_expansion.
-- Não é uma RPC de gasto genérica: somente funções do servidor podem chamá-la.
create or replace function public._debitar_fragmentos(p_user uuid,p_cost integer) returns integer
language plpgsql security definer set search_path='' as $$
declare balance integer;
begin
 if p_cost is null or p_cost<=0 then raise exception 'INVALID_COST'; end if;
 select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)) into balance
 from public.user_profiles where id=p_user for update;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 if balance<p_cost then raise exception 'INSUFFICIENT_FRAGMENTS'; end if;
 balance:=balance-p_cost;
 update public.user_profiles set fragments=balance,wallet=jsonb_set(coalesce(wallet,'{}'::jsonb),'{fragments}',to_jsonb(balance)) where id=p_user;
 return balance;
end $$;

create or replace function public.deixar_marca_no_jardim(p_owner uuid,p_kind text,p_phrase_id integer default null,p_request_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); item jsonb; garden jsonb; enabled boolean; balance integer; total integer; notes integer;
 mark public.garden_visit_marks%rowtype; day_start timestamptz; visitor_name text; alert_id uuid; summary text;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_owner is null or p_owner=uid then raise exception 'VISITOR_REQUIRED'; end if;
 select value into item from jsonb_array_elements(public._catalogo_visitas()) where value->>'id'=p_kind and (value->>'ativo')::boolean;
 if item is null then raise exception 'INVALID_KIND'; end if;
 if (p_kind='recado' and (p_phrase_id is null or p_phrase_id not between 1 and 10)) or (p_kind<>'recado' and p_phrase_id is not null) then raise exception 'INVALID_PHRASE'; end if;
 -- Ordem de locks determinística também protege visitas cruzadas simultâneas.
 perform id from public.user_profiles where id in (uid,p_owner) order by id for update;
 garden:=public.load_garden_3d(p_owner);
 if garden is null then raise exception 'GARDEN_NOT_VISIBLE'; end if;
 select garden_interactions_enabled into enabled from public.user_profiles where id=p_owner;
 if enabled is distinct from true then raise exception 'INTERACTIONS_DISABLED'; end if;
 select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)),nickname into balance,visitor_name from public.user_profiles where id=uid;
 if p_request_id is not null then
  select * into mark from public.garden_visit_marks where visitor_id=uid and request_id=p_request_id;
  if found then
   if mark.owner_id<>p_owner or mark.kind<>p_kind or mark.phrase_id is distinct from p_phrase_id then raise exception 'REQUEST_CONFLICT'; end if;
   return jsonb_build_object('balance',balance,'mark',to_jsonb(mark),'repeated',true);
  end if;
 end if;
 if p_kind='peixes' and garden#>>'{state,base}' is distinct from 'pond' then raise exception 'POND_REQUIRED'; end if;
 day_start:=(((now() at time zone 'America/Sao_Paulo')-interval '4 hours')::date+time '04:00') at time zone 'America/Sao_Paulo';
 select count(*),count(*) filter(where kind='recado') into total,notes from public.garden_visit_marks where visitor_id=uid and owner_id=p_owner and created_at>=day_start;
 if total>=3 then raise exception 'DAILY_LIMIT'; end if;
 if p_kind='recado' and notes>=1 then raise exception 'NOTE_LIMIT'; end if;
 balance:=public._debitar_fragmentos(uid,(item->>'custo')::integer);
 insert into public.garden_visit_marks(owner_id,visitor_id,kind,phrase_id,cost,expires_at,request_id)
 values(p_owner,uid,p_kind,p_phrase_id,(item->>'custo')::integer,now()+make_interval(hours=>(item->>'duracao')::integer),p_request_id) returning * into mark;
 select string_agg(label,', ' order by label) into summary from (
  select distinct case kind when 'recado' then 'deixou um recado' when 'peixes' then 'alimentou os peixes' else 'soltou uma borboleta' end label
  from public.garden_visit_marks where owner_id=p_owner and visitor_id=uid and created_at>=day_start
 ) actions;
 select id into alert_id from public.notifications where user_id=p_owner and type='system'
  and metadata->>'purpose'='garden_visit' and metadata->>'visitorId'=uid::text and metadata->>'day'=day_start::text limit 1;
 if alert_id is null then
  insert into public.notifications(user_id,type,content,read,metadata) values(p_owner,'system',coalesce(visitor_name,'Alguém')||' '||summary||' no seu jardim.',false,
   jsonb_build_object('purpose','garden_visit','visitorId',uid,'day',day_start::text));
 else
  update public.notifications set content=coalesce(visitor_name,'Alguém')||' '||summary||' no seu jardim.',read=false where id=alert_id;
 end if;
 return jsonb_build_object('balance',balance,'mark',to_jsonb(mark),'repeated',false);
end $$;

create or replace function public.marcas_do_jardim(p_owner uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); garden jsonb; enabled boolean; day_start timestamptz; marks jsonb; history jsonb;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 garden:=public.load_garden_3d(p_owner);
 if uid<>p_owner and garden is null then raise exception 'GARDEN_NOT_VISIBLE'; end if;
 select garden_interactions_enabled into enabled from public.user_profiles where id=p_owner;
 day_start:=(((now() at time zone 'America/Sao_Paulo')-interval '4 hours')::date+time '04:00') at time zone 'America/Sao_Paulo';
 select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) into marks from (
  select m.id,m.kind,m.phrase_id,m.created_at,m.expires_at,p.nickname visitor_name
  from public.garden_visit_marks m join public.user_profiles p on p.id=m.visitor_id
  where m.owner_id=p_owner and m.expires_at>now() and m.removed_at is null order by m.created_at desc,m.id limit 20
 ) m;
 if uid=p_owner then
  select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) into history from (
   select m.id,m.kind,m.phrase_id,m.created_at,m.removed_at,m.owner_seen_at,p.nickname visitor_name
   from public.garden_visit_marks m join public.user_profiles p on p.id=m.visitor_id where m.owner_id=uid
   order by (m.owner_seen_at is null) desc,m.created_at desc limit 100
  ) m;
 end if;
 return jsonb_build_object('marks',marks,'history',coalesce(history,'[]'::jsonb),'enabled',coalesce(enabled,false),'catalog',public._catalogo_visitas(),
  'pond',coalesce(garden#>>'{state,base}'='pond',false),'balance',(select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)) from public.user_profiles where id=uid),
  'today',(select count(*) from public.garden_visit_marks where owner_id=p_owner and visitor_id=uid and created_at>=day_start),
  'noteToday',exists(select 1 from public.garden_visit_marks where owner_id=p_owner and visitor_id=uid and kind='recado' and created_at>=day_start));
end $$;

create or replace function public.remover_recado(p_mark uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 update public.garden_visit_marks set removed_at=coalesce(removed_at,now()) where id=p_mark and owner_id=auth.uid() and kind='recado';
 if not found then raise exception 'OWNER_REQUIRED'; end if;
end $$;
create or replace function public.marcar_visitas_vistas(p_ids uuid[]) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if coalesce(cardinality(p_ids),0)>100 then raise exception 'LIMIT_EXCEEDED'; end if;
 update public.garden_visit_marks set owner_seen_at=now() where owner_id=auth.uid() and id=any(p_ids) and owner_seen_at is null;
end $$;
create or replace function public.historico_visitas_jardim(p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) into result from (
  select m.id,m.kind,m.phrase_id,m.created_at,m.removed_at,m.owner_seen_at,p.nickname visitor_name
  from public.garden_visit_marks m join public.user_profiles p on p.id=m.visitor_id
  where m.owner_id=auth.uid() order by m.created_at desc,m.id desc limit 50 offset greatest(coalesce(p_offset,0),0)
 ) m;
 return result;
end $$;
revoke all on function public.historico_visitas_jardim(integer) from public,anon;
grant execute on function public.historico_visitas_jardim(integer) to authenticated;
-- A compra existente passa pelo mesmo débito, mantendo preços e recibo.
create or replace function public.buy_garden_expansion(p_level integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); balance integer; owned integer; price integer;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_level is null or p_level not between 1 and 7 then raise exception 'INVALID_EXPANSION'; end if;
 select greatest(coalesce(fragments,0),coalesce((wallet->>'fragments')::integer,0)) into balance from public.user_profiles where id=uid for update;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 insert into public.garden_expansions(user_id) values(uid) on conflict do nothing;
 select level into owned from public.garden_expansions where user_id=uid for update;
 if p_level<=owned then return jsonb_build_object('level',owned,'balance',balance,'charged',0); end if;
 if p_level<>owned+1 then raise exception 'EXPANSION_ORDER'; end if;
 price:=(array[80,140,220,320,450,650,900])[p_level];
 balance:=public._debitar_fragmentos(uid,price);
 update public.garden_expansions set level=p_level where user_id=uid;
 return jsonb_build_object('level',p_level,'balance',balance,'charged',price);
end $$;
revoke all on function public.buy_garden_expansion(integer) from public,anon;
grant execute on function public.buy_garden_expansion(integer) to authenticated;
revoke all on function public._catalogo_visitas(),public._debitar_fragmentos(uuid,integer) from public,anon,authenticated;
revoke all on function public.deixar_marca_no_jardim(uuid,text,integer,uuid),public.marcas_do_jardim(uuid),public.remover_recado(uuid),public.marcar_visitas_vistas(uuid[]) from public,anon;
grant execute on function public.deixar_marca_no_jardim(uuid,text,integer,uuid),public.marcas_do_jardim(uuid),public.remover_recado(uuid),public.marcar_visitas_vistas(uuid[]) to authenticated;
commit;
