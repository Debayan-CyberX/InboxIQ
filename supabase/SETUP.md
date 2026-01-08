# Quick Setup Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: InboxAI Assistant
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

### Step 2: Run the Schema

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `schema.sql` from this directory
4. Copy **ALL** the contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

✅ You should see "Success. No rows returned"

### Step 3: Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 4: Add to Your Frontend

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Install Supabase client:

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 5: Test It Works

In your app, try:

```typescript
import { supabase } from '@/lib/supabase'

// Test connection
const { data, error } = await supabase.from('leads').select('count')
console.log('Connection:', error ? 'Failed' : 'Success!')
```

## 🎯 Next Steps

- [ ] Set up authentication (Supabase Auth)
- [ ] Create your first user
- [ ] Run seed data (optional) - see `seed.sql`
- [ ] Start building your features!

## 📚 Need Help?

- Check `README.md` for detailed documentation
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)













