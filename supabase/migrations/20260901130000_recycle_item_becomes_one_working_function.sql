begin;

-- Quebrar item passa a existir de verdade.
--
-- Havia DUAS `recycle_item`, com o mesmo nome de argumento e tipos diferentes.
-- O app manda string JSON, as duas aceitam string, o PostgREST nao consegue
-- escolher e recusa a chamada com PGRST203 — que chegava na tela como "Falha na
-- sincronizacao de dados". Era a falha do item 7 do checklist.
--
-- E as duas estavam quebradas, o que ninguem podia descobrir enquanto a chamada
-- nao chegava a nenhuma delas:
--
--   text   procurava `user_inventory.instance_id`. A coluna nao existe; a tabela
--          tem `id`. E dava 10 fragmentos fixos, com o comentario "Simplified".
--
--   uuid   lia o item certo, mas creditava `user_profiles.fragments`, coluna
--          escalar que o app nao le. O app le `wallet->fragments`, e e nela que
--          o bau credita — o bau foi testado no aparelho e o saldo caiu. Ou seja:
--          quebrar item sumiria com o item e nao daria fragmento nenhum.
--
-- Por isso remover uma e manter a outra nao consertava nada: mantinha a quebrada.
-- As duas saem e nasce uma.
--
-- FICA `uuid` porque `user_inventory.id` e uuid e e isso que o app envia. Com
-- assinatura unica, a ambiguidade do PostgREST desaparece por construcao.
--
-- O VALOR vem de `items.recycle_value`, nao por parametro. Preco que vem do
-- cliente e preco que o cliente escolhe — a mesma regra do bau.

do $$
begin
  if to_regclass('public.user_inventory') is null then
    raise exception 'RECYCLE_MISSING: public.user_inventory';
  end if;
  if to_regclass('public.items') is null then
    raise exception 'RECYCLE_MISSING: public.items';
  end if;
  if to_regclass('public.user_profiles') is null then
    raise exception 'RECYCLE_MISSING: public.user_profiles';
  end if;
end;
$$;

drop function if exists public.recycle_item(text);
drop function if exists public.recycle_item(uuid);

create or replace function public.recycle_item(p_item_instance_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $fn$
declare
  v_uid uuid := auth.uid();
  v_item_id text;
  v_valor integer;
  v_equipado boolean;
  v_wallet jsonb;
  v_fragmentos integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- `for update of u` trava a linha do inventario e so ela: `items` e catalogo,
  -- lido por todo mundo. Sem a trava, dois toques rapidos no mesmo item o
  -- quebrariam duas vezes e creditariam em dobro.
  select u.item_id, i.recycle_value, coalesce(u.is_equipped, false)
  into v_item_id, v_valor, v_equipado
  from public.user_inventory u
  join public.items i on i.id = u.item_id
  where u.id = p_item_instance_id
    and u.user_id = v_uid
  for update of u;

  if v_item_id is null then
    raise exception 'ITEM_NOT_OWNED';
  end if;

  -- Item equipado nao quebra. Ele sumiria de cima da pessoa e o perfil ficaria
  -- apontando para um item que nao existe mais. E a mesma regra da doacao.
  if v_equipado then
    raise exception 'ITEM_EQUIPPED';
  end if;

  v_valor := coalesce(v_valor, 0);

  delete from public.user_inventory
  where id = p_item_instance_id and user_id = v_uid;

  select coalesce(wallet, '{"gold": 0, "fragments": 0}'::jsonb) into v_wallet
  from public.user_profiles
  where id = v_uid
  for update;

  v_fragmentos := coalesce((v_wallet->>'fragments')::integer, 0);

  update public.user_profiles
  set wallet = jsonb_set(v_wallet, '{fragments}', to_jsonb(v_fragmentos + v_valor))
  where id = v_uid;

  return jsonb_build_object(
    'success', true,
    'item_id', v_item_id,
    'fragments_gained', v_valor
  );
end;
$fn$;

revoke all on function public.recycle_item(uuid) from public;
grant execute on function public.recycle_item(uuid) to authenticated;

-- O botao no app mostra o valor calculado por PATAMAR, do lado do cliente. O
-- servidor credita o valor POR ITEM. Enquanto os dois concordarem, ninguem nota;
-- quando discordarem, o botao mente sobre quanto vai pagar. Isto so conta quantos
-- discordam — nao altera dado nenhum.
do $$
declare
  v_divergentes integer;
  v_sem_valor integer;
begin
  select count(*) into v_divergentes
  from public.items
  where coalesce(recycle_value, 0) is distinct from case coalesce(tier, 1)
    when 1 then 10 when 2 then 30 when 3 then 100
    when 4 then 300 when 5 then 1000 when 6 then 3000 else 0 end;

  select count(*) into v_sem_valor
  from public.items where coalesce(recycle_value, 0) = 0;

  raise notice 'items com recycle_value diferente da tabela por patamar do app: %', v_divergentes;
  raise notice 'items que pagariam ZERO ao quebrar: %', v_sem_valor;
end;
$$;

commit;
