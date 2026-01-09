# InboxAI Assistant - Supabase Database Schema

This directory contains the complete database schema for the InboxAI Assistant application, designed to work with Supabase (PostgreSQL).

## 📋 Overview

The database schema supports an AI-powered email assistant and lead management system with the following core features:

- **Lead Management**:** Track companies, contacts, and their status (hot/warm/cold)
- **Email Management**:** Store emails, threads, drafts, and attachments
- **Action Queue**:** Manage tasks like replies, follow-ups, and meetings
- **AI Insights**:** Store AI-generated insights and recommendations
- **Performance Metrics**:** Track reply rates, response times, and productivity metrics
- **Email Templates**:** Reusable email templates with different tones

## 🗄️ Database Schema

### Core Tables

1. **users** - Extended user profiles (extends Supabase auth.users)
2. **leads** - Companies and contacts being tracked
3. **email_threads** - Groups related emails together
4. **emails** - Individual email messages (inbound/outbound)
5. **actions** - Tasks and actions to be performed
6. **ai_insights** - AI-generated insights and recommendations
7. **performance_metrics** - User performance tracking
8. **email_templates** - Reusable email templates
9. **email_attachments** - Email file attachments

## 🚀 Setup Instructions

### Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Access to your Supabase project's SQL Editor

### Step 1: Run the Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `schema.sql`
5. Click **Run** to execute the schema

### Step 2: Verify Installation

After running the schema, verify that all tables were created:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see:
- users
- leads
- email_threads
- emails
- actions
- ai_insights
- performance_metrics
- email_templates
- email_attachments

### Step 3: Set Up Storage (Optional)

If you want to store email attachments, create a storage bucket:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `email-attachments`
3. Set it to **Private** (or **Public** if you prefer)
4. Add a policy to allow users to upload their own files:

```sql
-- Allow users to upload their own attachments
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'email-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own attachments
CREATE POLICY "Users can read their own attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'email-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔒 Security

The schema includes **Row Level Security (RLS)** policies that ensure:

- Users can only access their own data
- All tables are protected by default
- Email templates can be shared (if marked as public)
- Attachments are scoped to user's emails

## 📊 Key Features

### Automatic Calculations

- **days_since_contact**: Automatically calculated from `last_contact_at`
- **updated_at**: Automatically updated on record changes

### Full-Text Search

The schema includes trigram indexes for full-text search on:
- Lead company names
- Email subjects

### Helper Functions

Two helper functions are included:

1. **get_lead_statistics(user_id)**: Returns lead counts by status
2. **get_recent_insights(user_id, limit)**: Returns recent AI insights

## 🔌 Integration with Frontend

### Supabase Client Setup

In your frontend application, set up the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Example Queries

#### Fetch User's Leads

```typescript
const { data: leads, error } = await supabase
  .from('leads')
  .select('*')
  .order('last_contact_at', { ascending: false })
```

#### Fetch Pending Actions

```typescript
const { data: actions, error } = await supabase
  .from('actions')
  .select('*, leads(*)')
  .eq('status', 'pending')
  .order('priority', { ascending: false)
```

#### Create a New Lead

```typescript
const { data, error } = await supabase
  .from('leads')
  .insert({
    company: 'Acme Corp',
    contact_name: 'John Doe',
    email: 'john@acme.com',
    status: 'warm'
  })
```

#### Get Lead Statistics

```typescript
const { data, error } = await supabase
  .rpc('get_lead_statistics', { p_user_id: userId })
```

## 📝 TypeScript Types

TypeScript types matching this schema are available in `../src/types/database.ts`. Import them in your components:

```typescript
import type { Lead, Action, Email, AIInsight } from '@/types/database'
```

## 🧪 Testing

After setting up the schema, you can test it with sample data:

```sql
-- Insert a test user (after creating auth user)
INSERT INTO public.users (id, email, full_name)
VALUES ('YOUR_USER_UUID', 'test@example.com', 'Test User');

-- Insert a test lead
INSERT INTO public.leads (user_id, company, contact_name, email, status)
VALUES ('YOUR_USER_UUID', 'Test Company', 'Test Contact', 'test@company.com', 'hot');
```

## 🔄 Migrations

When you need to modify the schema:

1. Create a new migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Add your ALTER TABLE statements
3. Run the migration in Supabase SQL Editor
4. Update TypeScript types if needed

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🐛 Troubleshooting

### RLS Policies Not Working

If you're getting permission errors:
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Check your user is authenticated: `SELECT auth.uid();`
3. Verify policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

### Triggers Not Firing

If `updated_at` isn't updating:
1. Check triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE '%updated_at%';`
2. Verify functions exist: `SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';`

## 📄 License

This schema is part of the InboxAI Assistant project.














