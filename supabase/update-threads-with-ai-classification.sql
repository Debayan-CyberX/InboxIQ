-- Migration: Update get_user_email_threads to include AI classification from latest email
-- This enables smart inbox tabs and AI badges on thread rows

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_user_email_threads(TEXT, TEXT);

-- Create updated get_user_email_threads function to include AI classification
CREATE FUNCTION public.get_user_email_threads(
    p_better_auth_id TEXT,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    lead_id UUID,
    subject TEXT,
    thread_identifier TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    lead_company TEXT,
    lead_contact_name TEXT,
    lead_email TEXT,
    -- AI Classification fields from latest incoming email
    ai_category TEXT,
    ai_confidence NUMERIC(3, 2),
    ai_reason TEXT
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    -- Convert Better Auth ID to UUID
    v_user_uuid := public.get_user_uuid_from_better_auth_id(p_better_auth_id);
    
    -- If no UUID found, return empty
    IF v_user_uuid IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        et.id,
        et.user_id,
        et.lead_id,
        et.subject,
        et.thread_identifier,
        et.status,
        et.created_at,
        et.updated_at,
        l.company as lead_company,
        l.contact_name as lead_contact_name,
        l.email as lead_email,
        -- Get AI classification from latest incoming email in thread
        latest_email.ai_category,
        latest_email.ai_confidence,
        latest_email.ai_reason
    FROM public.email_threads et
    LEFT JOIN public.leads l ON et.lead_id = l.id
    LEFT JOIN LATERAL (
        SELECT 
            e.ai_category,
            e.ai_confidence,
            e.ai_reason
        FROM public.emails e
        WHERE e.thread_id = et.id
            AND e.user_id = v_user_uuid
            AND (e.direction = 'inbound' OR e.direction = 'incoming')
            AND e.ai_category IS NOT NULL
        ORDER BY COALESCE(e.received_at, e.sent_at, e.created_at) DESC
        LIMIT 1
    ) latest_email ON true
    WHERE et.user_id = v_user_uuid
    AND (p_status IS NULL OR et.status = p_status)
    ORDER BY et.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_email_threads TO public;
