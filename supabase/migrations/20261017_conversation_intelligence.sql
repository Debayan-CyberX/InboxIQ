ALTER TABLE public.email_threads ADD COLUMN IF NOT EXISTS intelligence JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS inboxiq_lead_email_owner ON public.leads(user_id,lower(email));
