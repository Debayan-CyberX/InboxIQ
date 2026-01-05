-- ============================================================================
-- COMPLETE FIX: All Better Auth Functions
-- ============================================================================
-- This script creates/updates ALL functions needed for Better Auth integration
-- Run this to fix all function-related errors
-- ============================================================================

-- STEP 1: Drop all old UUID-based function versions to avoid ambiguity
DROP FUNCTION IF EXISTS public.get_user_leads(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_leads(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_lead_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_lead_statistics(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_user_email_threads(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email_threads(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email_threads(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email_threads(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_user_actions(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_actions(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_actions(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_actions(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_user_drafts(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_drafts(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_recent_insights(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_recent_insights(TEXT, INTEGER) CASCADE;

-- STEP 2: Create helper function to convert Better Auth ID to UUID
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

-- STEP 3: Create get_user_leads function
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

-- STEP 4: Create get_lead_statistics function
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

-- STEP 5: Create get_user_email_threads function
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

-- STEP 6: Create get_user_actions function
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

-- STEP 7: Create get_user_drafts function
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

-- STEP 8: Create get_recent_insights function
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

-- STEP 9: Create user_settings table and functions
-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT, company TEXT, role TEXT,
    timezone TEXT DEFAULT 'America/New_York', language TEXT DEFAULT 'en',
    email_signature TEXT, default_tone TEXT DEFAULT 'professional',
    auto_archive BOOLEAN DEFAULT true, archive_after_days INTEGER DEFAULT 30,
    email_notifications BOOLEAN DEFAULT true, ai_enabled BOOLEAN DEFAULT true,
    confidence_threshold INTEGER DEFAULT 85, auto_generate_drafts BOOLEAN DEFAULT true,
    suggest_follow_ups BOOLEAN DEFAULT true, analyze_sentiment BOOLEAN DEFAULT true,
    generate_subject_lines BOOLEAN DEFAULT true, preferred_tone TEXT DEFAULT 'professional',
    max_draft_length INTEGER DEFAULT 500, browser_notifications BOOLEAN DEFAULT true,
    hot_lead_alerts BOOLEAN DEFAULT true, follow_up_reminders BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true, ai_draft_ready BOOLEAN DEFAULT true,
    deal_at_risk BOOLEAN DEFAULT true, two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 60, require_password_change BOOLEAN DEFAULT false,
    last_password_change TIMESTAMPTZ, theme TEXT DEFAULT 'dark',
    compact_mode BOOLEAN DEFAULT false, show_avatars BOOLEAN DEFAULT true,
    animations BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_settings_user_id_key UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE OR REPLACE FUNCTION update_user_settings_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON public.user_settings;
CREATE TRIGGER update_user_settings_timestamp BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at();
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (true);

-- Create get_user_settings function
CREATE OR REPLACE FUNCTION public.get_user_settings(p_better_auth_id TEXT)
RETURNS TABLE (
    id UUID, user_id UUID, full_name TEXT, company TEXT, role TEXT, timezone TEXT, language TEXT,
    email_signature TEXT, default_tone TEXT, auto_archive BOOLEAN, archive_after_days INTEGER,
    email_notifications BOOLEAN, ai_enabled BOOLEAN, confidence_threshold INTEGER,
    auto_generate_drafts BOOLEAN, suggest_follow_ups BOOLEAN, analyze_sentiment BOOLEAN,
    generate_subject_lines BOOLEAN, preferred_tone TEXT, max_draft_length INTEGER,
    browser_notifications BOOLEAN, hot_lead_alerts BOOLEAN, follow_up_reminders BOOLEAN,
    weekly_digest BOOLEAN, ai_draft_ready BOOLEAN, deal_at_risk BOOLEAN,
    two_factor_enabled BOOLEAN, session_timeout INTEGER, require_password_change BOOLEAN,
    last_password_change TIMESTAMPTZ, theme TEXT, compact_mode BOOLEAN,
    show_avatars BOOLEAN, animations BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
DECLARE v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_user_uuid_from_better_auth_id(p_better_auth_id);
    IF v_user_uuid IS NULL THEN RETURN; END IF;
    RETURN QUERY SELECT us.id, us.user_id, us.full_name, us.company, us.role, us.timezone, us.language,
        us.email_signature, us.default_tone, us.auto_archive, us.archive_after_days,
        us.email_notifications, us.ai_enabled, us.confidence_threshold, us.auto_generate_drafts,
        us.suggest_follow_ups, us.analyze_sentiment, us.generate_subject_lines, us.preferred_tone,
        us.max_draft_length, us.browser_notifications, us.hot_lead_alerts, us.follow_up_reminders,
        us.weekly_digest, us.ai_draft_ready, us.deal_at_risk, us.two_factor_enabled,
        us.session_timeout, us.require_password_change, us.last_password_change, us.theme,
        us.compact_mode, us.show_avatars, us.animations, us.created_at, us.updated_at
    FROM public.user_settings us WHERE us.user_id = v_user_uuid LIMIT 1;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create upsert_user_settings function
CREATE OR REPLACE FUNCTION public.upsert_user_settings(p_better_auth_id TEXT, p_settings JSONB)
RETURNS TABLE (
    id UUID, user_id UUID, full_name TEXT, company TEXT, role TEXT, timezone TEXT, language TEXT,
    email_signature TEXT, default_tone TEXT, auto_archive BOOLEAN, archive_after_days INTEGER,
    email_notifications BOOLEAN, ai_enabled BOOLEAN, confidence_threshold INTEGER,
    auto_generate_drafts BOOLEAN, suggest_follow_ups BOOLEAN, analyze_sentiment BOOLEAN,
    generate_subject_lines BOOLEAN, preferred_tone TEXT, max_draft_length INTEGER,
    browser_notifications BOOLEAN, hot_lead_alerts BOOLEAN, follow_up_reminders BOOLEAN,
    weekly_digest BOOLEAN, ai_draft_ready BOOLEAN, deal_at_risk BOOLEAN,
    two_factor_enabled BOOLEAN, session_timeout INTEGER, require_password_change BOOLEAN,
    last_password_change TIMESTAMPTZ, theme TEXT, compact_mode BOOLEAN,
    show_avatars BOOLEAN, animations BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
DECLARE v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_user_uuid_from_better_auth_id(p_better_auth_id);
    IF v_user_uuid IS NULL THEN RETURN; END IF;
    INSERT INTO public.user_settings (user_id, full_name, company, role, timezone, language,
        email_signature, default_tone, auto_archive, archive_after_days, email_notifications,
        ai_enabled, confidence_threshold, auto_generate_drafts, suggest_follow_ups,
        analyze_sentiment, generate_subject_lines, preferred_tone, max_draft_length,
        browser_notifications, hot_lead_alerts, follow_up_reminders, weekly_digest,
        ai_draft_ready, deal_at_risk, two_factor_enabled, session_timeout,
        require_password_change, last_password_change, theme, compact_mode, show_avatars, animations)
    VALUES (v_user_uuid, p_settings->>'full_name', p_settings->>'company', p_settings->>'role',
        COALESCE(p_settings->>'timezone', 'America/New_York'), COALESCE(p_settings->>'language', 'en'),
        p_settings->>'email_signature', COALESCE(p_settings->>'default_tone', 'professional'),
        COALESCE((p_settings->>'auto_archive')::BOOLEAN, true),
        COALESCE((p_settings->>'archive_after_days')::INTEGER, 30),
        COALESCE((p_settings->>'email_notifications')::BOOLEAN, true),
        COALESCE((p_settings->>'ai_enabled')::BOOLEAN, true),
        COALESCE((p_settings->>'confidence_threshold')::INTEGER, 85),
        COALESCE((p_settings->>'auto_generate_drafts')::BOOLEAN, true),
        COALESCE((p_settings->>'suggest_follow_ups')::BOOLEAN, true),
        COALESCE((p_settings->>'analyze_sentiment')::BOOLEAN, true),
        COALESCE((p_settings->>'generate_subject_lines')::BOOLEAN, true),
        COALESCE(p_settings->>'preferred_tone', 'professional'),
        COALESCE((p_settings->>'max_draft_length')::INTEGER, 500),
        COALESCE((p_settings->>'browser_notifications')::BOOLEAN, true),
        COALESCE((p_settings->>'hot_lead_alerts')::BOOLEAN, true),
        COALESCE((p_settings->>'follow_up_reminders')::BOOLEAN, true),
        COALESCE((p_settings->>'weekly_digest')::BOOLEAN, true),
        COALESCE((p_settings->>'ai_draft_ready')::BOOLEAN, true),
        COALESCE((p_settings->>'deal_at_risk')::BOOLEAN, true),
        COALESCE((p_settings->>'two_factor_enabled')::BOOLEAN, false),
        COALESCE((p_settings->>'session_timeout')::INTEGER, 60),
        COALESCE((p_settings->>'require_password_change')::BOOLEAN, false),
        CASE WHEN p_settings->>'last_password_change' IS NOT NULL 
            THEN (p_settings->>'last_password_change')::TIMESTAMPTZ ELSE NULL END,
        COALESCE(p_settings->>'theme', 'dark'),
        COALESCE((p_settings->>'compact_mode')::BOOLEAN, false),
        COALESCE((p_settings->>'show_avatars')::BOOLEAN, true),
        COALESCE((p_settings->>'animations')::BOOLEAN, true))
    ON CONFLICT ON CONSTRAINT user_settings_user_id_key DO UPDATE SET
        full_name = EXCLUDED.full_name, company = EXCLUDED.company, role = EXCLUDED.role,
        timezone = EXCLUDED.timezone, language = EXCLUDED.language,
        email_signature = EXCLUDED.email_signature, default_tone = EXCLUDED.default_tone,
        auto_archive = EXCLUDED.auto_archive, archive_after_days = EXCLUDED.archive_after_days,
        email_notifications = EXCLUDED.email_notifications, ai_enabled = EXCLUDED.ai_enabled,
        confidence_threshold = EXCLUDED.confidence_threshold,
        auto_generate_drafts = EXCLUDED.auto_generate_drafts,
        suggest_follow_ups = EXCLUDED.suggest_follow_ups, analyze_sentiment = EXCLUDED.analyze_sentiment,
        generate_subject_lines = EXCLUDED.generate_subject_lines, preferred_tone = EXCLUDED.preferred_tone,
        max_draft_length = EXCLUDED.max_draft_length, browser_notifications = EXCLUDED.browser_notifications,
        hot_lead_alerts = EXCLUDED.hot_lead_alerts, follow_up_reminders = EXCLUDED.follow_up_reminders,
        weekly_digest = EXCLUDED.weekly_digest, ai_draft_ready = EXCLUDED.ai_draft_ready,
        deal_at_risk = EXCLUDED.deal_at_risk, two_factor_enabled = EXCLUDED.two_factor_enabled,
        session_timeout = EXCLUDED.session_timeout, require_password_change = EXCLUDED.require_password_change,
        last_password_change = EXCLUDED.last_password_change, theme = EXCLUDED.theme,
        compact_mode = EXCLUDED.compact_mode, show_avatars = EXCLUDED.show_avatars,
        animations = EXCLUDED.animations, updated_at = NOW();
    -- Return the updated settings (explicitly select to avoid ambiguous user_id)
    RETURN QUERY
    SELECT 
        us.id, us.user_id, us.full_name, us.company, us.role, us.timezone, us.language,
        us.email_signature, us.default_tone, us.auto_archive, us.archive_after_days,
        us.email_notifications, us.ai_enabled, us.confidence_threshold,
        us.auto_generate_drafts, us.suggest_follow_ups, us.analyze_sentiment,
        us.generate_subject_lines, us.preferred_tone, us.max_draft_length,
        us.browser_notifications, us.hot_lead_alerts, us.follow_up_reminders,
        us.weekly_digest, us.ai_draft_ready, us.deal_at_risk,
        us.two_factor_enabled, us.session_timeout, us.require_password_change,
        us.last_password_change, us.theme, us.compact_mode,
        us.show_avatars, us.animations, us.created_at, us.updated_at
    FROM public.user_settings us
    WHERE us.user_id = v_user_uuid
    LIMIT 1;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_uuid_from_better_auth_id TO public;
GRANT EXECUTE ON FUNCTION public.get_user_leads TO public;
GRANT EXECUTE ON FUNCTION public.get_lead_statistics TO public;
GRANT EXECUTE ON FUNCTION public.get_user_email_threads TO public;
GRANT EXECUTE ON FUNCTION public.get_user_actions TO public;
GRANT EXECUTE ON FUNCTION public.get_user_drafts TO public;
GRANT EXECUTE ON FUNCTION public.get_recent_insights TO public;
GRANT EXECUTE ON FUNCTION public.get_user_settings TO public;
GRANT EXECUTE ON FUNCTION public.upsert_user_settings TO public;

-- ============================================================================
-- TEST DRAFTS FUNCTION
-- ============================================================================
-- Function to create test email drafts for development/testing
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_test_drafts_for_user(p_better_auth_id TEXT)
RETURNS TABLE (
    created_count INTEGER,
    draft_ids UUID[]
) AS $$
DECLARE
    v_user_email TEXT;
    v_user_uuid UUID;
    v_draft_ids UUID[] := ARRAY[]::UUID[];
    v_lead_id UUID;
    v_draft_id UUID;
BEGIN
    -- Get user email from Better Auth user table
    SELECT email INTO v_user_email
    FROM public."user"
    WHERE id = p_better_auth_id
    LIMIT 1;

    -- If no email found, return error
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'User not found with Better Auth ID: %', p_better_auth_id;
    END IF;

    -- Get UUID from users table by email
    SELECT id INTO v_user_uuid
    FROM public.users
    WHERE email = v_user_email
    LIMIT 1;

    -- If no UUID found, create a user record
    IF v_user_uuid IS NULL THEN
        INSERT INTO public.users (email, full_name, timezone)
        VALUES (v_user_email, 'Test User', 'UTC')
        RETURNING id INTO v_user_uuid;
    END IF;

    -- Get or create a test lead
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE user_id = v_user_uuid
    LIMIT 1;

    -- If no lead exists, create one
    IF v_lead_id IS NULL THEN
        INSERT INTO public.leads (
            user_id,
            company,
            contact_name,
            email,
            status,
            industry,
            company_size
        )
        VALUES (
            v_user_uuid,
            'Acme Corporation',
            'John Smith',
            'john.smith@acme.com',
            'hot',
            'Technology',
            '50-200'
        )
        RETURNING id INTO v_lead_id;
    END IF;

    -- Create test draft 1: Follow-up email
    INSERT INTO public.emails (
        user_id,
        lead_id,
        direction,
        from_email,
        to_email,
        subject,
        body_html,
        body_text,
        status,
        is_ai_draft,
        tone,
        ai_reason
    )
    VALUES (
        v_user_uuid,
        v_lead_id,
        'outbound',
        v_user_email,
        'john.smith@acme.com',
        'Following up on our conversation',
        '<p>Hi John,</p><p>I wanted to follow up on our conversation about potential collaboration opportunities. I believe there''s great synergy between our companies.</p><p>Would you be available for a quick call this week to discuss further?</p><p>Best regards,<br/>Your Name</p>',
        'Hi John,\n\nI wanted to follow up on our conversation about potential collaboration opportunities. I believe there''s great synergy between our companies.\n\nWould you be available for a quick call this week to discuss further?\n\nBest regards,\nYour Name',
        'draft',
        true,
        'professional',
        'AI detected this is a high-priority follow-up based on previous interaction'
    )
    RETURNING id INTO v_draft_id;
    v_draft_ids := array_append(v_draft_ids, v_draft_id);

    -- Create test draft 2: Introduction email
    INSERT INTO public.emails (
        user_id,
        lead_id,
        direction,
        from_email,
        to_email,
        subject,
        body_html,
        body_text,
        status,
        is_ai_draft,
        tone,
        ai_reason
    )
    VALUES (
        v_user_uuid,
        v_lead_id,
        'outbound',
        v_user_email,
        'sarah.johnson@techstartup.io',
        'Introduction: Partnership Opportunity',
        '<p>Hi Sarah,</p><p>I came across TechStartup and was impressed by your recent product launch. I think there might be an interesting partnership opportunity here.</p><p>I''d love to schedule a brief call to explore how we could work together. Are you available next week?</p><p>Looking forward to connecting!</p><p>Best,<br/>Your Name</p>',
        'Hi Sarah,\n\nI came across TechStartup and was impressed by your recent product launch. I think there might be an interesting partnership opportunity here.\n\nI''d love to schedule a brief call to explore how we could work together. Are you available next week?\n\nLooking forward to connecting!\n\nBest,\nYour Name',
        'draft',
        true,
        'confident',
        'AI identified this as a warm lead with high conversion potential'
    )
    RETURNING id INTO v_draft_id;
    v_draft_ids := array_append(v_draft_ids, v_draft_id);

    -- Create test draft 3: Meeting request
    INSERT INTO public.emails (
        user_id,
        lead_id,
        direction,
        from_email,
        to_email,
        subject,
        body_html,
        body_text,
        status,
        is_ai_draft,
        tone,
        ai_reason
    )
    VALUES (
        v_user_uuid,
        v_lead_id,
        'outbound',
        v_user_email,
        'mike.chen@innovateco.com',
        'Quick meeting to discuss collaboration?',
        '<p>Hi Mike,</p><p>I hope this email finds you well. I''d like to propose a brief meeting to discuss how we might collaborate.</p><p>I''m available Tuesday or Wednesday afternoon. Would either of those work for you?</p><p>Thanks,<br/>Your Name</p>',
        'Hi Mike,\n\nI hope this email finds you well. I''d like to propose a brief meeting to discuss how we might collaborate.\n\nI''m available Tuesday or Wednesday afternoon. Would either of those work for you?\n\nThanks,\nYour Name',
        'draft',
        true,
        'polite',
        'AI suggests this is a good time to reach out based on lead activity'
    )
    RETURNING id INTO v_draft_id;
    v_draft_ids := array_append(v_draft_ids, v_draft_id);

    -- Create test draft 4: Product demo request
    INSERT INTO public.emails (
        user_id,
        lead_id,
        direction,
        from_email,
        to_email,
        subject,
        body_html,
        body_text,
        status,
        is_ai_draft,
        tone,
        ai_reason
    )
    VALUES (
        v_user_uuid,
        v_lead_id,
        'outbound',
        v_user_email,
        'emily.davis@growthlabs.com',
        'Product Demo Request',
        '<p>Hi Emily,</p><p>I noticed GrowthLabs is expanding rapidly. I think our solution could help streamline your operations.</p><p>Would you be interested in a 15-minute demo? I can show you how we''ve helped similar companies achieve 30% efficiency gains.</p><p>Let me know what works for you!</p><p>Best regards,<br/>Your Name</p>',
        'Hi Emily,\n\nI noticed GrowthLabs is expanding rapidly. I think our solution could help streamline your operations.\n\nWould you be interested in a 15-minute demo? I can show you how we''ve helped similar companies achieve 30% efficiency gains.\n\nLet me know what works for you!\n\nBest regards,\nYour Name',
        'draft',
        true,
        'sales-focused',
        'AI recommends a sales-focused approach based on lead profile and industry'
    )
    RETURNING id INTO v_draft_id;
    v_draft_ids := array_append(v_draft_ids, v_draft_id);

    -- Create test draft 5: Short follow-up
    INSERT INTO public.emails (
        user_id,
        lead_id,
        direction,
        from_email,
        to_email,
        subject,
        body_html,
        body_text,
        status,
        is_ai_draft,
        tone,
        ai_reason
    )
    VALUES (
        v_user_uuid,
        v_lead_id,
        'outbound',
        v_user_email,
        'david.wilson@startup.io',
        'Quick question',
        '<p>Hi David,</p><p>Just checking in - did you get a chance to review the proposal I sent last week?</p><p>Happy to answer any questions!</p><p>Best,<br/>Your Name</p>',
        'Hi David,\n\nJust checking in - did you get a chance to review the proposal I sent last week?\n\nHappy to answer any questions!\n\nBest,\nYour Name',
        'draft',
        true,
        'short',
        'AI suggests a brief, friendly follow-up to re-engage'
    )
    RETURNING id INTO v_draft_id;
    v_draft_ids := array_append(v_draft_ids, v_draft_id);

    RETURN QUERY SELECT array_length(v_draft_ids, 1)::INTEGER, v_draft_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_test_drafts_for_user TO public;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify functions exist with:
-- SELECT p.proname, pg_get_function_arguments(p.oid) 
-- FROM pg_proc p 
-- JOIN pg_namespace n ON p.pronamespace = n.oid 
-- WHERE n.nspname = 'public' AND p.proname LIKE 'get_%';

