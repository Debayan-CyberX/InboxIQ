import { useState } from "react";
import { Mail, ArrowUpRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUserId } from "@/hooks/useUserId";
import { emailConnectionsApi } from "@/lib/api";
import { errorMessage } from "@/lib/format";
export default function ConnectEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}) {
  const id = useUserId();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function connect(provider: "gmail" | "outlook") {
    if (!id) return;
    setPending(provider);
    setError("");
    try {
      const { authUrl } = await emailConnectionsApi.getOAuthUrl(
        provider,
        id,
        `${window.location.origin}/settings?tab=email&provider=${provider}`,
      );
      const url = new URL(authUrl);
      if (url.protocol !== "https:")
        throw new Error("A secure provider sign-in URL was not returned.");
      window.location.assign(url.toString());
    } catch (e) {
      setError(
        errorMessage(
          e,
          "This account could not be connected. Please try again.",
        ),
      );
      setPending(null);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) {
          onOpenChange(v);
          if (!v) setError("");
        }
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Connect your email</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            Choose your email provider. You'll review access on their sign-in
            page before returning to your workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 divide-y border-y">
          {[
            {
              id: "gmail" as const,
              name: "Google / Gmail",
              description: "Sign in with your Google account",
            },
            {
              id: "outlook" as const,
              name: "Microsoft / Outlook",
              description: "Sign in with your Microsoft account",
            },
          ].map((provider) => (
            <button
              key={provider.id}
              className="flex gap-3 items-center w-full text-left py-5 disabled:opacity-50"
              disabled={!!pending}
              onClick={() => connect(provider.id)}
            >
              <span className="avatar">
                <Mail size={15} />
              </span>
              <div className="flex-1">
                <p className="text-xs font-medium">{provider.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {pending === provider.id
                    ? "Opening secure provider sign-in..."
                    : provider.description}
                </p>
              </div>
              {pending === provider.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowUpRight size={14} className="text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive leading-relaxed">
            {error}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          You can review status, sync, or disconnect an account in settings.
          Direct IMAP connections are not currently supported by this workspace.
        </p>
      </DialogContent>
    </Dialog>
  );
}
