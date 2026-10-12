-- Reutiliza a tabela oficial. Reservas antigas não comprovam envio.
BEGIN;
ALTER TABLE public.notification_email_dispatches
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'legacy_unknown',
  ADD COLUMN IF NOT EXISTS provider_email_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
-- Sem abrir acesso pelo app ou site.
REVOKE ALL ON public.notification_email_dispatches FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_email_dispatches TO service_role;
COMMIT;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='notification_email_dispatches'
  AND column_name IN ('status','provider_email_id','updated_at');
