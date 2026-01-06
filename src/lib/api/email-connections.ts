// API service for Email Connections
import { supabase } from "@/lib/supabase";

export interface EmailConnection {
  id: string;
  user_id: string;
  provider: "gmail" | "outlook" | "imap";
  email: string;
  display_name: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_enabled: boolean;
  sync_frequency: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectEmailRequest {
  provider: "gmail" | "outlook" | "imap";
  email: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export const emailConnectionsApi = {
  // Get all email connections for the current user
  async getAll(betterAuthUserId: string): Promise<EmailConnection[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use database function that accepts Better Auth TEXT ID
    const { data, error } = await supabase.rpc("get_user_email_connections", {
      p_better_auth_id: betterAuthUserId,
    });

    if (error) {
      console.error("Error fetching email connections:", error);
      throw new Error(`Failed to fetch email connections: ${error.message}`);
    }

    return (data || []) as EmailConnection[];
  },

  // Get OAuth URL for a provider
  async getOAuthUrl(
    provider: "gmail" | "outlook",
    userId: string,
    redirectUri?: string
  ): Promise<{ authUrl: string }> {
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";

    const params = new URLSearchParams({
      userId,
      ...(redirectUri && { redirectUri }),
    });

    const response = await fetch(`${authServerUrl}/api/email-connections/oauth/${provider}?${params}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to get OAuth URL: ${response.statusText}`);
    }

    const result = await response.json();
    return { authUrl: result.authUrl };
  },

  // Connect an email account
  async connect(
    betterAuthUserId: string,
    connection: ConnectEmailRequest
  ): Promise<EmailConnection> {
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const response = await fetch(`${authServerUrl}/api/email-connections/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        ...connection,
        userId: userUuid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to connect email: ${response.statusText}`);
    }

    const result = await response.json();

    // Now store in database
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase
      .from("email_connections")
      .insert({
        user_id: userUuid,
        provider: connection.provider,
        email: connection.email,
        display_name: connection.email.split("@")[0],
        access_token: connection.accessToken || "mock_token", // In production, encrypt this
        refresh_token: connection.refreshToken || null,
        token_expires_at: connection.expiresIn
          ? new Date(Date.now() + connection.expiresIn * 1000).toISOString()
          : null,
        is_active: true,
        sync_enabled: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing email connection:", error);
      throw new Error(`Failed to store email connection: ${error.message}`);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      provider: data.provider,
      email: data.email,
      display_name: data.display_name,
      is_active: data.is_active,
      last_sync_at: data.last_sync_at,
      sync_enabled: data.sync_enabled,
      sync_frequency: data.sync_frequency,
      error_message: data.error_message,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  // Disconnect an email account
  async disconnect(connectionId: string, betterAuthUserId: string): Promise<void> {
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
      .from("email_connections")
      .update({ is_active: false })
      .eq("id", connectionId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error disconnecting email:", error);
      throw new Error(`Failed to disconnect email: ${error.message}`);
    }
  },

  // Delete an email connection
  async delete(connectionId: string, betterAuthUserId: string): Promise<void> {
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
      .from("email_connections")
      .delete()
      .eq("id", connectionId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error deleting email connection:", error);
      throw new Error(`Failed to delete email connection: ${error.message}`);
    }
  },

  // Sync emails from a connected account
  async sync(connectionId: string): Promise<{ success: boolean; message: string; threadsSynced?: number }> {
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";

    // For Gmail, use the new /gmail/sync endpoint
    const response = await fetch(`${authServerUrl}/gmail/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      // If Gmail sync fails, try the old endpoint as fallback
      const fallbackResponse = await fetch(`${authServerUrl}/api/email-connections/${connectionId}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!fallbackResponse.ok) {
        const errorData = await fallbackResponse.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.message || errorData.error || `Failed to sync emails: ${fallbackResponse.statusText}`);
      }

      const fallbackResult = await fallbackResponse.json();
      return {
        success: fallbackResult.success,
        message: fallbackResult.message || "Email sync initiated",
      };
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message || "Gmail sync completed",
      threadsSynced: result.threadsSynced,
    };
  },
};

