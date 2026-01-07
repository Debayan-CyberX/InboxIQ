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

interface Action {
  id: string;
  type: "follow-up" | "reply" | "meeting";
  company: string;
  subject: string;
  reason: string;
  priority: "high" | "medium" | "low";
  hasAIDraft: boolean;
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
    <div className="card-elevated animate-fade-in animation-delay-300 max-w-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-start sm:items-center justify-between gap-3">
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
      <div className="divide-y divide-border">
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={cn(
              "p-4 border-l-4 transition-colors hover:bg-muted/30",
              priorityStyles[action.priority]
            )}
            style={{ animationDelay: `${index * 50}ms` }}
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
                  <span className="hidden sm:inline">Review & Send</span>
                  <span className="sm:hidden">Review</span>
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
