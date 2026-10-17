import type {
  Lead,
  InsertLead,
  UpdateLead,
  Email,
  InsertEmail,
  UpdateEmail,
  EmailThread,
  InsertEmailThread,
  UpdateEmailThread,
  Action,
  InsertAction,
  UpdateAction,
  AIInsight,
  InsertAIInsight,
  UpdateAIInsight,
  PerformanceMetric,
  InsertPerformanceMetric,
  UpdatePerformanceMetric,
  LeadStatistics,
  User,
} from "./database";
import type { UserSettings, SettingsUpdate } from "@/lib/api/settings";
import type { EmailConnection } from "@/lib/api/email-connections";
type Shape<T> = { [K in keyof T]: T[K] };
type Relation = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: false;
  referencedRelation: string;
  referencedColumns: string[];
};
type Table<R, I = Partial<R>, U = Partial<R>, Rel extends Relation[] = []> = {
  Row: Shape<R>;
  Insert: Shape<I>;
  Update: Shape<U>;
  Relationships: Rel;
};
type LeadRelation = [
  {
    foreignKeyName: "emails_lead_id_fkey";
    columns: ["lead_id"];
    isOneToOne: false;
    referencedRelation: "leads";
    referencedColumns: ["id"];
  },
];
type ThreadRecord = EmailThread & {
  lead_company?: string;
  lead_contact_name?: string;
  lead_email?: string;
};
type DraftRecord = Email & {
  lead_company?: string;
  lead_contact_name?: string;
};
type ConnectionRecord = EmailConnection & {
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string | null;
};
/** Explicit contract for the existing tables and RPCs; no database migration. */
export type Database = {
  public: {
    Tables: {
      users: Table<User>;
      leads: Table<Lead, InsertLead, UpdateLead>;
      email_threads: Table<
        EmailThread,
        InsertEmailThread,
        UpdateEmailThread,
        [
          {
            foreignKeyName: "email_threads_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ]
      >;
      emails: Table<Email, InsertEmail, UpdateEmail, LeadRelation>;
      actions: Table<
        Action,
        InsertAction,
        UpdateAction,
        [
          {
            foreignKeyName: "actions_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ]
      >;
      ai_insights: Table<
        AIInsight,
        InsertAIInsight,
        UpdateAIInsight,
        [
          {
            foreignKeyName: "ai_insights_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ]
      >;
      performance_metrics: Table<
        PerformanceMetric,
        InsertPerformanceMetric,
        UpdatePerformanceMetric
      >;
      email_connections: Table<
        ConnectionRecord,
        Partial<ConnectionRecord> &
          Pick<ConnectionRecord, "user_id" | "provider" | "email">
      >;
      user_settings: Table<UserSettings>;
    };
    Views: Record<string, never>;
    Functions: {
      get_user_uuid_from_better_auth_id: {
        Args: { p_better_auth_id: string };
        Returns: string;
      };
      get_user_leads: {
        Args: {
          p_better_auth_id: string;
          p_status?: string | null;
          p_search_query?: string | null;
        };
        Returns: Lead[];
      };
      get_lead_statistics: {
        Args: { p_better_auth_id: string };
        Returns: LeadStatistics[];
      };
      get_user_email_threads: {
        Args: { p_better_auth_id: string; p_status?: string | null };
        Returns: ThreadRecord[];
      };
      get_thread_emails: {
        Args: { p_thread_id: string; p_user_id: string };
        Returns: Email[];
      };
      get_user_drafts: {
        Args: { p_better_auth_id: string };
        Returns: DraftRecord[];
      };
      get_user_actions: {
        Args: { p_better_auth_id: string; p_status?: string };
        Returns: Action[];
      };
      get_recent_insights: {
        Args: { p_better_auth_id: string; p_limit?: number };
        Returns: AIInsight[];
      };
      get_user_email_connections: {
        Args: { p_better_auth_id: string };
        Returns: EmailConnection[];
      };
      get_user_settings: {
        Args: { p_better_auth_id: string };
        Returns: UserSettings[];
      };
      upsert_user_settings: {
        Args: { p_better_auth_id: string; p_settings: SettingsUpdate };
        Returns: UserSettings[];
      };
      create_test_drafts_for_user: {
        Args: { p_better_auth_id: string };
        Returns: { success: boolean; count: number };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
