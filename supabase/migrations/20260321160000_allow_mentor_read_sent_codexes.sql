alter table if exists public.codex enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'codex'
      and policyname = 'Mentors can read sent relationship codexes'
  ) then
    create policy "Mentors can read sent relationship codexes"
    on public.codex
    for select
    using (
      created_by_user_id = auth.uid()
      and source_type = 'gift_in_app'
      and mentor_relationship_link_id is not null
    );
  end if;
end
$$;
