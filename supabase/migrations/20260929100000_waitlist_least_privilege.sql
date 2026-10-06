-- Waitlist: qualquer visitante pode se inscrever, mas ninguem le a lista.
-- A landing usa get_waitlist_count() quando precisar mostrar a contagem.
begin;

drop policy if exists "Allow anonymous select for count" on public.waitlist;

-- A policy RLS so funciona depois do grant. Remover o grant amplo evita que
-- uma policy futura acidentalmente reabra leitura/escrita da tabela inteira.
revoke all on table public.waitlist from anon, authenticated;
grant insert on table public.waitlist to anon, authenticated;

create or replace function public.get_waitlist_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.waitlist;
$$;

revoke all on function public.get_waitlist_count() from public;
grant execute on function public.get_waitlist_count() to anon, authenticated;

commit;
