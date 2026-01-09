# Quick Check: Is Auth Server Running?

## Step 1: Check if Auth Server is Running

Open a **NEW terminal** and run:

```bash
npm run dev:auth
```

You should see:
```
✅ Better Auth server running on https://api.inboxiq.debx.co.in
📡 Auth API available at https://api.inboxiq.debx.co.in/api/auth
```

## Step 2: Test the Server

Open your browser and go to:
```
https://api.inboxiq.debx.co.in/health
```

You should see:
```json
{"status":"ok","service":"better-auth"}
```

If you see this, the server is working! ✅

## Step 3: Check Environment Variables

Make sure `.env.local` exists and has:

```env
VITE_BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
```

## Step 4: Restart Vite Server

After setting environment variables:

1. Stop Vite server (Ctrl+C)
2. Restart: `npm run dev`

## Common Issues

### "Cannot GET /health"
- Auth server isn't running
- **Fix:** Run `npm run dev:auth` in a separate terminal

### "Failed to fetch"
- Auth server not running OR wrong URL
- **Fix:** 
  1. Start auth server: `npm run dev:auth`
  2. Check `.env.local` has `VITE_BETTER_AUTH_URL=https://api.inboxiq.debx.co.in`
  3. Restart Vite server

### Port 3001 already in use
- Another process is using port 3001
- **Fix:** Change port in `.env.local`:
  ```env
  AUTH_PORT=3002
  VITE_BETTER_AUTH_URL=http://localhost:3002
  ```

## You Need TWO Terminals Running:

**Terminal 1:**
```bash
npm run dev:auth
```

**Terminal 2:**
```bash
npm run dev
```

Both must be running for auth to work!














