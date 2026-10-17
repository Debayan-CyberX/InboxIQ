// API service for Emails and Email Threads
import { supabase } from "@/lib/supabase";
import type {
  Email,
  EmailThread,
  InsertEmail,
  UpdateEmail,
  InsertEmailThread,
  UpdateEmailThread,
} from "@/types/database";
import { getApiBase } from "./base-url";

export const emailsApi = {
  // Get all email threads for the current user
  async getThreads(
    betterAuthUserId: string,
    status?: "active" | "archived" | "closed",
  ) {
    const params = new URLSearchParams(status ? { status } : {});
    const response = await fetch(
      `${getApiBase()}/api/email-threads?${params}`,
      { credentials: "include" },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not load conversations.");
    return result.threads as (EmailThread & {
      lead_company?: string;
      lead_contact_name?: string;
      lead_email?: string;
      is_read?: boolean;
    })[];
  },

  // Get emails for a specific thread
  async getThreadEmails(
    threadId: string,
    betterAuthUserId: string,
  ): Promise<Email[]> {
    const response = await fetch(
      `${getApiBase()}/api/email-threads/${encodeURIComponent(threadId)}/emails`,
      { credentials: "include" },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not load messages.");
    return result.emails || [];
  },

  // Get all emails (drafts)
  async getDrafts(betterAuthUserId: string): Promise<Email[]> {
    const response = await fetch(`${getApiBase()}/api/drafts`, {
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load drafts.");
    return result.drafts || [];
  },

  // Create a new email (uses backend endpoint to bypass RLS)
  async create(email: InsertEmail, betterAuthUserId: string): Promise<Email> {
    const authServerUrl = getApiBase();

    const response = await fetch(`${authServerUrl}/api/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(email),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Failed to create email: ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result.email;
  },

  // Update an email (uses backend endpoint to bypass RLS)
  async update(
    emailId: string,
    betterAuthUserId: string,
    updates: UpdateEmail,
  ): Promise<Email> {
    const authServerUrl = getApiBase();

    const response = await fetch(`${authServerUrl}/api/emails/${emailId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Failed to update email: ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result.email;
  },

  // Delete an email
  async delete(emailId: string, betterAuthUserId: string): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);

    if (!userUuid) {
      throw new Error("User not found in database");
    }

    // Use backend endpoint to bypass RLS
    const authServerUrl = getApiBase();

    const response = await fetch(`${authServerUrl}/api/emails/${emailId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Failed to delete email: ${response.statusText}`,
      );
    }

    // No return value needed for delete
  },

  // Archive a thread
  async archiveThread(
    threadId: string,
    betterAuthUserId: string,
  ): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);

    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const { error } = await supabase
      .from("email_threads")
      .update({ status: "archived" })
      .eq("id", threadId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error archiving thread:", error);
      throw new Error(`Failed to archive thread: ${error.message}`);
    }
  },

  // Search emails
  async search(betterAuthUserId: string, query: string): Promise<Email[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);

    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("user_id", userUuid)
      .or(
        `subject.ilike.%${query}%,body_text.ilike.%${query}%,from_email.ilike.%${query}%,to_email.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching emails:", error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }

    return data || [];
  },

  // Send an email
  async sendEmail(
    emailId: string,
    betterAuthUserId: string,
    options?: {
      to?: string;
      subject?: string;
      body?: string;
      fromEmail?: string;
      fromName?: string;
    },
  ): Promise<{ success: boolean; messageId?: string }> {
    const response = await fetch(`${getApiBase()}/api/emails/send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not send this draft.");
    return result;
  },

  // Create test drafts for development/testing
  async createTestDrafts(
    betterAuthUserId: string,
  ): Promise<{ success: boolean; count: number }> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Call the database function to create test drafts
    const { data, error } = await supabase.rpc("create_test_drafts_for_user", {
      p_better_auth_id: betterAuthUserId,
    });

    if (error) {
      console.error("Error creating test drafts:", error);
      throw new Error(`Failed to create test drafts: ${error.message}`);
    }

    const result = data as unknown as {
      created_count: number;
      draft_ids: string[];
    } | null;

    return {
      success: true,
      count: result?.created_count || 0,
    };
  },
};
