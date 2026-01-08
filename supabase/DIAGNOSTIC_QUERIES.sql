-- ============================================================================
-- DIAGNOSTIC QUERIES
-- ============================================================================
-- Run these queries to diagnose issues
-- Replace 'YOUR_BETTER_AUTH_ID' with your actual Better Auth user ID
-- ============================================================================

-- 1. Check if user exists in Better Auth table
SELECT id, email, name 
FROM public."user" 
WHERE id = 'YOUR_BETTER_AUTH_ID';

-- 2. Check if user exists in users table (by email)
SELECT u.id, u.email, u.name
FROM public.users u
WHERE u.email = (
    SELECT email FROM public."user" WHERE id = 'YOUR_BETTER_AUTH_ID'
);

-- 3. Test the helper function
SELECT public.get_user_uuid_from_better_auth_id('YOUR_BETTER_AUTH_ID') as user_uuid;

-- 4. Check if settings functions exist
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p 
WHERE p.proname IN (
    'upsert_user_settings', 
    'get_user_settings', 
    'get_user_email_connections', 
    'get_user_uuid_from_better_auth_id'
)
ORDER BY p.proname;

-- 5. Check unique constraint on user_settings
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.user_settings'::regclass 
AND contype = 'u';

-- 6. Check if user_settings table exists and has data
SELECT COUNT(*) as settings_count
FROM public.user_settings;

-- 7. Check email_connections table
SELECT 
    id,
    user_id,
    provider,
    email,
    is_active,
    created_at
FROM public.email_connections
ORDER BY created_at DESC
LIMIT 10;

-- 8. Test get_user_settings function
SELECT * FROM public.get_user_settings('YOUR_BETTER_AUTH_ID');

-- 9. Test get_user_email_connections function
SELECT * FROM public.get_user_email_connections('YOUR_BETTER_AUTH_ID');

-- 10. Check if email_connections table exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'email_connections'
ORDER BY ordinal_position;










