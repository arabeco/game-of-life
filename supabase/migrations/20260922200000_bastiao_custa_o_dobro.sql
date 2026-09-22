-- A PRIMEIRA PATENTE DE CLA CHEGAVA RAPIDO DEMAIS.
--
-- Um ciclo de sete dias fechado rende por volta de 3.500 de experiencia para o
-- grupo. Feudo virava Bastiao com dez mil: tres ciclos. Cinco pessoas ativas
-- somavam isso na PRIMEIRA semana, e a patente — que agora paga fragmentos, bau
-- e muda o fundo que todo mundo ve — saia por uma semana de uso, antes de o
-- grupo virar grupo.
--
-- Bastiao passa a custar vinte mil. Seis ciclos. Num grupo real, onde nem todo
-- mundo fecha ciclo toda semana, sao de duas a tres semanas. Os degraus acima
-- nao mudam: o que estava errado era o primeiro.
--
-- O ARQUIVO TAMBEM CONSERTA UM PERIGO QUE A MUDANCA CRIA.
--
-- A patente e recalculada a cada fecho de ciclo a partir da experiencia total.
-- Subir a faixa faria um grupo com doze mil — hoje Bastiao — voltar para Feudo
-- no proximo fecho de ciclo de qualquer membro. E o estrago nao pararia ai: ao
-- cruzar vinte mil, `clan_rank_up_dispatches` ja teria a linha de Bastiao do
-- backfill, entao ninguem seria avisado nem pago pela subida.
--
-- Patente nao volta atras. A partir daqui a funcao so aceita o resultado novo
-- se ele for MAIOR que o atual, e isso vale para sempre: no dia em que outra
-- faixa mudar, ninguem e rebaixado por causa da mudanca.

begin;

/**
 * Posicao da patente na escada. Serve para comparar duas sem depender da
 * ordem em que aparecem no `case`.
 */
create or replace function public._cla_degrau_da_patente(p_rank_id text)
returns integer
language sql
immutable
as $$
  select case p_rank_id
    when 'imperio'    then 6
    when 'dinastia'   then 5
    when 'reino'      then 4
    when 'principado' then 3
    when 'provincia'  then 2
    when 'bastiao'    then 1
    else 0
  end;
$$;

/**
 * A faixa, so pela experiencia. Um lugar so para a escada — a funcao de XP
 * chama esta em vez de repetir os numeros dentro do `update`.
 */
create or replace function public._cla_patente_por_exp(p_exp integer)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_exp, 0) >= 2500000 then 'imperio'
    when coalesce(p_exp, 0) >= 1000000 then 'dinastia'
    when coalesce(p_exp, 0) >= 400000  then 'reino'
    when coalesce(p_exp, 0) >= 150000  then 'principado'
    when coalesce(p_exp, 0) >= 50000   then 'provincia'
    when coalesce(p_exp, 0) >= 20000   then 'bastiao'
    else 'feudo'
  end;
$$;

create or replace function public.record_my_clan_xp(
  p_xp_amount integer,
  p_source_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_clan_id uuid;
  v_inserted_id bigint;
  v_clan_exp integer;
  v_member_total integer;
  v_source_key text := trim(coalesce(p_source_key, ''));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_xp_amount is null or p_xp_amount <= 0 then
    raise exception 'XP amount must be positive';
  end if;

  if left(v_source_key, 6) <> 'cycle:' or char_length(v_source_key) not between 7 and 160 then
    return jsonb_build_object('awarded', false, 'reason', 'cycle_close_required');
  end if;

  select membership.clan_id into v_clan_id
  from public.clan_members membership
  where membership.user_id = v_user_id
  order by membership.joined_at desc nulls last
  limit 1;

  if v_clan_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'not_in_clan');
  end if;

  insert into public.clan_xp_contributions (clan_id, user_id, xp_amount, source_key)
  values (v_clan_id, v_user_id, p_xp_amount, v_source_key)
  on conflict (user_id, source_key) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object('awarded', false, 'reason', 'already_recorded');
  end if;

  update public.clans
  set exp = coalesce(exp, 0) + p_xp_amount,
      -- Sobe, nunca desce. Ver a nota no alto do arquivo.
      rank_id = case
        when public._cla_degrau_da_patente(public._cla_patente_por_exp(coalesce(exp, 0) + p_xp_amount))
           > public._cla_degrau_da_patente(coalesce(rank_id, 'feudo'))
        then public._cla_patente_por_exp(coalesce(exp, 0) + p_xp_amount)
        else coalesce(rank_id, 'feudo')
      end
  where id = v_clan_id
  returning exp into v_clan_exp;

  select coalesce(sum(contribution.xp_amount), 0)::integer into v_member_total
  from public.clan_xp_contributions contribution
  where contribution.clan_id = v_clan_id
    and contribution.user_id = v_user_id;

  return jsonb_build_object(
    'awarded', true,
    'clan_id', v_clan_id,
    'clan_exp', v_clan_exp,
    'member_total', v_member_total
  );
end;
$$;

revoke all on function public.record_my_clan_xp(integer, text) from public;
grant execute on function public.record_my_clan_xp(integer, text) to authenticated;

commit;
