-- O JARDIM DO AMIGO, E A ESCADA DOS ITENS.
--
-- Duas coisas independentes, na mesma migracao porque as duas sao ajuste do que
-- a migracao anterior (20260909180000) deixou pela metade.
--
-- Aplicar inteiro no SQL Editor do projeto correto.
begin;

-- ---------------------------------------------------------------- 1. A VISITA
--
-- `user_gardens_3d` nasceu com uma unica policy: `using(user_id = auth.uid())`.
-- So o dono le. Mas o app JA TEM a preferencia "Mostrar meu jardim" em Config,
-- com tres escopos (all / friends / nobody), e o orbe do jardim JA APARECE no
-- perfil de quem te deixou ver — ele so nao tinha o que carregar.
--
-- A leitura de terceiro nao pode virar policy de SELECT direto: a regra depende
-- da tabela de amizades e do escopo do dono, e uma policy que faz esse join fica
-- cara em toda leitura. Uma funcao `security definer` decide uma vez, devolve o
-- documento ou NULL, e mantem a tabela fechada como esta.
--
-- NULL e resposta, nao erro: "nao existe" e "voce nao pode ver" devolvem a mesma
-- coisa de proposito. Distinguir os dois contaria a quem esta olhando que aquela
-- pessoa TEM um jardim escondido, que e justamente o que 'nobody' quer negar.
create or replace function public.load_garden_3d(p_owner uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_scope text;
  v_state jsonb;
  v_revision bigint;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_owner is null then return null; end if;

  if p_owner <> v_uid then
    select coalesce(garden_visibility, 'friends') into v_scope
      from public.user_profiles where id = p_owner;

    if not found or v_scope = 'nobody' then return null; end if;

    -- A tabela `friends` grava UM lado do vinculo (quem aceitou insere
    -- user_id=remetente, friend_id=destinatario), entao a checagem tem que
    -- olhar as duas direcoes ou metade das amizades reprovaria.
    if v_scope = 'friends' and not exists (
      select 1 from public.friends
      where (user_id = v_uid    and friend_id = p_owner)
         or (user_id = p_owner  and friend_id = v_uid)
    ) then
      return null;
    end if;
  end if;

  select state, revision into v_state, v_revision
    from public.user_gardens_3d where user_id = p_owner;

  if not found then return null; end if;

  -- `own` evita que o cliente decida sozinho se pode editar: quem responde se o
  -- jardim e seu e o servidor, na mesma resposta que traz o documento.
  return jsonb_build_object('state', v_state, 'revision', v_revision, 'own', p_owner = v_uid);
end; $$;

revoke all on function public.load_garden_3d(uuid) from public, anon;
grant execute on function public.load_garden_3d(uuid) to authenticated;

-- ------------------------------------------------------------- 2. OS DEGRAUS
--
-- Os cinco itens entraram todos como tier 5 / legendary a 340-500 de ouro. Dois
-- efeitos indesejados: nenhum era acessivel (era o teto absoluto da loja, ao
-- lado do Orbe Soberano), e como `open_chest` NAO filtra por categoria, os cinco
-- caiam de uma vez no pool lendario e diluiam tudo que ja estava la.
--
-- Agora cada um ocupa um degrau, com os precos dentro das faixas que o catalogo
-- ja pratica, e reciclagem/forja seguindo a mesma tabela por tier que o
-- tools/generate-items-sql.mjs usa (RECYCLE 10/30/100/300/1000, CRAFT
-- 40/120/400/1200/4000). Sobra UM lendario, o Genesis, caro de proposito.
update public.items set tier=2, rarity='uncommon',  gold_price=45,  recycle_value=30,   craft_cost=120  where id='garden_base_path';
update public.items set tier=3, rarity='rare',      gold_price=110, recycle_value=100,  craft_cost=400  where id='garden_base_pond';
update public.items set tier=4, rarity='epic',      gold_price=210, recycle_value=300,  craft_cost=1200 where id='garden_kit_luxury';
update public.items set tier=4, rarity='epic',      gold_price=260, recycle_value=300,  craft_cost=1200 where id='garden_base_river';
update public.items set tier=5, rarity='legendary', gold_price=480, recycle_value=1000, craft_cost=4000 where id='garden_kit_genesis';

commit;
