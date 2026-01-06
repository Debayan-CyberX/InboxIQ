# Fix: IPv6 Connection Timeout (ETIMEDOUT)

## The Error

```
Error: connect ETIMEDOUT 2406:da1a:6b0:f610:eec7:83d6:3277:7873:5432
```

This means Better Auth is trying to connect via IPv6 and timing out.

## Solutions

### Solution 1: Use Supabase Connection Pooler (Recommended)

The pooler connection is more reliable and handles IPv6/IPv4 better:

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **Connection pooling** tab (not URI)
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxxxx:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. Update `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-xxxxx.pooler.supabase.com:6543/postgres
   ```

**Note:** Port is `6543` for pooler (not `5432`)

### Solution 2: Force IPv4 in Connection String

Add `?options=-c%20ipv4_only=true` to force IPv4:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres?options=-c%20ipv4_only=true
```

### Solution 3: Check Network Settings

- Ensure your network supports IPv6
- Check firewall isn't blocking IPv6
- Try from a different network

### Solution 4: Use Direct IP Address

If you can find the IPv4 address of your Supabase database, use that directly.

## Quick Fix Steps

1. **Get pooler connection string** from Supabase Dashboard
2. **Update `.env.local`** with pooler connection (port 6543)
3. **Restart auth server**: `npm run dev:auth`
4. **Try signing up again**

## Why Pooler is Better

- Handles IPv6/IPv4 automatically
- More reliable connections
- Better for serverless/server applications
- Recommended by Supabase for applications










