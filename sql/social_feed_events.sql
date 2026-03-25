begin;

alter table public.user_profiles
  add column if not exists feats_visibility text;

update public.user_profiles
set feats_visibility = 'friends'
where feats_visibility is null
   or feats_visibility not in ('all', 'friends', 'nobody');

alter table public.user_profiles
  alter column feats_visibility set default 'friends';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_feats_visibility_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_feats_visibility_check
      check (feats_visibility in ('all', 'friends', 'nobody'));
  end if;
end
$$;

create table if not exists public.social_feed_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  content jsonb not null default '{}'::jsonb,
  author_nickname text,
  author_avatar_url text,
  author_clan_name text,
  author_clan_icon text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists social_feed_events_created_at_idx
  on public.social_feed_events (created_at desc);

create index if not exists social_feed_events_user_created_at_idx
  on public.social_feed_events (user_id, created_at desc);

alter table public.social_feed_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'social_feed_events'
      and policyname = 'Social feed visible by feats visibility'
  ) then
    create policy "Social feed visible by feats visibility"
    on public.social_feed_events
    for select
    using (
      auth.uid() = user_id
      or exists (
        select 1
        from public.user_profiles up
        where up.id::text = social_feed_events.user_id::text
          and (
            coalesce(up.feats_visibility, 'friends') = 'all'
            or (
              coalesce(up.feats_visibility, 'friends') = 'friends'
              and exists (
                select 1
                from public.friends f
                where f.user_id = social_feed_events.user_id
                  and f.friend_id = auth.uid()
              )
            )
          )
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
      and tablename = 'social_feed_events'
      and policyname = 'Users can insert own social feed events'
  ) then
    create policy "Users can insert own social feed events"
    on public.social_feed_events
    for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'social_feed_events'
      and policyname = 'Users can delete own social feed events'
  ) then
    create policy "Users can delete own social feed events"
    on public.social_feed_events
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;

grant select, insert, delete on public.social_feed_events to authenticated;

comment on table public.social_feed_events is 'Feed social remoto de feitos compartilhados pelos jogadores.';
comment on column public.user_profiles.feats_visibility is 'Controle de visibilidade dos feitos sociais: all, friends ou nobody.';

commit;
