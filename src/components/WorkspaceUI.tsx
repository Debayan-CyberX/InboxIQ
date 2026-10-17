import { useState, type ReactNode, type ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <span className="page-kicker">
          {{
            Overview: "YOUR DAY, IN FOCUS",
            Inbox: "CONVERSATIONS",
            Leads: "RELATIONSHIPS",
            Drafts: "REVIEW & RESPOND",
            Analytics: "WORKSPACE INTELLIGENCE",
            Settings: "YOUR WORKSPACE",
          }[title] || "INBOXIQ"}
        </span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 120 82" fill="none">
          <path d="M17 29h86v43H17z" stroke="currentColor" opacity=".16" />
          <path
            d="M24 21h72v43H24z"
            fill="hsl(var(--card))"
            stroke="currentColor"
            opacity=".35"
          />
          <path
            d="M32 13h56v43H32z"
            fill="hsl(var(--card))"
            stroke="currentColor"
            opacity=".65"
          />
          <path
            d="m32 14 28 22 28-22M40 44h20"
            stroke="currentColor"
            opacity=".5"
          />
        </svg>
        <span>
          <Icon size={14} />
        </span>
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function ContactAvatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name
        .split(/\s+/)
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?"}
    </span>
  );
}
export function StatusLabel({ status }: { status: "hot" | "warm" | "cold" }) {
  return (
    <span className={`status-label ${status}`}>
      {status === "hot"
        ? "Qualified"
        : status === "warm"
          ? "In conversation"
          : "New"}
    </span>
  );
}
export function ConfirmAction({
  title,
  description,
  onConfirm,
  children,
  confirmLabel = "Confirm",
  destructive = false,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  children: ReactElement;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) {
          setOpen(v);
          setError("");
        }
      }}
    >
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await onConfirm();
                setOpen(false);
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "That action could not be completed. Try again.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Working..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
