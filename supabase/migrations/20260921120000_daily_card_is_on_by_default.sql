-- O card do dia nascia desligado, e por isso nao existia.
--
-- A coluna `daily_focus_card_enabled` entrou com `default false`, e o lote do cron
-- exige ela `true`. Resultado medido em 21/09/2026: 676 contas, 2 com o toggle
-- ligado. O cron rodava de dez em dez minutos, procurava gente elegivel, achava
-- duas, e ia embora. Meses assim.
--
-- Um card por dia e a promessa da aba de sabedoria. Promessa atras de um switch
-- escondido nas preferencias do Oraculo nao e promessa: e uma funcionalidade
-- morta que ninguem sabe que existe para reclamar.
--
-- O desligar continua onde sempre esteve — o mesmo switch, e desmarcar todos os
-- temas tambem zera a entrega. O que muda e so de que lado a porta comeca.
--
-- As linhas existentes sobem junto. Ninguem pode ter escolhido desligar uma coisa
-- que nunca chegou a ligar, entao nao ha preferencia de pessoa sendo sobrescrita
-- aqui: ha um padrao errado sendo corrigido para tras.

begin;

alter table public.oracle_preferences
  alter column daily_focus_card_enabled set default true;

update public.oracle_preferences
set daily_focus_card_enabled = true
where daily_focus_card_enabled is distinct from true;

commit;
