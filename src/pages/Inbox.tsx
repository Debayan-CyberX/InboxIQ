import { useState, useMemo, useEffect } from "react";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredThreads.length} {filteredThreads.length === 1 ? "conversation" : "conversations"}
              {selectedFilter !== "all" && ` in ${filters.find(f => f.id === selectedFilter)?.label}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="accent" size="sm" className="gap-2">
              <Mail className="w-4 h-4" />
              Compose
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="col-span-3 space-y-4">
            {/* Search */}
            <div className="card-elevated p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="card-elevated p-2">
              <div className="space-y-1">
                {filters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                        selectedFilter === filter.id
                          ? "bg-accent/10 text-accent"
                          : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{filter.label}</span>
                      </div>
                      {filter.count > 0 && (
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          selectedFilter === filter.id
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
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
            <div className="card-elevated">
              {/* Thread List */}
              <div className="divide-y divide-border max-h-[calc(100vh-250px)] overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="p-12 text-center">
                    <MailOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No emails found matching your search" : `No emails in ${filters.find(f => f.id === selectedFilter)?.label}`}
                    </p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => handleThreadClick(thread)}
                      className={cn(
                        "p-4 hover:bg-muted/30 transition-colors cursor-pointer group relative",
                        !thread.isRead && "bg-accent/5",
                        selectedThread?.id === thread.id && "bg-accent/10 border-l-4 border-l-accent"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {thread.from.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h4 className={cn(
                                "font-semibold text-foreground truncate",
                                !thread.isRead && "font-bold"
                              )}>
                                {thread.from.name}
                                {thread.company && (
                                  <span className="text-muted-foreground font-normal ml-2">
                                    • {thread.company}
                                  </span>
                                )}
                              </h4>
                              {thread.isImportant && (
                                <AlertCircle className="w-4 h-4 text-status-hot shrink-0" />
                              )}
                              {thread.hasAIDraft && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent shrink-0">
                                  <Sparkles className="w-3 h-3" />
                                  AI Draft
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {thread.timestamp}
                              </span>
                              {thread.hasAttachment && (
                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <p className={cn(
                              "text-sm text-foreground/90 line-clamp-1 flex-1",
                              !thread.isRead && "font-medium"
                            )}>
                              {thread.subject}
                            </p>
                            {thread.emailCount > 1 && (
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                                {thread.emailCount}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {thread.preview}
                          </p>

                          {/* Tags and Actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {thread.tags?.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                              {thread.aiSuggestion && (
                                <span className="text-xs text-accent flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  {thread.aiSuggestion}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleToggleStar(thread.id, e)}
                            className={cn(
                              "p-1.5 rounded hover:bg-muted transition-colors",
                              thread.isStarred && "text-yellow-400"
                            )}
                            title={thread.isStarred ? "Unstar" : "Star"}
                          >
                            <Star className={cn("w-4 h-4", thread.isStarred && "fill-current")} />
                          </button>
                          <button
                            onClick={(e) => handleToggleImportant(thread.id, e)}
                            className={cn(
                              "p-1.5 rounded hover:bg-muted transition-colors",
                              thread.isImportant && "text-status-hot"
                            )}
                            title={thread.isImportant ? "Remove important" : "Mark important"}
                          >
                            <AlertCircle className={cn("w-4 h-4", thread.isImportant && "fill-current")} />
                          </button>
                          <button
                            onClick={(e) => handleArchive(thread.id, e)}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title={thread.status === "archived" ? "Unarchive" : "Archive"}
                          >
                            <Archive className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!thread.isRead && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-accent rounded-r-full" />
                      )}
                    </div>
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



