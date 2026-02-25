-- Tabela para mensagens do clã
create table if not exists public.clan_messages (
    id uuid default gen_random_uuid() primary key,
    clan_id uuid not null references public.clans(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.clan_messages enable row level security;

-- Políticas de Segurança (RLS)

-- 1. Leitura: Apenas membros do mesmo clã podem ler
create policy "Membros do clã podem ver mensagens"
on public.clan_messages
for select
using (
    auth.uid() in (
        select user_id from public.clan_members 
        where clan_id = public.clan_messages.clan_id
    )
);

-- 2. Inserção: Apenas membros do clã podem enviar
create policy "Membros do clã podem enviar mensagens"
on public.clan_messages
for insert
with check (
    auth.uid() = user_id 
    and auth.uid() in (
        select user_id from public.clan_members 
        where clan_id = public.clan_messages.clan_id
    )
);

-- Habilitar Realtime
alter publication supabase_realtime add table public.clan_messages;
