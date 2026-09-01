-- CHECAGEM — só lê, não altera nada.
--
-- Diz o que já foi aplicado e o que falta das migrações desta leva, e confere as
-- suposições da que ainda não rodou. Rodar isto antes evita descobrir o terreno
-- pelo erro — hábito que já pegou um nome de tabela errado e um insert com as
-- colunas erradas antes de qualquer escrita.

-- ── O QUE JÁ ESTÁ NO AR ──────────────────────────────────────────────────────

select
  '1. baú por fragmento' as migracao,
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'buy_chest_with_fragments'
  ) then 'APLICADA' else 'FALTA RODAR — 20260829120000' end as situacao,
  'compra de baú na aba Itens' as para_que

union all

select
  '2. linha do tempo do humor',
  case when to_regclass('public.mood_entries') is not null
       then 'APLICADA' else 'FALTA RODAR — 20260831120000' end,
  'gráfico no modal de humor'

union all

select
  '3. doar item para amigo',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'donate_item_to_friend'
  ) then 'APLICADA' else 'FALTA RODAR — 20260831140000' end,
  'botão Doar no modal do item'

union all

-- ── AS SUPOSIÇÕES DA MIGRAÇÃO DE DOAÇÃO ─────────────────────────────────────
-- Só importam se a 3 acima disser FALTA RODAR.

select
  '   ↳ user_inventory (id, user_id, item_id, is_equipped)',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'user_inventory'
      and column_name in ('id', 'user_id', 'item_id', 'is_equipped')
  ) = 4 then 'OK' else 'FALTA COLUNA — a migração vai quebrar' end,
  coalesce((
    select string_agg(column_name, ', ' order by column_name)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'user_inventory'
      and column_name in ('id', 'user_id', 'item_id', 'is_equipped')
  ), '(tabela não existe)')

union all

-- A amizade é conferida nos dois sentidos, porque a tabela guarda o vínculo de
-- um lado só dependendo de quem aceitou.
select
  '   ↳ friends (user_id, friend_id)',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'friends'
      and column_name in ('user_id', 'friend_id')
  ) = 2 then 'OK' else 'FALTA — o vínculo tem outro formato' end,
  coalesce((
    select string_agg(column_name, ', ' order by column_name)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'friends'
  ), '(tabela não existe)')

union all

-- Estas duas colunas já me pegaram: escrevi o insert com title/body/data e o
-- schema real usa content/metadata.
select
  '   ↳ notifications (content, metadata)',
  case when (
    select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications'
      and column_name in ('content', 'metadata')
  ) = 2 then 'OK' else 'FALTA — o insert da notificação vai quebrar' end,
  coalesce((
    select string_agg(format('%s %s', column_name, data_type), ', ' order by column_name)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications'
      and column_name in ('content', 'metadata')
  ), '(tabela não existe)')

order by 1;
