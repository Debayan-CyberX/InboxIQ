import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Send, 
  Search, 
  Filter, 
  Sparkles,
  Mail,
  Edit3,
  Trash2,
  Archive,
  Clock,
  TrendingUp,
  CheckCircle2,
  X,
  MoreVertical,
  Copy,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// EmailDraft type definition (removed mock import)
interface EmailDraft {
  id: string;
  to: string;
  toName: string;
  company: string;
  subject: string;
  draft: string;
  reason: string;
  tone: string;
  confidence: number;
  createdAt: string;
  leadId?: string;
  threadId?: string;
  status: "draft" | "reviewed" | "sent" | "archived";
  priority: "high" | "medium" | "low";
  tags?: string[];
}
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { emailsApi, leadsApi } from "@/lib/api";
import type { Email } from "@/types/database";
import { toast } from "sonner";
import EmailPreviewPanel from "@/components/dashboard/EmailPreviewPanel";
import { formatDistanceToNow } from "date-fns";

type FilterType = "all" | "high" | "medium" | "low" | "reviewed";
type SortOption = "recent" | "confidence" | "priority" | "company";

// Transform database Email to component EmailDraft format
const transformDraft = (email: Email & { lead_company?: string; lead_contact_name?: string }): EmailDraft => {
  const contactName = email.lead_contact_name || "Unknown";
  const toEmail = email.to_email || "";
  
  // Derive priority from tone or default to medium
  // In a real app, this might come from lead status or AI analysis
  let priority: "high" | "medium" | "low" = "medium";
  if (email.tone === "sales-focused" || email.tone === "confident") {
    priority = "high";
  } else if (email.tone === "short") {
    priority = "low";
  }

  // Calculate confidence (default 85% for AI drafts, could be from AI analysis)
  const confidence = 85; // TODO: Get from AI analysis or metadata

  return {
    id: email.id,
    to: toEmail,
    toName: contactName,
    company: email.lead_company || "Unknown",
    subject: email.subject || "No subject",
    draft: email.body_text || email.body_html || "",
    reason: email.ai_reason || "AI-generated draft",
    tone: email.tone || "professional",
    confidence,
    createdAt: formatDistanceToNow(new Date(email.created_at), { addSuffix: true }),
    leadId: email.lead_id || undefined,
    threadId: email.thread_id || undefined,
    status: email.status === "draft" ? "draft" : email.status === "sent" ? "sent" : "draft",
    priority,
    tags: [],
  };
};

const Drafts = () => {
  const userId = useUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [drafts, setDrafts] = useState<Email[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch drafts from database
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchDrafts() {
      try {
        setLoading(true);
        setError(null);

        const draftsData = await emailsApi.getDrafts(userId);
        setDrafts(draftsData);
      } catch (err) {
        console.error("Error fetching drafts:", err);
        setError(err instanceof Error ? err : new Error("Failed to load drafts"));
        toast.error("Failed to load drafts", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDrafts();
  }, [userId]);

  // Transform drafts
  const transformedDrafts = useMemo(() => {
    return drafts.map(transformDraft);
  }, [drafts]);

  // Filter and sort drafts
  const filteredAndSortedDrafts = useMemo(() => {
    let filteredDrafts = [...transformedDrafts];

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "reviewed") {
        filteredDrafts = filteredDrafts.filter(d => d.status === "reviewed");
      } else {
        filteredDrafts = filteredDrafts.filter(d => d.priority === statusFilter);
      }
    }

    // Filter out archived
    filteredDrafts = filteredDrafts.filter(d => d.status !== "archived");

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDrafts = filteredDrafts.filter(d =>
        d.subject.toLowerCase().includes(query) ||
        d.toName.toLowerCase().includes(query) ||
        d.to.toLowerCase().includes(query) ||
        d.company.toLowerCase().includes(query) ||
        d.reason.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filteredDrafts.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "confidence":
          comparison = b.confidence - a.confidence;
          break;
        case "priority":
          const priorityOrder = { high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "company":
          comparison = a.company.localeCompare(b.company);
          break;
        case "recent":
        default:
          // Sort by creation time
          const dateA = drafts.find(d => d.id === a.id)?.created_at || "";
          const dateB = drafts.find(d => d.id === b.id)?.created_at || "";
          comparison = new Date(dateB).getTime() - new Date(dateA).getTime();
          break;
      }
      return comparison;
    });

    return filteredDrafts;
  }, [transformedDrafts, drafts, searchQuery, statusFilter, sortBy]);

  const stats = {
    total: transformedDrafts.filter(d => d.status !== "archived").length,
    high: transformedDrafts.filter(d => d.priority === "high" && d.status !== "archived").length,
    medium: transformedDrafts.filter(d => d.priority === "medium" && d.status !== "archived").length,
    low: transformedDrafts.filter(d => d.priority === "low" && d.status !== "archived").length,
    reviewed: transformedDrafts.filter(d => d.status === "reviewed").length,
    avgConfidence: transformedDrafts.filter(d => d.status !== "archived").length > 0
      ? Math.round(
          transformedDrafts
            .filter(d => d.status !== "archived")
            .reduce((sum, d) => sum + d.confidence, 0) / 
          transformedDrafts.filter(d => d.status !== "archived").length
        )
      : 0,
  };

  const handleDraftClick = (draft: EmailDraft) => {
    setSelectedDraft(draft);
    setIsPreviewOpen(true);
  };

  const handleRegenerate = async (draft: EmailDraft, tone?: string) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    if (!draft.leadId) {
      toast.error("Cannot regenerate: No lead associated with this draft");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Regenerating draft...", {
        description: `Generating new follow-up for ${draft.toName}`,
      });

      // Generate new follow-up text with tone (doesn't create a new draft)
      const toneValue = (tone || draft.tone) as "professional" | "short" | "confident" | "polite" | "sales-focused" | undefined;
      const newContent = await leadsApi.generateFollowUpText(draft.leadId, userId, toneValue);

      // Try to update the existing draft in database with new content
      // Don't pass updated_at - Supabase handles it automatically
      try {
        await emailsApi.update(draft.id, userId, {
          subject: newContent.subject,
          body_text: newContent.body,
          body_html: newContent.body.replace(/\n/g, "<br>"),
          tone: toneValue || draft.tone || "professional",
        });
      } catch (updateErr) {
        // If update fails because draft doesn't exist, create a new draft instead
        const errorMessage = updateErr instanceof Error ? updateErr.message : String(updateErr);
        
        // Check for "not found" error (either from our code or Supabase)
        if (errorMessage.includes("not found") || errorMessage.includes("PGRST116")) {
          console.log("Draft not found, creating new draft instead");
          
          // Get lead details for creating the draft
          const lead = await leadsApi.getById(draft.leadId, userId);
          if (!lead) {
            throw new Error("Lead not found - cannot create draft");
          }

          // Create new draft
          const newDraft = await emailsApi.create(
            {
              thread_id: draft.threadId || null,
              lead_id: draft.leadId,
              direction: "outbound",
              from_email: "", // Will be set by backend
              to_email: draft.to,
              cc_emails: null,
              bcc_emails: null,
              subject: newContent.subject,
              body_text: newContent.body,
              body_html: newContent.body.replace(/\n/g, "<br>"),
              status: "draft",
              is_ai_draft: true,
              tone: toneValue || draft.tone || "professional",
              ai_reason: "AI-generated draft (regenerated)",
              external_email_id: null,
              sent_at: null,
              received_at: null,
              scheduled_for: null,
            },
            userId
          );

          // Update the draft ID for the rest of the function
          const oldDraftId = draft.id;
          draft.id = newDraft.id;
          
          // Update selectedDraft ID if it matches the old one
          if (selectedDraft && selectedDraft.id === oldDraftId) {
            selectedDraft.id = newDraft.id;
          }
        } else {
          // For other errors (like 406), log and re-throw
          console.error("Unexpected error updating draft:", updateErr);
          throw updateErr;
        }
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Draft regenerated!", {
        description: `New follow-up generated for ${draft.toName}`,
      });

      // Update the selected draft immediately with new content (optimistic update)
      // Use draft.id which may have been updated if we created a new draft
      if (selectedDraft && (selectedDraft.id === draft.id || selectedDraft.leadId === draft.leadId)) {
        const updatedDraft: EmailDraft = {
          ...selectedDraft,
          id: draft.id, // Use the current draft.id (may be updated)
          subject: newContent.subject,
          draft: newContent.body,
          tone: toneValue || selectedDraft.tone || "professional",
        };
        setSelectedDraft(updatedDraft);
      }

      // Refresh drafts list in background
      const draftsData = await emailsApi.getDrafts(userId);
      setDrafts(draftsData);

      // Update selected draft from refreshed data to ensure consistency
      // Use the current draft.id (which might have been updated if we created a new draft)
      if (selectedDraft && (selectedDraft.id === draft.id || selectedDraft.leadId === draft.leadId)) {
        // Try to find by the current draft.id first, then by lead_id if not found
        let updatedDraft = draftsData.find(d => d.id === draft.id);
        if (!updatedDraft && draft.leadId) {
          // Find the most recent draft for this lead
          updatedDraft = draftsData
            .filter(d => d.lead_id === draft.leadId && d.is_ai_draft)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        }
        if (updatedDraft) {
          const transformed = transformDraft(updatedDraft);
          setSelectedDraft(transformed);
        }
      }
    } catch (err) {
      console.error("Error regenerating draft:", err);
      toast.error("Failed to regenerate draft", {
        description: err instanceof Error ? err.message : "Unknown error occurred",
      });
    }
  };

  const handleSend = async (draft: EmailDraft, editedContent?: { subject?: string; body?: string }) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Sending email...", {
        description: `Sending to ${draft.toName} at ${draft.company}`,
      });

      // Use edited content if provided, otherwise use draft content
      const subject = editedContent?.subject || draft.subject;
      const body = editedContent?.body || draft.draft;

      // Update draft in database if edited (only if draft exists)
      if (editedContent && (editedContent.subject !== draft.subject || editedContent.body !== draft.draft)) {
        try {
          await emailsApi.update(draft.id, userId, {
            subject: editedContent.subject || draft.subject,
            body_text: editedContent.body || draft.draft,
            body_html: (editedContent.body || draft.draft).replace(/\n/g, "<br>"),
            updated_at: new Date().toISOString(),
          });
        } catch (updateErr) {
          // If draft doesn't exist, that's okay - we'll still send the email
          console.warn("Could not update draft before sending (draft may not exist):", updateErr);
        }
      }

      // Send email via API (will work even if draft doesn't exist in DB)
      await emailsApi.sendEmail(draft.id, userId, {
        to: draft.to,
        subject: subject,
        body: body,
      });

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Email sent!", {
        description: `Sent to ${draft.toName} at ${draft.company}`,
      });
      
      // Update local state - remove sent draft
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      setIsPreviewOpen(false);
      setSelectedDraft(null);
    } catch (err) {
      console.error("Error sending email:", err);
      
      // Dismiss loading toast if still showing
      toast.dismiss();
      
      // Show detailed error message
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      
      // Check if it's a server configuration issue
      if (errorMessage.includes("resend") || errorMessage.includes("RESEND_API_KEY") || errorMessage.includes("Email service not")) {
        toast.error("Email Service Not Configured", {
          description: errorMessage + " Please contact support or check server configuration.",
          duration: 8000,
        });
      } else {
        toast.error("Failed to send email", {
          description: errorMessage,
          duration: 6000,
        });
      }
    }
  };

  const handleReview = async (draftId: string) => {
    try {
      // TODO: Implement review status update in database
      // For now, just update local state
      const draft = transformedDrafts.find(d => d.id === draftId);
      if (draft) {
        const newStatus = draft.status === "reviewed" ? "draft" : "reviewed";
        // Update the email status in database
        // await emailsApi.update(draftId, userId, { status: newStatus });
        toast.success(newStatus === "reviewed" ? "Marked as reviewed" : "Marked as draft");
      }
    } catch (err) {
      toast.error("Failed to update draft");
    }
  };

  const handleArchive = async (draftId: string) => {
    try {
      // TODO: Implement archive in database
      // await emailsApi.update(draftId, userId, { status: "archived" });
      
      // Update local state
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success("Draft archived");
    } catch (err) {
      toast.error("Failed to archive draft");
    }
  };

  const handleDelete = async (draftId: string) => {
    try {
      // TODO: Implement delete in database
      // await emailsApi.delete(draftId, userId);
      
      // Update local state
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success("Draft deleted");
    } catch (err) {
      toast.error("Failed to delete draft");
    }
  };

  const handleCreateTestDrafts = async () => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const loadingToast = toast.loading("Creating test drafts...");
      
      const result = await emailsApi.createTestDrafts(userId);
      
      toast.dismiss(loadingToast);
      toast.success(`Created ${result.count} test drafts!`, {
        description: "Refresh the page to see them",
      });

      // Refresh drafts
      const draftsData = await emailsApi.getDrafts(userId);
      setDrafts(draftsData);
    } catch (err) {
      console.error("Error creating test drafts:", err);
      toast.error("Failed to create test drafts", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-status-hot border-status-hot bg-status-hot-bg";
      case "medium":
        return "text-status-warm border-status-warm bg-status-warm-bg";
      case "low":
        return "text-muted-foreground border-border bg-muted";
      default:
        return "text-muted-foreground border-border bg-muted";
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "professional":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "confident":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "sales-focused":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "polite":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading drafts..." />
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
      <div className="space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-accent drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]" />
              <span className="text-gradient-primary text-glow-primary">AI Drafts</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground/90 font-medium">
              <span className="text-gradient font-bold text-base sm:text-lg">{filteredAndSortedDrafts.length}</span>{" "}
              {filteredAndSortedDrafts.length === 1 ? "draft" : "drafts"} ready for review
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="glass-strong p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient text-glow mb-1 sm:mb-2">{stats.total}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider leading-tight">Total Drafts</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-glow-hot p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-l-2 sm:border-l-4 border-l-status-hot hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(239,68,68,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-hot text-glow-hot mb-1 sm:mb-2">{stats.high}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider leading-tight">High Priority</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-glow-warm p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border-l-2 sm:border-l-4 border-l-status-warm hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(245,158,11,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-warm text-glow-warm mb-1 sm:mb-2">{stats.medium}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider leading-tight">Medium</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-strong p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient text-glow mb-1 sm:mb-2">{stats.low}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider leading-tight">Low Priority</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="glass-glow p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-primary text-glow-primary mb-1 sm:mb-2">{stats.avgConfidence}%</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider leading-tight">Avg Confidence</div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="card-elevated p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-3 sm:pr-4 rounded-lg sm:rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-sm sm:text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:bg-[rgba(255,255,255,0.08)] focus:border-[rgba(124,58,237,0.3)] transition-all duration-200 font-medium shadow-lg shadow-black/20"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("high")}
                className={cn("text-xs sm:text-sm px-2 sm:px-3", statusFilter === "high" ? "bg-status-hot-bg text-status-hot border-status-hot" : "")}
              >
                High
              </Button>
              <Button
                variant={statusFilter === "medium" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("medium")}
                className={cn("text-xs sm:text-sm px-2 sm:px-3", statusFilter === "medium" ? "bg-status-warm-bg text-status-warm border-status-warm" : "")}
              >
                Medium
              </Button>
              <Button
                variant={statusFilter === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("low")}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                Low
              </Button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 sm:h-11 px-3 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 sm:flex-initial"
              >
                <option value="recent">Recent</option>
                <option value="confidence">Confidence</option>
                <option value="priority">Priority</option>
                <option value="company">Company</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drafts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredAndSortedDrafts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="col-span-2 p-16 text-center glass-strong rounded-2xl"
            >
              <div className="relative inline-block mb-6">
                <Send className="w-16 h-16 text-muted-foreground/40 mx-auto opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-[rgba(124,58,237,0.2)] to-[rgba(34,211,238,0.2)] blur-2xl -z-10" />
              </div>
              <p className="text-base text-muted-foreground/90 mb-4 font-semibold">
                {searchQuery ? "No drafts found matching your search" : "No drafts yet. Generate a follow-up from a lead."}
              </p>
              {!searchQuery && (
                <p className="text-sm text-muted-foreground/70 font-medium">
                  Go to the Leads page and click "Generate Follow-up" on any lead to create your first draft.
                </p>
              )}
            </motion.div>
          ) : (
            filteredAndSortedDrafts.map((draft) => {
              const priorityColor = getPriorityColor(draft.priority);
              const toneColor = getToneColor(draft.tone);

              return (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass-strong p-4 sm:p-5 md:p-6 hover:border-[rgba(124,58,237,0.4)] transition-all cursor-pointer group relative overflow-hidden border border-[rgba(255,255,255,0.12)] rounded-xl sm:rounded-2xl"
                  onClick={() => handleDraftClick(draft)}
                >
                  <div className="space-y-3 sm:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#A78BFA] to-[#22D3EE] flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0 shadow-lg shadow-[#7C3AED]/40 ring-2 ring-[rgba(124,58,237,0.3)]">
                            {draft.toName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-foreground truncate mb-0.5 sm:mb-1 tracking-tight">{draft.toName}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground/80 truncate font-medium">{draft.company}</p>
                          </div>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-foreground line-clamp-1 mb-1 tracking-tight">
                          {draft.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReview(draft.id);
                          }}
                          className={cn(
                            "p-1.5 rounded hover:bg-muted transition-colors",
                            draft.status === "reviewed" && "text-green-400"
                          )}
                          title={draft.status === "reviewed" ? "Mark as draft" : "Mark as reviewed"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(draft.id);
                          }}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(draft.id);
                          }}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Draft Preview */}
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-[rgba(124,58,237,0.08)] to-[rgba(34,211,238,0.05)] border border-[rgba(124,58,237,0.15)] backdrop-blur-sm">
                      <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 sm:line-clamp-3 font-medium leading-relaxed">
                        {draft.draft.split('\n').slice(0, 3).join(' ')}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium border",
                          priorityColor
                        )}>
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {draft.priority}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium border",
                          toneColor
                        )}>
                          {draft.tone}
                        </span>
                        {draft.tags?.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-gradient-accent">
                          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                          <span className="text-gradient-accent text-glow-accent">{draft.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground/90">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{draft.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Reason */}
                    <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-[rgba(124,58,237,0.12)] to-[rgba(34,211,238,0.08)] border border-[rgba(124,58,237,0.25)] backdrop-blur-sm">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                        <p className="text-[10px] sm:text-xs text-accent font-semibold leading-relaxed line-clamp-2">{draft.reason}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-border">
                      <Button
                        variant="accent"
                        size="sm"
                        className="flex-1 gap-1.5 sm:gap-2 font-semibold shadow-lg shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/35 transition-all text-xs sm:text-sm px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDraftClick(draft);
                        }}
                      >
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Review & Send</span>
                        <span className="sm:hidden">Review</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDraftClick(draft);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(draft.draft);
                          toast.success("Draft copied to clipboard");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Email Preview Panel */}
      {selectedDraft && (
        <EmailPreviewPanel
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedDraft(null);
          }}
          onSend={(editedContent) => handleSend(selectedDraft, editedContent)}
          onRegenerate={(tone) => handleRegenerate(selectedDraft, tone)}
          email={{
            to: selectedDraft.to,
            subject: selectedDraft.subject,
            draft: selectedDraft.draft,
            reason: selectedDraft.reason,
            company: selectedDraft.company,
            leadId: selectedDraft.leadId,
          }}
        />
      )}

      {/* Overlay when panel is open */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => {
            setIsPreviewOpen(false);
            setSelectedDraft(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Drafts;



