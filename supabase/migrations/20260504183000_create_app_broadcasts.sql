create table if not exists public.app_broadcasts (
  id text primary key,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  audience text not null default 'all' check (audience in ('all', 'game', 'basic', 'beta')),
  priority integer not null default 0,
  eyebrow text,
  title text not null,
  summary text not null,
  body text,
  image_url text,
  button_label text,
  secondary_label text,
  cta_type text not null default 'none' check (cta_type in ('none', 'view', 'url')),
  cta_target text,
  min_app_version text,
  max_app_version text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  dismissible boolean not null default true,
  show_once boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_broadcasts enable row level security;

drop policy if exists "authenticated users can read published app broadcasts" on public.app_broadcasts;
create policy "authenticated users can read published app broadcasts"
on public.app_broadcasts
for select
to authenticated
using (
  status = 'published'
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
);

create or replace function public.set_app_broadcasts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_broadcasts_updated_at on public.app_broadcasts;
create trigger set_app_broadcasts_updated_at
before update on public.app_broadcasts
for each row
execute function public.set_app_broadcasts_updated_at();
