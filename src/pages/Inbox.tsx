import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Inbox as InboxIcon,
  Archive,
  FileText,
  Search,
  Mail,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  PageHeader,
  EmptyState,
  ContactAvatar,
  ConfirmAction,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useThreads, useConnections } from "@/hooks/use-workspace-data";
import { useUserId } from "@/hooks/useUserId";
import { useIsMobile } from "@/hooks/use-mobile";
import { emailsApi } from "@/lib/api";
import EmailThreadDetailPanel, {
  type ThreadWithContact,
} from "@/components/dashboard/EmailThreadDetailPanel";
import EmailComposeDialog from "@/components/dashboard/EmailComposeDialog";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  emailConnectionsApi,
  gmailHistoryCursor,
} from "@/lib/api/email-connections";
export default function Inbox() {
  const query = useThreads();
  const { data: connections = [] } = useConnections();
  const id = useUserId();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const mobile = useIsMobile();
  const [folder, setFolder] = useState<"active" | "archived">("active");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(params.get("thread"));
  const [checked, setChecked] = useState<string[]>([]);
  const [compose, setCompose] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [, setSyncVersion] = useState(0);
  const gmailConnected = params.get("gmailConnected");
  useEffect(() => {
    if (!gmailConnected || !id) return;
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("gmailConnected");
        return next;
      },
      { replace: true },
    );
    setSyncing(true);
    const notification = toast.loading(
      "Gmail connected. Importing your conversations...",
    );
    void emailConnectionsApi
      .sync(gmailConnected)
      .then(
        (result) => toast.success(result.message, { id: notification }),
        (error: Error) => toast.error(error.message, { id: notification }),
      )
      .finally(() => setSyncing(false));
  }, [gmailConnected, id, setParams]);
  const olderConnection = connections.find(
    (connection) =>
      connection.provider === "gmail" &&
      connection.is_active &&
      gmailHistoryCursor(connection.id),
  );
  async function loadOlder() {
    if (!olderConnection) return;
    setSyncing(true);
    try {
      const result = await emailConnectionsApi.sync(
        olderConnection.id,
        gmailHistoryCursor(olderConnection.id),
      );
      toast.success(result.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Import failed. Try again.",
      );
    } finally {
      setSyncing(false);
    }
  }
  const threads: ThreadWithContact[] = useMemo(
    () => query.data || [],
    [query.data],
  );
  useEffect(() => {
    setSelected(params.get("thread"));
  }, [params]);
  const { refetch } = query;
  useEffect(() => {
    const update = () => {
      void refetch();
      setSyncVersion((version) => version + 1);
    };
    window.addEventListener("emailSyncCompleted", update);
    return () => window.removeEventListener("emailSyncCompleted", update);
  }, [refetch]);
  const leadFilter = params.get("lead");
  const filtered = useMemo(
    () =>
      threads
        .filter(
          (t) =>
            (!leadFilter || t.lead_id === leadFilter) &&
            (folder === "archived"
              ? t.status === "archived"
              : t.status !== "archived") &&
            (category === "all" || t.ai_category === category) &&
            (!search ||
              `${t.subject} ${t.lead_contact_name || ""} ${t.lead_email || ""} ${t.lead_company || ""}`
                .toLowerCase()
                .includes(search.toLowerCase())),
        )
        .sort(
          (a, b) =>
            (new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()) *
            (sort === "newest" ? 1 : -1),
        ),
    [threads, folder, category, search, sort, leadFilter],
  );
  const activeThread =
    threads.find((t) => t.id === selected) ||
    (!mobile ? filtered[0] : null) ||
    null;
  function choose(thread: ThreadWithContact) {
    setSelected(thread.id);
    setParams({ thread: thread.id }, { replace: true });
  }
  function close() {
    setSelected(null);
    setParams({}, { replace: true });
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Inbox"
        description="Conversations, with the context to move them forward."
      >
        {olderConnection && (
          <Button
            size="sm"
            variant="outline"
            disabled={syncing}
            onClick={loadOlder}
          >
            {syncing ? "Importing..." : "Load older conversations"}
          </Button>
        )}
        <button
          className="icon-button"
          aria-label="Refresh conversations"
          onClick={() => query.refetch()}
        >
          <RefreshCw
            size={14}
            className={query.isFetching ? "animate-spin" : ""}
          />
        </button>
        <Button size="sm" onClick={() => setCompose(true)}>
          <Mail size={13} />
          Compose
        </Button>
      </PageHeader>
      {query.isPending ? (
        <LoadingState message="Loading inbox..." />
      ) : query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div
          className={`inbox-workspace ${mobile && selected ? "is-reading" : ""}`}
        >
          <nav className="inbox-folders" aria-label="Inbox folders">
            <span className="label-overline mb-4 block">Mailbox</span>
            {[
              {
                name: "Conversations",
                key: "active" as const,
                icon: InboxIcon,
              },
              { name: "Archived", key: "archived" as const, icon: Archive },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setFolder(item.key);
                  close();
                  setChecked([]);
                }}
                aria-pressed={folder === item.key}
              >
                <item.icon size={13} />
                {item.name}
              </button>
            ))}
            <Link to="/drafts">
              <FileText size={13} />
              Drafts
            </Link>
            <div className="inbox-folder-note">
              {connections.filter((c) => c.is_active).length} active connection
              {connections.filter((c) => c.is_active).length === 1 ? "" : "s"}
              <Link to="/settings?tab=email">
                Manage
                <ArrowSmall />
              </Link>
            </div>
          </nav>
          <section className="inbox-list-panel" aria-label="Conversations">
            <div className="inbox-list-search">
              <Search size={13} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                aria-label="Search conversations"
              />
            </div>
            <div className="inbox-mobile-folders">
              <select
                aria-label="Mailbox folder"
                value={folder}
                onChange={(e) => {
                  setFolder(e.target.value as "active" | "archived");
                  close();
                  setChecked([]);
                }}
              >
                <option value="active">Conversations</option>
                <option value="archived">Archived</option>
              </select>
              <Link to="/drafts">Drafts</Link>
            </div>
            <div className="inbox-list-controls">
              <select
                aria-label="Filter conversations"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  close();
                }}
              >
                <option value="all">All conversations</option>
                <option value="lead">Sales inquiries</option>
                <option value="follow_up_needed">Follow-ups</option>
                <option value="important">Important</option>
                <option value="promo">Promotions</option>
                <option value="newsletter">Newsletters</option>
                <option value="spam">Spam</option>
              </select>
              <select
                aria-label="Sort conversations"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
            {checked.length > 0 && (
              <div className="inbox-bulk">
                <span>{checked.length} selected</span>
                <ConfirmAction
                  title="Archive selected conversations?"
                  description="These conversations will move to your archived folder."
                  confirmLabel="Archive conversations"
                  onConfirm={async () => {
                    if (!id) return;
                    await Promise.all(
                      checked.map((t) => emailsApi.archiveThread(t, id)),
                    );
                    setChecked([]);
                    await client.invalidateQueries({ queryKey: ["threads"] });
                    toast.success("Conversations archived");
                  }}
                >
                  <button className="section-link">
                    <Archive size={12} />
                    Archive
                  </button>
                </ConfirmAction>
              </div>
            )}
            <div className="inbox-message-list">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={InboxIcon}
                  title={
                    search || category !== "all"
                      ? "No matching conversations"
                      : "An inbox with room to work."
                  }
                  description={
                    search || category !== "all"
                      ? "Try another search or classification filter."
                      : "Your synced conversations will appear here. Connect your email or sync from the top bar."
                  }
                >
                  {!connections.some((c) => c.is_active) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent("inboxiq:connect"))
                      }
                    >
                      Connect email
                    </Button>
                  )}
                </EmptyState>
              ) : (
                filtered.map((thread) => (
                  <article
                    key={thread.id}
                    className={`inbox-message ${activeThread?.id === thread.id ? "selected" : ""}`}
                  >
                    <label className="inbox-check">
                      <input
                        type="checkbox"
                        aria-label={`Select ${thread.subject}`}
                        checked={checked.includes(thread.id)}
                        onChange={(e) =>
                          setChecked((s) =>
                            e.target.checked
                              ? [...s, thread.id]
                              : s.filter((v) => v !== thread.id),
                          )
                        }
                      />
                    </label>
                    <button
                      onClick={() => choose(thread)}
                      className="inbox-message-content"
                      aria-label={`Open ${thread.subject}`}
                    >
                      <div className="flex justify-between gap-2 items-center">
                        <strong>
                          {thread.lead_contact_name ||
                            thread.lead_email?.split("@")[0] ||
                            "Conversation"}
                        </strong>
                        <time>
                          {formatDistanceToNow(new Date(thread.updated_at), {
                            addSuffix: false,
                          })}
                        </time>
                      </div>
                      <h2>
                        {thread.is_read === false && (
                          <span className="unread-dot" />
                        )}
                        {thread.subject || "Untitled conversation"}
                      </h2>
                      <p>
                        {thread.lead_company ||
                          thread.lead_email ||
                          "Open to read this conversation"}
                      </p>
                      {thread.ai_category === "lead" && (
                        <span className="inbox-classification">
                          Sales inquiry
                        </span>
                      )}
                      {thread.ai_category === "follow_up_needed" && (
                        <span className="inbox-classification">
                          Follow-up needed
                        </span>
                      )}
                    </button>
                  </article>
                ))
              )}
            </div>
            <div className="inbox-list-bottom">
              {filtered.length} conversation{filtered.length === 1 ? "" : "s"}
            </div>
          </section>
          <EmailThreadDetailPanel
            embedded
            thread={activeThread}
            onClose={close}
            onArchived={close}
          />
        </div>
      )}
      <EmailComposeDialog
        isOpen={compose}
        onClose={() => setCompose(false)}
        mode="new"
        onSent={() => query.refetch()}
      />
    </DashboardLayout>
  );
}
function ArrowSmall() {
  return <span aria-hidden="true"> ?</span>;
}
