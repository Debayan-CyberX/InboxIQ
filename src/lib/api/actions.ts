// API service for Actions
import { supabase } from "@/lib/supabase";
import type { Action, InsertAction, UpdateAction } from "@/types/database";

export const actionsApi = {
  // Get all actions for the current user
  async getAll(betterAuthUserId: string, status?: "pending" | "in_progress" | "completed" | "cancelled"): Promise<Action[]> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Use database function that accepts Better Auth TEXT ID
    const { data, error } = await supabase.rpc("get_user_actions", {
      p_better_auth_id: betterAuthUserId,
      p_status: status || "pending",
    });

    if (error) {
      console.error("Error fetching actions:", error);
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }

    return data || [];
  },

  // Get a single action by ID
  async getById(actionId: string, betterAuthUserId: string): Promise<Action | null> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      return null;
    }

    const { data, error } = await supabase
      .from("actions")
      .select(`
        *,
        lead:leads(*),
        email_draft:emails!email_draft_id(*)
      `)
      .eq("id", actionId)
      .eq("user_id", userUuid)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("Error fetching action:", error);
      throw new Error(`Failed to fetch action: ${error.message}`);
    }

    return data;
  },

  // Create a new action
  async create(action: InsertAction, betterAuthUserId: string): Promise<Action> {
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    // Get user UUID
    const { getUserIdFromBetterAuth } = await import("./utils");
    const userUuid = await getUserIdFromBetterAuth(betterAuthUserId);
    
    if (!userUuid) {
      throw new Error("User not found in database");
    }

    const actionWithUuid = {
      ...action,
      user_id: userUuid,
    };

    const { data, error } = await supabase
      .from("actions")
      .insert(actionWithUuid)
      .select()
      .single();

    if (error) {
      console.error("Error creating action:", error);
      throw new Error(`Failed to create action: ${error.message}`);
    }

    return data;
  },

  // Update an action
  async update(actionId: string, betterAuthUserId: string, updates: UpdateAction): Promise<Action> {
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
      .from("actions")
      .update(updates)
      .eq("id", actionId)
      .eq("user_id", userUuid)
      .select()
      .single();

    if (error) {
      console.error("Error updating action:", error);
      throw new Error(`Failed to update action: ${error.message}`);
    }

    return data;
  },

  // Complete an action
  async complete(actionId: string, betterAuthUserId: string): Promise<Action> {
    return this.update(actionId, betterAuthUserId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  },

  // Cancel an action
  async cancel(actionId: string, betterAuthUserId: string): Promise<Action> {
    return this.update(actionId, betterAuthUserId, {
      status: "cancelled",
    });
  },

  // Delete an action
  async delete(actionId: string, betterAuthUserId: string): Promise<void> {
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
      .from("actions")
      .delete()
      .eq("id", actionId)
      .eq("user_id", userUuid);

    if (error) {
      console.error("Error deleting action:", error);
      throw new Error(`Failed to delete action: ${error.message}`);
    }
  },
};

