begin;

-- O mentor volta a poder criar arena para o pupilo — mas entregando, nao
-- escrevendo na conta dele.
--
-- A historia disto importa. Em marco a mentoria ganhou edicao colaborativa: o
-- mentor criava e alterava arenas, acoes e tarefas dentro da conta do pupilo.
-- No mesmo dia foi preciso corrigir a propriedade da arena criada; quatro dias
-- depois, duas migracoes seguidas para o PUPILO conseguir apagar uma arena que o
-- mentor tinha feito na conta dele. Em agosto tudo isso caiu, com o principio
-- escrito no comentario: "O mentor nunca cria ou altera arenas, acoes ou tarefas
-- na conta da outra pessoa."
--
-- Quatro meses e meio remendando uma pergunta so: de quem e a arena?
--
-- A resposta e o INSTALAR. O mentor monta uma oferta a partir de uma arena dele;
-- ela fica esperando; e no instante em que o pupilo instala, a arena nasce JA
-- SENDO DELE — copia propria, dono proprio, sem politica de escrita cruzada e
-- sem remendo de "deixa ele apagar". O mentor nunca toca na conta do outro.
--
-- E isso tambem e o que faz mentoria e prazo conviverem: quando o vinculo vence,
-- a arena instalada nao some, porque ja e do pupilo ha tempo.

do $$
begin
  if to_regclass('public.relationship_links') is null then
    raise exception 'MENTORSHIP_OFFER_MISSING: public.relationship_links';
  end if;
  if to_regprocedure('public.relationship_link_price(text,integer)') is null then
    raise exception 'MENTORSHIP_OFFER_MISSING: rode 20260826120000 antes desta';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Onde a oferta espera
-- ---------------------------------------------------------------------------

create table if not exists public.relationship_mentorship_offers (
  id uuid primary key default extensions.gen_random_uuid(),
  relationship_link_id uuid not null references public.relationship_links(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  pupil_id uuid not null references auth.users(id) on delete cascade,
  -- A arena de origem e do MENTOR e serve so de molde. Se ele apagar a dele
  -- depois, a oferta ja carrega o conteudo no snapshot e continua instalavel.
  source_arena_id uuid references public.arenas(id) on delete set null,
  arena_snapshot jsonb not null default '{}'::jsonb,
  actions_snapshot jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  installed_arena_id uuid references public.arenas(id) on delete set null,
  constraint relationship_mentorship_offers_status_check
    check (status in ('pending', 'installed', 'declined', 'cancelled'))
);

create index if not exists relationship_mentorship_offers_link_idx
  on public.relationship_mentorship_offers (relationship_link_id, created_at desc);

create index if not exists relationship_mentorship_offers_pupil_idx
  on public.relationship_mentorship_offers (pupil_id, status);

-- Uma oferta pendente por vinculo. Empilhar entregas nao respondidas faria o
-- pupilo receber uma fila em vez de uma escolha.
create unique index if not exists relationship_mentorship_offers_pending_idx
  on public.relationship_mentorship_offers (relationship_link_id)
  where status = 'pending';

alter table public.relationship_mentorship_offers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'relationship_mentorship_offers'
      and policyname = 'Participants read own mentorship offers'
  ) then
    create policy "Participants read own mentorship offers"
    on public.relationship_mentorship_offers
    for select
    using (auth.uid() = mentor_id or auth.uid() = pupil_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Oferecer
-- ---------------------------------------------------------------------------
-- Nada nasce na conta do pupilo aqui. O conteudo e copiado para o snapshot, e a
-- oferta fica esperando resposta.

create or replace function public.offer_mentorship_arena(
  p_relationship_link_id uuid,
  p_source_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_arena public.arenas%rowtype;
  v_offer public.relationship_mentorship_offers%rowtype;
  v_actions jsonb := '[]'::jsonb;
  v_action_count integer := 0;
  v_installed_count integer := 0;
  v_nickname text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'mentoria'
    and mentor_id = v_uid
    and ended_at is null
  for update;

  if not found then raise exception 'MENTORSHIP_MENTOR_REQUIRED'; end if;

  -- Vinculo vencido congela: continua visivel, mas nao aceita coisa nova.
  if v_link.expires_at is not null and v_link.expires_at <= now() then
    raise exception 'RELATIONSHIP_LINK_EXPIRED';
  end if;

  -- As vagas da mentoria sao de ENTREGA, e e isso que o vinculo vendeu. Contam
  -- as ja instaladas: recusada nao gastou nada.
  select count(*) into v_installed_count
  from public.relationship_mentorship_offers
  where relationship_link_id = v_link.id
    and status = 'installed';

  if v_installed_count >= coalesce(v_link.arena_slots, 1) then
    raise exception 'MENTORSHIP_OFFER_SLOTS_FULL';
  end if;

  if exists (
    select 1 from public.relationship_mentorship_offers
    where relationship_link_id = v_link.id and status = 'pending'
  ) then raise exception 'MENTORSHIP_OFFER_ALREADY_PENDING'; end if;

  select * into v_arena
  from public.arenas
  where id = p_source_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false;

  if not found then raise exception 'MENTORSHIP_OWN_ARENA_REQUIRED'; end if;

  select
    coalesce(jsonb_agg(
      jsonb_build_object(
        'name', a.name,
        'description', a.description,
        'icon', a.icon,
        'duration', a.duration,
        'repetitions', a.repetitions,
        'action_type', a.action_type,
        'difficulty', a.difficulty,
        'briefing', a.briefing,
        'assets', coalesce(a.assets, '[]'::jsonb),
        'pre_flight', coalesce(a.pre_flight, '[]'::jsonb),
        'context', coalesce(a.context, '{}'::jsonb),
        'origin_codex_id', a.origin_codex_id
      ) order by a.name
    ), '[]'::jsonb),
    count(*)
  into v_actions, v_action_count
  from public.actions a
  where a.arena_id = v_arena.id
    and coalesce(a.action_type, '') <> 'Livre';

  if v_action_count = 0 then raise exception 'MENTORSHIP_SOURCE_ARENA_EMPTY'; end if;

  insert into public.relationship_mentorship_offers (
    relationship_link_id, mentor_id, pupil_id, source_arena_id,
    arena_snapshot, actions_snapshot
  ) values (
    v_link.id, v_uid, v_link.pupil_id, v_arena.id,
    jsonb_build_object(
      'asset_id', v_arena.asset_id,
      'name', v_arena.name,
      'description', coalesce(v_arena.description, ''),
      'icon', coalesce(nullif(v_arena.icon, ''), '🏛️'),
      'actionCount', v_action_count
    ),
    v_actions
  ) returning * into v_offer;

  select nickname into v_nickname from public.user_profiles where id = v_uid;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), v_link.pupil_id, 'arena_access',
    format('@%s montou "%s" para voce.', coalesce(v_nickname, 'Seu mentor'), v_arena.name),
    false, now(),
    jsonb_build_object(
      'offerId', v_offer.id,
      'relationshipLinkId', v_link.id,
      'linkType', 'mentoria'
    )
  );

  return jsonb_build_object('success', true, 'offer', to_jsonb(v_offer));
end;
$fn$;

revoke all on function public.offer_mentorship_arena(uuid, uuid) from public;
grant execute on function public.offer_mentorship_arena(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Instalar, recusar, cancelar
-- ---------------------------------------------------------------------------
-- Instalar e onde a posse muda de mao. A arena nasce com user_id do PUPILO, e a
-- partir dai o mentor nao tem nenhum poder sobre ela — nem para editar, nem para
-- apagar. E por isso que o vinculo pode vencer sem levar a arena junto.

create or replace function public.respond_mentorship_offer(
  p_offer_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_offer public.relationship_mentorship_offers%rowtype;
  v_link public.relationship_links%rowtype;
  v_arena public.arenas%rowtype;
  v_action jsonb;
  v_nickname text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(p_action, '') not in ('install', 'decline', 'cancel') then
    raise exception 'MENTORSHIP_OFFER_ACTION_INVALID';
  end if;

  select * into v_offer
  from public.relationship_mentorship_offers
  where id = p_offer_id
  for update;

  if not found then raise exception 'MENTORSHIP_OFFER_NOT_FOUND'; end if;
  if v_offer.status <> 'pending' then raise exception 'MENTORSHIP_OFFER_NOT_PENDING'; end if;

  -- Cancelar e do mentor; instalar e recusar sao do pupilo. Ninguem instala no
  -- lugar do outro.
  if p_action = 'cancel' then
    if v_offer.mentor_id <> v_uid then raise exception 'MENTORSHIP_OFFER_PERMISSION_DENIED'; end if;
    update public.relationship_mentorship_offers
    set status = 'cancelled', responded_at = now()
    where id = v_offer.id;
    return jsonb_build_object('success', true, 'status', 'cancelled');
  end if;

  if v_offer.pupil_id <> v_uid then
    raise exception 'MENTORSHIP_OFFER_PERMISSION_DENIED';
  end if;

  if p_action = 'decline' then
    update public.relationship_mentorship_offers
    set status = 'declined', responded_at = now()
    where id = v_offer.id;

    select nickname into v_nickname from public.user_profiles where id = v_uid;

    insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
    values (
      extensions.gen_random_uuid(), v_offer.mentor_id, 'arena_access',
      format('@%s recusou a arena que voce montou.', coalesce(v_nickname, 'Seu pupilo')),
      false, now(),
      jsonb_build_object('relationshipLinkId', v_offer.relationship_link_id, 'linkType', 'mentoria')
    );

    return jsonb_build_object('success', true, 'status', 'declined');
  end if;

  select * into v_link
  from public.relationship_links
  where id = v_offer.relationship_link_id
    and ended_at is null
  for update;

  if not found then raise exception 'MENTORSHIP_MENTOR_REQUIRED'; end if;

  -- Oferta de ontem nao ressuscita vinculo vencido.
  if v_link.expires_at is not null and v_link.expires_at <= now() then
    raise exception 'RELATIONSHIP_LINK_EXPIRED';
  end if;

  -- A arena nasce do pupilo. Nao ha nada aqui que o mentor possa alterar depois.
  insert into public.arenas (
    id, user_id, asset_id, name, description, icon, is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_uid,
    coalesce(v_offer.arena_snapshot ->> 'asset_id', 'geral'),
    coalesce(v_offer.arena_snapshot ->> 'name', 'Arena da mentoria'),
    coalesce(v_offer.arena_snapshot ->> 'description', ''),
    coalesce(nullif(v_offer.arena_snapshot ->> 'icon', ''), '🏛️'),
    false
  ) returning * into v_arena;

  for v_action in select * from jsonb_array_elements(coalesce(v_offer.actions_snapshot, '[]'::jsonb))
  loop
    insert into public.actions (
      id, user_id, arena_id, name, description, icon, duration, repetitions,
      action_type, difficulty, briefing, assets, pre_flight, context, origin_codex_id
    ) values (
      extensions.gen_random_uuid(),
      v_uid,
      v_arena.id,
      coalesce(v_action ->> 'name', 'Acao'),
      v_action ->> 'description',
      v_action ->> 'icon',
      nullif(v_action ->> 'duration', '')::integer,
      nullif(v_action ->> 'repetitions', '')::integer,
      v_action ->> 'action_type',
      v_action ->> 'difficulty',
      v_action ->> 'briefing',
      coalesce(v_action -> 'assets', '[]'::jsonb),
      coalesce(v_action -> 'pre_flight', '[]'::jsonb),
      coalesce(v_action -> 'context', '{}'::jsonb),
      nullif(v_action ->> 'origin_codex_id', '')::uuid
    );
  end loop;

  update public.relationship_mentorship_offers
  set status = 'installed', responded_at = now(), installed_arena_id = v_arena.id
  where id = v_offer.id;

  -- A arena instalada tambem entra no vinculo, para o mentor poder ACOMPANHAR o
  -- que entregou. Acompanhar e so leitura: nao existe politica que deixe o
  -- mentor escrever nela.
  insert into public.relationship_link_arenas (
    relationship_link_id, arena_id, created_by_user_id, metadata
  ) values (
    v_link.id, v_arena.id, v_uid,
    jsonb_build_object(
      'link_type', 'mentoria',
      'offer_id', v_offer.id,
      'installed_from_mentor', v_offer.mentor_id
    )
  ) on conflict do nothing;

  select nickname into v_nickname from public.user_profiles where id = v_uid;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), v_offer.mentor_id, 'arena_access',
    format('@%s instalou "%s".', coalesce(v_nickname, 'Seu pupilo'), v_arena.name),
    false, now(),
    jsonb_build_object(
      'relationshipLinkId', v_link.id,
      'arenaId', v_arena.id,
      'linkType', 'mentoria'
    )
  );

  return jsonb_build_object(
    'success', true,
    'status', 'installed',
    'arena', to_jsonb(v_arena)
  );
end;
$fn$;

revoke all on function public.respond_mentorship_offer(uuid, text) from public;
grant execute on function public.respond_mentorship_offer(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. A porta murada continua murada, mas agora aponta o caminho
-- ---------------------------------------------------------------------------
-- create_linked_relationship_arena levantava MENTORSHIP_ARENA_CREATION_DISABLED
-- sem dizer o que fazer em vez disso. Agora o erro nomeia a saida.

create or replace function public.create_linked_relationship_arena(
  p_relationship_link_id uuid,
  p_asset_id text,
  p_name text,
  p_description text default '',
  p_icon text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  raise exception 'MENTORSHIP_USE_OFFER_INSTEAD';
end;
$fn$;

commit;
