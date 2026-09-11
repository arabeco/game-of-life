-- Correcao da missao individual: escopo geral, slot unico e retomada pela meta.
-- Nao cria missao, nao paga recompensa, nao modifica perfis existentes.
-- Substitui accept_arena_pact e claim_arena_pact_reward. Requer as migracoes anteriores.
-- Validar primeiro CHECK-missao-individual.sql. Sem deploy/AAB automatico.
begin;

create or replace function public.accept_arena_pact(p_arena_id uuid,p_kind text,p_difficulty text,p_goal integer)
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare
 v_user uuid := auth.uid();
 v_active text;
 v_start date := (timezone('America/Sao_Paulo',now()) - interval '4 hours')::date;
 v_end date;
 v_goal integer;
 v_days integer;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 -- Quem diz que ha missao ativa e o TIPO, nao a arena.
 --
 -- A missao individual passou a ter dois escopos: de arena, e do app inteiro.
 -- No segundo a arena e nula de proposito, entao usar a arena como sinal de
 -- "tem uma em andamento" deixaria o slot parecer vazio com uma missao de pe.
 select arena_pact_kind into v_active from public.user_profiles where id=v_user for update;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 if v_active is not null then raise exception 'PACT_ALREADY_ACTIVE'; end if;
 if p_kind is null or p_kind not in ('volume','constancia','conclusao','retomada')
   or p_difficulty is null or p_difficulty not in ('leve','media','alta')
   or p_goal is null or p_goal < 1 then raise exception 'INVALID_PACT'; end if;
 -- ESCOPO DO APP INTEIRO: arena nula.
 --
 -- Nao precisou de coluna nova. A ausencia da arena JA e a informacao, e ela e
 -- verdade nos dois lados: quem mede, mede sem filtrar por arena.
 --
 -- So o molde de volume aceita esse escopo. Constancia sem arena viraria a
 -- sequencia global que acabou de ser removida, e conclusao/retomada nao querem
 -- dizer nada sem uma frente especifica.
 -- Nao reabre o mesmo compromisso ja pago no dia (identidade do resgate).
 if public._starter_reward_has_purchase_marker(v_user, 'arena_pact',
   coalesce(p_arena_id::text,'sistema') || ':' || p_kind || ':' || to_char(v_start,'YYYY-MM-DD')) then
   raise exception 'PACT_ALREADY_REWARDED_TODAY'; end if;
 if p_arena_id is null then
   if p_kind <> 'volume' then raise exception 'PACT_SCOPE_REQUIRES_VOLUME'; end if;
 elsif not exists(select 1 from public.arenas where id=p_arena_id and user_id=v_user and not coalesce(is_archived,false)) then
   raise exception 'PACT_ARENA_NOT_FOUND'; end if;
 if p_kind='volume' then
   -- A meta deixou de ser fixa por faixa: ela vem do RITMO da pessoa naquela
   -- arena, calculado no cliente. O servidor valida o INTERVALO, nao o valor.
   if p_goal < 3 or p_goal > 10 then raise exception 'INVALID_PACT_GOAL'; end if;
   v_goal := p_goal;
   -- Uma janela so. Antes 7/14/21 dias vinham amarrados a 3/6/10 acoes, o que
   -- dava sempre ~3 por semana e tornava toda faixa impossivel para quem entrega
   -- uma vez por semana.
   v_days := 14;
   v_end := v_start + v_days - 1;
   if not exists(select 1 from public.actions where user_id=v_user
     and (p_arena_id is null or arena_id=p_arena_id)
     and (p_arena_id is not null or exists (select 1 from public.arenas ar where ar.id=actions.arena_id and ar.user_id=v_user and not coalesce(ar.is_archived,false)))
     and coalesce(action_type,'') <> 'Livre') then
     raise exception 'PACT_NO_MEASURABLE_ACTION'; end if;
   -- Janela paga nao pode ser reutilizada por outro pacto de volume.
   -- A trava de janela paga vale igual no escopo do app: 'sistema' e a chave.
   if exists(select 1 from public.user_purchases where user_id=v_user
     and product_type='arena_pact_volume_window'
     and split_part(product_id,':',1)=coalesce(p_arena_id::text,'sistema')
     and split_part(product_id,':',2) >= to_char(v_start,'YYYY-MM-DD')) then
     raise exception 'PACT_PREVIOUS_WINDOW_STILL_OPEN'; end if;
 else
   v_goal := p_goal;
   -- Retomada aceita 1 ou 2: hoje o app pede 2 (uma entrega pode ser impulso,
   -- duas e retorno), e 1 continua valendo para binario antigo ja instalado.
   if p_kind='retomada' and p_goal not between 1 and 2 then raise exception 'INVALID_PACT_GOAL'; end if;
   if p_kind='constancia' and p_goal not between 2 and 7 then raise exception 'INVALID_PACT_GOAL'; end if;
   if p_kind='conclusao' and p_goal not between 1 and 50 then raise exception 'INVALID_PACT_GOAL'; end if;
 end if;
 -- A FAIXA SAI DA META, nunca do que o cliente pediu.
 --
 -- Antes o cliente mandava a faixa e o servidor conferia se a meta batia com a
 -- tabela dela. Agora e o contrario, e isso fecha a porta: nao existe pedir
 -- premio de faixa alta com meta de duas entregas.
 p_difficulty := case when v_goal <= 3 then 'leve' when v_goal <= 7 then 'media' else 'alta' end;
 perform set_config('glyph.pact_write','on',true);
 update public.user_profiles set arena_pact_arena_id=p_arena_id,arena_pact_kind=p_kind,
   arena_pact_difficulty=p_difficulty,arena_pact_goal=v_goal,arena_pact_started_on=v_start,arena_pact_ends_on=v_end where id=v_user;
 perform set_config('glyph.pact_write','off',true);
 return jsonb_build_object('success',true,'started_on',v_start,'ends_on',v_end);
end $$;

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
  v_ends_on date;
  v_today date := (timezone('America/Sao_Paulo',now()) - interval '4 hours')::date;
  v_reward integer := 0;
  v_eligible boolean := false;
  v_marker text;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select arena_pact_arena_id, arena_pact_kind, arena_pact_difficulty, arena_pact_goal, arena_pact_started_on, arena_pact_ends_on
    into v_arena_id, v_kind, v_difficulty, v_goal, v_started_on, v_ends_on
  from public.user_profiles
  where id = v_user_id for update;

  -- O tipo e quem diz que ha missao; a arena pode ser nula no escopo do app.
  if v_kind is null then
    raise exception 'NO_ACTIVE_PACT';
  end if;

  -- A arena tem de continuar sendo da pessoa. Sem isso, trocar o id na coluna
  -- daria premio por arena alheia.
  if v_arena_id is not null and not exists (
    select 1 from public.arenas where id = v_arena_id and user_id = v_user_id
  ) then
    raise exception 'PACT_ARENA_NOT_FOUND';
  end if;

  -- Escopo do app so existe em volume, do lado de ca tambem.
  if v_arena_id is null and v_kind <> 'volume' then
    raise exception 'PACT_SCOPE_REQUIRES_VOLUME';
  end if;

  -- O pagamento segue a META, nao a coluna de faixa. Mesmo que a coluna fosse
  -- adulterada, o premio continua sendo o do tamanho realmente prometido.
  v_difficulty := case when v_goal <= 3 then 'leve' when v_goal <= 7 then 'media' else 'alta' end;

  v_reward := case v_difficulty
    when 'leve' then 2
    when 'media' then 5
    when 'alta' then 10
    else 0
  end;

  if v_reward <= 0 then
    raise exception 'UNKNOWN_PACT_DIFFICULTY';
  end if;

  if v_kind = 'volume' then
    if v_goal < 3 or v_goal > 10
      or v_ends_on is null
      or v_ends_on <> v_started_on + 14 - 1 then
      raise exception 'INVALID_PACT_WINDOW'; end if;
    select count(distinct st.id) >= v_goal into v_eligible
    from public.scheduled_tasks st join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user_id
    where st.user_id=v_user_id and (v_arena_id is null or a.arena_id=v_arena_id) and coalesce(st.completed,false)
      and coalesce(a.action_type,'') <> 'Livre'
      and (v_arena_id is not null or exists (select 1 from public.arenas ar where ar.id=a.arena_id and ar.user_id=v_user_id and not coalesce(ar.is_archived,false)))
      and (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end)
        between v_started_on and least(v_ends_on,v_today);
  elsif v_kind in ('constancia', 'retomada') then
    -- Mesmo dia operacional, exclusoes e meta do cliente, incluindo retomada antiga de 1.
    if v_goal is null or (v_kind='retomada' and v_goal not between 1 and 2)
      or (v_kind='constancia' and v_goal not between 2 and 7) then
      raise exception 'INVALID_PACT_GOAL'; end if;
    select case when v_kind='constancia' then count(distinct delivery_day) >= v_goal
      else count(distinct task_id) >= v_goal end into v_eligible
    from (
      select st.id as task_id,
        nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end as delivery_day
      from public.scheduled_tasks st
      join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user_id
      where st.user_id=v_user_id and a.arena_id=v_arena_id and coalesce(st.completed,false)
        and coalesce(a.action_type,'') <> 'Livre'
    ) deliveries
    where delivery_day between v_started_on and v_today;

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
  v_marker := coalesce(v_arena_id::text, 'sistema') || ':' || v_kind || ':' || to_char(v_started_on, 'YYYY-MM-DD');

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

  if v_kind='volume' then
    perform public._starter_reward_mark_purchase(v_user_id,'arena_pact_volume_window',coalesce(v_arena_id::text,'sistema') || ':' || to_char(v_ends_on,'YYYY-MM-DD'),false);
  end if;
  perform set_config('glyph.pact_write','on',true);
  -- Fecha o pacto na mesma transacao do pagamento: o slot volta a ficar livre
  -- e a mesma linha nao pode pagar duas vezes.
  update public.user_profiles
     set arena_pact_arena_id = null,
         arena_pact_kind = null,
         arena_pact_difficulty = null,
         arena_pact_goal = null,
         arena_pact_started_on = null,
         arena_pact_ends_on = null
   where id = v_user_id;

  perform set_config('glyph.pact_write','off',true);
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

commit;
