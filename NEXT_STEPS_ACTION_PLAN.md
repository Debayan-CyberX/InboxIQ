# 🎯 Next Steps Action Plan

## ✅ What We've Fixed

1. **Settings Save Error** - Fixed ambiguous `user_id` error
2. **Gmail OAuth Redirect** - Fixed redirect URI mismatch
3. **Port Configuration** - Updated to port 8081

## 📋 Step-by-Step Action Plan

### Step 1: Run Database Migration (CRITICAL - Do This First!)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration**
   - Open the file: `supabase/FIX_BOTH_ISSUES_COMPLETE.sql`
   - Copy the **entire contents** (all 344 lines)
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned" or similar
   - If you see errors, check the error message and let me know

**This fixes:**
- ✅ Settings save error (ambiguous user_id)
- ✅ Email connections function
- ✅ Email connections table

---

### Step 2: Update Google OAuth Redirect URI

**Only if you've already set up Google OAuth:**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click on your **OAuth 2.0 Client ID**

3. **Update Authorized Redirect URIs**
   - Under **Authorized redirect URIs**, add:
     ```
     https://inboxiq-qq72.onrender.com/api/email-connections/callback?provider=gmail
     ```
   - If you have production, also add:
     ```
     https://your-domain.com/api/email-connections/callback?provider=gmail
     ```
   - **Remove** the old one that pointed to `/settings?tab=email`
   - Click **Save**

**Note:** The callback is on port **3001** (auth server), not 8081 (frontend)

---

### Step 3: Restart Your Servers

1. **Stop your auth server** (if running)
   - Press `Ctrl+C` in the terminal running the auth server

2. **Restart auth server**
   ```bash
   cd inboxai-assistant-main
   npm run dev
   # OR if you have a separate script:
   node server/index.ts
   ```

3. **Verify auth server is running**
   - Should see: `✅ Better Auth server running on https://inboxiq-qq72.onrender.com`
   - Check terminal for any errors

4. **Restart your frontend** (if needed)
   - Your Vite dev server should be on port 8081
   - If not running, start it:
   ```bash
   npm run dev
   ```

---

### Step 4: Test Settings Save

1. **Open your app**
   - Go to: `http://localhost:8081`
   - Log in if needed

2. **Go to Settings**
   - Click on **Settings** in the sidebar
   - Or navigate to: `http://localhost:8081/settings`

3. **Make a change**
   - Update your name, company, or any setting
   - Click **Save Changes**

4. **Verify success**
   - ✅ Should see: "Settings saved successfully!" toast
   - ❌ If you see the ambiguous error, the SQL migration didn't run correctly

---

### Step 5: Test Gmail Connection

1. **Go to Settings → Security tab**
   - Navigate to the **Security** tab in Settings

2. **Connect Gmail**
   - Click **Add Account** under "Connected Email Accounts"
   - Select **Gmail**
   - You'll be redirected to Google

3. **Authorize the app**
   - Sign in to Google
   - Click **Allow** to grant permissions

4. **Verify connection**
   - Should redirect back to Settings
   - ✅ Should see your Gmail account listed
   - ✅ Should show "Active" status
   - ❌ If it shows "no email connected", check server logs for errors

---

### Step 6: Verify Everything Works

**Quick Verification Checklist:**

- [ ] Settings save without errors
- [ ] Gmail connection appears after OAuth
- [ ] Email connections list shows your account
- [ ] No errors in browser console (F12)
- [ ] No errors in server terminal

---

## 🐛 Troubleshooting

### If Settings Still Don't Save

1. **Check if function exists:**
   ```sql
   SELECT p.proname FROM pg_proc p WHERE p.proname = 'upsert_user_settings';
   ```
   - Should return `upsert_user_settings`
   - If empty, run the SQL migration again

2. **Check constraint:**
   ```sql
   SELECT conname FROM pg_constraint 
   WHERE conrelid = 'public.user_settings'::regclass AND contype = 'u';
   ```
   - Should return `user_settings_user_id_key`

3. **Check browser console** (F12) for JavaScript errors

### If Gmail Connection Doesn't Show

1. **Check server logs** for OAuth callback errors
   - Look for errors when redirecting back from Google

2. **Verify redirect URI** in Google Cloud Console
   - Must match exactly: `https://inboxiq-qq72.onrender.com/api/email-connections/callback?provider=gmail`

3. **Check if connection was saved:**
   ```sql
   SELECT * FROM public.email_connections 
   ORDER BY created_at DESC LIMIT 5;
   ```
   - Should show your Gmail connection if it was saved

4. **Check if function exists:**
   ```sql
   SELECT p.proname FROM pg_proc p WHERE p.proname = 'get_user_email_connections';
   ```
   - Should return `get_user_email_connections`

### If You See Database Errors

1. **Verify DATABASE_URL is set** in `.env.local`
2. **Check Supabase connection** - make sure your project is active
3. **Check server logs** for connection errors

---

## 📝 Summary

**Priority Order:**
1. ✅ **Run SQL migration** (Step 1) - This is critical!
2. ✅ **Update OAuth redirect URI** (Step 2) - Only if you've set up Google OAuth
3. ✅ **Restart servers** (Step 3)
4. ✅ **Test settings save** (Step 4)
5. ✅ **Test Gmail connection** (Step 5)

**Expected Results:**
- Settings save successfully ✅
- Gmail connection appears after OAuth ✅
- No ambiguous user_id errors ✅
- Email connections list works ✅

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Check browser console (F12) for frontend errors
3. Check server terminal for backend errors
4. Run the verification SQL queries above
5. Share the error message and I'll help you fix it!

Good luck! 🚀

