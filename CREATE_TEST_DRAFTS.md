# Create Test Email Drafts

## Quick Solution: Generate Test Drafts

You need test email drafts to test the email sending functionality. Here are two ways to create them:

---

## Option 1: Using the UI (Recommended) 🎯

1. **Go to the Drafts page** (`/drafts`)
2. **Click the "Create Test Drafts" button** (appears when you have no drafts)
3. This will create 5 sample AI-generated email drafts
4. **Refresh the page** to see them

That's it! You can now test sending emails.

---

## Option 2: Using SQL Script

If you prefer to use SQL directly:

### Step 1: Get Your Better Auth User ID

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run this query:
   ```sql
   SELECT id, email FROM public."user" LIMIT 1;
   ```
3. **Copy the `id`** (this is your Better Auth user ID)

### Step 2: Run the Test Drafts Function

1. **First, create the function** (if not already created):
   - Open `supabase/create-test-drafts.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run**

2. **Then, create the drafts**:
   - Replace `'YOUR_BETTER_AUTH_USER_ID'` with the ID from Step 1
   - Run this query:
   ```sql
   SELECT * FROM create_test_drafts_for_user('YOUR_BETTER_AUTH_USER_ID');
   ```

### Step 3: Verify

1. Go to your **Drafts page** in the app
2. You should see 5 test drafts:
   - Follow-up email
   - Introduction email
   - Meeting request
   - Product demo request
   - Short follow-up

---

## What Gets Created

The test drafts include:
- ✅ 5 different email drafts with various tones
- ✅ Professional, confident, polite, sales-focused, and short tones
- ✅ AI reasons for each draft
- ✅ Linked to a test lead (Acme Corporation)
- ✅ Ready to send!

---

## Troubleshooting

### "Function create_test_drafts_for_user does not exist"

**Fix:** Run the SQL script first:
1. Open `supabase/create-test-drafts.sql`
2. Copy and paste into Supabase SQL Editor
3. Click Run

### "User not found"

**Fix:** Make sure you're using the correct Better Auth user ID:
1. Check the `public."user"` table
2. Use the `id` column (TEXT format, not UUID)

### "No drafts showing"

**Fix:**
1. Refresh the Drafts page
2. Check browser console for errors
3. Verify the function ran successfully
4. Check that `is_ai_draft = true` and `status = 'draft'` in the emails table

---

## Next Steps

After creating test drafts:
1. ✅ Go to Drafts page
2. ✅ Click on any draft to preview
3. ✅ Click "Send Email" to test sending
4. ✅ Make sure you've configured Resend API key (see `EMAIL_SENDING_SETUP.md`)

---

## Customizing Test Drafts

You can modify the test drafts by editing `supabase/create-test-drafts.sql`:
- Change email subjects
- Modify email content
- Add more drafts
- Change tones and AI reasons

Then re-run the function to create new drafts!









