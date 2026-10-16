// API service for Action Queue
// Generates smart tasks based on leads and emails

export interface ActionQueueTask {
  id: string;
  type: "followup" | "review" | "send";
  title: string;
  description: string;
  leadId?: string;
  emailId?: string;
  priority: "high" | "medium" | "low";
}

interface ActionQueueResponse {
  tasks: ActionQueueTask[];
}

export const actionQueueApi = {
  // Get action queue tasks for the current user
  async getTasks(betterAuthUserId: string): Promise<ActionQueueTask[]> {
    const { getApiBase } = await import("./base-url");
    const authServerUrl = getApiBase();

    // Fetch tasks from backend API
    const response = await fetch(`${authServerUrl}/api/action-queue`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for auth
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.message || errorData.error || `Failed to fetch action queue: ${response.statusText}`);
    }

    const data: ActionQueueResponse = await response.json();
    return data.tasks || [];
  },
};
