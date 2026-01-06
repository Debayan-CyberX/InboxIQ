# Complete Database Schema - All Tables and Columns

## Better Auth Tables (Required for Authentication)

### 1. `public.user` Table
**Purpose:** Stores Better Auth user accounts

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key (Better Auth generates this) |
| `name` | TEXT | YES | NULL | User's full name |
| `email` | TEXT | NO | - | User's email (UNIQUE) |
| `emailVerified` | BOOLEAN | YES | FALSE | Whether email is verified |
| `image` | TEXT | YES | NULL | User's profile image URL |
| `createdAt` | TIMESTAMPTZ | YES | NOW() | Account creation timestamp |
| `updatedAt` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 2. `public.session` Table
**Purpose:** Stores user sessions/tokens

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key |
| `expiresAt` | TIMESTAMPTZ | NO | - | Session expiration time |
| `token` | TEXT | NO | - | Session token (UNIQUE) |
| `createdAt` | TIMESTAMPTZ | YES | NOW() | Session creation time |
| `updatedAt` | TIMESTAMPTZ | YES | NOW() | Last update time |
| `ipAddress` | TEXT | YES | NULL | User's IP address |
| `userAgent` | TEXT | YES | NULL | User's browser/device info |
| `userId` | TEXT | NO | - | Foreign key to `user.id` |

### 3. `public.account` Table
**Purpose:** Stores OAuth accounts and passwords

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key |
| `accountId` | TEXT | NO | - | Provider's account ID |
| `providerId` | TEXT | NO | - | OAuth provider (e.g., 'google', 'github') |
| `userId` | TEXT | NO | - | Foreign key to `user.id` |
| `accessToken` | TEXT | YES | NULL | OAuth access token |
| `refreshToken` | TEXT | YES | NULL | OAuth refresh token |
| `idToken` | TEXT | YES | NULL | OAuth ID token |
| `accessTokenExpiresAt` | TIMESTAMPTZ | YES | NULL | Access token expiration |
| `refreshTokenExpiresAt` | TIMESTAMPTZ | YES | NULL | Refresh token expiration |
| `scope` | TEXT | YES | NULL | OAuth scopes |
| `password` | TEXT | YES | NULL | Hashed password (for email/password auth) |
| `createdAt` | TIMESTAMPTZ | YES | NOW() | Account creation time |
| `updatedAt` | TIMESTAMPTZ | YES | NOW() | Last update time |

**Constraints:** UNIQUE(providerId, accountId)

### 4. `public.verification` Table
**Purpose:** Stores email verification codes, password reset tokens, etc.

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | TEXT | NO | - | Primary key |
| `identifier` | TEXT | NO | - | Email or identifier being verified |
| `value` | TEXT | NO | - | Verification code/token |
| `expiresAt` | TIMESTAMPTZ | NO | - | Expiration time |
| `createdAt` | TIMESTAMPTZ | YES | NOW() | Creation time |
| `updatedAt` | TIMESTAMPTZ | YES | NOW() | Last update time |

---

## Application Tables (Your Existing Schema)

### 5. `public.users` Table
**Purpose:** Extended user profiles (syncs with Better Auth `user` table)

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | - | Primary key (references auth.users or generated) |
| `email` | TEXT | NO | - | User's email |
| `full_name` | TEXT | YES | NULL | User's full name |
| `avatar_url` | TEXT | YES | NULL | Avatar image URL |
| `timezone` | TEXT | YES | 'UTC' | User's timezone |
| `email_signature` | TEXT | YES | NULL | Email signature |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 6. `public.leads` Table
**Purpose:** Companies/contacts being tracked

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `company` | TEXT | NO | - | Company name |
| `contact_name` | TEXT | NO | - | Contact person name |
| `email` | TEXT | NO | - | Contact email |
| `phone` | TEXT | YES | NULL | Contact phone |
| `website` | TEXT | YES | NULL | Company website |
| `industry` | TEXT | YES | NULL | Industry type |
| `company_size` | TEXT | YES | NULL | Company size |
| `status` | TEXT | NO | 'warm' | Status: 'hot', 'warm', or 'cold' |
| `last_message` | TEXT | YES | NULL | Last message from lead |
| `last_contact_at` | TIMESTAMPTZ | YES | NULL | Last contact timestamp |
| `days_since_contact` | INTEGER | YES | 0 | Days since last contact |
| `ai_suggestion` | TEXT | YES | NULL | AI-generated suggestion |
| `has_ai_draft` | BOOLEAN | YES | FALSE | Whether AI draft exists |
| `metadata` | JSONB | YES | '{}' | Additional metadata |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

**Constraints:** UNIQUE(user_id, email)

### 7. `public.email_threads` Table
**Purpose:** Groups related emails together

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `lead_id` | UUID | NO | - | Foreign key to `leads.id` |
| `subject` | TEXT | NO | - | Email thread subject |
| `thread_identifier` | TEXT | YES | NULL | Thread ID from email headers |
| `status` | TEXT | NO | 'active' | Status: 'active', 'archived', or 'closed' |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 8. `public.emails` Table
**Purpose:** Individual email messages

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `thread_id` | UUID | YES | NULL | Foreign key to `email_threads.id` |
| `lead_id` | UUID | YES | NULL | Foreign key to `leads.id` |
| `message_id` | TEXT | YES | NULL | Email message ID |
| `from_email` | TEXT | NO | - | Sender email |
| `to_email` | TEXT | NO | - | Recipient email |
| `cc` | TEXT[] | YES | NULL | CC recipients |
| `bcc` | TEXT[] | YES | NULL | BCC recipients |
| `subject` | TEXT | NO | - | Email subject |
| `body` | TEXT | NO | - | Email body (HTML or plain text) |
| `direction` | TEXT | NO | - | 'inbound' or 'outbound' |
| `status` | TEXT | NO | 'unread' | Status: 'unread', 'read', 'replied', 'archived' |
| `sent_at` | TIMESTAMPTZ | YES | NULL | When email was sent |
| `received_at` | TIMESTAMPTZ | YES | NULL | When email was received |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 9. `public.actions` Table
**Purpose:** Tasks and actions to be performed

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `lead_id` | UUID | YES | NULL | Foreign key to `leads.id` |
| `email_id` | UUID | YES | NULL | Foreign key to `emails.id` |
| `type` | TEXT | NO | - | Action type: 'reply', 'follow_up', 'meeting', etc. |
| `status` | TEXT | NO | 'pending' | Status: 'pending', 'in_progress', 'completed', 'cancelled' |
| `priority` | TEXT | NO | 'medium' | Priority: 'low', 'medium', 'high' |
| `due_date` | TIMESTAMPTZ | YES | NULL | When action is due |
| `description` | TEXT | YES | NULL | Action description |
| `metadata` | JSONB | YES | '{}' | Additional metadata |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 10. `public.ai_insights` Table
**Purpose:** AI-generated insights and recommendations

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `lead_id` | UUID | YES | NULL | Foreign key to `leads.id` |
| `email_id` | UUID | YES | NULL | Foreign key to `emails.id` |
| `insight_type` | TEXT | NO | - | Type: 'sentiment', 'urgency', 'suggestion', etc. |
| `content` | TEXT | NO | - | Insight content |
| `confidence` | DECIMAL | YES | NULL | Confidence score (0-1) |
| `metadata` | JSONB | YES | '{}' | Additional metadata |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 11. `public.performance_metrics` Table
**Purpose:** User performance tracking

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `metric_date` | DATE | NO | - | Date for the metric |
| `emails_sent` | INTEGER | YES | 0 | Number of emails sent |
| `emails_received` | INTEGER | YES | 0 | Number of emails received |
| `reply_rate` | DECIMAL | YES | NULL | Reply rate percentage |
| `avg_response_time` | INTEGER | YES | NULL | Average response time in minutes |
| `leads_contacted` | INTEGER | YES | 0 | Number of leads contacted |
| `meetings_scheduled` | INTEGER | YES | 0 | Number of meetings scheduled |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

**Constraints:** UNIQUE(user_id, metric_date)

### 12. `public.email_templates` Table
**Purpose:** Reusable email templates

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `user_id` | UUID | NO | - | Foreign key to `users.id` |
| `name` | TEXT | NO | - | Template name |
| `subject` | TEXT | NO | - | Email subject template |
| `body` | TEXT | NO | - | Email body template |
| `tone` | TEXT | NO | 'professional' | Tone: 'professional', 'friendly', 'casual', 'formal' |
| `category` | TEXT | YES | NULL | Template category |
| `is_default` | BOOLEAN | YES | FALSE | Whether this is the default template |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | YES | NOW() | Last update timestamp |

### 13. `public.email_attachments` Table
**Purpose:** Email file attachments

| Column Name | Data Type | Nullable | Default | Description |
|------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `email_id` | UUID | NO | - | Foreign key to `emails.id` |
| `filename` | TEXT | NO | - | Attachment filename |
| `file_size` | INTEGER | YES | NULL | File size in bytes |
| `content_type` | TEXT | YES | NULL | MIME type |
| `storage_url` | TEXT | YES | NULL | URL to stored file |
| `created_at` | TIMESTAMPTZ | YES | NOW() | Creation timestamp |

---

## Summary

**Total Tables:** 13
- **Better Auth Tables:** 4 (`user`, `session`, `account`, `verification`)
- **Application Tables:** 9 (`users`, `leads`, `email_threads`, `emails`, `actions`, `ai_insights`, `performance_metrics`, `email_templates`, `email_attachments`)

**Important Notes:**
- The `public.user` table is for Better Auth authentication
- The `public.users` table is for your application data
- A trigger syncs data from `user` → `users` when Better Auth creates/updates a user










