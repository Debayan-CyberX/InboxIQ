import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Inbox as InboxIcon, 
  Search, 
  Filter, 
  Star, 
  Archive, 
  Trash2, 
  Mail, 
  MailOpen,
  Paperclip,
  Sparkles,
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { emailsApi } from "@/lib/api";
import type { EmailThread as DBEmailThread } from "@/types/database";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import EmailThreadDetailPanel from "@/components/dashboard/EmailThreadDetailPanel";

type FilterType = "all" | "unread" | "important" | "starred" | "archived" | "drafts";

// Local EmailThread type for UI display
interface EmailThread {
  id: string;
  subject: string;
  from: {
    name: string;
    email: string;
  };
  company?: string;
  leadId: string | null;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isImportant: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  unreadCount: number;
  emailCount: number;
  lastActivity: string;
  status: string;
  tags: string[];
  aiSuggestion?: string;
  hasAIDraft: boolean;
}

// Transform database EmailThread to component EmailThread format
const transformEmailThread = (dbThread: DBEmailThread & { lead_company?: string; lead_contact_name?: string; lead_email?: string }): EmailThread => {
  // Use lead contact name, or extract from email if available
  let contactName = dbThread.lead_contact_name || "Unknown";
  const contactEmail = dbThread.lead_email || "";
  
  // If contact name is Unknown but we have email, try to format it
  if (contactName === "Unknown" && contactEmail) {
    const emailName = contactEmail.split("@")[0];
    contactName = emailName
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  const [firstName, ...lastNameParts] = contactName.split(" ");
  const lastName = lastNameParts.join(" ") || firstName;
  
  return {
    id: dbThread.id,
    subject: dbThread.subject,
    from: {
      name: contactName,
      email: contactEmail,
    },
    company: dbThread.lead_company || undefined,
    leadId: dbThread.lead_id,
    preview: "", // Will be populated from actual emails if needed
    timestamp: formatDistanceToNow(new Date(dbThread.updated_at), { addSuffix: true }),
    isRead: true, // TODO: Add read status to database
    isImportant: false, // TODO: Add important flag to database
    isStarred: false, // TODO: Add starred flag to database
    hasAttachment: false, // TODO: Check for attachments in emails
    unreadCount: 0, // TODO: Calculate from emails
    emailCount: 1, // TODO: Count emails in thread
    lastActivity: formatDistanceToNow(new Date(dbThread.updated_at), { addSuffix: true }),
    status: dbThread.status,
    tags: [],
    aiSuggestion: undefined, // TODO: Get from AI insights
    hasAIDraft: false, // TODO: Check if thread has AI drafts
  };
};

const Inbox = () => {
  const userId = useUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [emailThreads, setEmailThreads] = useState<DBEmailThread[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [selectedThread, setSelectedThread] = useState<DBEmailThread & { lead_company?: string; lead_contact_name?: string; lead_email?: string } | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Fetch email threads from database
  const fetchThreads = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Map filter to database status
      let status: "active" | "archived" | "closed" | undefined = undefined;
      if (selectedFilter === "archived") {
        status = "archived";
      } else if (selectedFilter === "all") {
        status = "active"; // Default to active threads
      }

      const threads = await emailsApi.getThreads(userId, status);
      setEmailThreads(threads);
    } catch (err) {
      console.error("Error fetching email threads:", err);
      setError(err instanceof Error ? err : new Error("Failed to load email threads"));
      toast.error("Failed to load email threads", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [userId, selectedFilter]);

  // Listen for email sync completion event
  useEffect(() => {
    const handleSyncCompleted = () => {
      // Refetch threads when sync completes
      fetchThreads();
    };

    window.addEventListener("emailSyncCompleted", handleSyncCompleted);
    return () => {
      window.removeEventListener("emailSyncCompleted", handleSyncCompleted);
    };
  }, [userId, selectedFilter]);

  // Transform and filter threads
  const transformedThreads = useMemo(() => {
    return emailThreads.map(transformEmailThread);
  }, [emailThreads]);

  // Filter and search threads
  const filteredThreads = useMemo(() => {
    let threads = [...transformedThreads];

    // Apply filter
    switch (selectedFilter) {
      case "unread":
        threads = threads.filter(t => !t.isRead || t.unreadCount > 0);
        break;
      case "important":
        threads = threads.filter(t => t.isImportant);
        break;
      case "starred":
        threads = threads.filter(t => t.isStarred);
        break;
      case "archived":
        threads = threads.filter(t => t.status === "archived");
        break;
      case "drafts":
        threads = threads.filter(t => t.hasAIDraft);
        break;
      default:
        threads = threads.filter(t => t.status !== "archived");
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      threads = threads.filter(t => 
        t.subject.toLowerCase().includes(query) ||
        t.from.name.toLowerCase().includes(query) ||
        t.from.email.toLowerCase().includes(query) ||
        t.preview.toLowerCase().includes(query) ||
        t.company?.toLowerCase().includes(query)
      );
    }

    return threads;
  }, [transformedThreads, selectedFilter, searchQuery]);

  const unreadCount = transformedThreads.filter(t => !t.isRead || t.unreadCount > 0).length;
  const importantCount = transformedThreads.filter(t => t.isImportant).length;
  const starredCount = transformedThreads.filter(t => t.isStarred).length;
  const draftCount = transformedThreads.filter(t => t.hasAIDraft).length;

  const handleThreadClick = (thread: EmailThread) => {
    // Find the original DB thread
    const dbThread = emailThreads.find(t => t.id === thread.id);
    if (dbThread) {
      // Create thread with lead info from the transformed thread
      const dbThreadWithLead: DBEmailThread & { lead_company?: string; lead_contact_name?: string; lead_email?: string } = {
        ...dbThread,
        lead_company: thread.company,
        lead_contact_name: thread.from.name,
        lead_email: thread.from.email,
      };
      setSelectedThread(dbThreadWithLead);
      setIsDetailPanelOpen(true);
    }
    // Mark as read when clicked (local state update)
    if (!thread.isRead) {
      thread.isRead = true;
      thread.unreadCount = 0;
    }
  };

  const handleToggleStar = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement star functionality in database
    toast.success("Starred");
  };

  const handleToggleImportant = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement important flag in database
    toast.success("Marked as important");
  };

  const handleArchive = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    
    try {
      await emailsApi.archiveThread(threadId, userId);
      
      // Update local state
      setEmailThreads(prev => 
        prev.map(t => t.id === threadId ? { ...t, status: t.status === "archived" ? "active" : "archived" } : t)
      );
      
      toast.success("Thread archived");
    } catch (err) {
      console.error("Error archiving thread:", err);
      toast.error("Failed to archive thread", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const filters = [
    { id: "all" as FilterType, label: "All", count: transformedThreads.filter(t => t.status !== "archived").length, icon: InboxIcon },
    { id: "unread" as FilterType, label: "Unread", count: unreadCount, icon: Mail },
    { id: "important" as FilterType, label: "Important", count: importantCount, icon: AlertCircle },
    { id: "starred" as FilterType, label: "Starred", count: starredCount, icon: Star },
    { id: "drafts" as FilterType, label: "Drafts", count: draftCount, icon: Sparkles },
    { id: "archived" as FilterType, label: "Archived", count: transformedThreads.filter(t => t.status === "archived").length, icon: Archive },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading inbox..." />
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
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Inbox</h1>
            <p className="text-base text-muted-foreground font-medium">
              {filteredThreads.length} {filteredThreads.length === 1 ? "conversation" : "conversations"}
              {selectedFilter !== "all" && ` • ${filters.find(f => f.id === selectedFilter)?.label}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="default" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="default" size="default" className="gap-2">
              <Mail className="w-4 h-4" />
              Compose
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="col-span-3 space-y-4">
            {/* Search */}
            <div className="glass-strong p-5 rounded-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:bg-[rgba(255,255,255,0.08)] transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="glass-strong p-3 rounded-2xl">
              <div className="space-y-1.5">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 text-left group",
                        selectedFilter === filter.id
                          ? "bg-[rgba(124,58,237,0.15)] text-[#7C3AED] border border-[rgba(124,58,237,0.2)] shadow-lg shadow-[#7C3AED]/10"
                          : "text-foreground/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground hover:translate-x-1"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-5 h-5", selectedFilter === filter.id && "text-[#7C3AED]")} />
                        <span>{filter.label}</span>
                      </div>
                      {filter.count > 0 && (
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center",
                          selectedFilter === filter.id
                            ? "bg-[#7C3AED] text-white"
                            : "bg-[rgba(255,255,255,0.1)] text-muted-foreground"
                        )}>
                          {filter.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Email Threads */}
          <div className="col-span-9">
            <div className="glass-strong rounded-2xl overflow-hidden">
              {/* Thread List */}
              <div className="divide-y divide-[rgba(255,255,255,0.08)] max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="p-16 text-center">
                    <MailOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-6" />
                    <p className="text-lg text-muted-foreground font-medium">
                      {searchQuery ? "No emails found matching your search" : `No emails in ${filters.find(f => f.id === selectedFilter)?.label}`}
                    </p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleThreadClick(thread)}
                      className={cn(
                        "p-6 hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200 cursor-pointer group relative border-b border-[rgba(255,255,255,0.08)] last:border-0",
                        !thread.isRead && "bg-[rgba(124,58,237,0.05)]",
                        selectedThread?.id === thread.id && "bg-[rgba(124,58,237,0.1)] border-l-4 border-l-[#7C3AED]"
                      )}
                    >
                      <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9333EA] to-[#EC4899] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg shadow-[#9333EA]/30">
                          {thread.from.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <h4 className={cn(
                                "text-base font-bold text-foreground truncate",
                                !thread.isRead && "text-[#9333EA]"
                              )}>
                                {thread.from.name}
                                {thread.company && (
                                  <span className="text-muted-foreground/70 font-normal ml-2 text-sm">
                                    • {thread.company}
                                  </span>
                                )}
                              </h4>
                              {thread.isImportant && (
                                <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
                              )}
                              {thread.hasAIDraft && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[rgba(147,51,234,0.15)] text-[#9333EA] border border-[rgba(147,51,234,0.2)] shrink-0">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  AI Draft
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm text-muted-foreground/70 whitespace-nowrap font-medium">
                                {thread.timestamp}
                              </span>
                              {thread.hasAttachment && (
                                <Paperclip className="w-4 h-4 text-muted-foreground/60" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <p className={cn(
                              "text-base text-foreground line-clamp-1 flex-1 font-semibold",
                              !thread.isRead && "text-foreground"
                            )}>
                              {thread.subject}
                            </p>
                            {thread.emailCount > 1 && (
                              <span className="text-xs font-bold text-muted-foreground bg-[rgba(255,255,255,0.1)] px-2.5 py-1 rounded-full shrink-0 border border-[rgba(255,255,255,0.12)]">
                                {thread.emailCount}
                              </span>
                            )}
                          </div>

                          {thread.preview && (
                            <p className="text-sm text-muted-foreground/80 line-clamp-1 mb-3 leading-relaxed">
                              {thread.preview}
                            </p>
                          )}

                          {/* Tags and Actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {thread.tags?.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.08)] text-muted-foreground border border-[rgba(255,255,255,0.12)]"
                                >
                                  {tag}
                                </span>
                              ))}
                              {thread.aiSuggestion && (
                                <span className="text-xs font-semibold text-[#7C3AED] flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  {thread.aiSuggestion}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleToggleStar(thread.id, e)}
                            className={cn(
                              "p-2 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-110",
                              thread.isStarred && "text-[#FBBF24] bg-[rgba(251,191,36,0.1)]"
                            )}
                            title={thread.isStarred ? "Unstar" : "Star"}
                          >
                            <Star className={cn("w-5 h-5", thread.isStarred && "fill-current")} />
                          </button>
                          <button
                            onClick={(e) => handleToggleImportant(thread.id, e)}
                            className={cn(
                              "p-2 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-110",
                              thread.isImportant && "text-[#EF4444] bg-[rgba(239,68,68,0.1)]"
                            )}
                            title={thread.isImportant ? "Remove important" : "Mark important"}
                          >
                            <AlertCircle className={cn("w-5 h-5", thread.isImportant && "fill-current")} />
                          </button>
                          <button
                            onClick={(e) => handleArchive(thread.id, e)}
                            className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-110 text-muted-foreground/60 hover:text-foreground"
                            title={thread.status === "archived" ? "Unarchive" : "Archive"}
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!thread.isRead && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-[#7C3AED] rounded-r-full shadow-lg shadow-[#7C3AED]/50" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Thread Detail Panel */}
      {selectedThread && (
        <EmailThreadDetailPanel
          isOpen={isDetailPanelOpen}
          onClose={() => {
            setIsDetailPanelOpen(false);
            setSelectedThread(null);
          }}
          thread={selectedThread}
        />
      )}

      {/* Overlay when panel is open */}
      {isDetailPanelOpen && (
        <div 
          className="fixed inset-0 bg-foreground/10 z-40"
          onClick={() => {
            setIsDetailPanelOpen(false);
            setSelectedThread(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default Inbox;



