# Database Integration - Implementation Guide

## Status: ✅ API Services Created

I've created the API service layer for database integration. Here's what's been done and what needs to be completed:

## ✅ Completed

1. **API Service Layer** (`src/lib/api/`)
   - `leads.ts` - Complete CRUD operations for leads
   - `emails.ts` - Email threads and drafts management
   - `actions.ts` - Action queue management
   - `insights.ts` - AI insights fetching
   - `analytics.ts` - Performance metrics and analytics

2. **Helper Hooks**
   - `useUserId.ts` - Hook to get current user ID from Better Auth session

3. **Type Safety**
   - All functions use TypeScript types from `src/types/database.ts`
   - Proper error handling with typed responses

## ⚠️ Important: RLS Configuration Issue

**Problem**: Supabase RLS policies use `auth.uid()` which expects Supabase's built-in auth, but we're using Better Auth.

**Current Solution**: 
- Use database functions (like `get_lead_statistics`) that accept `user_id` as parameter
- These functions use `SECURITY DEFINER` and bypass RLS

**Recommended Next Steps**:
1. Update RLS policies to work with Better Auth, OR
2. Create more database functions that accept `user_id`, OR
3. Use a server-side API that handles authentication

## 📋 Next Steps to Complete Integration

### 1. Update Pages to Use API (Priority Order)

#### High Priority:
- [ ] **Leads Page** (`src/pages/Leads.tsx`)
  - Replace `mockLeads` with `leadsApi.getAll(userId)`
  - Add loading states
  - Add error handling
  - Implement create/update/delete

- [ ] **Dashboard/Index Page** (`src/pages/Index.tsx`)
  - Replace mock data with real API calls
  - Use `leadsApi.getStatistics(userId)`
  - Use `actionsApi.getAll(userId)`
  - Use `insightsApi.getRecent(userId)`

#### Medium Priority:
- [ ] **Inbox Page** (`src/pages/Inbox.tsx`)
  - Use `emailsApi.getThreads(userId)`
  - Implement thread selection and viewing

- [ ] **Drafts Page** (`src/pages/Drafts.tsx`)
  - Use `emailsApi.getDrafts(userId)`
  - Implement draft editing and sending

#### Lower Priority:
- [ ] **Analytics Page** (`src/pages/Analytics.tsx`)
  - Use `analyticsApi.getMetrics(userId, startDate, endDate)`
  - Use `analyticsApi.getEmailStats(userId)`
  - Use `analyticsApi.getLeadStats(userId)`

### 2. Add Loading States

Create a reusable loading component:

```typescript
// src/components/LoadingState.tsx
export function LoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <span className="ml-2 text-muted-foreground">Loading...</span>
    </div>
  );
}
```

### 3. Add Error Handling

Create error boundary components and error states:

```typescript
// src/components/ErrorState.tsx
export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="p-8 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Error</h3>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      {onRetry && <Button onClick={onRetry}>Try Again</Button>}
    </div>
  );
}
```

### 4. Implement React Query (Optional but Recommended)

For better caching and state management:

```typescript
// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";

export function useLeads() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["leads", userId],
    queryFn: () => leadsApi.getAll(userId!),
    enabled: !!userId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", userId] });
    },
  });
}
```

### 5. Fix RLS Policies

Choose one approach:

**Option A: Update RLS to use user_id column**
```sql
-- Example: Update leads policy
DROP POLICY "Users can view their own leads" ON public.leads;
CREATE POLICY "Users can view their own leads"
    ON public.leads FOR SELECT
    USING (user_id::text = current_setting('app.user_id', true));
```

**Option B: Create more database functions**
```sql
CREATE OR REPLACE FUNCTION public.get_user_leads(p_user_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.leads
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🧪 Testing Checklist

- [ ] Test with real Supabase database
- [ ] Verify RLS policies work correctly
- [ ] Test error handling (network errors, auth errors)
- [ ] Test loading states
- [ ] Test create/update/delete operations
- [ ] Test search and filtering
- [ ] Test with multiple users (data isolation)

## 📝 Example: Updated Leads Page

See `src/pages/Leads.tsx.example` for a complete example of how to integrate the API.

## 🚀 Quick Start

1. Make sure Supabase is configured in `.env.local`
2. Run the database migrations in Supabase
3. Start updating pages one by one, starting with Leads page
4. Test each page thoroughly before moving to the next

## Need Help?

- Check `src/lib/api/README.md` for API documentation
- Check `src/types/database.ts` for type definitions
- Review Supabase documentation for RLS policies













