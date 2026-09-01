-- CHECAGEM — só lê, não altera nada.
--
-- A versão anterior era um union de dez ramos e chegava cortada ao ser colada.
-- Esta devolve UMA linha com uma coluna por etapa do caminho. Mesma informação,
-- e curta o bastante para sobreviver ao copiar e colar.
--
-- O caminho do card até o celular falha em silêncio: o gatilho de envio termina
-- em `exception when others then return new`, então qualquer erro é engolido e o
-- card continua sendo salvo como se tudo tivesse dado certo. Ler só o resultado
-- não distingue "não gerou" de "gerou e não entregou" — por isso cada etapa tem
-- a sua coluna.
--
-- Leia da esquerda para a direita. A primeira que estiver errada é a causa.
select
  (select count(*) from public.internal_runtime_config
     where key in ('web_push_project_url','web_push_webhook_secret')
       and coalesce(trim(value),'') <> '')                                   as config_de_2,
  (select count(*) from cron.job
     where jobname = 'glyph-generate-oracle-feed' and active)                as cron_ativo,
  (select format('ia=%s notif=%s card=%s presenca=%s',
            ia_enabled, notifications_enabled, daily_focus_card_enabled, presence_level)
     from public.oracle_preferences
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb')                 as interruptores,
  (select count(*) from public.push_subscriptions
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
       and disabled_at is null)                                             as assinaturas_ativas,
  (select count(*) from public.push_subscriptions
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb')                as assinaturas_no_total,
  (select count(*) from public.oracle_messages
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
       and delivery_type = 'feed' and created_at > now() - interval '7 days') as cards_em_7d,
  (select count(*) from public.oracle_message_push_dispatches
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
       and created_at > now() - interval '7 days')                          as envios_tentados,
  (select count(*) from public.oracle_message_push_dispatches
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
       and status = 'sent' and created_at > now() - interval '7 days')      as envios_ok,
  -- A coluna que separa dois diagnosticos que de fora parecem iguais: se o push
  -- comum sai e o do Oraculo nao, o aparelho esta bem e o mudo e o Oraculo.
  (select count(*) from public.notification_push_dispatches
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
       and status = 'sent' and created_at > now() - interval '7 days')      as push_comum_ok,
  (select left(error_message, 120) from public.oracle_message_push_dispatches
     where user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb' and status <> 'sent'
     order by created_at desc limit 1)                                      as ultimo_erro
