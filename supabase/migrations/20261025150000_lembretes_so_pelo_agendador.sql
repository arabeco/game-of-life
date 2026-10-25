-- OS LEMBRETES SO PELO AGENDADOR (25/10/2026).
--
-- enqueue_due_action_reminder_notifications e security definer e, recriada em
-- 20261025130000, ficou sem revoke: a chave publica do site conseguia chama-la.
-- Quem chama de verdade e so o pg_cron (glyph-enqueue-action-reminders, a cada
-- minuto), que roda como dono e nao precisa de grant. Fecha igual ao feed do
-- Oraculo em 20261015200000.

revoke all on function public.enqueue_due_action_reminder_notifications() from public, anon, authenticated;
grant execute on function public.enqueue_due_action_reminder_notifications() to service_role;

-- Conferencia: anon e authenticated false, service_role true.
select
  has_function_privilege('anon', 'public.enqueue_due_action_reminder_notifications()', 'execute') as anon,
  has_function_privilege('authenticated', 'public.enqueue_due_action_reminder_notifications()', 'execute') as authenticated,
  has_function_privilege('service_role', 'public.enqueue_due_action_reminder_notifications()', 'execute') as service_role;
