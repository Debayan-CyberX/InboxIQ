import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";
import { useUserId } from "@/hooks/useUserId";
import { useConnections } from "@/hooks/use-workspace-data";
import { intelligenceApi } from "@/lib/api/intelligence";
export default function IntelligenceStatus() {
  const id = useUserId(),
    client = useQueryClient(),
    { data: connections = [] } = useConnections();
  const connected = connections.some((connection) => connection.is_active);
  const [busy, setBusy] = useState(false),
    [pending, setPending] = useState(0),
    [error, setError] = useState(""),
    [waiting, setWaiting] = useState(false),
    [mode, setMode] = useState("ai");
  const run = useCallback(async () => {
    if (!id || document.hidden) return;
    setBusy(true);
    setError("");
    setWaiting(false);
    try {
      const status = await intelligenceApi.status();
      setPending(status.pending);
      setMode(status.mode);
      if (status.pending) {
        const result = await intelligenceApi.analyzeAll(id);
        setPending(result.pending);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Conversation analysis could not finish.",
      );
    } finally {
      setBusy(false);
    }
  }, [id]);
  useEffect(() => {
    if (!connected) return;
    const update = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.userId !== id) return;
      if (typeof detail.pending === "number") setPending(detail.pending);
      setWaiting(!!detail.waiting);
      setMode(detail.mode);
      if (detail.waiting) return;
      for (const key of ["leads", "threads", "queue", "drafts"])
        void client.invalidateQueries({ queryKey: [key, id] });
    };
    const sync = () => {
      void run();
    };
    window.addEventListener("inboxiq:intelligence", update);
    window.addEventListener("emailSyncCompleted", sync);
    void run();
    const timer = window.setInterval(sync, 60000);
    return () => {
      window.removeEventListener("inboxiq:intelligence", update);
      window.removeEventListener("emailSyncCompleted", sync);
      window.clearInterval(timer);
    };
  }, [id, connected, run, client]);
  if (!connected) return null;
  return (
    <div
      className="flex items-center gap-3 border-b pb-3 mb-5 text-xs"
      role="status"
      aria-live="polite"
    >
      {busy ? (
        <RefreshCw size={13} className="animate-spin shrink-0" />
      ) : (
        <Sparkles size={13} className="shrink-0" />
      )}
      <span className={error ? "text-destructive" : "text-muted-foreground"}>
        {error ||
          (waiting && busy
            ? "AI requests are paused briefly at the free-tier limit. Your review will continue automatically."
            : busy
              ? `Reviewing your conversations${pending ? ` · ${pending} remaining` : ""}`
              : mode === "ai"
                ? "Opportunity analysis is up to date. Review leads and next steps below."
                : "Rule-based opportunity review is up to date. AI drafts are unavailable.")}
      </span>
      {!busy && (
        <button
          className="ml-auto underline underline-offset-4 shrink-0"
          onClick={() => {
            void run();
          }}
        >
          {error ? "Retry analysis" : "Review new messages"}
        </button>
      )}
    </div>
  );
}
