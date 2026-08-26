begin;

-- O duelo passa a ser proposto, nao imposto.
--
-- Ate aqui, forjar um duelo criava na hora as duas arenas espelhadas — a sua e a
-- do outro — e mandava uma notificacao avisando que a arena dele "ja esta
-- pronta". Ou seja: uma pessoa escrevia uma arena na conta da outra sem
-- perguntar. E a mesma pergunta de propriedade que derrubou a mentoria
-- colaborativa em agosto, so que na competicao ninguem tinha reparado.
--
-- Agora ha um passo antes: quem propoe registra a intencao, quem recebe aceita
-- ou recusa dentro do card do vinculo, e so no aceite as arenas nascem. Recusar
-- nao custa nada, porque o duelo nao e mais vendido avulso — quem pagou foi o
-- vinculo.
--
-- O gesto e o mesmo do convite de vinculo e da entrega de mentoria: uma pendencia
-- aparece no card com aceitar/recusar. Tres coisas diferentes, um botao so.

do $$
begin
  if to_regclass('public.relationship_competition_challenges') is null then
    raise exception 'COMPETITION_PROPOSAL_MISSING: relationship_competition_challenges';
  end if;
  if to_regprocedure('public.relationship_link_price(text,integer)') is null then
    raise exception 'COMPETITION_PROPOSAL_MISSING: rode 20260826120000 antes desta';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Onde a proposta espera
-- ---------------------------------------------------------------------------
-- Tabela propria em vez de uma linha incompleta em relationship_competition_
-- challenges: aquela tabela exige as duas arenas em NOT NULL, e afrouxar isso
-- deixaria um duelo "meio criado" atravessar todas as consultas que hoje contam
-- com as duas arenas existirem.

create table if not exists public.relationship_competition_proposals (
  id uuid primary key default extensions.gen_random_uuid(),
  relationship_link_id uuid not null references public.relationship_links(id) on delete cascade,
  proposer_user_id uuid not null references auth.users(id) on delete cascade,
  opponent_user_id uuid not null references auth.users(id) on delete cascade,
  source_arena_id uuid not null references public.arenas(id) on delete cascade,
  arena_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  challenge_id uuid references public.relationship_competition_challenges(id) on delete set null,
  constraint relationship_competition_proposals_status_check
    check (status in ('pending', 'accepted', 'declined', 'cancelled'))
);

-- Uma proposta pendente por vinculo, pelo mesmo motivo que ha um duelo aberto por
-- vinculo: duas correndo ao mesmo tempo nao teriam como virar dois duelos.
create unique index if not exists relationship_competition_proposals_pending_idx
  on public.relationship_competition_proposals (relationship_link_id)
  where status = 'pending';

create index if not exists relationship_competition_proposals_opponent_idx
  on public.relationship_competition_proposals (opponent_user_id, status);

alter table public.relationship_competition_proposals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'relationship_competition_proposals'
      and policyname = 'Participants read own competition proposals'
  ) then
    create policy "Participants read own competition proposals"
    on public.relationship_competition_proposals
    for select
    using (auth.uid() = proposer_user_id or auth.uid() = opponent_user_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. A forja vira funcao interna
-- ---------------------------------------------------------------------------
-- Mesmo corpo de antes, com uma diferenca: quem desafia vem por parametro em vez
-- de sair de auth.uid(). Quem executa agora e quem ACEITA, e sem isso o duelo
-- nasceria com os lados trocados.

create or replace function public._competition_forge_challenge(
  p_relationship_link_id uuid,
  p_source_arena_id uuid,
  p_challenger_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := p_challenger_id;
  v_link public.relationship_links%rowtype;
  v_source_arena public.arenas%rowtype;
  v_source_action record;
  v_challenger_arena public.arenas%rowtype;
  v_opponent_arena public.arenas%rowtype;
  v_challenge public.relationship_competition_challenges%rowtype;
  v_opponent_id uuid;
  v_sender_nickname text;
  v_action_count integer := 0;
  v_total_planned integer := 0;
  v_new_gold integer;
  v_challenger_actions jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'COMPETITION_CHALLENGER_REQUIRED';
  end if;

  select *
  into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'competicao'
    and ended_at is null
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'ACTIVE_COMPETITION_LINK_REQUIRED';
  end if;

  if (
    select count(*)
    from public.relationship_competition_challenges challenge
    where challenge.relationship_link_id = v_link.id
      and challenge.sealed_at is null
  ) >= 1 then
    -- Um duelo por vez. O numero era 3 aqui, mas o indice unico
    -- relationship_competition_challenges_active_link_idx ja so aceitava um
    -- aberto desde marco: o segundo forjar passava por esta checagem e morria
    -- na constraint. Contando coisas diferentes, ainda por cima — este conta
    -- sealed_at, o indice conta completed_at.
    raise exception 'COMPETITION_CHALLENGE_LIMIT_REACHED';
  end if;

  select *
  into v_source_arena
  from public.arenas
  where id = p_source_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;

  if not found then
    raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED';
  end if;

  delete from public.relationship_link_arenas rla
  using public.relationship_links rl
  where rla.arena_id = v_source_arena.id
    and rl.id = rla.relationship_link_id
    and rl.link_type = 'parceria'
    and rl.ended_at is not null;

  if exists (
    select 1
    from public.relationship_link_arenas rla
    join public.relationship_links rl
      on rl.id = rla.relationship_link_id
    where rla.arena_id = v_source_arena.id
      and not (
        rl.link_type = 'parceria'
        and rl.ended_at is not null
      )
  ) then
    raise exception 'COMPETITION_SOURCE_ARENA_LOCKED';
  end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_source_arena.id
    and coalesce(action_type, '') <> 'Livre';
  if v_link.expires_at is not null and v_link.expires_at <= now() then
    raise exception 'RELATIONSHIP_LINK_EXPIRED';
  end if;


  if v_action_count = 0 then
    raise exception 'COMPETITION_SOURCE_ARENA_EMPTY';
  end if;

  -- O duelo deixou de ser vendido avulso: quem pagou foi o vinculo, uma vez so,
  -- quando ele nasceu. Cobrar aqui de novo era a cobranca-surpresa que o modelo
  -- novo existe para eliminar.
  select coalesce((coalesce(wallet, '{}'::jsonb)->>'gold')::integer, gold, 0)
    into v_new_gold from public.user_profiles where id = v_uid;

  v_opponent_id := case
    when v_link.mentor_id = v_uid then v_link.pupil_id
    else v_link.mentor_id
  end;

  insert into public.arenas (
    id,
    user_id,
    asset_id,
    name,
    description,
    icon,
    is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_uid,
    v_source_arena.asset_id,
    v_source_arena.name,
    coalesce(v_source_arena.description, ''),
    coalesce(nullif(v_source_arena.icon, ''), '🏆'),
    false
  )
  returning * into v_challenger_arena;

  insert into public.arenas (
    id,
    user_id,
    asset_id,
    name,
    description,
    icon,
    is_archived
  ) values (
    extensions.gen_random_uuid(),
    v_opponent_id,
    v_source_arena.asset_id,
    v_source_arena.name,
    coalesce(v_source_arena.description, ''),
    coalesce(nullif(v_source_arena.icon, ''), '🏆'),
    false
  )
  returning * into v_opponent_arena;

  insert into public.relationship_competition_challenges (
    relationship_link_id,
    source_arena_id,
    challenger_user_id,
    opponent_user_id,
    challenger_arena_id,
    opponent_arena_id,
    metadata
  ) values (
    v_link.id,
    v_source_arena.id,
    v_uid,
    v_opponent_id,
    v_challenger_arena.id,
    v_opponent_arena.id,
    jsonb_build_object(
      'source_name', v_source_arena.name,
      'source_icon', coalesce(v_source_arena.icon, '🏆'),
      'source_asset_id', v_source_arena.asset_id,
      'action_count', v_action_count,
      'planned_total', v_total_planned,
      'lock_mode', 'snapshot'
    )
  )
  returning * into v_challenge;

  for v_source_action in
    select *
    from public.actions
    where arena_id = v_source_arena.id
  loop
    insert into public.actions (
      id,
      user_id,
      arena_id,
      name,
      description,
      icon,
      duration,
      repetitions,
      action_type,
      difficulty,
      briefing,
      assets,
      pre_flight,
      context,
      origin_codex_id
    ) values (
      extensions.gen_random_uuid(),
      v_uid,
      v_challenger_arena.id,
      v_source_action.name,
      v_source_action.description,
      v_source_action.icon,
      v_source_action.duration,
      v_source_action.repetitions,
      v_source_action.action_type,
      v_source_action.difficulty,
      v_source_action.briefing,
      coalesce(v_source_action.assets, '[]'::jsonb),
      coalesce(v_source_action.pre_flight, '[]'::jsonb),
      coalesce(v_source_action.context, '{}'::jsonb),
      v_source_action.origin_codex_id
    );

    insert into public.actions (
      id,
      user_id,
      arena_id,
      name,
      description,
      icon,
      duration,
      repetitions,
      action_type,
      difficulty,
      briefing,
      assets,
      pre_flight,
      context,
      origin_codex_id
    ) values (
      extensions.gen_random_uuid(),
      v_opponent_id,
      v_opponent_arena.id,
      v_source_action.name,
      v_source_action.description,
      v_source_action.icon,
      v_source_action.duration,
      v_source_action.repetitions,
      v_source_action.action_type,
      v_source_action.difficulty,
      v_source_action.briefing,
      coalesce(v_source_action.assets, '[]'::jsonb),
      coalesce(v_source_action.pre_flight, '[]'::jsonb),
      coalesce(v_source_action.context, '{}'::jsonb),
      v_source_action.origin_codex_id
    );
  end loop;

  insert into public.relationship_link_arenas (
    relationship_link_id,
    arena_id,
    created_by_user_id,
    created_at,
    metadata
  ) values
  (
    v_link.id,
    v_challenger_arena.id,
    v_uid,
    now(),
    jsonb_build_object(
      'link_type', 'competicao',
      'challenge_id', v_challenge.id,
      'source_arena_id', v_source_arena.id,
      'owner_user_id', v_uid,
      'lock_mode', 'snapshot',
      'asset_id', v_challenger_arena.asset_id,
      'name', v_challenger_arena.name,
      'description', coalesce(v_challenger_arena.description, ''),
      'icon', v_challenger_arena.icon
    )
  ),
  (
    v_link.id,
    v_opponent_arena.id,
    v_opponent_id,
    now(),
    jsonb_build_object(
      'link_type', 'competicao',
      'challenge_id', v_challenge.id,
      'source_arena_id', v_source_arena.id,
      'owner_user_id', v_opponent_id,
      'lock_mode', 'snapshot',
      'asset_id', v_opponent_arena.asset_id,
      'name', v_opponent_arena.name,
      'description', coalesce(v_opponent_arena.description, ''),
      'icon', v_opponent_arena.icon
    )
  );

  select nickname
  into v_sender_nickname
  from public.user_profiles
  where id = v_uid;

  insert into public.notifications (
    id,
    user_id,
    type,
    content,
    read,
    created_at,
    metadata
  ) values (
    extensions.gen_random_uuid(),
    v_opponent_id,
    'arena_access',
    format('@%s forjou o duelo "%s". Sua arena espelhada ja esta pronta.', coalesce(v_sender_nickname, 'Seu rival'), v_source_arena.name),
    false,
    now(),
    jsonb_build_object(
      'relationshipLinkId', v_link.id,
      'challengeId', v_challenge.id,
      'linkType', 'competicao'
    )
  );

  select coalesce(
    jsonb_agg(to_jsonb(a) order by a.name),
    '[]'::jsonb
  )
  into v_challenger_actions
  from public.actions a
  where a.arena_id = v_challenger_arena.id;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'challenge', to_jsonb(v_challenge),
    'challenger_arena', to_jsonb(v_challenger_arena),
    'opponent_arena', to_jsonb(v_opponent_arena),
    'challenger_actions', v_challenger_actions
  );
end;
$$;

revoke all on function public._competition_forge_challenge(uuid, uuid, uuid) from public;

-- ---------------------------------------------------------------------------
-- 3. Propor
-- ---------------------------------------------------------------------------
-- Nada nasce na conta de ninguem aqui. So fica registrado que alguem quer.

create or replace function public.propose_competition_challenge(
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
  v_opponent_id uuid;
  v_action_count integer := 0;
  v_total_planned integer := 0;
  v_proposal public.relationship_competition_proposals%rowtype;
  v_nickname text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'competicao'
    and ended_at is null
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;

  if not found then raise exception 'ACTIVE_COMPETITION_LINK_REQUIRED'; end if;

  -- Vinculo vencido congela: continua visivel, mas nao aceita coisa nova.
  if v_link.expires_at is not null and v_link.expires_at <= now() then
    raise exception 'RELATIONSHIP_LINK_EXPIRED';
  end if;

  v_opponent_id := case when v_link.mentor_id = v_uid then v_link.pupil_id else v_link.mentor_id end;

  -- Um duelo por vez, contando tambem o que esta so proposto: duas propostas
  -- aceitas em sequencia dariam dois duelos abertos, que o indice unico de
  -- relationship_competition_challenges recusaria no segundo aceite — e ai quem
  -- levaria o erro seria quem aceitou, nao quem propos.
  if exists (
    select 1 from public.relationship_competition_challenges
    where relationship_link_id = v_link.id and completed_at is null
  ) then raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;

  if exists (
    select 1 from public.relationship_competition_proposals
    where relationship_link_id = v_link.id and status = 'pending'
  ) then raise exception 'COMPETITION_PROPOSAL_ALREADY_PENDING'; end if;

  select * into v_arena
  from public.arenas
  where id = p_source_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;

  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_arena.id and coalesce(action_type, '') <> 'Livre';

  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  insert into public.relationship_competition_proposals (
    relationship_link_id, proposer_user_id, opponent_user_id, source_arena_id, arena_snapshot
  ) values (
    v_link.id, v_uid, v_opponent_id, v_arena.id,
    jsonb_build_object(
      'name', v_arena.name,
      'icon', v_arena.icon,
      'actionCount', v_action_count,
      'plannedTotal', v_total_planned
    )
  ) returning * into v_proposal;

  select nickname into v_nickname from public.user_profiles where id = v_uid;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), v_opponent_id, 'arena_access',
    format('@%s quer duelar em "%s".', coalesce(v_nickname, 'Seu rival'), v_arena.name),
    false, now(),
    jsonb_build_object(
      'proposalId', v_proposal.id,
      'relationshipLinkId', v_link.id,
      'linkType', 'competicao'
    )
  );

  return jsonb_build_object('success', true, 'proposal', to_jsonb(v_proposal));
end;
$fn$;

revoke all on function public.propose_competition_challenge(uuid, uuid) from public;
grant execute on function public.propose_competition_challenge(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Aceitar ou recusar
-- ---------------------------------------------------------------------------
-- So aqui as arenas nascem, e nascem porque as duas pessoas quiseram.
-- Recusar nao devolve nada porque nada foi cobrado: quem pagou foi o vinculo.

create or replace function public.respond_competition_challenge(
  p_proposal_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_proposal public.relationship_competition_proposals%rowtype;
  v_link public.relationship_links%rowtype;
  v_result jsonb;
  v_challenge_id uuid;
  v_nickname text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(p_action, '') not in ('accept', 'decline', 'cancel') then
    raise exception 'COMPETITION_PROPOSAL_ACTION_INVALID';
  end if;

  select * into v_proposal
  from public.relationship_competition_proposals
  where id = p_proposal_id
  for update;

  if not found then raise exception 'COMPETITION_PROPOSAL_NOT_FOUND'; end if;
  if v_proposal.status <> 'pending' then raise exception 'COMPETITION_PROPOSAL_NOT_PENDING'; end if;

  -- Cancelar e de quem propos; aceitar e recusar sao de quem recebeu.
  if p_action = 'cancel' then
    if v_proposal.proposer_user_id <> v_uid then raise exception 'COMPETITION_PROPOSAL_PERMISSION_DENIED'; end if;
    update public.relationship_competition_proposals
    set status = 'cancelled', responded_at = now()
    where id = v_proposal.id;
    return jsonb_build_object('success', true, 'status', 'cancelled');
  end if;

  if v_proposal.opponent_user_id <> v_uid then
    raise exception 'COMPETITION_PROPOSAL_PERMISSION_DENIED';
  end if;

  if p_action = 'decline' then
    update public.relationship_competition_proposals
    set status = 'declined', responded_at = now()
    where id = v_proposal.id;

    select nickname into v_nickname from public.user_profiles where id = v_uid;

    insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
    values (
      extensions.gen_random_uuid(), v_proposal.proposer_user_id, 'arena_access',
      format('@%s recusou o duelo.', coalesce(v_nickname, 'Seu rival')),
      false, now(),
      jsonb_build_object('relationshipLinkId', v_proposal.relationship_link_id, 'linkType', 'competicao')
    );

    return jsonb_build_object('success', true, 'status', 'declined');
  end if;

  select * into v_link
  from public.relationship_links
  where id = v_proposal.relationship_link_id
    and ended_at is null
  for update;

  if not found then raise exception 'ACTIVE_COMPETITION_LINK_REQUIRED'; end if;

  -- Proposta de ontem nao ressuscita vinculo vencido.
  if v_link.expires_at is not null and v_link.expires_at <= now() then
    raise exception 'RELATIONSHIP_LINK_EXPIRED';
  end if;

  v_result := public._competition_forge_challenge(
    v_proposal.relationship_link_id,
    v_proposal.source_arena_id,
    v_proposal.proposer_user_id
  );

  v_challenge_id := ((v_result -> 'challenge') ->> 'id')::uuid;

  update public.relationship_competition_proposals
  set status = 'accepted', responded_at = now(), challenge_id = v_challenge_id
  where id = v_proposal.id;

  return jsonb_build_object('success', true, 'status', 'accepted', 'challenge', v_result);
end;
$fn$;

revoke all on function public.respond_competition_challenge(uuid, text) from public;
grant execute on function public.respond_competition_challenge(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. A porta antiga fecha
-- ---------------------------------------------------------------------------
-- create_competition_challenge criava as duas arenas direto. Deixa-la viva seria
-- manter um caminho que escreve na conta do outro sem perguntar — exatamente o
-- que esta migracao existe para acabar.

create or replace function public.create_competition_challenge(
  p_relationship_link_id uuid,
  p_source_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Redireciona em vez de falhar: cliente antigo em cache continua funcionando,
  -- so que agora propondo em vez de impondo.
  return public.propose_competition_challenge(p_relationship_link_id, p_source_arena_id);
end;
$fn$;

revoke all on function public.create_competition_challenge(uuid, uuid) from public;
grant execute on function public.create_competition_challenge(uuid, uuid) to authenticated;

commit;
