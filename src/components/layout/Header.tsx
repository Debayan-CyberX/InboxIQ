import { useState, useEffect, ReactNode } from "react";
import { Search, Calendar, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConnectEmailDialog from "@/components/ConnectEmailDialog";
import SearchDialog from "@/components/dashboard/SearchDialog";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import { emailConnectionsApi } from "@/lib/api";
import type { EmailConnection } from "@/lib/api/email-connections";
import { useUserId } from "@/hooks/useUserId";
import { toast } from "sonner";

/* ---------------- helpers ---------------- */

const getFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

/* ---------------- component ---------------- */

const Header = ({ mobileNavigation }: { mobileNavigation?: ReactNode }) => {
  const userId = useUserId();

  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [emailConnections, setEmailConnections] = useState<EmailConnection[]>(
    [],
  );
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const today = getFormattedDate();

  // Load email connections
  useEffect(() => {
    if (!userId) return;

    async function loadConnections() {
      try {
        setIsLoadingConnections(true);
        const connections = await emailConnectionsApi.getAll(userId);
        setEmailConnections(connections.filter((c) => c.is_active));
      } catch (err) {
        console.error("Error loading email connections:", err);
      } finally {
        setIsLoadingConnections(false);
      }
    }

    loadConnections();
  }, [userId]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEmailConnected = () => {
    if (!userId) return;

    emailConnectionsApi
      .getAll(userId)
      .then((connections) => {
        setEmailConnections(connections.filter((c) => c.is_active));
        toast.success("Email connected successfully!");
      })
      .catch((err) => {
        console.error("Error reloading connections:", err);
      });
  };

  const handleSyncEmails = async () => {
    if (!userId || !isEmailConnected || emailConnections.length === 0) return;

    try {
      setIsSyncing(true);
      const connectionId = emailConnections[0].id;
      const result = await emailConnectionsApi.sync(connectionId);

      toast.success("Email sync completed", {
        description: result.threadsSynced
          ? `Synced ${result.threadsSynced} email threads`
          : result.message || "Your emails have been synced.",
      });

      // Reload connections to show updated last_sync_at
      const connections = await emailConnectionsApi.getAll(userId);
      setEmailConnections(connections.filter((c) => c.is_active));

      // Trigger inbox data refetch by dispatching a custom event
      window.dispatchEvent(
        new CustomEvent("emailSyncCompleted", {
          detail: { threadsSynced: result.threadsSynced },
        }),
      );
    } catch (err) {
      console.error("Error syncing emails:", err);
      toast.error("Failed to sync emails", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const isEmailConnected = emailConnections.length > 0;
  const connectedEmail = emailConnections[0]?.email || null;

  return (
    <>
      <header className="iq-topbar">
        {mobileNavigation}
        <button
          className="iq-search-trigger"
          onClick={() => setIsSearchDialogOpen(true)}
          aria-label="Search your workspace"
        >
          <Search size={15} />
          <span>Search anything in your workspace...</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden xl:flex items-center gap-2 text-[10px] text-muted-foreground">
            <Calendar size={12} />
            {today}
          </span>
          {userId && <NotificationsPanel />}
          {isEmailConnected && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSyncEmails}
              disabled={isSyncing}
              aria-label="Sync emails"
            >
              <RefreshCw className={isSyncing ? "animate-spin" : ""} />
            </Button>
          )}
          <Button
            variant={isEmailConnected ? "outline" : "default"}
            size="sm"
            className="gap-2 text-[11px] h-8"
            onClick={() => setIsConnectDialogOpen(true)}
          >
            {isEmailConnected ? <CheckCircle2 size={13} /> : <Mail size={13} />}
            <span className="hidden sm:inline">
              {isEmailConnected ? "Email connected" : "Connect email"}
            </span>
            <span className="sm:hidden">
              {isEmailConnected ? "Connected" : "Connect"}
            </span>
          </Button>
        </div>
      </header>

      <ConnectEmailDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        onConnected={handleEmailConnected}
      />

      {userId && (
        <SearchDialog
          open={isSearchDialogOpen}
          onOpenChange={setIsSearchDialogOpen}
          userId={userId}
        />
      )}
    </>
  );
};

export default Header;
