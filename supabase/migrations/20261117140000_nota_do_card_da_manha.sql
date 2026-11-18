-- O JOINHA DO CARD DA MANHA COM IA (17/11/2026, com o Afonso).
--
-- O card com IA guarda em context_snapshot.cardIa o tipo e o assunto; a nota
-- (1 = joinha, -1 = polegar para baixo, 0 = tirar) vai junto, e a rotina da
-- manha usa para escolher os proximos tipos. So o dono do card avalia, e so
-- card com IA.
create or replace function public.avaliar_card_do_oraculo(p_message uuid, p_nota integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_nota is null or p_nota not in (-1, 0, 1) then raise exception 'INVALID_NOTE'; end if;
  update public.oracle_messages
     set context_snapshot = jsonb_set(context_snapshot, '{cardIa,nota}', to_jsonb(p_nota))
   where id = p_message
     and user_id = auth.uid()
     and jsonb_typeof(context_snapshot -> 'cardIa') = 'object';
  if not found then raise exception 'CARD_NOT_FOUND'; end if;
end;
$$;

revoke all on function public.avaliar_card_do_oraculo(uuid, integer) from public, anon;
grant execute on function public.avaliar_card_do_oraculo(uuid, integer) to authenticated;
