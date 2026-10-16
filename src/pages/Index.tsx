import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Bell, FileEdit, AlertTriangle, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusCard from "@/components/dashboard/StatusCard";
import AIInsightPanel from "@/components/dashboard/AIInsightPanel";
import LeadPipeline from "@/components/dashboard/LeadPipeline";
import ActionQueue, { type Action } from "@/components/dashboard/ActionQueue";
import EmailPreviewPanel from "@/components/dashboard/EmailPreviewPanel";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { leadsApi, insightsApi, actionQueueApi } from "@/lib/api";
import type { ActionQueueTask } from "@/lib/api/action-queue";
import type { Lead, AIInsight } from "@/types/database";
import { toast } from "sonner";

// Transform database Lead to component Lead format
const transformLead = (lead: Lead) => ({
  id: lead.id,
  company: lead.company,
  contact: lead.contact_name,
  email: lead.email,
  lastMessage: lead.last_message || "",
  daysSinceContact: lead.days_since_contact,
  status: lead.status,
  aiSuggestion: lead.ai_suggestion || undefined,
  hasAIDraft: lead.has_ai_draft,
});

// Transform ActionQueueTask to component Action format
const transformActionQueueTask = (
  task: ActionQueueTask,
  leads: Lead[],
): Action => {
  // Find the lead if leadId is provided
  const relatedLead = task.leadId
    ? leads.find((l) => l.id === task.leadId)
    : null;

  // Determine company name and subject based on task type
  let company = "Contact";
  let subject = task.title;

  if (relatedLead) {
    company = relatedLead.company || relatedLead.contact_name || "Contact";
  }

  // Map task types to component action types
  const actionType =
    task.type === "followup"
      ? "follow-up"
      : task.type === "review" || task.type === "send"
        ? "reply"
        : "follow-up";

  return {
    id: task.id,
    company,
    subject: task.title,
    priority: task.priority,
    type: actionType,
    reason: task.description,
    hasAIDraft: task.type === "review" || task.type === "send",
    leadId: task.leadId,
    emailId: task.emailId,
  };
};

const Index = () => {
  const userId = useUserId();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<{
    to: string;
    subject: string;
    company: string;
    reason: string;
    draft: string;
  } | null>(null);

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [actionQueueTasks, setActionQueueTasks] = useState<ActionQueueTask[]>(
    [],
  );
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [aiInsight, setAiInsight] = useState<{
    text: string;
    highlights: Array<{ type: "hot" | "risk" | "opportunity"; text: string }>;
  }>({
    text: "",
    highlights: [],
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    needsFollowUp: 0,
    hasDrafts: 0,
  });

  // Fetch all dashboard data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [leadsData, actionQueueData, insightsData, statsData] =
          await Promise.all([
            leadsApi.getAll(userId),
            actionQueueApi.getTasks(userId).catch((err) => {
              console.error("Error fetching action queue:", err);
              return []; // Return empty array on error
            }),
            insightsApi.getRecent(userId, 1),
            leadsApi.getStatistics(userId),
          ]);

        setLeads(leadsData);
        setActionQueueTasks(actionQueueData);
        setInsights(insightsData);
        setStatistics({
          total: Number(statsData.total_leads) || 0,
          hot: Number(statsData.hot_leads) || 0,
          warm: Number(statsData.warm_leads) || 0,
          cold: Number(statsData.cold_leads) || 0,
          needsFollowUp: Number(statsData.needs_follow_up) || 0,
          hasDrafts: leadsData.filter((l) => l.has_ai_draft).length,
        });

        // Generate AI insights from the data
        try {
          const generatedInsight = await insightsApi.generate(
            leadsData,
            actionQueueData,
            statsData,
          );
          setAiInsight(generatedInsight);
        } catch (err) {
          console.error("Error generating AI insights:", err);
          // Fallback to empty insight
          setAiInsight({
            text: "Analyzing your pipeline data...",
            highlights: [],
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load dashboard"),
        );
        toast.error("Failed to load dashboard", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [userId]);

  const handleLeadClick = (lead: ReturnType<typeof transformLead>) => {
    const dbLead = leads.find((l) => l.id === lead.id);
    if (dbLead?.has_ai_draft) {
      setSelectedEmail({
        to: lead.email,
        subject: `Re: ${lead.company} - Follow Up`,
        company: lead.company,
        reason:
          lead.aiSuggestion ||
          "AI suggested follow-up based on conversation history",
        draft: "AI draft content would go here...", // TODO: Fetch actual draft
      });
      setEmailPanelOpen(true);
    }
  };

  const handleActionReviewSend = (action: Action) => {
    // Find the original task
    const task = actionQueueTasks.find((t) => t.id === action.id);
    if (!task) return;

    // Handle navigation based on task type
    if (task.type === "followup") {
      // Navigate to Leads page - the user can create a draft there
      navigate("/leads");
    } else if (task.type === "review" || task.type === "send") {
      // Navigate to Drafts page where the user can review/send
      navigate("/drafts");
    } else {
      // Fallback: try to open email preview if we have lead info
      const relatedLead = action.leadId
        ? leads.find((l) => l.id === action.leadId)
        : null;
      if (relatedLead) {
        setSelectedEmail({
          to: relatedLead.email || "contact@company.com",
          subject: action.subject,
          company: action.company,
          reason: action.reason,
          draft: "AI draft content would go here...", // TODO: Fetch actual draft
        });
        setEmailPanelOpen(true);
      } else {
        // Navigate to drafts as fallback
        navigate("/drafts");
      }
    }
  };

  // Transform leads for components
  const transformedLeads = leads.map(transformLead);
  // Transform action queue tasks to component actions
  const transformedActions = actionQueueTasks.map((task) =>
    transformActionQueueTask(task, leads),
  );

  // Calculate stats from real data
  const hotLeadsCount = statistics.hot;
  const needsFollowUpCount = statistics.needsFollowUp;
  const draftsReadyCount = statistics.hasDrafts;
  const atRiskCount = leads.filter((l) => l.days_since_contact >= 5).length;

  // AI insights are now generated on the backend and stored in state

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="iq-page-heading">
        <div>
          <span className="iq-eyebrow">
            <span className="iq-dot" />
            YOUR DAILY PERSPECTIVE
          </span>
          <h1>Your next move, made clear.</h1>
          <p>
            A little context. A clear priority. More room for meaningful work.
          </p>
        </div>
        <button
          onClick={() => navigate("/inbox")}
          className="iq-button secondary text-[11px] py-2.5"
        >
          Open your inbox <Zap size={13} />
        </button>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatusCard
            title="High-intent leads"
            value={hotLeadsCount}
            icon={Flame}
            variant="hot"
            subtitle="Conversations with momentum"
          />
          <StatusCard
            title="Follow-ups due"
            value={needsFollowUpCount}
            icon={Bell}
            variant="warm"
            subtitle="A good time to reconnect"
          />
          <StatusCard
            title="Drafts to review"
            value={draftsReadyCount}
            icon={FileEdit}
            variant="default"
            subtitle="Your next reply starts here"
          />
          <StatusCard
            title="Needs your attention"
            value={atRiskCount}
            icon={AlertTriangle}
            variant="risk"
            subtitle="No contact in 5+ days"
          />
        </div>
        <AIInsightPanel
          insight={
            leads.length === 0
              ? "Your next opportunity starts with a conversation. Connect your email to bring your relationships into focus."
              : aiInsight.text ||
                "Explore your pipeline to see which relationships are ready for a next step."
          }
          highlights={aiInsight.highlights}
        />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-8 min-w-0">
            <LeadPipeline
              leads={transformedLeads}
              onLeadClick={handleLeadClick}
            />
          </div>
          <div className="xl:col-span-4 min-w-0">
            <ActionQueue
              actions={transformedActions}
              onReviewSend={handleActionReviewSend}
            />
          </div>
        </div>
        <section className="card-elevated p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="iq-section-heading">The shape of your pipeline</h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                A live view of your relationships, by stage.
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {statistics.total} total leads
            </span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden gap-1 bg-white/[.03] mb-5">
            {[
              { n: statistics.hot, c: "#c59b86" },
              { n: statistics.warm, c: "#c9ae7c" },
              { n: statistics.cold, c: "#a18ac7" },
            ].map((stage, i) => (
              <div
                key={i}
                style={{
                  width: `${statistics.total ? (stage.n / statistics.total) * 100 : 0}%`,
                  background: stage.c,
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-6 text-[10px] text-muted-foreground">
            {[
              { label: "High intent", n: statistics.hot, c: "#c59b86" },
              { label: "In conversation", n: statistics.warm, c: "#c9ae7c" },
              { label: "Room to reconnect", n: statistics.cold, c: "#a18ac7" },
            ].map((stage) => (
              <span key={stage.label} className="flex gap-2 items-center">
                <i
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: stage.c }}
                />
                {stage.label}
                <strong className="text-foreground font-medium">
                  {stage.n}
                </strong>
              </span>
            ))}
          </div>
        </section>
      </div>
      <EmailPreviewPanel
        isOpen={emailPanelOpen}
        onClose={() => setEmailPanelOpen(false)}
        email={selectedEmail}
      />
      {emailPanelOpen && (
        <button
          aria-label="Close email preview"
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setEmailPanelOpen(false)}
        />
      )}
    </DashboardLayout>
  );
};
export default Index;
