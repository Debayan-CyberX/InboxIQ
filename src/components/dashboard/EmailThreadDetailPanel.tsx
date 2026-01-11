import { useState, useEffect } from "react";
import { X, Mail, Reply, Forward, Archive, Star, AlertCircle, Clock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { emailsApi } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import type { EmailThread as DBEmailThread, Email } from "@/types/database";
import EmailComposeDialog from "./EmailComposeDialog";
import { AIClassificationBadge } from "./AIClassificationBadge";
import { motion } from "framer-motion";

interface EmailThreadDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  thread: DBEmailThread & { lead_company?: string; lead_contact_name?: string; lead_email?: string } | null;
}

const EmailThreadDetailPanel = ({ isOpen, onClose, thread }: EmailThreadDetailPanelProps) => {
  const userId = useUserId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "forward" | "new">("new");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    if (isOpen && thread && userId) {
      fetchThreadEmails();
      setIsArchived(thread.status === "archived");
    } else {
      setEmails([]);
      setError(null);
      setIsComposeOpen(false);
      setSelectedEmail(null);
    }
  }, [isOpen, thread?.id, userId, thread?.status]);

  const fetchThreadEmails = async () => {
    if (!thread || !userId) return;

    try {
      setLoading(true);
      setError(null);
      const threadEmails = await emailsApi.getThreadEmails(thread.id, userId);
      setEmails(threadEmails);
    } catch (err) {
      console.error("Error fetching thread emails:", err);
      setError(err instanceof Error ? err : new Error("Failed to load emails"));
      toast.error("Failed to load emails", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (email: Email) => {
    setSelectedEmail(email);
    setComposeMode("reply");
    setIsComposeOpen(true);
  };

  const handleForward = (email: Email) => {
    setSelectedEmail(email);
    setComposeMode("forward");
    setIsComposeOpen(true);
  };

  const handleArchive = async () => {
    if (!thread || !userId) return;

    try {
      const newStatus = isArchived ? "active" : "archived";
      await emailsApi.archiveThread(thread.id, userId);
      setIsArchived(!isArchived);
      toast.success(newStatus === "archived" ? "Thread archived" : "Thread unarchived");
      
      // Refresh thread list by calling onClose and letting parent refresh
      // The parent component should refetch threads
    } catch (error) {
      console.error("Error archiving thread:", error);
      toast.error("Failed to archive thread", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleStar = () => {
    // TODO: Implement star functionality when database field is added
    setIsStarred(!isStarred);
    toast.success(isStarred ? "Removed star" : "Starred");
  };

  const handleComposeSent = () => {
    // Refetch emails after sending
    fetchThreadEmails();
  };

  if (!isOpen || !thread) return null;

  const contactName = thread.lead_contact_name || "Unknown";
  const contactEmail = thread.lead_email || "";
  const company = thread.lead_company || "";
  const latestEmail = emails.length > 0 ? emails[0] : null;

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-card border-l border-border shadow-xl z-50 animate-slide-in flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Mail className="w-4 h-4 text-accent shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{thread.subject}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {contactName}
              {company && ` • ${company}`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8">
            <LoadingState message="Loading emails..." />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState error={error} onRetry={fetchThreadEmails} />
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No emails found in this thread</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* AI Insight Card - Show for latest incoming email with AI classification */}
            {(() => {
              // Find latest incoming email with AI classification
              const latestEmailWithAI = emails.find(
                (email) =>
                  (email.direction === "inbound" || email.direction === "incoming") &&
                  email.ai_category
              );
              
              if (!latestEmailWithAI || !latestEmailWithAI.ai_category) return null;
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="p-4 m-4 rounded-xl border-2 border-accent/20 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)",
                    backdropFilter: "blur(24px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(147, 51, 234, 0.1)"
                  }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-purple-500/8 to-transparent pointer-events-none opacity-60" />
                  <motion.div
                    className="absolute top-0 right-0 w-64 h-64 bg-accent/12 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <div className="relative flex items-start gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className="relative p-3 rounded-xl bg-gradient-to-br from-accent/35 via-accent/25 to-accent/15 border-2 border-accent/40 shrink-0 shadow-lg shadow-accent/30"
                    >
                      <Sparkles className="w-5 h-5 text-accent drop-shadow-[0_0_20px_rgba(124,58,237,0.9)]" />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-foreground tracking-tight">
                          AI Insight
                        </h3>
                        <AIClassificationBadge
                          category={latestEmailWithAI.ai_category}
                          confidence={latestEmailWithAI.ai_confidence}
                          reason={latestEmailWithAI.ai_reason}
                          size="sm"
                        />
                      </div>
                      
                      {latestEmailWithAI.ai_reason && (
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          {latestEmailWithAI.ai_reason}
                        </p>
                      )}
                      
                      {latestEmailWithAI.ai_confidence !== null && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            Confidence: {(latestEmailWithAI.ai_confidence * 100).toFixed(0)}%
                          </span>
                          <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${latestEmailWithAI.ai_confidence * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                latestEmailWithAI.ai_confidence > 0.8
                                  ? "bg-[#10B981]"
                                  : latestEmailWithAI.ai_confidence > 0.5
                                  ? "bg-[#F59E0B]"
                                  : "bg-[#EF4444]"
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
            {emails.map((email, index) => {
              const isOutgoing = email.direction === "outgoing";
              const emailDate = email.received_at || email.sent_at || email.created_at;
              const emailBody = email.body_html || email.body_text || "";

              return (
                <div
                  key={email.id}
                  className={cn(
                    "p-4 hover:bg-muted/30 transition-colors",
                    isOutgoing && "bg-accent/5"
                  )}
                >
                  {/* Email Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {isOutgoing ? "You" : (contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U")}
                      </div>

                      {/* Sender Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-foreground">
                            {isOutgoing ? "You" : (() => {
                              // Try to extract name from email if contactName is Unknown
                              if (contactName === "Unknown" && email.from_email) {
                                const emailName = email.from_email.split("@")[0];
                                // Capitalize and format
                                return emailName
                                  .replace(/[._]/g, " ")
                                  .replace(/\b\w/g, l => l.toUpperCase());
                              }
                              return contactName;
                            })()}
                          </p>
                          {email.is_ai_draft && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">
                              AI Draft
                            </span>
                          )}
                          {/* AI Classification Badge */}
                          {!isOutgoing && email.ai_category && (
                            <AIClassificationBadge
                              category={email.ai_category}
                              confidence={email.ai_confidence}
                              reason={email.ai_reason}
                              size="sm"
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {isOutgoing ? email.to_email : email.from_email}
                        </p>
                        {email.cc_emails && email.cc_emails.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            CC: {email.cc_emails.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(emailDate), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="mt-3">
                    {email.body_html ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: emailBody }}
                        className="text-sm text-foreground/90 break-words prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-accent prose-strong:text-foreground prose-pre:bg-muted prose-code:text-accent"
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      />
                    ) : email.body_text ? (
                      <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                        {email.body_text}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        (No content)
                      </p>
                    )}
                  </div>

                  {/* Email Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 h-8 text-xs"
                      onClick={() => handleReply(email)}
                      disabled={isOutgoing}
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 h-8 text-xs"
                      onClick={() => handleForward(email)}
                    >
                      <Forward className="w-3 h-3" />
                      Forward
                    </Button>
                  </div>

                  {/* Email Footer */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(emailDate), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                    {email.status && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        email.status === "sent" && "bg-green-500/10 text-green-500",
                        email.status === "draft" && "bg-yellow-500/10 text-yellow-500",
                        email.status === "failed" && "bg-red-500/10 text-red-500"
                      )}>
                        {email.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 flex-1"
            onClick={() => latestEmail && handleReply(latestEmail)}
            disabled={!latestEmail || latestEmail.direction === "outgoing"}
          >
            <Reply className="w-4 h-4" />
            Reply
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 flex-1"
            onClick={() => latestEmail && handleForward(latestEmail)}
            disabled={!latestEmail}
          >
            <Forward className="w-4 h-4" />
            Forward
          </Button>
          <Button 
            variant="outline" 
            size="icon-sm"
            onClick={handleArchive}
            className={cn(isArchived && "bg-accent/10 text-accent")}
          >
            <Archive className={cn("w-4 h-4", isArchived && "fill-current")} />
          </Button>
          <Button 
            variant="outline" 
            size="icon-sm"
            onClick={handleStar}
            className={cn(isStarred && "bg-yellow-500/10 text-yellow-500")}
          >
            <Star className={cn("w-4 h-4", isStarred && "fill-current")} />
          </Button>
        </div>
      </div>

      {/* Compose Dialog */}
      <EmailComposeDialog
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setSelectedEmail(null);
        }}
        mode={composeMode}
        originalEmail={selectedEmail}
        threadId={thread.id}
        onSent={handleComposeSent}
      />
    </div>
  );
};

export default EmailThreadDetailPanel;

