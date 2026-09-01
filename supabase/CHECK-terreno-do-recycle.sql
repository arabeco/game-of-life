-- CHECAGEM — só lê, não altera nada.
--
-- As duas versões de `recycle_item` discordam sobre o terreno, e por isso nenhuma
-- das duas serve como está:
--
--   a de `text` procura `user_inventory.instance_id` — coluna que a listagem
--   anterior não mostrou, então provavelmente não existe;
--
--   a de `uuid` credita `user_profiles.fragments` como coluna, enquanto o baú
--   (que funciona) credita `user_profiles.wallet->fragments`, que é jsonb. Uma
--   das duas está escrevendo no lugar errado — e escrever no lugar errado é pior
--   do que falhar, porque some sem avisar.
--
-- Ela também depende de uma tabela `items` (com `recycle_value`) e de uma
-- `transactions`. Se `items` existir, o valor do fragmento mora no servidor e a
-- função nova pode lê-lo de lá. Se não existir, o valor teria de vir do cliente —
-- e preço que vem do cliente é preço que o cliente escolhe.
--
-- É a última coisa que eu preciso saber. Espere 5 linhas.

select '1. user_inventory.instance_id' as verificacao,
  case when exists (select 1 from information_schema.columns
                    where table_schema='public' and table_name='user_inventory' and column_name='instance_id')
       then 'EXISTE' else 'NAO EXISTE — a versao text esta quebrada' end as resultado,
  coalesce((select string_agg(column_name, ', ' order by column_name)
            from information_schema.columns
            where table_schema='public' and table_name='user_inventory'), '(sem tabela)') as detalhe

union all

select '2. tabela items',
  case when to_regclass('public.items') is not null then 'EXISTE' else 'NAO EXISTE — a versao uuid esta quebrada' end,
  coalesce((select string_agg(format('%s %s', column_name, data_type), ', ' order by column_name)
            from information_schema.columns
            where table_schema='public' and table_name='items'), '(sem tabela)')

union all

-- Se existir, o valor de cada item ja mora no servidor e a funcao nova le de la.
select '3. items tem recycle_value?',
  case when exists (select 1 from information_schema.columns
                    where table_schema='public' and table_name='items' and column_name='recycle_value')
       then 'SIM — o valor mora no servidor' else 'NAO — o valor teria de vir do cliente' end,
  coalesce((select format('%s itens cadastrados', (select count(*) from public.items)::text)
            where to_regclass('public.items') is not null), '—')

union all

-- O ponto que decide para ONDE creditar. As duas nao podem estar certas.
select '4. onde moram os fragmentos',
  case
    when exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='user_profiles' and column_name='fragments')
     and exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='user_profiles' and column_name='wallet')
      then 'AS DUAS existem — precisa decidir qual e a real'
    when exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='user_profiles' and column_name='wallet')
      then 'SO wallet (jsonb) — a versao uuid credita no lugar errado'
    else 'SO a coluna fragments — o bau estaria creditando errado' end,
  coalesce((select string_agg(format('%s %s', column_name, data_type), ', ' order by column_name)
            from information_schema.columns
            where table_schema='public' and table_name='user_profiles'
              and column_name in ('wallet', 'fragments', 'gold')), '(nenhuma das duas)')

union all

select '5. tabela transactions',
  case when to_regclass('public.transactions') is not null then 'EXISTE' else 'NAO EXISTE — o insert de log quebraria' end,
  coalesce((select string_agg(column_name, ', ' order by column_name)
            from information_schema.columns
            where table_schema='public' and table_name='transactions'), '(sem tabela)')

order by 1;
