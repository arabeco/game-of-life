do $$
declare
  constraint_row record;
  index_row record;
begin
  for constraint_row in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'user_inventory'
      and con.contype = 'u'
      and (
        select array_agg(att.attname::text order by att.attname::text)
        from unnest(con.conkey) key(attnum)
        join pg_attribute att on att.attrelid = rel.oid and att.attnum = key.attnum
      ) = array['item_id', 'user_id']
  loop
    execute format('alter table public.user_inventory drop constraint %I', constraint_row.conname);
  end loop;

  for index_row in
    select cls.relname as indexname
    from pg_index ind
    join pg_class cls on cls.oid = ind.indexrelid
    join pg_class rel on rel.oid = ind.indrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'user_inventory'
      and ind.indisunique
      and not exists (
        select 1
        from pg_constraint con
        where con.conindid = ind.indexrelid
      )
      and (
        select array_agg(att.attname::text order by att.attname::text)
        from unnest(ind.indkey) key(attnum)
        join pg_attribute att on att.attrelid = rel.oid and att.attnum = key.attnum
      ) = array['item_id', 'user_id']
  loop
    execute format('drop index if exists public.%I', index_row.indexname);
  end loop;
end $$;
