import {
  ArrowUpRight,
  CheckCheck,
  Clock,
  Pencil,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
export interface Action {
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
export default function ActionQueue({
  actions,
  onReviewSend,
  onEdit,
  onSkip,
}: ActionQueueProps) {
  return (
    <section className="card-elevated overflow-hidden h-full">
      <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-5">
        <div>
          <h2 className="iq-section-heading">Your next steps</h2>
          <p className="text-[10px] text-muted-foreground mt-1">
            A little momentum, one action at a time.
          </p>
        </div>
        <span className="text-[9px] px-2 py-1 border border-white/[.08] bg-white/[.02] rounded-md text-muted-foreground">
          {actions.length} pending
        </span>
      </div>
      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-7 min-h-[220px]">
          <span className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-primary/[.06] text-primary mb-4">
            <CheckCheck size={19} strokeWidth={1.5} />
          </span>
          <h3 className="text-[13px] font-medium tracking-normal">
            A little breathing room.
          </h3>
          <p className="text-[11px] text-muted-foreground mt-2 max-w-[210px] leading-relaxed">
            Your next steps will appear here as your conversations develop.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[.05]">
          {actions.map((action) => (
            <article key={action.id} className="p-5">
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-3">
                <span
                  className="w-1 h-1 rounded-full"
                  style={{
                    background:
                      action.priority === "high"
                        ? "#dda08b"
                        : action.priority === "medium"
                          ? "#ccb17d"
                          : "#a28abd",
                  }}
                />
                {action.company}
                <span className="ml-auto flex gap-1 items-center">
                  <Clock size={10} />
                  {action.priority} priority
                </span>
              </div>
              <h3 className="text-xs font-medium tracking-normal leading-relaxed">
                {action.subject}
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                {action.reason}
              </p>
              <div className="flex gap-2 items-center mt-4">
                {onReviewSend && (
                  <Button
                    variant="soft-accent"
                    size="sm"
                    onClick={() => onReviewSend(action)}
                    className="text-[10px]"
                  >
                    {action.hasAIDraft ? "Review draft" : "Take the next step"}
                    <ArrowUpRight size={12} />
                  </Button>
                )}
                {onEdit && (
                  <button
                    className="p-2 text-muted-foreground"
                    aria-label={`Edit ${action.subject}`}
                    onClick={() => onEdit(action)}
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {onSkip && (
                  <button
                    className="p-2 text-muted-foreground"
                    aria-label={`Skip ${action.subject}`}
                    onClick={() => onSkip(action)}
                  >
                    <SkipForward size={12} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
