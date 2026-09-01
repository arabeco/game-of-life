-- CHECAGEM — só lê, não altera nada.
--
-- Por que um diagnóstico e não um olhar rápido numa tabela: o caminho do card do
-- Oráculo até o celular tem seis pontos que falham EM SILÊNCIO. O gatilho termina
-- em `exception when others then return new` — qualquer erro no envio é engolido
-- e o insert do card continua parecendo perfeito. Olhar só o resultado não
-- distingue "não gerou" de "gerou e não entregou".
--
-- A ordem abaixo é a ordem do caminho. A PRIMEIRA linha que não estiver OK é a
-- causa; as de baixo dela são consequência e podem ser ignoradas.
--
--   01-02  config e cron ..... globais: se quebrar aqui, ninguém recebe
--   03-05  preferências ...... os quatro interruptores + silêncio noturno
--   06     assinatura ........ o telefone chegou a se registrar?
--   07     cards ............. o Oráculo gerou alguma coisa?
--   08-09  entrega ........... saiu do servidor? com qual resposta?
--   10     controle .......... separa "Oráculo mudo" de "push quebrado"

with alvo as (
  -- Só este id muda para checar outra conta.
  select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as uid
),
agora as (
  -- O Oráculo decide silêncio noturno em horário de São Paulo, não em UTC.
  select timezone('America/Sao_Paulo', now()) as sp
)

-- ── GLOBAL ───────────────────────────────────────────────────────────────────

select
  '01. url + segredo do webhook' as etapa,
  case when (select count(*) from public.internal_runtime_config
             where key in ('web_push_project_url', 'web_push_webhook_secret')
               and coalesce(trim(value), '') <> '') = 2
       then 'OK'
       else 'VAZIO — nada é enviado, para ninguém' end as situacao,
  coalesce((
    select string_agg(format('%s: %s', key,
             case when coalesce(trim(value), '') = '' then 'VAZIO'
                  else format('%s caracteres', length(value)) end), ' · ' order by key)
    from public.internal_runtime_config
    where key in ('web_push_project_url', 'web_push_webhook_secret')
  ), '(sem as duas chaves na tabela)') as detalhe

union all

select
  '02. cron do feed a cada 10 min',
  case when exists (select 1 from cron.job where jobname = 'glyph-generate-oracle-feed' and active)
       then 'OK' else 'NÃO AGENDADO ou inativo' end,
  coalesce((
    select format('%s · ativo=%s · última execução: %s',
             j.schedule, j.active,
             coalesce((select format('%s em %s%s', d.status,
                                to_char(d.start_time at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'),
                                case when coalesce(d.return_message, '') = '' then ''
                                     else ' — ' || left(d.return_message, 120) end)
                       from cron.job_run_details d
                       where d.jobid = j.jobid
                       order by d.start_time desc limit 1), 'nunca rodou'))
    from cron.job j where j.jobname = 'glyph-generate-oracle-feed'
  ), '—')

union all

-- ── OS QUATRO INTERRUPTORES ──────────────────────────────────────────────────
-- A varredura do feed automático filtra por ia_enabled, notifications_enabled,
-- daily_focus_card_enabled e presence_level > 0. Um só desligado basta para a
-- conta nunca entrar na lista.

select
  '03. interruptores da conta',
  case when exists (
         select 1 from public.oracle_preferences p, alvo
         where p.user_id = alvo.uid
           and p.ia_enabled and p.notifications_enabled
           and p.daily_focus_card_enabled and p.presence_level > 0)
       then 'OK — a conta entra na varredura'
       when exists (select 1 from public.oracle_preferences p, alvo where p.user_id = alvo.uid)
       then 'DESLIGADO — a conta é pulada'
       else 'SEM LINHA — a conta nunca salvou preferências' end,
  coalesce((
    select format('ia=%s · notificacoes=%s · card diario=%s · presenca=%s',
             p.ia_enabled, p.notifications_enabled, p.daily_focus_card_enabled, p.presence_level)
    from public.oracle_preferences p, alvo where p.user_id = alvo.uid
  ), 'no app a ausência de linha vale como padrão ligado, mas a varredura exige a linha')

union all

select
  '04. categorias assinadas',
  case when coalesce((select jsonb_array_length(to_jsonb(p.enabled_categories))
                      from public.oracle_preferences p, alvo where p.user_id = alvo.uid), 0) > 0
       then 'OK' else 'NENHUMA — sem tema assinado não há o que dizer' end,
  coalesce((select left(to_jsonb(p.enabled_categories)::text, 200)
            from public.oracle_preferences p, alvo where p.user_id = alvo.uid), '—')

union all

select
  '05. silêncio noturno agora',
  case when exists (
         select 1 from public.oracle_preferences p, alvo, agora a
         where p.user_id = alvo.uid
           and (case
                  when coalesce(p.quiet_hours_start, '22:00') = coalesce(p.quiet_hours_end, '07:00') then false
                  when coalesce(p.quiet_hours_start, '22:00') < coalesce(p.quiet_hours_end, '07:00')
                    then to_char(a.sp, 'HH24:MI') >= coalesce(p.quiet_hours_start, '22:00')
                     and to_char(a.sp, 'HH24:MI') <  coalesce(p.quiet_hours_end, '07:00')
                  else to_char(a.sp, 'HH24:MI') >= coalesce(p.quiet_hours_start, '22:00')
                    or to_char(a.sp, 'HH24:MI') <  coalesce(p.quiet_hours_end, '07:00')
                end))
       then 'EM SILÊNCIO agora — calar neste horário é o comportamento certo'
       else 'OK — fora da janela de silêncio' end,
  (select format('agora em SP: %s · janela: %s às %s', to_char(a.sp, 'DD/MM HH24:MI'),
            coalesce((select p.quiet_hours_start from public.oracle_preferences p, alvo where p.user_id = alvo.uid), '22:00'),
            coalesce((select p.quiet_hours_end   from public.oracle_preferences p, alvo where p.user_id = alvo.uid), '07:00'))
   from agora a)

union all

-- ── O TELEFONE ───────────────────────────────────────────────────────────────
-- Suspeito mais provável. Sem assinatura ativa o gatilho desiste ANTES de tentar
-- qualquer envio, e a desistência não deixa rastro em lugar nenhum.

select
  '06. assinatura de push do aparelho',
  case when exists (select 1 from public.push_subscriptions s, alvo
                    where s.user_id = alvo.uid and s.disabled_at is null)
       then 'OK — existe assinatura ativa'
       when exists (select 1 from public.push_subscriptions s, alvo where s.user_id = alvo.uid)
       then 'TODAS DESATIVADAS — o servidor desligou depois de falhar'
       else 'NENHUMA — o app nunca registrou este aparelho' end,
  coalesce((
    select string_agg(format('[%s] %s · falhas=%s · ultimo ok=%s%s%s',
             case when s.disabled_at is null then 'ativa' else 'desativada' end,
             case when s.endpoint like 'native:%' then 'nativa FCM' else 'web' end,
             s.failure_count,
             coalesce(to_char(s.last_success_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'), 'nunca'),
             case when s.disabled_at is null then ''
                  else ' · desativada em ' || to_char(s.disabled_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') end,
             case when coalesce(s.last_error, '') = '' then ''
                  else ' · ' || left(s.last_error, 100) end),
           '  ||  ' order by s.updated_at desc)
    from public.push_subscriptions s, alvo where s.user_id = alvo.uid
  ), '—')

union all

-- ── O CARD ───────────────────────────────────────────────────────────────────
-- Só `delivery_type = 'feed'` vira push. E o teto é UM card automático por dia
-- para todo mundo acima do Silencioso: se o de hoje já veio, o resto do dia é
-- limite atingido, não defeito.

select
  '07. cards de feed gerados (7 dias)',
  case when coalesce((select count(*) from public.oracle_messages m, alvo
                      where m.user_id = alvo.uid and m.delivery_type = 'feed'
                        and m.created_at > now() - interval '7 days'), 0) > 0
       then 'OK — o Oráculo gerou' else 'NENHUM — não chegou a existir card' end,
  coalesce((
    select format('%s em 7 dias · ultimo: %s — "%s"',
             count(*),
             to_char(max(m.created_at) at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'),
             left((array_agg(m.content order by m.created_at desc))[1], 70))
    from public.oracle_messages m, alvo
    where m.user_id = alvo.uid and m.delivery_type = 'feed'
      and m.created_at > now() - interval '7 days'
  ), 'nada em 7 dias')

union all

-- ── A ENTREGA ────────────────────────────────────────────────────────────────
-- pending = a função morreu no meio. sent = saiu do servidor. error = recusado.

select
  '08. envios do Oráculo (7 dias)',
  case when coalesce((select count(*) from public.oracle_message_push_dispatches d, alvo
                      where d.user_id = alvo.uid and d.created_at > now() - interval '7 days'), 0) = 0
       then 'NENHUM ENVIO — o gatilho desistiu antes de tentar'
       when exists (select 1 from public.oracle_message_push_dispatches d, alvo
                    where d.user_id = alvo.uid and d.status = 'sent'
                      and d.created_at > now() - interval '7 days')
       then 'OK — saiu do servidor'
       else 'TENTOU E NÃO SAIU' end,
  coalesce((
    select string_agg(format('%s: %s', t.status, t.n), ' · ' order by t.status)
    from (select d.status, count(*) as n
          from public.oracle_message_push_dispatches d, alvo
          where d.user_id = alvo.uid and d.created_at > now() - interval '7 days'
          group by d.status) t
  ), 'nenhuma tentativa registrada')

union all

select
  '09. último erro de envio',
  case when exists (select 1 from public.oracle_message_push_dispatches d, alvo
                    where d.user_id = alvo.uid and d.status <> 'sent')
       then 'HÁ ERRO — o texto ao lado é a causa' else 'OK — sem erro registrado' end,
  coalesce((
    select format('%s · codigo %s · %s',
             to_char(d.created_at at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI'),
             coalesce(d.response_code::text, '—'),
             coalesce(left(d.error_message, 180),
                      'sem mensagem; parado em pending significa que a função morreu no meio'))
    from public.oracle_message_push_dispatches d, alvo
    where d.user_id = alvo.uid and d.status <> 'sent'
    order by d.created_at desc limit 1
  ), '—')

union all

-- ── CONTROLE ─────────────────────────────────────────────────────────────────
-- Separa dois diagnósticos que de fora parecem o mesmo. Se aqui sair push e no
-- 08 não, o aparelho está bem e o Oráculo é que está mudo. Se aqui também não
-- sair, o problema é o push e não tem nada a ver com o Oráculo.

select
  '10. controle: push comum (7 dias)',
  case when exists (select 1 from public.notification_push_dispatches d, alvo
                    where d.user_id = alvo.uid and d.status = 'sent'
                      and d.created_at > now() - interval '7 days')
       then 'OK — push chega neste aparelho, então o mudo é o Oráculo'
       when exists (select 1 from public.notification_push_dispatches d, alvo
                    where d.user_id = alvo.uid and d.created_at > now() - interval '7 days')
       then 'TENTOU E FALHOU — o problema é o push, não o Oráculo'
       else 'SEM DADO — nenhuma notificação comum saiu para comparar' end,
  coalesce((
    select string_agg(format('%s: %s', t.status, t.n), ' · ' order by t.status)
    from (select d.status, count(*) as n
          from public.notification_push_dispatches d, alvo
          where d.user_id = alvo.uid and d.created_at > now() - interval '7 days'
          group by d.status) t
  ), '—')

order by 1;
