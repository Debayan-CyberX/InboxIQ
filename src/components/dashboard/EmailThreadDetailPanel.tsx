import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  Reply,
  Forward,
  Mail,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactAvatar, EmptyState } from "@/components/WorkspaceUI";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { emailsApi } from "@/lib/api";
import type { Email, EmailThread } from "@/types/database";
import EmailComposeDialog from "./EmailComposeDialog";
import { emailText, errorMessage } from "@/lib/format";
import { toast } from "sonner";
export type ThreadWithContact = EmailThread & {
  lead_company?: string;
  lead_contact_name?: string;
  lead_email?: string;
  is_read?: boolean;
};
export default function EmailThreadDetailPanel({
  isOpen = true,
  onClose,
  thread,
  embedded = false,
  onArchived,
}: {
  isOpen?: boolean;
  onClose: () => void;
  thread: ThreadWithContact | null;
  embedded?: boolean;
  onArchived?: () => void;
}) {
  const id = useUserId();
  const client = useQueryClient();
  const [compose, setCompose] = useState<{
    mode: "reply" | "forward";
    email: Email;
  } | null>(null);
  const [archiving, setArchiving] = useState(false);
  const query = useQuery({
    queryKey: ["thread", id, thread?.id],
    queryFn: () => emailsApi.getThreadEmails(thread!.id, id!),
    enabled: !!(thread && id && isOpen),
  });
  const emails = [...(query.data || [])].sort(
    (a, b) =>
      new Date(a.received_at || a.sent_at || a.created_at).getTime() -
      new Date(b.received_at || b.sent_at || b.created_at).getTime(),
  );
  if (!isOpen) return null;
  const latest = emails[emails.length - 1];
  return (
    <section
      className={embedded ? "thread-reader" : "thread-reader standalone-reader"}
      aria-label="Conversation reading pane"
    >
      {!thread ? (
        <EmptyState
          icon={Mail}
          title="Choose a conversation"
          description="Read the message, see its context, and decide what happens next."
        />
      ) : (
        <>
          <div className="reader-tools">
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Back to conversations"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-[10px] text-muted-foreground flex-1 truncate">
              {thread.status === "archived"
                ? "Archived conversation"
                : "Conversation"}
            </span>
            {thread.status !== "archived" && (
              <button
                className="icon-button"
                disabled={archiving}
                aria-label="Archive conversation"
                onClick={async () => {
                  if (!id) return;
                  setArchiving(true);
                  try {
                    await emailsApi.archiveThread(thread.id, id);
                    await client.invalidateQueries({ queryKey: ["threads"] });
                    toast.success("Conversation archived");
                    onArchived?.();
                  } catch (e) {
                    toast.error(errorMessage(e));
                  } finally {
                    setArchiving(false);
                  }
                }}
              >
                <Archive size={14} />
              </button>
            )}
          </div>
          <div className="reader-scroll">
            <h2 className="reader-subject">
              {thread.subject || "Untitled conversation"}
            </h2>
            {thread.lead_email && (
              <details className="reader-contact">
                <summary>
                  <ContactAvatar
                    name={thread.lead_contact_name || thread.lead_email}
                  />
                  <span>
                    {thread.lead_contact_name || thread.lead_email}
                    <small>{thread.lead_company || thread.lead_email}</small>
                  </span>
                  <ChevronDown size={12} />
                </summary>
                <div>
                  <p>{thread.lead_email}</p>
                  {thread.lead_id && (
                    <Link
                      className="section-link mt-2"
                      to={`/leads?lead=${thread.lead_id}`}
                    >
                      View lead context
                      <ArrowUpRight size={11} />
                    </Link>
                  )}
                </div>
              </details>
            )}
            {thread.ai_reason && (
              <div className="reader-intelligence">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Conversation context
                </span>
                <p>{thread.ai_reason}</p>
              </div>
            )}
            {query.isPending ? (
              <LoadingState message="Loading conversation..." />
            ) : query.error ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            ) : emails.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10">
                No synced messages were found in this thread.
              </p>
            ) : (
              emails.map((email, i) => (
                <article key={email.id} className="reader-email">
                  <div className="reader-email-header">
                    <ContactAvatar
                      name={
                        email.direction === "outbound"
                          ? "You"
                          : thread.lead_contact_name || email.from_email
                      }
                    />
                    <div>
                      <strong>
                        {email.direction === "outbound"
                          ? "You"
                          : thread.lead_contact_name || email.from_email}
                      </strong>
                      <small>To: {email.to_email}</small>
                    </div>
                    <time
                      dateTime={
                        email.received_at || email.sent_at || email.created_at
                      }
                    >
                      {new Date(
                        email.received_at || email.sent_at || email.created_at,
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="reader-email-body">
                    {emailText(email.body_text, email.body_html)}
                  </p>
                  <div className="flex gap-4 mt-5">
                    <button
                      className="section-link"
                      onClick={() => setCompose({ mode: "reply", email })}
                    >
                      <Reply size={12} />
                      Reply
                    </button>
                    <button
                      className="section-link"
                      onClick={() => setCompose({ mode: "forward", email })}
                    >
                      <Forward size={12} />
                      Forward
                    </button>
                    {i === emails.length - 1 && email.ai_confidence != null && (
                      <span className="text-[9px] text-muted-foreground ml-auto">
                        Classification confidence{" "}
                        {Math.round(email.ai_confidence * 100)}%
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
          {latest && (
            <div className="reader-footer">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompose({ mode: "reply", email: latest })}
              >
                <Reply size={13} />
                Reply to conversation
              </Button>
              <span className="text-[9px] text-muted-foreground">
                Review before sending
              </span>
            </div>
          )}
          <EmailComposeDialog
            isOpen={!!compose}
            onClose={() => setCompose(null)}
            mode={compose?.mode || "reply"}
            originalEmail={compose?.email}
            threadId={thread.id}
            onSent={() => query.refetch()}
          />
        </>
      )}
    </section>
  );
}
