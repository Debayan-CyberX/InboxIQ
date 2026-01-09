import { useState, useEffect } from "react";
import { Bell, Search, Calendar, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConnectEmailDialog from "@/components/ConnectEmailDialog";
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
      <header className="h-16 border-b border-border/50 bg-card/60 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-30 glass-subtle">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {getGreeting()},{" "}
              <span className="text-gradient">{userName}</span>
            </h1>

            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {today}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads, emails..."
              className="w-64 h-9 pl-9 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-hot" />
          </Button>

          {/* Connect Email CTA */}
          {isEmailConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setIsConnectDialogOpen(true)}
              title={connectedEmail ? `Connected: ${connectedEmail}` : "Email connected"}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="hidden sm:inline">
                {connectedEmail ? connectedEmail.split("@")[0] : "Connected"}
              </span>
            </Button>
          ) : (
            <Button
              variant="accent"
              size="sm"
              className="gap-2"
              onClick={() => setIsConnectDialogOpen(true)}
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Connect Email</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </header>

      <ConnectEmailDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        onConnected={handleEmailConnected}
      />
    </>
  );
};

export default Header;
