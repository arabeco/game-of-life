-- O ORACULO COM IA CONTA CONVERSAS, NAO MENSAGENS (02/11/2026, com o Afonso).
--
-- Uma pergunta so por dia batia na parede: a pessoa pergunta, quer comentar a
-- resposta e ja caia no "compre o Premium". Agora a cota e de CONVERSAS:
--
--   - uma conversa e a primeira pergunta e ate 2 seguimentos (3 mensagens),
--     enquanto a ultima mensagem tiver menos de 20 minutos;
--   - gratis 1 conversa por dia, Premium 5, Platinum 15 (staff e GM, 15);
--   - so conta o que foi entregue: se a IA falhar, a mensagem e devolvida, e
--     a conversa tambem, se era a primeira mensagem dela.
--
-- Substitui oraculo_ia_reservar, oraculo_ia_devolver e oraculo_ia_restantes
-- de 20261102120000_oraculo_ia.sql; oraculo_ia_uso.usadas passa a contar
-- conversas. Pode ser rodado de novo sem estrago.

begin;

create table if not exists public.oraculo_ia_conversa (
  user_id uuid primary key references auth.users(id) on delete cascade,
  aberta_em timestamptz not null default now(),
  ultima_em timestamptz not null default now(),
  mensagens integer not null default 0
);
alter table public.oraculo_ia_conversa enable row level security;

-- A memoria do Oraculo (03/11/2026): o que a pessoa contou de si, reescrito
-- pela IA a cada resposta. So a funcao (service role) le e grava.
create table if not exists public.oraculo_ia_memoria (
  user_id uuid primary key references auth.users(id) on delete cascade,
  texto text not null default '',
  atualizada_em timestamptz not null default now()
);
alter table public.oraculo_ia_memoria enable row level security;

-- Mensagens por conversa e a janela em que ela continua aberta.
create or replace function public.oraculo_ia_mensagens_por_conversa()
returns integer language sql immutable as $$ select 3 $$;

-- Reserva a proxima mensagem: continua a conversa aberta ou abre outra, se o
-- plano ainda tiver conversas hoje. Atomica.
create or replace function public.oraculo_ia_reservar(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(p_user_id), 1);
  v_dia date := public.oraculo_ia_dia();
  v_por_conversa integer := public.oraculo_ia_mensagens_por_conversa();
  v_conversa public.oraculo_ia_conversa;
  v_usadas integer;
begin
  insert into public.oraculo_ia_uso (user_id, dia, usadas) values (p_user_id, v_dia, 0)
  on conflict (user_id, dia) do nothing;

  -- Continua a conversa aberta: de hoje, viva ha menos de 20 minutos e com vaga.
  update public.oraculo_ia_conversa
  set mensagens = mensagens + 1, ultima_em = now()
  where user_id = p_user_id
    and ultima_em > now() - interval '20 minutes'
    and ((aberta_em at time zone 'America/Sao_Paulo') - interval '4 hours')::date = v_dia
    and mensagens < v_por_conversa
  returning * into v_conversa;

  if found then
    select usadas into v_usadas from public.oraculo_ia_uso where user_id = p_user_id and dia = v_dia;
    return jsonb_build_object('ok', true, 'conversa_nova', false, 'usadas', v_usadas, 'limite', v_limite,
      'na_conversa', v_por_conversa - v_conversa.mensagens);
  end if;

  -- Abre outra conversa, se o plano ainda tiver hoje.
  update public.oraculo_ia_uso set usadas = usadas + 1
  where user_id = p_user_id and dia = v_dia and usadas < v_limite
  returning usadas into v_usadas;

  if not found then
    select usadas into v_usadas from public.oraculo_ia_uso where user_id = p_user_id and dia = v_dia;
    return jsonb_build_object('ok', false, 'usadas', v_usadas, 'limite', v_limite, 'na_conversa', 0);
  end if;

  insert into public.oraculo_ia_conversa (user_id, aberta_em, ultima_em, mensagens)
  values (p_user_id, now(), now(), 1)
  on conflict (user_id) do update set aberta_em = now(), ultima_em = now(), mensagens = 1;

  return jsonb_build_object('ok', true, 'conversa_nova', true, 'usadas', v_usadas, 'limite', v_limite,
    'na_conversa', v_por_conversa - 1);
end;
$$;

-- A IA falhou: devolve a mensagem, e a conversa, se era a primeira dela.
drop function if exists public.oraculo_ia_devolver(uuid);
create or replace function public.oraculo_ia_devolver(p_user_id uuid, p_conversa_nova boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_conversa_nova then
    update public.oraculo_ia_uso set usadas = greatest(0, usadas - 1)
    where user_id = p_user_id and dia = public.oraculo_ia_dia();
    delete from public.oraculo_ia_conversa where user_id = p_user_id;
  else
    update public.oraculo_ia_conversa set mensagens = greatest(0, mensagens - 1)
    where user_id = p_user_id;
  end if;
end;
$$;

-- O que o app mostra: mensagens que ainda cabem hoje (as da conversa aberta e
-- as das conversas que sobram), e o limite de conversas do plano.
create or replace function public.oraculo_ia_restantes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(auth.uid()), 1);
  v_dia date := public.oraculo_ia_dia();
  v_por_conversa integer := public.oraculo_ia_mensagens_por_conversa();
  v_usadas integer := coalesce((select usadas from public.oraculo_ia_uso where user_id = auth.uid() and dia = v_dia), 0);
  v_na_conversa integer := coalesce((
    select v_por_conversa - mensagens from public.oraculo_ia_conversa
    where user_id = auth.uid()
      and ultima_em > now() - interval '20 minutes'
      and ((aberta_em at time zone 'America/Sao_Paulo') - interval '4 hours')::date = v_dia
  ), 0);
begin
  return jsonb_build_object(
    'usadas', v_usadas,
    'limite', v_limite,
    'na_conversa', greatest(0, v_na_conversa),
    'mensagens', greatest(0, v_na_conversa) + greatest(0, v_limite - v_usadas) * v_por_conversa
  );
end;
$$;

revoke all on function public.oraculo_ia_reservar(uuid) from public, anon, authenticated;
revoke all on function public.oraculo_ia_devolver(uuid, boolean) from public, anon, authenticated;
grant execute on function public.oraculo_ia_reservar(uuid) to service_role;
grant execute on function public.oraculo_ia_devolver(uuid, boolean) to service_role;
revoke all on function public.oraculo_ia_restantes() from public, anon;
grant execute on function public.oraculo_ia_restantes() to authenticated;

commit;
