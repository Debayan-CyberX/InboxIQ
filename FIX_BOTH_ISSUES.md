# Fix: Ambiguous user_id Error + Email Connection Not Saving

## Issues

1. **Ambiguous user_id Error**: "column reference 'user_id' is ambiguous" when saving settings
2. **Email Connection Not Saving**: Gmail OAuth redirects back but connection isn't saved

## Solution

### Step 1: Fix the Ambiguous user_id Error

Run this SQL script in Supabase SQL Editor:

**File:** `supabase/fix-ambiguous-user-id-final.sql`

This script:
1. Creates a named unique constraint (`user_settings_user_id_key`)
2. Updates the `upsert_user_settings` function to use `ON CONFLICT ON CONSTRAINT user_settings_user_id_key`

### Step 2: Fix Email Connection Saving

The server code has been updated to:
1. Use the `get_user_uuid_from_better_auth_id` database function instead of manual JOIN
2. This ensures consistent user UUID lookup

**No action needed** - the server code is already updated in `server/index.ts`

### Step 3: Restart Your Auth Server

After running the SQL fix, restart your auth server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev:auth
```

### Step 4: Test

1. **Test Settings Save**:
   - Go to Settings page
   - Change any setting
   - Click Save
   - Should work without the ambiguous error

2. **Test Email Connection**:
   - Go to Settings → Email tab
   - Click "Connect Email" → Gmail
   - Complete OAuth flow
   - Should redirect back and save the connection

---

## What Was Fixed

### Ambiguous user_id Error
- **Problem**: PostgreSQL couldn't determine which `user_id` column to use in `ON CONFLICT` clause
- **Solution**: Use named constraint `ON CONFLICT ON CONSTRAINT user_settings_user_id_key` instead of `ON CONFLICT (user_id)`

### Email Connection Not Saving
- **Problem**: Server was using manual JOIN query that might fail
- **Solution**: Use the database function `get_user_uuid_from_better_auth_id` for consistent UUID lookup

---

## Alternative: Run Comprehensive Fix

If you want to fix everything at once, run:
- `supabase/fix-all-better-auth-functions.sql`

This includes all fixes, but make sure to restart your auth server after running it.

---

## Troubleshooting

If you still see errors:

1. **Check if constraint exists**:
   ```sql
   SELECT conname FROM pg_constraint 
   WHERE conrelid = 'public.user_settings'::regclass 
   AND contype = 'u';
   ```
   Should return `user_settings_user_id_key`

2. **Check if function exists**:
   ```sql
   SELECT p.proname, pg_get_function_arguments(p.oid) 
   FROM pg_proc p 
   WHERE p.proname = 'upsert_user_settings';
   ```

3. **Check server logs** for email connection errors

4. **Verify user exists** in both `public."user"` and `public.users` tables with matching email









