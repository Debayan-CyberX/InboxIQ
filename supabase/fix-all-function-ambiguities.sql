-- ============================================================================
-- FIX: Remove Function Ambiguities - Drop Old Versions
-- ============================================================================
-- This fixes the error: "function name 'public.get_user_leads' is not unique"
-- This happens when both old (UUID) and new (TEXT) versions of functions exist
-- ============================================================================
-- Run this FIRST to clean up old function versions, then run fix-user-id-mapping.sql
-- ============================================================================

-- Drop all old versions of functions that take UUID instead of TEXT (Better Auth ID)

-- get_user_leads - drop old UUID version
DROP FUNCTION IF EXISTS public.get_user_leads(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(UUID) CASCADE;

-- get_user_email_threads - drop old UUID version
DROP FUNCTION IF EXISTS public.get_user_email_threads(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email_threads(UUID) CASCADE;

-- get_user_actions - drop old UUID version
DROP FUNCTION IF EXISTS public.get_user_actions(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_actions(UUID) CASCADE;

-- get_user_drafts - drop old UUID version
DROP FUNCTION IF EXISTS public.get_user_drafts(UUID) CASCADE;

-- get_lead_statistics - drop old UUID version (if exists)
DROP FUNCTION IF EXISTS public.get_lead_statistics(UUID) CASCADE;

-- get_recent_insights - drop old UUID version (if exists)
DROP FUNCTION IF EXISTS public.get_recent_insights(UUID, INTEGER) CASCADE;

-- get_thread_emails - this one takes thread_id UUID and user_id, check if old version exists
-- Keep this one as it might have different signature

-- Note: After running this, execute fix-user-id-mapping.sql to create the correct versions






