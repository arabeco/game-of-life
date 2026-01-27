-- Perfil estendido com JSONB (mais simples e visivel)
alter table public.profiles add column if not exists login_email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists status_title text;
alter table public.profiles add column if not exists archetype_name text;
alter table public.profiles add column if not exists archetype_tags text[];
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists is_npc boolean default false;
alter table public.profiles add column if not exists npc_id uuid;
alter table public.profiles add column if not exists player_data jsonb default '{}'::jsonb;

-- Resolver login por nickname com segurança (para uso antes do login)
create or replace function public.resolve_login_email(p_nickname text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_email text;
begin
  select p.login_email
    into v_email
  from public.profiles p
  where lower(p.nickname) = lower(p_nickname)
     or lower(p.userid) = lower(p_nickname)
  limit 1;
  return v_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- NPC publico (leitura liberada) mantendo RLS
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_npc" on public.profiles;
create policy "profiles_select_npc" on public.profiles
  for select
  using (is_npc = true);
