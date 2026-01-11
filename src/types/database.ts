/**
 * TypeScript types for InboxAI Assistant database schema
 * These types match the Supabase database schema exactly
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type LeadStatus = 'hot' | 'warm' | 'cold';
export type ActionType = 'reply' | 'follow-up' | 'meeting';
export type ActionPriority = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type EmailDirection = 'inbound' | 'outbound';
export type EmailStatus = 'draft' | 'sent' | 'failed' | 'scheduled';
export type EmailTone = 'professional' | 'short' | 'confident' | 'polite' | 'sales-focused';
export type ThreadStatus = 'active' | 'archived' | 'closed';
export type InsightType = 'daily' | 'weekly' | 'lead_specific' | 'opportunity' | 'risk';
export type MetricType = 'reply_rate' | 'avg_response_time' | 'time_saved' | 'emails_sent' | 'leads_converted';
export type Trend = 'up' | 'down' | 'neutral';
export type HighlightType = 'hot' | 'risk' | 'opportunity';

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

export interface User {
  id: string; // UUID
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  email_signature: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Lead {
  id: string; // UUID
  user_id: string; // UUID
  company: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  status: LeadStatus;
  last_message: string | null;
  last_contact_at: string | null; // ISO timestamp
  days_since_contact: number;
  ai_suggestion: string | null;
  has_ai_draft: boolean;
  metadata: Record<string, any>; // JSONB
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface EmailThread {
  id: string; // UUID
  user_id: string; // UUID
  lead_id: string; // UUID
  subject: string;
  thread_identifier: string | null;
  status: ThreadStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Email {
  id: string; // UUID
  user_id: string; // UUID
  lead_id: string | null; // UUID
  thread_id: string | null; // UUID
  direction: EmailDirection;
  from_email: string;
  to_email: string;
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  status: EmailStatus;
  is_ai_draft: boolean;
  tone: EmailTone | null;
  ai_reason: string | null;
  ai_category: "lead" | "follow_up_needed" | "important" | "promo" | "newsletter" | "spam" | null; // AI email classification
  ai_confidence: number | null; // 0-1, AI classification confidence
  external_email_id: string | null;
  sent_at: string | null; // ISO timestamp
  received_at: string | null; // ISO timestamp
  scheduled_for: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Action {
  id: string; // UUID
  user_id: string; // UUID
  lead_id: string; // UUID
  type: ActionType;
  priority: ActionPriority;
  subject: string;
  reason: string;
  has_ai_draft: boolean;
  email_draft_id: string | null; // UUID
  status: ActionStatus;
  due_at: string | null; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface AIInsight {
  id: string; // UUID
  user_id: string; // UUID
  insight_text: string;
  highlights: Array<{
    type: HighlightType;
    text: string;
  }>;
  insight_type: InsightType;
  lead_id: string | null; // UUID
  is_read: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface PerformanceMetric {
  id: string; // UUID
  user_id: string; // UUID
  metric_type: MetricType;
  value: number;
  previous_value: number | null;
  trend: Trend | null;
  period_start: string; // ISO timestamp
  period_end: string; // ISO timestamp
  created_at: string; // ISO timestamp
}

export interface EmailTemplate {
  id: string; // UUID
  user_id: string; // UUID
  name: string;
  subject: string;
  body: string;
  category: string | null;
  tone: EmailTone | null;
  is_public: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface EmailAttachment {
  id: string; // UUID
  email_id: string; // UUID
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  storage_path: string;
  created_at: string; // ISO timestamp
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type InsertLead = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'days_since_contact'>;
export type InsertEmailThread = Omit<EmailThread, 'id' | 'created_at' | 'updated_at'>;
export type InsertEmail = Omit<Email, 'id' | 'created_at' | 'updated_at'>;
export type InsertAction = Omit<Action, 'id' | 'created_at' | 'updated_at'>;
export type InsertAIInsight = Omit<AIInsight, 'id' | 'created_at' | 'updated_at'>;
export type InsertPerformanceMetric = Omit<PerformanceMetric, 'id' | 'created_at'>;
export type InsertEmailTemplate = Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>;
export type InsertEmailAttachment = Omit<EmailAttachment, 'id' | 'created_at'>;

// ============================================================================
// UPDATE TYPES (for updating existing records)
// ============================================================================

export type UpdateUser = Partial<Omit<User, 'id' | 'created_at'>>;
export type UpdateLead = Partial<Omit<Lead, 'id' | 'user_id' | 'created_at'>>;
export type UpdateEmailThread = Partial<Omit<EmailThread, 'id' | 'user_id' | 'created_at'>>;
export type UpdateEmail = Partial<Omit<Email, 'id' | 'user_id' | 'created_at'>>;
export type UpdateAction = Partial<Omit<Action, 'id' | 'user_id' | 'created_at'>>;
export type UpdateAIInsight = Partial<Omit<AIInsight, 'id' | 'user_id' | 'created_at'>>;
export type UpdatePerformanceMetric = Partial<Omit<PerformanceMetric, 'id' | 'user_id' | 'created_at'>>;
export type UpdateEmailTemplate = Partial<Omit<EmailTemplate, 'id' | 'user_id' | 'created_at'>>;
export type UpdateEmailAttachment = Partial<Omit<EmailAttachment, 'id' | 'email_id' | 'created_at'>>;

// ============================================================================
// RELATIONSHIP TYPES (with joins)
// ============================================================================

export interface LeadWithRelations extends Lead {
  actions?: Action[];
  emails?: Email[];
  latest_email?: Email;
  latest_insight?: AIInsight;
}

export interface ActionWithRelations extends Action {
  lead?: Lead;
  email_draft?: Email;
}

export interface EmailWithRelations extends Email {
  lead?: Lead;
  thread?: EmailThread;
  attachments?: EmailAttachment[];
}

export interface EmailThreadWithRelations extends EmailThread {
  lead?: Lead;
  emails?: Email[];
}

export interface AIInsightWithRelations extends AIInsight {
  lead?: Lead | null;
}

// ============================================================================
// HELPER FUNCTION RETURN TYPES
// ============================================================================

export interface LeadStatistics {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  needs_follow_up: number;
}

// ============================================================================
// SUPABASE RESPONSE TYPES
// ============================================================================

// If you generate Supabase types using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
// You can import and re-export them here:
// import type { Database as SupabaseDatabase } from './supabase';
// export type { SupabaseDatabase };

