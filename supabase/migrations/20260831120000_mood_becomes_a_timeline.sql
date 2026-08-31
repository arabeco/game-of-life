begin;

-- O humor passa a ter linha do tempo.
--
-- Ele era um numero so no perfil: `mood`, de 0 a 100, sobrescrito a cada
-- mudanca. Registrar como voce esta hoje apagava como voce estava ontem — e o
-- app inteiro e sobre perceber trajetoria, menos justamente aqui.
--
-- Tabela propria, e nao um array no perfil, porque isto e serie temporal: cresce
-- sem teto, e consultada por intervalo e nao inteira, e um array em jsonb faria
-- toda leitura de perfil carregar meses de humor junto.
--
-- O `mood` do perfil continua existindo e continua sendo a verdade do AGORA:
-- quem so quer o estado atual nao precisa tocar nesta tabela.

create table if not exists public.mood_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  value integer not null check (value >= 0 and value <= 100),
  recorded_at timestamptz not null default now()
);

comment on table public.mood_entries is
  'Linha do tempo do humor. Uma linha por mudanca registrada; user_profiles.mood segue sendo o valor atual.';

-- A consulta e sempre "meu humor, do mais recente para tras": o indice espelha
-- exatamente isso.
create index if not exists mood_entries_user_recent_idx
  on public.mood_entries (user_id, recorded_at desc);

alter table public.mood_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mood_entries' and policyname = 'mood_entries_own_select'
  ) then
    create policy mood_entries_own_select on public.mood_entries
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mood_entries' and policyname = 'mood_entries_own_insert'
  ) then
    create policy mood_entries_own_insert on public.mood_entries
      for insert with check (auth.uid() = user_id);
  end if;

  -- Sem update e sem delete de proposito: registro de humor e o que voce sentiu
  -- naquele momento. Poder reescrever o passado transformaria a linha do tempo
  -- em outra coisa — uma versao editada de como voce gostaria de ter estado.
end;
$$;

grant select, insert on public.mood_entries to authenticated;

commit;
