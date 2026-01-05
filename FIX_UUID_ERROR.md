# Fix: UUID Error - Better Auth ID to UUID Mapping

## Problem
Better Auth uses TEXT IDs (e.g., "vxZrpGclyUyj1xPKTCRZNacx3oRPROaY"), but Supabase database functions expect UUID format. This causes the error:
```
invalid input syntax for type uuid: "vxZrpGclyUyj1xPKTCRZNacx3oRPROaY"
```

## Solution

### Step 1: Run the Database Migration
Execute `supabase/fix-user-id-mapping.sql` in your Supabase SQL Editor. This will:
1. Create `get_user_uuid_from_better_auth_id()` function to map Better Auth IDs to UUIDs
2. Update all database functions to accept Better Auth TEXT IDs instead of UUIDs
3. Functions will internally convert Better Auth ID → UUID using email lookup

### Step 2: How It Works
1. Better Auth user ID (TEXT) is passed to database functions
2. Function looks up email in `public."user"` table (Better Auth table)
3. Function finds matching UUID in `public.users` table by email
4. Function uses UUID to query the actual data tables

### Step 3: Updated API Functions
All API functions now accept Better Auth TEXT IDs directly:
- `leadsApi.getAll(betterAuthUserId, ...)`
- `leadsApi.getStatistics(betterAuthUserId)`
- `emailsApi.getThreads(betterAuthUserId, ...)`
- `emailsApi.getDrafts(betterAuthUserId)`
- `actionsApi.getAll(betterAuthUserId, ...)`
- `insightsApi.getRecent(betterAuthUserId, ...)`

### Step 4: Test
1. Run the migration script
2. Refresh the Leads page
3. The error should be resolved

## Important Notes

- The mapping relies on email matching between `public."user"` (Better Auth) and `public.users` (your app)
- Make sure the sync trigger is working to keep emails in sync
- If a user doesn't exist in `public.users`, functions will return empty/null

## Troubleshooting

If you still get errors:
1. Check if user exists in `public.users` table
2. Verify email matches between `public."user"` and `public.users`
3. Check if sync trigger is working
4. Manually insert user into `public.users` if needed








