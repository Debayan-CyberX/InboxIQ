-- ============================================================================
-- CREATE TEST EMAIL DRAFTS
-- ============================================================================
-- This script creates sample AI-generated email drafts for testing
-- Run this in Supabase SQL Editor after logging in
-- ============================================================================

-- First, get your Better Auth user ID and email
-- You can find this by checking the "user" table:
-- SELECT id, email FROM public."user" LIMIT 1;

-- Replace 'YOUR_BETTER_AUTH_USER_ID' with your actual Better Auth user ID
-- Replace 'YOUR_EMAIL@example.com' with your actual email

-- Function to create test drafts for a user
CREATE OR REPLACE FUNCTION create_test_drafts_for_user(p_better_auth_id TEXT)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_test_drafts_for_user TO public;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
-- 
-- Step 1: Get your Better Auth user ID
-- Run this query first:
--   SELECT id, email FROM public."user" LIMIT 1;
--
-- Step 2: Create test drafts
-- Replace 'YOUR_BETTER_AUTH_USER_ID' with the ID from step 1:
--   SELECT * FROM create_test_drafts_for_user('YOUR_BETTER_AUTH_USER_ID');
--
-- This will create 5 test email drafts that you can see in the Drafts page!
-- ============================================================================










