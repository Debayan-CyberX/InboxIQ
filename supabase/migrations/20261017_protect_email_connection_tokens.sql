-- OAuth tokens are server-only. Session-authenticated Express endpoints return
-- explicit safe columns; the database owner used by Express bypasses RLS.
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.email_connections FROM anon, authenticated;
