# Environment Variables Setup

## Quick Setup

I've created a `.env.local` file template. You need to:

### 1. Get Your Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `iqfbjamdwnkbxattpqbw`
3. Go to **Settings** → **Database**
4. Find your **Database password**
   - If you don't remember it, click **Reset database password**
5. **Copy the password**

### 2. Update .env.local

Open `.env.local` in your editor and replace:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres
SUPABASE_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres
```

**Replace `YOUR_PASSWORD` with your actual database password!**

### 3. Restart Auth Server

After updating `.env.local`:

1. Stop the auth server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev:auth
   ```

You should now see:
```
✅ Better Auth server running on https://api.inboxiq.debx.co.in
```

**No more DATABASE_URL warnings!** ✅

## Alternative: Get Full Connection String

1. Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string**
3. Click **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Paste into `.env.local` as `DATABASE_URL`

## What Each Variable Does

- `VITE_SUPABASE_URL` - Your Supabase project URL (already set ✅)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (already set ✅)
- `VITE_BETTER_AUTH_URL` - Auth server URL (already set ✅)
- `BETTER_AUTH_SECRET` - Secret key for auth (already set ✅)
- `DATABASE_URL` - **YOU NEED TO SET THIS** ⚠️
- `SUPABASE_DATABASE_URL` - Same as DATABASE_URL (optional)

## Test It

After setting DATABASE_URL:

1. Restart auth server
2. Check terminal - no more warnings!
3. Try signing up - should work now!













