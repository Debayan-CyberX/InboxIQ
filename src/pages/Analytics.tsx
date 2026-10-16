import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Inbox,
  Mail,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { analyticsApi, leadsApi } from "@/lib/api";
import type { Lead } from "@/types/database";
type Range = 7 | 30 | 90;
const stages = [
  { key: "hot" as const, label: "High intent", color: "#d6aa95" },
  { key: "warm" as const, label: "In conversation", color: "#c6af81" },
  { key: "cold" as const, label: "Room to reconnect", color: "#b29bd6" },
];
export default function Analytics() {
  const userId = useUserId();
  const [range, setRange] = useState<Range>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [email, setEmail] = useState({ sent: 0, received: 0 });
  useEffect(() => {
    let current = true;
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      leadsApi.getAll(userId),
      analyticsApi.getEmailStats(userId, range),
    ])
      .then(([relationships, activity]) => {
        if (current) {
          setLeads(relationships);
          setEmail({ sent: activity.sent, received: activity.received });
        }
      })
      .catch((e) => {
        if (current)
          setError(
            e instanceof Error ? e : new Error("Could not load analytics."),
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [userId, range]);
  const distribution = stages.map((s) => ({
    ...s,
    count: leads.filter((l) => l.status === s.key).length,
  }));
  const trend = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const width = range / 7;
    return Array.from({ length: 7 }, (_, i) => {
      const end = new Date(now.getTime() - (6 - i) * width * 86400000);
      const start = new Date(end.getTime() - width * 86400000);
      return {
        label: end.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        count: leads.filter((l) => {
          const d = new Date(l.created_at);
          return d > start && d <= end;
        }).length,
      };
    });
  }, [leads, range]);
  const added = trend.reduce((sum, b) => sum + b.count, 0);
  const totalActivity = email.sent + email.received;
  const max = Math.max(1, ...trend.map((b) => b.count));
  const pending = leads.filter((l) => l.days_since_contact >= 5);
  const draftCount = leads.filter((l) => l.has_ai_draft).length;
  function exportReport() {
    const rows = [
      ["Metric", "Value", "Scope"],
      ["Emails sent", email.sent, `Last ${range} days`],
      ["Emails received", email.received, `Last ${range} days`],
      ["New leads", added, `Last ${range} days`],
      ...distribution.map((s) => [s.label, s.count, "Current pipeline"]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inboxiq-analytics-${range}days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  if (error)
    return (
      <DashboardLayout>
        <ErrorState
          error={error}
          onRetry={() => setRange((r) => (r === 30 ? 7 : 30))}
        />
      </DashboardLayout>
    );
  return (
    <DashboardLayout>
      <div className="iq-page-heading">
        <div>
          <span className="iq-eyebrow">
            <span className="iq-dot" />
            THE BIGGER PICTURE
          </span>
          <h1>Analytics</h1>
          <p>Understand the rhythm of your relationships.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div
            className="flex p-1 border border-white/[.08] rounded-lg bg-white/[.02]"
            role="group"
            aria-label="Reporting period"
          >
            {([7, 30, 90] as Range[]).map((n) => (
              <button
                key={n}
                onClick={() => setRange(n)}
                aria-pressed={range === n}
                className={`text-[10px] px-3 py-1.5 rounded-md transition-colors ${range === n ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n} days
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            disabled={loading}
          >
            <ArrowDownToLine size={12} />
            Export
          </Button>
        </div>
      </div>
      {loading ? (
        <LoadingState message="Putting your activity into perspective..." />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Emails sent",
                value: email.sent,
                icon: Mail,
                foot: `Over the last ${range} days`,
              },
              {
                label: "Emails received",
                value: email.received,
                icon: Inbox,
                foot: `Over the last ${range} days`,
              },
              {
                label: "New connections",
                value: added,
                icon: Users,
                foot: `Added in the last ${range} days`,
              },
              {
                label: "Drafts ready",
                value: draftCount,
                icon: Sparkles,
                foot: "In your current pipeline",
              },
            ].map((metric) => (
              <article key={metric.label} className="iq-metric">
                <div className="flex items-center justify-between">
                  <span className="iq-metric-label">{metric.label}</span>
                  <metric.icon
                    size={15}
                    strokeWidth={1.5}
                    className="text-primary/70"
                  />
                </div>
                <p className="iq-metric-value">{metric.value}</p>
                <p className="iq-metric-foot">{metric.foot}</p>
              </article>
            ))}
          </div>
          <div className="grid lg:grid-cols-12 gap-5">
            <section className="card-elevated lg:col-span-8 p-5 sm:p-6">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="iq-section-heading">A growing circle</h2>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    New relationships added over the last {range} days.
                  </p>
                </div>
                <span className="text-[22px] font-medium tracking-tight">
                  {added}
                  <span className="text-[9px] text-muted-foreground ml-2 font-normal tracking-normal">
                    new leads
                  </span>
                </span>
              </div>
              <div
                className="relative h-[210px] flex gap-3 sm:gap-5 items-end border-b border-white/[.08] px-2 pb-0"
                role="img"
                aria-label={`New leads by reporting interval: ${trend.map((b) => `${b.label}: ${b.count}`).join(", ")}`}
              >
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0">
                  {[0, 1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="border-t border-dashed border-white/[.05] w-full"
                    />
                  ))}
                </div>
                {trend.map((b) => (
                  <div
                    key={b.label}
                    className="flex-1 h-full flex items-end relative group"
                  >
                    <div
                      title={`${b.label}: ${b.count} new leads`}
                      className="w-full bg-[#bda5fb]/60 hover:bg-[#cbb5ff] rounded-t-sm transition-colors relative z-10"
                      style={{
                        height: b.count ? `${(b.count / max) * 86}%` : "2px",
                        opacity: b.count ? 1 : 0.15,
                      }}
                    />
                    <span className="absolute -bottom-7 inset-x-0 text-center text-[8px] text-muted-foreground">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
              {added === 0 && (
                <p className="text-[10px] text-muted-foreground text-center mt-12 mb-2">
                  Your story is just getting started. New connections will
                  appear here.
                </p>
              )}
              {added > 0 && (
                <p className="text-[9px] text-muted-foreground mt-12 mb-2">
                  Showing new leads by creation date. Each bar covers part of
                  the selected period.
                </p>
              )}
            </section>
            <section className="card-elevated lg:col-span-4 p-5 sm:p-6">
              <h2 className="iq-section-heading">Where things stand</h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                Your current pipeline, across all stages.
              </p>
              <div className="flex items-center justify-center my-7">
                <div className="w-[125px] h-[125px] rounded-full border-[10px] border-white/[.04] flex items-center justify-center flex-col">
                  <span className="text-3xl tracking-tight font-medium">
                    {leads.length}
                  </span>
                  <span className="text-[8px] text-muted-foreground mt-1">
                    relationships
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {distribution.map((stage) => (
                  <div
                    key={stage.key}
                    className="flex justify-between items-center text-[10px]"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <i
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: stage.color }}
                      />
                      {stage.label}
                    </span>
                    <span>
                      {stage.count}
                      <span className="text-muted-foreground ml-2">
                        {leads.length
                          ? Math.round((stage.count / leads.length) * 100)
                          : 0}
                        %
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <section className="card-elevated p-5 sm:p-6">
              <h2 className="iq-section-heading">The flow of conversation</h2>
              <p className="text-[10px] text-muted-foreground mt-1 mb-7">
                Sent and received emails in your selected period.
              </p>
              {[
                { label: "Sent", value: email.sent, color: "#bda5fb" },
                { label: "Received", value: email.received, color: "#8bb9aa" },
              ].map((row) => (
                <div key={row.label} className="mb-5">
                  <div className="flex justify-between text-[10px] mb-2">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                  <div className="h-1.5 bg-white/[.03] rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${totalActivity ? (row.value / totalActivity) * 100 : 0}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-muted-foreground border-t border-white/[.06] pt-4 mt-6">
                Based on synced email activity. Connect your email to build a
                clearer picture.
              </p>
            </section>
            <section className="card-elevated p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="iq-section-heading">A moment to reconnect</h2>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Relationships without contact in 5+ days.
                  </p>
                </div>
                <Link
                  to="/leads"
                  aria-label="View lead pipeline"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              {pending.length ? (
                <div className="mt-5 divide-y divide-white/[.05]">
                  {pending.slice(0, 4).map((lead) => (
                    <div
                      key={lead.id}
                      className="py-3 flex justify-between gap-3 text-[10px]"
                    >
                      <span className="truncate">
                        {lead.company || lead.contact_name}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {lead.days_since_contact} days
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="min-h-[155px] flex items-center justify-center text-center">
                  <div>
                    <Users size={23} className="text-primary/40 mx-auto mb-3" />
                    <p className="text-[11px] text-muted-foreground">
                      No overdue relationships right now.
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 mt-2">
                      A good place to keep the momentum going.
                    </p>
                  </div>
                </div>
              )}
              <Link
                to="/leads"
                className="text-[10px] text-primary flex items-center gap-2 mt-3"
              >
                Explore your pipeline
                <ArrowRight size={12} />
              </Link>
            </section>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
