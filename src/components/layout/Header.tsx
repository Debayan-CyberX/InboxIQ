import { useState, useEffect } from "react";
import { Search, Calendar, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConnectEmailDialog from "@/components/ConnectEmailDialog";
import SearchDialog from "@/components/dashboard/SearchDialog";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import { emailConnectionsApi, type EmailConnection } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

/* ---------------- helpers ---------------- */

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
};

const getFormattedDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

/* ---------------- component ---------------- */

const Header = () => {
  const userId = useUserId();
  const { data: session } = useSession();

  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [emailConnections, setEmailConnections] = useState<EmailConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  const today = getFormattedDate();

  const userName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "there";

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

  const isEmailConnected = emailConnections.length > 0;
  const connectedEmail = emailConnections[0]?.email || null;

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-[rgba(255,255,255,0.12)] glass-strong flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-30 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 max-w-full overflow-hidden">
          <div className="min-w-0 flex-shrink">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
              {getGreeting()},{" "}
              <span className="text-gradient">{userName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-1.5 min-w-0">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">{today}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0 min-w-0">
          {/* Search */}
          <div className="relative hidden md:block flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads, emails..."
              className="w-40 lg:w-56 xl:w-64 h-8 sm:h-9 pl-9 pr-4 rounded-lg bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:bg-[rgba(255,255,255,0.08)] transition-all max-w-full cursor-pointer"
              onClick={() => setIsSearchDialogOpen(true)}
              onFocus={() => setIsSearchDialogOpen(true)}
              readOnly
            />
          </div>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
            onClick={() => setIsSearchDialogOpen(true)}
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          {/* Notifications */}
          {userId && <NotificationsPanel />}

          {/* Connect Email CTA */}
          {isEmailConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
              onClick={() => setIsConnectDialogOpen(true)}
              title={connectedEmail ? `Connected: ${connectedEmail}` : "Email connected"}
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
              <span className="hidden lg:inline truncate">
                {connectedEmail ? connectedEmail.split("@")[0] : "Connected"}
              </span>
            </Button>
          ) : (
            <Button
              variant="accent"
              size="sm"
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
              onClick={() => setIsConnectDialogOpen(true)}
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Connect Email</span>
              <span className="lg:hidden">Connect</span>
            </Button>
          )}
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
