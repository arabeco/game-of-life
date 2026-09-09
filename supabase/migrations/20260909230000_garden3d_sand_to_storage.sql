-- A AREIA DEIXA O BANCO E VIRA ARQUIVO.
--
-- Os dois PNG de 512x1024 (cor e relevo) eram gravados como base64 DENTRO do
-- jsonb. Isso dava um documento de ate 3,2 MB que viajava inteiro toda vez que
-- alguem abria o jardim, sem cache nenhum: jsonb nao e arquivo, e nada entre o
-- banco e o aparelho guarda copia dele.
--
-- Como arquivo no bucket, os PNG se comportam como o resto da arte do jogo:
-- baixam uma vez e ficam no celular. O documento passa a levar duas URLs curtas.
--
-- A tabela user_gardens_3d esta VAZIA, entao a troca de formato nao migra nada.
--
-- Aplicar inteiro no SQL Editor do projeto correto.
begin;

-- ------------------------------------------------------------------ O BUCKET
insert into storage.buckets (id, name, public)
values ('garden-sand', 'garden-sand', true)
on conflict (id) do update set public = true;

-- Leitura publica: o jardim e visitavel, e URL publica e o que permite o CDN
-- guardar copia. URL assinada expira, e expirar mata exatamente o cache que
-- justifica toda esta mudanca.
drop policy if exists garden_sand_leitura on storage.objects;
create policy garden_sand_leitura on storage.objects
  for select using (bucket_id = 'garden-sand');

-- Escrita so na PROPRIA pasta. Sem isto, qualquer pessoa autenticada poderia
-- sobrescrever a areia de outra.
drop policy if exists garden_sand_escrita on storage.objects;
create policy garden_sand_escrita on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garden-sand' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists garden_sand_regravar on storage.objects;
create policy garden_sand_regravar on storage.objects
  for update to authenticated
  using (bucket_id = 'garden-sand' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'garden-sand' and (storage.foldername(name))[1] = auth.uid()::text);

-- --------------------------------------------------------------- O DOCUMENTO
-- 3,2 MB era o teto que cabia dois PNG em base64. Sem eles, 200 KB e folgado
-- para 64 objetos, 8 artefatos e duas URLs — e o teto E a defesa de egress.
alter table public.user_gardens_3d drop constraint if exists garden3d_document_size;
alter table public.user_gardens_3d
  add constraint garden3d_document_size check (octet_length(state::text) <= 200000);

-- ---------------------------------------------------------------- A VALIDACAO
create or replace function public.save_garden_3d(p_state jsonb,p_revision bigint)
returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_uid uuid:=auth.uid(); v_revision bigint; v_item jsonb; v_required text; v_art jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Serialize first insert as well as updates. Two devices cannot silently overwrite.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text||':garden3d',0));
  select revision into v_revision from public.user_gardens_3d where user_id=v_uid;
  if p_revision is distinct from coalesce(v_revision,0) then raise exception 'garden_conflict'; end if;
  if p_state is null or jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>200000
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
  -- A AREIA E ARQUIVO, ENTAO A VALIDACAO MUDOU DE ALVO.
  --
  -- Antes o desenho vinha embutido como base64 e a funcao conferia os magic
  -- bytes do PNG e as dimensoes 512x1024 lendo o proprio binario. Agora o que
  -- chega e a URL publica no bucket, e a pergunta a fazer e outra: esta URL
  -- aponta para o arquivo DESTA pessoa?
  --
  -- O caminho e ancorado em v_uid e no proprio nome do campo, entao um jardim
  -- nao pode apontar para a areia de outro nem para conteudo qualquer da
  -- internet — o que importa porque a imagem e carregada tambem por quem visita.
  -- O host e fixo pelo mesmo motivo que ele ja e fixo em utils/profileBackgrounds.
  --
  -- O `?v=` opcional e o cache-buster: o caminho no bucket e fixo com upsert, e
  -- sem ele o navegador continuaria mostrando o desenho anterior.
  if p_state ? 'drawing' then
    if jsonb_typeof(p_state->'drawing') is distinct from 'object' then raise exception 'invalid_sand'; end if;
    foreach v_required in array array['color','height'] loop
      if coalesce(p_state->'drawing'->>v_required,'') !~ (
        '^https://klmsdcncmhtgnlcejzdi\.supabase\.co/storage/v1/object/public/garden-sand/'
        || v_uid::text || '/' || v_required || '\.png(\?v=[0-9]{1,20})?$'
      ) then raise exception 'invalid_sand'; end if;
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

commit;
