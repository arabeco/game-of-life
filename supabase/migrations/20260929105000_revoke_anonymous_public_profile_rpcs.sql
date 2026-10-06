-- Supabase pode manter EXECUTE em funcoes novas por grants/default privileges.
-- A fronteira publica destas RPCs exige sessao autenticada tambem no ACL,
-- nao apenas na checagem auth.uid() interna.
begin;

revoke all on function public.search_public_profiles(text) from public, anon;
revoke all on function public.get_public_profile_data(uuid) from public, anon;
revoke all on function public.ensure_my_starter_rewards() from public, anon;

grant execute on function public.search_public_profiles(text) to authenticated;
grant execute on function public.get_public_profile_data(uuid) to authenticated;
grant execute on function public.ensure_my_starter_rewards() to authenticated;

commit;
