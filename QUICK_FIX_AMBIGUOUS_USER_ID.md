# Quick Fix: Ambiguous user_id Error

## The Error

```
Failed to save settings: column reference "user_id" is ambiguous
```

## The Solution

Run this SQL script in Supabase SQL Editor:

**File:** `supabase/fix-ambiguous-user-id.sql`

This fixes the `upsert_user_settings` function to avoid the ambiguous `user_id` error.

---

## Quick Steps

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Click New Query**
3. **Copy the entire contents** of `supabase/fix-ambiguous-user-id.sql`
4. **Paste and click Run**

That's it! The error should be fixed.

---

## What Was Fixed

The `upsert_user_settings` function was using `SELECT * FROM public.get_user_settings(...)` which could cause ambiguity. Now it explicitly selects from the `user_settings` table with the alias `us` to avoid any ambiguity.

---

## Verify It Worked

After running the script, try saving settings again. The error should be gone!

If you still see the error:
1. Make sure you ran the script successfully
2. Refresh the Settings page
3. Try saving again

---

## Alternative: Run Comprehensive Fix

If you want to fix everything at once, run:
- `supabase/fix-all-better-auth-functions.sql`

This includes the fix for the ambiguous user_id error.






