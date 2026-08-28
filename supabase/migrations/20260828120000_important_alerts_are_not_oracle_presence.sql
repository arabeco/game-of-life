begin;

-- O aviso de risco sai do pacto do Oraculo.
--
-- Sao duas coisas diferentes e ate aqui viviam no mesmo interruptor:
--
--   PRESENCA        decide o que o Oraculo COMENTA. Quem pos no Silencioso
--                   pediu para nao ser comentado, e isso vale sempre.
--   ALERTA          avisa que alguma coisa vai ser perdida. Nao e comentario:
--                   e a sequencia de 23 dias morrendo a meia-noite.
--
-- A tentacao era abrir excecao no Silencioso "so para o streak". Nao. Excecao
-- invisivel transforma preferencia em sugestao, e a pessoa descobre que o
-- desligado nao desligava — que e exatamente o tipo de coisa que faz desinstalar.
--
-- Com dois interruptores ela pode ter Oraculo: Silencioso + Alertas: ligados,
-- que e uma combinacao legitima e hoje impossivel de expressar.
--
-- Nasce DESLIGADO de proposito. Ninguem autorizou push de sequencia ainda, e o
-- texto do Silencioso na tela — "So o essencial" — nao e licenca para
-- notificacao: ninguem lendo aquilo entende que vai receber aviso no celular.
-- Quem quiser, liga.

do $$
begin
  if to_regclass('public.oracle_preferences') is null then
    raise exception 'ALERTS_MISSING: public.oracle_preferences';
  end if;
end;
$$;

alter table public.oracle_preferences
  add column if not exists important_alerts_enabled boolean not null default false;

comment on column public.oracle_preferences.important_alerts_enabled is
  'Avisos de risco (sequencia prestes a morrer). Independente de presence_level: presenca decide o que o Oraculo comenta, isto decide se ele avisa de perda iminente. Padrao false — precisa de opt-in explicito.';

-- O cron do aviso varre por esta coluna, e so nela. Sem indice ele leria a
-- tabela inteira a cada passada na janela de risco.
create index if not exists oracle_preferences_important_alerts_idx
  on public.oracle_preferences (user_id)
  where important_alerts_enabled;

commit;
