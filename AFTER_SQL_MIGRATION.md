# ✅ After Running SQL Migration - Next Steps

## Step 1: Verify Migration Success

Run these verification queries in Supabase SQL Editor to confirm everything worked:

```sql
-- 1. Check if settings function exists
SELECT p.proname, pg_get_function_arguments(p.oid) 
FROM pg_proc p 
WHERE p.proname = 'upsert_user_settings';
```

**Expected:** Should return `upsert_user_settings` with arguments

```sql
-- 2. Check if email connections function exists
SELECT p.proname, pg_get_function_arguments(p.oid) 
FROM pg_proc p 
WHERE p.proname = 'get_user_email_connections';
```

**Expected:** Should return `get_user_email_connections` with arguments

```sql
-- 3. Check if constraint exists
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'public.user_settings'::regclass 
AND contype = 'u';
```

**Expected:** Should return `user_settings_user_id_key`

```sql
-- 4. Check if email_connections table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'email_connections';
```

**Expected:** Should return `email_connections`

---

## Step 2: Update Google OAuth Redirect URI

**Only if you've already set up Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized redirect URIs**, add:
   ```
   https://inboxiq-psi.vercel.app/api/email-connections/callback?provider=gmail
   ```
5. **Remove** any old redirect URI that points to `/settings?tab=email`
6. Click **Save**

**Note:** If you haven't set up Google OAuth yet, you can skip this step for now.

---

## Step 3: Restart Your Auth Server

1. **Stop your auth server** (if running)
   - Press `Ctrl+C` in the terminal

2. **Restart the server**
   ```bash
   # Make sure you're in the project directory
   cd inboxai-assistant-main
   
   # Start the auth server
   npm run dev
   # OR
   node server/index.ts
   ```

3. **Verify it's running**
   - Should see: `✅ Better Auth server running on https://inboxiq-psi.vercel.app`
   - Check for any error messages

---

## Step 4: Test Settings Save

1. **Open your app**
   - Go to: `http://localhost:8081`
   - Log in if needed

2. **Navigate to Settings**
   - Click **Settings** in the sidebar
   - Or go to: `http://localhost:8081/settings`

3. **Make a test change**
   - Update your name or any setting
   - Click **Save Changes**

4. **Check the result**
   - ✅ **Success:** Should see green toast "Settings saved successfully!"
   - ❌ **Error:** If you still see "ambiguous user_id" error, the migration may not have run correctly

---

## Step 5: Test Gmail Connection

1. **Go to Settings → Security tab**
   - Navigate to the **Security** tab in Settings

2. **Connect Gmail**
   - Click **Add Account** under "Connected Email Accounts"
   - Select **Gmail**
   - You'll be redirected to Google

3. **Authorize**
   - Sign in to your Google account
   - Click **Allow** to grant permissions

4. **Verify connection**
   - Should redirect back to Settings
   - ✅ Should see your Gmail account in the list
   - ✅ Should show "Active" status with green badge
   - ✅ Should show last sync time

---

## Step 6: Verify Everything Works

**Quick Checklist:**

- [ ] Settings save without errors
- [ ] Gmail connection appears after OAuth
- [ ] Email connections list shows your account
- [ ] No errors in browser console (press F12)
- [ ] No errors in server terminal

---

## 🐛 Troubleshooting

### If Settings Still Don't Save

**Check 1: Function exists?**
```sql
SELECT p.proname FROM pg_proc p WHERE p.proname = 'upsert_user_settings';
```
- If empty, the migration didn't run correctly - run it again

**Check 2: Constraint exists?**
```sql
SELECT conname FROM pg_constraint 
WHERE conrelid = 'public.user_settings'::regclass AND contype = 'u';
```
- Should return `user_settings_user_id_key`
- If different name or empty, run the migration again

**Check 3: Browser console errors**
- Press F12 → Console tab
- Look for any red error messages
- Share the error if you see one

### If Gmail Connection Doesn't Show

**Check 1: Connection was saved?**
```sql
SELECT * FROM public.email_connections 
ORDER BY created_at DESC LIMIT 5;
```
- Should show your Gmail connection if OAuth completed

**Check 2: Function exists?**
```sql
SELECT p.proname FROM pg_proc p WHERE p.proname = 'get_user_email_connections';
```
- Should return the function name

**Check 3: Server logs**
- Look at your auth server terminal
- Check for errors during OAuth callback
- Common issues:
  - Redirect URI mismatch
  - Database connection error
  - Missing environment variables

**Check 4: Redirect URI**
- Must match exactly in Google Cloud Console:
  - `https://inboxiq-psi.vercel.app/api/email-connections/callback?provider=gmail`
- Check for typos or extra spaces

### If You See Database Connection Errors

1. **Check `.env.local` file**
   - Make sure `DATABASE_URL` or `SUPABASE_DATABASE_URL` is set
   - Should look like: `postgresql://user:password@host:port/database`

2. **Check Supabase project**
   - Make sure your Supabase project is active
   - Check if you have the correct connection string

3. **Check server logs**
   - Look for database connection errors
   - Verify SSL settings if using Supabase

---

## 📊 What Should Work Now

After completing these steps:

✅ **Settings Page:**
- Can save all settings without errors
- Changes persist after page refresh
- No "ambiguous user_id" errors

✅ **Email Connections:**
- Gmail OAuth flow completes successfully
- Connection appears in Settings → Security tab
- Can see connection status and last sync time
- Can disconnect/delete connections

✅ **Overall:**
- No database function errors
- OAuth redirects work correctly
- All features function as expected

---

## 🎯 Summary

**What you just did:**
1. ✅ Ran SQL migration to fix database functions

**What to do next:**
1. ✅ Verify migration (optional but recommended)
2. ✅ Update Google OAuth redirect URI (if needed)
3. ✅ Restart auth server
4. ✅ Test settings save
5. ✅ Test Gmail connection

**Expected timeline:**
- Verification: 2 minutes
- OAuth setup: 5 minutes (if needed)
- Testing: 5 minutes
- **Total: ~10-15 minutes**

---

## 🆘 Still Having Issues?

If something isn't working:

1. **Check the error message carefully**
   - Copy the exact error text
   - Note where it appears (browser console, server terminal, or UI)

2. **Run verification queries**
   - Use the SQL queries above to check if functions exist

3. **Check server logs**
   - Look for any red error messages
   - Note the timestamp and context

4. **Share the details:**
   - Error message
   - Where it appears
   - What you were trying to do
   - Results of verification queries

I'll help you fix it! 🚀

