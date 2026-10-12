-- O CONVITE E A MISSAO DOS DIAS: 5 DIAS, UMA REGRA SO (12/10/2026).
--
-- A missao inicial de abrir o app passa de 7 para 5 dias ("Cinco dias no
-- Glyph", continua pagando 10 de ouro), e o convite usa a mesma regra: o amigo
-- conta para quem convidou quando completa essa missao. Ideia do Afonso: "quando
-- a conta X completa essa missao, ja valida pra mim".
--
-- A 20261011120000 fez o amigo contar no instante em que usava o codigo. Isso
-- abria farm: dez contas novas com o proprio codigo pagavam bau Comum, bau Raro
-- e 25 de ouro. Decidido com o Afonso: o amigo conta para os premios de quem
-- convidou depois de abrir o app em 5 dias diferentes (public.dias_no_app, a
-- mesma tabela da missao dos sete dias). Os premios continuam em 1, 5 e 10.
--
-- O sino muda junto:
--   * quando o amigo usa o codigo: avisa que ele vai contar depois dos 5 dias;
--   * quando o amigo completa o 5o dia: avisa quantos ja contam e o premio que
--     ficou disponivel.
-- Premios ja recebidos continuam recebidos (a marca invite_milestone nao muda).

BEGIN;

create or replace function public.meus_convites()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_codigo text;
  v_entraram integer;
  v_completaram integer;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_codigo := public.meu_codigo_de_convite();

  select count(*)::integer into v_entraram
  from public.convites_usados where dono = v_user_id;

  select count(*)::integer into v_completaram
  from public.convites_usados cu
  where cu.dono = v_user_id
    and (select count(*) from public.dias_no_app d where d.user_id = cu.convidado) >= 5;

  return jsonb_build_object(
    'codigo', v_codigo,
    'entraram', v_entraram,
    'completaram', v_completaram,
    'recebeu_1', public._starter_reward_has_purchase_marker(v_user_id, 'invite_milestone', '1'),
    'recebeu_5', public._starter_reward_has_purchase_marker(v_user_id, 'invite_milestone', '5'),
    'recebeu_10', public._starter_reward_has_purchase_marker(v_user_id, 'invite_milestone', '10')
  );
end;
$$;
revoke all on function public.meus_convites() from public;
grant execute on function public.meus_convites() to authenticated;

create or replace function public.receber_premio_de_convite(p_marco integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_completaram integer;
  v_novo_ouro integer;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_marco is null or p_marco not in (1, 5, 10) then
    raise exception 'MARCO_INVALIDO';
  end if;

  select count(*)::integer into v_completaram
  from public.convites_usados cu
  where cu.dono = v_user_id
    and (select count(*) from public.dias_no_app d where d.user_id = cu.convidado) >= 5;
  if v_completaram < p_marco then
    raise exception 'MARCO_NAO_ALCANCADO';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':convite:' || p_marco, 0));
  if public._starter_reward_has_purchase_marker(v_user_id, 'invite_milestone', p_marco::text) then
    return jsonb_build_object('success', true, 'already_claimed', true, 'marco', p_marco);
  end if;

  if p_marco = 1 then
    perform public.grant_chest(v_user_id, 'Comum');
  elsif p_marco = 5 then
    perform public.grant_chest(v_user_id, 'Raro');
  else
    v_novo_ouro := public._starter_reward_credit_gold(
      v_user_id, 25, 'invite', 'Convites: dez amigos', jsonb_build_object('marco', p_marco)
    );
  end if;
  perform public._starter_reward_mark_purchase(v_user_id, 'invite_milestone', p_marco::text, false);

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'marco', p_marco,
    'chest_type', case when p_marco = 1 then 'Comum' when p_marco = 5 then 'Raro' end,
    'gold_granted', case when p_marco = 10 then 25 else 0 end,
    'new_gold', v_novo_ouro
  );
end;
$$;
revoke all on function public.receber_premio_de_convite(integer) from public;
grant execute on function public.receber_premio_de_convite(integer) to authenticated;

-- O sino quando o amigo USA o codigo: ainda nao ha premio, so a promessa.
create or replace function public.avisar_novo_convite()
returns trigger language plpgsql security definer set search_path = public, auth
as $$
begin
  insert into public.notifications(id, user_id, type, content, read, created_at, metadata)
  values (gen_random_uuid(), new.dono, 'system',
    'Um amigo usou seu convite! Ele conta para os seus prêmios quando abrir o Glyph em 5 dias diferentes.',
    false, now(), jsonb_build_object('source', 'friend_invite', 'stage', 'used'));
  return new;
end;
$$;
revoke all on function public.avisar_novo_convite() from public, anon, authenticated;

-- O sino quando o amigo COMPLETA o 5o dia: agora sim ha premio.
create or replace function public.avisar_amigo_completou_5_dias()
returns trigger language plpgsql security definer set search_path = public, auth
as $$
declare
  v_dono uuid;
  v_dias integer;
  v_total integer;
  v_premios text;
begin
  select dono into v_dono from public.convites_usados where convidado = new.user_id;
  if v_dono is null then
    return new;
  end if;

  select count(*) into v_dias from public.dias_no_app where user_id = new.user_id;
  if v_dias <> 5 then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_dono::text || ':convites-aviso', 0));
  select count(*) into v_total
  from public.convites_usados cu
  where cu.dono = v_dono
    and (select count(*) from public.dias_no_app d where d.user_id = cu.convidado) >= 5;

  select string_agg(premio, ', ' order by marco) into v_premios
  from (values (1, 'baú Comum'), (5, 'baú Raro'), (10, '25 de ouro')) as marcos(marco, premio)
  where marco <= v_total
    and not public._starter_reward_has_purchase_marker(v_dono, 'invite_milestone', marco::text);

  insert into public.notifications(id, user_id, type, content, read, created_at, metadata)
  values (gen_random_uuid(), v_dono, 'system',
    format('Um amigo que você convidou abriu o Glyph em 5 dias! Agora %s %s para os seus prêmios. ',
      v_total, case when v_total = 1 then 'conta' else 'contam' end)
      || case when v_premios is not null then 'Prêmio disponível: ' || v_premios || '. ' else '' end
      || 'Veja em Ajustes > Resgatar código, nas bolinhas de convites.',
    false, now(), jsonb_build_object('source', 'friend_invite', 'stage', 'five_days', 'count', v_total));
  return new;
end;
$$;
revoke all on function public.avisar_amigo_completou_5_dias() from public, anon, authenticated;
drop trigger if exists avisar_amigo_completou_5_dias on public.dias_no_app;
create trigger avisar_amigo_completou_5_dias after insert on public.dias_no_app
for each row execute function public.avisar_amigo_completou_5_dias();

-- A missao dos dias paga com 5 (era 7). Copia fiel da funcao de
-- 20261010120000_sete_dias_no_app.sql, so com o 7 trocado por 5.
create or replace function public.claim_glyph_progress_gold(p_reward_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward integer := 0;
  v_eligible boolean := false;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- A missao dos sete dias e INICIAL: roda para todo mundo e nao se aceita.
  if p_reward_id <> 'system-seven-days-in-app' and not exists (
    select 1
    from public.user_profiles
    where id = v_user_id
      and p_reward_id = any(coalesce(accepted_system_challenges, '{}'::text[]))
  ) then
    raise exception 'MISSION_NOT_ACCEPTED';
  end if;

  if p_reward_id = 'system-five-day-proof-streak' and not exists(
    select 1 from public.user_profiles where id=v_user_id and legacy_five_day_eligible
  ) then raise exception 'MISSION_RETIRED'; end if;

  if p_reward_id = 'system-first-arena-gold' then
    v_reward := 1;
    select exists (
      select 1
      from public.arenas ar
      where ar.user_id = v_user_id
        and exists (
          select 1
          from public.actions a
          where a.arena_id::text = ar.id::text
            and a.user_id = v_user_id
            and coalesce(a.action_type, '') <> 'Livre'
        )
        and not exists (
          select 1
          from public.actions a
          where a.arena_id::text = ar.id::text
            and a.user_id = v_user_id
            and coalesce(a.action_type, '') <> 'Livre'
            and (
              select count(*)
              from public.scheduled_tasks st
              where st.user_id = v_user_id
                and st.action_id::text = a.id::text
                and coalesce(st.completed, false) = true
            ) < greatest(1, coalesce(a.repetitions, 1))
        )
    ) into v_eligible;
  elsif p_reward_id = 'system-five-day-proof-streak' then
    v_reward := 2;
    select coalesce(
      nullif(daily_proof_streak ->> 'current', '')::integer,
      nullif(daily_proof_streak ->> 'current_streak', '')::integer,
      0
    ) >= 5
    into v_eligible
    from public.user_profiles
    where id = v_user_id;
  elsif p_reward_id = 'system-twenty-actions' then
    v_reward := 2;
    select count(*) >= 20
    into v_eligible
    from public.scheduled_tasks st
    join public.actions a
      on a.id::text = st.action_id::text
     and a.user_id = v_user_id
    where st.user_id = v_user_id
      and coalesce(st.completed, false) = true
      and coalesce(a.action_type, '') <> 'Livre';
  elsif p_reward_id = 'system-seven-days-in-app' then
    v_reward := 10;
    select count(*) >= 5
    into v_eligible
    from public.dias_no_app d
    where d.user_id = v_user_id;
  else
    raise exception 'UNKNOWN_PROGRESS_REWARD';
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'REWARD_NOT_ELIGIBLE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':progress:' || p_reward_id, 0));

  if public._starter_reward_has_purchase_marker(v_user_id, 'progress_reward', p_reward_id) then
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
    'progress_reward',
    'Recompensa de missao opcional',
    jsonb_build_object('reward_id', p_reward_id)
  );
  perform public._starter_reward_mark_purchase(v_user_id, 'progress_reward', p_reward_id, false);

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'gold_granted', v_reward,
    'new_gold', v_new_gold
  );
end;
$$;
revoke all on function public.claim_glyph_progress_gold(text) from public;
grant execute on function public.claim_glyph_progress_gold(text) to authenticated;

COMMIT;
