-- ============================================================================
-- QUICK FIX: Settings Functions
-- ============================================================================
-- This creates the user_settings table and functions needed for settings
-- Run this if you're getting "Could not find the function public.get_user_settings"
-- ============================================================================

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Profile settings
    full_name TEXT,
    company TEXT,
    role TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    language TEXT DEFAULT 'en',
    
    -- Email settings
    email_signature TEXT,
    default_tone TEXT DEFAULT 'professional',
    auto_archive BOOLEAN DEFAULT true,
    archive_after_days INTEGER DEFAULT 30,
    email_notifications BOOLEAN DEFAULT true,
    
    -- AI settings
    ai_enabled BOOLEAN DEFAULT true,
    confidence_threshold INTEGER DEFAULT 85,
    auto_generate_drafts BOOLEAN DEFAULT true,
    suggest_follow_ups BOOLEAN DEFAULT true,
    analyze_sentiment BOOLEAN DEFAULT true,
    generate_subject_lines BOOLEAN DEFAULT true,
    preferred_tone TEXT DEFAULT 'professional',
    max_draft_length INTEGER DEFAULT 500,
    
    -- Notification settings
    browser_notifications BOOLEAN DEFAULT true,
    hot_lead_alerts BOOLEAN DEFAULT true,
    follow_up_reminders BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true,
    ai_draft_ready BOOLEAN DEFAULT true,
    deal_at_risk BOOLEAN DEFAULT true,
    
    -- Security settings
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 60,
    require_password_change BOOLEAN DEFAULT false,
    last_password_change TIMESTAMPTZ,
    
    -- Appearance settings
    theme TEXT DEFAULT 'dark',
    compact_mode BOOLEAN DEFAULT false,
    show_avatars BOOLEAN DEFAULT true,
    animations BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON public.user_settings;
CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
    ON public.user_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
    ON public.user_settings FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (true);

-- Function to get user settings (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_user_settings(p_better_auth_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    company TEXT,
    role TEXT,
    timezone TEXT,
    language TEXT,
    email_signature TEXT,
    default_tone TEXT,
    auto_archive BOOLEAN,
    archive_after_days INTEGER,
    email_notifications BOOLEAN,
    ai_enabled BOOLEAN,
    confidence_threshold INTEGER,
    auto_generate_drafts BOOLEAN,
    suggest_follow_ups BOOLEAN,
    analyze_sentiment BOOLEAN,
    generate_subject_lines BOOLEAN,
    preferred_tone TEXT,
    max_draft_length INTEGER,
    browser_notifications BOOLEAN,
    hot_lead_alerts BOOLEAN,
    follow_up_reminders BOOLEAN,
    weekly_digest BOOLEAN,
    ai_draft_ready BOOLEAN,
    deal_at_risk BOOLEAN,
    two_factor_enabled BOOLEAN,
    session_timeout INTEGER,
    require_password_change BOOLEAN,
    last_password_change TIMESTAMPTZ,
    theme TEXT,
    compact_mode BOOLEAN,
    show_avatars BOOLEAN,
    animations BOOLEAN,
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
        us.id,
        us.user_id,
        us.full_name,
        us.company,
        us.role,
        us.timezone,
        us.language,
        us.email_signature,
        us.default_tone,
        us.auto_archive,
        us.archive_after_days,
        us.email_notifications,
        us.ai_enabled,
        us.confidence_threshold,
        us.auto_generate_drafts,
        us.suggest_follow_ups,
        us.analyze_sentiment,
        us.generate_subject_lines,
        us.preferred_tone,
        us.max_draft_length,
        us.browser_notifications,
        us.hot_lead_alerts,
        us.follow_up_reminders,
        us.weekly_digest,
        us.ai_draft_ready,
        us.deal_at_risk,
        us.two_factor_enabled,
        us.session_timeout,
        us.require_password_change,
        us.last_password_change,
        us.theme,
        us.compact_mode,
        us.show_avatars,
        us.animations,
        us.created_at,
        us.updated_at
    FROM public.user_settings us
    WHERE us.user_id = v_user_uuid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert user settings (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.upsert_user_settings(
    p_better_auth_id TEXT,
    p_settings JSONB
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    company TEXT,
    role TEXT,
    timezone TEXT,
    language TEXT,
    email_signature TEXT,
    default_tone TEXT,
    auto_archive BOOLEAN,
    archive_after_days INTEGER,
    email_notifications BOOLEAN,
    ai_enabled BOOLEAN,
    confidence_threshold INTEGER,
    auto_generate_drafts BOOLEAN,
    suggest_follow_ups BOOLEAN,
    analyze_sentiment BOOLEAN,
    generate_subject_lines BOOLEAN,
    preferred_tone TEXT,
    max_draft_length INTEGER,
    browser_notifications BOOLEAN,
    hot_lead_alerts BOOLEAN,
    follow_up_reminders BOOLEAN,
    weekly_digest BOOLEAN,
    ai_draft_ready BOOLEAN,
    deal_at_risk BOOLEAN,
    two_factor_enabled BOOLEAN,
    session_timeout INTEGER,
    require_password_change BOOLEAN,
    last_password_change TIMESTAMPTZ,
    theme TEXT,
    compact_mode BOOLEAN,
    show_avatars BOOLEAN,
    animations BOOLEAN,
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

    -- Upsert settings
    INSERT INTO public.user_settings (
        user_id,
        full_name,
        company,
        role,
        timezone,
        language,
        email_signature,
        default_tone,
        auto_archive,
        archive_after_days,
        email_notifications,
        ai_enabled,
        confidence_threshold,
        auto_generate_drafts,
        suggest_follow_ups,
        analyze_sentiment,
        generate_subject_lines,
        preferred_tone,
        max_draft_length,
        browser_notifications,
        hot_lead_alerts,
        follow_up_reminders,
        weekly_digest,
        ai_draft_ready,
        deal_at_risk,
        two_factor_enabled,
        session_timeout,
        require_password_change,
        last_password_change,
        theme,
        compact_mode,
        show_avatars,
        animations
    ) VALUES (
        v_user_uuid,
        p_settings->>'full_name',
        p_settings->>'company',
        p_settings->>'role',
        COALESCE(p_settings->>'timezone', 'America/New_York'),
        COALESCE(p_settings->>'language', 'en'),
        p_settings->>'email_signature',
        COALESCE(p_settings->>'default_tone', 'professional'),
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
            THEN (p_settings->>'last_password_change')::TIMESTAMPTZ 
            ELSE NULL 
        END,
        COALESCE(p_settings->>'theme', 'dark'),
        COALESCE((p_settings->>'compact_mode')::BOOLEAN, false),
        COALESCE((p_settings->>'show_avatars')::BOOLEAN, true),
        COALESCE((p_settings->>'animations')::BOOLEAN, true)
    )
    ON CONFLICT ON CONSTRAINT user_settings_user_id_key DO UPDATE SET
        full_name = EXCLUDED.full_name,
        company = EXCLUDED.company,
        role = EXCLUDED.role,
        timezone = EXCLUDED.timezone,
        language = EXCLUDED.language,
        email_signature = EXCLUDED.email_signature,
        default_tone = EXCLUDED.default_tone,
        auto_archive = EXCLUDED.auto_archive,
        archive_after_days = EXCLUDED.archive_after_days,
        email_notifications = EXCLUDED.email_notifications,
        ai_enabled = EXCLUDED.ai_enabled,
        confidence_threshold = EXCLUDED.confidence_threshold,
        auto_generate_drafts = EXCLUDED.auto_generate_drafts,
        suggest_follow_ups = EXCLUDED.suggest_follow_ups,
        analyze_sentiment = EXCLUDED.analyze_sentiment,
        generate_subject_lines = EXCLUDED.generate_subject_lines,
        preferred_tone = EXCLUDED.preferred_tone,
        max_draft_length = EXCLUDED.max_draft_length,
        browser_notifications = EXCLUDED.browser_notifications,
        hot_lead_alerts = EXCLUDED.hot_lead_alerts,
        follow_up_reminders = EXCLUDED.follow_up_reminders,
        weekly_digest = EXCLUDED.weekly_digest,
        ai_draft_ready = EXCLUDED.ai_draft_ready,
        deal_at_risk = EXCLUDED.deal_at_risk,
        two_factor_enabled = EXCLUDED.two_factor_enabled,
        session_timeout = EXCLUDED.session_timeout,
        require_password_change = EXCLUDED.require_password_change,
        last_password_change = EXCLUDED.last_password_change,
        theme = EXCLUDED.theme,
        compact_mode = EXCLUDED.compact_mode,
        show_avatars = EXCLUDED.show_avatars,
        animations = EXCLUDED.animations,
        updated_at = NOW();

    -- Return the updated settings
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.full_name,
        us.company,
        us.role,
        us.timezone,
        us.language,
        us.email_signature,
        us.default_tone,
        us.auto_archive,
        us.archive_after_days,
        us.email_notifications,
        us.ai_enabled,
        us.confidence_threshold,
        us.auto_generate_drafts,
        us.suggest_follow_ups,
        us.analyze_sentiment,
        us.generate_subject_lines,
        us.preferred_tone,
        us.max_draft_length,
        us.browser_notifications,
        us.hot_lead_alerts,
        us.follow_up_reminders,
        us.weekly_digest,
        us.ai_draft_ready,
        us.deal_at_risk,
        us.two_factor_enabled,
        us.session_timeout,
        us.require_password_change,
        us.last_password_change,
        us.theme,
        us.compact_mode,
        us.show_avatars,
        us.animations,
        us.created_at,
        us.updated_at
    FROM public.user_settings us
    WHERE us.user_id = v_user_uuid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_settings TO public;
GRANT EXECUTE ON FUNCTION public.upsert_user_settings TO public;

