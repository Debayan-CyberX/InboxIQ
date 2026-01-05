# Better Auth Setup Guide - Complete Installation

This guide will help you set up Better Auth with Supabase for your InboxAI Assistant application.

## ✅ What's Already Done

- ✅ Better Auth installed
- ✅ Sign-in and Sign-up pages created
- ✅ Protected routes configured
- ✅ Auth client setup
- ✅ Server files created

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Open `supabase/better-auth-migration.sql`
5. Copy **ALL** the contents
6. Paste into SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)

✅ This creates the Better Auth tables (`user`, `session`, `account`, `verification`)

### Step 2: Get Your Database Connection String

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in:
   ```env
   # Supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Better Auth
   VITE_BETTER_AUTH_URL=http://localhost:3001
   BETTER_AUTH_URL=http://localhost:3001
   BETTER_AUTH_SECRET=generate-a-random-32-character-secret-key
   
   # Database (replace with your actual connection string)
   DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
   ```

3. Generate a secret key:
   ```bash
   # On Linux/Mac
   openssl rand -base64 32
   
   # Or use an online generator
   # https://generate-secret.vercel.app/32
   ```

### Step 4: Install Server Dependencies

The server needs TypeScript support. Install ts-node:

```bash
npm install --save-dev ts-node @types/node concurrently
```

### Step 5: Start the Servers

You need to run **two servers**:

1. **Auth Server** (port 3001) - handles authentication
2. **Vite Dev Server** (port 8080) - your React app

**Option A: Run separately (recommended for debugging)**

Terminal 1 - Auth Server:
```bash
npm run dev:auth
```

Terminal 2 - Vite Server:
```bash
npm run dev
```

**Option B: Run together**

```bash
npm run dev:all
```

### Step 6: Test the Setup

1. Open `http://localhost:8080`
2. You should be redirected to `/sign-in`
3. Click "Sign up" to create an account
4. Fill in the form and submit
5. You should be redirected to the dashboard
6. Check Supabase Dashboard → **Table Editor** → `user` table
7. You should see your new user! 🎉

## 📋 Verify Users in Supabase

1. Go to **Supabase Dashboard**
2. Click **Table Editor** (left sidebar)
3. Select **`user`** table (Better Auth users)
4. You should see all registered users
5. Also check **`users`** table (your app's user profiles) - they sync automatically!

## 🔧 Troubleshooting

### Auth server won't start

- Check if port 3001 is available
- Verify `DATABASE_URL` is correct in `.env.local`
- Make sure you ran the database migration

### "Cannot connect to database"

- Verify your `DATABASE_URL` includes the correct password
- Check if your Supabase project is active
- Ensure the connection string format is correct

### Users not appearing in Supabase

- Check browser console for errors
- Verify the database migration ran successfully
- Check Supabase logs in the dashboard

### Sign up fails

- Check the auth server terminal for errors
- Verify `BETTER_AUTH_SECRET` is set (minimum 32 characters)
- Check database connection

## 🎯 Next Steps

1. ✅ Users can sign up and sign in
2. ✅ Users are stored in Supabase
3. ✅ Dashboard is protected
4. 🔄 Add email verification (optional)
5. 🔄 Add social logins (Google, GitHub, etc.)
6. 🔄 Add password reset functionality

## 📚 Documentation

- [Better Auth Docs](https://www.better-auth.com/docs/introduction)
- [React Integration](https://www.better-auth.com/docs/frameworks/react)
- [Database Setup](https://www.better-auth.com/docs/adapters/database)

## 🆘 Need Help?

If you encounter issues:
1. Check the terminal output for errors
2. Check browser console (F12)
3. Verify all environment variables are set
4. Ensure database migration completed successfully









