import { getApiBase } from "./base-url";
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
export interface EmailSyncResult {
  success: boolean;
  message: string;
  threadsSynced?: number;
  emailsSynced?: number;
  nextPageToken?: string | null;
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response
    .json()
    .catch(() => ({ error: "Email service returned an invalid response." }));
  if (!response.ok)
    throw new Error(result.message || result.error || "Email request failed.");
  return result as T;
}
const syncing = new Map<string, Promise<EmailSyncResult>>();
const cursors = new Map<string, string>();
export function gmailHistoryCursor(connectionId: string) {
  return cursors.get(connectionId);
}
export const emailConnectionsApi = {
  async getAll(_betterAuthUserId: string): Promise<EmailConnection[]> {
    return (
      await request<{ connections: EmailConnection[] }>(
        "/api/email-connections",
      )
    ).connections;
  },
  async getOAuthUrl(
    provider: "gmail" | "outlook",
    userId: string,
    redirectUri?: string,
  ): Promise<{ authUrl: string }> {
    const params = new URLSearchParams({
      userId,
      ...(redirectUri ? { redirectUri } : {}),
    });
    return request(`/api/email-connections/oauth/${provider}?${params}`);
  },
  async connect(
    _id: string,
    _connection: ConnectEmailRequest,
  ): Promise<EmailConnection> {
    throw new Error(
      "Connect your account through your provider's secure sign-in flow.",
    );
  },
  async disconnect(connectionId: string, _id: string): Promise<void> {
    await request(
      `/api/email-connections/${encodeURIComponent(connectionId)}`,
      { method: "PATCH", body: JSON.stringify({ is_active: false }) },
    );
  },
  async delete(connectionId: string, _id: string): Promise<void> {
    await request(
      `/api/email-connections/${encodeURIComponent(connectionId)}`,
      { method: "DELETE" },
    );
  },
  sync(
    connectionId: string,
    pageToken?: string,
    maxPages = 4,
  ): Promise<EmailSyncResult> {
    const running = syncing.get(connectionId);
    if (running) return running;
    const work = (async () => {
      let next = pageToken;
      let threadsSynced = 0,
        emailsSynced = 0;
      for (let page = 0; page < Math.max(1, Math.min(maxPages, 4)); page++) {
        const result = await request<EmailSyncResult>(
          `/api/email-connections/${encodeURIComponent(connectionId)}/sync`,
          {
            method: "POST",
            body: JSON.stringify({
              connectionId,
              ...(next ? { pageToken: next } : {}),
            }),
          },
        );
        threadsSynced += result.threadsSynced || 0;
        emailsSynced += result.emailsSynced || 0;
        next = result.nextPageToken || undefined;
        if (pageToken || maxPages > 1) {
          if (next) cursors.set(connectionId, next);
          else cursors.delete(connectionId);
        }
        if (!next) break;
      }
      return {
        success: true,
        threadsSynced,
        emailsSynced,
        nextPageToken: next || null,
        message: `Synced ${threadsSynced} conversations and imported ${emailsSynced} new messages.`,
      };
    })().finally(() => {
      syncing.delete(connectionId);
      window.dispatchEvent(new CustomEvent("emailSyncCompleted"));
    });
    syncing.set(connectionId, work);
    return work;
  },
};
