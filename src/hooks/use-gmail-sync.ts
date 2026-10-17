import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConnections } from "./use-workspace-data";
import { emailConnectionsApi } from "@/lib/api/email-connections";

// Free-plan polling runs only while the workspace is open and visible.
export function useGmailSync() {
  const { data: connections = [] } = useConnections();
  const client = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ["threads"] });
      void client.invalidateQueries({ queryKey: ["connections"] });
    };
    window.addEventListener("emailSyncCompleted", refresh);
    return () => window.removeEventListener("emailSyncCompleted", refresh);
  }, [client]);
  useEffect(() => {
    let running = false;
    const poll = async () => {
      if (
        running ||
        document.hidden ||
        new URLSearchParams(location.search).has("gmailConnected")
      )
        return;
      running = true;
      try {
        for (const connection of connections) {
          if (
            connection.provider !== "gmail" ||
            !connection.is_active ||
            !connection.sync_enabled ||
            connection.error_message
          )
            continue;
          if (
            connection.last_sync_at &&
            Date.now() - new Date(connection.last_sync_at).getTime() < 180000
          )
            continue;
          try {
            await emailConnectionsApi.sync(connection.id, undefined, 1);
          } catch {
            /* The server records the error on the connection for Settings. */
          }
        }
      } finally {
        running = false;
      }
    };
    const timer = window.setInterval(() => {
      void poll();
    }, 180000);
    return () => window.clearInterval(timer);
  }, [connections]);
}
