import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  Check,
  Inbox,
  FileText,
  Users,
  Clock,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  PageHeader,
  ContactAvatar,
  StatusLabel,
} from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import {
  useLeads,
  useConnections,
  useQueue,
  useInsights,
  useThreads,
  useDrafts,
} from "@/hooks/use-workspace-data";
import { formatDistanceToNow } from "date-fns";
import OpportunityDesk from "@/components/workspace/OpportunityDesk";
export default function Overview() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get("emailConnected")) {
      setParams({}, { replace: true });
      window.dispatchEvent(new CustomEvent("emailSyncCompleted"));
    }
  }, [params, setParams]);
  const leadsQuery = useLeads();
  const connectionsQuery = useConnections();
  const queue = useQueue();
  const insight = useInsights();
  const threadsQuery = useThreads();
  const draftsQuery = useDrafts();
  const leads = leadsQuery.data || [];
  const connections = (connectionsQuery.data || []).filter((c) => c.is_active);
  const tasks = queue.data || [];
  const threads = threadsQuery.data || [];
  const connect = () =>
    window.dispatchEvent(new CustomEvent("inboxiq:connect"));
  const due = tasks.filter((task) => task.type === "followup");
  const risk = leads.filter((l) => l.days_since_contact >= 5);
  const drafts = draftsQuery.data || [];
  const recent = [...threads]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 4);
  const needsOnboarding = connections.length === 0 && threads.length === 0;
  return (
    <DashboardLayout>
      <PageHeader
        title="Overview"
        description="The conversations and decisions that need your attention."
      >
        <span className="text-[11px] text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </PageHeader>
      {leadsQuery.isPending || connectionsQuery.isPending ? (
        <LoadingState />
      ) : leadsQuery.error ? (
        <ErrorState
          error={leadsQuery.error}
          onRetry={() => leadsQuery.refetch()}
        />
      ) : connectionsQuery.error ? (
        <ErrorState
          title="Connection status unavailable"
          error={connectionsQuery.error}
          onRetry={() => connectionsQuery.refetch()}
        />
      ) : needsOnboarding ? (
        <>
          <section className="onboarding">
            <div>
              <div className="label-overline mb-5">YOUR WORKSPACE IS READY</div>
              <h2>
                {connections.length
                  ? "Bring your conversations into focus."
                  : "Good work starts with a conversation."}
              </h2>
              <p>
                {connections.length
                  ? "Your email is connected. Sync your conversations, identify promising inquiries, and keep the next step close at hand."
                  : "Connect your email to see your conversations, organize your leads, and review follow-ups from one place."}
              </p>
              {connections.length ? (
                <Button asChild>
                  <Link to="/inbox">
                    Open inbox
                    <ArrowRight size={13} />
                  </Link>
                </Button>
              ) : (
                <Button onClick={connect}>
                  <Mail size={13} />
                  Connect your email
                </Button>
              )}
              <p className="!text-[11px] !mt-4">
                You're in control of every connection and every send.
              </p>
            </div>
            <div>
              {[
                {
                  title: "Connect your email",
                  text: connections.length
                    ? `${connections.length} active email connection${connections.length === 1 ? "" : "s"}. Ready for your first sync.`
                    : "Bring your email into your workspace through a supported provider.",
                  done: connections.length > 0,
                  action: connections.length
                    ? "Manage connections"
                    : "Connect account",
                  to: connections.length ? "/settings?tab=email" : undefined,
                },
                {
                  title: "Find the conversations worth continuing",
                  text: "Read with context, then identify leads from your synced conversations.",
                  action: "Explore your inbox",
                  to: "/inbox",
                  done: false,
                },
                {
                  title: "Review your next move",
                  text: "Build a follow-up from a lead. Edit the draft, then decide when to send.",
                  action: "See your pipeline",
                  to: "/leads",
                  done: false,
                },
              ].map((s, i) => (
                <div className="setup-step" key={s.title}>
                  <span className="step-number">
                    {s.done ? (
                      <Check size={14} className="text-primary" />
                    ) : (
                      `0${i + 1}`
                    )}
                  </span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                    {s.to ? (
                      <Link to={s.to}>
                        {s.action}
                        <ArrowUpRight className="inline ml-1" size={11} />
                      </Link>
                    ) : (
                      <button onClick={connect}>
                        {s.action}
                        <ArrowUpRight className="inline ml-1" size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="flex flex-wrap gap-6 mt-7 text-[12px] text-muted-foreground">
            <Link
              to="/settings?tab=appearance"
              className="hover:text-foreground"
            >
              Make the workspace yours
              <ArrowUpRight size={11} className="inline ml-2" />
            </Link>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("inboxiq:assistant"))
              }
              className="hover:text-foreground"
            >
              Ask about your workflow
              <ArrowUpRight size={11} className="inline ml-2" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="metric-strip overview-metrics">
            {[
              {
                label: "Follow-ups due",
                value: due.length,
                to: "/leads?filter=due",
                foot: "No contact in 3+ days",
              },
              {
                label: "Drafts awaiting review",
                value: drafts.length,
                to: "/drafts",
                foot: "A decision, not an auto-send",
              },
              {
                label: "Priority conversations",
                value: tasks.filter((t) => t.priority === "high").length,
                to: "/inbox",
                foot: "Ready for a closer look",
              },
              {
                label: "At-risk relationships",
                value: risk.length,
                to: "/leads?filter=risk",
                foot: "No contact in 5+ days",
              },
            ].map((m) => (
              <Link
                key={m.label}
                to={m.to}
                className="group"
                data-has-work={m.value > 0}
              >
                <div className="metric-label">
                  {m.label}
                  <ArrowUpRight
                    size={12}
                    className="opacity-0 group-hover:opacity-100"
                  />
                </div>
                <p className="metric-value">{m.value}</p>
                <p className="metric-foot">{m.foot}</p>
              </Link>
            ))}
          </div>
          <OpportunityDesk
            leads={leads}
            threads={threads}
            drafts={drafts}
            tasks={tasks}
          />
          <div className="overview-columns">
            <div>
              <section
                className="overview-next"
                data-has-work={tasks.length > 0}
                aria-label="Next steps"
              >
                <div className="section-heading">
                  <div>
                    <h2>Up next</h2>
                    <p>Prioritized work, connected to your conversations.</p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Refresh next steps"
                    onClick={() => queue.refetch()}
                  >
                    <RefreshCw
                      size={12}
                      className={queue.isFetching ? "animate-spin" : ""}
                    />
                  </button>
                </div>
                {queue.isPending ? (
                  <LoadingState message="Loading your next steps..." />
                ) : queue.error ? (
                  <p className="text-xs text-muted-foreground py-5">
                    Next steps couldn't load.{" "}
                    <button
                      className="text-primary"
                      onClick={() => queue.refetch()}
                    >
                      Try again
                    </button>
                  </p>
                ) : tasks.length ? (
                  <ul className="work-list">
                    {tasks.slice(0, 7).map((task) => (
                      <li key={task.id}>
                        <span className="avatar mt-0.5">
                          {task.type === "followup" ? (
                            <Clock size={13} />
                          ) : (
                            <FileText size={13} />
                          )}
                        </span>
                        <div className="flex-1">
                          <h3>{task.title}</h3>
                          <p>{task.description}</p>
                          <Link
                            to={
                              task.emailId
                                ? `/drafts?draft=${task.emailId}`
                                : task.leadId
                                  ? `/leads?lead=${task.leadId}`
                                  : task.threadId
                                    ? `/inbox?thread=${task.threadId}`
                                    : "/inbox"
                            }
                            className="section-link mt-2"
                          >
                            {task.type === "followup"
                              ? "Review lead"
                              : "Review draft"}
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                        <span className="text-[11px] text-muted-foreground capitalize mt-1">
                          {task.priority}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="queue-clear">
                    <span className="queue-clear-icon" aria-hidden="true">
                      <Check size={16} />
                    </span>
                    <div>
                      <p className="text-sm">
                        Nothing waiting on you right now.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Review your pipeline or pick up a conversation in the
                        inbox.
                      </p>
                    </div>
                    <Link
                      to="/inbox"
                      className="section-link queue-clear-action"
                    >
                      Open inbox
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </section>
              {recent.length > 0 && (
                <section className="overview-recent mt-10">
                  <div className="section-heading">
                    <h2>Recent conversations</h2>
                    <Link to="/inbox" className="section-link">
                      View inbox
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                  <ul className="work-list">
                    {recent.map((thread) => (
                      <li key={thread.id}>
                        <span className="mt-1 text-muted-foreground">
                          <Inbox size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/inbox?thread=${thread.id}`}
                            className="text-xs truncate block"
                          >
                            {thread.subject || "Untitled conversation"}
                          </Link>
                          <p>
                            Updated{" "}
                            {formatDistanceToNow(new Date(thread.updated_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <ArrowUpRight
                          size={12}
                          className="text-muted-foreground mt-1"
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <aside>
              <div className="briefing">
                <h2>Today's context</h2>
                <p>
                  {insight.data?.[0]?.insight_text ||
                    `${due.length} relationship${due.length === 1 ? " needs" : "s need"} a follow-up. ${drafts.length} draft${drafts.length === 1 ? " is" : "s are"} ready to review.${risk.length ? ` Start with the ${risk.length} contact${risk.length === 1 ? "" : "s"} you haven't reached in five days.` : " Your pipeline is up to date."}`}
                </p>
              </div>
              <section className="mt-9">
                <div className="section-heading">
                  <h2>Pipeline snapshot</h2>
                  <Link
                    to="/leads"
                    className="section-link"
                    aria-label="View pipeline"
                  >
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
                {(["hot", "warm", "cold"] as const).map((status) => {
                  const n = leads.filter((l) => l.status === status).length;
                  return (
                    <div key={status} className="py-3 border-t">
                      <div className="flex justify-between">
                        <StatusLabel status={status} />
                        <span className="text-[12px]">{n}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted mt-3">
                        <div
                          className="h-1 bg-foreground/25 rounded-full"
                          style={{ width: `${(n / leads.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </section>
              <section className="mt-8 border-t pt-5">
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Need a second perspective on your next step?
                </p>
                <button
                  className="section-link mt-3"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("inboxiq:assistant"))
                  }
                >
                  <MessageSquare size={13} />
                  Open workspace assistant
                  <ArrowUpRight size={11} />
                </button>
              </section>
            </aside>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
