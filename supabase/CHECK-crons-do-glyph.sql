-- CHECAGEM — só lê, não altera nada.
--
-- O cron do feed do Oráculo não está ativo, e é por isso que quase não nascem
-- cards: 1 em 7 dias onde deveria haver uma passada a cada 10 minutos. A entrega
-- está boa — quando há card, ele sai — então o mudo é o gerador, não o envio.
--
-- A migração que agenda faz isso dentro de `exception when undefined_table then
-- null`. Se o pg_cron não estivesse instalado naquele momento, ela não agendou
-- nada e não reclamou. O mesmo bloco protege o cron dos lembretes de ação, então
-- os dois podem ter sumido juntos.
--
-- Isto lista o que existe e confere se as funções que os crons chamam estão lá —
-- agendar um cron que chama função inexistente só troca silêncio por erro a cada
-- 10 minutos.
select
  coalesce(j.jobname, '(nao agendado)') as tarefa,
  coalesce(j.schedule, '—') as quando,
  coalesce(j.active::text, '—') as ativo,
  esperado.funcao as funcao_que_ela_chama,
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = esperado.funcao
  ) then 'EXISTE' else 'NAO EXISTE — nao adianta agendar' end as a_funcao
from (values
  ('glyph-generate-oracle-feed',   'enqueue_oracle_automatic_feed_webhook'),
  ('glyph-enqueue-action-reminders','enqueue_due_action_reminder_notifications')
) as esperado(nome, funcao)
left join cron.job j on j.jobname = esperado.nome

union all

-- Qualquer outro cron que exista e nao esteja na lista acima.
select j.jobname, j.schedule, j.active::text, '(fora da lista)', '—'
from cron.job j
where j.jobname not in ('glyph-generate-oracle-feed', 'glyph-enqueue-action-reminders')

order by 1;
