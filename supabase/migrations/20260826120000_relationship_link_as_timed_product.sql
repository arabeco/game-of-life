begin;

-- O vinculo vira o produto. Antes era o contrario.
--
-- O modelo antigo cobrava por ACAO dentro de um vinculo gratuito: 50 para expor
-- uma arena na parceria, 50 por duelo, 100 para forjar campanha. Isso produziu
-- duas coisas ruins ao mesmo tempo. A tela de convite continuou explicando um
-- preco que fora zerado em agosto — chegava a imprimir "cobra 0 no envio, o
-- reembolso acontece se a pessoa recusar" — enquanto a cobranca de verdade
-- acontecia depois, num momento sobre o qual nada avisava.
--
-- Agora se paga uma vez, ao ENVIAR o convite, e o que se compra tem duas
-- medidas:
--   PRAZO      — um mes, renovavel pela metade do preco;
--   VAGAS      — quantas arenas cabem por participante.
-- Expor arena e forjar duelo passam a vir inclusos.
--
-- No envio e nao no aceite de proposito: cobrar no aceite deixaria a cobranca
-- falhar na pior hora possivel — o remetente gasta o saldo em outra coisa
-- enquanto espera, o outro aceita, e nao ha como pagar. Debitando no envio, a
-- devolucao automatica de _relationship_refund_pending_invite cobre recusa,
-- revogacao e expiracao. Nenhuma tela precisa explicar isso: o ouro volta.

do $$
declare
  v_missing text[] := array[]::text[];
begin
  if to_regclass('public.relationship_links') is null then
    v_missing := array_append(v_missing, 'public.relationship_links');
  end if;
  if to_regclass('public.relationship_link_invites') is null then
    v_missing := array_append(v_missing, 'public.relationship_link_invites');
  end if;
  if to_regclass('public.relationship_link_arenas') is null then
    v_missing := array_append(v_missing, 'public.relationship_link_arenas');
  end if;
  if to_regprocedure('public._codex_debit_gold(uuid,integer,text,text,jsonb)') is null then
    v_missing := array_append(v_missing, 'public._codex_debit_gold');
  end if;
  if cardinality(v_missing) > 0 then
    raise exception 'RELATIONSHIP_TIMED_LINK_MISSING: %', array_to_string(v_missing, ', ');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. As duas medidas do produto
-- ---------------------------------------------------------------------------

alter table public.relationship_links
  add column if not exists expires_at timestamptz,
  add column if not exists arena_slots integer not null default 1,
  add column if not exists renewed_at timestamptz,
  add column if not exists renewal_count integer not null default 0;

-- Vinculo que ja existia nao pode morrer no instante da migracao: ganha um mes
-- a partir de agora, nao a partir da criacao.
update public.relationship_links
set expires_at = now() + interval '1 month'
where expires_at is null
  and ended_at is null;

-- Vinculo ja encerrado recebe um prazo coerente com o encerramento, so para a
-- coluna nao ficar nula e confundir leitura de historico.
update public.relationship_links
set expires_at = ended_at
where expires_at is null
  and ended_at is not null;

create index if not exists relationship_links_expires_at_idx
  on public.relationship_links (expires_at)
  where ended_at is null;

-- ---------------------------------------------------------------------------
-- 2. A tabela de precos, num lugar so
-- ---------------------------------------------------------------------------
-- ATENCAO: os mesmos numeros estao em constants/relationshipLinks.ts, que e
-- quem EXIBE o preco. Mudar um exige mudar o outro; ha teste que compara os
-- dois arquivos.

create or replace function public.relationship_link_price(p_link_type text, p_arena_slots integer default 1)
returns integer
language plpgsql
immutable
as $$
declare
  v_base integer;
  v_extra integer;
begin
  v_base := case p_link_type
    when 'mentoria' then 100
    when 'parceria' then 50
    when 'competicao' then 50
    else 50
  end;

  -- So a mentoria escala por vaga, e a vaga que ela vende e a de ENTREGAR, nao
  -- a de observar: olhar mais uma arena nao custa trabalho a ninguem, produzir
  -- uma custa. Parceria e competicao tem forma fixa (uma por lado e o par
  -- espelhado), entao vaga extra nao significa nada nelas.
  v_extra := 0;
  if p_link_type = 'mentoria' then
    v_extra := greatest(0, coalesce(p_arena_slots, 1) - 1) * 50;
  end if;

  return v_base + v_extra;
end;
$$;

create or replace function public.relationship_link_default_slots(p_link_type text)
returns integer
language sql
immutable
as $$
  select case p_link_type
    when 'competicao' then 1  -- o duelo e o par espelhado; nao ha vaga avulsa
    when 'parceria' then 1    -- uma por lado, ja garantido por indice unico
    else 1
  end;
$$;

revoke all on function public.relationship_link_price(text, integer) from public;
grant execute on function public.relationship_link_price(text, integer) to authenticated;
revoke all on function public.relationship_link_default_slots(text) from public;
grant execute on function public.relationship_link_default_slots(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Quem esta dentro, e ate quando
-- ---------------------------------------------------------------------------

create or replace function public.relationship_link_is_live(p_link public.relationship_links)
returns boolean
language sql
immutable
as $$
  select p_link.ended_at is null
     and (p_link.expires_at is null or p_link.expires_at > now());
$$;

revoke all on function public.relationship_link_is_live(public.relationship_links) from public;
grant execute on function public.relationship_link_is_live(public.relationship_links) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Renovar
-- ---------------------------------------------------------------------------
-- Metade do preco de criacao, e QUALQUER UM DOS DOIS pode renovar. Amarrar a
-- renovacao a quem criou faria o vinculo morrer junto com o interesse de uma
-- pessoa so, mesmo com a outra querendo continuar.
--
-- O prazo novo parte de max(agora, vencimento): renovar cedo nao perde dia, e
-- renovar depois de vencido nao paga pelo tempo em que esteve congelado.

create or replace function public.renew_relationship_link(p_relationship_link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_price integer;
  v_new_gold integer;
  v_base timestamptz;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;

  if not found then
    raise exception 'RELATIONSHIP_LINK_NOT_FOUND';
  end if;

  -- Encerrado a mao e decisao, nao vencimento: nao se renova o que alguem
  -- fechou de proposito.
  if v_link.ended_at is not null then
    raise exception 'RELATIONSHIP_LINK_ENDED';
  end if;

  v_price := greatest(1, public.relationship_link_price(v_link.link_type, v_link.arena_slots) / 2);

  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_price,
    'relationship_link_renewal',
    format('Renovacao de %s', v_link.link_type),
    jsonb_build_object(
      'relationship_link_id', v_link.id,
      'link_type', v_link.link_type,
      'arena_slots', v_link.arena_slots
    )
  );

  v_base := greatest(now(), coalesce(v_link.expires_at, now()));

  update public.relationship_links
  set expires_at = v_base + interval '1 month',
      renewed_at = now(),
      renewal_count = coalesce(renewal_count, 0) + 1,
      updated_at = now()
  where id = v_link.id
  returning * into v_link;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'price_gold', v_price,
    'link', to_jsonb(v_link)
  );
end;
$$;

revoke all on function public.renew_relationship_link(uuid) from public;
grant execute on function public.renew_relationship_link(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Expor arena passa a ser de graca, e passa a ter teto
-- ---------------------------------------------------------------------------
-- O ouro saiu daqui e foi para a criacao do vinculo. O que sobra e o limite de
-- vagas, que agora e a coisa que o usuario comprou.

create or replace function public.share_relationship_arena(
  p_relationship_link_id uuid,
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_arena public.arenas%rowtype;
  v_existing_count integer;
  v_linked public.relationship_link_arenas%rowtype;
  v_changed boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and (mentor_id = v_uid or pupil_id = v_uid)
    and ended_at is null
  for update;

  if not found then
    raise exception 'RELATIONSHIP_LINK_NOT_FOUND';
  end if;

  -- Vinculo vencido congela: continua visivel, mas nao aceita coisa nova. Sem
  -- isto o prazo nao significaria nada.
  if v_link.expires_at is not null and v_link.expires_at <= now() then
    raise exception 'RELATIONSHIP_LINK_EXPIRED';
  end if;

  select * into v_arena
  from public.arenas
  where id = p_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;

  if not found then
    raise exception 'RELATIONSHIP_OWN_ARENA_REQUIRED';
  end if;

  select count(*) into v_existing_count
  from public.relationship_link_arenas
  where relationship_link_id = v_link.id
    and created_by_user_id = v_uid
    and arena_id <> p_arena_id;

  -- As vagas sao POR PARTICIPANTE, nunca no total: com teto compartilhado uma
  -- pessoa consumiria as duas e a outra ficaria sem lugar nenhum.
  if v_existing_count >= coalesce(v_link.arena_slots, 1) then
    raise exception 'RELATIONSHIP_ARENA_SLOTS_FULL';
  end if;

  select * into v_linked
  from public.relationship_link_arenas
  where relationship_link_id = v_link.id
    and arena_id = p_arena_id
    and created_by_user_id = v_uid;

  if not found then
    insert into public.relationship_link_arenas (
      relationship_link_id, arena_id, created_by_user_id, metadata
    ) values (
      v_link.id, p_arena_id, v_uid,
      jsonb_build_object('link_type', v_link.link_type)
    )
    returning * into v_linked;
    v_changed := true;
  end if;

  return jsonb_build_object(
    'success', true,
    'changed', v_changed,
    'price_gold', 0,
    'linked_arena', to_jsonb(v_linked),
    'arena', to_jsonb(v_arena)
  );
end;
$$;

revoke all on function public.share_relationship_arena(uuid, uuid) from public;
grant execute on function public.share_relationship_arena(uuid, uuid) to authenticated;

-- Quantas vagas o convite esta comprando. Fica no convite porque o preco e
-- cobrado de quem enviou, no momento do aceite, e precisa ser o mesmo numero
-- que ele viu na tela quando decidiu enviar.
alter table public.relationship_link_invites
  add column if not exists arena_slots integer not null default 1;

-- ---------------------------------------------------------------------------
-- 6. Aceitar cria o vinculo, com prazo
-- ---------------------------------------------------------------------------

create or replace function public.respond_relationship_link_invite(
  p_invite_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_invite public.relationship_link_invites%rowtype;
  v_link public.relationship_links%rowtype;
  v_source_arena public.arenas%rowtype;
  v_new_gold integer := 0;
  v_competition jsonb := null;
  v_duration_days integer := 7;
  v_max_days integer;
  v_action_count integer := 0;
  v_total_planned integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(p_action, '') not in ('accept', 'decline', 'revoke') then raise exception 'RELATIONSHIP_INVITE_ACTION_INVALID'; end if;

  select * into v_invite from public.relationship_link_invites where id = p_invite_id for update;
  if not found then raise exception 'RELATIONSHIP_INVITE_NOT_FOUND'; end if;
  if v_invite.status <> 'pending' then raise exception 'RELATIONSHIP_INVITE_NOT_PENDING'; end if;

  if p_action = 'accept' then
    if v_invite.recipient_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
    if v_invite.expires_at is not null and v_invite.expires_at <= now() then raise exception 'RELATIONSHIP_INVITE_EXPIRED'; end if;

    perform pg_advisory_xact_lock(hashtextextended(concat_ws(':', v_invite.link_type,
      least(v_invite.sender_id::text, v_invite.recipient_id::text),
      greatest(v_invite.sender_id::text, v_invite.recipient_id::text)), 0));

    select * into v_link
    from public.relationship_links rl
    where rl.link_type = v_invite.link_type and rl.ended_at is null
      and ((rl.mentor_id = v_invite.sender_id and rl.pupil_id = v_invite.recipient_id)
        or (rl.mentor_id = v_invite.recipient_id and rl.pupil_id = v_invite.sender_id))
    limit 1
    for update;

    if found and v_invite.link_type <> 'competicao' then raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE'; end if;

    -- Aqui e onde o dinheiro troca de mao, uma vez so, e onde o prazo comeca.
    if not found then
      begin
        v_link := public._relationship_start_link(v_invite, v_invite.arena_slots);
      exception
        when others then
          if sqlerrm like '%Saldo insuficiente%' then raise exception 'RELATIONSHIP_LINK_GOLD_REQUIRED'; end if;
          raise;
      end;
    end if;

    if v_invite.link_type = 'competicao' then
      if v_invite.arena_id is null then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

      v_duration_days := greatest(1, least(30, coalesce((v_invite.arena_snapshot ->> 'durationDays')::integer, 7)));

      -- O duelo nao pode terminar depois do vinculo. Sem este teto o vinculo
      -- venceria com duelo em voo, e ai nao ha resposta boa: anular pune quem
      -- estava jogando, esticar faz o prazo nao significar nada.
      v_max_days := greatest(1, ceil(extract(epoch from (v_link.expires_at - now())) / 86400.0)::integer);
      v_duration_days := least(v_duration_days, v_max_days);

      if exists (
        select 1
        from public.relationship_competition_challenges challenge
        where challenge.completed_at is null
          and ((challenge.challenger_user_id = v_invite.sender_id and challenge.opponent_user_id = v_invite.recipient_id)
            or (challenge.challenger_user_id = v_invite.recipient_id and challenge.opponent_user_id = v_invite.sender_id))
      ) then raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;

      if exists (
        select 1
        from public.relationship_competition_challenges challenge
        where challenge.reward_granted_at > now() - interval '7 days'
          and ((challenge.challenger_user_id = v_invite.sender_id and challenge.opponent_user_id = v_invite.recipient_id)
            or (challenge.challenger_user_id = v_invite.recipient_id and challenge.opponent_user_id = v_invite.sender_id))
      ) then raise exception 'COMPETITION_REWARD_COOLDOWN'; end if;

      select * into v_source_arena
      from public.arenas
      where id = v_invite.arena_id
        and user_id = v_invite.sender_id
        and coalesce(is_archived, false) = false
      for update;
      if not found then raise exception 'COMPETITION_SOURCE_CHANGED'; end if;

      select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
      into v_action_count, v_total_planned
      from public.actions
      where arena_id = v_source_arena.id and coalesce(action_type, '') <> 'Livre';

      if v_source_arena.name is distinct from (v_invite.arena_snapshot ->> 'name')
        or v_action_count is distinct from coalesce((v_invite.arena_snapshot ->> 'actionCount')::integer, -1)
        or v_total_planned is distinct from coalesce((v_invite.arena_snapshot ->> 'plannedTotal')::integer, -1)
      then
        raise exception 'COMPETITION_SOURCE_CHANGED';
      end if;

      -- Nao ha mais cobranca avulsa de duelo: o vinculo ja foi pago acima.
      v_competition := public._create_competition_snapshot_from_invite(
        v_link.id, v_invite.arena_id, v_invite.sender_id, v_invite.recipient_id, v_duration_days
      );
    end if;

    update public.relationship_link_invites
    set status = 'accepted', responded_at = now()
    where id = v_invite.id;

    return jsonb_build_object(
      'success', true, 'link', to_jsonb(v_link), 'competition', v_competition,
      'challenger_new_gold', v_new_gold,
      'summary', public._relationship_build_capacity_summary(v_uid)
    );
  end if;

  if p_action = 'decline' then
    if v_invite.recipient_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
    v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'declined');
    update public.relationship_link_invites set status = 'declined', responded_at = now() where id = v_invite.id;
    return jsonb_build_object('success', true, 'new_gold', v_new_gold,
      'summary', public._relationship_build_capacity_summary(v_invite.sender_id));
  end if;

  if v_invite.sender_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
  v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'revoked');
  update public.relationship_link_invites set status = 'revoked', responded_at = now() where id = v_invite.id;
  return jsonb_build_object('success', true, 'new_gold', v_new_gold,
    'summary', public._relationship_build_capacity_summary(v_uid));
end;
$fn$;

revoke all on function public.respond_relationship_link_invite(uuid, text) from public;
grant execute on function public.respond_relationship_link_invite(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Forjar duelo dentro do vinculo deixa de cobrar
-- ---------------------------------------------------------------------------
-- Recriada a partir da versao de 20260330113000, com duas mudancas: o debito de
-- 50 sai (o vinculo ja foi pago) e vinculo vencido passa a recusar duelo novo.

create or replace function public.create_competition_challenge(
  p_relationship_link_id uuid,
  p_source_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
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
    raise exception 'AUTH_REQUIRED';
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

revoke all on function public.create_competition_challenge(uuid, uuid) from public;
grant execute on function public.create_competition_challenge(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. A cobranca fica no ENVIO, com devolucao automatica
-- ---------------------------------------------------------------------------
-- Cobrar no aceite tinha um furo feio: quem enviasse com pouco ouro poderia
-- gastar o saldo em outra coisa antes de o outro responder, e a cobranca falharia
-- exatamente no instante do aceite — a pior hora possivel, com as duas pessoas
-- ja contando com o vinculo.
--
-- Entao volta para onde estava: debita de quem envia, e devolve sozinho se o
-- outro recusar, se o remetente revogar ou se o convite expirar. Isso ja existe
-- em _relationship_refund_pending_invite; o que faltava era o preco nao ser mais
-- zero. Nenhuma tela precisa explicar a devolucao: o ouro simplesmente volta.

create or replace function public._relationship_get_invite_cost(p_link_type text)
returns integer
language plpgsql
immutable
as $fn$
begin
  if coalesce(p_link_type, '') not in ('mentoria', 'parceria', 'competicao') then
    raise exception 'RELATIONSHIP_LINK_TYPE_INVALID';
  end if;
  return public.relationship_link_price(p_link_type, 1);
end;
$fn$;

-- O aceite deixa de mexer em ouro: quem pagou ja pagou no envio.
create or replace function public._relationship_start_link(
  p_invite public.relationship_link_invites,
  p_arena_slots integer default null
)
returns public.relationship_links
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_link public.relationship_links%rowtype;
  v_slots integer;
begin
  v_slots := greatest(1, coalesce(p_arena_slots, public.relationship_link_default_slots(p_invite.link_type)));

  insert into public.relationship_links (
    mentor_id, pupil_id, link_type, arena_id, arena_snapshot,
    satisfaction_level, arena_slots, expires_at
  ) values (
    p_invite.sender_id, p_invite.recipient_id, p_invite.link_type,
    p_invite.arena_id, p_invite.arena_snapshot,
    50, v_slots, now() + interval '1 month'
  ) returning * into v_link;

  return v_link;
end;
$fn$;

revoke all on function public._relationship_start_link(public.relationship_link_invites, integer) from public;

-- E o convite de competicao volta a debitar no envio, como os outros dois.
create or replace function public.create_competition_invite(
  p_recipient_id uuid,
  p_source_arena_id uuid,
  p_duration_days integer default 7
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_arena public.arenas%rowtype;
  v_invite public.relationship_link_invites%rowtype;
  v_action_count integer;
  v_total_planned integer;
  v_duration integer;
  v_cost integer;
  v_new_gold integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then raise exception 'INVALID_RECIPIENT'; end if;

  select * into v_profile from public.user_profiles where id = v_uid;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  select * into v_arena from public.arenas
  where id = p_source_arena_id and user_id = v_uid and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_arena.id and coalesce(action_type, '') <> 'Livre';

  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  if exists (
    select 1 from public.relationship_links
    where link_type = 'competicao' and ended_at is null
      and ((mentor_id = v_uid and pupil_id = p_recipient_id)
        or (mentor_id = p_recipient_id and pupil_id = v_uid))
  ) then raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE'; end if;

  if exists (
    select 1 from public.relationship_link_invites
    where link_type = 'competicao' and status = 'pending'
      and ((sender_id = v_uid and recipient_id = p_recipient_id)
        or (sender_id = p_recipient_id and recipient_id = v_uid))
  ) then raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING'; end if;

  v_duration := greatest(1, least(30, coalesce(p_duration_days, 7)));

  v_cost := public._relationship_get_invite_cost('competicao');
  v_new_gold := public._codex_debit_gold(
    v_uid, v_cost, 'relationship_invite',
    format('Vinculo de competicao: %s', trim(v_arena.name)),
    jsonb_build_object('recipient_id', p_recipient_id, 'link_type', 'competicao',
      'arena_id', v_arena.id, 'cost_gold', v_cost)
  );

  insert into public.relationship_link_invites (
    sender_id, recipient_id, link_type, arena_id, arena_snapshot, status,
    cost_gold, refunded_at, expires_at, arena_slots
  ) values (
    v_uid, p_recipient_id, 'competicao', v_arena.id,
    jsonb_build_object(
      'name', v_arena.name, 'icon', v_arena.icon,
      'actionCount', v_action_count, 'plannedTotal', v_total_planned,
      'durationDays', v_duration
    ),
    'pending', v_cost, null, now() + interval '7 days', 1
  ) returning * into v_invite;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), p_recipient_id, 'arena_access',
    format('@%s desafiou voce em "%s".', coalesce(v_profile.nickname, 'Um aliado'), v_arena.name),
    false, now(),
    jsonb_build_object('inviteId', v_invite.id, 'senderId', v_uid, 'linkType', 'competicao', 'arenaId', v_arena.id)
  );

  return jsonb_build_object('success', true, 'new_gold', v_new_gold, 'invite', to_jsonb(v_invite));
end;
$fn$;

revoke all on function public.create_competition_invite(uuid, uuid, integer) from public;
grant execute on function public.create_competition_invite(uuid, uuid, integer) to authenticated;

commit;
