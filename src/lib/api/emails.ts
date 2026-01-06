// API service for Emails and Email Threads
import { supabase } from "@/lib/supabase";
import type { Email, EmailThread, InsertEmail, UpdateEmail, InsertEmailThread, UpdateEmailThread } from "@/types/database";

export const emailsApi = {
  // Get all email threads for the current user
  async getThreads(betterAuthUserId: string, status?: "active" | "archived" | "closed") {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use database function that accepts Better Auth TEXT ID
    const { data, error } = await supabase.rpc("get_user_email_threads", {
      p_better_auth_id: betterAuthUserId,
      p_status: status || null,
    });

    if (error) {
      console.error("Error fetching email threads:", error);
      throw new Error(`Failed to fetch email threads: ${error.message}`);
    }

    return data || [];
  },

  // Get emails for a specific thread
  async getThreadEmails(threadId: string, betterAuthUserId: string): Promise<Email[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID first
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    // Use database function
    const { data, error } = await supabase.rpc("get_thread_emails", {
      p_thread_id: threadId,
      p_user_id: userUuid,
    });

    if (error) {
      console.error("Error fetching thread emails:", error);
      throw new Error(`Failed to fetch emails: ${error.message}`);
    }

    return data || [];
  },

  // Get all emails (drafts)
  async getDrafts(betterAuthUserId: string): Promise<Email[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use database function that accepts Better Auth TEXT ID
    const { data, error } = await supabase.rpc("get_user_drafts", {
      p_better_auth_id: betterAuthUserId,
    });

    if (error) {
      console.error("Error fetching drafts:", error);
      throw new Error(`Failed to fetch drafts: ${error.message}`);
    }

    return data || [];
  },

  // Create a new email
  async create(email: InsertEmail, betterAuthUserId: string): Promise<Email> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const emailWithUuid = {
      ...email,
      user_id: userUuid,
    };

    const { data, error } = await supabase
      .from("emails")
      .insert(emailWithUuid)
      .select()
      .single();

    if (error) {
      console.error("Error creating email:", error);
      throw new Error(`Failed to create email: ${error.message}`);
    }

    return data;
  },

  // Update an email
  async update(emailId: string, betterAuthUserId: string, updates: UpdateEmail): Promise<Email> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const { data, error } = await supabase
      .from("emails")
      .update(updates)
      .eq("id", emailId)
      .eq("user_id", userUuid)
      .select()
      .single();

    if (error) {
      console.error("Error updating email:", error);
      throw new Error(`Failed to update email: ${error.message}`);
    }

    return data;
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

    const { error } = await supabase
      .from("emails")
      .delete()
      .eq("id", emailId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error deleting email:", error);
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  },

  // Archive a thread
  async archiveThread(threadId: string, betterAuthUserId: string): Promise<void> {
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
      .or(`subject.ilike.%${query}%,body_text.ilike.%${query}%,from_email.ilike.%${query}%,to_email.ilike.%${query}%`)
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
    }
  ): Promise<{ success: boolean; messageId?: string }> {
    // Get email details from database if emailId is provided
    let emailData: Email | null = null;
    
    if (emailId) {
      // Get user UUID
      const { getUserIdFromBetterAuth } = await import("./utils");
      const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
      
      if (!userUuid) {
        throw new Error("User not found in database");
      }

      // Fetch email from database
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("id", emailId)
        .eq("user_id", userUuid)
        .single();

      if (error) {
        console.error("Error fetching email:", error);
        throw new Error(`Failed to fetch email: ${error.message}`);
      }

      emailData = data;
    }

    // Use provided options or email data from database
    const to = options?.to || emailData?.to_email;
    const subject = options?.subject || emailData?.subject || "";
    const body = options?.body || emailData?.body_html || emailData?.body_text || "";
    const fromEmail = options?.fromEmail;
    const fromName = options?.fromName;

    if (!to || !subject || !body) {
      throw new Error("Missing required email fields: to, subject, and body are required");
    }

    // Get auth server URL (production or development)
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || 
      (import.meta.env.PROD ? "https://inboxiq-qq72.onrender.com" : "http://localhost:3001");

    // Send email via backend API
    const response = await fetch(`${authServerUrl}/api/emails/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for auth
      body: JSON.stringify({
        to,
        subject,
        body,
        fromEmail,
        fromName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to send email: ${response.statusText}`);
    }

    const result = await response.json();

    // Update email status in database if emailId was provided
    if (emailId && emailData) {
      try {
        await this.update(emailId, betterAuthUserId, {
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating email status:", error);
        // Don't throw - email was sent successfully, just status update failed
      }
    }

    return result;
  },

  // Create test drafts for development/testing
  async createTestDrafts(betterAuthUserId: string): Promise<{ success: boolean; count: number }> {
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

    const result = data as unknown as { created_count: number; draft_ids: string[] } | null;
    
    return {
      success: true,
      count: result?.created_count || 0,
    };
  },
};

