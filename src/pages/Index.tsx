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

  // Generate actual insights from leads and action queue data
  const generateInsights = (): { text: string; highlights: Array<{ type: "hot" | "risk" | "opportunity"; text: string }> } => {
    const highlights: Array<{ type: "hot" | "risk" | "opportunity"; text: string }> = [];
    let insightText = "";

    // Analyze leads data
    const hotLeads = leads.filter(l => l.status === "hot");
    const leadsNeedingFollowUp = leads.filter(l => l.days_since_contact >= 3);
    const atRiskLeads = leads.filter(l => l.days_since_contact >= 5 && l.status !== "cold");
    const leadsWithDrafts = leads.filter(l => l.has_ai_draft);

    // Generate insight text based on priority
    if (hotLeads.length > 0) {
      insightText = `You have ${hotLeads.length} hot lead${hotLeads.length > 1 ? 's' : ''} that need immediate attention. `;
      if (hotLeads.length > 3) {
        insightText += "This is an excellent opportunity to close deals - prioritize responses today.";
        highlights.push({ type: "hot", text: `${hotLeads.length} hot leads ready to convert` });
      } else {
        insightText += "Focus on personalized outreach to maximize conversion potential.";
        highlights.push({ type: "hot", text: `${hotLeads.length} active hot lead${hotLeads.length > 1 ? 's' : ''}` });
      }
    } else if (atRiskLeads.length > 0) {
      insightText = `⚠️ ${atRiskLeads.length} lead${atRiskLeads.length > 1 ? 's are' : ' is'} at risk of going cold. `;
      insightText += `These contacts haven't been reached in 5+ days - immediate follow-up is critical to maintain momentum.`;
      highlights.push({ type: "risk", text: `${atRiskLeads.length} lead${atRiskLeads.length > 1 ? 's' : ''} at risk` });
      
      // Add specific at-risk companies if available
      if (atRiskLeads.length <= 3) {
        atRiskLeads.slice(0, 2).forEach(lead => {
          highlights.push({ type: "risk", text: `${lead.company || lead.contact_name} - ${lead.days_since_contact} days` });
        });
      }
    } else if (leadsNeedingFollowUp.length > 0) {
      insightText = `${leadsNeedingFollowUp.length} lead${leadsNeedingFollowUp.length > 1 ? 's need' : ' needs'} follow-up. `;
      insightText += "Following up within 3 days significantly increases response rates. Review your action queue to prioritize.";
      highlights.push({ type: "opportunity", text: `${leadsNeedingFollowUp.length} follow-up${leadsNeedingFollowUp.length > 1 ? 's' : ''} due` });
    } else if (leadsWithDrafts.length > 0) {
      insightText = `You have ${leadsWithDrafts.length} AI-generated draft${leadsWithDrafts.length > 1 ? 's' : ''} ready for review. `;
      insightText += "These personalized drafts are optimized for engagement - review and send to accelerate your sales pipeline.";
      highlights.push({ type: "opportunity", text: `${leadsWithDrafts.length} AI draft${leadsWithDrafts.length > 1 ? 's' : ''} ready` });
    } else if (actionQueueTasks.length > 0) {
      const highPriorityTasks = actionQueueTasks.filter(t => t.priority === "high");
      const followUpTasks = actionQueueTasks.filter(t => t.type === "followup");
      const reviewTasks = actionQueueTasks.filter(t => t.type === "review");
      
      if (highPriorityTasks.length > 0) {
        insightText = `${highPriorityTasks.length} high-priority action${highPriorityTasks.length > 1 ? 's' : ''} require${highPriorityTasks.length === 1 ? 's' : ''} immediate attention. `;
        insightText += "Addressing these tasks now will help maintain strong relationships and close more deals.";
        highlights.push({ type: "hot", text: `${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''}` });
      } else if (followUpTasks.length > 0) {
        insightText = `${followUpTasks.length} follow-up${followUpTasks.length > 1 ? 's are' : ' is'} pending in your action queue. `;
        insightText += "Timely follow-ups are key to converting warm leads into customers.";
        highlights.push({ type: "opportunity", text: `${followUpTasks.length} follow-up${followUpTasks.length > 1 ? 's' : ''} pending` });
      } else if (reviewTasks.length > 0) {
        insightText = `${reviewTasks.length} AI-generated draft${reviewTasks.length > 1 ? 's are' : ' is'} awaiting your review. `;
        insightText += "These drafts are ready to personalize and send - review them to keep your pipeline moving.";
        highlights.push({ type: "opportunity", text: `${reviewTasks.length} draft${reviewTasks.length > 1 ? 's' : ''} to review` });
      } else {
        insightText = `You have ${actionQueueTasks.length} action${actionQueueTasks.length > 1 ? 's' : ''} in your queue. `;
        insightText += "Stay organized and maintain momentum by working through these prioritized tasks.";
        highlights.push({ type: "opportunity", text: `${actionQueueTasks.length} task${actionQueueTasks.length > 1 ? 's' : ''} in queue` });
      }
    } else if (leads.length > 0) {
      const warmLeads = leads.filter(l => l.status === "warm");
      const coldLeads = leads.filter(l => l.status === "cold");
      
      if (warmLeads.length > 0) {
        insightText = `You have ${warmLeads.length} warm lead${warmLeads.length > 1 ? 's' : ''} in your pipeline. `;
        insightText += "Nurture these relationships with regular, value-driven communication to convert them into customers.";
        highlights.push({ type: "opportunity", text: `${warmLeads.length} warm lead${warmLeads.length > 1 ? 's' : ''} to nurture` });
      } else if (coldLeads.length > 0) {
        insightText = `${coldLeads.length} lead${coldLeads.length > 1 ? 's are' : ' is'} currently marked as cold. `;
        insightText += "Consider a re-engagement campaign with fresh value propositions to reactivate these opportunities.";
        highlights.push({ type: "opportunity", text: `${coldLeads.length} cold lead${coldLeads.length > 1 ? 's' : ''} to re-engage` });
      } else {
        insightText = `You're managing ${leads.length} lead${leads.length > 1 ? 's' : ''} across your pipeline. `;
        insightText += "Keep the momentum going with consistent follow-ups and personalized outreach.";
        highlights.push({ type: "opportunity", text: `${leads.length} active lead${leads.length > 1 ? 's' : ''}` });
      }
    } else {
      // No leads yet
      insightText = "Your pipeline is ready for new opportunities. Start by importing leads or connecting your email to automatically track conversations.";
      highlights.push({ type: "opportunity", text: "Ready to add leads" });
    }

    // Add additional context highlights
    if (draftsReadyCount > 0 && !highlights.some(h => h.text.includes("draft"))) {
      highlights.push({ type: "opportunity", text: `${draftsReadyCount} draft${draftsReadyCount > 1 ? 's' : ''} ready to send` });
    }

    if (needsFollowUpCount > 0 && !highlights.some(h => h.text.includes("follow-up"))) {
      highlights.push({ type: "opportunity", text: `${needsFollowUpCount} follow-up${needsFollowUpCount > 1 ? 's' : ''} needed` });
    }

    // Limit highlights to max 3 for clean display
    return {
      text: insightText,
      highlights: highlights.slice(0, 3)
    };
  };

  // Generate insights from actual data
  const latestInsight = generateInsights();

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