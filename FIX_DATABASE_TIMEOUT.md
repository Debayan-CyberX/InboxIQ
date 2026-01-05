# Fix: Database Connection Timeout (ETIMEDOUT)

## The Problem

The error shows:
```
Error: connect ETIMEDOUT 2406:da1a:6b0:f610:eec7:83d6:3277:7873:5432
```

This means:
- Better Auth is trying to connect to your Supabase database
- It's resolving to an IPv6 address
- The connection is timing out

## Solutions

### Solution 1: Use Direct Connection String (Recommended)

Instead of using the pooler connection, use the **direct connection** string from Supabase:

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. **IMPORTANT:** Use the **direct connection** (not pooler)
   - Direct: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Pooler: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxxxx.pooler.supabase.com:6543/postgres`

5. Update `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres
   ```

### Solution 2: Force IPv4

If you must use IPv6, you might need to:
- Check your network/firewall settings
- Ensure IPv6 is properly configured
- Try using the IPv4 address directly

### Solution 3: Check Connection String Format

Make sure your connection string:
- Uses `postgresql://` (not `postgres://`)
- Has the correct password (URL-encoded if it contains special characters)
- Uses the correct hostname: `db.iqfbjamdwnkbxattpqbw.supabase.co`
- Uses port `5432` (direct) or `6543` (pooler)

### Solution 4: Test Connection

Test if you can connect to the database:

```bash
# Using psql (if installed)
psql "postgresql://postgres:YOUR_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres"
```

## Quick Fix

1. **Get the direct connection string** from Supabase Dashboard
2. **Update `.env.local`** with the direct connection string
3. **Restart auth server**: `npm run dev:auth`
4. **Try signing up again**

## Why This Happens

- Supabase pooler connections sometimes resolve to IPv6
- Your network might not support IPv6 properly
- Direct connections are more reliable for Better Auth









