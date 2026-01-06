# Fix: Settings Save Error + Email Connection Issues

## 🔴 Issues Identified

1. **Settings Save Error**: "column reference 'user_id' is ambiguous"
   - The `upsert_user_settings` function has an ambiguous `user_id` reference in the ON CONFLICT clause
   - **Fix**: Use the constraint name `user_settings_user_id_key` instead of just `user_id`

2. **Gmail Connection Not Showing**: After connecting Gmail, it shows "no email connected"
   - The OAuth redirect URI was pointing to the wrong endpoint
   - **Fix**: Changed redirect URI to point to the callback endpoint

## ✅ Fixes Applied

### 1. Database Function Fix

**File**: `supabase/FIX_BOTH_ISSUES_COMPLETE.sql`

This SQL file:
- Creates/updates the unique constraint with a named constraint (`user_settings_user_id_key`)
- Fixes the `upsert_user_settings` function to use the constraint name
- Ensures the `get_user_email_connections` function exists
- Creates the `email_connections` table if it doesn't exist

**Action Required**: Run this SQL file in Supabase SQL Editor

### 2. Server Code Fix

**File**: `server/index.ts`

Fixed the Gmail OAuth redirect URI to point to the correct callback endpoint:
- **Before**: Redirected to `/settings?tab=email` (wrong)
- **After**: Redirects to `/api/email-connections/callback?provider=gmail` (correct)

**Status**: ✅ Already fixed in code

## 📋 Step-by-Step Fix Instructions

### Step 1: Run Database Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Open the file: `supabase/FIX_BOTH_ISSUES_COMPLETE.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

This will:
- ✅ Fix the ambiguous `user_id` error
- ✅ Ensure email connections table exists
- ✅ Ensure email connections function exists

### Step 2: Update Google OAuth Redirect URI

If you've already set up Google OAuth, you need to update the redirect URI:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add/update:
   - `https://inboxiq-qq72.onrender.com/api/email-connections/callback?provider=gmail` (development)
   - `https://your-domain.com/api/email-connections/callback?provider=gmail` (production)
   
   **Note**: The callback URL is on port 3001 (auth server), not 8081 (frontend)
5. Click **Save**

### Step 3: Restart Your Server

After making the changes:

1. Stop your auth server (Ctrl+C)
2. Restart it: `npm run dev` or `node server/index.ts`

### Step 4: Test Settings Save

1. Go to **Settings** page
2. Make a change (e.g., update your name)
3. Click **Save Changes**
4. ✅ Should save successfully without the ambiguous error

### Step 5: Test Gmail Connection

1. Go to **Settings** → **Security** tab
2. Click **Add Account** under "Connected Email Accounts"
3. Select **Gmail**
4. Complete the OAuth flow
5. ✅ Should redirect back and show your Gmail account as connected

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify everything is set up correctly:

```sql
-- 1. Check if settings function exists
SELECT p.proname, pg_get_function_arguments(p.oid) 
FROM pg_proc p 
WHERE p.proname = 'upsert_user_settings';

-- 2. Check if email connections function exists
SELECT p.proname, pg_get_function_arguments(p.oid) 
FROM pg_proc p 
WHERE p.proname = 'get_user_email_connections';

-- 3. Check if constraint exists
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'public.user_settings'::regclass 
AND contype = 'u';

-- 4. Check if email_connections table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'email_connections';
```

## 🐛 Troubleshooting

### Settings Still Not Saving

1. **Check if function exists**:
   ```sql
   SELECT p.proname FROM pg_proc p WHERE p.proname = 'upsert_user_settings';
   ```
   If it doesn't exist, run `FIX_BOTH_ISSUES_COMPLETE.sql` again.

2. **Check constraint name**:
   ```sql
   SELECT conname FROM pg_constraint 
   WHERE conrelid = 'public.user_settings'::regclass AND contype = 'u';
   ```
   Should return `user_settings_user_id_key`

3. **Check browser console** for any JavaScript errors

### Gmail Connection Still Not Showing

1. **Check if connection was saved**:
   ```sql
   SELECT * FROM public.email_connections 
   ORDER BY created_at DESC LIMIT 5;
   ```

2. **Check if function exists**:
   ```sql
   SELECT p.proname FROM pg_proc p WHERE p.proname = 'get_user_email_connections';
   ```

3. **Check server logs** for OAuth callback errors

4. **Verify redirect URI** in Google Cloud Console matches:
   - `https://inboxiq-qq72.onrender.com/api/email-connections/callback?provider=gmail` (dev)
   - Or your production URL

5. **Check browser console** for API errors when loading connections

### OAuth Callback Error

If you see errors in the OAuth callback:

1. **Check server logs** - the callback handler logs errors
2. **Verify DATABASE_URL** is set in `.env.local`
3. **Verify GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET** are set
4. **Check redirect URI** matches exactly in Google Cloud Console

## 📝 Summary

**What was fixed:**
- ✅ Ambiguous `user_id` error in settings save function
- ✅ Gmail OAuth redirect URI mismatch
- ✅ Database functions and tables ensured to exist

**What you need to do:**
1. Run `supabase/FIX_BOTH_ISSUES_COMPLETE.sql` in Supabase
2. Update Google OAuth redirect URI in Google Cloud Console
3. Restart your server
4. Test settings save
5. Test Gmail connection

**Expected results:**
- ✅ Settings save without errors
- ✅ Gmail connection appears after OAuth flow
- ✅ Email connections list shows connected accounts

