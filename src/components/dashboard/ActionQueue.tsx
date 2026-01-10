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
      {/* Enhanced background accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-border/50 flex items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-accent/8 via-accent/3 to-transparent">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/20 border border-accent/30">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0 drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
            </div>
            Action Queue
          </h2>
          <p className="text-sm text-muted-foreground/90 mt-1">
            AI-prioritized tasks for today
          </p>
        </div>
        <span className="text-xs sm:text-sm font-semibold text-accent bg-accent/15 border border-accent/20 px-3 py-1.5 rounded-full shrink-0 shadow-sm">
          {actions.length} pending
        </span>
      </div>

      {/* Actions list */}
      {actions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="p-12 sm:p-16 text-center relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 bg-accent/8 rounded-full blur-3xl" />
            <div className="w-24 h-24 bg-purple-500/5 rounded-full blur-2xl absolute" />
          </div>
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [0, 8, -8, 0]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 2.5
              }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10 border-2 border-accent/30 mb-6 shadow-xl shadow-accent/20"
            >
              <Sparkles className="w-8 h-8 text-accent drop-shadow-[0_0_12px_rgba(124,58,237,0.7)]" />
            </motion.div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">
              You're all caught up 🎉
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground/90 max-w-sm mx-auto leading-relaxed">
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
                "p-4 sm:p-5 border-l-4 transition-all duration-200 hover:bg-muted/50 rounded-r-lg group border-r border-r-transparent hover:border-r-border/20",
                priorityStyles[action.priority]
              )}
            >
              {/* Subtle gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-r-lg" />
              {/* Mobile-first layout */}
              <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground truncate text-base">
                      {action.company}
                    </h4>

                    {action.hasAIDraft && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-accent/15 border border-accent/20 text-accent shrink-0 shadow-sm">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        AI Draft
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-foreground/95 line-clamp-2 break-words font-medium">
                    {action.subject}
                  </p>

                  <p className="text-xs sm:text-sm text-muted-foreground/90 flex items-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
            </motion.div>
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
