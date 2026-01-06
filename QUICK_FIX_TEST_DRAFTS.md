# Quick Fix: Test Drafts Function Not Found

## The Error

```
Could not find the function public.create_test_drafts_for_user(p_better_auth_id) in the schema cache
```

## The Solution

The function needs to be created in your database. You have two options:

---

## Option 1: Run the Comprehensive Functions Script (Recommended)

This will create ALL functions including the test drafts function:

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Click New Query**
3. **Copy the entire contents** of `supabase/fix-all-better-auth-functions.sql`
4. **Paste and click Run**

This creates:
- ✅ All get functions
- ✅ Settings functions  
- ✅ **Test drafts function** ← This is what you need!

---

## Option 2: Run Just the Test Drafts Function

If you only want to add the test drafts function:

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Click New Query**
3. **Copy the entire contents** of `supabase/create-test-drafts.sql`
4. **Paste and click Run**

---

## After Running

1. **Go back to your Drafts page**
2. **Click "Create Test Drafts" button** again
3. It should work now! ✅

---

## Verify It Worked

Run this query in Supabase SQL Editor to verify:

```sql
SELECT p.proname, pg_get_function_arguments(p.oid) 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.proname = 'create_test_drafts_for_user';
```

You should see the function listed!

---

## Quick Steps Summary

1. ✅ Open Supabase SQL Editor
2. ✅ Run `supabase/fix-all-better-auth-functions.sql` (or just `create-test-drafts.sql`)
3. ✅ Go back to Drafts page
4. ✅ Click "Create Test Drafts"
5. ✅ Done! 🎉







