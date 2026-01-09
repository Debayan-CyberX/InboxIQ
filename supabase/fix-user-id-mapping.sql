-- ============================================================================
-- FIX: Better Auth User ID to UUID Mapping
-- ============================================================================
-- Better Auth uses TEXT IDs, but our database uses UUIDs
-- This creates helper functions to map Better Auth IDs to UUIDs
-- ============================================================================

-- Function to get UUID from Better Auth user ID (by email lookup)
CREATE OR REPLACE FUNCTION public.get_user_uuid_from_better_auth_id(p_better_auth_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_email TEXT;
    v_user_uuid UUID;
BEGIN
    -- Get email from Better Auth user table
    SELECT email INTO v_user_email
    FROM public."user"
    WHERE id = p_better_auth_id
    LIMIT 1;

    -- If no email found, return NULL
    IF v_user_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get UUID from users table by email
    SELECT id INTO v_user_uuid
    FROM public.users
    WHERE email = v_user_email
    LIMIT 1;

    RETURN v_user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update database functions to accept TEXT (Better Auth ID) instead of UUID
-- This is easier than converting every time

-- Updated function to get user's leads (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_user_leads(
    p_better_auth_id TEXT,
    p_status TEXT DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    company TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    status TEXT,
    last_message TEXT,
    last_contact_at TIMESTAMPTZ,
    days_since_contact INTEGER,
    ai_suggestion TEXT,
    has_ai_draft BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
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
        l.id,
        l.user_id,
        l.company,
        l.contact_name,
        l.email,
        l.phone,
        l.website,
        l.industry,
        l.company_size,
        l.status,
        l.last_message,
        l.last_contact_at,
        l.days_since_contact,
        l.ai_suggestion,
        l.has_ai_draft,
        l.metadata,
        l.created_at,
        l.updated_at
    FROM public.leads l
    WHERE l.user_id = v_user_uuid
    AND (p_status IS NULL OR l.status = p_status)
    AND (
        p_search_query IS NULL OR
        l.company ILIKE '%' || p_search_query || '%' OR
        l.contact_name ILIKE '%' || p_search_query || '%' OR
        l.email ILIKE '%' || p_search_query || '%' OR
        l.last_message ILIKE '%' || p_search_query || '%'
    )
    ORDER BY l.last_contact_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get lead statistics (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_lead_statistics(p_better_auth_id TEXT)
RETURNS TABLE (
    total_leads BIGINT,
    hot_leads BIGINT,
    warm_leads BIGINT,
    cold_leads BIGINT,
    needs_follow_up BIGINT
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    -- Convert Better Auth ID to UUID
    v_user_uuid := public.get_user_uuid_from_better_auth_id(p_better_auth_id);
    
    -- If no UUID found, return zeros
    IF v_user_uuid IS NULL THEN
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_leads,
        COUNT(*) FILTER (WHERE status = 'hot')::BIGINT as hot_leads,
        COUNT(*) FILTER (WHERE status = 'warm')::BIGINT as warm_leads,
        COUNT(*) FILTER (WHERE status = 'cold')::BIGINT as cold_leads,
        COUNT(*) FILTER (WHERE days_since_contact >= 3)::BIGINT as needs_follow_up
    FROM public.leads
    WHERE user_id = v_user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get user's email threads (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_user_email_threads(
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
    lead_email TEXT
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
        l.email as lead_email
    FROM public.email_threads et
    LEFT JOIN public.leads l ON et.lead_id = l.id
    WHERE et.user_id = v_user_uuid
    AND (p_status IS NULL OR et.status = p_status)
    ORDER BY et.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get user's actions (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_user_actions(
    p_better_auth_id TEXT,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    lead_id UUID,
    type TEXT,
    priority TEXT,
    subject TEXT,
    reason TEXT,
    has_ai_draft BOOLEAN,
    email_draft_id UUID,
    status TEXT,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    lead_company TEXT,
    lead_contact_name TEXT
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
        a.id,
        a.user_id,
        a.lead_id,
        a.type,
        a.priority,
        a.subject,
        a.reason,
        a.has_ai_draft,
        a.email_draft_id,
        a.status,
        a.due_at,
        a.completed_at,
        a.created_at,
        a.updated_at,
        l.company as lead_company,
        l.contact_name as lead_contact_name
    FROM public.actions a
    LEFT JOIN public.leads l ON a.lead_id = l.id
    WHERE a.user_id = v_user_uuid
    AND (p_status IS NULL OR a.status = p_status)
    ORDER BY 
        CASE a.priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
        END,
        a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get user's drafts (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_user_drafts(
    p_better_auth_id TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    lead_id UUID,
    thread_id UUID,
    direction TEXT,
    from_email TEXT,
    to_email TEXT,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    status TEXT,
    is_ai_draft BOOLEAN,
    tone TEXT,
    ai_reason TEXT,
    external_email_id TEXT,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    lead_company TEXT,
    lead_contact_name TEXT
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
        e.id,
        e.user_id,
        e.lead_id,
        e.thread_id,
        e.direction,
        e.from_email,
        e.to_email,
        e.cc_emails,
        e.bcc_emails,
        e.subject,
        e.body_text,
        e.body_html,
        e.status,
        e.is_ai_draft,
        e.tone,
        e.ai_reason,
        e.external_email_id,
        e.sent_at,
        e.received_at,
        e.scheduled_for,
        e.created_at,
        e.updated_at,
        l.company as lead_company,
        l.contact_name as lead_contact_name
    FROM public.emails e
    LEFT JOIN public.leads l ON e.lead_id = l.id
    WHERE e.user_id = v_user_uuid
    AND e.status = 'draft'
    AND e.is_ai_draft = true
    ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to get recent insights (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_recent_insights(p_better_auth_id TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    insight_text TEXT,
    highlights JSONB,
    insight_type TEXT,
    lead_id UUID,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ
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
        ai_insights.id,
        ai_insights.insight_text,
        ai_insights.highlights,
        ai_insights.insight_type,
        ai_insights.lead_id,
        ai_insights.is_read,
        ai_insights.created_at
    FROM public.ai_insights
    WHERE ai_insights.user_id = v_user_uuid
    ORDER BY ai_insights.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_uuid_from_better_auth_id TO public;
GRANT EXECUTE ON FUNCTION public.get_user_leads TO public;
GRANT EXECUTE ON FUNCTION public.get_lead_statistics TO public;
GRANT EXECUTE ON FUNCTION public.get_user_email_threads TO public;
GRANT EXECUTE ON FUNCTION public.get_user_actions TO public;
GRANT EXECUTE ON FUNCTION public.get_user_drafts TO public;
GRANT EXECUTE ON FUNCTION public.get_recent_insights TO public;













