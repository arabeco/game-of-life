-- A COROA DE QUEM ASSINA, VISTA PELOS OUTROS (13/10/2026).
--
-- O cartao publico (get_public_profile_cards) nao diz se a pessoa assina, entao
-- a coroa do Premium/Platinum so aparecia no proprio perfil. Esta funcao devolve
-- QUAIS dos ids pedidos tem assinatura ativa — so isso. Plano, data de
-- vencimento e o resto da linha continuam de fora.
--
-- Staff (gm/admin) nao ganha coroa aqui: a coroa diz "assina", e nao "tem acesso".
--
-- Pode ser rodado de novo sem estrago.

begin;

create or replace function public.coroas_de(p_user_ids uuid[])
returns uuid[]
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_user_ids is null or cardinality(p_user_ids) = 0 then
    return array[]::uuid[];
  end if;
  if cardinality(p_user_ids) > 300 then
    raise exception 'TOO_MANY_IDS';
  end if;
  return coalesce((
    select array_agg(up.id order by up.id)
    from public.user_profiles up
    where up.id = any(p_user_ids)
      and coalesce(up.is_premium, false)
      and up.premium_expires_at > now()
  ), array[]::uuid[]);
end;
$$;

revoke all on function public.coroas_de(uuid[]) from public, anon;
grant execute on function public.coroas_de(uuid[]) to authenticated;

commit;
notify pgrst, 'reload schema';
