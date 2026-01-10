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
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card-elevated animate-fade-in animation-delay-300 max-w-full overflow-visible relative border-2 border-accent/25"
      style={{ 
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(147, 51, 234, 0.06) 100%)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(147, 51, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(147, 51, 234, 0.12)"
      }}
    >
      {/* Futuristic animated background */}
      <motion.div
        className="absolute top-0 right-0 w-64 h-64 bg-accent/12 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-accent/40 pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-accent/30 flex items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-accent/12 via-accent/5 to-transparent backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.15, rotate: 10 }}
              className="relative p-2 rounded-xl bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10 border-2 border-accent/40 shadow-lg shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-transparent rounded-xl opacity-50" />
              <Sparkles className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 text-accent shrink-0 drop-shadow-[0_0_16px_rgba(124,58,237,0.8)]" />
            </motion.div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Action Queue</span>
          </h2>
          <p className="text-sm text-muted-foreground/90 mt-1.5 font-medium">
            AI-prioritized tasks for today
          </p>
        </div>
        <motion.span
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-xs sm:text-sm font-bold text-accent bg-accent/20 border-2 border-accent/30 px-3 sm:px-4 py-2 rounded-full shrink-0 shadow-lg backdrop-blur-sm whitespace-nowrap"
        >
          {actions.length} pending
        </motion.span>
      </div>

      {/* Actions list */}
      {actions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
          className="p-14 sm:p-20 text-center relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-56 h-56 bg-accent/12 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="w-32 h-32 bg-purple-500/8 rounded-full blur-2xl absolute"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent/40 via-accent/25 to-accent/15 border-2 border-accent/40 mb-8 shadow-2xl shadow-accent/30 relative overflow-hidden"
            >
              {/* Rotating gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-accent/50 to-purple-500/30"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ transformOrigin: "center" }}
              />
              <Sparkles className="relative z-10 w-10 h-10 text-accent drop-shadow-[0_0_24px_rgba(124,58,237,0.9)]" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              You're all caught up 🎉
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground/95 max-w-sm mx-auto leading-relaxed font-medium">
              InboxIQ will suggest actions as emails arrive
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="divide-y divide-border">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: index * 0.08, duration: 0.5, type: "spring", stiffness: 200 }}
              whileHover={{ 
                x: 6, 
                scale: 1.02,
                transition: { duration: 0.2, type: "spring", stiffness: 300 }
              }}
              className={cn(
                "relative p-4 sm:p-5 border-l-4 transition-all duration-300 hover:bg-muted/60 rounded-r-2xl group border-r border-r-transparent hover:border-r-accent/30 overflow-visible",
                priorityStyles[action.priority]
              )}
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)",
                backdropFilter: "blur(8px)"
              }}
            >
              {/* Futuristic gradient on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-accent/8 via-accent/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-r-2xl"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              />
              {/* Animated border glow */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-r-2xl border-r-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300",
                  action.priority === "high" && "border-r-[#EF4444]/40",
                  action.priority === "medium" && "border-r-[#F59E0B]/40",
                  "border-r-accent/40"
                )}
                animate={{
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Mobile-first layout */}
              <div className="relative flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-bold text-foreground text-base sm:text-lg break-words min-w-0 flex-1">
                      {action.company}
                    </h4>

                    {action.hasAIDraft && (
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-accent/20 to-accent/10 border-2 border-accent/30 text-accent shrink-0 shadow-lg backdrop-blur-sm whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0 drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                        AI Draft
                      </motion.span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-foreground/98 break-words font-semibold leading-relaxed min-h-[2.5rem]">
                    {action.subject}
                  </p>

                  <p className="text-xs sm:text-sm text-muted-foreground/95 flex items-start gap-2 leading-relaxed">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-accent/60 flex-shrink-0" />
                    <span className="break-words font-medium flex-1 min-w-0">
                      {action.reason}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-1.5 shrink-0 flex-shrink-0">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => onReviewSend?.(action)}
                      className="gap-2 whitespace-nowrap font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">
                        {action.type === "follow-up" || action.type === "followup" 
                          ? "View Lead" 
                          : "Review & Send"}
                      </span>
                      <span className="sm:hidden">
                        {action.type === "follow-up" || action.type === "followup" ? "View" : "Review"}
                      </span>
                    </Button>
                  </motion.div>

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
    </motion.div>
  );
};

export default ActionQueue;
