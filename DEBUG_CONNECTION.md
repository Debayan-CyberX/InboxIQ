# Debug: Cannot Connect to Auth Server

## Quick Checks

### 1. Verify Auth Server is Running

Open browser and go to:
```
https://inboxiq-qq72.onrender.com/health
```

Should see: `{"status":"ok","service":"better-auth"}`

### 2. Test CORS Connection

Open browser console (F12) and run:
```javascript
fetch('https://inboxiq-qq72.onrender.com/api/test', {
  credentials: 'include',
  mode: 'cors'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Should see: `{status: "ok", message: "Auth server is reachable", ...}`

### 3. Check Browser Console

Look for:
- CORS errors
- Network errors
- The auth client baseURL log

### 4. Check Auth Server Terminal

Look for incoming requests:
- Should see `📥 POST /api/auth/sign-up/email` when you try to sign up
- Check for any error messages

## Common Issues

### Issue: CORS Error

**Symptom:** Browser console shows CORS error

**Fix:** Make sure:
- Auth server CORS includes your Vite port (8080 or 5173)
- `credentials: "include"` is set in fetch options

### Issue: Network Error

**Symptom:** "Failed to fetch" or "Network error"

**Fix:**
1. Check if auth server is actually running
2. Check if port 3001 is accessible
3. Check firewall settings

### Issue: Wrong URL

**Symptom:** 404 errors

**Fix:** Check `.env.local` has:
```env
VITE_BETTER_AUTH_URL=https://inboxiq-qq72.onrender.com
```

Then restart Vite server.

## Still Not Working?

1. Check both terminals (auth server + Vite)
2. Check browser console for errors
3. Check Network tab in DevTools
4. Try the test endpoint above










