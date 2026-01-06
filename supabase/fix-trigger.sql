-- Fix the sync trigger function
-- The issue: EXCLUDED.name doesn't exist because 'name' is not in the INSERT column list
-- Solution: Use NEW.name directly instead of EXCLUDED.name

-- Drop existing triggers first
DROP TRIGGER IF EXISTS sync_user_on_better_auth_insert ON public.user;
DROP TRIGGER IF EXISTS sync_user_on_better_auth_update ON public.user;

-- Drop and recreate the function with the fix
DROP FUNCTION IF EXISTS sync_better_auth_user();

-- Fixed function: Use NEW.name instead of EXCLUDED.name
CREATE OR REPLACE FUNCTION sync_better_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update in the existing users table
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text::uuid, -- Generate UUID for existing users table
        NEW.email,
        NEW.name,  -- Use NEW.name (from the trigger context)
        NEW."createdAt",
        NEW."updatedAt"
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = NEW.name,  -- FIXED: Use NEW.name instead of EXCLUDED.name
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER sync_user_on_better_auth_insert
    AFTER INSERT ON public.user
    FOR EACH ROW
    EXECUTE FUNCTION sync_better_auth_user();

CREATE TRIGGER sync_user_on_better_auth_update
    AFTER UPDATE ON public.user
    FOR EACH ROW
    EXECUTE FUNCTION sync_better_auth_user();

-- Verify the function was created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'sync_better_auth_user';










