-- Telas cheias de comemoracao (modal de feito, modal de missao).
-- Desligado, o app troca a tela por um toast e entrega a recompensa igual.
-- Nenhuma aba, item ou baú deixa de existir por causa desta chave.
--
-- Primeiro passo para aposentar user_profiles.app_mode: o que o modo BASIC
-- fazia de util vira chave propria aqui, visivel e reversivel pelo jogador.
alter table public.oracle_preferences
  add column if not exists celebration_screens_enabled boolean not null default true;

comment on column public.oracle_preferences.celebration_screens_enabled is
  'Mostra as telas cheias de comemoracao. Falso troca por toast, sem tirar recompensa.';
