-- ============================================================
-- QUEM CONCEDE PRIVILEGIO E O SERVIDOR, NAO A SESSAO DE QUEM PEDE.
--
-- O teste de QA achou uma conta comum ativando Premium direto no servidor.
-- Investigando, o buraco e maior e tem duas portas:
--
-- PORTA 1 (UPDATE). O app escreve o perfil com
-- `supabase.from('user_profiles').update(...)` na propria linha. A lista de
-- campos permitidos vive no CLIENTE — ela decide o que o app manda, nunca o que
-- o banco aceita. Com o proprio JWT, qualquer pessoa chama a REST API do
-- Supabase e escreve is_premium, subscription_tier, premium_expires_at e role.
-- Nao precisa nem abrir o app.
--
-- PORTA 2 (INSERT). enforce_closed_beta_user_profile_insert libera o portao do
-- beta fechado quando `new.role in ('admin','admin_gm','gm')` — ou seja, olha o
-- papel da LINHA que esta entrando, e nao o de quem esta inserindo. Quem criasse
-- o proprio perfil como admin pulava o convite E ja nascia com papel de staff.
--
-- POR QUE `role` E PIOR QUE `is_premium`: ele nao e enfeite de tela, o banco o
-- honra. Em premium_mentor_codex_rules, `role in ('admin','gm','admin_gm')` da
-- acesso premium; aqui mesmo, pula o convite. Um campo, tres privilegios.
--
-- ISTO NAO QUEBRA A COMPRA. O caminho legitimo ja e todo servidor: a edge
-- function google-play-purchase valida com o Google e chama
-- process_approved_membership_payment, que roda com service_role e e quem
-- escreve is_premium/premium_expires_at/subscription_tier. A escrita que o app
-- fazia depois era espelho, e saiu do cliente no mesmo commit que este arquivo.
--
-- O QUE ESTE ARQUIVO NAO PROTEGE: chests, wallet, nobility, level,
-- unlockedItems. O app escreve esses o tempo todo — abrir bau, ganhar XP — e
-- tranca-los hoje quebraria o jogo. Cada um precisa virar RPC antes. Fica
-- registrado: hoje a economia e editavel pelo dono da conta.
-- ============================================================

-- Quem esta chamando, e nao o que esta sendo escrito.
--
-- Le as duas formas: `request.jwt.claim.role` (a que o trigger do beta ja usava)
-- e `request.jwt.claims` em JSON (a forma atual). SQL direto no painel nao tem
-- nenhuma das duas e cai em 'postgres', que passa de proposito — senao voce
-- perde a chave da propria casa.
create or replace function public.quem_chama_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := lower(coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), ''));
  if v_role <> '' then
    return v_role;
  end if;

  begin
    v_role := lower(coalesce(
      nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''),
      ''
    ));
  exception when others then
    v_role := '';
  end;

  if v_role <> '' then
    return v_role;
  end if;

  return 'postgres';
end;
$$;


-- ============================================================
-- PORTA 1 — UPDATE: congela os campos de privilegio.
--
-- CONGELA em vez de dar erro, de proposito. O app manda o perfil inteiro em
-- toda atualizacao; levantar excecao faria qualquer troca de apelido explodir.
-- Assim a escrita ilegitima vira um no-op silencioso e o app nao percebe.
-- ============================================================
create or replace function public.guard_user_profile_grants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.quem_chama_role() in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  new.role               := old.role;
  new.is_premium         := old.is_premium;
  new.premium_expires_at := old.premium_expires_at;
  new.subscription_tier  := old.subscription_tier;

  return new;
end;
$$;

drop trigger if exists guard_user_profile_grants on public.user_profiles;

create trigger guard_user_profile_grants
before update on public.user_profiles
for each row
execute function public.guard_user_profile_grants();


-- ============================================================
-- PORTA 2 — INSERT: ninguem nasce com papel que nao pediu.
--
-- Conta nova entra como 'user', sem premium. Semear staff continua possivel
-- pelo service_role ou por SQL direto, que e de onde isso deve vir.
-- ============================================================
create or replace function public.guard_user_profile_insert_grants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.quem_chama_role() in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  new.role               := 'user';
  new.is_premium         := false;
  new.premium_expires_at := null;
  new.subscription_tier  := null;

  return new;
end;
$$;

drop trigger if exists guard_user_profile_insert_grants on public.user_profiles;

-- Roda ANTES do enforce_closed_beta (ordem alfabetica do nome do gatilho), entao
-- quando o portao do beta olhar `new.role` ele ja vai ver 'user'. E o que fecha
-- a brecha sem precisar reescrever aquele trigger.
create trigger guard_user_profile_insert_grants
before insert on public.user_profiles
for each row
execute function public.guard_user_profile_insert_grants();


-- ============================================================
-- E o portao do beta para de confiar no papel da propria linha.
--
-- Mesmo com o gatilho acima cobrindo, esta funcao fica correta sozinha: o
-- desvio de staff passa a exigir que QUEM CHAMA seja servico, nao que a linha
-- se declare admin. Defesa que nao depende de ordem de gatilho.
-- ============================================================
create or replace function public.enforce_closed_beta_user_profile_insert()
returns trigger
language plpgsql
set search_path = public, auth
as $$
declare
  v_has_invite boolean := false;
begin
  if public.quem_chama_role() in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  select exists(
    select 1
    from public.golden_invites
    where claimed_by_user_id = new.id
      and is_used = true
  )
  into v_has_invite;

  if not v_has_invite then
    raise exception 'CLOSED_BETA_INVITE_REQUIRED';
  end if;

  return new;
end;
$$;


-- ============================================================
-- O QUE SE VIU AO APLICAR (2026-09-14)
--
-- 1. Os dois gatilhos novos entraram: guard_user_profile_grants e
--    guard_user_profile_insert_grants.
--
-- 2. NAO existe gatilho enforce_closed_beta_user_profile_insert nesta base — o
--    convite dourado foi desligado ha tempo, de proposito. O `create or replace`
--    da funcao acima e portanto INERTE: ela fica corrigida caso um dia o beta
--    fechado volte, mas ninguem a chama hoje. Nao ha o que reativar.
--
--    A escalacao por INSERT continua fechada de qualquer forma: quem cuida disso
--    e guard_user_profile_insert_grants, que forca role='user' sem depender
--    daquele portao.
--
-- 3. A varredura achou ~350 perfis com premium=true e role fora de 'user'. Todos
--    com prefixo de suite automatizada (campaign-quiz, clan-create-rich,
--    mentorship-*, notif-lab, onboarding-smoke, oracle-smoke, season-clan-*).
--    Era o robo se concedendo Premium pelo buraco que este arquivo fecha — o que
--    confirma que a porta estava aberta e que ela era usada. Contas de notif-lab
--    estavam como 'gm'.
--
--    Nenhuma conta humana inesperada apareceu.
-- ============================================================
