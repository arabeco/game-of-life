-- Pacto de arena ativo: a missao que o Oraculo propos e o jogador aceitou.
--
-- Uma de cada vez, por decisao de produto: tres pactos abertos viram lista de
-- tarefas, e o app ja tem lista de tarefas. Por isso mora no perfil e nao em
-- tabela propria. Historico de pactos cumpridos fica de fora de proposito —
-- repetir a mesma arena e permitido, porque as vezes ela e justamente o foco.
--
-- Nada de titulo, descricao ou recompensa aqui. Esses saem dos moldes em
-- utils/arenaPacts.ts a partir das colunas abaixo. Guardar o texto junto criaria
-- pacto antigo exibindo regra velha depois que o molde mudar.

alter table public.user_profiles
  add column if not exists arena_pact_arena_id uuid,
  add column if not exists arena_pact_kind text,
  add column if not exists arena_pact_difficulty text,
  add column if not exists arena_pact_goal integer,
  add column if not exists arena_pact_started_on date;

-- Apagar a arena tem de dissolver o pacto, nunca deixar referencia quebrada.
-- Nao pode ser cascade: a coluna vive no perfil, e cascade apagaria a pessoa.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_arena_pact_arena_id_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_arena_pact_arena_id_fkey
      foreign key (arena_pact_arena_id) references public.arenas(id) on delete set null;
  end if;
end $$;

-- Vocabulario fechado, para um valor errado falhar na escrita e nao na leitura.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_arena_pact_kind_check') then
    alter table public.user_profiles
      add constraint user_profiles_arena_pact_kind_check
      check (arena_pact_kind is null or arena_pact_kind in ('constancia', 'conclusao', 'retomada'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_profiles_arena_pact_difficulty_check') then
    alter table public.user_profiles
      add constraint user_profiles_arena_pact_difficulty_check
      check (arena_pact_difficulty is null or arena_pact_difficulty in ('leve', 'media', 'alta'));
  end if;

  -- Meta zero ou negativa seria pacto impossivel de fechar ou ja fechado.
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_arena_pact_goal_check') then
    alter table public.user_profiles
      add constraint user_profiles_arena_pact_goal_check
      check (arena_pact_goal is null or arena_pact_goal > 0);
  end if;

  -- Ou o pacto esta completo, ou nao existe. Meio pacto nao e estado valido.
  -- A arena fica de fora desta regra: quando ela e apagada o fkey acima zera
  -- so o arena_id, e e assim que o app enxerga que o pacto se dissolveu.
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_arena_pact_complete_check') then
    alter table public.user_profiles
      add constraint user_profiles_arena_pact_complete_check
      check (
        arena_pact_kind is null
        or (
          arena_pact_difficulty is not null
          and arena_pact_goal is not null
          and arena_pact_started_on is not null
        )
      );
  end if;
end $$;

-- Quem tem pacto aberto e minoria: indice parcial, so sobre as linhas que importam.
create index if not exists user_profiles_arena_pact_idx
  on public.user_profiles (arena_pact_arena_id)
  where arena_pact_arena_id is not null;
