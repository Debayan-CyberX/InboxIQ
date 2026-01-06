# Debug: Failed to Sign Up/Sign In

## What to Check

### 1. Check Browser Console

Open browser console (F12) and look for:
- `📥 Sign up result:` - This shows what Better Auth returned
- Any error messages
- Network tab to see the actual HTTP response

### 2. Check Auth Server Terminal

When you try to sign up, you should see:
```
📥 POST /api/auth/sign-up/email
   Origin: http://localhost:8081
   Response: 200 OK
```

If you see errors, they'll be logged here.

### 3. Common Issues

#### Issue: Database Connection Error

**Symptom:** Server shows database errors

**Fix:** 
- Check `DATABASE_URL` in `.env.local`
- Verify database migration was run
- Check Supabase project is active

#### Issue: Missing Required Fields

**Symptom:** Error about missing fields

**Fix:** Make sure sign-up form includes:
- Email (required)
- Password (required, min 8 chars)
- Name (optional but recommended)

#### Issue: Email Already Exists

**Symptom:** "Email already in use" error

**Fix:** Try a different email or check Supabase `user` table

### 4. Test Database Connection

Check if Better Auth can connect to database:
- Look for "✅ Database pool created" in auth server startup
- Check for any database errors in server logs

### 5. Check Better Auth Tables

In Supabase Table Editor, verify these tables exist:
- `user` - stores user accounts
- `session` - stores sessions
- `account` - stores account info
- `verification` - stores verification tokens

## Still Not Working?

1. **Check the exact error message** in browser console
2. **Check auth server terminal** for detailed logs
3. **Try a simple test** - use a unique email
4. **Check network tab** - see the actual HTTP request/response

Share the error messages you see!










