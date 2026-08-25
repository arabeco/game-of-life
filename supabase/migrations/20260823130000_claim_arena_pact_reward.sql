-- Resgate do pacto de arena.
--
-- `claim_glyph_progress_gold` tem lista fechada de recompensas e levanta
-- UNKNOWN_PROGRESS_REWARD para qualquer id fora dela. Isso e proposital: o
-- servidor confere a elegibilidade e nunca confia no cliente. Pacto tem id
-- dinamico (molde x arena x data), entao precisa da propria funcao — que
-- mantem a mesma postura, refazendo a contagem aqui em vez de aceitar a do app.
--
-- O pacto e lido das colunas do proprio perfil, entao nao ha como pedir premio
-- de um pacto que nunca foi aceito.
--
-- ATENCAO: os valores de ouro abaixo espelham ARENA_PACT_REWARDS em
-- utils/arenaPacts.ts. Mudar la exige mudar aqui.

create or replace function public.claim_arena_pact_reward()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_arena_id uuid;
  v_kind text;
  v_difficulty text;
  v_goal integer;
  v_started_on date;
  v_reward integer := 0;
  v_eligible boolean := false;
  v_marker text;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select arena_pact_arena_id, arena_pact_kind, arena_pact_difficulty, arena_pact_goal, arena_pact_started_on
    into v_arena_id, v_kind, v_difficulty, v_goal, v_started_on
  from public.user_profiles
  where id = v_user_id;

  if v_arena_id is null or v_kind is null then
    raise exception 'NO_ACTIVE_PACT';
  end if;

  -- A arena tem de continuar sendo da pessoa. Sem isso, trocar o id na coluna
  -- daria premio por arena alheia.
  if not exists (
    select 1 from public.arenas where id = v_arena_id and user_id = v_user_id
  ) then
    raise exception 'PACT_ARENA_NOT_FOUND';
  end if;

  v_reward := case v_difficulty
    when 'leve' then 2
    when 'media' then 5
    when 'alta' then 10
    else 0
  end;

  if v_reward <= 0 then
    raise exception 'UNKNOWN_PACT_DIFFICULTY';
  end if;

  if v_kind = 'constancia' then
    -- Dias distintos, nao numero de acoes: cinco entregas num dia valem um dia.
    -- Nada anterior ao aceite conta.
    select count(distinct nullif(st.date::text, '')::date) >= v_goal
      into v_eligible
    from public.scheduled_tasks st
    join public.actions a
      on a.id::text = st.action_id::text
     and a.user_id = v_user_id
    where st.user_id = v_user_id
      and a.arena_id = v_arena_id
      and coalesce(st.completed, false) = true
      and nullif(st.date::text, '')::date >= v_started_on;

  elsif v_kind = 'retomada' then
    select exists (
      select 1
      from public.scheduled_tasks st
      join public.actions a
        on a.id::text = st.action_id::text
       and a.user_id = v_user_id
      where st.user_id = v_user_id
        and a.arena_id = v_arena_id
        and coalesce(st.completed, false) = true
        and nullif(st.date::text, '')::date >= v_started_on
    ) into v_eligible;

  elsif v_kind = 'conclusao' then
    -- Mesma definicao de "arena fechada" usada em claim_glyph_progress_gold:
    -- nenhuma acao da arena abaixo das proprias repeticoes. Acao Livre fica de
    -- fora da conta, como no resto do app.
    select not exists (
      select 1
      from public.actions a
      where a.arena_id = v_arena_id
        and a.user_id = v_user_id
        and coalesce(a.action_type, '') <> 'Livre'
        and (
          select count(*)
          from public.scheduled_tasks st
          where st.user_id = v_user_id
            and st.action_id::text = a.id::text
            and coalesce(st.completed, false) = true
        ) < greatest(1, coalesce(a.repetitions, 1))
    ) and exists (
      select 1
      from public.actions a
      where a.arena_id = v_arena_id
        and a.user_id = v_user_id
        and coalesce(a.action_type, '') <> 'Livre'
    ) into v_eligible;

  else
    raise exception 'UNKNOWN_PACT_KIND';
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'PACT_NOT_COMPLETE';
  end if;

  -- A identidade do pacto e molde + arena + data de aceite. A mesma arena pode
  -- receber pacto de novo depois, e isso tem de contar como recompensa nova.
  v_marker := v_arena_id::text || ':' || v_kind || ':' || to_char(v_started_on, 'YYYY-MM-DD');

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':arena_pact:' || v_marker, 0));

  if public._starter_reward_has_purchase_marker(v_user_id, 'arena_pact', v_marker) then
    select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
      into v_new_gold
    from public.user_profiles
    where id = v_user_id;

    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'gold_granted', 0,
      'new_gold', v_new_gold
    );
  end if;

  v_new_gold := public._starter_reward_credit_gold(
    v_user_id,
    v_reward,
    'arena_pact',
    'Recompensa de pacto de arena',
    jsonb_build_object('arena_id', v_arena_id, 'kind', v_kind, 'difficulty', v_difficulty)
  );
  perform public._starter_reward_mark_purchase(v_user_id, 'arena_pact', v_marker, false);

  -- Fecha o pacto na mesma transacao do pagamento: o slot volta a ficar livre
  -- e a mesma linha nao pode pagar duas vezes.
  update public.user_profiles
     set arena_pact_arena_id = null,
         arena_pact_kind = null,
         arena_pact_difficulty = null,
         arena_pact_goal = null,
         arena_pact_started_on = null
   where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'gold_granted', v_reward,
    'new_gold', v_new_gold,
    'kind', v_kind,
    'difficulty', v_difficulty
  );
end;
$$;

revoke all on function public.claim_arena_pact_reward() from public;
grant execute on function public.claim_arena_pact_reward() to authenticated;
