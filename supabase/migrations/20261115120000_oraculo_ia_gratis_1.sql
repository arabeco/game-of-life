-- O GRATIS DO ORACULO COM IA PASSA DE 3 PARA 1 MENSAGEM POR DIA (15/11/2026, com o Afonso).
--
-- Uma por dia da o gosto: a pessoa ve que ele conhece a rotina dela, e o "quero
-- mais" vira motivo para o Premium. Premium continua 15, Platinum e staff 45.
-- Com 1 por dia toda resposta gratis ja e a ultima do dia, entao sai fechada,
-- sem terminar em pergunta (regra ULTIMA_DO_DIA da funcao).
--
-- So muda o numero do gratis: as tres funcoes sao as de 20261104120000, com o
-- 3 trocado por 1. Pode ser rodado de novo sem estrago.

begin;

create or replace function public.oraculo_ia_limite(p_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case
    when lower(coalesce(role, '')) in ('admin', 'gm', 'admin_gm') then 45
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now())
      and lower(coalesce(subscription_tier, 'premium')) = 'platinum' then 45
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now()) then 15
    else 1 end
  from public.user_profiles where id = p_user_id;
$$;

create or replace function public.oraculo_ia_reservar(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(p_user_id), 1);
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

create or replace function public.oraculo_ia_restantes()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_limite integer := coalesce(public.oraculo_ia_limite(auth.uid()), 1);
  v_usadas integer := coalesce((select usadas from public.oraculo_ia_uso where user_id = auth.uid() and dia = public.oraculo_ia_dia()), 0);
begin
  return jsonb_build_object('usadas', v_usadas, 'limite', v_limite, 'mensagens', greatest(0, v_limite - v_usadas));
end;
$$;

commit;
