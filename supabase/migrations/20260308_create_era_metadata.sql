-- Era metadata stores user-defined labels and skins for legacy segments.
-- Boundaries remain in era_boundaries; this table only decorates each resolved Era.

create table if not exists public.era_metadata (
    user_id uuid not null references auth.users(id) on delete cascade,
    era_key text not null,
    name text,
    skin_id text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint era_metadata_pkey primary key (user_id, era_key),
    constraint era_metadata_name_length check (char_length(coalesce(name, '')) <= 48)
);

alter table public.era_metadata enable row level security;

create or replace function public.touch_era_metadata_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists trg_touch_era_metadata_updated_at on public.era_metadata;
create trigger trg_touch_era_metadata_updated_at
before update on public.era_metadata
for each row
execute function public.touch_era_metadata_updated_at();

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'era_metadata'
          and policyname = 'Users can read their own era metadata'
    ) then
        create policy "Users can read their own era metadata"
            on public.era_metadata
            for select
            using (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'era_metadata'
          and policyname = 'Users can insert their own era metadata'
    ) then
        create policy "Users can insert their own era metadata"
            on public.era_metadata
            for insert
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'era_metadata'
          and policyname = 'Users can update their own era metadata'
    ) then
        create policy "Users can update their own era metadata"
            on public.era_metadata
            for update
            using (auth.uid() = user_id)
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'era_metadata'
          and policyname = 'Users can delete their own era metadata'
    ) then
        create policy "Users can delete their own era metadata"
            on public.era_metadata
            for delete
            using (auth.uid() = user_id);
    end if;
end
$$;
