-- O ORACULO COM IA CONTA MENSAGENS, NAO CONVERSAS (04/11/2026, com o Afonso).
--
-- A conversa de 3 mensagens fechava sozinha depois de 20 minutos parada, e o
-- que sobrava dela se perdia sem a pessoa ver: a conversa acabava do nada.
-- Agora a conta e simples, e a pessoa ve o numero junto da caixa de escrever:
--
--   - gratis 3 mensagens por dia, Premium 15, Platinum 45 (staff e GM, 45);
--   - nao ha janela nem conversa: cada mensagem entregue conta uma;
--   - so conta o que foi entregue: se a IA falhar, a mensagem e devolvida.
--
-- O mesmo total de antes (1, 5 e 15 conversas de 3 mensagens). Substitui
-- oraculo_ia_limite, oraculo_ia_reservar, oraculo_ia_devolver e
-- oraculo_ia_restantes; oraculo_ia_uso.usadas passa a contar mensagens. No dia
-- em que rodar, as conversas ja usadas contam como 1 mensagem cada, a favor da
-- pessoa. Pode ser rodado de novo sem estrago.

begin;

create or replace function public.oraculo_ia_limite(p_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case
    when lower(coalesce(role, '')) in ('admin', 'gm', 'admin_gm') then 45
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now())
      and lower(coalesce(subscription_tier, 'premium')) = 'platinum' then 45
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now()) then 15
    else 3 end
  from public.user_profiles where id = p_user_id;
$$;

-- Reserva a proxima mensagem, se ainda houver hoje. Atomica.
create or replace function public.oraculo_ia_reservar(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(p_user_id), 3);
  v_dia date := public.oraculo_ia_dia();
  v_usadas integer;
begin
  insert into public.oraculo_ia_uso (user_id, dia, usadas) values (p_user_id, v_dia, 0)
  on conflict (user_id, dia) do nothing;

  update public.oraculo_ia_uso set usadas = usadas + 1
  where user_id = p_user_id and dia = v_dia and usadas < v_limite
  returning usadas into v_usadas;

  if not found then
    select usadas into v_usadas from public.oraculo_ia_uso where user_id = p_user_id and dia = v_dia;
    return jsonb_build_object('ok', false, 'usadas', v_usadas, 'limite', v_limite, 'mensagens', 0);
  end if;

  return jsonb_build_object('ok', true, 'usadas', v_usadas, 'limite', v_limite, 'mensagens', v_limite - v_usadas);
end;
$$;

-- A IA falhou: devolve a mensagem. O segundo parametro ficou so para a funcao
-- antiga continuar chamando sem erro ate a nova ser publicada.
create or replace function public.oraculo_ia_devolver(p_user_id uuid, p_conversa_nova boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.oraculo_ia_uso set usadas = greatest(0, usadas - 1)
  where user_id = p_user_id and dia = public.oraculo_ia_dia();
end;
$$;

-- O que o app mostra: as mensagens que ainda cabem hoje.
create or replace function public.oraculo_ia_restantes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(auth.uid()), 3);
  v_usadas integer := coalesce((select usadas from public.oraculo_ia_uso where user_id = auth.uid() and dia = public.oraculo_ia_dia()), 0);
begin
  return jsonb_build_object('usadas', v_usadas, 'limite', v_limite, 'mensagens', greatest(0, v_limite - v_usadas));
end;
$$;

-- A conversa acabou como conceito: a tabela e a funcao dela ficam sem uso.
drop function if exists public.oraculo_ia_mensagens_por_conversa();
drop table if exists public.oraculo_ia_conversa;

revoke all on function public.oraculo_ia_reservar(uuid) from public, anon, authenticated;
revoke all on function public.oraculo_ia_devolver(uuid, boolean) from public, anon, authenticated;
grant execute on function public.oraculo_ia_reservar(uuid) to service_role;
grant execute on function public.oraculo_ia_devolver(uuid, boolean) to service_role;
revoke all on function public.oraculo_ia_restantes() from public, anon;
grant execute on function public.oraculo_ia_restantes() to authenticated;

commit;
