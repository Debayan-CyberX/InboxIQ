import { useState, useEffect } from "react";
import { Flame, Bell, FileEdit, AlertTriangle, TrendingUp, Clock, Zap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusCard from "@/components/dashboard/StatusCard";
import AIInsightPanel from "@/components/dashboard/AIInsightPanel";
import LeadPipeline from "@/components/dashboard/LeadPipeline";
import ActionQueue from "@/components/dashboard/ActionQueue";
import EmailPreviewPanel from "@/components/dashboard/EmailPreviewPanel";
import PerformanceSnapshot from "@/components/dashboard/PerformanceSnapshot";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { leadsApi, actionsApi, insightsApi, analyticsApi } from "@/lib/api";
import type { Lead, Action, AIInsight } from "@/types/database";
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

// Transform database Action to component Action format
const transformAction = (action: Action) => ({
  id: action.id,
  company: action.lead_company || "Unknown",
  subject: action.subject || "",
  priority: action.priority,
  type: action.type,
  reason: action.reason || "",
  hasAIDraft: action.has_ai_draft,
});

const Index = () => {
  const userId = useUserId();
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
  const [actions, setActions] = useState<Action[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
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
        const [leadsData, actionsData, insightsData, statsData] = await Promise.all([
          leadsApi.getAll(userId),
          actionsApi.getAll(userId, "pending"),
          insightsApi.getRecent(userId, 1),
          leadsApi.getStatistics(userId),
        ]);

        setLeads(leadsData);
        setActions(actionsData);
        setInsights(insightsData);
        setStatistics({
          total: Number(statsData.total_leads) || 0,
          hot: Number(statsData.hot_leads) || 0,
          warm: Number(statsData.warm_leads) || 0,
          cold: Number(statsData.cold_leads) || 0,
          needsFollowUp: Number(statsData.needs_follow_up) || 0,
          hasDrafts: leadsData.filter(l => l.has_ai_draft).length,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err : new Error("Failed to load dashboard"));
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
    const dbLead = leads.find(l => l.id === lead.id);
    if (dbLead?.has_ai_draft) {
      setSelectedEmail({
        to: lead.email,
        subject: `Re: ${lead.company} - Follow Up`,
        company: lead.company,
        reason: lead.aiSuggestion || "AI suggested follow-up based on conversation history",
        draft: "AI draft content would go here...", // TODO: Fetch actual draft
      });
      setEmailPanelOpen(true);
    }
  };

  const handleActionReviewSend = (action: ReturnType<typeof transformAction>) => {
    const dbAction = actions.find(a => a.id === action.id);
    const relatedLead = leads.find(l => l.id === dbAction?.lead_id);
    setSelectedEmail({
      to: relatedLead?.email || "contact@company.com",
      subject: action.subject,
      company: action.company,
      reason: action.reason,
      draft: "AI draft content would go here...", // TODO: Fetch actual draft
    });
    setEmailPanelOpen(true);
  };

  // Calculate performance metrics (simplified for now)
  const performanceMetricsWithIcons = [
    { 
      label: "Reply Rate", 
      value: "0%", 
      change: 0, 
      trend: "neutral" as const,
      icon: TrendingUp 
    },
    { 
      label: "Avg Response Time", 
      value: "0h", 
      change: 0, 
      trend: "neutral" as const,
      icon: Clock 
    },
    { 
      label: "Time Saved", 
      value: "0h", 
      change: 0, 
      trend: "neutral" as const,
      icon: Zap 
    },
  ];

  // Transform leads for components
  const transformedLeads = leads.map(transformLead);
  const transformedActions = actions.map(transformAction);

  // Calculate stats from real data
  const hotLeadsCount = statistics.hot;
  const needsFollowUpCount = statistics.needsFollowUp;
  const draftsReadyCount = statistics.hasDrafts;
  const atRiskCount = leads.filter(l => l.days_since_contact >= 5).length;

  // Get latest insight and ensure highlights is an array with correct format
  const getHighlights = (highlights: any): Array<{ type: "hot" | "risk" | "opportunity"; text: string }> => {
    if (!highlights) return [];
    if (!Array.isArray(highlights)) return [];
    
    // Filter and ensure each highlight has the correct structure
    return highlights
      .filter((h: any) => h && typeof h === 'object' && h.type && h.text)
      .map((h: any) => ({
        type: (h.type === "hot" || h.type === "risk" || h.type === "opportunity") 
          ? h.type 
          : "opportunity" as const,
        text: String(h.text || ""),
      }))
      .filter((h: any) => h.text.length > 0);
  };

  const latestInsight = insights[0] ? {
    text: insights[0].insight_text || "No insights available",
    highlights: getHighlights(insights[0].highlights),
  } : {
    text: "No insights available yet. AI insights will appear here as your leads and emails are analyzed.",
    highlights: [],
  };

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
        <ErrorState 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
          <StatusCard
            title="Hot Leads"
            value={hotLeadsCount}
            change={{ value: 25, trend: "up" }}
            icon={Flame}
            variant="hot"
            subtitle="Ready to close"
          />
          <StatusCard
            title="Needs Follow-Up"
            value={needsFollowUpCount}
            icon={Bell}
            variant="warm"
            subtitle="Due today"
          />
          <StatusCard
            title="AI Drafts Ready"
            value={draftsReadyCount}
            change={{ value: 3, trend: "up" }}
            icon={FileEdit}
            variant="default"
            subtitle="Awaiting review"
          />
          <StatusCard
            title="Deals at Risk"
            value={atRiskCount}
            icon={AlertTriangle}
            variant="risk"
            subtitle="No reply 5+ days"
          />
        </div>

        {/* AI Insight Panel */}
        <AIInsightPanel 
          insight={latestInsight.text}
          highlights={latestInsight.highlights}
        />

        {/* Performance Metrics - Full Width */}
        <PerformanceSnapshot metrics={performanceMetricsWithIcons} />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0 w-full max-w-full overflow-x-hidden">

          {/* Lead Pipeline - Takes 8 columns */}
          <div className="col-span-1 lg:col-span-8 min-w-0 w-full max-w-full overflow-x-hidden">
            <LeadPipeline 
              leads={transformedLeads}
              onLeadClick={handleLeadClick}
            />
          </div>

          {/* Right column - Action Queue */}
          <div className="col-span-1 lg:col-span-4 min-w-0 w-full max-w-full overflow-x-hidden">
            <ActionQueue 
              actions={transformedActions}
              onReviewSend={handleActionReviewSend}
            />
          </div>
        </div>
      </div>

      {/* Email Preview Panel (Slide-over) */}
      <EmailPreviewPanel
        isOpen={emailPanelOpen}
        onClose={() => setEmailPanelOpen(false)}
        email={selectedEmail}
      />

      {/* Overlay when panel is open */}
      {emailPanelOpen && (
        <div 
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => setEmailPanelOpen(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default Index;
