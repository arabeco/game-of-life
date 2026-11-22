-- O CONVITE PERGUNTA ANTES (22/11/2026, com o Afonso).
--
-- Quem digitava o codigo de um amigo virava amigo dele na hora, sem ver de
-- quem era o codigo. Agora o app mostra antes "Convite de @fulano", com a
-- opcao "Adicionar como amigo" ja marcada, e a pessoa confirma.
--
-- 1. dono_do_convite: diz de quem e o codigo (so o apelido, nunca o id) e se
--    e o proprio codigo de quem pergunta. Nao gasta nada e nao grava nada.
-- 2. usar_codigo_de_convite ganha p_amizade (padrao: sim). O app antigo e o
--    convite que chega com a instalacao continuam chamando sem ele e seguem
--    virando amigos, como antes. O ouro e o marco do dono nao mudam.

create or replace function public.dono_do_convite(p_codigo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_dono uuid;
  v_apelido text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  select dono into v_dono from public.convites where upper(codigo) = v_codigo;
  if v_dono is null then
    return jsonb_build_object('found', false);
  end if;
  select nickname into v_apelido from public.user_profiles where id = v_dono;
  return jsonb_build_object(
    'found', true,
    'apelido', coalesce(v_apelido, ''),
    'proprio', v_dono = v_user_id,
    'ja_amigos', exists (select 1 from public.friends where user_id = v_user_id and friend_id = v_dono)
  );
end;
$$;
revoke all on function public.dono_do_convite(text) from public;
grant execute on function public.dono_do_convite(text) to authenticated;

drop function if exists public.usar_codigo_de_convite(text);

create or replace function public.usar_codigo_de_convite(p_codigo text, p_amizade boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_dono uuid;
  v_criada_em timestamptz;
  v_novo_ouro integer;
  v_apelido text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select dono into v_dono from public.convites where upper(codigo) = v_codigo;
  if v_dono is null then
    return jsonb_build_object('success', false, 'error', 'CODE_NOT_FOUND');
  end if;
  if v_dono = v_user_id then
    return jsonb_build_object('success', false, 'error', 'OWN_CODE');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':convite', 0));

  if exists (select 1 from public.convites_usados where convidado = v_user_id) then
    return jsonb_build_object('success', false, 'error', 'INVITE_ALREADY_USED');
  end if;

  select created_at into v_criada_em from auth.users where id = v_user_id;
  if v_criada_em is null or v_criada_em < now() - interval '7 days' then
    return jsonb_build_object('success', false, 'error', 'ACCOUNT_TOO_OLD');
  end if;

  insert into public.convites_usados (convidado, dono, codigo)
  values (v_user_id, v_dono, v_codigo);

  -- A amizade nos dois sentidos, como o aceite de pedido grava. So se a pessoa quis.
  if coalesce(p_amizade, true) then
    insert into public.friends (user_id, friend_id)
    select v_user_id, v_dono
    where not exists (select 1 from public.friends where user_id = v_user_id and friend_id = v_dono);
    insert into public.friends (user_id, friend_id)
    select v_dono, v_user_id
    where not exists (select 1 from public.friends where user_id = v_dono and friend_id = v_user_id);
  end if;

  v_novo_ouro := public._starter_reward_credit_gold(
    v_user_id, 10, 'invite', 'Convite de amigo', jsonb_build_object('dono', v_dono)
  );

  select nickname into v_apelido from public.user_profiles where id = v_dono;

  return jsonb_build_object(
    'success', true,
    'gold_granted', 10,
    'new_gold', v_novo_ouro,
    'amigo', coalesce(v_apelido, ''),
    'amizade', coalesce(p_amizade, true)
  );
end;
$$;
revoke all on function public.usar_codigo_de_convite(text, boolean) from public;
grant execute on function public.usar_codigo_de_convite(text, boolean) to authenticated;
