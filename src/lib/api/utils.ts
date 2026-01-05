// Utility functions for API services
import { supabase } from "@/lib/supabase";

/**
 * Convert Better Auth user ID (TEXT) to Supabase users table UUID
 * This is needed because Better Auth uses TEXT IDs but our database uses UUIDs
 */
export async function getUserIdFromBetterAuth(betterAuthUserId: string): Promise<string | null> {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  const { data, error } = await supabase.rpc("get_user_uuid_from_better_auth_id", {
    p_better_auth_id: betterAuthUserId,
  });

  if (error) {
    console.error("Error getting user UUID:", error);
    return null;
  }

  return data as unknown as string | null;
}








