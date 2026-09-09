-- Apply after the existing items / inventory / gold-ledger migrations.
-- Separate storage: never migrates or overwrites the 2D gardenState.
begin;

-- Retire the nine former 2D decorations. Preserve inventory and historical saves.
update public.items set is_live_in_game=false,is_legacy_retired=true,gold_price=null
where id in ('item_garden_stone_1','item_garden_stone_2','item_garden_stone_3',
 'item_garden_plant_1','item_garden_plant_2','item_garden_tool_1',
 'item_garden_lantern_1','item_garden_bridge_1','item_garden_statue_1');

insert into public.items
  (id,name,category,tier,rarity,is_season_exclusive,is_gold_exclusive,recycle_value,craft_cost,gold_price,image_url,description,is_live_in_game,is_rank_exclusive,is_premium_only,is_chest_exclusive,is_legacy_retired)
values
  ('garden_kit_luxury','Kit Jardim: Pátio dourado','garden',5,'legendary',false,false,1000,4000,420,'/garden3d/catalog/garden_kit_luxury.svg','Seis peças de calcário, bronze e folhagem dourada.',true,false,false,false,false),
  ('garden_kit_genesis','Kit Jardim: Gênesis','garden',5,'legendary',false,false,1000,4000,500,'/garden3d/catalog/garden_kit_genesis.svg','Seis peças de basalto, ametista e folhagem violeta.',true,false,false,false,false),
  ('garden_base_pond','Jardim: Espelho do bosque','garden',5,'legendary',false,false,1000,4000,340,'/garden3d/catalog/garden_base_pond.svg','Base ampla com lago lateral.',true,false,false,false,false),
  ('garden_base_river','Jardim: Margens do refúgio','garden',5,'legendary',false,false,1000,4000,500,'/garden3d/catalog/garden_base_river.svg','Base alongada com riacho e ponte.',true,false,false,false,false),
  ('garden_base_path','Jardim: Caminho antigo','garden',5,'legendary',false,false,1000,4000,380,'/garden3d/catalog/garden_base_path.svg','Base de cantos suaves com caminho de pedras.',true,false,false,false,false)
on conflict(id) do update set
  name=excluded.name,category=excluded.category,tier=excluded.tier,rarity=excluded.rarity,
  is_season_exclusive=excluded.is_season_exclusive,is_gold_exclusive=excluded.is_gold_exclusive,
  gold_price=excluded.gold_price,recycle_value=excluded.recycle_value,craft_cost=excluded.craft_cost,
  image_url=excluded.image_url,description=excluded.description,is_live_in_game=excluded.is_live_in_game,
  is_rank_exclusive=false,is_premium_only=false,is_chest_exclusive=false,is_legacy_retired=false;
-- Tier 5, live and non-exclusive: existing open_chest includes these rows naturally.
-- Genesis is a thematic legendary here, NOT a tier-6 season-exclusive reward.

create table if not exists public.user_gardens_3d (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint garden3d_document_size check (octet_length(state::text)<=3200000)
);
alter table public.user_gardens_3d enable row level security;
revoke all on public.user_gardens_3d from anon,authenticated;
grant select on public.user_gardens_3d to authenticated;
drop policy if exists garden3d_owner_read on public.user_gardens_3d;
create policy garden3d_owner_read on public.user_gardens_3d for select to authenticated using(user_id=auth.uid());

create or replace function public.save_garden_3d(p_state jsonb,p_revision bigint)
returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_uid uuid:=auth.uid(); v_revision bigint; v_item jsonb; v_required text; v_art jsonb; v_png bytea;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Serialize first insert as well as updates. Two devices cannot silently overwrite.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':garden3d',0));
  select revision into v_revision from public.user_gardens_3d where user_id=v_uid;
  if p_revision is distinct from coalesce(v_revision,0) then raise exception 'garden_conflict'; end if;
  if p_state is null or jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>3200000
    or p_state->>'version' is distinct from '1'
    or coalesce(p_state->>'base','') not in ('open','pond','river','path')
    or coalesce(p_state->>'environment','') not in ('cloister','ruins','mist')
    or coalesce(p_state->>'atmosphere','') not in ('morning','sunset','overcast')
    or coalesce(p_state->>'sand','') not in ('0','1','2')
    or jsonb_typeof(p_state->'objects') is distinct from 'array'
    or jsonb_typeof(p_state->'artifacts') is distinct from 'array'
    then raise exception 'invalid_garden'; end if;
  if jsonb_array_length(p_state->'objects')>64 or jsonb_array_length(p_state->'artifacts')>8 then raise exception 'garden_capacity'; end if;
  if p_state->>'base'<>'open' and not exists(select 1 from public.user_inventory where user_id=v_uid and item_id='garden_base_'||(p_state->>'base')) then raise exception 'garden_base_not_owned'; end if;
  if p_state ? 'drawing' then
    if jsonb_typeof(p_state->'drawing') is distinct from 'object' then raise exception 'invalid_sand'; end if;
    foreach v_required in array array['color','height'] loop
      if coalesce(p_state->'drawing'->>v_required,'') !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'
        or length(p_state->'drawing'->>v_required)>1500000 then raise exception 'invalid_sand'; end if;
      v_png:=decode(split_part(p_state->'drawing'->>v_required,',',2),'base64');
      if length(v_png)<33 or encode(substring(v_png from 1 for 8),'hex')<>'89504e470d0a1a0a'
        or encode(substring(v_png from 17 for 8),'hex')<>'0000020000000400' then raise exception 'invalid_sand_dimensions'; end if;
    end loop;
  end if;
  for v_item in select value from jsonb_array_elements(p_state->'objects') loop
    if coalesce(v_item->>'type','') not in ('garden-planter','garden-river','medieval-lamp','bridge','maple','pine','rock','pebble','rock-cluster','path-straight','path-curve','path-wild','pond','stream-straight','stream-curve','lantern','bamboo')
      or length(coalesce(v_item->>'id','')) not between 1 and 99
      or jsonb_typeof(v_item->'position') is distinct from 'array'
      or coalesce(v_item->>'kit','starter') not in ('starter','luxury','genesis') then raise exception 'invalid_garden_object'; end if;
    if jsonb_array_length(v_item->'position')<>3 then raise exception 'invalid_garden_position'; end if;
    for v_art in select value from jsonb_array_elements(v_item->'position') loop
      if jsonb_typeof(v_art)<>'number' or abs(v_art::text::numeric)>=1000 then raise exception 'invalid_garden_position'; end if;
    end loop;
    if jsonb_typeof(v_item->'rotation') is distinct from 'number' or abs((v_item->>'rotation')::numeric)>=1000
      or coalesce(v_item->>'variant','') !~ '^[0-9]{1,2}$' then raise exception 'invalid_garden_rotation'; end if;
    v_required:=case v_item->>'kit' when 'luxury' then 'garden_kit_luxury' when 'genesis' then 'garden_kit_genesis' end;
    if v_required is not null and not exists(select 1 from public.user_inventory where user_id=v_uid and item_id=v_required) then raise exception 'garden_kit_not_owned'; end if;
  end loop;
  for v_item in select value from jsonb_array_elements(p_state->'artifacts') loop
    if length(coalesce(v_item->>'id','')) not between 1 and 99 then raise exception 'invalid_artifact'; end if;
    foreach v_required in array array['x','z','rotation'] loop
      if jsonb_typeof(v_item->v_required) is distinct from 'number' or abs((v_item->>v_required)::numeric)>=1000 then raise exception 'invalid_artifact_position'; end if;
    end loop;
    if not exists(select 1 from public.user_inventory ui join public.items i on i.id=ui.item_id
      where ui.user_id=v_uid and ui.item_id=v_item->>'artifact' and i.category in ('artifact','insignia','insignias') and i.is_legacy_retired is not true and i.id not like 'item_garden_%') then raise exception 'garden_artifact_not_owned'; end if;
  end loop;
  if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_state->'objects'))
    or (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_state->'artifacts')) then raise exception 'duplicate_garden_id'; end if;
  v_revision:=coalesce(v_revision,0)+1;
  insert into public.user_gardens_3d(user_id,state,revision) values(v_uid,p_state,v_revision)
    on conflict(user_id) do update set state=excluded.state,revision=excluded.revision,updated_at=now();
  return v_revision;
end; $$;
revoke all on function public.save_garden_3d(jsonb,bigint) from public,anon;
grant execute on function public.save_garden_3d(jsonb,bigint) to authenticated;

create or replace function public.buy_garden_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_cost integer; v_gold integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':garden-buy',0));
  perform 1 from public.user_profiles where id=v_uid for update;
  select gold_price into v_cost from public.items where id=p_item_id and category='garden' and is_live_in_game is true and gold_price>0;
  if not found then raise exception 'garden_item_unavailable'; end if;
  if exists(select 1 from public.user_inventory where user_id=v_uid and item_id=p_item_id) then
    select coalesce((wallet->>'gold')::integer,gold,0) into v_gold from public.user_profiles where id=v_uid;
    return jsonb_build_object('success',true,'already_owned',true,'new_gold',v_gold);
  end if;
  v_gold:=public._codex_debit_gold(v_uid,v_cost,'garden_item','Item do Jardim 3D',jsonb_build_object('item_id',p_item_id,'cost_gold',v_cost));
  insert into public.user_inventory(user_id,item_id) values(v_uid,p_item_id);
  return jsonb_build_object('success',true,'new_gold',v_gold,'item_id',p_item_id);
end; $$;
revoke all on function public.buy_garden_item(text) from public,anon;
grant execute on function public.buy_garden_item(text) to authenticated;
commit;
