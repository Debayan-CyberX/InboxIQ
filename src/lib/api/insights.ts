// API service for AI Insights
import { supabase } from "@/lib/supabase";
import type { AIInsight, InsertAIInsight, UpdateAIInsight } from "@/types/database";

export const insightsApi = {
  // Get recent insights for the current user
  async getRecent(betterAuthUserId: string, limit: number = 10): Promise<AIInsight[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const { data, error } = await supabase.rpc("get_recent_insights", {
      p_better_auth_id: betterAuthUserId,
      p_limit: limit,
    });

    if (error) {
      console.error("Error fetching insights:", error);
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }

    return data || [];
  },

  // Get all insights
  async getAll(betterAuthUserId: string, type?: "daily" | "weekly" | "lead_specific" | "opportunity" | "risk"): Promise<AIInsight[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    let query = supabase
      .from("ai_insights")
      .select(`
        *,
        lead:leads(*)
      `)
      .eq("user_id", userUuid)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("insight_type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching insights:", error);
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }

    return data || [];
  },

  // Create a new insight
  async create(insight: InsertAIInsight, betterAuthUserId: string): Promise<AIInsight> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const insightWithUuid = {
      ...insight,
      user_id: userUuid,
    };

    const { data, error } = await supabase
      .from("ai_insights")
      .insert(insightWithUuid)
      .select()
      .single();

    if (error) {
      console.error("Error creating insight:", error);
      throw new Error(`Failed to create insight: ${error.message}`);
    }

    return data;
  },

  // Mark insight as read
  async markAsRead(insightId: string, betterAuthUserId: string): Promise<AIInsight> {
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
      .from("ai_insights")
      .update({ is_read: true })
      .eq("id", insightId)
      .eq("user_id", userUuid)
      .select()
      .single();

    if (error) {
      console.error("Error marking insight as read:", error);
      throw new Error(`Failed to update insight: ${error.message}`);
    }

    return data;
  },

  // Delete an insight
  async delete(insightId: string, betterAuthUserId: string): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Convert Better Auth ID to UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const { error } = await supabase
      .from("ai_insights")
      .delete()
      .eq("id", insightId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error deleting insight:", error);
      throw new Error(`Failed to delete insight: ${error.message}`);
    }
  },

  // Generate AI insights from dashboard data
  async generate(leads: any[], actionQueueTasks: any[], stats: any): Promise<{ text: string; highlights: Array<{ type: "hot" | "risk" | "opportunity"; text: string }> }> {
    const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";

    const response = await fetch(`${authServerUrl}/api/insights/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ leads, actionQueueTasks, stats }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to generate insights: ${response.statusText}`);
    }

    return response.json();
  },
};

