-- Seed data for InboxAI Assistant
-- This file contains sample data for testing and development
-- WARNING: Only run this in development/staging environments

-- ============================================================================
-- NOTE: Before running this seed file, you must:
-- 1. Create a user in Supabase Auth
-- 2. Replace 'YOUR_USER_UUID_HERE' with the actual UUID from auth.users
-- 3. Or use auth.uid() if running as the authenticated user
-- ============================================================================

-- Example: Get your user ID
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample user profile (replace UUID with actual user ID)
-- INSERT INTO public.users (id, email, full_name, timezone, email_signature)
-- VALUES (
--     'YOUR_USER_UUID_HERE',
--     'debayan@example.com',
--     'Debayan Lahiry',
--     'America/New_York',
--     'Best regards,\nDebayan Lahiry'
-- );

-- Insert sample leads (uncomment and replace user_id after creating user)
/*
INSERT INTO public.leads (user_id, company, contact_name, email, status, last_message, last_contact_at, ai_suggestion, has_ai_draft)
VALUES
    (
        'YOUR_USER_UUID_HERE',
        'Acme Corporation',
        'Sarah Chen',
        'sarah@acme.co',
        'hot',
        'We''re very interested in your enterprise plan. Can you share pricing details and implementation timeline?',
        NOW() - INTERVAL '1 day',
        'Send pricing proposal',
        true
    ),
    (
        'YOUR_USER_UUID_HERE',
        'TechStart Inc',
        'Michael Roberts',
        'michael@techstart.io',
        'hot',
        'Thanks for the demo yesterday! The team was impressed. Let''s schedule a follow-up.',
        NOW() - INTERVAL '2 days',
        'Propose meeting slots',
        true
    ),
    (
        'YOUR_USER_UUID_HERE',
        'Global Dynamics',
        'Jennifer Walsh',
        'jwalsh@globaldynamics.com',
        'warm',
        'I''ll need to discuss this with our procurement team. They''ll be back next week.',
        NOW() - INTERVAL '5 days',
        'Follow up — deal at risk',
        false
    ),
    (
        'YOUR_USER_UUID_HERE',
        'Velocity Partners',
        'David Kim',
        'd.kim@velocity.partners',
        'warm',
        'Interesting solution. We''re evaluating a few options right now.',
        NOW() - INTERVAL '3 days',
        'Share case study',
        true
    ),
    (
        'YOUR_USER_UUID_HERE',
        'Nexus Solutions',
        'Amanda Foster',
        'amanda.f@nexussolutions.com',
        'cold',
        'We might revisit this in Q2 when our budget cycle resets.',
        NOW() - INTERVAL '8 days',
        NULL,
        false
    ),
    (
        'YOUR_USER_UUID_HERE',
        'Bright Future Co',
        'Chris Martinez',
        'chris@brightfuture.co',
        'cold',
        'Not a priority for us at the moment, but keep us posted.',
        NOW() - INTERVAL '12 days',
        NULL,
        false
    );
*/

-- Insert sample actions (uncomment after creating leads)
/*
WITH lead_ids AS (
    SELECT id, company FROM public.leads WHERE user_id = 'YOUR_USER_UUID_HERE'
)
INSERT INTO public.actions (user_id, lead_id, type, priority, subject, reason, has_ai_draft, status)
SELECT 
    'YOUR_USER_UUID_HERE',
    l.id,
    CASE 
        WHEN l.company = 'Acme Corporation' THEN 'reply'
        WHEN l.company = 'Global Dynamics' THEN 'follow-up'
        WHEN l.company = 'TechStart Inc' THEN 'meeting'
        ELSE 'follow-up'
    END,
    CASE 
        WHEN l.company IN ('Acme Corporation', 'Global Dynamics') THEN 'high'
        ELSE 'medium'
    END,
    CASE 
        WHEN l.company = 'Acme Corporation' THEN 'Send pricing proposal with enterprise tier details'
        WHEN l.company = 'Global Dynamics' THEN 'Check in on procurement team discussion'
        WHEN l.company = 'TechStart Inc' THEN 'Propose follow-up meeting with decision makers'
        ELSE 'Share relevant case study to differentiate'
    END,
    CASE 
        WHEN l.company = 'Acme Corporation' THEN 'Hot lead asked for pricing 1 day ago'
        WHEN l.company = 'Global Dynamics' THEN 'No reply in 5 days — deal at risk'
        WHEN l.company = 'TechStart Inc' THEN 'Positive demo feedback, momentum building'
        ELSE 'They''re evaluating competitors'
    END,
    true,
    'pending'
FROM lead_ids l
WHERE l.company IN ('Acme Corporation', 'Global Dynamics', 'TechStart Inc', 'Velocity Partners');
*/

-- Insert sample AI insights (uncomment after creating user)
/*
INSERT INTO public.ai_insights (user_id, insight_text, highlights, insight_type, is_read)
VALUES (
    'YOUR_USER_UUID_HERE',
    'You have 3 hot leads requiring attention today. Acme Corporation is ready for a pricing proposal — they''ve shown strong buying signals. Global Dynamics has gone quiet for 5 days and may need a gentle nudge before the deal cools. TechStart Inc is building momentum after yesterday''s demo.',
    '[
        {"type": "hot", "text": "3 hot leads need replies"},
        {"type": "risk", "text": "1 deal at risk"},
        {"type": "opportunity", "text": "2 ready for proposals"}
    ]'::jsonb,
    'daily',
    false
);
*/

-- Insert sample performance metrics (uncomment after creating user)
/*
INSERT INTO public.performance_metrics (user_id, metric_type, value, previous_value, trend, period_start, period_end)
VALUES
    (
        'YOUR_USER_UUID_HERE',
        'reply_rate',
        68.0,
        56.0,
        'up',
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        'YOUR_USER_UUID_HERE',
        'avg_response_time',
        2.4,
        2.9,
        'up',
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        'YOUR_USER_UUID_HERE',
        'time_saved',
        4.2,
        4.2,
        'neutral',
        NOW() - INTERVAL '7 days',
        NOW()
    );
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check inserted data
-- SELECT COUNT(*) as lead_count FROM public.leads WHERE user_id = 'YOUR_USER_UUID_HERE';
-- SELECT COUNT(*) as action_count FROM public.actions WHERE user_id = 'YOUR_USER_UUID_HERE';
-- SELECT COUNT(*) as insight_count FROM public.ai_insights WHERE user_id = 'YOUR_USER_UUID_HERE';

-- Get lead statistics
-- SELECT * FROM public.get_lead_statistics('YOUR_USER_UUID_HERE');

-- Get recent insights
-- SELECT * FROM public.get_recent_insights('YOUR_USER_UUID_HERE', 5);













