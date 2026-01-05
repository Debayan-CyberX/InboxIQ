-- ============================================================================
-- FIX: Update get_user_leads function to accept Better Auth TEXT ID
-- ============================================================================
-- This fixes the error: "function name 'public.get_user_leads' is not unique"
-- This happens when both old (UUID) and new (TEXT) versions exist
-- ============================================================================

-- STEP 1: Drop ALL existing versions of functions to avoid ambiguity
-- This drops both the old (p_user_id UUID) and new (p_better_auth_id TEXT) versions
DROP FUNCTION IF EXISTS public.get_user_leads(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_lead_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_lead_statistics(TEXT) CASCADE;

-- STEP 2: Create the helper function if it doesn't exist
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

-- Update get_user_leads to accept Better Auth TEXT ID
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

-- STEP 4: Create get_lead_statistics function (needed for statistics)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_uuid_from_better_auth_id TO public;
GRANT EXECUTE ON FUNCTION public.get_user_leads TO public;
GRANT EXECUTE ON FUNCTION public.get_lead_statistics TO public;

