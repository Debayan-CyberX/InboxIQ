# Production Configuration Summary

## ✅ Changes Made

### 1. Server Configuration (`server/auth.ts`)
- ✅ Added production frontend URL (`https://inboxiq-psi.vercel.app`) to `trustedOrigins`
- ✅ Updated `baseURL` to use production backend URL (`https://inboxiq-qq72.onrender.com`) when in production
- ✅ Maintains backward compatibility with development URLs

### 2. Backend CORS (`server/index.ts`)
- ✅ Added production frontend URL to CORS allowed origins
- ✅ Implemented dynamic CORS origin checking with proper error logging
- ✅ Updated OAuth callback redirect to use production frontend URL when in production
- ✅ Updated OAuth redirect URI generation to use production backend URL

### 3. Frontend Auth Client (`src/lib/auth-client.ts`)
- ✅ Updated to use production backend URL (`https://inboxiq-qq72.onrender.com`) in production
- ✅ Falls back to `localhost:3001` in development
- ✅ Added production mode logging

### 4. API Clients
- ✅ `src/lib/api/emails.ts` - Updated `sendEmail` to use production backend URL
- ✅ `src/lib/api/email-connections.ts` - Already uses `VITE_BETTER_AUTH_URL` env var
- ✅ `src/lib/api/leads.ts` - Already uses `VITE_BETTER_AUTH_URL` env var

### 5. OAuth Configuration
- ✅ Gmail OAuth redirect URI uses production backend URL
- ✅ Outlook OAuth redirect URI uses production backend URL
- ✅ Callback handler redirects to production frontend URL

---

## 🔧 Required Environment Variables

### Frontend (Vercel)
Set these in **Vercel Dashboard → Settings → Environment Variables**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BETTER_AUTH_URL=https://inboxiq-qq72.onrender.com
VITE_APP_URL=https://inboxiq-psi.vercel.app
```

### Backend (Render)
Set these in **Render Dashboard → Environment**:

```env
BETTER_AUTH_URL=https://inboxiq-qq72.onrender.com
BETTER_AUTH_SECRET=your-32-character-secret-key
FRONTEND_URL=https://inboxiq-psi.vercel.app
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
NODE_ENV=production

# Optional OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Optional OpenAI
OPENAI_API_KEY=sk-your-api-key
```

---

## 🔄 OAuth Redirect URIs

### Google Cloud Console
Add this redirect URI:
```
https://inboxiq-qq72.onrender.com/api/email-connections/callback?provider=gmail
```

### Azure Portal (Outlook)
Add this redirect URI:
```
https://inboxiq-qq72.onrender.com/api/email-connections/callback?provider=outlook
```

---

## ✅ Testing Checklist

After deployment, test:

1. **Sign Up / Sign In**
   - [ ] Visit https://inboxiq-psi.vercel.app
   - [ ] Sign up with new account
   - [ ] Should redirect to `/dashboard` after sign up
   - [ ] Sign out and sign in again
   - [ ] Should redirect to `/dashboard` after sign in

2. **Email Connection**
   - [ ] Go to Settings → Email Connections
   - [ ] Click "Connect Email" → Select Gmail
   - [ ] Complete OAuth flow
   - [ ] Should redirect back to Settings page
   - [ ] Connection should appear in list

3. **Email Sync**
   - [ ] Click "Sync" on connected email
   - [ ] Should sync emails successfully

4. **Lead Detection**
   - [ ] Go to Leads page
   - [ ] Click "Detect Leads"
   - [ ] Should detect leads from email threads

5. **AI Follow-up**
   - [ ] Click "Generate Follow-up" on a lead
   - [ ] Should generate draft and redirect to Drafts page

---

## 🐛 Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` is set in Render
- Verify `VITE_BETTER_AUTH_URL` is set in Vercel
- Check browser console for exact error

### Auth Not Working
- Verify `BETTER_AUTH_SECRET` is 32+ characters
- Verify `BETTER_AUTH_URL` matches Render URL
- Check Render logs

### OAuth Redirect Fails
- Verify redirect URI in Google/Azure matches exactly
- Check Render logs for OAuth errors
- Verify OAuth credentials are set correctly

---

## 📝 Notes

- All URLs are configured to work in both development and production
- Development URLs (`localhost`) are still supported for local testing
- Production URLs are used when `NODE_ENV=production` or when environment variables are set
- The frontend automatically detects production mode using `import.meta.env.PROD`

