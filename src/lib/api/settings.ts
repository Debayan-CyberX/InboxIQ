// API service for User Settings
import { supabase } from "@/lib/supabase";

export interface UserSettings {
  id: string;
  user_id: string;
  // Profile
  full_name: string | null;
  company: string | null;
  role: string | null;
  timezone: string;
  language: string;
  // Email
  email_signature: string | null;
  default_tone: string;
  auto_archive: boolean;
  archive_after_days: number;
  email_notifications: boolean;
  // AI
  ai_enabled: boolean;
  confidence_threshold: number;
  auto_generate_drafts: boolean;
  suggest_follow_ups: boolean;
  analyze_sentiment: boolean;
  generate_subject_lines: boolean;
  preferred_tone: string;
  max_draft_length: number;
  // Notifications
  browser_notifications: boolean;
  hot_lead_alerts: boolean;
  follow_up_reminders: boolean;
  weekly_digest: boolean;
  ai_draft_ready: boolean;
  deal_at_risk: boolean;
  // Security
  two_factor_enabled: boolean;
  session_timeout: number;
  require_password_change: boolean;
  last_password_change: string | null;
  // Appearance
  theme: string;
  compact_mode: boolean;
  show_avatars: boolean;
  animations: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsUpdate {
  // Profile
  full_name?: string;
  company?: string;
  role?: string;
  timezone?: string;
  language?: string;
  // Email
  email_signature?: string;
  default_tone?: string;
  auto_archive?: boolean;
  archive_after_days?: number;
  email_notifications?: boolean;
  // AI
  ai_enabled?: boolean;
  confidence_threshold?: number;
  auto_generate_drafts?: boolean;
  suggest_follow_ups?: boolean;
  analyze_sentiment?: boolean;
  generate_subject_lines?: boolean;
  preferred_tone?: string;
  max_draft_length?: number;
  // Notifications
  browser_notifications?: boolean;
  hot_lead_alerts?: boolean;
  follow_up_reminders?: boolean;
  weekly_digest?: boolean;
  ai_draft_ready?: boolean;
  deal_at_risk?: boolean;
  // Security
  two_factor_enabled?: boolean;
  session_timeout?: number;
  require_password_change?: boolean;
  last_password_change?: string;
  // Appearance
  theme?: string;
  compact_mode?: boolean;
  show_avatars?: boolean;
  animations?: boolean;
}

export const settingsApi = {
  // Get user settings
  async get(betterAuthUserId: string): Promise<UserSettings | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase.rpc("get_user_settings", {
      p_better_auth_id: betterAuthUserId,
    });

    if (error) {
      console.error("Error fetching settings:", error);
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null; // No settings found, will use defaults
    }

    return data[0] as UserSettings;
  },

  // Save user settings
  async save(betterAuthUserId: string, settings: SettingsUpdate): Promise<UserSettings> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert settings to JSONB
    const settingsJson = settings as any;

    const { data, error } = await supabase.rpc("upsert_user_settings", {
      p_better_auth_id: betterAuthUserId,
      p_settings: settingsJson,
    });

    if (error) {
      console.error("Error saving settings:", error);
      throw new Error(`Failed to save settings: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("Failed to save settings: No data returned");
    }

    return data[0] as UserSettings;
  },
};










