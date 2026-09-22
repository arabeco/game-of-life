-- A MISSAO DE QUEM NAO TEM NADA.
--
-- Todas as missoes individuais medem acoes que ja existem. Quem chega sem arena
-- nenhuma ficava sem missao — e e justamente quem mais precisa de uma, porque
-- nao tem o que fazer e nem sabe o que o app espera dela. O painel dizia
-- "registre uma acao para abrir suas primeiras propostas", que e um beco: para
-- ganhar a missao e preciso ja fazer o que a missao existiria para ensinar.
--
-- `primeira` e meta 1, faixa leve, e a descricao sao os tres passos com o gesto
-- no fim: criar arena, criar acao, e SEGURAR no planner para concluir. Esse
-- ultimo nao esta escrito em lugar nenhum da tela, e foi exatamente onde uma
-- pessoa real travou em 13/09/2026.
--
-- E ela entra na mesma exigencia de janela que o volume. Sem data de fim o
-- medidor devolve progresso vazio para sempre — a missao existiria sem nunca
-- poder ser cumprida, que e pior que nao existir.

begin;

alter table public.user_profiles
  drop constraint if exists user_profiles_arena_pact_kind_check;

alter table public.user_profiles
  add constraint user_profiles_arena_pact_kind_check
  check (
    arena_pact_kind is null
    or arena_pact_kind in ('primeira', 'constancia', 'conclusao', 'retomada', 'volume')
  );

alter table public.user_profiles
  drop constraint if exists user_profiles_arena_pact_volume_check;

alter table public.user_profiles
  add constraint user_profiles_arena_pact_volume_check
  check (
    arena_pact_kind not in ('volume', 'primeira')
    or (arena_pact_ends_on is not null and arena_pact_ends_on >= arena_pact_started_on)
  );

commit;
