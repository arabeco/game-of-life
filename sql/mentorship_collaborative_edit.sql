alter table if exists public.arenas enable row level security;
alter table if exists public.actions enable row level security;
alter table if exists public.scheduled_tasks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'arenas'
      and policyname = 'Mentorship participants can update linked arenas'
  ) then
    create policy "Mentorship participants can update linked arenas"
    on public.arenas
    for update
    using (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = arenas.id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    )
    with check (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = arenas.id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'arenas'
      and policyname = 'Mentors can delete linked mentorship arenas'
  ) then
    create policy "Mentors can delete linked mentorship arenas"
    on public.arenas
    for delete
    using (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = arenas.id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and rl.mentor_id = auth.uid()
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'actions'
      and policyname = 'Mentorship participants can insert linked actions'
  ) then
    create policy "Mentorship participants can insert linked actions"
    on public.actions
    for insert
    with check (
      auth.uid()::text = user_id::text
      and exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = actions.arena_id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'actions'
      and policyname = 'Mentorship participants can update linked actions'
  ) then
    create policy "Mentorship participants can update linked actions"
    on public.actions
    for update
    using (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = actions.arena_id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    )
    with check (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = actions.arena_id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'actions'
      and policyname = 'Mentorship participants can delete linked actions'
  ) then
    create policy "Mentorship participants can delete linked actions"
    on public.actions
    for delete
    using (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.relationship_link_arenas rla
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where rla.arena_id = actions.arena_id
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'scheduled_tasks'
      and policyname = 'Mentorship participants can insert linked scheduled tasks'
  ) then
    create policy "Mentorship participants can insert linked scheduled tasks"
    on public.scheduled_tasks
    for insert
    with check (
      auth.uid()::text = user_id::text
      and exists (
        select 1
        from public.actions a
        join public.relationship_link_arenas rla
          on rla.arena_id = a.arena_id
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where a.id::text = scheduled_tasks.action_id::text
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'scheduled_tasks'
      and policyname = 'Mentorship participants can update linked scheduled tasks'
  ) then
    create policy "Mentorship participants can update linked scheduled tasks"
    on public.scheduled_tasks
    for update
    using (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.actions a
        join public.relationship_link_arenas rla
          on rla.arena_id = a.arena_id
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where a.id::text = scheduled_tasks.action_id::text
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    )
    with check (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.actions a
        join public.relationship_link_arenas rla
          on rla.arena_id = a.arena_id
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where a.id::text = scheduled_tasks.action_id::text
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'scheduled_tasks'
      and policyname = 'Mentorship participants can delete linked scheduled tasks'
  ) then
    create policy "Mentorship participants can delete linked scheduled tasks"
    on public.scheduled_tasks
    for delete
    using (
      auth.uid()::text = user_id::text
      or exists (
        select 1
        from public.actions a
        join public.relationship_link_arenas rla
          on rla.arena_id = a.arena_id
        join public.relationship_links rl
          on rl.id = rla.relationship_link_id
        where a.id::text = scheduled_tasks.action_id::text
          and rl.link_type = 'mentoria'
          and rl.ended_at is null
          and (rl.mentor_id = auth.uid() or rl.pupil_id = auth.uid())
      )
    );
  end if;
end
$$;
