-- CONVIDE UM AMIGO (10/10/2026).
--
-- Decidido com o Afonso:
--   * Cada pessoa tem um codigo proprio (ex.: AFONSO-7K2), mostrado no modal de
--     "Resgatar codigo", com copiar e compartilhar.
--   * O amigo digita esse codigo no MESMO campo de cupom: ganha 10 de ouro e os
--     dois viram amigos na hora.
--   * Para quem convidou, o amigo so CONTA quando completar os sete dias no app
--     (public.dias_no_app, migracao 20261010120000). Conta criada e largada nao
--     paga nada a ninguem alem dos 10 do proprio amigo.
--   * A barrinha tem duas bolinhas: 5 amigos = bau Raro; 10 amigos = 25 de ouro.
--
-- AS TRAVAS:
--   * So conta nova usa convite: ate 7 dias de criada. Sem isso, quem ja joga
--     trocaria codigos so pelos 10 de ouro.
--   * Ninguem usa o proprio codigo, e cada conta usa UM convite na vida.
--   * O codigo nunca coincide com um codigo de resgate (reward_codes).

-- 1. O CODIGO DE CADA UM ----------------------------------------------------

create table if not exists public.convites (
  dono uuid primary key references auth.users(id) on delete cascade,
  codigo text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists convites_codigo_unico on public.convites (upper(codigo));

alter table public.convites enable row level security;
drop policy if exists "convites: cada um le o seu" on public.convites;
create policy "convites: cada um le o seu"
  on public.convites for select to authenticated
  using (dono = auth.uid());
revoke insert, update, delete on public.convites from anon, authenticated;

-- 2. QUEM USOU O CODIGO DE QUEM ---------------------------------------------

create table if not exists public.convites_usados (
  convidado uuid primary key references auth.users(id) on delete cascade,
  dono uuid not null references auth.users(id) on delete cascade,
  codigo text not null,
  created_at timestamptz not null default now()
);
create index if not exists convites_usados_dono on public.convites_usados (dono);

alter table public.convites_usados enable row level security;
drop policy if exists "convites_usados: as duas pontas leem" on public.convites_usados;
create policy "convites_usados: as duas pontas leem"
  on public.convites_usados for select to authenticated
  using (dono = auth.uid() or convidado = auth.uid());
revoke insert, update, delete on public.convites_usados from anon, authenticated;

-- 3. MEU CODIGO: devolve o que existe, ou cria um ----------------------------

create or replace function public.meu_codigo_de_convite()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_codigo text;
  v_base text;
  v_letras constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_tentativa integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select codigo into v_codigo from public.convites where dono = v_user_id;
  if v_codigo is not null then
    return v_codigo;
  end if;

  -- O comeco e o apelido, sem acento e sem simbolo, ate 8 letras.
  select left(regexp_replace(
           translate(upper(coalesce(nickname, '')),
             'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOOUUUUCN'),
           '[^A-Z0-9]', '', 'g'), 8)
  into v_base
  from public.user_profiles
  where id = v_user_id;
  if coalesce(v_base, '') = '' then
    v_base := 'GLYPH';
  end if;

  loop
    v_tentativa := v_tentativa + 1;
    if v_tentativa > 30 then
      raise exception 'CODIGO_INDISPONIVEL';
    end if;
    v_codigo := v_base || '-'
      || substr(v_letras, 1 + floor(random() * length(v_letras))::integer, 1)
      || substr(v_letras, 1 + floor(random() * length(v_letras))::integer, 1)
      || substr(v_letras, 1 + floor(random() * length(v_letras))::integer, 1);
    continue when exists (select 1 from public.convites c where upper(c.codigo) = v_codigo);
    continue when exists (select 1 from public.reward_codes rc where lower(rc.code) = lower(v_codigo));

    insert into public.convites (dono, codigo) values (v_user_id, v_codigo)
    on conflict do nothing;
    -- Duas chamadas ao mesmo tempo: vale o que chegou primeiro.
    select codigo into v_codigo from public.convites where dono = v_user_id;
    if v_codigo is not null then
      return v_codigo;
    end if;
  end loop;
end;
$$;
revoke all on function public.meu_codigo_de_convite() from public;
grant execute on function public.meu_codigo_de_convite() to authenticated;

-- 4. USAR O CODIGO DE UM AMIGO ---------------------------------------------

create or replace function public.usar_codigo_de_convite(p_codigo text)
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

  -- A amizade nos dois sentidos, como o aceite de pedido grava.
  insert into public.friends (user_id, friend_id)
  select v_user_id, v_dono
  where not exists (select 1 from public.friends where user_id = v_user_id and friend_id = v_dono);
  insert into public.friends (user_id, friend_id)
  select v_dono, v_user_id
  where not exists (select 1 from public.friends where user_id = v_dono and friend_id = v_user_id);

  v_novo_ouro := public._starter_reward_credit_gold(
    v_user_id, 10, 'invite', 'Convite de amigo', jsonb_build_object('dono', v_dono)
  );

  select nickname into v_apelido from public.user_profiles where id = v_dono;

  return jsonb_build_object(
    'success', true,
    'gold_granted', 10,
    'new_gold', v_novo_ouro,
    'amigo', coalesce(v_apelido, '')
  );
end;
$$;
revoke all on function public.usar_codigo_de_convite(text) from public;
grant execute on function public.usar_codigo_de_convite(text) to authenticated;

-- 5. A BARRINHA: quantos entraram, quantos completaram, o que ja recebeu ------

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
    and (select count(*) from public.dias_no_app d where d.user_id = cu.convidado) >= 7;

  return jsonb_build_object(
    'codigo', v_codigo,
    'entraram', v_entraram,
    'completaram', v_completaram,
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
  if p_marco is null or p_marco not in (5, 10) then
    raise exception 'MARCO_INVALIDO';
  end if;

  select count(*)::integer into v_completaram
  from public.convites_usados cu
  where cu.dono = v_user_id
    and (select count(*) from public.dias_no_app d where d.user_id = cu.convidado) >= 7;
  if v_completaram < p_marco then
    raise exception 'MARCO_NAO_ALCANCADO';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':convite:' || p_marco, 0));
  if public._starter_reward_has_purchase_marker(v_user_id, 'invite_milestone', p_marco::text) then
    return jsonb_build_object('success', true, 'already_claimed', true, 'marco', p_marco);
  end if;

  if p_marco = 5 then
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
    'chest_type', case when p_marco = 5 then 'Raro' end,
    'gold_granted', case when p_marco = 10 then 25 else 0 end,
    'new_gold', v_novo_ouro
  );
end;
$$;
revoke all on function public.receber_premio_de_convite(integer) from public;
grant execute on function public.receber_premio_de_convite(integer) to authenticated;
