# 🚀 Quick Start - Better Auth Setup

## Step 1: Run Database Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy contents of `supabase/better-auth-migration.sql`
3. Paste and **Run**
4. ✅ Better Auth tables created!

## Step 2: Get Database Connection String

1. Supabase Dashboard → **Settings** → **Database**
2. Copy **Connection string** (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual password

## Step 3: Create `.env.local`

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Better Auth
VITE_BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
BETTER_AUTH_SECRET=your-32-character-secret-key-here

# Database
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

## Step 4: Start Servers

**Terminal 1:**
```bash
npm run dev:auth
```

**Terminal 2:**
```bash
npm run dev
```

## Step 5: Test!

1. Go to `http://localhost:8080`
2. Sign up for an account
3. Check Supabase → Table Editor → `user` table
4. ✅ Your user should be there!

## 🎉 Done!

Your auth is now fully set up. Users will be stored in Supabase and visible in the dashboard.












