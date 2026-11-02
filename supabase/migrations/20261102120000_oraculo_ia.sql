-- O ORACULO COM IA, V1: SO O CHAT (02/11/2026, com o Afonso).
--
-- A pessoa pergunta, a funcao oraculo-ia monta os padroes dela e chama o
-- Haiku. Aqui fica o que o servidor precisa guardar:
--
--   1. A COTA por dia operacional (o dia vira as 4h, horario de Brasilia):
--      gratis 1, Premium 5, Platinum 15 (staff e GM, 15). Conta o que foi
--      ENTREGUE: se a IA falhar, a funcao devolve a pergunta.
--   2. A CONVERSA: as trocas guardadas, para a pergunta seguinte lembrar do
--      que a pessoa disse ("nao vou largar o Idiomas").
--
-- Nada aqui e lido ou escrito pelo app direto: a funcao usa a chave de
-- servico. O app so le quantas perguntas ainda tem hoje, pela funcao
-- oraculo_ia_restantes().
-- Pode ser rodado de novo sem estrago.

begin;

create table if not exists public.oraculo_ia_uso (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  usadas integer not null default 0,
  primary key (user_id, dia)
);
alter table public.oraculo_ia_uso enable row level security;

create table if not exists public.oraculo_ia_mensagens (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  pergunta text not null,
  resposta text not null,
  criada_em timestamptz not null default now()
);
create index if not exists oraculo_ia_mensagens_user_criada
  on public.oraculo_ia_mensagens (user_id, criada_em desc);
alter table public.oraculo_ia_mensagens enable row level security;

-- O dia do Glyph: vira as 4h, no horario de Brasilia.
create or replace function public.oraculo_ia_dia()
returns date language sql stable set search_path = public as $$
  select ((now() at time zone 'America/Sao_Paulo') - interval '4 hours')::date;
$$;

-- Quantas perguntas o plano da por dia.
create or replace function public.oraculo_ia_limite(p_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case
    when lower(coalesce(role, '')) in ('admin', 'gm', 'admin_gm') then 15
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now())
      and lower(coalesce(subscription_tier, 'premium')) = 'platinum' then 15
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now()) then 5
    else 1 end
  from public.user_profiles where id = p_user_id;
$$;

-- Reserva uma pergunta: so passa se ainda houver cota hoje. Atomica.
create or replace function public.oraculo_ia_reservar(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(p_user_id), 1);
  v_dia date := public.oraculo_ia_dia();
  v_usadas integer;
begin
  insert into public.oraculo_ia_uso (user_id, dia, usadas)
  values (p_user_id, v_dia, 0)
  on conflict (user_id, dia) do nothing;

  update public.oraculo_ia_uso
  set usadas = usadas + 1
  where user_id = p_user_id and dia = v_dia and usadas < v_limite
  returning usadas into v_usadas;

  if not found then
    select usadas into v_usadas from public.oraculo_ia_uso where user_id = p_user_id and dia = v_dia;
    return jsonb_build_object('ok', false, 'usadas', v_usadas, 'limite', v_limite);
  end if;
  return jsonb_build_object('ok', true, 'usadas', v_usadas, 'limite', v_limite);
end;
$$;

-- Devolve a pergunta quando a IA falhou: so se conta o que foi entregue.
create or replace function public.oraculo_ia_devolver(p_user_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.oraculo_ia_uso
  set usadas = greatest(0, usadas - 1)
  where user_id = p_user_id and dia = public.oraculo_ia_dia();
$$;

-- O que o app mostra: quantas ja usou hoje e o limite do plano.
create or replace function public.oraculo_ia_restantes()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'usadas', coalesce((select usadas from public.oraculo_ia_uso where user_id = auth.uid() and dia = public.oraculo_ia_dia()), 0),
    'limite', coalesce(public.oraculo_ia_limite(auth.uid()), 1)
  );
$$;

revoke all on function public.oraculo_ia_limite(uuid) from public, anon, authenticated;
revoke all on function public.oraculo_ia_reservar(uuid) from public, anon, authenticated;
revoke all on function public.oraculo_ia_devolver(uuid) from public, anon, authenticated;
grant execute on function public.oraculo_ia_limite(uuid) to service_role;
grant execute on function public.oraculo_ia_reservar(uuid) to service_role;
grant execute on function public.oraculo_ia_devolver(uuid) to service_role;
revoke all on function public.oraculo_ia_restantes() from public, anon;
grant execute on function public.oraculo_ia_restantes() to authenticated;

commit;
