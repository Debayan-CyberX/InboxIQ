# Fix: Function Ambiguity Error

## Error Message
```
ERROR: 42725: function name "public.get_user_leads" is not unique
HINT: Specify the argument list to select the function unambiguously.
```

## Cause
You have **multiple versions** of the same function in your database:
- Old version: `get_user_leads(p_user_id UUID, ...)` 
- New version: `get_user_leads(p_better_auth_id TEXT, ...)`

PostgreSQL can't determine which one to use, causing the ambiguity error.

## Solution

### Step 1: Clean Up Old Functions
Run this SQL script in your **Supabase SQL Editor**:

**File:** `supabase/fix-all-function-ambiguities.sql`

This will drop all old UUID-based function versions.

### Step 2: Create Correct Functions
Run this SQL script in your **Supabase SQL Editor**:

**File:** `supabase/fix-user-id-mapping.sql`

This creates the correct TEXT-based (Better Auth ID) versions of all functions.

### Step 3: Verify
After running both scripts, test your application:
1. Navigate to the Leads page
2. The error should be resolved
3. Leads should load correctly

## Quick Fix (Single Script)

If you prefer a single script, you can also use:

**File:** `supabase/fix-get-user-leads-function.sql`

This script:
1. Drops all old versions of `get_user_leads`
2. Creates the helper function `get_user_uuid_from_better_auth_id`
3. Creates the correct `get_user_leads` function with TEXT parameter

## How to Run SQL in Supabase

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the SQL script
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

## Verification Query

After running the fix, verify with this query:

```sql
-- Check that only the TEXT version exists
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_user_leads';
```

You should see only **one** function with `p_better_auth_id TEXT` parameter.

## If Error Persists

If you still get the error after running the fix:

1. **Check for other function versions:**
   ```sql
   SELECT 
       p.proname as function_name,
       pg_get_function_arguments(p.oid) as arguments
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public' 
   AND p.proname LIKE '%get_user%';
   ```

2. **Manually drop specific versions:**
   ```sql
   -- Replace with actual function signature from above query
   DROP FUNCTION IF EXISTS public.get_user_leads(UUID, TEXT, TEXT) CASCADE;
   ```

3. **Recreate the function:**
   Run `supabase/fix-user-id-mapping.sql` again









