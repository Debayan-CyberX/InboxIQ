// Central API exports
export { leadsApi } from "./leads";
export { emailsApi } from "./emails";
export { actionsApi } from "./actions";
export { insightsApi } from "./insights";
export { analyticsApi } from "./analytics";
export { settingsApi } from "./settings";
export { emailConnectionsApi } from "./email-connections";
export { actionQueueApi } from "./action-queue";

// Helper function to get current user ID from session
export async function getCurrentUserId(): Promise<string | null> {
  // This will be implemented using Better Auth session
  // For now, we'll need to get it from the auth client
  try {
    const { useSession } = await import("@/lib/auth-client");
    // Note: This is a hook, so we'll need to handle this differently
    // We'll create a utility that gets the user ID from the session
    return null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}



