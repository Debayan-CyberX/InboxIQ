# How to Connect Gmail - Step by Step Guide

## 🎯 Quick Start: Two Ways to Connect Gmail

### Option 1: Gmail OAuth (Recommended - Most Secure) ✅

This uses Google's official OAuth, which is the most secure method.

### Option 2: IMAP (Quick Setup - Works Immediately) ⚡

This works right away without any setup, but requires an App Password.

---

## 📧 Option 1: Gmail OAuth Setup

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project:**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "InboxAI Assistant")

3. **Enable Gmail API:**
   - In the left sidebar, go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click on it and click **Enable**

4. **Create OAuth Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - Choose **External** (unless you have a Google Workspace)
     - Fill in required fields (App name, User support email, Developer contact)
     - Click **Save and Continue**
     - Add scopes: `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`
     - Click **Save and Continue** → **Save and Continue** → **Back to Dashboard**

5. **Create OAuth Client ID:**
   - Application type: **Web application**
   - Name: "InboxAI Assistant" (or any name)
   - **Authorized redirect URIs:** Add these:
     ```
     http://localhost:8080/settings?tab=email&provider=gmail
     https://inboxiq-qq72.onrender.com/api/email-connections/callback
     ```
     (For production, also add your production URL)
   - Click **Create**
   - **Copy the Client ID and Client Secret** (you'll need these!)

### Step 2: Add Credentials to Your App

1. **Open your `.env.local` file**

2. **Add these lines:**
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

3. **Replace the values** with your actual Client ID and Client Secret from Step 1

### Step 3: Restart Your Auth Server

1. **Stop the server** (Ctrl+C in the terminal running `npm run dev:auth`)
2. **Restart it:**
   ```bash
   npm run dev:auth
   ```

### Step 4: Connect Gmail in the App

1. **Go to Settings:**
   - Open your app
   - Navigate to **Settings** → **Security** tab

2. **Click "Add Account"** in the "Connected Email Accounts" section

3. **Select "Gmail"**

4. **You'll be redirected to Google:**
   - Sign in with your Gmail account
   - Review the permissions
   - Click **Allow** or **Continue**

5. **You'll be redirected back:**
   - The connection should be saved automatically
   - You'll see your Gmail account in the connected accounts list

---

## 📬 Option 2: IMAP Connection (Quick Setup)

This works immediately without OAuth setup, but you need to generate an App Password.

### Step 1: Generate Gmail App Password

1. **Go to your Google Account:**
   - Visit: https://myaccount.google.com/
   - Sign in

2. **Enable 2-Step Verification** (if not already enabled):
   - Go to **Security** → **2-Step Verification**
   - Follow the prompts to enable it

3. **Create App Password:**
   - Go to **Security** → **App passwords**
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: "InboxAI Assistant"
   - Click **Generate**
   - **Copy the 16-character password** (you'll need this!)

### Step 2: Connect via IMAP in the App

1. **Go to Settings:**
   - Open your app
   - Navigate to **Settings** → **Security** tab

2. **Click "Add Account"**

3. **Select "IMAP / Other"**

4. **Fill in the form:**
   - **Email Address:** your Gmail address (e.g., `you@gmail.com`)
   - **Password:** Paste the **16-character App Password** from Step 1 (NOT your regular Gmail password!)
   - **IMAP Server:** `imap.gmail.com` (already filled)
   - **Port:** `993` (already filled)

5. **Click "Connect"**

6. **Success!** Your Gmail account should now be connected

---

## 🔍 Troubleshooting

### OAuth: "OAuth not configured"

**Problem:** You see "Gmail OAuth not configured" error

**Solution:**
1. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are in `.env.local`
2. Make sure you restarted the auth server after adding them
3. Verify the values are correct (no extra spaces)

### OAuth: Redirect URI mismatch

**Problem:** Google shows "redirect_uri_mismatch" error

**Solution:**
1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure the redirect URI exactly matches:
   ```
   http://localhost:8080/settings?tab=email&provider=gmail
   ```
4. Save and try again

### IMAP: "Invalid credentials"

**Problem:** IMAP connection fails with "Invalid credentials"

**Solution:**
1. Make sure you're using the **App Password**, not your regular Gmail password
2. Verify 2-Step Verification is enabled
3. Try generating a new App Password
4. Check that IMAP is enabled in Gmail settings:
   - Gmail → Settings → See all settings → Forwarding and POP/IMAP
   - Enable IMAP access

### IMAP: "Connection timeout"

**Problem:** Connection times out

**Solution:**
1. Check your firewall/network settings
2. Verify IMAP server: `imap.gmail.com`
3. Verify port: `993` (SSL)
4. Try from a different network

### "Function get_user_email_connections does not exist"

**Problem:** Database error when trying to connect

**Solution:**
1. Run the database migration:
   - Open Supabase Dashboard → SQL Editor
   - Run: `supabase/create-email-connections-table.sql`
2. Refresh the page and try again

---

## ✅ Verification

After connecting, you should see:

1. **In Settings → Security tab:**
   - Your Gmail address listed under "Connected Email Accounts"
   - Status showing "Active"
   - Provider showing "gmail" or "imap"

2. **In the database:**
   - A record in the `email_connections` table
   - Your user_id, email, and provider

---

## 🔒 Security Best Practices

1. **OAuth is more secure** than IMAP passwords
2. **Never share** your OAuth credentials or App Passwords
3. **Rotate App Passwords** periodically if using IMAP
4. **Use OAuth in production** when possible
5. **Keep `.env.local` secure** - never commit it to git

---

## 📝 Quick Reference

### OAuth Setup Checklist:
- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created
- [ ] Redirect URIs added
- [ ] Client ID and Secret copied
- [ ] Added to `.env.local`
- [ ] Auth server restarted
- [ ] Tested connection in app

### IMAP Setup Checklist:
- [ ] 2-Step Verification enabled
- [ ] App Password generated
- [ ] App Password copied
- [ ] Connected via IMAP form
- [ ] Verified in Settings

---

## 🎉 You're Done!

Your Gmail account is now connected! The app can now:
- Sync emails (when sync is implemented)
- Send emails on your behalf
- Track email activity
- Generate AI drafts based on your emails

**Need help?** Check the troubleshooting section above or review the error messages in the browser console.







