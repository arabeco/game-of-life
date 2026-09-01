-- CHECAGEM — só lê, não altera nada.
--
-- O cron do feed do Oráculo não está ativo, e é por isso que quase não nascem
-- cards: 1 em 7 dias onde deveria haver uma passada a cada 10 minutos. A entrega
-- está boa — quando há card, ele sai — então o mudo é o gerador, não o envio.
--
-- RESPOSTA (01/09/2026): não foi falha de agendamento. O cron existe, com a
-- agenda certa de 10 em 10 minutos, e está com `active = false`. Alguém o
-- desligou. E o cron dos lembretes de ação, que a migração agendou para cada
-- minuto, está rodando a cada cinco — também mexido à mão.
--
-- Os dois foram ajustados na mesma direção, menos passadas, o que tem cara de
-- corte de custo e não de acidente. Fica registrado porque a minha primeira
-- hipótese foi outra — que a migração tivesse agendado no vazio, já que ela faz
-- isso dentro de um bloco que engole "undefined_table" — e essa hipótese está
-- errada. Quem ler isto depois merece a versão certa.
--
-- Religar é `cron.alter_job(jobid, active := true)`, e é uma decisão de custo:
-- volta uma chamada à edge function a cada 10 minutos, mais os envios.

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
