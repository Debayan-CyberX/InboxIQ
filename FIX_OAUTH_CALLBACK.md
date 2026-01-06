# Fix: OAuth Callback and Connection Saving

## ✅ What I Fixed

1. **OAuth Callback Handler** - Now properly exchanges code for tokens and saves connection
2. **Settings Function** - Fixed ambiguous `user_id` error
3. **Redirect URI** - Updated to use backend callback endpoint

---

## 🔧 Quick Fixes Needed

### Step 1: Update Google OAuth Redirect URI

The redirect URI in Google Console needs to match the backend callback endpoint:

1. **Go to Google Cloud Console** → **Credentials** → Your OAuth Client
2. **Update Authorized redirect URIs** to include:
   ```
   https://api.inboxiq.debx.co.in/api/email-connections/callback?provider=gmail
   ```
   (For production, use your production backend URL)

3. **Save** the changes

### Step 2: Run Database Migration (If Not Done)

Run this in Supabase SQL Editor:
- `supabase/create-email-connections-table.sql`

### Step 3: Fix Settings Function (If Error Persists)

Run this in Supabase SQL Editor:
- `supabase/fix-settings-functions.sql`

This fixes the ambiguous `user_id` error.

### Step 4: Restart Auth Server

After making changes:
```bash
npm run dev:auth
```

---

## 🎯 How It Works Now

1. **User clicks "Connect Email"** → Selects Gmail
2. **Redirects to Google** → User authorizes
3. **Google redirects to:** `https://api.inboxiq.debx.co.in/api/email-connections/callback?provider=gmail&code=...&state=...`
4. **Backend:**
   - Exchanges code for access/refresh tokens
   - Gets user email from Google
   - Saves connection to database
   - Redirects to Settings page with success
5. **Frontend:** Settings page detects success and reloads connections

---

## ✅ Test It

1. **Update Google Console redirect URI** (Step 1 above)
2. **Restart auth server**
3. **Click "Connect Email"** → Select Gmail
4. **Complete OAuth flow**
5. **Should redirect back and connection should be saved!**

---

## 🐛 If Still Not Working

### Check Backend Logs

Look at the terminal running `npm run dev:auth` for:
- "📧 OAuth callback received"
- "✅ Email connection saved"
- Any error messages

### Common Issues

1. **Redirect URI mismatch:**
   - Error: "redirect_uri_mismatch"
   - Fix: Update Google Console redirect URI to match exactly

2. **Database error:**
   - Error: "User not found" or database errors
   - Fix: Make sure user exists in `public.users` table

3. **Token exchange fails:**
   - Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
   - Check redirect URI matches exactly

---

## 📝 Next Steps After Connection Works

Once connection is saved:
1. ✅ Connection appears in Settings → Security tab
2. ✅ Header button shows connected email
3. 🔄 **Next:** Implement email sync to fetch actual emails







