# Complete Fix Guide: Settings + Email Connections

## Issues Fixed

1. ✅ **Settings not saving** - Ambiguous `user_id` error
2. ✅ **Email connections not saving** - OAuth callback not working properly

---

## Step 1: Run Database Fix

**Open Supabase Dashboard → SQL Editor** and run:

**File:** `supabase/COMPREHENSIVE_FIX.sql`

This will:
- Fix the `upsert_user_settings` function to use simple `ON CONFLICT (user_id)`
- Ensure the unique constraint exists with correct name
- Verify all helper functions exist
- Fix email connections function

---

## Step 2: Verify Database Functions

After running the SQL, verify functions exist:

```sql
-- Check functions exist
SELECT p.proname, pg_get_function_arguments(p.oid) 
FROM pg_proc p 
WHERE p.proname IN (
  'upsert_user_settings', 
  'get_user_settings', 
  'get_user_email_connections', 
  'get_user_uuid_from_better_auth_id'
);
```

You should see all 4 functions listed.

---

## Step 3: Check Constraint Exists

```sql
-- Check unique constraint
SELECT conname FROM pg_constraint 
WHERE conrelid = 'public.user_settings'::regclass 
AND contype = 'u';
```

Should return: `user_settings_user_id_key`

---

## Step 4: Restart Auth Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev:auth
```

---

## Step 5: Test Settings Save

1. Go to **Settings** page
2. Change any setting (e.g., name, timezone)
3. Click **"Save Changes"**
4. Should see success toast ✅
5. Refresh page - settings should persist ✅

**If it still fails:**
- Open browser console (F12)
- Look for error messages
- Check Network tab for the RPC call to `upsert_user_settings`
- Share the error message

---

## Step 6: Test Email Connection

### For Gmail OAuth:

1. **Update Google OAuth Redirect URI** (if not done):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click your OAuth 2.0 Client ID
   - Add to **Authorized redirect URIs**:
     ```
     http://localhost:3001/api/email-connections/callback?provider=gmail
     ```
   - **Save**

2. **Test Connection**:
   - Go to **Settings** → **Email** tab
   - Click **"Connect Email"** → Select **Gmail**
   - Complete OAuth flow
   - Should redirect back to Settings
   - Connection should appear in the list ✅

**If it still fails:**
- Check auth server terminal for errors
- Look for messages like:
  - `❌ User not found: ...`
  - `❌ Database error saving connection: ...`
  - `✅ Email connection saved: ...`

---

## Step 7: Debugging

### Settings Not Saving

**Check browser console:**
```javascript
// Should see RPC call to upsert_user_settings
// If error, check the error message
```

**Check Supabase logs:**
- Go to Supabase Dashboard → Logs
- Look for errors related to `upsert_user_settings`

**Common issues:**
- User not found in `public.users` table
- Email mismatch between `public."user"` and `public.users`
- Function doesn't exist (run Step 1 again)

### Email Connections Not Saving

**Check auth server logs:**
- Look for `📧 OAuth callback received:`
- Look for `✅ Email connection saved:` or `❌ Database error`

**Common issues:**
- User UUID lookup failing
- Database insert failing (check constraints)
- Redirect URI mismatch in Google Console

**Manual test:**
```sql
-- Check if user exists
SELECT u.id, u.email, ba.id as better_auth_id, ba.email as ba_email
FROM public.users u
JOIN public."user" ba ON ba.email = u.email
LIMIT 5;

-- Check email connections
SELECT * FROM public.email_connections;
```

---

## What Was Fixed

### Settings Function
- **Before**: Used `ON CONFLICT ON CONSTRAINT user_settings_user_id_key` (required exact constraint name)
- **After**: Uses `ON CONFLICT (user_id)` (works with any unique constraint on that column)
- **Added**: Error handling if user not found

### Email Connections
- **Before**: Manual JOIN query that could fail
- **After**: Uses `get_user_uuid_from_better_auth_id` function for consistent lookup
- **Verified**: `get_user_email_connections` function exists

---

## Still Having Issues?

1. **Share the exact error message** from:
   - Browser console
   - Auth server terminal
   - Supabase logs

2. **Verify your setup**:
   - User exists in both `public."user"` and `public.users` with matching email
   - All functions exist (Step 2)
   - Constraint exists (Step 3)
   - Auth server is running

3. **Try manual test**:
   ```sql
   -- Replace 'YOUR_BETTER_AUTH_ID' with your actual ID
   SELECT public.get_user_uuid_from_better_auth_id('YOUR_BETTER_AUTH_ID');
   ```
   Should return a UUID, not NULL.

---

## Success Indicators

✅ Settings save without errors  
✅ Settings persist after page refresh  
✅ Email connection appears in Settings → Email tab  
✅ No errors in browser console  
✅ No errors in auth server terminal  






