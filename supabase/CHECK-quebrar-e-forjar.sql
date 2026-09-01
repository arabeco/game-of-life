-- CHECAGEM — só lê, não altera nada.
--
-- O item 7 do checklist falhou com "Falha na sincronização de dados". Esse texto
-- é o que o app diz quando a chamada ao banco volta com erro, QUALQUER erro: a
-- função não existir, faltar permissão, ou faltar fragmento dão a mesma frase.
-- Por isso ele não consegue dizer o que aconteceu, e por isso isto aqui existe.
--
-- A suspeita concreta: `recycle_item` e `craft_item` são chamadas pelo app e
-- **não têm definição em migração nenhuma deste repositório**. Se existem, foram
-- criadas à mão em algum momento. Se nunca existiram, o botão de quebrar item
-- estava chamando o vazio desde que deixou de ser simulação.
--
-- Espere ver 4 linhas. As duas primeiras são as que decidem.

select
  '1. recycle_item existe?' as verificacao,
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'recycle_item'
  ) then 'EXISTE' else 'NAO EXISTE — é esta a falha do item 7' end as resultado,
  coalesce((
    select string_agg(format('(%s) -> %s',
             pg_get_function_arguments(p.oid),
             pg_get_function_result(p.oid)), ' | ')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'recycle_item'
  ), 'o app chama com p_item_instance_id e espera {success, fragments_gained}') as detalhe

union all

select
  '2. craft_item existe?',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'craft_item'
  ) then 'EXISTE' else 'NAO EXISTE — o botão Forjar cai no mesmo buraco' end,
  coalesce((
    select string_agg(format('(%s) -> %s',
             pg_get_function_arguments(p.oid),
             pg_get_function_result(p.oid)), ' | ')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'craft_item'
  ), 'o app chama com p_tier, p_category, p_exact_item_id')

union all

-- Existir e poder ser chamada são coisas diferentes: uma função sem grant para
-- `authenticated` responde "permission denied" e o app mostra a mesma frase.
select
  '3. quem pode executar',
  coalesce((
    select string_agg(format('%s: %s', p.proname,
             case when has_function_privilege('authenticated', p.oid, 'execute')
                  then 'authenticated PODE' else 'authenticated NAO PODE — falta grant' end), ' · ' order by p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('recycle_item', 'craft_item')
  ), 'nenhuma das duas existe, então não há permissão para conferir'),
  '—'

union all

-- Se a 1 disser EXISTE, o problema não é ausência e sim o que ela faz por dentro.
-- Estas são as colunas que ela precisaria tocar.
select
  '4. o terreno que elas usariam',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'user_inventory'
      and column_name in ('id', 'user_id', 'item_id')
  ) = 3 then 'OK' else 'FALTA COLUNA em user_inventory' end,
  coalesce((
    select string_agg(column_name, ', ' order by column_name)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_inventory'
  ), '(tabela não existe)')

order by 1;
