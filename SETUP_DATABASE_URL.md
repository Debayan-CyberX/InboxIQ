# How to Get Your DATABASE_URL

## Step 1: Get Your Supabase Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Look for **Database password** section
5. If you forgot it, click **Reset database password**
6. **Copy the password** (you'll need it)

## Step 2: Get Your Connection String

1. Still in **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select the **URI** tab
4. You'll see something like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   OR the direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

5. **Replace `[YOUR-PASSWORD]`** with your actual password
6. Copy the complete string

## Step 3: Update .env.local

Open `.env.local` and replace:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres
SUPABASE_DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres
```

**Important:** Replace `YOUR_ACTUAL_PASSWORD` with your real database password!

## Step 4: Generate a Secret Key

For `BETTER_AUTH_SECRET`, generate a random 32+ character string:

**Option 1: Online Generator**
- Go to: https://generate-secret.vercel.app/32
- Copy the generated secret

**Option 2: PowerShell**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option 3: Use this (for development only):**
```
dev-secret-key-for-better-auth-min-32-chars-12345
```

## Step 5: Restart Servers

After updating `.env.local`:

1. **Stop both servers** (Ctrl+C in both terminals)
2. **Restart auth server:**
   ```bash
   npm run dev:auth
   ```
3. **Restart Vite server:**
   ```bash
   npm run dev
   ```

## Verify It's Working

The auth server should now show:
```
✅ Better Auth server running on https://api.inboxiq.debx.co.in
📡 Auth API available at https://api.inboxiq.debx.co.in/api/auth
```

**No more warnings about DATABASE_URL!** ✅

## Example .env.local

```env
# Supabase
VITE_SUPABASE_URL=https://iqfbjamdwnkbxattpqbw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Better Auth
VITE_BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
BETTER_AUTH_URL=https://api.inboxiq.debx.co.in
BETTER_AUTH_SECRET=dev-secret-key-for-better-auth-min-32-chars-12345

# Database (REPLACE YOUR_PASSWORD with actual password)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.iqfbjamdwnkbxattpqbw.supabase.co:5432/postgres
```

## 🔒 Security Note

- **Never commit `.env.local` to git** (it's already in .gitignore)
- Use a strong `BETTER_AUTH_SECRET` in production
- Keep your database password secure














