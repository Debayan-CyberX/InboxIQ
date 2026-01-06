# Troubleshooting "Failed to Fetch" Error

## Common Causes

### 1. Auth Server Not Running ⚠️

**Check:** Is the auth server running?

```bash
# In a separate terminal, run:
npm run dev:auth
```

You should see:
```
✅ Better Auth server running on https://inboxiq-qq72.onrender.com
📡 Auth API available at https://inboxiq-qq72.onrender.com/api/auth
```

**Fix:** Start the auth server in a separate terminal.

### 2. Wrong URL Configuration

**Check:** Is `VITE_BETTER_AUTH_URL` set correctly?

In `.env.local`:
```env
VITE_BETTER_AUTH_URL=https://inboxiq-qq72.onrender.com
```

**Fix:** 
1. Create/update `.env.local` file
2. Add `VITE_BETTER_AUTH_URL=https://inboxiq-qq72.onrender.com`
3. Restart Vite dev server

### 3. Port Conflict

**Check:** Is port 3001 already in use?

```bash
# Windows
netstat -ano | findstr :3001

# Kill the process if needed
taskkill /PID <PID> /F
```

**Fix:** Change port in `.env.local`:
```env
AUTH_PORT=3002
VITE_BETTER_AUTH_URL=http://localhost:3002
```

### 4. CORS Issues

**Check:** Browser console for CORS errors

**Fix:** The server is configured for CORS, but make sure:
- Vite is running on port 8080 or 5173
- Auth server allows those origins

### 5. Database Connection

**Check:** Is `DATABASE_URL` set?

**Fix:** Add to `.env.local`:
```env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

## Quick Diagnostic Steps

1. **Check if auth server is running:**
   ```bash
   curl https://inboxiq-qq72.onrender.com/health
   ```
   Should return: `{"status":"ok","service":"better-auth"}`

2. **Check browser console:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try signing up
   - Look for failed requests to `localhost:3001`

3. **Check terminal output:**
   - Auth server terminal should show incoming requests
   - Look for error messages

## Step-by-Step Fix

1. **Start Auth Server:**
   ```bash
   npm run dev:auth
   ```

2. **Verify it's running:**
   - Open `https://inboxiq-qq72.onrender.com/health` in browser
   - Should see `{"status":"ok"}`

3. **Check environment variables:**
   ```bash
   # Make sure .env.local exists and has:
   VITE_BETTER_AUTH_URL=https://inboxiq-qq72.onrender.com
   ```

4. **Restart Vite server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

5. **Try again:**
   - Go to sign up page
   - Fill in the form
   - Check browser console for errors

## Still Not Working?

1. Check both terminal outputs (auth server + Vite)
2. Check browser console (F12)
3. Check Network tab for failed requests
4. Verify database migration ran successfully
5. Make sure `DATABASE_URL` is correct









