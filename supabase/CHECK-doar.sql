-- CHECAGEM — só lê, não altera nada. Rode antes da migração de doação.
--
-- Da última vez esse hábito pegou um nome de tabela errado antes de qualquer
-- escrita. Aqui a migração toca em três tabelas e assume o formato de duas
-- colunas; se alguma suposição estiver errada, aparece abaixo em vez de virar
-- erro no meio de um `update`.
--
-- Espere ver: 6 linhas, todas com "OK".

with esperado as (
  select * from (values
    ('user_inventory', 'id'),
    ('user_inventory', 'user_id'),
    ('user_inventory', 'item_id'),
    ('user_inventory', 'is_equipped'),
    ('notifications',  'content'),
    ('notifications',  'metadata')
  ) as t(tabela, coluna)
)
select
  format('%s.%s', e.tabela, e.coluna) as verificacao,
  case when c.column_name is not null then 'OK' else 'FALTA — a migração vai quebrar' end as resultado,
  coalesce(c.data_type, '(sem essa coluna)') as detalhe
from esperado e
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = e.tabela and c.column_name = e.coluna

union all

-- A amizade é conferida nos dois sentidos; estas duas colunas são o vínculo.
select
  'friends.user_id + friend_id',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'friends'
      and column_name in ('user_id', 'friend_id')
  ) = 2 then 'OK' else 'FALTA — o vínculo tem outro formato' end,
  coalesce((
    select string_agg(column_name, ', ' order by column_name)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'friends'
  ), '(tabela friends não existe)')

union all

-- Se já existir, rodar de novo é `create or replace` e apenas substitui.
select
  'donate_item_to_friend',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'donate_item_to_friend'
  ) then 'JÁ EXISTE — rodar de novo só substitui' else 'ainda não existe (esperado)' end,
  '—';
