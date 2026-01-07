# ✅ Gmail OAuth Flow Fixes

## Issues Fixed

### 1. ✅ Real Gmail Email Address
**Problem:** UI showed "unknown@example.com" instead of real Gmail address

**Solution:**
- Now uses Gmail API `gmail.users.getProfile({ userId: "me" })` to fetch the real email
- Extracts `profile.data.emailAddress` 
- Stores the real email in database
- Removed "unknown@example.com" fallback
- Added error handling if email fetch fails

### 2. ✅ Correct Redirect Port
**Problem:** Redirected to wrong port (8080 instead of 8081)

**Solution:**
- Uses `process.env.FRONTEND_URL` (defaults to `http://localhost:8081`)
- Falls back to `VITE_APP_URL` if `FRONTEND_URL` not set
- All redirects now go to port 8081
- Added logging to verify redirect URLs

## Changes Made

### `server/index.ts`

1. **Gmail Email Fetching:**
   ```typescript
   // Now uses Gmail API instead of userinfo
   const gmail = google.gmail({ version: "v1", auth: oauth2Client });
   const profileResponse = await gmail.users.getProfile({ userId: "me" });
   userEmail = profileResponse.data.emailAddress || "";
   ```

2. **Frontend URL:**
   ```typescript
   // Uses FRONTEND_URL with default to port 8081
   const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "http://localhost:8081";
   ```

3. **Removed Fallback:**
   ```typescript
   // Before: userEmail || "unknown@example.com"
   // After: userEmail (throws error if not found)
   if (!userEmail) {
     throw new Error("Gmail email address is required but was not fetched");
   }
   ```

4. **Database Update:**
   ```typescript
   // Now updates email and display_name on conflict
   ON CONFLICT (user_id, email, provider) 
   DO UPDATE SET
     ...
     email = EXCLUDED.email,
     display_name = EXCLUDED.display_name,
     ...
   ```

5. **Added Logging:**
   - Logs redirect URLs for debugging
   - Logs Gmail profile fetch
   - Logs email address when saved

## Environment Variables

Add to `.env.local`:

```env
FRONTEND_URL=http://localhost:8081
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=your_database_url
```

## Testing

1. **Connect Gmail:**
   - Go to Settings → Security
   - Click "Add Account" → Gmail
   - Complete OAuth flow

2. **Verify Email:**
   - Check Settings → Security tab
   - Should show your real Gmail address (not "unknown@example.com")
   - Check server logs for: `✅ Email connection saved: { email: "your@gmail.com" }`

3. **Verify Redirect:**
   - After OAuth, should redirect to: `http://localhost:8081/settings?tab=email&success=true&provider=gmail`
   - Check server logs for: `🔀 Redirecting to: http://localhost:8081/...`

4. **Check Database:**
   ```sql
   SELECT email, provider, is_active 
   FROM email_connections 
   WHERE provider = 'gmail';
   ```
   - Should show your real Gmail address

## Expected Behavior

✅ **Before Fix:**
- Email: "unknown@example.com"
- Redirect: `http://localhost:8080/settings?...`

✅ **After Fix:**
- Email: "your.actual@gmail.com"
- Redirect: `http://localhost:8081/settings?...`

## Troubleshooting

### Still seeing "unknown@example.com"
- Check server logs for Gmail API errors
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check if Gmail API profile fetch is working

### Redirect still going to wrong port
- Verify `FRONTEND_URL=http://localhost:8081` in `.env.local`
- Check server logs for redirect URL
- Restart server after changing `.env.local`

### Gmail API errors
- Ensure Gmail API is enabled in Google Cloud Console
- Check OAuth scopes include `https://www.googleapis.com/auth/gmail.readonly`
- Verify access token is valid

## Summary

✅ Real Gmail email address fetched and stored
✅ Redirects to correct port (8081)
✅ Removed "unknown@example.com" fallback
✅ Added proper error handling
✅ Added logging for debugging

The OAuth flow should now work correctly! 🎉


