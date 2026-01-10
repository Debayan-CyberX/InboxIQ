import {
  Send,
  Edit3,
  SkipForward,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Action {
  id: string;
  type: "follow-up" | "reply" | "meeting" | "followup" | "review" | "send";
  company: string;
  subject: string;
  reason: string;
  priority: "high" | "medium" | "low";
  hasAIDraft?: boolean;
  leadId?: string;
  emailId?: string;
}

interface ActionQueueProps {
  actions: Action[];
  onReviewSend?: (action: Action) => void;
  onEdit?: (action: Action) => void;
  onSkip?: (action: Action) => void;
}

const ActionQueue = ({
  actions,
  onReviewSend,
  onEdit,
  onSkip,
}: ActionQueueProps) => {
  const priorityStyles = {
    high: "border-l-status-hot",
    medium: "border-l-status-warm",
    low: "border-l-border",
  };

  return (
    <div className="card-elevated animate-fade-in animation-delay-300 max-w-full overflow-hidden relative">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-border/50 flex items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-accent/5 via-transparent to-transparent">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            Action Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-prioritized tasks for today
          </p>
        </div>
        <span className="text-xs font-medium text-accent bg-accent/10 px-2.5 py-1 rounded-full shrink-0">
          {actions.length} pending
        </span>
      </div>

      {/* Actions list */}
      {actions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="p-10 sm:p-14 text-center relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 mb-5 shadow-lg shadow-accent/10"
            >
              <Sparkles className="w-7 h-7 text-accent" />
            </motion.div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              You're all caught up 🎉
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              InboxIQ will suggest actions as emails arrive
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="divide-y divide-border">
          {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
            className={cn(
              "p-4 sm:p-5 border-l-4 transition-all duration-200 hover:bg-muted/40 rounded-r-lg group",
              priorityStyles[action.priority]
            )}
          >
            {/* Mobile-first layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-foreground truncate">
                    {action.company}
                  </h4>

                  {action.hasAIDraft && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent shrink-0">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      AI Draft
                    </span>
                  )}
                </div>

                <p className="text-sm text-foreground/90 line-clamp-2 break-words">
                  {action.subject}
                </p>

                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Clock className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 break-words">
                    {action.reason}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-1.5 shrink-0">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => onReviewSend?.(action)}
                  className="gap-1.5 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">
                    {action.type === "follow-up" || action.type === "followup" 
                      ? "View Lead" 
                      : "Review & Send"}
                  </span>
                  <span className="sm:hidden">
                    {action.type === "follow-up" || action.type === "followup" ? "View" : "Review"}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit?.(action)}
                  className="shrink-0"
                  aria-label="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onSkip?.(action)}
                  className="shrink-0"
                  aria-label="Skip"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Footer */}
      {actions.length > 3 && (
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
          >
            View all {actions.length} actions
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActionQueue;
