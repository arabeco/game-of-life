-- ARENA COM META FINAL (26/10/2026).
--
-- A arena pode ter uma meta final opcional e ser concluida quando chegar nela.
-- Concluida, ela vai para as Finalizadas (trofeus), nao ocupa vaga no limite e,
-- no ciclo, conta so o que foi feito. Duas colunas, nenhuma regra nova no
-- banco: o app grava as duas pelo mesmo update que ja usa para a arena.

alter table public.arenas
  add column if not exists final_goal text,
  add column if not exists completed_at timestamptz;

alter table public.arenas
  drop constraint if exists arenas_final_goal_length;

alter table public.arenas
  add constraint arenas_final_goal_length
  check (final_goal is null or char_length(final_goal) <= 140);

-- Conferencia: as duas colunas existem.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'arenas'
  and column_name in ('final_goal', 'completed_at')
order by column_name;
