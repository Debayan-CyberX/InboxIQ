# Fix: Password Authentication Failed

## The Error

```
error: password authentication failed for user "postgres"
code: '28P01'
```

## The Problem

The password in your `DATABASE_URL` connection string is **incorrect**.

## Solution

### Step 1: Get Your Correct Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Database password** section
5. **If you don't remember it:**
   - Click **Reset database password**
   - Copy the new password (you'll only see it once!)

### Step 2: Update .env.local

1. Open `.env.local` in your editor
2. Find the `DATABASE_URL` line
3. **Replace the password** in the connection string

**Current format:**
```env
DATABASE_URL=postgresql://postgres.iqfbjamdwnkbxattpqbw:WRONG_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**Update to:**
```env
DATABASE_URL=postgresql://postgres.iqfbjamdwnkbxattpqbw:CORRECT_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**Important:**
- If your password contains special characters, they need to be **URL-encoded**:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - `%` becomes `%25`
  - etc.

### Step 3: Restart Auth Server

After updating the password:

```bash
npm run dev:auth
```

### Step 4: Test

Try signing up again - it should work now!

## Password URL Encoding

If your password is `Metrorail@1@2@3`, it should be:
```
Metrorail%401%402%403
```

But if Supabase gave you a different password, use that one!

## Still Not Working?

1. **Double-check the password** - Make sure you copied it correctly
2. **Check URL encoding** - Special characters must be encoded
3. **Try resetting password** - Get a fresh password from Supabase
4. **Verify connection string format** - Should match Supabase's exact format














