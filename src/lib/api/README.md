# Database Integration Guide

## Overview

This directory contains API service functions for interacting with Supabase. Each service provides CRUD operations for its respective entity.

## Important: RLS (Row Level Security) Configuration

**Current Issue**: The Supabase RLS policies use `auth.uid()` which expects Supabase's built-in authentication. However, we're using Better Auth for authentication.

### Solutions:

1. **Use Database Functions** (Recommended)
   - The schema includes helper functions like `get_lead_statistics` that accept `user_id` as a parameter
   - These functions use `SECURITY DEFINER` which bypasses RLS
   - Use these functions where available

2. **Modify RLS Policies** (Alternative)
   - Update RLS policies to work with Better Auth
   - This requires syncing Better Auth user IDs with Supabase auth
   - More complex but provides better security

3. **Temporary: Service Role** (Development Only)
   - Use service role key for development
   - **NEVER use in production or client-side code**
   - Only for testing

## API Services

### Leads API (`leads.ts`)
- `getAll(userId)` - Get all leads
- `getById(leadId, userId)` - Get single lead
- `create(lead)` - Create new lead
- `update(leadId, userId, updates)` - Update lead
- `delete(leadId, userId)` - Delete lead
- `getByStatus(userId, status)` - Filter by status
- `search(userId, query)` - Search leads
- `getStatistics(userId)` - Get lead statistics

### Emails API (`emails.ts`)
- `getThreads(userId, status?)` - Get email threads
- `getThreadEmails(threadId, userId)` - Get emails in thread
- `getDrafts(userId)` - Get AI drafts
- `create(email)` - Create email
- `update(emailId, userId, updates)` - Update email
- `delete(emailId, userId)` - Delete email
- `archiveThread(threadId, userId)` - Archive thread
- `search(userId, query)` - Search emails

### Actions API (`actions.ts`)
- `getAll(userId, status?)` - Get all actions
- `getById(actionId, userId)` - Get single action
- `create(action)` - Create action
- `update(actionId, userId, updates)` - Update action
- `complete(actionId, userId)` - Mark as completed
- `cancel(actionId, userId)` - Cancel action
- `delete(actionId, userId)` - Delete action

### Insights API (`insights.ts`)
- `getRecent(userId, limit)` - Get recent insights
- `getAll(userId, type?)` - Get all insights
- `create(insight)` - Create insight
- `markAsRead(insightId, userId)` - Mark as read
- `delete(insightId, userId)` - Delete insight

### Analytics API (`analytics.ts`)
- `getMetrics(userId, startDate, endDate)` - Get metrics
- `getLatestMetrics(userId)` - Get latest metrics
- `create(metric)` - Create metric
- `getEmailStats(userId, days)` - Get email statistics
- `getLeadStats(userId)` - Get lead statistics

## Usage Example

```typescript
import { leadsApi } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";
import { useEffect, useState } from "react";

function LeadsPage() {
  const userId = useUserId();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchLeads() {
      try {
        setLoading(true);
        const data = await leadsApi.getAll(userId);
        setLeads(data);
      } catch (err) {
        setError(err.message);
        toast.error("Failed to load leads");
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [userId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return <LeadsList leads={leads} />;
}
```

## Error Handling

All API functions throw errors that should be caught:

```typescript
try {
  const lead = await leadsApi.create(newLead);
  toast.success("Lead created!");
} catch (error) {
  console.error(error);
  toast.error(error.message || "Failed to create lead");
}
```

## Next Steps

1. Update each page to use the API services
2. Add loading states
3. Add error boundaries
4. Implement optimistic updates
5. Add caching with React Query (optional)









