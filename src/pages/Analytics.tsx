import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Info,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageHeader, EmptyState, StatusLabel } from "@/components/WorkspaceUI";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useLeads } from "@/hooks/use-workspace-data";
import { useUserId } from "@/hooks/useUserId";
import { analyticsApi } from "@/lib/api";
import { leadBuckets, csvRows } from "@/lib/workspace-model";
type Range = 7 | 30 | 90;
const stages = ["hot", "warm", "cold"] as const;
export default function Analytics() {
  const id = useUserId();
  const leadsQuery = useLeads();
  const [range, setRange] = useState<Range>(30);
  const activity = useQuery({
    queryKey: ["analytics", id, range],
    queryFn: () => analyticsApi.getEmailStats(id!, range),
    enabled: !!id,
    staleTime: 30000,
  });
  const leads = useMemo(() => leadsQuery.data || [], [leadsQuery.data]);
  const email = activity.data || { sent: 0, received: 0 };
  const buckets = useMemo(() => leadBuckets(leads, range), [leads, range]);
  const totalAdded = buckets.reduce((n, b) => n + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const dist = stages.map((status) => ({
    status,
    n: leads.filter((l) => l.status === status).length,
  }));
  const empty = leads.length === 0 && email.sent === 0 && email.received === 0;
  const pending = activity.isPending || leadsQuery.isPending;
  const failed = activity.error || leadsQuery.error;
  const due = leads
    .filter((l) => l.days_since_contact >= 5)
    .sort((a, b) => b.days_since_contact - a.days_since_contact);
  function download() {
    const csv = csvRows([
      ["Metric", "Value", "Period"],
      ["Emails sent", email.sent, `Last ${range} days`],
      ["Emails received", email.received, `Last ${range} days`],
      ["New leads", totalAdded, `Last ${range} days`],
      ...dist.map((s) => [s.status, s.n, "Current pipeline"]),
    ]);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `inboxiq-analytics-${range}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="A clear view of conversation activity and the pipeline it builds."
      >
        <div className="segmented" role="group" aria-label="Reporting period">
          {([7, 30, 90] as Range[]).map((n) => (
            <button
              key={n}
              aria-pressed={n === range}
              onClick={() => setRange(n)}
            >
              {n} days
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pending || !!failed}
          onClick={download}
        >
          <ArrowDownToLine size={12} />
          Export
        </Button>
      </PageHeader>
      {pending ? (
        <LoadingState message="Loading analytics..." />
      ) : failed ? (
        <ErrorState
          error={failed}
          onRetry={() => {
            activity.refetch();
            leadsQuery.refetch();
          }}
        />
      ) : empty ? (
        <>
          <div className="border-y">
            <EmptyState
              icon={BarChart3}
              title="Your activity will tell the story."
              description="Sync email and build your pipeline to see actual conversation activity here. No estimates, invented trends, or placeholder growth."
            >
              <Button asChild variant="outline" size="sm">
                <Link to="/inbox">
                  Open inbox
                  <ArrowRight size={12} />
                </Link>
              </Button>
            </EmptyState>
          </div>
          <MetricDefinitions />
        </>
      ) : (
        <>
          <div className="metric-strip">
            {[
              {
                label: "Emails sent",
                value: email.sent,
                foot: `Synced outbound messages / ${range} days`,
              },
              {
                label: "Emails received",
                value: email.received,
                foot: `Synced inbound messages / ${range} days`,
              },
              {
                label: "New leads",
                value: totalAdded,
                foot: `Created in the last ${range} days`,
              },
              {
                label: "Current pipeline",
                value: leads.length,
                foot: "All stages / all time",
              },
            ].map((m) => (
              <div key={m.label}>
                <span className="metric-label">{m.label}</span>
                <p className="metric-value">{m.value}</p>
                <p className="metric-foot">{m.foot}</p>
              </div>
            ))}
          </div>
          <div className="analytics-grid">
            <section>
              <div className="section-heading">
                <div>
                  <h2>New relationships</h2>
                  <p>Leads added during the selected period.</p>
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {totalAdded} total
                </span>
              </div>
              {totalAdded > 0 ? (
                <div
                  className="report-chart"
                  role="img"
                  aria-label={`New leads: ${buckets.map((b) => `${b.label}: ${b.count}`).join(", ")}`}
                >
                  <div className="chart-grid-lines">
                    {[0, 1, 2, 3].map((n) => (
                      <i key={n} />
                    ))}
                  </div>
                  {buckets.map((b) => (
                    <div key={b.start} className="report-bar">
                      <div className="report-bar-value">{b.count}</div>
                      <div
                        className="report-bar-fill"
                        style={{
                          height: b.count ? `${(b.count / max) * 75}%` : "1px",
                        }}
                        title={`${b.label}: ${b.count} new leads`}
                      />
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="analytics-no-period">
                  No new leads in this reporting period.
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-9 border-t pt-4">
                Each bar covers one of seven equal intervals. Lead counts use
                their recorded creation time.
              </p>
            </section>
            <section>
              <div className="section-heading">
                <div>
                  <h2>Pipeline composition</h2>
                  <p>Current status, independent of the date filter.</p>
                </div>
                <Link
                  to="/leads"
                  className="section-link"
                  aria-label="View pipeline"
                >
                  <ArrowUpRight size={13} />
                </Link>
              </div>
              <div className="pipeline-distribution">
                {dist.map((s) => (
                  <div key={s.status}>
                    <div className="flex items-center justify-between">
                      <StatusLabel status={s.status} />
                      <span className="text-[12px]">
                        {s.n}
                        <span className="text-muted-foreground ml-3">
                          {leads.length
                            ? Math.round((s.n / leads.length) * 100)
                            : 0}
                          %
                        </span>
                      </span>
                    </div>
                    <div className="distribution-track">
                      <div
                        style={{
                          width: `${leads.length ? (s.n / leads.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t mt-7 pt-5">
                <p className="text-[12px] text-muted-foreground">
                  Every stage reflects your actual saved leads.
                </p>
              </div>
            </section>
            <section>
              <div className="section-heading">
                <div>
                  <h2>Conversation activity</h2>
                  <p>Synced messages during the selected period.</p>
                </div>
              </div>
              {[
                { label: "Sent", n: email.sent },
                { label: "Received", n: email.received },
              ].map((row) => (
                <div key={row.label} className="my-6">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span>{row.n}</span>
                  </div>
                  <div className="distribution-track">
                    <div
                      style={{
                        width: `${email.sent + email.received ? (row.n / (email.sent + email.received)) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground border-t pt-4 mt-7">
                No inferred opens or reply-rate estimates. Counts come from the
                messages synced to your workspace.
              </p>
            </section>
            <section>
              <div className="section-heading">
                <div>
                  <h2>Room to reconnect</h2>
                  <p>Relationships without a recorded contact in 5+ days.</p>
                </div>
                <Link
                  to="/leads?filter=risk"
                  className="section-link"
                  aria-label="View relationships at risk"
                >
                  <ArrowUpRight size={13} />
                </Link>
              </div>
              {due.length ? (
                <ul className="work-list">
                  {due.slice(0, 5).map((l) => (
                    <li key={l.id}>
                      <Link
                        to={`/leads?lead=${l.id}`}
                        className="text-[12px] flex-1"
                      >
                        {l.company || l.contact_name}
                      </Link>
                      <span className="text-[11px] text-muted-foreground">
                        {l.days_since_contact} days
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="analytics-no-period !h-[150px]">
                  No overdue relationships right now.
                </div>
              )}
            </section>
          </div>
          <MetricDefinitions />
        </>
      )}
    </DashboardLayout>
  );
}
function MetricDefinitions() {
  return (
    <details className="metric-definitions">
      <summary>
        <Info size={12} />
        How these numbers are counted
      </summary>
      <div>
        <p>
          <strong>Messages:</strong> synced email with a recorded sent or
          received time in the selected period.
        </p>
        <p>
          <strong>New leads:</strong> saved leads with a creation time in the
          selected period.
        </p>
        <p>
          <strong>Pipeline:</strong> all saved leads, grouped by current stage.
          Changing the date filter doesn't change this snapshot.
        </p>
        <p>
          Dates reflect your browser's timezone. Data depends on your email sync
          and saved pipeline records.
        </p>
      </div>
    </details>
  );
}
