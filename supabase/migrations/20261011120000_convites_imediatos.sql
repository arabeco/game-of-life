-- Convites vinculados contam imediatamente. Mantém prêmios já recebidos.
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
  where cu.dono = v_user_id;

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

-- 6. RECEBER A BOLINHA ------------------------------------------------------

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
  where cu.dono = v_user_id;
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
-- O sino recebe o aviso mesmo se quem convidou estiver offline.
create or replace function public.avisar_novo_convite()
returns trigger language plpgsql security definer set search_path = public, auth
as $$
declare
  v_total integer;
  v_premios text;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.dono::text || ':convites-aviso', 0));
  select count(*) into v_total from public.convites_usados where dono = new.dono;
  select string_agg(premio, ', ' order by marco) into v_premios
  from (values (1, 'baú Comum'), (5, 'baú Raro'), (10, '25 de ouro')) as marcos(marco, premio)
  where marco <= v_total
    and not public._starter_reward_has_purchase_marker(new.dono, 'invite_milestone', marco::text);
  insert into public.notifications(id, user_id, type, content, read, created_at, metadata)
  values (gen_random_uuid(), new.dono, 'system',
    format('Um amigo usou seu convite! Agora você tem %s. ', v_total)
      || case when v_premios is not null then 'Prêmio disponível: ' || v_premios || '. ' else '' end
      || 'Veja em Ajustes > Resgatar código, nas bolinhas de convites.',
    false, now(), jsonb_build_object('source', 'friend_invite', 'count', v_total));
  return new;
end;
$$;
revoke all on function public.avisar_novo_convite() from public, anon, authenticated;
drop trigger if exists avisar_novo_convite on public.convites_usados;
create trigger avisar_novo_convite after insert on public.convites_usados
for each row execute function public.avisar_novo_convite();
COMMIT;
