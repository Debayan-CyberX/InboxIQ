import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { leadsApi, insightsApi, analyticsApi, actionQueueApi, type ActionQueueTask } from "@/lib/api";
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
const transformActionQueueTask = (task: ActionQueueTask, leads: Lead[]) => {
  // Find the lead if leadId is provided
  const relatedLead = task.leadId ? leads.find(l => l.id === task.leadId) : null;
  
  // Determine company name and subject based on task type
  let company = "Contact";
  let subject = task.title;
  
  if (relatedLead) {
    company = relatedLead.company || relatedLead.contact_name || "Contact";
  }
  
  // Map task types to component action types
  const actionType = task.type === "followup" 
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
  const [actionQueueTasks, setActionQueueTasks] = useState<ActionQueueTask[]>([]);
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
        const [leadsData, actionQueueData, insightsData, statsData] = await Promise.all([
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

  const handleActionReviewSend = (action: ReturnType<typeof transformActionQueueTask>) => {
    // Find the original task
    const task = actionQueueTasks.find(t => t.id === action.id);
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
      const relatedLead = action.leadId ? leads.find(l => l.id === action.leadId) : null;
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
  // Transform action queue tasks to component actions
  const transformedActions = actionQueueTasks.map(task => transformActionQueueTask(task, leads));

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
      <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
  COMMIT TEST v1
</div>

      {/* Futuristic animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Deep gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0A1A] via-[#1a0f2e] via-[#0F0A1A] to-[#0F0A1A]" />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/25 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-accent/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        
        {/* Futuristic grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(147, 51, 234, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(147, 51, 234, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 0 0'
          }}
        />
        
        {/* Animated scan lines */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/8 to-transparent"
          animate={{
            opacity: [0, 0.3, 0],
            y: ['-100%', '100%']
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative space-y-6 sm:space-y-8 w-full min-w-0 max-w-full overflow-x-hidden pb-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full min-w-0">
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

        {/* Futuristic Section Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"></div>
          </div>
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 px-6 bg-background"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-accent to-purple-500 border-2 border-accent/50 shadow-lg shadow-accent/30"></div>
          </motion.div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 min-w-0 w-full max-w-full overflow-x-hidden">

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
