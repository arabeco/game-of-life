begin;

-- Quebrar item volta a funcionar.
--
-- `recycle_item` existe DUAS vezes, com o mesmo nome de argumento e tipos
-- diferentes: `(p_item_instance_id text)` e `(p_item_instance_id uuid)`.
--
-- O app manda o argumento como string JSON. As duas aceitam string, o PostgREST
-- nao tem como escolher e recusa a chamada inteira com PGRST203. Nada do lado do
-- app conserta isso: a chamada nunca chega ao banco. Era a falha do item 7 do
-- checklist, e a razao de "Falha na sincronizacao de dados" aparecer sem causa.
--
-- `craft_item` tem assinatura unica. Por isso Forjar seguia funcionando enquanto
-- Quebrar nao — o que bate exatamente com o que foi testado no aparelho.
--
-- O QUE ESTA MIGRACAO NAO FAZ: reescrever o corpo. Eu nao sei de onde o servidor
-- tira o patamar do item para calcular os fragmentos — nao ha tabela de itens
-- neste repositorio — entao qualquer corpo que eu escrevesse seria chute com
-- cara de conserto. A que fica, fica intacta.
--
-- FICA A DE `uuid`, porque `user_inventory.id` e uuid e e isso que o app envia.
--
-- E ela so e escolhida se as duas forem a MESMA coisa. Se os corpos divergirem,
-- uma delas e uma versao que a outra ja substituiu, e escolher no escuro trocaria
-- um defeito visivel por um silencioso. Nesse caso isto aqui aborta sem apagar
-- nada e diz o que fazer.

do $$
declare
  v_corpo_text text;
  v_corpo_uuid text;
begin
  select p.prosrc into v_corpo_text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'recycle_item'
    and pg_get_function_identity_arguments(p.oid) = 'text';

  select p.prosrc into v_corpo_uuid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'recycle_item'
    and pg_get_function_identity_arguments(p.oid) = 'uuid';

  -- Ja arrumado, ou arrumado por outro caminho: nao ha o que fazer.
  if v_corpo_text is null and v_corpo_uuid is not null then
    raise notice 'recycle_item ja tem assinatura unica (uuid). Nada a fazer.';
    return;
  end if;

  if v_corpo_uuid is null then
    raise exception 'RECYCLE_FIX_ABORTED: nao existe recycle_item(uuid); nao vou apagar a unica que existe';
  end if;

  -- A comparacao ignora espaco em branco: as duas podem ter sido coladas em
  -- momentos diferentes, com indentacao diferente e a mesma logica.
  if regexp_replace(v_corpo_text, '\s+', '', 'g') is distinct from regexp_replace(v_corpo_uuid, '\s+', '', 'g') then
    raise exception 'RECYCLE_FIX_ABORTED: os dois corpos sao DIFERENTES. Rode supabase/CHECK-recycle-duplicado.sql e mande as duas antes de escolher.';
  end if;

  -- Iguais: a de `text` e copia, e some sem levar nada junto.
  drop function public.recycle_item(text);
  raise notice 'recycle_item(text) removida. Sobrou a de uuid, intacta.';
end;
$$;

-- Garantia de que a que ficou continua chamavel pelo app. Se a duplicidade nasceu
-- de duas criacoes a mao, os grants podem ter ficado so em uma delas.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'recycle_item'
      and pg_get_function_identity_arguments(p.oid) = 'uuid'
  ) then
    execute 'revoke all on function public.recycle_item(uuid) from public';
    execute 'grant execute on function public.recycle_item(uuid) to authenticated';
  end if;
end;
$$;

commit;
