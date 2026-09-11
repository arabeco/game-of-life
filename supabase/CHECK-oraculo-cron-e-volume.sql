-- Diagnóstico SOMENTE LEITURA. Não executa jobs, não envia push e não altera dados.
-- Não retorna comandos de cron, credenciais, mensagens ou identificadores de usuários.
-- Executar no SQL Editor do projeto correto. Resultados são agregados.
begin transaction read only;
set local statement_timeout = '15s';

-- 1. Agendamento real. */10 * * * * significa a cada dez minutos.
select jobid, jobname, schedule, active
from cron.job
where jobname ilike '%oracle%' or jobname ilike '%oraculo%'
order by jobid;

-- 2. Execuções recentes do cron. "succeeded" confirma o SQL do job,
-- não confirma geração de card, sucesso da Edge Function ou entrega do push.
select j.jobname, d.status, count(*) as execucoes_24h,
       min(d.start_time) as primeira, max(d.start_time) as ultima
from cron.job_run_details d
join cron.job j on j.jobid = d.jobid
where d.start_time >= now() - interval '24 hours'
  and (j.jobname ilike '%oracle%' or j.jobname ilike '%oraculo%')
group by j.jobname, d.status
order by j.jobname, d.status;

-- 3. Público que entra no filtro inicial da função atual.
-- Não significa que todos recebem: temas, horário silencioso e limite diário
-- são verificados depois. Não consulta perfis nem o conteúdo das mensagens.
select presence_level, count(*) as contas,
       count(*) filter (where notifications_enabled is true) as avisos_ligados,
       count(*) filter (where ia_enabled is true
                        and notifications_enabled is true
                        and daily_focus_card_enabled is true
                        and presence_level > 0) as candidatas_ao_cron_atual
from public.oracle_preferences
group by presence_level
order by presence_level;

-- 4. Cards gravados nos últimos sete dias. Contagem de registros, NÃO de push.
-- São Paulo / corte às 4h é usado apenas para agrupar este diagnóstico.
select ((created_at at time zone 'America/Sao_Paulo') - interval '4 hours')::date as dia_operacional,
       count(*) filter (where coalesce(context_snapshot->>'triggerType', '') <> 'manual') as automaticos_ou_sem_marcador,
       count(*) filter (where context_snapshot->>'triggerType' = 'manual') as manuais,
       count(distinct user_id) as contas_com_card
from public.oracle_messages
where created_at >= now() - interval '7 days'
  and delivery_type = 'feed'
group by 1
order by 1 desc;

-- 5. Campos existentes para horário, fuso e preferências (metadados apenas).
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('oracle_preferences', 'user_profiles')
  and (column_name ilike '%time%' or column_name ilike '%hour%'
       or column_name ilike '%zone%' or column_name ilike '%daily%'
       or column_name ilike '%presence%' or column_name ilike '%notification%')
order by table_name, ordinal_position;

commit;
