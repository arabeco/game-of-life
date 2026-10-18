-- O SALDO SE CONGELA EM VEZ DE RECUSAR (18/10/2026, teste do Luigi).
--
-- O QUE QUEBROU. Conta nova nao ganhava perfil: a tela "Como posso chamar
-- voce?" dava "Nao consegui salvar" e o Luigi nao passava do cadastro.
--
-- O app cria o perfil com um UPSERT (SupabaseService.syncUserProfile), e upsert
-- e INSERT ... ON CONFLICT DO UPDATE. O Postgres exige permissao de UPDATE em
-- TODA coluna enviada, mesmo quando nao ha conflito. Desde 23/09
-- (o_saldo_nao_se_escreve_a_mao, quem_cobra_entrega) ouro, fragmentos, carteira,
-- baus e premium nao tem UPDATE para `authenticated`, e o AAB 112 ainda manda
-- essas colunas: o banco recusava a linha inteira.
--
-- O app ja foi corrigido (o upsert parou de mandar essas colunas), mas isso so
-- chega num AAB novo. Este arquivo destrava o 112 pelo banco.
--
-- COMO, SEM REABRIR O SALDO. Mesma tecnica do guard_user_profile_grants de
-- 14/09 para o premium: CONGELA em vez de dar erro. A permissao de UPDATE volta
-- nessas cinco colunas, e um gatilho devolve o valor antigo sempre que quem
-- escreve e o proprio app. A escrita ilegitima vira um no-op silencioso.
--
-- QUEM E "O PROPRIO APP": `current_user = 'authenticated'`. O gatilho e
-- SECURITY INVOKER de proposito: num UPDATE vindo direto do PostgREST,
-- current_user e `authenticated`; dentro das RPCs SECURITY DEFINER (loja,
-- recompensas, baus), e o dono da funcao; no service_role, e `service_role`.
-- Por isso NAO se usa quem_chama_role() aqui: ela le o JWT, que continua
-- `authenticated` dentro das RPCs, e congelaria as recompensas legitimas.
--
-- Provado antes em Postgres local: upsert de conta nova passa; o app tentar se
-- dar ouro ou premium nao muda nada; recompensa por RPC SECURITY DEFINER entra;
-- upsert de perfil existente nao mexe no saldo.

begin;

grant update (gold, fragments, wallet, chests, is_premium)
  on table public.user_profiles to authenticated;

create or replace function public.saldo_congelado_no_cliente()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user = 'authenticated' then
    new.gold       := old.gold;
    new.fragments  := old.fragments;
    new.wallet     := old.wallet;
    new.chests     := old.chests;
    new.is_premium := old.is_premium;
  end if;
  return new;
end;
$$;

revoke all on function public.saldo_congelado_no_cliente() from public, anon, authenticated;

drop trigger if exists saldo_congelado_no_cliente on public.user_profiles;
create trigger saldo_congelado_no_cliente
  before update on public.user_profiles
  for each row execute function public.saldo_congelado_no_cliente();

commit;
