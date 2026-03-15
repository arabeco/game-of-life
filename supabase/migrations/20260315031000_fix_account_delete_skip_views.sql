create or replace function public._delete_public_rows_if_uuid_match(
  p_table_name text,
  p_column_name text,
  p_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = p_table_name
      and table_type = 'BASE TABLE'
  ) then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table_name
      and column_name = p_column_name
  ) then
    execute format('delete from public.%I where %I = $1', p_table_name, p_column_name)
    using p_value;
  end if;
end;
$$;

create or replace function public._delete_public_rows_if_any_uuid_match(
  p_table_name text,
  p_column_names text[],
  p_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_where text;
begin
  if p_value is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = p_table_name
      and table_type = 'BASE TABLE'
  ) then
    return;
  end if;

  select string_agg(format('%I = $1', column_name), ' or ' order by ordinal_position)
  into v_where
  from information_schema.columns
  where table_schema = 'public'
    and table_name = p_table_name
    and column_name = any(p_column_names);

  if v_where is null then
    return;
  end if;

  execute format('delete from public.%I where %s', p_table_name, v_where)
  using p_value;
end;
$$;

create or replace function public._delete_public_rows_by_common_user_columns(p_value uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  table_row record;
begin
  if p_value is null then
    return;
  end if;

  for table_row in
    select
      c.table_name,
      array_agg(c.column_name order by c.ordinal_position)::text[] as column_names
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema
     and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.column_name in (
        'user_id',
        'owner_id',
        'sender_id',
        'recipient_id',
        'mentor_id',
        'pupil_id',
        'friend_id'
      )
    group by c.table_name
  loop
    perform public._delete_public_rows_if_any_uuid_match(
      table_row.table_name,
      table_row.column_names,
      p_value
    );
  end loop;
end;
$$;

create or replace function public._nullify_public_uuid_column(
  p_table_name text,
  p_column_name text,
  p_value uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = p_table_name
      and table_type = 'BASE TABLE'
  ) then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = p_table_name
      and column_name = p_column_name
  ) then
    execute format('update public.%I set %I = null where %I = $1', p_table_name, p_column_name, p_column_name)
    using p_value;
  end if;
end;
$$;
