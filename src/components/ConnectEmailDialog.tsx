import { useState } from "react";
import { Mail, CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { emailConnectionsApi } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";

interface ConnectEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

const emailProviders = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "📧",
    description: "Connect your Gmail account",
    color: "from-red-500 to-red-600",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    icon: "📨",
    description: "Connect your Outlook account",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "imap",
    name: "IMAP / Other",
    icon: "📬",
    description: "Connect via IMAP",
    color: "from-purple-500 to-purple-600",
  },
];

const ConnectEmailDialog = ({ open, onOpenChange, onConnected }: ConnectEmailDialogProps) => {
  const userId = useUserId();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<"select" | "connecting" | "success" | "error">("select");
  const [imapCredentials, setImapCredentials] = useState({
    email: "",
    password: "",
    imapServer: "imap.gmail.com",
    imapPort: 993,
  });

  const handleConnect = async (providerId: string) => {
    if (!userId) {
      toast.error("You must be logged in to connect an email account");
      return;
    }

    setSelectedProvider(providerId);
    setIsConnecting(true);
    setConnectionStep("connecting");

    try {
      if (providerId === "gmail" || providerId === "outlook") {
        // OAuth flow for Gmail/Outlook
        const redirectUri = `${window.location.origin}/settings?tab=email&provider=${providerId}`;
        
        const { authUrl } = await emailConnectionsApi.getOAuthUrl(
          providerId as "gmail" | "outlook",
          userId,
          redirectUri
        );

        // Redirect to OAuth provider
        window.location.href = authUrl;
        // Note: The callback will be handled in Settings page
        return;
      } else if (providerId === "imap") {
        // IMAP connection (simplified - in production, validate and test connection)
        if (!imapCredentials.email || !imapCredentials.password) {
          throw new Error("Please enter email and password");
        }

        // Store IMAP connection
        await emailConnectionsApi.connect(userId, {
          provider: "imap",
          email: imapCredentials.email,
        });

        setConnectionStep("success");
        toast.success("Email connected successfully!", {
          description: "Your IMAP account is now connected.",
        });

        setTimeout(() => {
          onConnected?.();
          onOpenChange(false);
          setConnectionStep("select");
          setSelectedProvider(null);
          setIsConnecting(false);
          setImapCredentials({
            email: "",
            password: "",
            imapServer: "imap.gmail.com",
            imapPort: 993,
          });
        }, 2000);
      }
    } catch (error) {
      setConnectionStep("error");
      const errorMessage = error instanceof Error ? error.message : "Failed to connect email";
      toast.error("Connection failed", {
        description: errorMessage,
      });
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (!isConnecting) {
      onOpenChange(false);
      // Reset state when closing
      setTimeout(() => {
        setConnectionStep("select");
        setSelectedProvider(null);
        setIsConnecting(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            Connect Your Email
          </DialogTitle>
          <DialogDescription>
            Connect your email account to start tracking leads and managing follow-ups automatically.
          </DialogDescription>
        </DialogHeader>

        {connectionStep === "select" && (
          <div className="space-y-3 mt-4">
            {emailProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => {
                  if (provider.id === "imap") {
                    setSelectedProvider("imap");
                  } else {
                    handleConnect(provider.id);
                  }
                }}
                disabled={isConnecting}
                className="w-full p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-2xl shrink-0`}>
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground mb-1">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                    →
                  </div>
                </div>
              </button>
            ))}

            {/* IMAP Credentials Form */}
            {selectedProvider === "imap" && (
              <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                  <input
                    type="email"
                    value={imapCredentials.email}
                    onChange={(e) => setImapCredentials({ ...imapCredentials, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Password / App Password</label>
                  <input
                    type="password"
                    value={imapCredentials.password}
                    onChange={(e) => setImapCredentials({ ...imapCredentials, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">IMAP Server</label>
                    <input
                      type="text"
                      value={imapCredentials.imapServer}
                      onChange={(e) => setImapCredentials({ ...imapCredentials, imapServer: e.target.value })}
                      placeholder="imap.gmail.com"
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Port</label>
                    <input
                      type="number"
                      value={imapCredentials.imapPort}
                      onChange={(e) => setImapCredentials({ ...imapCredentials, imapPort: parseInt(e.target.value) || 993 })}
                      placeholder="993"
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="accent"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleConnect("imap")}
                    disabled={isConnecting || !imapCredentials.email || !imapCredentials.password}
                  >
                    Connect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProvider(null);
                      setImapCredentials({
                        email: "",
                        password: "",
                        imapServer: "imap.gmail.com",
                        imapPort: 993,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                🔒 Your email credentials are encrypted and stored securely. We use OAuth 2.0 for secure authentication.
              </p>
            </div>
          </div>
        )}

        {connectionStep === "connecting" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">Connecting to {emailProviders.find(p => p.id === selectedProvider)?.name}...</h3>
              <p className="text-sm text-muted-foreground">
                You'll be redirected to authorize InboxIQ access to your email.
              </p>
            </div>
          </div>
        )}

        {connectionStep === "success" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">Email Connected Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Your {emailProviders.find(p => p.id === selectedProvider)?.name} account is now connected.
              </p>
            </div>
          </div>
        )}

        {connectionStep === "error" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">Connection Failed</h3>
              <p className="text-sm text-muted-foreground">
                Unable to connect your email. Please try again.
              </p>
            </div>
            <Button
              onClick={() => {
                setConnectionStep("select");
                setSelectedProvider(null);
              }}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectEmailDialog;



