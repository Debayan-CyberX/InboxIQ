# ⚠️ IMPORTANT: Run Database Migration First!

## The Error You're Seeing

```
[BetterAuthError: Failed to initialize database adapter]
```

This means **Better Auth tables don't exist yet** in your database!

## Quick Fix: Run the Migration

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run the Migration

1. Open the file: `supabase/better-auth-migration.sql`
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### Step 3: Verify Tables Created

After running, you should see:
- ✅ `user` table
- ✅ `session` table
- ✅ `account` table
- ✅ `verification` table

Check in **Table Editor** → you should see these new tables!

### Step 4: Restart Auth Server

```bash
npm run dev:auth
```

## Why This Is Required

Better Auth needs these tables to store:
- User accounts
- Sessions
- OAuth accounts
- Email verification tokens

**Without the migration, Better Auth can't work!**

## Still Getting Errors?

1. **Check connection string** - Make sure `DATABASE_URL` in `.env.local` is correct
2. **Check password** - Make sure you replaced `YOUR_PASSWORD` with actual password
3. **Check Supabase project** - Make sure your project is active
4. **Check migration** - Make sure all tables were created successfully

## Need Help?

If migration fails, check:
- SQL Editor for error messages
- Supabase logs in dashboard
- Make sure you have permission to create tables












