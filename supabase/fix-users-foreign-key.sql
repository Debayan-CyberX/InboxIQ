-- Fix the users table foreign key constraint
-- The issue: public.users.id references auth.users(id), but Better Auth doesn't use auth.users
-- Solution: Remove the foreign key constraint and make id independent

-- Drop the foreign key constraint
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Verify the constraint is gone
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'users'
AND tc.constraint_type = 'FOREIGN KEY';













