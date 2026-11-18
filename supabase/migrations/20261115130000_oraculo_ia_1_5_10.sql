-- ORACULO COM IA: 1, 5 E 10 MENSAGENS POR DIA (15/11/2026, com o Afonso).
--
-- Gratis 1, Premium 5, Platinum 10. 45 por dia no Platinum podia comer ate 42%
-- da receita de quem usasse tudo; com 10, o pior caso fica em ~9%. Staff e GM
-- seguem com 45, para testar sem travar.
--
-- So o limite muda: reservar e restantes ja leem daqui (e caem em 1 sem perfil,
-- desde 20261115120000). Pode ser rodado de novo sem estrago.

create or replace function public.oraculo_ia_limite(p_user_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select case
    when lower(coalesce(role, '')) in ('admin', 'gm', 'admin_gm') then 45
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now())
      and lower(coalesce(subscription_tier, 'premium')) = 'platinum' then 10
    when coalesce(is_premium, false) and (premium_expires_at is null or premium_expires_at > now()) then 5
    else 1 end
  from public.user_profiles where id = p_user_id;
$$;
