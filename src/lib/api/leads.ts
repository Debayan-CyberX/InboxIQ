// API service for Leads
import { supabase } from "@/lib/supabase";
import type { Lead, InsertLead, UpdateLead } from "@/types/database";

export const leadsApi = {
  // Get all leads for the current user
  // userId is the Better Auth TEXT ID, function will convert to UUID internally
  async getAll(userId: string, status?: "hot" | "warm" | "cold", searchQuery?: string): Promise<Lead[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use database function that accepts Better Auth TEXT ID
    const { data, error } = await supabase.rpc("get_user_leads", {
      p_better_auth_id: userId, // Pass Better Auth ID directly
      p_status: status || null,
      p_search_query: searchQuery || null,
    });

    if (error) {
      console.error("Error fetching leads:", error);
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return data || [];
  },

  // Get a single lead by ID
  // Note: This still needs the UUID, so we'll need to get it first
  async getById(leadId: string, betterAuthUserId: string): Promise<Lead | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // First get the user UUID
    const { data: userUuidData, error: uuidError } = await supabase.rpc("get_user_uuid_from_better_auth_id", {
      p_better_auth_id: betterAuthUserId,
    });

    if (uuidError || !userUuidData) {
      console.error("Error getting user UUID:", uuidError);
      return null;
    }

    const userUuid = userUuidData as unknown as string;

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .eq("user_id", userUuid)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("Error fetching lead:", error);
      throw new Error(`Failed to fetch lead: ${error.message}`);
    }

    return data;
  },

  // Create a new lead
  // Note: lead.user_id should be the UUID, not Better Auth ID
  // We'll need a helper to convert Better Auth ID to UUID
  async create(lead: InsertLead, betterAuthUserId: string): Promise<Lead> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get the user UUID from Better Auth ID
    const { data: userUuidData, error: uuidError } = await supabase.rpc("get_user_uuid_from_better_auth_id", {
      p_better_auth_id: betterAuthUserId,
    });

    if (uuidError || !userUuidData) {
      console.error("Error getting user UUID:", uuidError);
      throw new Error(`Failed to get user UUID: ${uuidError?.message || "Unknown error"}`);
    }

    const userUuid = userUuidData as unknown as string;

    // Create lead with UUID
    const leadWithUuid = {
      ...lead,
      user_id: userUuid,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(leadWithUuid)
      .select()
      .single();

    if (error) {
      console.error("Error creating lead:", error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return data;
  },

  // Update a lead
  async update(leadId: string, betterAuthUserId: string, updates: UpdateLead): Promise<Lead> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get the user UUID from Better Auth ID
    const { data: userUuidData, error: uuidError } = await supabase.rpc("get_user_uuid_from_better_auth_id", {
      p_better_auth_id: betterAuthUserId,
    });

    if (uuidError || !userUuidData) {
      console.error("Error getting user UUID:", uuidError);
      throw new Error(`Failed to get user UUID: ${uuidError?.message || "Unknown error"}`);
    }

    const userUuid = userUuidData as unknown as string;

    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", leadId)
      .eq("user_id", userUuid)
      .select()
      .single();

    if (error) {
      console.error("Error updating lead:", error);
      throw new Error(`Failed to update lead: ${error.message}`);
    }

    return data;
  },

  // Delete a lead
  async delete(leadId: string, betterAuthUserId: string): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get the user UUID from Better Auth ID
    const { data: userUuidData, error: uuidError } = await supabase.rpc("get_user_uuid_from_better_auth_id", {
      p_better_auth_id: betterAuthUserId,
    });

    if (uuidError || !userUuidData) {
      console.error("Error getting user UUID:", uuidError);
      throw new Error(`Failed to get user UUID: ${uuidError?.message || "Unknown error"}`);
    }

    const userUuid = userUuidData as unknown as string;

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error deleting lead:", error);
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  },

  // Get leads by status (uses getAll with status filter)
  async getByStatus(userId: string, status: "hot" | "warm" | "cold"): Promise<Lead[]> {
    return this.getAll(userId, status);
  },

  // Search leads (uses getAll with search query)
  async search(userId: string, query: string): Promise<Lead[]> {
    return this.getAll(userId, undefined, query);
  },

  // Get lead statistics
  // userId is the Better Auth TEXT ID, function will convert to UUID internally
  async getStatistics(userId: string) {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase.rpc("get_lead_statistics", {
      p_better_auth_id: userId, // Pass Better Auth ID directly
    });

    if (error) {
      console.error("Error fetching lead statistics:", error);
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }

    return data?.[0] || {
      total_leads: 0,
      hot_leads: 0,
      warm_leads: 0,
      cold_leads: 0,
      needs_follow_up: 0,
    };
  },

  // Detect leads from email threads
  async detectLeads(betterAuthUserId: string): Promise<{ success: boolean; leadsCreated: number; threadsUpdated: number }> {
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "https://inboxiq-psi.vercel.app";

    const response = await fetch(`${authServerUrl}/api/leads/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to detect leads: ${response.statusText}`);
    }

    return await response.json();
  },

  // Get email threads for a lead
  async getLeadThreads(leadId: string, betterAuthUserId: string) {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID first
    const { data: userUuidData, error: uuidError } = await supabase.rpc("get_user_uuid_from_better_auth_id", {
      p_better_auth_id: betterAuthUserId,
    });

    if (uuidError || !userUuidData) {
      throw new Error("User not found in database");
    }

    const userUuid = userUuidData as unknown as string;

    const { data, error } = await supabase
      .from("email_threads")
      .select("*")
      .eq("lead_id", leadId)
      .eq("user_id", userUuid)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching lead threads:", error);
      throw new Error(`Failed to fetch lead threads: ${error.message}`);
    }

    return data || [];
  },

  // Generate AI follow-up for a lead
  async generateFollowUp(leadId: string, betterAuthUserId: string): Promise<{ id: string; subject: string; body: string }> {
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "https://inboxiq-psi.vercel.app";

    const response = await fetch(`${authServerUrl}/api/leads/${leadId}/generate-followup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to generate follow-up: ${response.statusText}`);
    }

    const result = await response.json();
    return result.draft;
  },
};

