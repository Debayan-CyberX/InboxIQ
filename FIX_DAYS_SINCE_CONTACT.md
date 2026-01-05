# Fix: All Leads Showing "0 Days Ago"

## Problem
All leads are displaying "0d ago" in the Last Contact column, even when emails were received days or weeks ago.

## Root Cause
The `days_since_contact` calculation may not be running correctly, or the SQL function may not exist in your database.

## Solution

### Step 1: Ensure SQL Functions Exist
Run this SQL in your Supabase SQL Editor to create/verify the functions:

```sql
-- Function to calculate days since last contact
CREATE OR REPLACE FUNCTION public.calculate_lead_days_since_contact(
    p_lead_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    days_since_contact INTEGER,
    last_contact_at TIMESTAMPTZ
) AS $$
DECLARE
    v_thread_ids UUID[];
    v_last_outgoing_date TIMESTAMPTZ;
    v_first_incoming_date TIMESTAMPTZ;
    v_days INTEGER;
    v_last_contact TIMESTAMPTZ;
BEGIN
    -- Get all thread IDs for this lead
    SELECT ARRAY_AGG(id) INTO v_thread_ids
    FROM public.email_threads
    WHERE lead_id = p_lead_id AND user_id = p_user_id;

    -- If no threads, return 0
    IF v_thread_ids IS NULL OR array_length(v_thread_ids, 1) = 0 THEN
        RETURN QUERY SELECT 0::INTEGER, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Find the most recent OUTGOING email (user sent to lead)
    SELECT MAX(COALESCE(sent_at, received_at, created_at))
    INTO v_last_outgoing_date
    FROM public.emails
    WHERE thread_id = ANY(v_thread_ids)
      AND user_id = p_user_id
      AND (direction = 'outgoing' OR direction = 'outbound');

    IF v_last_outgoing_date IS NOT NULL THEN
        -- User has sent an email - use that timestamp
        v_last_contact := v_last_outgoing_date;
        v_days := EXTRACT(EPOCH FROM (NOW() - v_last_outgoing_date)) / 86400;
    ELSE
        -- No outgoing emails - use first incoming email timestamp
        SELECT MIN(COALESCE(received_at, sent_at, created_at))
        INTO v_first_incoming_date
        FROM public.emails
        WHERE thread_id = ANY(v_thread_ids)
          AND user_id = p_user_id
          AND (direction = 'incoming' OR direction = 'inbound');

        IF v_first_incoming_date IS NOT NULL THEN
            v_last_contact := v_first_incoming_date;
            v_days := EXTRACT(EPOCH FROM (NOW() - v_first_incoming_date)) / 86400;
        ELSE
            -- No emails at all
            RETURN QUERY SELECT 0::INTEGER, NULL::TIMESTAMPTZ;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT v_days::INTEGER, v_last_contact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead contact info
CREATE OR REPLACE FUNCTION public.update_lead_contact_info(
    p_lead_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_days INTEGER;
    v_last_contact TIMESTAMPTZ;
BEGIN
    -- Calculate days since contact
    SELECT days_since_contact, last_contact_at
    INTO v_days, v_last_contact
    FROM public.calculate_lead_days_since_contact(p_lead_id, p_user_id);

    -- Update the lead
    UPDATE public.leads
    SET days_since_contact = v_days,
        last_contact_at = v_last_contact,
        updated_at = NOW()
    WHERE id = p_lead_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_lead_days_since_contact TO public;
GRANT EXECUTE ON FUNCTION public.update_lead_contact_info TO public;
```

### Step 2: Restart Your Server
After running the SQL, restart your backend server to ensure the updated endpoint code is loaded.

### Step 3: Trigger Update
The frontend automatically calls the update endpoint when the Leads page loads. You can also manually trigger it by:
1. Refreshing the Leads page
2. Or clicking "Detect Leads" button (which also triggers an update)

### Step 4: Check Server Logs
After refreshing, check your server console logs. You should see:
```
📅 Updating contact info for all leads for user: [uuid]
📅 Found X leads to update
  ✓ Lead [id]: Y days since contact (last: [timestamp])
✅ Updated contact info for X/X leads
```

### Step 5: Verify Email Timestamps
If leads still show "0d ago", check if your emails have correct `received_at` timestamps:
```sql
SELECT 
    e.id,
    e.direction,
    e.received_at,
    e.sent_at,
    e.created_at,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(e.received_at, e.sent_at, e.created_at))) / 86400 as days_ago
FROM public.emails e
JOIN public.email_threads et ON e.thread_id = et.id
WHERE et.lead_id = '[your-lead-id]'
ORDER BY COALESCE(e.received_at, e.sent_at, e.created_at) ASC
LIMIT 10;
```

If `received_at` is NULL or all timestamps are today, that's why days = 0.

## How It Works

1. **Calculation Logic:**
   - If user has sent an email to the lead → Use last outgoing email date
   - If user has NOT sent an email → Use first incoming email date
   - Days = (Now - Last Contact Date) / 86400 seconds

2. **Update Trigger:**
   - Automatically runs when Leads page loads
   - Also runs after Gmail sync completes
   - Can be manually triggered via `/api/leads/update-contact-info` endpoint

3. **Display:**
   - Frontend shows: `{days_since_contact || 0}d ago`
   - If value is 0, it means emails were received today or calculation returned 0

## Troubleshooting

**If all leads still show "0d ago":**
1. Check server logs for errors
2. Verify SQL functions exist: `SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%contact%';`
3. Check email timestamps are correct (not all set to today)
4. Verify emails have correct `direction` values ('inbound' or 'outbound')

**If some leads show correct values but others don't:**
- Those leads may not have any emails linked yet
- Or their emails don't have proper timestamps

