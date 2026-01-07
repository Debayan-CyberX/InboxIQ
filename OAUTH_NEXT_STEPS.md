# OAuth Setup - Next Steps

## ✅ You've Created OAuth Credentials - Now What?

Follow these steps to complete the Gmail OAuth connection:

---

## Step 1: Add Credentials to `.env.local`

1. **Open your `.env.local` file** (in the project root)

2. **Add these lines:**
   ```env
   # Gmail OAuth
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

3. **Replace the values:**
   - `your-client-id-here` → Your actual Google Client ID
   - `your-client-secret-here` → Your actual Google Client Secret
   
   **Important:** No quotes, no spaces, just paste the values directly

4. **Save the file**

---

## Step 2: Verify Redirect URI

Make sure your Google OAuth app has this redirect URI:

```
http://localhost:8080/settings?tab=email&provider=gmail
```

**To check/update:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, make sure you have:
   - `http://localhost:8080/settings?tab=email&provider=gmail`
   - (For production, add your production URL too)
5. Click **Save**

---

## Step 3: Restart Your Auth Server

1. **Stop the auth server:**
   - Go to the terminal running `npm run dev:auth`
   - Press `Ctrl+C` to stop it

2. **Restart it:**
   ```bash
   npm run dev:auth
   ```

3. **Verify it's running:**
   You should see:
   ```
   ✅ Better Auth server running on https://api.inboxiq.debx.co.in
   📡 Auth API available at https://api.inboxiq.debx.co.in/api/auth
   📧 Email API available at https://api.inboxiq.debx.co.in/api/emails/send
   🔗 Email Connections API available at https://api.inboxiq.debx.co.in/api/email-connections
   ```

---

## Step 4: Test the Connection

1. **Open your app** in the browser (usually `http://localhost:8080`)

2. **Click "Connect Email"** button in the top-right header

3. **Select "Gmail"** from the options

4. **You should be redirected to Google:**
   - Sign in with your Gmail account
   - Review the permissions (Gmail read and send)
   - Click **Allow** or **Continue**

5. **You'll be redirected back:**
   - Should redirect to: `http://localhost:8080/settings?tab=email&provider=gmail`
   - Your Gmail account should now be connected!

---

## Step 5: Verify Connection

1. **Check the header button:**
   - Should now show your email address instead of "Connect Email"
   - Should have a green checkmark

2. **Check Settings:**
   - Go to **Settings** → **Security** tab
   - Under "Connected Email Accounts"
   - You should see your Gmail address listed
   - Status should show "Active"

---

## 🐛 Troubleshooting

### "OAuth not configured" Error

**Problem:** Still seeing "Gmail OAuth not configured"

**Solutions:**
1. ✅ Check `.env.local` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. ✅ Make sure you **restarted** the auth server after adding them
3. ✅ Verify no extra spaces or quotes around the values
4. ✅ Check the values are correct (copy-paste from Google Console)

### "redirect_uri_mismatch" Error

**Problem:** Google shows "redirect_uri_mismatch" error

**Solutions:**
1. ✅ Go to Google Cloud Console → Credentials
2. ✅ Edit your OAuth client
3. ✅ Add this **exact** redirect URI:
   ```
   http://localhost:8080/settings?tab=email&provider=gmail
   ```
4. ✅ Make sure it matches **exactly** (including `http://` not `https://`)
5. ✅ Click **Save**
6. ✅ Try connecting again

### Connection Not Saving

**Problem:** OAuth works but connection doesn't save

**Solutions:**
1. ✅ Check database migration is run:
   - Run `supabase/create-email-connections-table.sql` in Supabase SQL Editor
2. ✅ Check browser console for errors
3. ✅ Verify user is logged in
4. ✅ Check Supabase connection is working

### "Function get_user_email_connections does not exist"

**Problem:** Database error when trying to view connections

**Solution:**
1. ✅ Run the database migration:
   - Open Supabase Dashboard → SQL Editor
   - Run: `supabase/create-email-connections-table.sql`
2. ✅ Refresh the page

---

## ✅ Checklist

Before testing, make sure:

- [ ] `GOOGLE_CLIENT_ID` added to `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` added to `.env.local`
- [ ] Redirect URI added in Google Console
- [ ] Auth server restarted
- [ ] Database migration run (`create-email-connections-table.sql`)
- [ ] App is running (`npm run dev`)
- [ ] Auth server is running (`npm run dev:auth`)

---

## 🎯 What Happens After Connection

Once connected, the app can:
- ✅ Store your Gmail connection
- ✅ Show connection status in header
- ✅ Manage connections in Settings
- 🔄 **Next:** Implement email sync to fetch your actual emails

---

## 📝 Quick Test

1. **Click "Connect Email"** in header
2. **Select "Gmail"**
3. **Complete OAuth flow**
4. **Should redirect back and show connected!**

If everything works, you'll see your Gmail address in the header button! 🎉

---

## 🚀 Next: Email Sync

After connecting, you'll want to:
1. Implement email sync to fetch emails from Gmail
2. Store emails in your database
3. Show them in the Inbox page
4. Generate AI insights from them

But first, let's make sure the connection works! Test it and let me know if you encounter any issues.









