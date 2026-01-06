# Production Deployment Guide

This guide will help you deploy InboxIQ to production with:
- **Frontend**: Vercel (https://inboxiq.debx.co.in)
- **Backend/Auth**: Render (https://api.inboxiq.debx.co.in)

---

## 🚀 Quick Setup

### Step 1: Configure Frontend (Vercel)

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add these variables:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
   VITE_APP_URL=https://inboxiq.debx.co.in
   ```

3. **Redeploy** your frontend (or push a new commit)

---

### Step 2: Configure Backend (Render)

1. **Go to Render Dashboard** → Your Service → **Environment**

2. **Add these variables:**
   ```
   BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
   BETTER_AUTH_SECRET=your-production-secret-key-min-32-characters
   FRONTEND_URL=https://inboxiq.debx.co.in
   DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
   NODE_ENV=production
   ```

3. **Optional OAuth Credentials** (if using Gmail/Outlook):
   ```
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   OUTLOOK_CLIENT_ID=your-outlook-client-id
   OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
   ```

4. **Optional OpenAI** (for AI follow-up generation):
   ```
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

5. **Restart** your Render service

---

### Step 3: Update Google OAuth Redirect URI

If you're using Gmail OAuth:

1. **Go to Google Cloud Console** → **APIs & Services** → **Credentials**
2. **Click on your OAuth 2.0 Client ID**
3. **Add to Authorized redirect URIs:**
   ```
   https://api.inboxiq.debx.co.in/api/email-connections/callback?provider=gmail
   ```
4. **Save** the changes

---

### Step 4: Update Outlook OAuth Redirect URI

If you're using Outlook OAuth:

1. **Go to Azure Portal** → **App Registrations** → Your App
2. **Go to Authentication**
3. **Add Redirect URI:**
   ```
   https://api.inboxiq.debx.co.in/api/email-connections/callback?provider=outlook
   ```
4. **Save** the changes

---

## ✅ Verify Deployment

### Test Frontend:
1. Visit https://inboxiq.debx.co.in
2. Try signing up/signing in
3. Should redirect to `/dashboard` after successful auth

### Test Backend:
1. Visit https://api.inboxiq.debx.co.in/api/auth/session
2. Should return JSON (may be empty if not logged in)

### Test OAuth (if configured):
1. Go to Settings → Email Connections
2. Click "Connect Email" → Select Gmail/Outlook
3. Complete OAuth flow
4. Should redirect back to Settings page

---

## 🔧 Troubleshooting

### CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
- Verify `FRONTEND_URL` is set correctly in Render
- Verify `VITE_BETTER_AUTH_URL` is set correctly in Vercel
- Check browser console for exact CORS error

### Auth Not Working

**Problem:** Sign in redirects but doesn't authenticate

**Solution:**
- Verify `BETTER_AUTH_SECRET` is set in Render (must be 32+ characters)
- Verify `BETTER_AUTH_URL` matches your Render URL
- Check Render logs for errors

### Database Connection Errors

**Problem:** Backend can't connect to database

**Solution:**
- Verify `DATABASE_URL` is correct in Render
- Check Supabase dashboard → Settings → Database → Connection string
- Ensure password is correct (no special characters need URL encoding)

### OAuth Redirect Errors

**Problem:** OAuth callback fails

**Solution:**
- Verify redirect URI in Google/Azure matches exactly:
  ```
  https://api.inboxiq.debx.co.in/api/email-connections/callback?provider=gmail
  ```
- Check Render logs for OAuth errors
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly

---

## 📝 Environment Variable Reference

### Frontend (Vercel)
| Variable | Description | Example |
|----------|------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |
| `VITE_BETTER_AUTH_URL` | Backend URL | `https://api.inboxiq.debx.co.in` |
| `VITE_APP_URL` | Frontend URL | `https://inboxiq.debx.co.in` |

### Backend (Render)
| Variable | Description | Example |
|----------|------------|---------|
| `BETTER_AUTH_URL` | Backend URL | `https://api.inboxiq.debx.co.in` |
| `BETTER_AUTH_SECRET` | Auth secret (32+ chars) | `your-secret-key...` |
| `FRONTEND_URL` | Frontend URL | `https://inboxiq.debx.co.in` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `NODE_ENV` | Environment | `production` |
| `GOOGLE_CLIENT_ID` | Gmail OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth secret | `xxx` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-xxx` |

---

## 🎯 Next Steps

After deployment:

1. ✅ Test sign up / sign in flow
2. ✅ Test email connection (Gmail/Outlook)
3. ✅ Test email sync
4. ✅ Test lead detection
5. ✅ Test AI follow-up generation

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Better Auth Documentation](https://www.better-auth.com/docs)

