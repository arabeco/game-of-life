create table if not exists public.legacy_render_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending',
    payload jsonb not null,
    video_path text,
    poster_path text,
    error_message text,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz,
    constraint legacy_render_jobs_status_check
        check (status in ('pending', 'processing', 'completed', 'failed', 'canceled'))
);

create index if not exists legacy_render_jobs_user_created_idx
    on public.legacy_render_jobs (user_id, created_at desc);

create index if not exists legacy_render_jobs_status_idx
    on public.legacy_render_jobs (status);

alter table public.legacy_render_jobs enable row level security;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'legacy_render_jobs'
          and policyname = 'Users can read their own legacy render jobs'
    ) then
        create policy "Users can read their own legacy render jobs"
            on public.legacy_render_jobs
            for select
            using (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'legacy_render_jobs'
          and policyname = 'Users can insert their own legacy render jobs'
    ) then
        create policy "Users can insert their own legacy render jobs"
            on public.legacy_render_jobs
            for insert
            with check (auth.uid() = user_id);
    end if;
end
$$;
