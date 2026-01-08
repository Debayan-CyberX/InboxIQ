-- ============================================================================
-- FINAL FIX: Ambiguous user_id Error in Settings Function
-- ============================================================================
-- This fixes: "column reference 'user_id' is ambiguous"
-- The issue is that PostgreSQL needs the constraint name, not the column name
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, ensure the unique constraint exists with a specific name
DO $$
BEGIN
    -- Drop existing constraint if it exists with a different name
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.user_settings'::regclass 
        AND contype = 'u'
    ) THEN
        -- Get the constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.user_settings DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'public.user_settings'::regclass
            AND contype = 'u'
            LIMIT 1
        );
    END IF;
    
    -- Create a named unique constraint
    ALTER TABLE public.user_settings 
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, that's fine
        NULL;
END $$;

-- Now fix the upsert_user_settings function
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

    -- Upsert settings using constraint name
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

    -- Return the updated settings (explicitly select to avoid ambiguity)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.upsert_user_settings TO public;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, verify the function exists:
-- SELECT p.proname, pg_get_function_arguments(p.oid) 
-- FROM pg_proc p 
-- WHERE p.proname = 'upsert_user_settings';
-- ============================================================================










